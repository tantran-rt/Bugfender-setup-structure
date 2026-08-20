import { useCallback, useEffect, useRef, useState } from "react";
import { CAMERA_RESOLUTION } from "@/types/constants";
import { sendLogs } from "@/utils/sendAnalytics.utils";
import { watchCanvasContextLoss } from "@/utils/canvasDiagnostics";
import {
  buildRecordingHealthSnapshot,
  formatRecordingHealth,
  HEALTH_POLL_INTERVAL_MS,
  healthSignature,
  shouldEmitHealthLog,
  watchTrackLifecycle
} from "@/utils/recordingTrackDiagnostics";

export type SharedCameraStatus = "acquiring" | "previewing" | "denied";

export type CameraResolution = {
  width: number;
  height: number;
};

export type RestoreCameraResult = {
  remounted: boolean;
  /** When false, S3/Beam MediaRecorders stay on the canvas bridge — do not soft-swap. */
  softSwapRequired: boolean;
  stream: MediaStream | null;
};

const MOBILE_BRIDGE_INTERVAL_MS = 1000 / 30;

/** Portrait coded size for mobile S3/Beam — independent of 640x480 GUM open. */
const MOBILE_RECORDING_RESOLUTION: CameraResolution = {
  width: CAMERA_RESOLUTION.DESKTOP.WIDTH,
  height: CAMERA_RESOLUTION.DESKTOP.HEIGHT
};

type RecordingBridge = {
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  rafId: number;
  canvasStream: MediaStream;
  recordingStream: MediaStream;
  lastDrawTime: number;
  /** `performance.now()` of the last source `currentTime` advance, -1 until then. */
  lastFrameAdvanceTime: number;
  /** Last observed source `currentTime`, used to detect a frozen camera. */
  lastVideoTime: number;
  healthIntervalId: ReturnType<typeof setInterval> | null;
  /** 0 = no throttle (desktop); mobile caps at ~30fps. */
  minDrawIntervalMs: number;
  /**
   * When true, keep canvas at MOBILE_RECORDING_RESOLUTION and orient landscape
   * source frames into portrait (Mobile Chrome often leaves track/video at 640x480).
   */
  lockPortraitOutput: boolean;
  unwatchContextLoss: () => void;
};

/**
 * Sole owner of getUserMedia for the collection recording session.
 *
 * Preview uses the live camera MediaStream (remountable after Scandit for FOV).
 * S3/Beam clones come from a canvas.captureStream() bridge so MediaRecorder keeps
 * one continuous video track across camera remounts (audio track is kept alive).
 *
 * iOS Safari quirk: requesting portrait numbers (480x640) yields a landscape-looking
 * preview; requesting landscape numbers (640x480) yields the correct upright preview.
 * Mobile therefore opens/restores with CAMERA_RESOLUTION.MOBILE (640x480). Desktop
 * uses true portrait (480x640).
 *
 * Recording on mobile still targets portrait 480x640 via a locked canvas bridge so
 * Chrome does not encode the landscape sensor buffer that Safari often re-orients.
 */
export default function useSharedCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] =
    useState<SharedCameraStatus>("acquiring");
  const [loading, setLoading] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [selectedResolution, setSelectedResolution] =
    useState<CameraResolution>({
      width: 0,
      height: 0
    });

  const streamRef = useRef<MediaStream | null>(null);
  const unwatchCameraTracksRef = useRef<() => void>(() => {});
  /** Constraint pair applied at open; re-applied after Scandit releases the camera. */
  const resolutionSnapshotRef = useRef<CameraResolution | null>(null);
  const restoreInFlightRef = useRef(false);
  const bridgeRef = useRef<RecordingBridge | null>(null);
  const isDesktopRef = useRef(isDesktop);
  isDesktopRef.current = isDesktop;

  const stopSourceTracks = useCallback((mediaStream: MediaStream | null) => {
    if (!mediaStream) return;
    mediaStream.getTracks().forEach((track) => track.stop());
  }, []);

  const stopRecordingBridge = useCallback(() => {
    const bridge = bridgeRef.current;
    if (!bridge) return;
    cancelAnimationFrame(bridge.rafId);
    if (bridge.healthIntervalId) clearInterval(bridge.healthIntervalId);
    bridge.unwatchContextLoss();
    try {
      bridge.video.pause();
    } catch {
      /* jsdom / some engines may not implement pause */
    }
    bridge.video.srcObject = null;
    bridge.canvasStream.getTracks().forEach((t) => t.stop());
    // Audio on recordingStream is shared with the camera stream — do not stop here.
    bridgeRef.current = null;
  }, []);

  const drawBridgeFrame = useCallback((bridge: RecordingBridge) => {
    const { video, canvas, ctx, minDrawIntervalMs, lockPortraitOutput } =
      bridge;
    const now = performance.now();

    if (
      minDrawIntervalMs > 0 &&
      bridge.lastDrawTime >= 0 &&
      now - bridge.lastDrawTime < minDrawIntervalMs
    ) {
      bridge.rafId = requestAnimationFrame(() => drawBridgeFrame(bridge));
      return;
    }

    if (
      video.readyState >= 2 &&
      video.videoWidth > 0 &&
      video.videoHeight > 0
    ) {
      if (lockPortraitOutput) {
        if (
          canvas.width !== MOBILE_RECORDING_RESOLUTION.width ||
          canvas.height !== MOBILE_RECORDING_RESOLUTION.height
        ) {
          canvas.width = MOBILE_RECORDING_RESOLUTION.width;
          canvas.height = MOBILE_RECORDING_RESOLUTION.height;
        }
        // Mobile Chrome often exposes landscape decoded frames on the offscreen
        // bridge video while the on-page preview already looks upright/portrait.
        if (video.videoWidth > video.videoHeight) {
          ctx.save();
          ctx.translate(canvas.width, 0);
          ctx.rotate(Math.PI / 2);
          ctx.drawImage(video, 0, 0, canvas.height, canvas.width);
          ctx.restore();
        } else {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
      } else {
        if (
          canvas.width !== video.videoWidth ||
          canvas.height !== video.videoHeight
        ) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      bridge.lastDrawTime = now;
      // A frozen camera still draws fine, so track source progress separately.
      if (video.currentTime !== bridge.lastVideoTime) {
        bridge.lastVideoTime = video.currentTime;
        bridge.lastFrameAdvanceTime = now;
      }
    }
    bridge.rafId = requestAnimationFrame(() => drawBridgeFrame(bridge));
  }, []);

  const startBridgeHealthWatch = useCallback((bridge: RecordingBridge) => {
    let previousSignature: string | null = null;
    let lastEmittedAt: number | null = null;

    bridge.healthIntervalId = setInterval(() => {
      const cameraStream = streamRef.current;
      const snapshot = buildRecordingHealthSnapshot({
        cameraVideoTrack: cameraStream?.getVideoTracks()[0],
        cameraAudioTrack: cameraStream?.getAudioTracks()[0],
        bridgeVideoTrack: bridge.canvasStream.getVideoTracks()[0],
        videoWidth: bridge.video.videoWidth,
        videoHeight: bridge.video.videoHeight,
        lastDrawTime: bridge.lastDrawTime,
        lastFrameAdvanceTime: bridge.lastFrameAdvanceTime,
        now: performance.now()
      });

      const signature = healthSignature(snapshot);
      const now = performance.now();
      if (
        !shouldEmitHealthLog({
          previousSignature,
          signature,
          lastEmittedAt,
          now
        })
      ) {
        return;
      }

      previousSignature = signature;
      lastEmittedAt = now;
      sendLogs(formatRecordingHealth(snapshot));
    }, HEALTH_POLL_INTERVAL_MS);
  }, []);

  /** Re-attached on every camera open / remount so events follow the live tracks. */
  const watchCameraTracks = useCallback((cameraStream: MediaStream | null) => {
    unwatchCameraTracksRef.current();
    unwatchCameraTracksRef.current = watchTrackLifecycle(cameraStream, "camera");
  }, []);

  const ensureRecordingBridge = useCallback(
    (cameraStream: MediaStream): MediaStream => {
      const existing = bridgeRef.current;
      if (existing) {
        if (existing.video.srcObject !== cameraStream) {
          existing.video.srcObject = cameraStream;
          void existing.video.play().catch(() => {});
        }
        return existing.recordingStream;
      }

      if (typeof document === "undefined") {
        throw new Error("ensureRecordingBridge requires a DOM environment");
      }

      const desktop = isDesktopRef.current;
      const lockPortraitOutput = !desktop;
      const minDrawIntervalMs = desktop ? 0 : MOBILE_BRIDGE_INTERVAL_MS;

      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.autoplay = true;
      video.srcObject = cameraStream;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) {
        throw new Error(
          "Failed to create 2D canvas context for recording bridge"
        );
      }
      if (typeof canvas.captureStream !== "function") {
        throw new Error(
          "canvas.captureStream is not supported in this browser"
        );
      }

      // Seed dimensions before captureStream so MediaRecorder locks the right size.
      // Mobile: always portrait 480x640 (do not follow landscape getSettings).
      // Desktop: unchanged — follow track settings (legacy 640x480 fallback).
      const settings = cameraStream.getVideoTracks()[0]?.getSettings();
      if (lockPortraitOutput) {
        canvas.width = MOBILE_RECORDING_RESOLUTION.width;
        canvas.height = MOBILE_RECORDING_RESOLUTION.height;
      } else {
        canvas.width = settings?.width || 640;
        canvas.height = settings?.height || 480;
      }

      const canvasStream = canvas.captureStream(settings?.frameRate || 30);
      const canvasTrack = canvasStream.getVideoTracks()[0];
      if (!canvasTrack) {
        throw new Error("canvas.captureStream produced no video track");
      }

      const audioTracks = cameraStream.getAudioTracks();
      const recordingStream = new MediaStream([canvasTrack, ...audioTracks]);
      const unwatchContextLoss = watchCanvasContextLoss(
        canvas,
        "recording-bridge"
      );

      const bridge: RecordingBridge = {
        video,
        canvas,
        ctx,
        rafId: 0,
        canvasStream,
        recordingStream,
        lastDrawTime: -1,
        lastFrameAdvanceTime: -1,
        lastVideoTime: -1,
        healthIntervalId: null,
        minDrawIntervalMs,
        lockPortraitOutput,
        unwatchContextLoss
      };
      bridgeRef.current = bridge;

      void video.play().catch(() => {});
      bridge.rafId = requestAnimationFrame(() => drawBridgeFrame(bridge));
      startBridgeHealthWatch(bridge);

      sendLogs(
        `Recording bridge started (canvas ${canvas.width}x${canvas.height}, audio tracks=${audioTracks.length}, throttleMs=${minDrawIntervalMs}${lockPortraitOutput ? ", lockPortraitOutput=true" : ""})`
      );
      return recordingStream;
    },
    [drawBridgeFrame, startBridgeHealthWatch]
  );

  const resolveResolution = useCallback(
    (
      primary: CameraResolution | null | undefined,
      fallback?: CameraResolution
    ): CameraResolution | null => {
      if (
        typeof primary?.width === "number" &&
        typeof primary?.height === "number" &&
        primary.width > 0 &&
        primary.height > 0
      ) {
        return { width: primary.width, height: primary.height };
      }
      if (
        typeof fallback?.width === "number" &&
        typeof fallback?.height === "number" &&
        fallback.width > 0 &&
        fallback.height > 0
      ) {
        return { width: fallback.width, height: fallback.height };
      }
      if (selectedResolution.width > 0 && selectedResolution.height > 0) {
        return {
          width: selectedResolution.width,
          height: selectedResolution.height
        };
      }
      return null;
    },
    [selectedResolution]
  );

  const requestPermission = useCallback(
    async (desktop: boolean, resolution: CameraResolution) => {
      setLoading(true);
      setIsDesktop(desktop);

      // Mobile: 640x480 constraints → upright preview on iOS.
      const openResolution = desktop
        ? resolution
        : {
            width: CAMERA_RESOLUTION.MOBILE.WIDTH,
            height: CAMERA_RESOLUTION.MOBILE.HEIGHT
          };
      setSelectedResolution(openResolution);

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: { ideal: openResolution.width },
            height: { ideal: openResolution.height },
            facingMode: "user",
            aspectRatio: openResolution.width / openResolution.height
          }
        });

        const videoTrack = mediaStream.getVideoTracks()[0];
        const settings = videoTrack?.getSettings();
        sendLogs(
          `Camera settings on request permission: ${JSON.stringify(settings)} (opened with ${openResolution.width}x${openResolution.height})`
        );

        // Keep tracks alive — source stream stays open for preview + bridge.
        streamRef.current = mediaStream;
        watchCameraTracks(mediaStream);
        setStream(mediaStream);
        setCameraStatus("previewing");
      } catch (e) {
        console.log(e, "error requesting permission");
        streamRef.current = null;
        setStream(null);
        setCameraStatus("denied");
      } finally {
        setLoading(false);
      }
    },
    [watchCameraTracks]
  );

  const cloneRecordingStreams = useCallback(() => {
    const source = streamRef.current;
    if (!source) {
      throw new Error(
        "cloneRecordingStreams called before camera permission granted"
      );
    }

    const recordingSource = ensureRecordingBridge(source);

    return {
      s3Stream: recordingSource.clone(),
      beamStream: recordingSource.clone()
    };
  }, [ensureRecordingBridge]);

  const stopCamera = useCallback(() => {
    stopRecordingBridge();
    unwatchCameraTracksRef.current();
    unwatchCameraTracksRef.current = () => {};
    stopSourceTracks(streamRef.current);
    streamRef.current = null;
    setStream(null);
  }, [stopRecordingBridge, stopSourceTracks]);

  const updateCameraResolution = useCallback(
    async (width: number, height: number) => {
      const activeStream = streamRef.current ?? stream;
      if (!activeStream) return;

      const videoTrack = activeStream.getVideoTracks()[0];
      if (!videoTrack) {
        console.error("No video track found.");
        return;
      }

      const newConstraints: MediaTrackConstraints = {
        width: { ideal: width },
        height: { ideal: height },
        facingMode: "user",
        aspectRatio: width / height
      };

      try {
        await videoTrack.applyConstraints(newConstraints);
        if (
          selectedResolution.width !== width ||
          selectedResolution.height !== height
        ) {
          setSelectedResolution({ width, height });
        }
        console.log(
          `Resolution updated to: ${JSON.stringify(
            newConstraints.width
          )} x ${JSON.stringify(newConstraints.height)}`
        );
      } catch (err) {
        console.error("Failed to apply constraints:", err);
      }
    },
    [stream, selectedResolution.width, selectedResolution.height]
  );

  /**
   * Snapshot the constraint pair to re-apply after Scandit — not live getSettings /
   * videoWidth (iOS often reports the opposite orientation from the on-screen look).
   */
  const snapshotCameraResolution = useCallback(
    (fallback?: CameraResolution, _video?: HTMLVideoElement | null) => {
      const fromOpen =
        selectedResolution.width > 0 && selectedResolution.height > 0
          ? {
              width: selectedResolution.width,
              height: selectedResolution.height
            }
          : null;

      const snapshot = resolveResolution(fromOpen, fallback);
      resolutionSnapshotRef.current = snapshot;
      sendLogs(`Snapshotted camera resolution: ${JSON.stringify(snapshot)}`);
      return snapshot;
    },
    [selectedResolution, resolveResolution]
  );

  const waitForPreviewFrames = async (
    preview: HTMLVideoElement,
    timeoutMs = 1500
  ): Promise<void> => {
    if (!preview.paused && preview.readyState >= 2 && preview.videoWidth > 0) {
      return;
    }
    if (typeof preview.addEventListener !== "function") {
      return;
    }
    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        preview.removeEventListener("loadeddata", finish);
        preview.removeEventListener("playing", finish);
        resolve();
      };
      preview.addEventListener("loadeddata", finish);
      preview.addEventListener("playing", finish);
      globalThis.setTimeout?.(finish, timeoutMs);
    });
  };

  const playPreviewSafely = async (
    preview: HTMLVideoElement
  ): Promise<string | null> => {
    try {
      await preview.play();
      return null;
    } catch (err) {
      if (String(err).includes("AbortError")) {
        try {
          await preview.play();
          return null;
        } catch (retryErr) {
          return String(retryErr);
        }
      }
      return String(err);
    }
  };

  const remountCameraKeepingAudio = useCallback(
    async (
      target: CameraResolution,
      previewVideo?: HTMLVideoElement | null
    ): Promise<MediaStream> => {
      const previous = streamRef.current;
      if (!previous) {
        throw new Error("remountCameraKeepingAudio: no active camera stream");
      }

      const liveAudioTracks = previous
        .getAudioTracks()
        .filter((t) => t.readyState === "live");
      const oldVideoTracks = previous.getVideoTracks();
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: target.width },
        height: { ideal: target.height },
        facingMode: "user",
        aspectRatio: target.width / target.height
      };

      // Prefer opening the new track while the old one still paints the preview
      // (avoids Safari black flash). Fall back to stop-then-open on devices that
      // reject concurrent front-camera sessions (common on iOS).
      let fresh: MediaStream;
      let acquiredWhileOldLive = false;
      try {
        fresh = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: videoConstraints
        });
        acquiredWhileOldLive = true;
      } catch (concurrentErr) {
        sendLogs(
          `Concurrent getUserMedia failed during remount; stop-then-open fallback: ${String(concurrentErr)}`
        );
        oldVideoTracks.forEach((t) => t.stop());
        fresh = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: videoConstraints
        });
      }

      const newVideo = fresh.getVideoTracks()[0];
      if (!newVideo) {
        fresh.getTracks().forEach((t) => t.stop());
        throw new Error("remountCameraKeepingAudio: no video track on remount");
      }

      const remounted = new MediaStream([newVideo, ...liveAudioTracks]);

      // Bind + wait for frames WHILE old track still live so preview never
      // paints a dead/zero-size stream (Safari black flash + silhouette jump).
      if (previewVideo) {
        if (previewVideo.srcObject !== remounted) {
          previewVideo.srcObject = remounted;
        }
        await playPreviewSafely(previewVideo);
        await waitForPreviewFrames(previewVideo);
        if (previewVideo.paused) {
          await playPreviewSafely(previewVideo);
        }
      }

      if (acquiredWhileOldLive) {
        oldVideoTracks.forEach((t) => t.stop());
      }

      streamRef.current = remounted;
      watchCameraTracks(remounted);
      setStream(remounted);
      setSelectedResolution(target);

      if (bridgeRef.current) {
        ensureRecordingBridge(remounted);
      }

      return remounted;
    },
    [ensureRecordingBridge, watchCameraTracks]
  );

  /**
   * After Scandit (UserFacing): iOS leaves a tighter FOV that applyConstraints
   * cannot undo. Remount video-only while the canvas bridge + original audio
   * keep S3/Beam MediaRecorders on one continuous session (no soft-swap).
   */
  const restoreCameraResolution = useCallback(
    async (
      fallback?: CameraResolution,
      video?: HTMLVideoElement | null
    ): Promise<RestoreCameraResult> => {
      const target = resolveResolution(resolutionSnapshotRef.current, fallback);
      if (!target) {
        sendLogs("restoreCameraResolution skipped: no snapshot or fallback");
        return {
          remounted: false,
          softSwapRequired: false,
          stream: streamRef.current
        };
      }
      if (restoreInFlightRef.current) {
        sendLogs("restoreCameraResolution skipped: already in flight");
        return {
          remounted: false,
          softSwapRequired: false,
          stream: streamRef.current
        };
      }
      restoreInFlightRef.current = true;

      const videoW = video?.videoWidth ?? 0;
      const videoH = video?.videoHeight ?? 0;
      const track = streamRef.current?.getVideoTracks()[0];
      const bridgeActive = !!bridgeRef.current;

      try {
        sendLogs(
          `Restoring camera via remount (bridge=${bridgeActive}) to: ${target.width}x${target.height} (video was ${videoW}x${videoH}, track=${track?.readyState})`
        );

        // Ensure bridge exists before remount so recorders stay on canvas track.
        if (streamRef.current && !bridgeRef.current) {
          ensureRecordingBridge(streamRef.current);
        }

        const remountedStream = await remountCameraKeepingAudio(target, video);

        return {
          remounted: true,
          softSwapRequired: false,
          stream: remountedStream
        };
      } catch (err) {
        sendLogs(`restoreCameraResolution failed: ${String(err)}`);
        console.error("Failed to restore camera after Scandit:", err);
        return {
          remounted: false,
          softSwapRequired: false,
          stream: streamRef.current
        };
      } finally {
        restoreInFlightRef.current = false;
      }
    },
    [resolveResolution, remountCameraKeepingAudio, ensureRecordingBridge]
  );

  useEffect(() => {
    return () => {
      stopRecordingBridge();
      unwatchCameraTracksRef.current();
      unwatchCameraTracksRef.current = () => {};
      stopSourceTracks(streamRef.current);
      streamRef.current = null;
    };
  }, [stopRecordingBridge, stopSourceTracks]);

  /** `performance.now()` of last successful bridge draw, or null if no bridge / never drawn (`-1`). */
  const getBridgeLastDrawTime = useCallback((): number | null => {
    const bridge = bridgeRef.current;
    if (!bridge) return null;
    return bridge.lastDrawTime;
  }, []);

  return {
    stream,
    cameraStatus,
    selectedResolution,
    isDesktop,
    loading,
    requestPermission,
    cloneRecordingStreams,
    stopCamera,
    updateCameraResolution,
    snapshotCameraResolution,
    restoreCameraResolution,
    getBridgeLastDrawTime
  };
}
