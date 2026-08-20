import {
  getMultipartUploadPresignedUrl,
  InitializeMultipartUploadId
} from "@/app/test-collection/[slug]/action";
import {
  pushIntoCompletedParts,
  setPartNumber,
  setUploadId
} from "@/redux/slices/drugTest";
import { fetchRetry } from "@/utils/fetchWithRetry";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { chunkStorage } from "@/utils/S3ChunkDB";
import { sendLogs } from "@/utils/sendAnalytics.utils";
import { base64ToBlob, blobToBase64WithoutPrefix } from "@/utils/utils";
import {
  formatTrackHealth,
  snapshotTrackHealth,
  watchTrackLifecycle
} from "@/utils/recordingTrackDiagnostics";
import useGetDeviceInfo from "./useGetDeviceInfo";
import { Browser, MobilePlatform } from "@/types/constants";

const types = [
  { mimeType: "video/mp4", codec: "avc1.64001e, mp4a.40.2" },
  { mimeType: "video/webm", codec: "vp8,opus" }
];

export type S3RecordingStatus = "recording" | "recorded" | "stopped";

export default function useMediaFunctionCapture() {
  const dispatch = useDispatch();
  const { browserName, osName } = useGetDeviceInfo();

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<S3RecordingStatus>("stopped");
  const [loading, setLoading] = useState(false);
  const chunksRef = useRef<Blob[]>([]);
  const mediaCaptureRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const partNumberRef = useRef<number>(0);
  const uploadIdRef = useRef("");
  const completedPartsRef = useRef<any[]>([]);
  const filenameRef = useRef("");
  const isFinalChunkRef = useRef(false);
  const hasProcessedFinalChunkRef = useRef(false);
  const mimeTypeRef = useRef("");
  const codecRef = useRef("");
  /** `performance.now()` of last uploadable S3 blob, or null if none yet. */
  const lastS3ChunkTimeRef = useRef<number | null>(null);
  /** `performance.now()` when MediaRecorder.start() ran for this session. */
  const s3RecordingStartTimeRef = useRef<number | null>(null);
  const unwatchRecorderTracksRef = useRef<() => void>(() => {});

  // Cleanup: stop recorder + clone tracks only (never the shared source).
  useEffect(() => {
    return () => {
      console.log(
        "useMediaFunctionsCapture unmounting - cleaning up media resources"
      );

      // Detach before stopping so planned teardown does not log track events.
      unwatchRecorderTracksRef.current();
      unwatchRecorderTracksRef.current = () => {};

      if (mediaCaptureRef.current) {
        console.log(
          "useMediaFunctionsCapture cleanup - stopping mediaRecorder"
        );
        const mediaRecorder = mediaCaptureRef.current;
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach((track) => {
          track.stop();
        });
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const stopMediaRecorder = (isFinalChunk: boolean = false) => {
    try {
      isFinalChunkRef.current = isFinalChunk;
      unwatchRecorderTracksRef.current();
      unwatchRecorderTracksRef.current = () => {};
      if (mediaCaptureRef.current) {
        const mediaRecorder = mediaCaptureRef.current;
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach((track) => {
          track.stop();
        });

        s3RecordingStartTimeRef.current = null;
        setStatus("recorded");
        console.log("Stop S3 recording and status set to recorded");
      }
    } catch (e) {
      s3RecordingStartTimeRef.current = null;
      setStatus("stopped");
      console.log("error stopping media recorder", e);
    }
  };

  /**
   * Last uploadable S3 chunk time, or recording start if none yet.
   * `null` when not recording (no start time).
   */
  const getLastS3ChunkTime = useCallback((): number | null => {
    return lastS3ChunkTimeRef.current ?? s3RecordingStartTimeRef.current;
  }, []);

  /**
   * Start S3 MediaRecorder on a provided stream (typically a clone from
   * useSharedCamera). Does not call getUserMedia.
   */
  const startMediaRecorder = async (
    filename: string,
    mediaStream: MediaStream
  ) => {
    filenameRef.current = filename;
    setLoading(true);

    // Reset part number to ensure we start from 0
    partNumberRef.current = 0;
    completedPartsRef.current = [];
    chunksRef.current = [];
    isFinalChunkRef.current = false;
    hasProcessedFinalChunkRef.current = false;
    lastS3ChunkTimeRef.current = null;
    s3RecordingStartTimeRef.current = null;

    try {
      const videoTrack = mediaStream.getVideoTracks()[0];
      unwatchRecorderTracksRef.current();
      unwatchRecorderTracksRef.current = watchTrackLifecycle(
        mediaStream,
        "s3-recorder"
      );

      const settings = videoTrack?.getSettings();
      sendLogs(`S3 stream setting: ${JSON.stringify(settings)}`);

      streamRef.current = mediaStream;
      setStream(mediaStream);

      let selectedMimeType = "";
      for (const type of types) {
        const isSupported = MediaRecorder.isTypeSupported(type.mimeType);
        if (isSupported) {
          initiateMultipartUpload(filenameRef.current, type.mimeType);
          mimeTypeRef.current = type.mimeType;
          sendLogs(
            `MIME type ${type.mimeType} is supported for S3 recorder -> Created S3 uploadId`
          );
          codecRef.current = type.codec;
          selectedMimeType = type.mimeType;
          break;
        }
        sendLogs(
          `MIME type ${type.mimeType} is not supported for S3 recorder -> Failed to create S3 uploadId`
        );
      }

      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      mediaCaptureRef.current = new MediaRecorder(mediaStream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: 2500000
      });

      const mediaRecorder = mediaCaptureRef.current;
      setStatus("recording");
      mediaRecorder.ondataavailable = handleDataAvailableForMediaCapture;
      s3RecordingStartTimeRef.current = performance.now();
      // Lower timeslice to 10000 for Safari / iOS
      if (
        browserName === Browser.Safari ||
        browserName === Browser.MobileSafari ||
        osName === MobilePlatform.iOS
      ) {
        mediaRecorder.start(10000);
      } else {
        mediaRecorder.start(30000);
      }
    } catch (e) {
      console.log("error starting media recorder", e);
      setStatus("stopped");
      const message = e instanceof Error ? e.message : String(e);
      throw new Error("Failed to start media recorder: " + message);
    } finally {
      setLoading(false);
    }
  };

  // Initialize S3 multipart upload
  const initiateMultipartUpload = async (
    fileName: string,
    blobType: string
  ) => {
    try {
      const response = await InitializeMultipartUploadId(fileName, blobType);
      const uploadId = response as string;
      uploadIdRef.current = uploadId;
      dispatch(setUploadId(uploadId));
      sendLogs(
        `InitializeMultipartUploadId ${uploadId}\nfilename: ${fileName}`
      );
      return response;
    } catch (e) {
      console.log(e, "initialize multipart error");
    }
  };

  const checkBlobSize = (data: Blob, isFinal: boolean) => {
    // If there are accumulated chunks, combine them with current data
    if (data.size === 0) {
      return null;
    }
    if (chunksRef.current.length) {
      const blob = new Blob([...chunksRef.current, data]);
      console.log(blob.size, "blob size");
      // Return combined blob if it's final chunk or size >= 5MB
      if (isFinal || blob.size >= 5242880) {
        chunksRef.current = [];
        return blob;
      }
      // Keep accumulating if combined blob is still too small
      chunksRef.current = [blob];
      return null;
    }

    // For final chunk, return directly
    if (isFinal) {
      if (data.size < 2000) {
        chunksRef.current.push(data);
        return null;
      }
      return data;
    }

    // For chunks larger than 5MB, return directly
    if (data.size >= 5242880) {
      return data;
    }

    // Accumulate small chunks
    chunksRef.current.push(data);
    return null;
  };

  // Upload a part of the video
  const uploadPart = async (
    chunk: Blob,
    key: string,
    partNumber: number,
    contentType: string
  ): Promise<boolean> => {
    try {
      const presignedUrl = await getMultipartUploadPresignedUrl(
        uploadIdRef.current,
        key,
        partNumber,
        contentType
      );

      const startTime = performance.now();
      const response = await fetchRetry(presignedUrl, 1000, 2, {
        method: "PUT",
        headers: {
          "Content-Type": mimeTypeRef.current.split(";")[0]
        },
        body: chunk,
        signal: AbortSignal.timeout(20000)
      });
      const endTime = performance.now();
      const latencyMs = endTime - startTime;
      sendLogs(`Network request latency: ${latencyMs.toFixed(2)} ms`);

      if (response.ok) {
        const etag = response.headers.get("ETag");

        await chunkStorage.updateChunk(filenameRef.current, partNumber, {
          uploadId: uploadIdRef.current,
          uploadCompleted: true,
          etag: etag ?? ""
        });
        if (!etag) {
          sendLogs(`No ETag received for part ${partNumber}`);
          throw new Error(`No ETag received for part ${partNumber}`);
        }

        // Check if this part number already exists in completedPartsRef
        const existingPartIndex = completedPartsRef.current.findIndex(
          (part) => part.PartNumber === partNumber
        );

        if (existingPartIndex >= 0) {
          sendLogs(
            `Part ${partNumber} already exists in completed parts. Replacing.`
          );
          // Replace the existing part
          completedPartsRef.current[existingPartIndex] = {
            ETag: etag,
            PartNumber: partNumber
          };
        } else {
          // Add new part
          completedPartsRef.current.push({
            ETag: etag,
            PartNumber: partNumber
          });
        }
        sendLogs(`Part ${partNumber} uploaded successfully with ETag: ${etag}`);
        dispatch(
          pushIntoCompletedParts({
            ETag: etag,
            PartNumber: partNumber
          })
        );

        return true;
      }

      sendLogs(`Uploading chunk ${partNumber} failed ${response}`);

      return false;
    } catch (err) {
      // console.error(`Failed to upload part ${partNumber}:`, err);
      sendLogs(`Failed to upload part ${partNumber}: ${err}`);
      return false;
    }
  };

  // Modify handleDataAvailableForMediaCapture to include retry mechanism
  const handleDataAvailableForMediaCapture = async (data: BlobEvent) => {
    try {
      if (!data.data || data.data.size === 0) {
        sendLogs(`Skipping invalid empty S3 chunks`);
        return;
      }

      // Check if we've already processed a final chunk - if so, ignore subsequent chunks
      // If isFinalChunkRef is true but we've already processed one, skip this chunk
      if (isFinalChunkRef.current && hasProcessedFinalChunkRef.current) {
        console.log(
          `Skipping duplicate final chunk: size=${data.data.size}, partNumber=${partNumberRef.current}`
        );
        return;
      }
      // Check if we've already processed a final chunk - if so, ignore subsequent chunks
      const isCurrentlyFinal =
        isFinalChunkRef.current && !hasProcessedFinalChunkRef.current;

      console.log(
        `Processing chunk: size=${data.data.size}, partNumber=${partNumberRef.current}, isFinal=${isFinalChunkRef.current}, hasProcessedFinal=${hasProcessedFinalChunkRef.current}`
      );
      // Ties each recorded part to track state: a frozen picture with live audio
      // keeps producing valid chunks, so the blob alone cannot show the failure.
      // const recorderStream = streamRef.current;
      // sendLogs(
      //   `[ChunkTrackHealth] part=${partNumberRef.current + 1} size=${data.data.size} ` +
      //     `${formatTrackHealth("video", snapshotTrackHealth(recorderStream?.getVideoTracks()[0]))} ` +
      //     `${formatTrackHealth("audio", snapshotTrackHealth(recorderStream?.getAudioTracks()[0]))}`
      // );
      // lastS3ChunkTimeRef.current = performance.now();

      // const blob = checkBlobSize(data.data, isFinalChunkRef.current);
      // if (blob) {
      //   // Increment part number before using it
      //   partNumberRef.current += 1;
      //   const currentPartNumber = partNumberRef.current;

      //   // Mark that we've processed a final chunk if this is the final one
      //   if (isCurrentlyFinal) {
      //     hasProcessedFinalChunkRef.current = true;
      //     isFinalChunkRef.current = false;
      //   }

      //   console.log(
      //     `Uploading part ${currentPartNumber} of size ${blob.size} bytes`
      //   );
      //   dispatch(setPartNumber(currentPartNumber));

      //   // Immediate retry mechanism
      //   let uploadSuccess = false;
      //   let retryCount = 0;
      //   const maxUploadRetries = 2;
      //   const mimeType = mimeTypeRef.current || "video/mp4";
      //   const base64Chunk = await blobToBase64WithoutPrefix(blob);

      //   await chunkStorage.saveChunk({
      //     base64Chunk: base64Chunk,
      //     partNumber: currentPartNumber,
      //     uploadId: uploadIdRef.current,
      //     filename: filenameRef.current,
      //     uploadCompleted: false,
      //     etag: "",
      //     type: mimeType
      //   });

      //   while (!uploadSuccess && retryCount < maxUploadRetries) {
      //     try {
      //       uploadSuccess = await uploadPart(
      //         blob,
      //         filenameRef.current,
      //         currentPartNumber,
      //         mimeType
      //       );

      //       if (uploadSuccess) {
      //         break;
      //       }

      //       retryCount++;
      //       if (retryCount === maxUploadRetries) {
      //         sendLogs(
      //           `Chunk ${currentPartNumber} after ${maxUploadRetries} failed attempts -> update retryCount`
      //         );
      //         await chunkStorage.updateChunk(
      //           filenameRef.current,
      //           currentPartNumber,
      //           {
      //             uploadId: uploadIdRef.current,
      //             uploadCompleted: false,
      //             etag: "",
      //             retryCount: retryCount
      //           }
      //         );
      //       } else {
      //         // Wait before next retry with exponential backoff
      //         await new Promise((resolve) =>
      //           setTimeout(resolve, 1000 * Math.pow(2, retryCount))
      //         );
      //       }
      //     } catch (error) {
      //       retryCount++;
      //       console.error(
      //         `Upload attempt ${retryCount} failed for part ${currentPartNumber}:`,
      //         error
      //       );
      //     }
      //   }
      // }
    } catch (e) {
      console.error("Error in handleDataAvailableForMediaCapture:", e);
    } finally {
      if (
        mediaCaptureRef.current &&
        hasProcessedFinalChunkRef.current &&
        data.data.size > 0
      ) {
        mediaCaptureRef.current.ondataavailable = null;
        console.log("Cleaned up ondataavailable after final chunk");
      }
    }
  };

  const verifyFailedParts = async () => {
    const pendingTestCheck = await chunkStorage.checkDatabaseAndObjectStore();
    if (!pendingTestCheck) {
      sendLogs("Database and S3Chunk store check failed");
      return;
    }

    const failedChunks = await chunkStorage.retrieveFailedChunks(
      filenameRef.current,
      2
    );
    if (!failedChunks.length) {
      sendLogs("No S3 failed chunks found!");
      return;
    }

    const sortedChunks = [...failedChunks].sort(
      (a, b) => a.partNumber - b.partNumber
    );

    const mimeType = mimeTypeRef.current || "video/mp4";
    sendLogs(
      `Found ${failedChunks.length} failed parts: ${JSON.stringify(
        failedChunks.map((c) => c.partNumber)
      )}, retrying upload...`
    );
    for (const chunkItem of sortedChunks) {
      try {
        const base64SChunk = chunkItem.base64Chunk;
        const cleanedBase64SChunk = base64SChunk.includes(",")
          ? base64SChunk.split(",")[1]
          : base64SChunk;

        const chunk = await base64ToBlob(cleanedBase64SChunk);
        console.log(`Reupload part ${chunkItem.partNumber} to S3...`);
        await uploadPart(
          chunk,
          filenameRef.current,
          chunkItem.partNumber,
          mimeType
        );
      } catch (error) {
        console.error(
          `S3 part ${chunkItem.partNumber} reupload failed: ${error}`
        );
      }
    }
  };

  /**
   * After shared-camera remount: soft-stop the current MediaRecorder (flush one
   * multipart part, do NOT finalize the upload), swap onto a fresh clone, and
   * keep recording with the same uploadId / part sequence.
   */
  const swapS3RecordingStream = async (mediaStream: MediaStream) => {
    const previous = mediaCaptureRef.current;
    sendLogs("S3 swapRecordingStream: restarting MediaRecorder on new clone");

    if (previous) {
      await new Promise<void>((resolve) => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          resolve();
        };
        previous.addEventListener("stop", () => finish(), { once: true });
        try {
          if (previous.state === "recording") {
            previous.requestData();
            previous.stop();
          } else {
            finish();
          }
        } catch {
          finish();
        }
      });
      previous.stream.getTracks().forEach((track) => track.stop());
    } else if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    const videoTrack = mediaStream.getVideoTracks()[0];
    sendLogs(
      `S3 swapRecordingStream settings: ${JSON.stringify(videoTrack?.getSettings())}`
    );

    streamRef.current = mediaStream;
    setStream(mediaStream);

    const selectedMimeType = mimeTypeRef.current;
    mediaCaptureRef.current = new MediaRecorder(mediaStream, {
      mimeType: selectedMimeType,
      audioBitsPerSecond: 128000,
      videoBitsPerSecond: 2500000
    });
    const mediaRecorder = mediaCaptureRef.current;
    mediaRecorder.ondataavailable = handleDataAvailableForMediaCapture;
    setStatus("recording");

    if (
      browserName === Browser.Safari ||
      browserName === Browser.MobileSafari ||
      osName === MobilePlatform.iOS
    ) {
      mediaRecorder.start(10000);
    } else {
      mediaRecorder.start(30000);
    }
  };

  return {
    mediaCaptureRef,
    startS3Recording: startMediaRecorder,
    stopS3Recording: stopMediaRecorder,
    swapS3RecordingStream,
    getLastS3ChunkTime,
    loading,
    stream,
    status,
    verifyFailedS3Parts: verifyFailedParts
  };
}
