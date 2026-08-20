"use client";

import { useEffect, useState, RefObject } from "react";
import { toast } from "react-toastify";
import { Step } from "@/types/testCollection";
import { Browser } from "@/types/constants";
import {
  KitDetectionData,
  ObjectClassMapping
} from "@/types/object-detections";
import { isIncludesAIOption } from "@/utils/testCollectionUtils";
import { captureDownscaledFrameFromVideo } from "@/utils/camera";
import { sendLogs } from "@/utils/sendAnalytics.utils";

const CAMERA_CHECK_INTERVAL_MS = 500;
const CAPTURE_INTERVAL_CHROME_MS = 200;
const CAPTURE_INTERVAL_OTHER_MS = 500;
const FRAME_CAPTURE_TARGET_WIDTH = 480;

export interface UseFrameCaptureProps {
  isConnected: boolean;
  /** When false, stops the capture loop (e.g. barcode scanner is open). */
  enabled?: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  sendMessageToEvent: (event: string, payload: unknown) => void;
  browserName: string | undefined;
  kitDetectionData: KitDetectionData | null;
  currentStepRef: React.RefObject<Step | null>;
}

export interface FrameCaptureDimensions {
  frameCaptureWidth: number;
  frameCaptureHeight: number;
}

/**
 * Runs a capture loop when socket is connected and enabled: captures frames
 * from the shared-camera preview video and sends them for face detection and
 * kit/object detection (when step supports it).
 * Polls for video element readiness before starting the interval.
 * Pause via enabled=false when the barcode scanner owns the camera UI.
 *
 * Returns the downscaled capture dimensions used for server-side detection,
 * so bounding-box overlays can map coordinates correctly.
 */

export function useFrameCapture({
  isConnected,
  enabled = true,
  videoRef,
  sendMessageToEvent,
  browserName,
  kitDetectionData,
  currentStepRef
}: UseFrameCaptureProps): FrameCaptureDimensions {
  const [dimensions, setDimensions] = useState<FrameCaptureDimensions>({
    frameCaptureWidth: 0,
    frameCaptureHeight: 0
  });

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    let checkCameraId: ReturnType<typeof setInterval>;

    if (!isConnected || !enabled) return;

    const captureInterval =
      browserName !== Browser.Chrome
        ? CAPTURE_INTERVAL_OTHER_MS
        : CAPTURE_INTERVAL_CHROME_MS;

    const isVideoReady = () => {
      const video = videoRef.current;
      return !!video && video.videoWidth > 0;
    };

    const updateDimensions = () => {
      const video = videoRef.current;
      if (video && video.videoWidth > 0 && video.videoHeight > 0) {
        const aspectRatio = video.videoHeight / video.videoWidth;
        const targetHeight = Math.round(
          FRAME_CAPTURE_TARGET_WIDTH * aspectRatio
        );
        sendLogs(
          `Updating frame capture dimensions: ${FRAME_CAPTURE_TARGET_WIDTH}x${targetHeight}`
        );
        setDimensions((prev) => {
          if (
            prev.frameCaptureWidth === FRAME_CAPTURE_TARGET_WIDTH &&
            prev.frameCaptureHeight === targetHeight
          )
            return prev;
          return {
            frameCaptureWidth: FRAME_CAPTURE_TARGET_WIDTH,
            frameCaptureHeight: targetHeight
          };
        });
      }
    };

    const initDimensions = () => {
      const video = videoRef.current;
      if (video && video.videoWidth > 0 && video.videoHeight > 0) {
        updateDimensions();
        return;
      }
      const onResize = () => {
        updateDimensions();
        video?.removeEventListener("resize", onResize);
      };
      video?.addEventListener("resize", onResize);
    };

    const startCaptureLoop = () => {
      initDimensions();

      intervalId = setInterval(() => {
        try {
          const base64Image = captureDownscaledFrameFromVideo(
            videoRef.current,
            FRAME_CAPTURE_TARGET_WIDTH
          );

          if (base64Image) {
            sendMessageToEvent("detect-face-boolean", base64Image);

            if (
              kitDetectionData &&
              kitDetectionData?.ai_options &&
              currentStepRef.current?.ai_options
            ) {
              const enableObjectDetection = kitDetectionData.ai_options.some(
                (optionMapping: ObjectClassMapping) =>
                  isIncludesAIOption(
                    currentStepRef.current?.ai_options,
                    optionMapping.name
                  )
              );

              if (enableObjectDetection && kitDetectionData.type) {
                sendMessageToEvent("kit-detection", {
                  base64_image: base64Image,
                  type: kitDetectionData.type
                });
              }
            }
          }
        } catch (error) {
          console.error("Face capture error:", error);
          toast.error("Error capturing image. Please try again later.");
        }
      }, captureInterval);
    };

    if (!isVideoReady()) {
      checkCameraId = setInterval(() => {
        if (isVideoReady()) {
          clearInterval(checkCameraId);
          startCaptureLoop();
        }
      }, CAMERA_CHECK_INTERVAL_MS);
    } else {
      startCaptureLoop();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (checkCameraId) clearInterval(checkCameraId);
    };
  }, [
    isConnected,
    enabled,
    sendMessageToEvent,
    browserName,
    kitDetectionData,
    videoRef,
    currentStepRef
  ]);

  return dimensions;
}
