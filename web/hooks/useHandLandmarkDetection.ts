"use client";

import { useEffect, useRef, useState, RefObject } from "react";
import Webcam from "react-webcam";
import { sendLogs } from "@/utils/sendAnalytics.utils";

export type PointDirection = "none" | "top" | "bottom" | "right" | "left";

export interface PointingResult {
  direction: PointDirection;
  confidence: number;
  handVisible: boolean;
  indexTipLandmark?: Landmark;
}

export interface UseHandLandmarkDetectionProps {
  videoRef?: RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  /** When true, MediaPipe uses CPU delegate to avoid WebGL pressure on mobile. */
  isMobile?: boolean;
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

const WRIST = 0;
const INDEX_MCP = 5;
const INDEX_TIP = 8;

const TARGET_FPS = 10;
const MIN_FINGER_LENGTH = 0.04;
const DIRECTION_DOMINANCE = 1.3;

const SMOOTHING_WINDOW = 5;
const SMOOTHING_THRESHOLD = 3;

const INITIAL_RESULT: PointingResult = {
  direction: "none",
  confidence: 0,
  handVisible: false
};

function dist(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isFingerExtended(
  landmarks: Landmark[],
  tipIdx: number,
  mcpIdx: number,
  wristIdx: number
): boolean {
  return (
    dist(landmarks[tipIdx], landmarks[wristIdx]) >
    dist(landmarks[mcpIdx], landmarks[wristIdx])
  );
}

function detectPointing(landmarks: Landmark[]): PointDirection {
  const indexExtended = isFingerExtended(
    landmarks,
    INDEX_TIP,
    INDEX_MCP,
    WRIST
  );
  // const middleCurled = !isFingerExtended(landmarks, MIDDLE_TIP, MIDDLE_MCP, WRIST);
  // const ringCurled = !isFingerExtended(landmarks, RING_TIP, RING_MCP, WRIST);
  // const pinkyCurled = !isFingerExtended(landmarks, PINKY_TIP, PINKY_MCP, WRIST);

  // if (!indexExtended || !middleCurled || !ringCurled || !pinkyCurled)
  //   return "none";
  if (!indexExtended) {
    return "none";
  }

  const mcp = landmarks[INDEX_MCP];
  const tip = landmarks[INDEX_TIP];
  const dx = tip.x - mcp.x;
  const dy = tip.y - mcp.y;
  const length = Math.hypot(dx, dy);

  if (length < MIN_FINGER_LENGTH) return "none";

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx > absDy * DIRECTION_DOMINANCE) {
    return dx > 0 ? "left" : "right";
  }
  if (absDy > absDx * DIRECTION_DOMINANCE) {
    return dy > 0 ? "bottom" : "top";
  }

  return "none";
}

/**
 * Detects index-finger pointing direction via MediaPipe HandLandmarker.
 *
 * Checks that only the index finger is extended (middle, ring, pinky curled),
 * then classifies the MCP→TIP vector into up / down / left / right.
 * A rolling-window smoothing (3 out of 5 frames) prevents flicker.
 */
export function useHandLandmarkDetection({
  videoRef,
  enabled,
  isMobile = false
}: UseHandLandmarkDetectionProps): PointingResult {
  const [result, setResult] = useState<PointingResult>(INITIAL_RESULT);

  const landmarkerRef = useRef<any>(null);
  const rafIdRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const rollingRef = useRef<PointDirection[]>([]);

  useEffect(() => {
    if (!enabled) {
      setResult(INITIAL_RESULT);
      rollingRef.current = [];
      sendLogs("Stopped gesture detection!");
      return;
    }
    sendLogs("Started gesture detection!");

    let disposed = false;
    const frameInterval = 1000 / TARGET_FPS;

    const applySmoothing = (frameDir: PointDirection): PointDirection => {
      const win = rollingRef.current;
      win.push(frameDir);
      if (win.length > SMOOTHING_WINDOW) win.shift();

      const counts = new Map<PointDirection, number>();
      for (const d of win) {
        counts.set(d, (counts.get(d) ?? 0) + 1);
      }
      let best: PointDirection = "none";
      let bestCount = 0;
      for (const [dir, count] of counts) {
        if (
          dir !== "none" &&
          count >= SMOOTHING_THRESHOLD &&
          count > bestCount
        ) {
          best = dir;
          bestCount = count;
        }
      }

      return best;
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

        if (!res?.landmarks?.length) {
          rollingRef.current = [];
          setResult(INITIAL_RESULT);
          return;
        }

        const landmarks = res.landmarks[0] as Landmark[];
        const tip = landmarks[INDEX_TIP];
        const rawDir = detectPointing(landmarks);
        const smoothedDir = applySmoothing(rawDir);

        const handednessScore = res.handedness?.[0]?.[0]?.score ?? 0;

        setResult({
          direction: smoothedDir,
          confidence: handednessScore,
          handVisible: true,
          indexTipLandmark: tip
        });
      } catch {
        // Transient frame-processing errors during video transitions
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
        const { getHandLandmarker } =
          await import("@/utils/handLandmarkerLoader");
        const landmarker = await getHandLandmarker(
          isMobile ? "CPU" : "GPU"
        );
        if (disposed) return;
        landmarkerRef.current = landmarker;
        rafIdRef.current = requestAnimationFrame(loop);
      } catch (err) {
        sendLogs(`HandLandmarker init error: ${err}`);
      }
    })();

    return () => {
      disposed = true;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [enabled, videoRef, isMobile]);

  return result;
}
