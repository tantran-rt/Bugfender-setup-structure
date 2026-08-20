"use client";

import { useEffect, useRef, useState, RefObject } from "react";
import Webcam from "react-webcam";
import { sendLogs } from "@/utils/sendAnalytics.utils";
import type { ArmPoseResult } from "@/types/object-detections";

const LANDMARKS = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14
} as const;

const VISIBILITY_THRESHOLD = 0.9;
const SMOOTHING_WINDOW = 8;
const SMOOTHING_POSITIVE_THRESHOLD = 5;
const MISS_DEBOUNCE = 2;
const TARGET_FPS = 6;

const INITIAL_RESULT: ArmPoseResult = {
  armVisible: false,
  armBox: null,
  confidence: 0
};

export interface UseArmPoseDetectionProps {
  videoRef?: RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  /** When true, MediaPipe uses CPU delegate to avoid WebGL pressure on mobile. */
  isMobile?: boolean;
}

/**
 * Client-side arm detection using MediaPipe Pose Landmarker.
 * Evaluates shoulder→elbow→wrist landmarks on each side,
 * picks the higher-confidence arm, and applies temporal smoothing
 * with miss-debounce to avoid flicker.
 */
export function useArmPoseDetection({
  videoRef,
  enabled,
  isMobile = false
}: UseArmPoseDetectionProps): ArmPoseResult {
  const [result, setResult] = useState<ArmPoseResult>(INITIAL_RESULT);

  const landmarkerRef = useRef<any>(null);
  const rafIdRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const rollingRef = useRef<boolean[]>([]);
  const missCountRef = useRef(0);
  const wasVisibleRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setResult(INITIAL_RESULT);
      rollingRef.current = [];
      missCountRef.current = 0;
      wasVisibleRef.current = false;
      sendLogs("Stopped arm detection!");
      return;
    }

    sendLogs("Started arm detection!");

    let disposed = false;
    const frameInterval = 1000 / TARGET_FPS;

    const evaluateSide = (
      landmarks: any[],
      side: "left" | "right",
      videoW: number,
      videoH: number
    ) => {
      const sIdx =
        side === "left" ? LANDMARKS.LEFT_SHOULDER : LANDMARKS.RIGHT_SHOULDER;
      const eIdx =
        side === "left" ? LANDMARKS.LEFT_ELBOW : LANDMARKS.RIGHT_ELBOW;

      const shoulder = landmarks[sIdx];
      const elbow = landmarks[eIdx];

      if (!shoulder || !elbow)
        return { visible: false, box: null, confidence: 0 };

      const avg = ((shoulder.visibility ?? 0) + (elbow.visibility ?? 0)) / 2;
      if (avg < VISIBILITY_THRESHOLD || shoulder.x < elbow.x)
        return { visible: false, box: null, confidence: avg };

      // MediaPipe landmarks are already in [0, 1]; keep the box in the same
      // normalized space so overlays and overlap checks are resolution-agnostic.
      // Flip the coordinate space to match with video preview space
      const x1 = 1 - Math.min(1, Math.max(shoulder.x, elbow.x));
      const x2 = 1 - Math.max(0, Math.min(shoulder.x, elbow.x));
      const y1 = Math.max(0, Math.min(shoulder.y, elbow.y));
      const y2 = Math.min(1, Math.max(shoulder.y, elbow.y));

      // Orientation check must happen in pixel space — on a portrait camera,
      // Y is scaled more than X, so comparing normalized sides would invert
      // the "taller than wide" heuristic.
      const pxW = (x2 - x1) * videoW;
      const pxH = (y2 - y1) * videoH;
      if (pxW > pxH) {
        return { visible: false, box: null, confidence: avg };
      }

      // console.log(
      //   `Pose arm res: [${x1.toFixed(3)}, ${y1.toFixed(3)}, ${x2.toFixed(3)}, ${y2.toFixed(3)}] - Conf: ${avg}`
      // );

      return {
        visible: true,
        box: [x1, y1, x2, y2],
        confidence: avg
      };
    };

    const applySmoothing = (
      frameVisible: boolean,
      box: number[] | null,
      confidence: number
    ) => {
      const win = rollingRef.current;
      win.push(frameVisible);
      if (win.length > SMOOTHING_WINDOW) win.shift();

      const positives = win.filter(Boolean).length;
      const smoothed = positives >= SMOOTHING_POSITIVE_THRESHOLD;

      if (wasVisibleRef.current && !smoothed) {
        missCountRef.current++;
        if (missCountRef.current < MISS_DEBOUNCE) {
          setResult((prev) => ({
            ...prev,
            armBox: box ?? prev.armBox,
            confidence
          }));
          return;
        }
      } else {
        missCountRef.current = 0;
      }

      wasVisibleRef.current = smoothed;
      setResult({
        armVisible: smoothed,
        armBox: smoothed ? box : null,
        confidence
      });
    };

    const processFrame = (timestamp: number) => {
      const video = videoRef?.current as HTMLVideoElement;
      const landmarker = landmarkerRef.current;
      if (
        !video ||
        !landmarker ||
        video.readyState < 2 ||
        video.paused ||
        !video.videoWidth
      )
        return;

      try {
        const res = landmarker.detectForVideo(video, timestamp);
        // sendLogs(`Arm pose detection result: ${JSON.stringify(res)}`);
        if (!res?.landmarks?.length) {
          applySmoothing(false, null, 0);
          return;
        }

        const lm = res.landmarks[0];

        const left = evaluateSide(
          lm,
          "left",
          video.videoWidth,
          video.videoHeight
        );
        // const right = evaluateSide(lm, "right", video.videoWidth, video.videoHeight);
        // const best = left.confidence >= right.confidence ? left : right;
        applySmoothing(left.visible, left.box, left.confidence);
      } catch (err) {
        sendLogs(`Arm pose detection error: ${err}`);
        // Transient frame-processing errors are expected during video transitions
      }
    };

    const loop = (timestamp: number) => {
      if (disposed) return;
      if (timestamp - lastFrameTimeRef.current >= frameInterval) {
        lastFrameTimeRef.current = timestamp;
        processFrame(timestamp);
      }
      rafIdRef.current = requestAnimationFrame(loop);
    };

    (async () => {
      try {
        const { getPoseLandmarker } =
          await import("@/utils/poseLandmarkerLoader");
        const landmarker = await getPoseLandmarker(
          isMobile ? "CPU" : "GPU"
        );
        if (disposed) return;
        landmarkerRef.current = landmarker;
        rafIdRef.current = requestAnimationFrame(loop);
      } catch (err) {
        sendLogs(`PoseLandmarker init error: ${err}`);
      }
    })();

    return () => {
      disposed = true;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [enabled, videoRef, isMobile]);

  return result;
}
