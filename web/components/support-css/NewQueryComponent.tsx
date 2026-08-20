"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/ui-css/button";
import { Textarea } from "@/ui-css/textarea";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { authToken } from "@/redux/slices/auth";
import { appData } from "@/redux/slices/appConfig";
import { HelpCircle, Video, Mic } from "lucide-react";
import { DailyProvider, DailyAudio } from "@daily-co/daily-react";
import { useAtom } from "jotai";
import {
  callConfigAtom,
  startCallAtom,
  isCallActiveAtom,
  callModeAtom,
} from "@/lib/store/call-store";
import { CallMode } from "@/types/communication";
import {
  startDonorCall,
  type CreateTicketDto,
  type StartCallResponse,
} from "@/lib/api";
import { ModernCallComponent } from "@/components/DailyCall/ModernCallComponent";

interface NewQueryComponentProps {
  onSubmitSuccess: (query: StartCallResponse) => void;
}

export default function NewQueryComponent({
  onSubmitSuccess,
}: NewQueryComponentProps) {
  const [newQuery, setNewQuery] = useState("");
  const [, setIsLoading] = useState(false);
  const [isStartingCall, setIsStartingCall] = useState(false);

  // Call-related states
  const [callConfig, setCallConfig] = useAtom(callConfigAtom);
  const [isCallActive] = useAtom(isCallActiveAtom);
  const [, startCallState] = useAtom(startCallAtom);
  const [callData, setCallData] = useState<{
    queryId: number;
    donorId: string;
    roomUrl: string;
    token: string;
  } | null>(null);

  // Get auth data from Redux store
  const auth = useSelector(authToken);
  const userData = useSelector(appData);

  // New function to handle starting a direct call
  const handleStartCall = async (callType: "audio" | "video" = "video") => {
    if (!newQuery.trim()) {
      toast.error(
        "Please provide a brief description of your issue before starting a call"
      );
      return;
    }

    setIsStartingCall(true);

    try {
      // Create the data for the start call API
      const callData: CreateTicketDto = {
        donorId: auth?.participant_id as string,
        donorEmail: userData?.email,
        description: newQuery,
        callType: callType,
      };

      // Clear the input field immediately for better UX
      setNewQuery("");

      try {
        // Call the API to start a direct call
        const response = await startDonorCall(callData);

        if (response && response.call) {
          // Notify the user
          toast.success(
            `${
              callType === "audio" ? "Audio" : "Video"
            } call session created! Connecting you with support...`
          );

          // Call success handler with the query
          onSubmitSuccess(response);

          // Wait a moment before setting up the call
          await new Promise((resolve) => setTimeout(resolve, 300));

          try {
            // First, set local data without triggering renders
            const localQueryId = Number(response.id);
            const localDonorId = userData?.id;
            const localCallMode =
              callType === "audio" ? CallMode.AUDIO : CallMode.VIDEO;

            // Then update call data in state
            setCallData({
              queryId: localQueryId,
              donorId: localDonorId,
              roomUrl: response.call.dailyRoomUrl,
              token: response.call.userToken,
            });

            // Wait for call data to be set
            await new Promise((resolve) => setTimeout(resolve, 200));

            // Update call state in Jotai
            startCallState({
              queryId: localQueryId,
              userId: Number(localDonorId),
              mode: localCallMode,
              roomName: response.activeCallId || response.call.id,
              roomToken: response.call.userToken,
              roomUrl: response.call.dailyRoomUrl,
            });

            // Wait for call state to update
            await new Promise((resolve) => setTimeout(resolve, 200));

            // Finally set the call config which will trigger the DailyProvider render
            setCallConfig({
              url: response.call.dailyRoomUrl,
              token: response.call.userToken,
            });

            // Do not navigate or make any more state changes to avoid re-renders
          } catch (joinError) {
            console.error("Error setting up call:", joinError);
            toast.error("Failed to initialize call. Please try again.");
          }
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (callError: any) {
        console.error("Error starting call:", callError);

        // Check for active query error
        if (
          callError.responseData?.message?.includes("active query") ||
          (callError.status === 400 &&
            callError.message?.includes("active query")) ||
          (typeof callError === "string" && callError.includes("active query"))
        ) {
          toast.error(
            "You already have an active support session. Please wait for it to be resolved before starting a new call."
          );
          return;
        }

        throw callError;
      }
    } catch (error: any) {
      console.error("Error in handleStartCall:", error);
      toast.error(
        "Couldn't start a call. Please try submitting a text query instead."
      );
    } finally {
      setIsStartingCall(false);
    }
  };

  // Handle call end
  const handleEndCall = useCallback(() => {
    // Reset call config
    setCallConfig(null);

    // Clear call data
    setCallData(null);
  }, [setCallConfig]);

  // Handle view change from the call component
  const handleViewChange = useCallback(() => {
    // Not used in this component but required by ModernCallComponent
  }, []);

  // Get current call mode from the store to determine the call type
  const [callMode] = useAtom(callModeAtom);
  const activeCallType = callMode === CallMode.AUDIO ? "audio" : "video";

  // If there is a call config, render the DailyProvider with ModernCallComponent
  if (callConfig && isCallActive && callData) {

    return (
      <DailyProvider url={callConfig.url} token={callConfig.token}>
        <DailyAudio />
        <ModernCallComponent
          onEndCall={handleEndCall}
          selectedQueryId={callData.queryId}
          donorId={Number(callData.donorId)}
          onViewChange={handleViewChange}
          callType={activeCallType}
        />
      </DailyProvider>
    );
  }

  return (
    <div className="support-panel__initial">
      <div className="support-panel__initial-header">
        <HelpCircle className="support-panel__initial-icon" />
        <h2 className="support-panel__initial-title">How can we help you?</h2>
      </div>

      <p className="support-panel__initial-text">
        Describe your issue and we&apos;ll connect you with a support
        representative.
      </p>

      <div className="support-panel__initial-form">
        <Textarea
          value={newQuery}
          onChange={(e) => setNewQuery(e.target.value)}
          placeholder="Type your question or issue here..."
          className="support-panel__initial-textarea"
          rows={2}
        />

        <div className="support-panel__initial-actions">
          <Button
            className="support-panel__initial-call support-panel__initial-video-call"
            onClick={() => handleStartCall("video")}
            disabled={isStartingCall || !newQuery.trim()}
            variant="primary"
          >
            {isStartingCall ? (
              <>
                <span className="support-panel__initial-loading-spinner"></span>
                <span
                  className="support-panel__initial-call-text"
                  style={{ fontSize: "0.9rem", marginLeft: "4px" }}
                >
                  Starting call...
                </span>
              </>
            ) : (
              <>
                <Video className="support-panel__initial-call-icon" size={18} />
                <span
                  className="support-panel__initial-call-text"
                  style={{ fontSize: "0.9rem", marginLeft: "4px" }}
                >
                  Start Video Call
                </span>
              </>
            )}
          </Button>

          <Button
            className="support-panel__initial-call support-panel__initial-audio-call"
            onClick={() => handleStartCall("audio")}
            disabled={isStartingCall || !newQuery.trim()}
            variant="outline"
          >
            {isStartingCall ? (
              <>
                <span className="support-panel__initial-loading-spinner"></span>
                <span
                  className="support-panel__initial-call-text"
                  style={{ fontSize: "0.9rem", marginLeft: "4px" }}
                >
                  Starting call...
                </span>
              </>
            ) : (
              <>
                <Mic className="support-panel__initial-call-icon" size={18} />
                <span
                  className="support-panel__initial-call-text"
                  style={{ fontSize: "0.9rem", marginLeft: "4px" }}
                >
                  Start Audio Call
                </span>
              </>
            )}
          </Button>
        </div>

        <div className="support-panel__initial-tips">
          <p>
            Tips: Include specific details about what you&apos;re trying to do
            and any error messages you&apos;ve encountered.
          </p>
        </div>
      </div>
    </div>
  );
}
