"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { Button } from "@/ui-css/button";
import { Avatar } from "@/ui-css/avatar";
import { Textarea } from "@/ui-css/textarea";
import { ScrollArea } from "@/ui-css/scroll-area";
import { toast } from "react-toastify";
import {
  MessageSquare,
  Check,
  CheckCircle,
  Video,
  Phone,
  X,
} from "lucide-react";
import { resolveDonorQuery, CallResponse, Ticket } from "@/lib/api";
import { useSelector } from "react-redux";
import { authToken } from "@/redux/slices/auth";
import { io, Socket } from "socket.io-client";
import { useAtom } from "jotai";
import {
  callConfigAtom,
  startCallAtom,
  isCallActiveAtom,
  callStateAtom,
} from "@/lib/store/call-store";
import { CallMode } from "@/types/communication";
import { DailyProvider, DailyAudio } from "@daily-co/daily-react";
import { ModernCallComponent } from "@/components/DailyCall/ModernCallComponent";
import { useCallManager } from "@/components/DailyCall/useCallManager";

// Define message interface based on the specified API
interface ChatMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: "donor" | "admin";
  content: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ChatComponentProps {
  selectedQuery: Ticket;
  setSelectedQuery: (query: Ticket | null) => void;
  onViewChange: (view: string) => void;
  isCallActive?: boolean;
  showCallButtons?: boolean;
  onNewMessage?: () => void;
  hasNewMessages?: boolean;
  setHasNewMessages: (hasNewMessages: boolean) => void;
}

// Define API base URL from environment or fallback
const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5005";
const API_BASE_URL = `${backendUrl}/api/v1`;

export default function ChatComponent({
  selectedQuery,
  setSelectedQuery,
  onViewChange,
  isCallActive: externalCallActive = false,
  showCallButtons = true,
  onNewMessage,
  hasNewMessages,
  setHasNewMessages,
}: ChatComponentProps) {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isJoiningCall, setIsJoiningCall] = useState(false);
  const [activeCall, setActiveCall] = useState<CallResponse | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [callViewActive, setCallViewActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get the current auth token
  const auth = useSelector(authToken);

  // Daily call state
  const [callConfig, setCallConfig] = useAtom(callConfigAtom);
  const [, startCall] = useAtom(startCallAtom);
  const [globalCallActive] = useAtom(isCallActiveAtom);
  const [, setCallState] = useAtom(callStateAtom);

  // Use the call manager
  const { handleJoinCall: joinCallManager, handleEndCall: endCallManager } =
    useCallManager();

  // Get donor ID from auth
  const getDonorId = useCallback(() => {
    return auth?.participant_id ? auth.participant_id.toString() : "anonymous";
  }, [auth]);

  // Enhanced function to get donor ID with validation
  const getValidDonorId = useCallback(() => {
    const donorId = auth?.participant_id;
    if (!donorId) {
      console.warn("Missing donor ID in auth data:", auth);
      // Return a fallback ID if needed for testing
      return process.env.NODE_ENV === "development" ? "999" : null;
    }

    return donorId.toString();
  }, [auth]);

  // Initialize socket connection
  useEffect(() => {
    // Don't connect if there's no selected query or donor ID
    if (!selectedQuery?.id || !getDonorId()) return;

    // First, fetch complete ticket details including active call
    fetchTicketDetails(selectedQuery.id, getDonorId());

    // Initialize Socket.IO connection
    const socket = io(backendUrl, {
      path: "/socket",
      withCredentials: true,
      autoConnect: true,
    });

    setSocket(socket);

    // Connect event
    socket.on("connect", () => {
      // Join the ticket room
      socket.emit("joinTicketRoom", {
        ticketId: selectedQuery.id,
        donorId: getDonorId(),
      });
    });

    // Handle new text messages
    socket.on("newTextMessage", (message: ChatMessage) => {
      if (message.ticketId === selectedQuery.id) {
        // Notify parent component of new messages if it's a message from admin
        // This happens regardless of the duplicate check, to ensure notifications work
        if (message.senderType === "admin" && onNewMessage) {
          onNewMessage();
          setHasNewMessages(true);
        }

        setMessages((prevMessages) => {
          // More robust duplicate detection
          // Check by ID and also by content/timestamp if IDs don't match
          const isDuplicate = prevMessages.some(
            (m) =>
              m.id === message.id ||
              (m.senderId === message.senderId &&
                m.content === message.content &&
                Math.abs(
                  new Date(m.createdAt).getTime() -
                    new Date(message.createdAt).getTime()
                ) < 2000)
          );

          if (!isDuplicate) {
            // Add the new message
            const updatedMessages = [...prevMessages, message];

            // Scroll to bottom when new messages arrive
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);

            return updatedMessages;
          }
          return prevMessages;
        });
      }
    });

    // Handle ticket status changes
    socket.on(
      "ticketStatusChange",
      (data: { ticketId: string; status: string }) => {
        if (data.ticketId === selectedQuery.id) {
          setSelectedQuery({
            ...selectedQuery,
            status: data.status as any,
          });
        }
      }
    );

    // Handle messages read status
    socket.on("messagesRead", (data: { ticketId: string }) => {
      if (data.ticketId === selectedQuery.id) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) => ({
            ...msg,
            isRead: true,
          }))
        );
      }
    });

    // Listen for call start events
    socket.on("activeCallStarted", (data: CallResponse) => {
      if (data.ticketId === selectedQuery.id) {
        setActiveCall(data);

        // Update the selected query with the active call ID
        setSelectedQuery({
          ...selectedQuery,
          activeCallId: data.id,
        });

        toast.success(
          `${
            data.callType === "video" ? "Video" : "Audio"
          } call is now available`
        );
      }
    });

    // Listen for call end events
    socket.on(
      "activeCallEnded",
      (data: { ticketId: string; callId: string }) => {
        if (data.ticketId === selectedQuery.id) {
          setActiveCall(null);

          // Update the selected query to clear active call ID
          setSelectedQuery({
            ...selectedQuery,
            activeCallId: null,
          });

          toast.info("Call has ended");
        }
      }
    );

    // Connection error handling
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      toast.error("Failed to connect to chat server");
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.off("connect");
        socket.off("newTextMessage");
        socket.off("ticketStatusChange");
        socket.off("messagesRead");
        socket.off("activeCallStarted");
        socket.off("activeCallEnded");
        socket.off("connect_error");
        socket.disconnect();
      }
    };
  }, [selectedQuery?.id, getDonorId, setSelectedQuery, onNewMessage]);

  // Fetch ticket details including active call information
  const fetchTicketDetails = async (ticketId: string, donorId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/tickets/${ticketId}/donor/${donorId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ticket details: ${response.status}`);
      }

      const ticketData = await response.json();

      // Update ticket information
      setSelectedQuery(ticketData);

      // Set active call info if available
      if (ticketData.activeCallId && ticketData.activeCall) {
        setActiveCall(ticketData.activeCall);
      } else {
        setActiveCall(null);
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error);
      // Don't show toast here as it's initial loading
    }
  };

  // Fetch initial chat history when query changes
  useEffect(() => {
    if (!selectedQuery?.id) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/tickets/${selectedQuery.id}/messages`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.status}`);
        }

        const data = await response.json();
        setMessages(data);

        // Scroll to bottom after loading messages
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load chat history");
      }
    };

    fetchMessages();
  }, [selectedQuery?.id]);

  // Join a call
  const handleJoinCall = async () => {
    if (!activeCall?.dailyRoomUrl) {
      toast.error("No active call to join");
      return;
    }

    // Validate selected query
    if (!selectedQuery?.id) {
      toast.error("Missing ticket information");
      console.error("Missing ticket ID, cannot join call", { selectedQuery });
      return;
    }

    // Get and validate donor ID
    const donorId = getValidDonorId();
    if (!donorId) {
      toast.error("Missing donor information");
      console.error("Missing donor ID, cannot join call", { auth });
      return;
    }

    try {
      // Instead of using the manager hook (which is throwing errors),
      // implement our own direct joining logic

      // 1. Clear any existing call config
      setCallConfig(null);

      // Wait for state to clear
      await new Promise((resolve) => setTimeout(resolve, 200));

      // 2. Set up new call configuration
      const newConfig = {
        url: activeCall.dailyRoomUrl,
        token: activeCall.userToken || undefined,
      };

      setCallConfig(newConfig);

      // Wait for config to be applied
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 3. Update call state with explicit number conversions
      const queryIdNum = parseInt(selectedQuery.id, 10);
      const donorIdNum = parseInt(donorId, 10);

      // Use fallback values if parsing fails
      const safeQueryId = isNaN(queryIdNum) ? 999 : queryIdNum;
      const safeDonorId = isNaN(donorIdNum) ? 999 : donorIdNum;

      startCall({
        queryId: safeQueryId,
        userId: safeDonorId,
        mode: activeCall.callType === "video" ? CallMode.VIDEO : CallMode.AUDIO,
        roomUrl: activeCall.dailyRoomUrl,
        roomToken: activeCall.userToken || "",
        roomName: activeCall.id || "",
      });

      // 4. Set local view state after a delay
      await new Promise((resolve) => setTimeout(resolve, 200));
      setCallViewActive(true);

      toast.success(`Joining ${activeCall.callType} call...`);
      return true;
    } catch (error) {
      console.error("Error joining call:", error);
      toast.error("Failed to join call. Please try again.");

      // Clean up on error
      setCallConfig(null);
      setCallViewActive(false);
      return false;
    }
  };

  // End a call using the API
  const handleEndCallAPI = async () => {
    if (!activeCall?.id) {
      toast.error("No active call to end");
      return;
    }

    try {
      // Call the API endpoint to end the call
      const response = await fetch(
        `${API_BASE_URL}/calls/${activeCall.id}/end`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to end call: ${response.status}`);
      }

      const endedCall = await response.json();

      // Update the UI state
      setActiveCall(null);

      // Update the ticket to reflect the ended call
      setSelectedQuery({
        ...selectedQuery,
        activeCallId: null,
      });

      toast.success("Call ended successfully");
    } catch (error) {
      console.error("Error ending call:", error);
      toast.error("Failed to end call. Please try again.");
    }
  };

  // Handle call ending
  const handleEndCall = useCallback(() => {
    // Use the call manager to end the call
    endCallManager();

    // Reset local call view state
    setCallViewActive(false);
  }, [endCallManager]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  // Ensure chat starts at the bottom when first loaded
  useLayoutEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView();
    }
  }, [messages.length]);

  // If call is active, render the Daily.co provider
  if (callConfig && globalCallActive && callViewActive) {
    return (
      <DailyProvider url={callConfig.url} token={callConfig.token}>
        <DailyAudio />
        <ModernCallComponent
          onEndCall={handleEndCall}
          selectedQueryId={Number(selectedQuery.id)}
          donorId={Number(getDonorId())}
          onViewChange={onViewChange}
          callType={activeCall?.callType as "audio" | "video"}
          hasNewMessages={hasNewMessages}
          onChatButtonClick={() => {
            // Return to chat view
            if (onViewChange) {
              onViewChange("chat");
              setCallViewActive(false);
              setHasNewMessages(false);
            }
          }}
          activeCallId={activeCall?.id}
        />
      </DailyProvider>
    );
  }

  // Format time helper
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Just now";
      }
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Just now";
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Today";
      }
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Today";
    }
  };

  // Get date label helper
  const getDateLabel = (dateString: string) => {
    try {
      const messageDate = new Date(dateString);
      // Check if date is valid
      if (isNaN(messageDate.getTime())) {
        return "Today";
      }

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Reset time components to compare just the dates
      const todayDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const yesterdayDate = new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate()
      );
      const messageDateOnly = new Date(
        messageDate.getFullYear(),
        messageDate.getMonth(),
        messageDate.getDate()
      );

      if (messageDateOnly.getTime() === todayDate.getTime()) {
        return "Today";
      } else if (messageDateOnly.getTime() === yesterdayDate.getTime()) {
        return "Yesterday";
      } else {
        return formatDate(dateString);
      }
    } catch (error) {
      console.error("Error getting date label:", error);
      return "Today";
    }
  };

  // Group messages by date
  const groupMessagesByDate = (messages: ChatMessage[] = []) => {
    if (!messages || messages.length === 0) return [];

    const groups: { [key: string]: ChatMessage[] } = {};

    messages.forEach((message) => {
      if (!message || !message.createdAt) {
        console.warn("Invalid message or missing createdAt:", message);
        // Put invalid messages in a "today" group
        const dateKey = "today";
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push({
          ...message,
          id:
            message.id ||
            `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          createdAt: message.createdAt || new Date().toISOString(),
        });
        return;
      }

      try {
        const messageDate = new Date(message.createdAt);
        // Skip invalid dates
        if (isNaN(messageDate.getTime())) {
          console.warn("Invalid date in message:", message);
          const dateKey = "today";
          if (!groups[dateKey]) {
            groups[dateKey] = [];
          }
          groups[dateKey].push({
            ...message,
            id:
              message.id ||
              `temp-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 9)}`,
            createdAt: new Date().toISOString(),
          });
          return;
        }

        // Create a date key in YYYY-MM-DD format
        const dateKey = `${messageDate.getFullYear()}-${String(
          messageDate.getMonth() + 1
        ).padStart(2, "0")}-${String(messageDate.getDate()).padStart(2, "0")}`;

        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(message);
      } catch (error) {
        console.error("Error processing message date:", error);
        // Handle error case
        const dateKey = "today";
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push({
          ...message,
          id:
            message.id ||
            `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          createdAt: new Date().toISOString(),
        });
      }
    });

    // Sort messages within each group chronologically (oldest first)
    Object.keys(groups).forEach((date) => {
      groups[date].sort((a, b) => {
        try {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        } catch (error) {
          return 0;
        }
      });
    });

    // Sort dates chronologically (oldest first)
    return Object.entries(groups)
      .sort(([dateA], [dateB]) => {
        try {
          if (dateA === "today") return 1;
          if (dateB === "today") return -1;
          return new Date(dateA).getTime() - new Date(dateB).getTime();
        } catch (error) {
          return 0;
        }
      })
      .map(([date, messages]) => ({
        date,
        label: date === "today" ? "Today" : getDateLabel(date),
        messages,
      }));
  };

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedQuery || isSending) return;

    setIsSending(true);
    try {
      const donorId = getDonorId();

      const response = await fetch(
        `${API_BASE_URL}/tickets/${selectedQuery.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            senderId: donorId,
            senderType: "donor",
            content: newMessage,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      // Clear input field immediately for better UX
      setNewMessage("");

      // No need to manually add message to state - we'll receive it via socket
      // Socket.IO will deliver the message and add it to our state
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // Handle resolving the query
  const handleResolveQuery = async () => {
    if (!selectedQuery || !selectedQuery.id || isResolving) return;

    setIsResolving(true);
    try {
      // Call the updated endpoint using resolveDonorQuery
      const updatedQuery = await resolveDonorQuery(
        String(selectedQuery.id),
        getDonorId()
      );

      // Update the selected query with the response
      setSelectedQuery(updatedQuery);
      toast.success("Ticket resolved successfully");

      // Navigate back to the query history view after resolving
      onViewChange("history");
    } catch (error) {
      console.error("Error resolving ticket:", error);
      toast.error("Failed to resolve ticket");
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="support-panel__chat">
      {selectedQuery?.status !== "resolved" && showCallButtons && (
        <div className="support-panel__call-controls">
          <div className="support-panel__call-status">
            {activeCall ? (
              <div className="support-panel__active-call-indicator">
                <span className="support-panel__active-call-dot"></span>
                <span>
                  {activeCall.callType === "video" ? "Video" : "Audio"} call
                  available
                </span>
              </div>
            ) : (
              <div className="support-panel__no-call-indicator">
                <MessageSquare className="support-panel__call-status-icon" />
                <span>No active calls</span>
              </div>
            )}
          </div>

          <div className="support-panel__call-buttons">
            {activeCall ? (
              // When there's an active call, show join and end buttons
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleJoinCall()}
                  disabled={isJoiningCall}
                  className="support-panel__call-control-btn support-panel__join-call-btn"
                >
                  {isJoiningCall ? (
                    <div className="support-panel__loading-spinner support-panel__button-loading-sm" />
                  ) : (
                    <>
                      {activeCall.callType === "video" ? (
                        <Video className="support-panel__call-control-icon" />
                      ) : (
                        <Phone className="support-panel__call-control-icon" />
                      )}
                      <span>
                        Join{" "}
                        {activeCall.callType === "video" ? "Video" : "Audio"}{" "}
                        Call
                      </span>
                    </>
                  )}
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleEndCallAPI}
                  className="support-panel__call-control-btn support-panel__end-call-btn"
                >
                  <X className="support-panel__call-control-icon" />
                  <span>End Call</span>
                </Button>
              </>
            ) : null}
          </div>
        </div>
      )}

      <ScrollArea className="support-panel__messages">
        <div className="support-panel__message-list">
          {messages.length > 0 ? (
            groupMessagesByDate(messages).map((group) => (
              <div key={group.date} className="support-panel__message-group">
                {group.messages.length > 0 && (
                  <>
                    <div className="support-panel__date-separator">
                      <span className="support-panel__date-text">
                        {group.label}
                      </span>
                    </div>
                    {group.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`support-panel__message ${
                          message.senderType === "admin"
                            ? "support-panel__message--admin"
                            : ""
                        }`}
                      >
                        {message.senderType === "admin" && (
                          <Avatar
                            fallback="A"
                            className="support-panel__message-avatar"
                          />
                        )}
                        <div
                          className={`support-panel__message-content ${
                            message.senderType === "admin"
                              ? "support-panel__message-content--admin"
                              : ""
                          }`}
                        >
                          <p className="support-panel__message-text">
                            {message.content}
                          </p>
                          <span className="support-panel__message-time">
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="support-panel__empty-chat">
              <MessageSquare className="support-panel__empty-chat-icon" />
              <p className="support-panel__empty-chat-title">No messages yet</p>
              <p className="support-panel__empty-chat-subtitle">
                Send a message to start the conversation
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="support-panel__chat-input">
        {selectedQuery?.status === "resolved" ? (
          <div className="support-panel__resolved-message">
            <div className="support-panel__resolved-badge">
              <Check className="support-panel__resolved-icon" />
              <span>Query Resolved</span>
            </div>
            <p className="support-panel__resolved-info">
              This support request has been resolved. If you need further
              assistance, please create a new request.
            </p>
          </div>
        ) : (
          <>
            <div className="support-panel__chat-actions">
              <Button
                variant="secondary"
                onClick={handleResolveQuery}
                disabled={
                  isResolving || String(selectedQuery?.status) === "RESOLVED"
                }
                title={
                  String(selectedQuery?.status) === "RESOLVED"
                    ? "Query already resolved"
                    : "Mark query as resolved"
                }
                className="support-panel__action-btn support-panel__resolve-btn"
              >
                {isResolving ? (
                  <div className="support-panel__loading-spinner support-panel__button-loading" />
                ) : (
                  <>
                    <CheckCircle className="support-panel__chat-action-icon" />
                    <span>Resolve</span>
                  </>
                )}
              </Button>
            </div>

            <style jsx global>{`
              .support-panel__call-controls {
                padding: 12px 16px;
                background-color: #f9fafb;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                flex-direction: column;
                gap: 10px;
              }

              .support-panel__call-status {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 13px;
                color: #6b7280;
              }

              .support-panel__active-call-indicator {
                display: flex;
                align-items: center;
                gap: 6px;
                color: #10b981;
                font-weight: 500;
              }

              .support-panel__active-call-dot {
                width: 8px;
                height: 8px;
                background-color: #10b981;
                border-radius: 50%;
                animation: pulse 1.5s infinite;
              }

              .support-panel__no-call-indicator {
                display: flex;
                align-items: center;
                gap: 6px;
                color: #6b7280;
                font-weight: 400;
              }

              .support-panel__call-status-icon {
                width: 14px;
                height: 14px;
              }

              .support-panel__call-buttons {
                display: flex;
                gap: 8px;
              }

              .support-panel__call-control-btn {
                height: 32px;
                font-size: 13px;
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 0 10px;
              }

              .support-panel__call-control-icon {
                width: 14px;
                height: 14px;
              }

              .support-panel__request-video-btn {
                background-color: #f0f4ff;
                color: #4f46e5;
                border-color: #e0e7ff;
              }

              .support-panel__request-video-btn:hover:not(:disabled) {
                background-color: #e0e7ff;
              }

              .support-panel__request-audio-btn {
                background-color: #f0f9ff;
                color: #0ea5e9;
                border-color: #e0f2fe;
              }

              .support-panel__request-audio-btn:hover:not(:disabled) {
                background-color: #e0f2fe;
              }

              .support-panel__join-call-btn {
                margin-left: auto;
                background-color: #10b981;
                color: white;
                border-color: #059669;
                height: 24px;
                padding: 0 10px;
                font-size: 12px;
              }

              .support-panel__join-call-btn:hover:not(:disabled) {
                background-color: #059669;
              }

              .support-panel__end-call-btn {
                height: 24px;
                padding: 0 10px;
                font-size: 12px;
              }

              @keyframes pulse {
                0% {
                  opacity: 1;
                }
                50% {
                  opacity: 0.5;
                }
                100% {
                  opacity: 1;
                }
              }

              .support-panel__button-loading {
                width: 20px;
                height: 20px;
              }

              .support-panel__button-loading-sm {
                width: 16px;
                height: 16px;
                border-width: 2px;
              }

              .support-panel__chat-actions {
                display: flex;
                gap: 12px;
                width: 100%;
                margin-bottom: 12px;
              }

              .support-panel__action-btn {
                flex: 1;
                height: 38px;
                border-radius: 6px;
                font-weight: 500;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                transition: all 0.2s ease;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                border: 1px solid rgba(0, 0, 0, 0.1);
                padding: 0 12px;
              }

              .support-panel__action-btn:hover:not(:disabled) {
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              }

              .support-panel__action-btn:active:not(:disabled) {
                transform: translateY(0);
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
              }

              .support-panel__chat-action-icon {
                width: 16px;
                height: 16px;
              }

              .support-panel__resolve-btn {
                background-color: #ecfdf5;
                color: #10b981;
                border-color: #d1fae5;
              }

              .support-panel__resolve-btn:hover:not(:disabled) {
                background-color: #d1fae5;
              }

              .support-panel__loading-spinner {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: #fff;
                animation: spin 1s ease-in-out infinite;
              }

              @keyframes spin {
                to {
                  transform: rotate(360deg);
                }
              }
            `}</style>

            <div className="support-panel__chat-input-container">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="support-panel__chat-input-textarea"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSending}
                className="support-panel__chat-send-button"
                aria-label="Send message"
              >
                {isSending ? (
                  <div className="support-panel__loading-spinner support-panel__chat-send-loading" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="support-panel__chat-send-icon"
                  >
                    <path d="M22 2L11 13"></path>
                    <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
                  </svg>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
