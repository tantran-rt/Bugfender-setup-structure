"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject
} from "react";
import {
  DRAW_STALL_POLL_MS,
  ORIENTATION_CHANGE_REASON,
  S3_CHUNK_STALL_POLL_MS,
  S3_CHUNK_STALL_THRESHOLD_MS,
  shouldInterruptForInvalidVideoFrames,
  shouldInterruptForS3ChunkInvalid
} from "@/utils/recordingSessionInterrupt";

export type OrientationAxis = "portrait" | "landscape";

export type UseRecordingSessionInterruptArgs = {
  isRecording: boolean;
  isVisible: boolean;
  /**
   * When true, watch portrait↔landscape flips (phones + touch tablets).
   * Callers typically pass `!isDesktop || isTouchRotatableDevice()`.
   */
  shouldWatchOrientationAxis: boolean;
  getBridgeLastDrawTime: () => number | null;
  getLastS3ChunkTime: () => number | null;
  onInterrupt: (reason: string) => void;
};

export type UseRecordingSessionInterruptReturn = {
  recordingInterruptedRef: RefObject<boolean>;
  /** Reactive flag for UI gates (e.g. face-undetected audio). */
  isRecordingInterrupted: boolean;
};

/**
 * Portrait vs landscape only. Ignores 180° flips within the same axis.
 * Prefers Screen Orientation API; falls back to viewport aspect.
 */
export function getOrientationAxis(): OrientationAxis {
  const type = window.screen?.orientation?.type;
  console.log("Orientation axis:", type);
  if (type?.startsWith("portrait")) return "portrait";
  if (type?.startsWith("landscape")) return "landscape";
  return window.innerHeight >= window.innerWidth ? "portrait" : "landscape";
}

/**
 * While recording, interrupt once when the page is hidden, the canvas bridge
 * has not drawn a frame for DRAW_STALL_THRESHOLD_MS, no uploadable S3 chunk
 * has arrived within S3_CHUNK_STALL_THRESHOLD_MS, or (when
 * shouldWatchOrientationAxis) the device orientation axis flips between
 * portrait and landscape.
 */
export default function useRecordingSessionInterrupt({
  isRecording,
  isVisible,
  shouldWatchOrientationAxis,
  getBridgeLastDrawTime,
  getLastS3ChunkTime,
  onInterrupt
}: UseRecordingSessionInterruptArgs): UseRecordingSessionInterruptReturn {
  const recordingInterruptedRef = useRef(false);
  const [isRecordingInterrupted, setIsRecordingInterrupted] = useState(false);
  const isRecordingRef = useRef(isRecording);
  isRecordingRef.current = isRecording;
  const onInterruptRef = useRef(onInterrupt);
  onInterruptRef.current = onInterrupt;
  const getBridgeLastDrawTimeRef = useRef(getBridgeLastDrawTime);
  getBridgeLastDrawTimeRef.current = getBridgeLastDrawTime;
  const getLastS3ChunkTimeRef = useRef(getLastS3ChunkTime);
  getLastS3ChunkTimeRef.current = getLastS3ChunkTime;

  const tryInterrupt = useCallback((reason: string) => {
    if (recordingInterruptedRef.current) return;
    if (!isRecordingRef.current) return;
    console.warn(`Recording session interrupted: ${reason}`);
    recordingInterruptedRef.current = true;
    setIsRecordingInterrupted(true);
    onInterruptRef.current(reason);
  }, []);

  useEffect(() => {
    if (!isVisible && isRecording) {
      tryInterrupt("page-hidden");
    }
  }, [isVisible, isRecording, tryInterrupt]);

  useEffect(() => {
    if (!isRecording || !shouldWatchOrientationAxis) return;
    if (typeof window === "undefined") return;

    let lastAxis = getOrientationAxis();
    const onOrientationChange = () => {
      const nextAxis = getOrientationAxis();
      if (nextAxis === lastAxis) return;
      lastAxis = nextAxis;
      tryInterrupt(ORIENTATION_CHANGE_REASON);
    };

    const screenOrientation = window.screen?.orientation;
    if (screenOrientation?.addEventListener) {
      screenOrientation.addEventListener("change", onOrientationChange);
    }

    return () => {
      if (screenOrientation?.removeEventListener) {
        screenOrientation.removeEventListener("change", onOrientationChange);
      }
    };
  }, [isRecording, shouldWatchOrientationAxis, tryInterrupt]);

  useEffect(() => {
    if (!isRecording) return;

    const id = setInterval(() => {
      if (recordingInterruptedRef.current) return;
      const last = getBridgeLastDrawTimeRef.current();
      if (shouldInterruptForInvalidVideoFrames(last, performance.now())) {
        console.log("Video frame health check failed -> interrupting session");
        tryInterrupt("no-video-frames-over-30s");
      }
    }, DRAW_STALL_POLL_MS);

    return () => clearInterval(id);
  }, [isRecording, tryInterrupt]);

  useEffect(() => {
    if (!isRecording) return;

    const id = setInterval(() => {
      if (recordingInterruptedRef.current) return;
      const last = getLastS3ChunkTimeRef.current();
      if (shouldInterruptForS3ChunkInvalid(last, performance.now())) {
        console.log("S3 chunk health check failed -> interrupting session");
        tryInterrupt(
          `no-s3-chunks-recorded-over-${S3_CHUNK_STALL_THRESHOLD_MS / 1000}s`
        );
      }
    }, S3_CHUNK_STALL_POLL_MS);

    return () => clearInterval(id);
  }, [isRecording, tryInterrupt]);

  return { recordingInterruptedRef, isRecordingInterrupted };
}
