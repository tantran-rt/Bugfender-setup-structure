import {
  setQuiktoxCapturedImages,
  setQuiktoxResults,
  setQuiktoxAIResults,
  quiktoxImages
} from "@/redux/slices/appConfig";
import { IQuiktoxScanningSteps, QuiktoxResponse } from "@/types/rapidTest";
import axios from "@/utils/axios";
import { getScreenshotFromSilhouetteArea } from "@/utils/camera";
import { extractAndNormalizeColors } from "@/utils/color";

import { sendLogs } from "@/utils/sendAnalytics.utils";
import { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

const useQuiktoxSplitDetector = (
  cameraRef: React.RefObject<HTMLDivElement | null>,
  silhouetteRef: React.RefObject<HTMLImageElement | null>,
  isFullPanelsKit: boolean
) => {
  const quiktoxScanningSteps: IQuiktoxScanningSteps[] = [
    {
      stepNumber: 1,
      instruction: "Place the QR code within the clear silhouette",
      type: "qrcode"
    },
    {
      stepNumber: 2,
      instruction: "Place the indicator window within the clear silhouette",
      type: "strip"
    }
  ];
  const dispatch = useDispatch();
  const CAPTURE_REQUEST_NUMBER = 1;
  const CAPTURE_DELAY_TIMER = 10000;
  const [msg, setMsg] = useState<string | undefined>();
  const [isSuccess, setIsSuccess] = useState(false);
  const [stopTimer, setStopTimer] = useState(false);
  const [time, setTime] = useState<number>(CAPTURE_REQUEST_NUMBER);
  const [isLoaderVisible, setLoaderVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingResponses, setPendingResponses] = useState<QuiktoxResponse[]>(
    []
  );
  const [expectedResponses, setExpectedResponses] = useState(0);
  const [receivedResponses, setReceivedResponses] = useState(0);
  const [currentStep, setCurrentStep] = useState(quiktoxScanningSteps[0]);

  const [accumulatedStripData, setAccumulatedStripData] = useState<
    Array<{ sideNumber: number; strips: any[] }>
  >([]);
  const [accumulatedScreenshots, setAccumulatedScreenshots] = useState<
    Array<{ sideNumber: number; screenshots: string[] }>
  >([]);
  // Track QR code screenshot separately to ensure it's always at index 0
  const [qrCodeScreenshot, setQrCodeScreenshot] = useState<string | null>(null);

  const moveOnNextSide = () => {
    if (currentStep.stepNumber === quiktoxScanningSteps.length) {
      sendLogs("Quiktox scanning completed all steps. No additional steps.");
      return;
    }
    const nextStep = quiktoxScanningSteps.find(
      (step) => step.stepNumber === currentStep.stepNumber + 1
    );
    if (nextStep) {
      setCurrentStep(nextStep);
    }
  };

  const captureScreenshot = useCallback(
    async (sideNumber: number, requestIndex: number) => {
      if (!cameraRef.current) return false;

      const screenshot = getScreenshotFromSilhouetteArea(
        cameraRef,
        silhouetteRef
      );
      if (!screenshot) return false;

      const imageBase64 = screenshot.replace(/^data:image\/\w+;base64,/, "");

      if (!imageBase64) {
        toast.error("Failed to capture the image.");
        return false;
      }
      sendLogs(
        `Sending image to AI for analysis - Side ${sideNumber}, Request ${
          requestIndex + 1
        }/${CAPTURE_REQUEST_NUMBER}`
      );

      try {
        const kit_type = isFullPanelsKit
          ? "quiktox_split_12_panels"
          : "quiktox_split_11_panels";
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_BEAM_YOLO_SERVICE}`,
          { base64_image: imageBase64, type: kit_type },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_BEAM_AUTH}`
            },
            signal: AbortSignal.timeout(90000)
          }
        );

        // Screenshot will be accumulated later when we find the best response
        handleResponse(response.data, screenshot, sideNumber, requestIndex);
        return true;
      } catch (error) {
        console.error("Reading results from AI error:", error);
        setIsLoading(false);
        return false;
      }
    },
    [cameraRef, isFullPanelsKit, silhouetteRef]
  );

  const startInferenceProcessing = useCallback(() => {
    if (currentStep.type !== "strip") return;

    const sideNumber = currentStep.stepNumber - 1;
    const initialDelay = setTimeout(() => {
      let requestIndex = 0;

      setTime(CAPTURE_REQUEST_NUMBER);

      const makeRequest = async () => {
        if (requestIndex < CAPTURE_REQUEST_NUMBER) {
          setTime(CAPTURE_REQUEST_NUMBER - requestIndex);
          captureScreenshot(sideNumber, requestIndex);
          requestIndex++;

          if (requestIndex < CAPTURE_REQUEST_NUMBER) {
            // Wait 1 second before next request
            setTimeout(makeRequest, 1000);
          } else {
            // All requests sent, wait for responses

            setStopTimer(true);
            setLoaderVisible(true);
            setIsLoading(true);
            setExpectedResponses(CAPTURE_REQUEST_NUMBER);
          }
        }
      };

      makeRequest();
    }, CAPTURE_DELAY_TIMER); // Delay before starting, make sure the Scandit's camera initialized completely

    return () => clearTimeout(initialDelay);
  }, [captureScreenshot, currentStep]);

  const handleRecapture = useCallback(() => {
    const sideNumber = currentStep.stepNumber - 1;
    sendLogs(`handle capture for side: ${sideNumber}`);

    setAccumulatedScreenshots((prev) =>
      prev.filter((side) => side.sideNumber !== sideNumber)
    );

    // Reset state for new capture
    setLoaderVisible(false);
    setTime(CAPTURE_REQUEST_NUMBER);

    setStopTimer(false);
    setPendingResponses([]);
    setIsSuccess(false);
    setIsLoading(false);
    setExpectedResponses(0);
    setReceivedResponses(0);

    startInferenceProcessing();
  }, [startInferenceProcessing, currentStep]);

  useEffect(() => {
    if (currentStep.type === "strip") {
      handleRecapture();
    }
  }, [currentStep, handleRecapture]);

  const updateQRCodeScreenshot = useCallback(
    (screenshot: string) => {
      setQrCodeScreenshot(screenshot);
      dispatch(setQuiktoxCapturedImages([screenshot]));
    },
    [dispatch]
  );

  useEffect(() => {
    if (currentStep.type === "strip") {
      // Flatten all sides' screenshots for Redux
      const allStripScreenshots = accumulatedScreenshots.flatMap(
        (side) => side.screenshots
      );
      // Always include QR code screenshot at index 0 if it exists, followed by strip screenshots
      const allScreenshots = qrCodeScreenshot
        ? [qrCodeScreenshot, ...allStripScreenshots]
        : allStripScreenshots;
      dispatch(setQuiktoxCapturedImages(allScreenshots));
      sendLogs(`Screenshots updated: ${allScreenshots.length} total`);
    }
  }, [accumulatedScreenshots, currentStep.type, dispatch, qrCodeScreenshot]);

  const handleResponse = (
    response: QuiktoxResponse,
    screenshot: string,
    sideNumber: number,
    requestIndex: number
  ) => {
    const { message, status_code, status } = response;
    console.log(
      `API response for Side ${sideNumber}, Request ${
        requestIndex + 1
      }: ${JSON.stringify(response)}`
    );
    if (status_code === 200) {
      // Add the response to pending responses with its screenshot, side number, and request index

      setPendingResponses((prev) => [
        ...prev,
        { ...response, screenshot, sideNumber, requestIndex }
      ]);
      setReceivedResponses((prev) => prev + 1);
    } else {
      sendLogs(
        `AI response non 200 status-code: ${status_code} - message: ${message} for Side ${sideNumber}, Request ${
          requestIndex + 1
        }`
      );
      setIsLoading(false);
    }
  };

  const handleBestResult = useCallback((responses: QuiktoxResponse[]) => {
    if (!responses || responses.length === 0) {
      console.error("No responses to process");
      return null;
    }

    // Find the response with the most items in its data field
    let bestResponse = responses[0];
    let maxItems = Object?.keys(responses[0]?.data || {})?.length;

    for (let i = 1; i < responses?.length; i++) {
      const currentItems = Object?.keys(responses[i]?.data || {})?.length;
      if (currentItems > maxItems) {
        maxItems = currentItems;
        bestResponse = responses[i];
      }
    }

    // Return both the data and the full response (for screenshot access)
    return {
      data: bestResponse.data,
      response: bestResponse
    };
  }, []);

  const processAllResponses = useCallback(
    (currentStepNumber: number) => {
      if (pendingResponses.length === 0) {
        console.log("No pending responses");
        return;
      }
      const sideNumber = currentStepNumber - 1;

      // Find the best response from current side's responses
      const bestResult = handleBestResult(pendingResponses);
      const bestData = bestResult?.data;
      const bestResponse = bestResult?.response;

      if (bestData && bestResponse) {
        // Convert strip data object to array format
        const newStrips = Object.entries(bestData).map(([code, value]) => ({
          ...(value as Record<string, any>),
          code
        }));

        setAccumulatedStripData((prevAccumulated) => {
          // Not a duplicate - proceed with accumulation
          setIsSuccess(true);
          setMsg(bestResponse.message);
          // Remove existing data for this side
          const filtered = prevAccumulated.filter(
            (side) => side.sideNumber !== sideNumber
          );
          // Add new data for this side
          const updated = [...filtered, { sideNumber, strips: newStrips }];

          // Update screenshots in the same batch
          setAccumulatedScreenshots((prev) => {
            // Remove existing screenshot for this side
            const filteredScreenshots = prev.filter(
              (s) => s.sideNumber !== sideNumber
            );
            // Add screenshot from best response
            return [
              ...filteredScreenshots,
              { sideNumber, screenshots: [bestResponse.screenshot || ""] }
            ];
          });

          return updated;
        });
      } else {
        // No strip data found in best response - use screenshot from 2nd request (requestIndex === 1)
        const secondRequestResponse = pendingResponses.find(
          (r) => r.requestIndex === 1
        );
        const screenshotToUse =
          secondRequestResponse?.screenshot || bestResponse?.screenshot || "";

        setAccumulatedScreenshots((prev) => {
          // Remove existing screenshot for this side
          const filtered = prev.filter((s) => s.sideNumber !== sideNumber);
          // Add screenshot from 2nd request
          return [...filtered, { sideNumber, screenshots: [screenshotToUse] }];
        });

        setIsSuccess(false);
      }

      // Clear pending responses after processing

      setPendingResponses([]);
      setIsLoading(false);
    },
    [pendingResponses, handleBestResult]
  );

  useEffect(() => {
    // Check if we've received all expected responses
    if (expectedResponses > 0 && receivedResponses === expectedResponses) {
      processAllResponses(currentStep.stepNumber);
    }
  }, [
    receivedResponses,
    expectedResponses,
    processAllResponses,
    currentStep.stepNumber
  ]);

  useEffect(() => {
    const allStrips = accumulatedStripData.flatMap((side) => side.strips);
    sendLogs(
      `All ${allStrips.length} strips results: ${JSON.stringify(
        accumulatedStripData
      )}`
    );
    dispatch(setQuiktoxAIResults(allStrips));

    // If this is the last side, dispatch final results
    if (currentStep.stepNumber === quiktoxScanningSteps.length) {
      dispatch(setQuiktoxResults(allStrips));
    }
  }, [
    accumulatedStripData,
    currentStep.stepNumber,
    dispatch,
    quiktoxScanningSteps.length
  ]);

  return {
    msg,
    isSuccess,
    time,
    isLoaderVisible,
    recapture: handleRecapture,
    stopTimer,
    isLoading,
    quiktoxScanningSteps,
    currentStep,
    moveOnStripScan: moveOnNextSide,
    startInferenceProcessing,
    updateQRCodeScreenshot
  };
};
export default useQuiktoxSplitDetector;
