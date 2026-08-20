import { sendLogs } from "@/utils/sendAnalytics.utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const BEAM_BLOB_INTERVAL_MS = 30000;
const DATAAVAILABLE_TIMEOUT_MS = 500;

type BeamRecorderOptions = {
  mimeType: string;
  audioBitsPerSecond: number;
  videoBitsPerSecond: number;
};

type RotateReason = "interval" | "request";

/**
 * Beam MediaRecorder consumer. Accepts a MediaStream (typically a clone from
 * useSharedCamera) and never calls getUserMedia.
 */
export default function useMediaFunctions() {
  const [mimeType, setMimeType] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isDesktopRef = useRef(true);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderOptionsRef = useRef<BeamRecorderOptions | null>(null);
  const rotateInFlightRef = useRef(false);
  const rotateBeamBlobRef = useRef<(reason: RotateReason) => Promise<void>>(
    async () => undefined
  );

  const types = useMemo(() => ["video/mp4", "video/webm"], []);

  const [loading, setLoading] = useState(false);
  useEffect(() => {
    for (const type of types) {
      const isSupported = MediaRecorder.isTypeSupported(type);
      if (isSupported) {
        console.log(type, "is supported Beam recorder format");
        if (type === "video/mp4") {
          setMimeType("video/mp4; codecs=avc1.64001e, mp4a.40.2");
        } else {
          // "video/webm;codecs=vp8,opus"
          setMimeType("video/webm; codecs=vp8,opus");
        }
        break;
      }
    }
  }, [types]);

  // Cleanup: stop recorder + clone tracks only (never the shared source).
  useEffect(() => {
    return () => {
      console.log("useMediaFunctions unmounting - cleaning up media resources");

      if (mediaRecorderRef.current) {
        console.log("useMediaFunctions cleanup - stopping mediaRecorder");
        const mediaRecorder = mediaRecorderRef.current;
        mediaRecorder.stream.getTracks().forEach((track) => {
          track.stop();
        });
        mediaRecorder.stop();
        intervalRef.current && clearInterval(intervalRef?.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const clearBlobInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const scheduleBlobInterval = useCallback(() => {
    clearBlobInterval();
    intervalRef.current = setInterval(() => {
      void rotateBeamBlobRef.current("interval");
    }, BEAM_BLOB_INTERVAL_MS);
  }, [clearBlobInterval]);

  const waitForDataAvailableThen = useCallback(
    async (
      recorder: MediaRecorder,
      previousHandler: MediaRecorder["ondataavailable"]
    ) => {
      await new Promise<void>((resolve) => {
        let settled = false;
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        const finish = () => {
          if (settled) return;
          settled = true;
          if (timeoutId !== undefined) clearTimeout(timeoutId);
          resolve();
        };

        recorder.ondataavailable = (event: BlobEvent) => {
          previousHandler?.call(recorder, event);
          finish();
        };

        if (recorder.state !== "recording") {
          recorder.ondataavailable = previousHandler;
          finish();
          return;
        }

        timeoutId = setTimeout(() => {
          sendLogs(
            "Beam rotate mobile: dataavailable timeout, recreating MediaRecorder anyway"
          );
          finish();
        }, DATAAVAILABLE_TIMEOUT_MS);

        recorder.stop();
      });
    },
    []
  );

  const rotateBeamBlob = useCallback(
    async (reason: RotateReason) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder) return;

      if (reason === "request") {
        sendLogs("request new Beam blob");
      } else {
        sendLogs(
          mediaRecorder.state,
          isDesktopRef.current
            ? " start Beam blob recording"
            : "new blob recording"
        );
      }

      if (rotateInFlightRef.current) {
        sendLogs("Beam rotate skipped: rotation already in flight");
        return;
      }

      if (mediaRecorder.state !== "recording") {
        sendLogs(
          `Beam rotate skipped: recorder state is ${mediaRecorder.state}`
        );
        return;
      }

      rotateInFlightRef.current = true;
      clearBlobInterval();

      try {
        if (isDesktopRef.current) {
          sendLogs("Beam rotate desktop: stop/start same MediaRecorder");
          mediaRecorder.stop();
          mediaRecorder.start();
        } else {
          const previousHandler = mediaRecorder.ondataavailable;
          const stream = streamRef.current ?? mediaRecorder.stream;
          const options = recorderOptionsRef.current;

          if (!stream || !options) {
            sendLogs(
              "Beam rotate mobile: missing stream/options, falling back to stop/start"
            );
            mediaRecorder.stop();
            mediaRecorder.start();
          } else {
            sendLogs("Beam rotate mobile: recreate MediaRecorder");
            await waitForDataAvailableThen(mediaRecorder, previousHandler);

            const next = new MediaRecorder(stream, options);
            next.ondataavailable = previousHandler;
            mediaRecorderRef.current = next;
            next.start();
          }
        }
      } finally {
        rotateInFlightRef.current = false;
        scheduleBlobInterval();
      }
    },
    [clearBlobInterval, scheduleBlobInterval, waitForDataAvailableThen]
  );

  useEffect(() => {
    rotateBeamBlobRef.current = rotateBeamBlob;
  }, [rotateBeamBlob]);

  const stopMediaRecorder = () => {
    sendLogs("Stop Beam recording");
    if (mediaRecorderRef.current) {
      const mediaRecorder = mediaRecorderRef.current;

      if (mediaRecorder.state === "recording") {
        // Normal path: stop() will fire ondataavailable with the final chunk.
        mediaRecorder.stop();
      } else if (mediaRecorder.state === "inactive") {
        // Race condition: the 30-second interval already called stop() and the
        // recorder is inactive. Mobile Safari silently no-ops on a second stop()
        // and fires no dataavailable event, so hasFinalBlobProcessed would stay
        // false and handleSubmit would never be called. Synthesise the event
        // with an empty blob — useBeamUpload's zero-size guard handles this and
        // still sets hasFinalBlobProcessed = true.
        sendLogs(
          "Stop Beam recording: recorder already inactive, generate empty blob on final dataavailable"
        );
        mediaRecorder.ondataavailable?.({
          data: new Blob([], { type: mediaRecorder.mimeType })
        } as BlobEvent);
      }

      clearBlobInterval();
      // Stop clone tracks only — never the shared source from useSharedCamera.
      mediaRecorder.stream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  };
  const onAIError = () => {
    console.log("AI Error");
    if (mediaRecorderRef.current) {
      const mediaRecorder = mediaRecorderRef.current;
      mediaRecorder.ondataavailable = null;
      clearBlobInterval();
    }
  };

  /**
   * Start Beam MediaRecorder on a provided stream (typically a clone from
   * useSharedCamera). Does not call getUserMedia.
   */
  const startMediaRecorder = async (
    isDesktop: boolean,
    mediaStream: MediaStream
  ) => {
    setLoading(true);
    isDesktopRef.current = isDesktop;

    // Brief settle for MediaRecorder warm-up (not camera open).
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const videoTrack = mediaStream.getVideoTracks()[0];
      const settings = videoTrack?.getSettings();
      sendLogs(`Beam stream settings: ${JSON.stringify(settings)}`);

      streamRef.current = mediaStream;
      setStream(mediaStream);

      let selectedMimeType = "";
      for (const type of types) {
        const isSupported = MediaRecorder.isTypeSupported(type);
        if (isSupported) {
          if (type === "video/mp4") {
            selectedMimeType = "video/mp4; codecs=avc1.64001e, mp4a.40.2";
          } else {
            selectedMimeType = "video/webm; codecs=vp8,opus";
          }
          break;
        }
      }

      console.log("Beam recorder mimeType", selectedMimeType);
      const options: BeamRecorderOptions = {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: 2500000
      };
      recorderOptionsRef.current = options;

      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      mediaRecorderRef.current = new MediaRecorder(mediaStream, options);
      mediaRecorderRef.current.start();
      scheduleBlobInterval();
    } catch (error) {
      sendLogs(`Beam MediaRecorder start failed ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestData = useCallback(() => {
    return rotateBeamBlob("request");
  }, [rotateBeamBlob]);

  /**
   * After shared-camera remount: flush current Beam blob, stop old clone tracks,
   * and recreate MediaRecorder on a fresh clone (same pattern as mobile rotate).
   */
  const swapBeamRecordingStream = async (mediaStream: MediaStream) => {
    sendLogs("Beam swapRecordingStream: restarting MediaRecorder on new clone");
    clearBlobInterval();

    const previous = mediaRecorderRef.current;
    const previousHandler = previous?.ondataavailable ?? null;
    const options = recorderOptionsRef.current;

    if (previous) {
      if (previous.state === "recording") {
        await waitForDataAvailableThen(previous, previousHandler);
      }
      previous.stream.getTracks().forEach((track) => track.stop());
    } else if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    const videoTrack = mediaStream.getVideoTracks()[0];
    sendLogs(
      `Beam swapRecordingStream settings: ${JSON.stringify(videoTrack?.getSettings())}`
    );

    streamRef.current = mediaStream;
    setStream(mediaStream);

    if (!options) {
      sendLogs("Beam swapRecordingStream: missing recorder options, abort");
      return;
    }

    const next = new MediaRecorder(mediaStream, options);
    next.ondataavailable = previousHandler;
    mediaRecorderRef.current = next;
    next.start();
    scheduleBlobInterval();
  };

  return {
    mediaRecorderRef,
    videoRef,
    mimeType,
    startBeamRecording: startMediaRecorder,
    stopBeamRecording: stopMediaRecorder,
    swapBeamRecordingStream,
    generateBeamBlob: handleRequestData,
    onAIError,
    loading,
    stream
  };
}
