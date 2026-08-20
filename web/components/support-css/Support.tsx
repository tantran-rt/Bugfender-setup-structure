"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useAtom } from "jotai";
import { Button } from "@/ui-css/button";
import { X, ChevronLeft, MonitorX, MessageSquare } from "lucide-react";
import { useSelector } from "react-redux";
import { authToken } from "@/redux/slices/auth";
import {
  isCallActiveAtom,
  endCallAtom,
  callConfigAtom,
  callStateAtom,
} from "@/lib/store/call-store";
import { DailyProvider, DailyAudio } from "@daily-co/daily-react";
import { ModernCallComponent } from "../DailyCall/ModernCallComponent";
import NewQueryComponent from "./NewQueryComponent";
import ChatComponent from "./ChatComponent";
import QueryHistoryComponent from "./QueryHistoryComponent";
import { useCallManager } from "../DailyCall/useCallManager";
import "./support-button.css";
import { Ticket } from "@/lib/api";
import { toast } from "sonner";
import { CallMode } from "@/types/communication";
import { io, Socket } from "socket.io-client";

// Add type declaration for the DailyIframe global variable
declare global {
  interface Window {
    DailyIframe?: any;
  }
}

export type SupportView =
  | "history"
  | "initial"
  | "chat"
  | "call"
  | "call-with-chat";

export function Support() {
  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<SupportView>("history");
  const [isScreenBeingShared, setIsScreenBeingShared] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  // Add socket state here
  const [socket, setSocket] = useState<Socket | null>(null);

  // Data state
  const [selectedQuery, setSelectedQuery] = useState<Ticket | null>(null);

  // Call-related state
  const [isCallActive] = useAtom(isCallActiveAtom);
  const [, endCall] = useAtom(endCallAtom);
  const [callConfigState] = useAtom(callConfigAtom);
  const [callState] = useAtom(callStateAtom);

  // Auth data from Redux store
  const auth = useSelector(authToken);

  // Call management through our hook
  const { isJoiningCall, callError, handleEndCall } = useCallManager();

  // Track if the Daily.co API library is loaded properly
  const [isDailyApiLoaded, setIsDailyApiLoaded] = useState<boolean>(false);
  const [isLoadingDaily, setIsLoadingDaily] = useState<boolean>(false);

  // Track if the room URL is valid and accessible
  const [isRoomUrlValid] = useState<boolean | null>(null);

  // Add additional error tracking for DailyProvider
  const [dailyProviderError, setDailyProviderError] = useState<string | null>(
    null
  );

  // Create a wrapper for setView to handle type conversion
  const handleViewChange = useCallback((newView: string) => {
    setView(newView as SupportView);
  }, []);

  // Move getDonorId inside the component
  const getDonorId = useCallback(() => {
    // Return participant_id from auth if available, otherwise fallback to "anonymous"
    return auth?.participant_id ? auth.participant_id.toString() : "anonymous";
  }, [auth]);

  // Define backend URL (similar to ChatComponent)
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5005";

  // Initialize socket for message notifications
  useEffect(() => {
    if (!isOpen || !selectedQuery?.id || !getDonorId()) return;

    // Initialize Socket.IO connection
    const newSocket = io(backendUrl, {
      path: "/socket",
      withCredentials: true,
      autoConnect: true,
    });

    setSocket(newSocket);

    // Connect event
    newSocket.on("connect", () => {
      // Join the ticket room
      newSocket.emit("joinTicketRoom", {
        ticketId: selectedQuery.id,
        donorId: getDonorId(),
      });
    });

    // Handle new text messages - update notification state
    newSocket.on("newTextMessage", (message: any) => {
      if (
        message.ticketId === selectedQuery.id &&
        message.senderType === "admin"
      ) {
        // Only show notification indicator when chat is not visible
        if (!showChatPanel && (view === "call" || view === "call-with-chat")) {
          setHasNewMessages(true);
        }
      }
    });

    // Cleanup socket on unmount
    return () => {
      if (newSocket) {
        newSocket.off("connect");
        newSocket.off("newTextMessage");
        newSocket.disconnect();
      }
    };
  }, [isOpen, selectedQuery?.id, getDonorId, showChatPanel, view]);

  // Effect to sync view with call state
  useEffect(() => {
    if (isCallActive && view !== "call" && view !== "call-with-chat") {
      setView("call");
      setShowChatPanel(false);
    } else if (
      !isCallActive &&
      (view === "call" || view === "call-with-chat")
    ) {
      setView("chat");
      setShowChatPanel(false);
    }
  }, [isCallActive, view]);

  // Effect to handle screen sharing state changes
  useEffect(() => {
    // If screen sharing starts and chat panel is visible, hide it
    if (isScreenBeingShared && showChatPanel) {
      setShowChatPanel(false);
    }
  }, [isScreenBeingShared, showChatPanel]);

  // Clean up calls when component unmounts
  useEffect(() => {
    return () => {
      if (isCallActive) {
        endCall();
      }
    };
  }, [isCallActive, endCall]);

  // Handle back button functionality
  const handleBack = () => {
    if (view === "call") {
      handleEndCall(handleViewChange);
    } else if (view === "call-with-chat") {
      setShowChatPanel(false);
    } else if (view === "chat") {
      setView("history");
      setSelectedQuery(null);
    } else if (view === "initial") {
      setView("history");
    }
  };

  // Toggle chat panel during call without changing the base view
  const toggleChatDuringCall = () => {
    // If opening chat, clear new message indicator
    if (!showChatPanel) {
      setHasNewMessages(false);
    }
    setShowChatPanel(!showChatPanel);
  };

  // Listen for support:close event from the call component
  useEffect(() => {
    const handleSupportClose = () => {
      setIsOpen(false);
    };

    window.addEventListener("support:close", handleSupportClose);

    return () => {
      window.removeEventListener("support:close", handleSupportClose);
    };
  }, []);

  // Function to load Daily.co script dynamically
  const loadDailyScript = useCallback(() => {
    if (typeof window !== "undefined") {
      // Don't reload if script is already loading or loaded
      if (isLoadingDaily || window.DailyIframe) {
        return;
      }

      setIsLoadingDaily(true);

      // Create script element
      const script = document.createElement("script");
      script.src = "https://unpkg.com/@daily-co/daily-js";
      script.async = true;
      script.crossOrigin = "anonymous";

      // Add onload and onerror handlers
      script.onload = () => {
        setIsDailyApiLoaded(true);
        setIsLoadingDaily(false);

        // Force a re-render to make sure components that depend on isDailyApiLoaded update
        setTimeout(() => {
          if (window.DailyIframe) {
            setIsDailyApiLoaded(true);
          }
        }, 100);
      };

      script.onerror = (error) => {
        console.error("Error loading Daily.co script:", error);
        setIsLoadingDaily(false);

        // Try using a different CDN or version if the script fails to load
        const fallbackScript = document.createElement("script");
        fallbackScript.src =
          "https://cdn.jsdelivr.net/npm/@daily-co/daily-js@0.50.0/dist/daily-iframe.min.js";
        fallbackScript.async = true;
        fallbackScript.crossOrigin = "anonymous";

        fallbackScript.onload = () => {
          setIsDailyApiLoaded(true);
          setIsLoadingDaily(false);
        };

        fallbackScript.onerror = () => {
          console.error("Error loading Daily.co fallback script");
          setIsLoadingDaily(false);
        };

        document.body.appendChild(fallbackScript);
      };

      // Add to document
      document.body.appendChild(script);

      return () => {
        // Clean up on unmount if needed
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, [isLoadingDaily]);

  // Check if Daily.co API is loaded
  useEffect(() => {
    // If window is not defined yet, return (SSR protection)
    if (typeof window === "undefined") {
      return;
    }

    // Check if Daily.co API is already available
    if (window.DailyIframe) {
      setIsDailyApiLoaded(true);
      return;
    }

    // If not loaded, attempt to load it
    loadDailyScript();

    // Also set up a check interval as backup
    const checkInterval = setInterval(() => {
      if (window.DailyIframe) {
        setIsDailyApiLoaded(true);
        clearInterval(checkInterval);
      }
    }, 1000);

    // Clear interval after 20 seconds to prevent memory leaks
    const timeoutId = setTimeout(() => {
      if (!window.DailyIframe) {
        console.error(
          "Daily.co API failed to load after timeout - attempting reload"
        );
        clearInterval(checkInterval);

        // Try loading the script again
        loadDailyScript();
      }
    }, 20000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeoutId);
    };
  }, [loadDailyScript]);

  // Handle provider errors
  const handleDailyProviderError = (error: any) => {
    console.error("Daily Provider error:", error);
    let errorMessage = "Failed to initialize call provider";

    if (error) {
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.toString && typeof error.toString === "function") {
        errorMessage = error.toString();
      }
    }

    setDailyProviderError(errorMessage);
    toast.error(`Call error: ${errorMessage}`);
  };

  // Create the DailyProvider component for calls
  const dailyProviderComponent = useMemo(() => {
    // Return null if no call config is available
    if (!callConfigState) {
      return null;
    }

    try {
      // Create the component with error handling
      return (
        <DailyProvider
          url={callConfigState.url}
          token={callConfigState.token}
          key={`daily-provider-${callConfigState.url}`}
        >
          <DailyAudio />
          {isJoiningCall ? (
            <div className="support-panel__call-joining">
              <div className="support-panel__call-joining-content">
                <div className="support-panel__call-joining-spinner"></div>
                <p>Joining call...</p>
              </div>
            </div>
          ) : callError ? (
            <div className="support-panel__call-error">
              <div className="support-panel__call-error-content">
                <div className="support-panel__call-error-message">
                  <p className="support-panel__call-error-title">
                    Error joining call
                  </p>
                  <p className="support-panel__call-error-text">{callError}</p>
                </div>
                <Button
                  variant="outline"
                  className="support-panel__call-error-button"
                  onClick={() => {
                    setView("chat");
                  }}
                >
                  Return to Chat
                </Button>
              </div>
            </div>
          ) : (
            <ModernCallComponent
              onEndCall={() => handleEndCall(handleViewChange)}
              onViewChange={handleViewChange}
              selectedQueryId={
                selectedQuery?.id ? Number(selectedQuery.id) : undefined
              }
              donorId={Number(getDonorId())}
              onScreenShareChange={setIsScreenBeingShared}
              callType={callState?.mode === CallMode.VIDEO ? "video" : "audio"}
              hasNewMessages={hasNewMessages}
              onChatButtonClick={toggleChatDuringCall}
              activeCallId={
                selectedQuery?.activeCallId || callState?.roomName || undefined
              }
            />
          )}
        </DailyProvider>
      );
    } catch (err) {
      console.error("Error creating DailyProvider:", err);
      handleDailyProviderError(err);
      return null;
    }
  }, [
    callConfigState,
    isJoiningCall,
    callError,
    handleEndCall,
    handleViewChange,
    selectedQuery,
    getDonorId,
    callState,
    hasNewMessages,
  ]);

  // Listen for global errors that might be related to Daily.co
  useEffect(() => {
    if ((view === "call" || showChatPanel) && callConfigState) {
      // Setup error listener for Daily.co related errors
      const handleWindowError = (event: ErrorEvent) => {
        // Check if error is related to Daily.co
        if (
          event.message?.includes("daily") ||
          event.message?.includes("iframe") ||
          event.message?.includes("video") ||
          event.filename?.includes("daily")
        ) {
          console.error("Caught Daily.co related error:", event);
          handleDailyProviderError(
            event.message || "Video call initialization error"
          );
          event.preventDefault(); // Prevent default error handling
        }
      };

      // Add error listener
      window.addEventListener("error", handleWindowError);

      // Clean up listener
      return () => {
        window.removeEventListener("error", handleWindowError);
      };
    }
  }, [view, callConfigState, showChatPanel]);

  // Determine if we're in a call view (either call-only or call-with-chat)
  const isInCallView =
    isCallActive &&
    (view === "call" || view === "call-with-chat" || showChatPanel);

  // Function to handle new messages
  const handleNewMessage = useCallback(() => {
    if (!showChatPanel) {
      setHasNewMessages(true);
    }
  }, [showChatPanel]);

  // Reset new message indicator when chat is shown
  useEffect(() => {
    if (showChatPanel) {
      setHasNewMessages(false);
    }
  }, [showChatPanel]);

  return (
    <>
      {/* Floating support button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="support-button"
          aria-label="Open support chat"
        >
          <img
            src={"/icons/concierge.svg"}
            alt="Support"
            className="support-button__icon"
            style={{ zIndex: 999, height: "2.5rem", width: "2.5rem" }}
          />
          <span className="support-button__pulse"></span>
        </Button>
      )}

      {/* Support panel */}
      {isOpen && (
        <div
          className={`support-panel ${
            isScreenBeingShared && isInCallView
              ? "support-panel--screen-sharing"
              : ""
          } ${
            showChatPanel && !isScreenBeingShared
              ? "support-panel--call-with-chat"
              : ""
          }`}
          style={{ zIndex: 1000 }}
        >
          {isScreenBeingShared && isInCallView && (
            <div className="support-panel__screen-sharing-indicator">
              <MonitorX className="support-panel__screen-sharing-icon" />
              <span>Screen sharing active</span>
            </div>
          )}
          {/* Header */}
          <div className="support-panel__header">
            <div className="support-panel__header-content">
              {(view === "chat" || view === "initial" || showChatPanel) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="support-panel__back-button"
                  onClick={handleBack}
                  aria-label="Go back"
                >
                  <ChevronLeft className="support-panel__back-icon" />
                </Button>
              )}
              <div className="support-panel__title-container">
                <h3 className="support-panel__title">
                  {view === "history"
                    ? "Support History"
                    : view === "initial"
                    ? "New Support Request"
                    : isInCallView
                    ? showChatPanel
                      ? "Call with Chat"
                      : "Call in Progress"
                    : `Query ${selectedQuery?.id}`}
                </h3>
              </div>
            </div>
            <div className="support-panel__header-actions">
              {isInCallView && !isScreenBeingShared && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="support-panel__toggle-chat-button"
                  onClick={toggleChatDuringCall}
                  aria-label={showChatPanel ? "Hide chat" : "Show chat"}
                >
                  {!showChatPanel ? (
                    <div className="support-panel__toggle-button-wrapper">
                      <MessageSquare className="support-panel__toggle-chat-icon" />
                      {hasNewMessages && (
                        <span className="support-panel__new-message-indicator"></span>
                      )}
                    </div>
                  ) : (
                    <div className="support-panel__toggle-button-wrapper">
                      <ChevronLeft className="support-panel__toggle-chat-icon" />
                      <span className="support-panel__toggle-icon-text">
                        Back to call
                      </span>
                    </div>
                  )}
                </Button>
              )}
              {!isInCallView && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="support-panel__close-button"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  aria-label="Close support panel"
                >
                  <X className="support-panel__close-icon" />
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <div
            className={`support-panel__content ${
              showChatPanel && !isScreenBeingShared
                ? "support-panel__content--split"
                : ""
            }`}
          >
            {view === "history" ? (
              <QueryHistoryComponent
                onNewQuery={() => setView("initial")}
                onSelectQuery={(query) => {
                  setSelectedQuery(query);
                  setView("chat");
                }}
              />
            ) : view === "initial" ? (
              <NewQueryComponent
                onSubmitSuccess={(query) => {
                  setSelectedQuery(query as Ticket);
                  setView("chat");
                }}
              />
            ) : isInCallView ? (
              <div
                className={`support-panel__call-wrapper ${
                  showChatPanel && !isScreenBeingShared
                    ? "support-panel__call-wrapper--with-chat"
                    : ""
                }`}
              >
                {!isDailyApiLoaded ? (
                  <div className="support-panel__call-loading">
                    <div className="support-panel__call-loading-content">
                      <div className="support-panel__call-loading-spinner"></div>
                      <p className="support-panel__call-loading-title">
                        Loading video call...
                      </p>
                      <p className="support-panel__call-loading-text">
                        Please wait while we initialize the call service
                      </p>
                      <Button
                        variant="outline"
                        className="support-panel__call-loading-button"
                        onClick={() => {
                          loadDailyScript();
                        }}
                      >
                        Retry Loading
                      </Button>
                    </div>
                  </div>
                ) : callConfigState &&
                  dailyProviderComponent &&
                  !dailyProviderError &&
                  isRoomUrlValid !== false ? (
                  dailyProviderComponent
                ) : (
                  <div className="support-panel__call-error">
                    <div className="support-panel__call-error-content">
                      <div className="support-panel__call-error-message">
                        <p className="support-panel__call-error-title">
                          Call configuration error
                        </p>
                        <p className="support-panel__call-error-text">
                          {dailyProviderError
                            ? dailyProviderError
                            : !isDailyApiLoaded
                            ? "Unable to load call provider. Please try again."
                            : isRoomUrlValid === false
                            ? "Unable to connect to call room. The room may have expired or been deleted."
                            : "Unable to initialize call. Please try again."}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="support-panel__call-error-button"
                        onClick={() => {
                          if (!isDailyApiLoaded) {
                            loadDailyScript();
                          } else {
                            setView("chat");
                          }
                        }}
                      >
                        {!isDailyApiLoaded ? "Retry Loading" : "Return to Chat"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {(view === "chat" || (showChatPanel && !isScreenBeingShared)) &&
            selectedQuery ? (
              <div
                className={`support-panel__chat-wrapper ${
                  showChatPanel ? "support-panel__chat-wrapper--with-call" : ""
                }`}
              >
                <ChatComponent
                  selectedQuery={selectedQuery}
                  setSelectedQuery={setSelectedQuery}
                  onViewChange={handleViewChange}
                  isCallActive={isCallActive}
                  showCallButtons={!showChatPanel}
                  onNewMessage={handleNewMessage}
                  hasNewMessages={hasNewMessages}
                  setHasNewMessages={setHasNewMessages}
                />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
