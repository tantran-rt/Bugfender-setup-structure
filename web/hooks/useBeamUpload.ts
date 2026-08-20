"use client";

import { useCallback, useEffect, useRef, useState, RefObject } from "react";
import { useDispatch } from "react-redux";
import { blobToBase64 } from "@/utils/utils";
import { trimSpecialCharacters } from "@/utils/stringUtils";
import { sendLogs } from "@/utils/sendAnalytics.utils";
import { fetchRetry } from "@/utils/fetchWithRetry";
import { cloudVideoStorage } from "@/utils/BeamChunkDB";
import { pushIntoTaskIds, setTaskCount } from "@/redux/slices/drugTest";
import { Step } from "@/types/testCollection";

const BEAM_REQUEST_TIMEOUT_MS = 20000;
const MAX_RETRY_COUNT = 2;

export interface BeamUploadBody {
  index: number;
  inference_config: any;
  inference_score: any[];
  chunks: string;
  test_type: string;
  video_path: string;
  record: string;
  is_final: boolean;
  step: Step | null;
}

export interface UseBeamUploadProps {
  participant_id: string | number;
  filename: string | undefined;
  AIConfig: any;
  scoringData: any;
  testingKit: { kit_id?: string };
  currentStep: Step | null;
  isFinalRef: RefObject<boolean>;
  taskCountRef: RefObject<number>;
  mediaRecorderRef: RefObject<MediaRecorder | null>;
  /** Beam MediaStream — rebinds ondataavailable once the recorder exists after start. */
  stream?: MediaStream | null;
}

export interface UseBeamUploadReturn {
  handleDataAvailable: (event: BlobEvent) => Promise<void>;
  verifyFailedTasks: () => Promise<void>;
  hasFinalBlobProcessed: boolean;
}

/**
 * Encapsulates Beam AI video chunk upload logic: sending blobs for inference,
 * persisting to IndexedDB, and retrying failed tasks.
 *
 * Also owns MediaRecorder.ondataavailable binding via a stable dispatch so
 * handleDataAvailable identity changes (e.g. currentStep) never tear down the
 * handler mid-flight. Mobile recreate in useMediaFunctions must keep copying
 * the existing ondataavailable onto each new MediaRecorder instance.
 */
export function useBeamUpload({
  participant_id,
  filename,
  AIConfig,
  scoringData,
  testingKit,
  currentStep,
  isFinalRef,
  taskCountRef,
  mediaRecorderRef,
  stream = null
}: UseBeamUploadProps): UseBeamUploadReturn {
  const dispatch = useDispatch();
  const blobCountRef = useRef(0);
  const [hasFinalBlobProcessed, setHasFinalBlobProcessed] = useState(false);
  const handleDataAvailableRef = useRef<
    ((event: BlobEvent) => void | Promise<void>) | null
  >(null);

  const handleSendDataForInference = useCallback(
    async (body: any) => {
      const index = body.index;
      if (typeof window === "undefined") {
        console.error("Window object not available");
        return;
      }

      try {
        const response = await fetchRetry(
          `${process.env.NEXT_PUBLIC_BEAM_URL}`,
          2000,
          MAX_RETRY_COUNT,
          {
            method: "POST",
            headers: {
              Accept: "*/*",
              "Accept-Encoding": "gzip, deflate",
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_BEAM_AUTH}`,
              "Content-Type": "application/json",
              Connection: "keep-alive"
            },
            body: JSON.stringify(body)
          },
          BEAM_REQUEST_TIMEOUT_MS
        );

        const analysis_data = await response.json();

        if (!response.ok) {
          sendLogs(`Beam request Error ${JSON.stringify(response)}`);
        } else {
          if (analysis_data.task_id) {
            sendLogs(
              `Task ${index} has been uploaded to Beam succesfully: ${analysis_data.task_id}`
            );

            dispatch(pushIntoTaskIds(analysis_data.task_id));
            await cloudVideoStorage.updateChunk(`${participant_id}-${index}`, {
              task_id: analysis_data.task_id,
              uploadCompleted: true
            });
          }
        }
      } catch (error) {
        console.error(
          `Task ${index} upload failed -> update retryCount: ${error}`
        );
        await cloudVideoStorage.updateChunk(`${participant_id}-${index}`, {
          retryCount: MAX_RETRY_COUNT
        });
      }
    },
    [dispatch, participant_id]
  );

  const handleDataAvailable = useCallback(
    async ({ data }: BlobEvent) => {
      try {
        // Snapshot at event entry so endTest() flipping isFinal mid-await
        // cannot make a non-final blob clear ondataavailable / open submit.
        const isFinal = isFinalRef.current;
        const keyFilename = trimSpecialCharacters(filename ?? "");
        if (data.size) {
          const unencodedString = await blobToBase64(data);
          const inference_config = AIConfig;
          const inference_score = scoringData[testingKit?.kit_id ?? ""] ?? [];
          const body = {
            inference_config: inference_config,
            inference_score: inference_score,
            chunks: unencodedString,
            test_type: `${testingKit?.kit_id}`,
            video_path: "",
            record: keyFilename,
            index: blobCountRef.current,
            is_final: isFinal,
            step: currentStep
          };

          console.log(
            `Sending blob ${blobCountRef.current} - size: ${data.size} to Beam, isFinal: ${isFinal}, tasks count ${taskCountRef.current}`
          );

          await cloudVideoStorage.saveChunk({
            id: `${participant_id}-${blobCountRef.current}`,
            inference_config: JSON.stringify(inference_config),
            inference_score: JSON.stringify(inference_score),
            test_type: `${testingKit?.kit_id}`,
            chunk: unencodedString,
            task_id: "",
            index: blobCountRef.current,
            record: keyFilename,
            is_final: isFinal,
            step: JSON.stringify(currentStep),
            uploadCompleted: false,
            retryCount: 0
          });

          taskCountRef.current += 1;
          dispatch(setTaskCount(taskCountRef.current));
          handleSendDataForInference(body);

          blobCountRef.current += 1;

          if (isFinal && mediaRecorderRef.current) {
            setHasFinalBlobProcessed(true);
            mediaRecorderRef.current.ondataavailable = null;
          }
        } else {
          console.log(
            `Got Beam blob invalid: ${data.size} - isFinal: ${isFinal}`
          );
          if (isFinal && mediaRecorderRef.current && !hasFinalBlobProcessed) {
            setHasFinalBlobProcessed(true);
            mediaRecorderRef.current.ondataavailable = null;
          }
        }
      } catch (error) {
        console.error("Stream Data Error :", error);
      }
    },
    [
      filename,
      AIConfig,
      scoringData,
      testingKit?.kit_id,
      currentStep,
      participant_id,
      dispatch,
      handleSendDataForInference,
      hasFinalBlobProcessed,
      isFinalRef,
      taskCountRef,
      mediaRecorderRef
    ]
  );

  // handleDataAvailableRef.current = handleDataAvailable;

  // Stable dispatch: do not depend on handleDataAvailable identity (Safari race).
  useEffect(() => {
    if (!mediaRecorderRef.current) return;

    const dispatchDataAvailable = (event: BlobEvent) => {
      void handleDataAvailableRef.current?.(event);
    };

    // mediaRecorderRef.current.ondataavailable = dispatchDataAvailable;

    return () => {
      if (mediaRecorderRef.current && !isFinalRef.current) {
        mediaRecorderRef.current.ondataavailable = null;
      }
    };
  }, [mediaRecorderRef, isFinalRef, stream]);

  const verifyFailedTasks = useCallback(async () => {
    try {
      const beamTasksCheck =
        await cloudVideoStorage.checkDatabaseAndObjectStore();
      if (beamTasksCheck) {
        const keyFilename = trimSpecialCharacters(filename ?? "");
        const tasks = (await cloudVideoStorage.retrieveFailedChunks(2)).filter(
          (task) => task.record === keyFilename
        );
        if (!tasks.length) {
          sendLogs("No failed tasks found!");
          return;
        }
        sendLogs(
          `Found ${tasks.length} failed tasks: ${JSON.stringify(
            tasks.map((t) => t.index)
          )}, retrying upload...`
        );
        for (const task of tasks) {
          const body = {
            inference_config: AIConfig,
            inference_score: scoringData[testingKit?.kit_id ?? ""] ?? [],
            chunks: task.chunk,
            test_type: `${testingKit?.kit_id}`,
            video_path: "",
            record: keyFilename,
            index: task.index,
            is_final: task.is_final,
            step: JSON.parse(task.step)
          };
          console.log(`Reupload task ${task.index} to Beam...`);
          await handleSendDataForInference(body);
        }
      } else {
        sendLogs("beamTasksCheck unavailable");
      }
    } catch (error) {
      sendLogs(`retrivePendingTasks error ${JSON.stringify(error)}`);
    }
  }, [
    filename,
    AIConfig,
    scoringData,
    testingKit?.kit_id,
    handleSendDataForInference
  ]);

  return {
    handleDataAvailable,
    verifyFailedTasks,
    hasFinalBlobProcessed
  };
}
