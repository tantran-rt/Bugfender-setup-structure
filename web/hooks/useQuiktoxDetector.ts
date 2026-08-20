import {
  setQuiktoxCapturedImages,
  setQuiktoxResults,
  setQuiktoxAIResults,
  quiktoxImages
} from "@/redux/slices/appConfig";
import { IQuiktoxScanningSteps, QuiktoxResponse } from "@/types/rapidTest";
import { getScreenshotFromCameraRef } from "@/utils/camera";
import {
  extractAndNormalizeColors,
  isDuplicateColorCombination
} from "@/utils/color";

import { sendLogs } from "@/utils/sendAnalytics.utils";
import axios from "axios";
import { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

const useQuiktoxDetector = (
  cameraRef: React.RefObject<HTMLDivElement | null>
) => {
  const quiktoxScanningSteps: IQuiktoxScanningSteps[] = [
    {
      stepNumber: 1,
      instruction: "Place the QR code within the clear silhouette",
      type: "qrcode"
    },
    {
      stepNumber: 2,
      instruction: "Place 1st side within the clear silhouette",
      type: "strip"
    },
    {
      stepNumber: 3,
      instruction: "Place 2nd side within the clear silhouette",
      type: "strip"
    },
    {
      stepNumber: 4,
      instruction: "Place 3rd side within the clear silhouette",
      type: "strip"
    },
    {
      stepNumber: 5,
      instruction: "Place 4th side within the clear silhouette",
      type: "strip"
    },
    {
      stepNumber: 6,
      instruction: "Place 5th side within the clear silhouette",
      type: "strip"
    },
    {
      stepNumber: 7,
      instruction: "Place 6th side within the clear silhouette",
      type: "strip"
    }
  ];
  const dispatch = useDispatch();
  const CAPTURE_REQUEST_NUMBER = 2;
  const CAPTURE_DELAY_TIMER = 10000;
  const [msg, setMsg] = useState<string | undefined>();
  const [isSuccess, setIsSuccess] = useState(false);
  const [stopTimer, setStopTimer] = useState(false);
  const [showTimer, setShowTimer] = useState<boolean>(true);
  const [time, setTime] = useState<number>(CAPTURE_REQUEST_NUMBER);
  const [isLoaderVisible, setLoaderVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingResponses, setPendingResponses] = useState<QuiktoxResponse[]>(
    []
  );
  const [expectedResponses, setExpectedResponses] = useState(0);
  const [receivedResponses, setReceivedResponses] = useState(0);
  const [currentStep, setCurrentStep] = useState(quiktoxScanningSteps[0]);
  const [isEmptySideDetected, setIsEmptySideDetected] = useState(false);
  // Track strip data per side: { sideNumber: number, strips: any[] }[]
  const [accumulatedStripData, setAccumulatedStripData] = useState<
    Array<{ sideNumber: number; strips: any[] }>
  >([]);
  // Track screenshots per side: { sideNumber: number, screenshots: string[] }[]
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

      const screenshot = getScreenshotFromCameraRef(cameraRef);
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
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_BEAM_YOLO_SERVICE}`,
          { base64_image: imageBase64, type: "quiktox" },
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
    [cameraRef]
  );

  const startInferenceProcessing = useCallback(() => {
    if (currentStep.type !== "strip") return;

    const sideNumber = currentStep.stepNumber - 1; // Side 1 = step 2, Side 2 = step 3, etc.
    const initialDelay = setTimeout(() => {
      let requestIndex = 0;
      setShowTimer(true);
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
            setShowTimer(false);
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

    // Remove current side's data from accumulated state
    setAccumulatedStripData((prev) =>
      prev.filter((side) => side.sideNumber !== sideNumber)
    );
    // Remove current side's screenshot (only 1 screenshot per side)
    setAccumulatedScreenshots((prev) =>
      prev.filter((side) => side.sideNumber !== sideNumber)
    );
    setIsEmptySideDetected(false);
    // Reset state for new capture
    setLoaderVisible(false);
    setTime(CAPTURE_REQUEST_NUMBER);
    setShowTimer(true);
    setStopTimer(false);
    setPendingResponses([]);
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
      const sideNumber = currentStepNumber - 1; // Side 1 = step 2, Side 2 = step 3, etc.

      // Find the best response from current side's responses
      const bestResult = handleBestResult(pendingResponses);
      const bestData = bestResult?.data;
      const bestResponse = bestResult?.response;

      if (bestData && Object.keys(bestData).length === 2 && bestResponse) {
        // Convert strip data object to array format
        const newStrips = Object.values(bestData) as Array<{ label: string }>;
        const unknownStripsCount = newStrips.filter(
          (strip) => strip.label === "unknown"
        ).length;
        const isEmptySide = unknownStripsCount === 2;
        let existingEmptySide = false;
        if (isEmptySide) {
          // Check if there's an existing side where both strips have label "unknown"
          existingEmptySide = accumulatedStripData.some((side) => {
            if (side.strips.length !== 2) return false;
            const unknownStripsCount = side.strips.filter(
              (strip) => strip.label === "unknown"
            ).length;
            return unknownStripsCount === 2;
          });

          if (!existingEmptySide) {
            setIsEmptySideDetected(isEmptySide);
          }
        }

        // Extract and normalize colors from the new strips
        const newColors = extractAndNormalizeColors(newStrips);
        const COLOR_THRESHOLD = 0.15;

        // Check for duplicate color combination (15% different percentage) before accumulating
        setAccumulatedStripData((prevAccumulated) => {
          const existingSides = prevAccumulated.filter(
            (side) => side.sideNumber !== sideNumber
          );

          const isDuplicate = isDuplicateColorCombination(
            newColors,
            existingSides,
            COLOR_THRESHOLD
          );

          sendLogs(`Empty side duplicate detected: ${existingEmptySide}`);

          if (isDuplicate || existingEmptySide) {
            // Duplicate detected - don't accumulate, show warning message
            setMsg(
              "This side already has been scanned. Please turn to a different side and try again."
            );
            setIsSuccess(false);

            // Update screenshots
            setAccumulatedScreenshots((prev) => {
              // Remove existing screenshot for this side
              const filteredScreenshots = prev.filter(
                (s) => s.sideNumber !== sideNumber
              );
              return [
                ...filteredScreenshots,
                { sideNumber, screenshots: [bestResponse.screenshot || ""] }
              ];
            });

            return prevAccumulated; // Return unchanged state
          }

          // Not a duplicate - proceed with accumulation
          setIsSuccess(true);
          setMsg(
            "Turn the device to next side and click Continue to scan the next side."
          );

          // Remove existing data for this side
          const filtered = prevAccumulated.filter(
            (side) => side.sideNumber !== sideNumber
          );
          // Add new data for this side
          const updated = [...filtered, { sideNumber, strips: newStrips }];

          // Accumulate screenshot from the best response (only 1 screenshot per side)
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

        // Accumulate screenshot from 2nd request (or best response as fallback)
        setAccumulatedScreenshots((prev) => {
          // Remove existing screenshot for this side
          const filtered = prev.filter((s) => s.sideNumber !== sideNumber);
          // Add screenshot from 2nd request
          return [...filtered, { sideNumber, screenshots: [screenshotToUse] }];
        });

        setMsg("");
        setIsSuccess(false);
      }

      // Clear pending responses after processing
      setPendingResponses([]);
      setIsLoading(false);
    },
    [
      pendingResponses,
      handleBestResult,
      extractAndNormalizeColors,
      isDuplicateColorCombination
    ]
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
  }, [accumulatedStripData]);

  return {
    msg,
    isSuccess,
    isEmptySideDetected,
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
export default useQuiktoxDetector;
