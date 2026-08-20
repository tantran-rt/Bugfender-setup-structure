import {
  setAlcoOraltoxAIResult,
  setOraltoxImg,
  setRapidTestResultString
} from "@/redux/slices/appConfig";
import { testData } from "@/redux/slices/drugTest";
import { sendLogs } from "@/utils/sendAnalytics.utils";
import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Webcam from "react-webcam";

interface AlcoOralResponse {
  status: string;
  message: string;
  [key: string]: any;
}

const useOraltoxDetector = (
  cameraRef: React.RefObject<HTMLDivElement | null>,
  testType: "alco" | "oraltox"
) => {
  const dispatch = useDispatch();
  const [alcoOralRes, setAlcoOralRes] = useState<AlcoOralResponse | null>(null);
  const [alcoOralHasRes, setAlcoOralHasRes] = useState(false);
  const [msg, setMsg] = useState<string | undefined>();
  const [isSuccess, setIsSuccess] = useState(false);
  const [stopTimer, setStopTimer] = useState(false);
  const [counter, setCounter] = useState(0);
  const [showTimer, setShowTimer] = useState<boolean>(true);
  const [time, setTime] = useState<number>(1);
  const [isLoaderVisible, setLoaderVisible] = useState(false);
  const [oralRes, setOralRes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingResponses, setPendingResponses] = useState<AlcoOralResponse[]>(
    []
  );
  const [expectedResponses, setExpectedResponses] = useState(0);
  const [receivedResponses, setReceivedResponses] = useState(0);

  const resetState = () => {
    setLoaderVisible(false);
    setTime(1);
    setShowTimer(true);
    setAlcoOralHasRes(false);
    setStopTimer(false);
    setCounter(0);
    setPendingResponses([]);
    setIsSuccess(false);
    setIsLoading(false);
    setExpectedResponses(0);
    setReceivedResponses(0);
  };

  const checkForAlcoOraltox = useCallback(async () => {
    if (!cameraRef.current) return false;

    // const screenshot = cameraRef.current.getScreenshot();
    const screenshot = getScreenshotFromCameraDiv(cameraRef);
    if (!screenshot) return false;

    const imageBase64 = screenshot.replace(/^data:image\/\w+;base64,/, "");

    if (!imageBase64) {
      toast.error("Failed to capture the image.");
      return false;
    }

    try {
      setCounter((prev) => prev + 1);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BEAM_YOLO_SERVICE}`,
        { base64_image: imageBase64, type: testType },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_BEAM_AUTH}`
          },
          signal: AbortSignal.timeout(90000)
        }
      );

      handleResponse(response.data, screenshot);
      return false;
    } catch (error) {
      console.error("Reading results from AI error:", error);
      setIsLoading(false);
      return false;
    }
  }, [cameraRef, testType]);

  const getScreenshotFromCameraDiv = (
    cameraRef: React.RefObject<HTMLDivElement | null>
  ): string | null => {
    const video = cameraRef.current?.querySelector(
      "video"
    ) as HTMLVideoElement | null;

    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn("📷 Video not ready");
      return null;
    }

    // Original dimensions
    const origWidth = video.videoWidth;
    const origHeight = video.videoHeight;

    // Calculate target dimensions
    const aspectRatio = origWidth / origHeight;
    const targetWidth = Math.min(640, origWidth);
    const targetHeight = targetWidth / aspectRatio;

    // Create canvas with scaled dimensions
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, targetWidth, targetHeight);

    return canvas.toDataURL("image/jpeg", 0.9); // Lower quality to reduce size more
  };

  const handleResponse = (response: AlcoOralResponse, screenshot: string) => {
    const { status, message, status_code } = response;

    // if (status === "success" && status_code === 200) {
    if (status_code === 200) {
      // Add the response to pending responses with its screenshot
      setPendingResponses((prev) => [...prev, { ...response, screenshot }]);
      setReceivedResponses((prev) => prev + 1);
    } else {
      sendLogs(
        `AI response non 200 status-code: ${status_code} - message: ${message}`
      );
      setIsLoading(false);
    }
  };

  const processAllResponses = () => {
    if (pendingResponses.length === 0) {
      console.log("No pending responses");
      return;
    }

    // Find the best response from all collected responses
    const bestData = handleBestResult(pendingResponses);
    if (bestData) {
      // Get the screenshot from the best response
      const bestResponse = pendingResponses.find(
        (response) => response.data === bestData
      );

      if (bestResponse) {
        // Only update UI states after we have the best response
        dispatch(setRapidTestResultString(bestData));
        dispatch(setOraltoxImg(bestResponse.screenshot));
        setIsSuccess(true);
        setAlcoOralRes(bestResponse);
        setMsg(bestResponse.message);
        setAlcoOralHasRes(true);
      }
    }

    // Clear pending responses after processing
    setPendingResponses([]);
    setIsLoading(false);
  };

  useEffect(() => {
    // Check if we've received all expected responses
    console.log(
      `expectedResponses ${expectedResponses} -- receivedResponses ${receivedResponses}`
    );

    if (expectedResponses > 0 && receivedResponses === expectedResponses) {
      processAllResponses();
    }
  }, [receivedResponses, expectedResponses]);

  useEffect(() => {
    if (stopTimer) return;

    // Add initial delay before starting the process
    const initialDelay = setTimeout(() => {
      console.log("Start Result Infering!!");

      const interval = setInterval(async () => {
        const res = checkForAlcoOraltox();
        setTime((prev) => {
          if (prev > 1) {
            return prev - 1;
          } else {
            setShowTimer(false);
            setStopTimer(true);
            clearInterval(interval);
            setLoaderVisible(true);
            setIsLoading(true);
            // Get the current counter value and set expectedResponses
            setCounter((currentCounter) => {
              setExpectedResponses(currentCounter);
              return currentCounter;
            });
            return 0;
          }
        });
      }, 1000);
      return () => clearInterval(interval);
    }, 8000); // 8 seconds delay before starting, make sure the Scandit's camera initialized completely

    return () => clearTimeout(initialDelay);
  }, [stopTimer, checkForAlcoOraltox, pendingResponses]);

  const handleBestResult = (responses: AlcoOralResponse[]) => {
    if (!responses || responses.length === 0) {
      console.error("No responses to process");
      return;
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

    // Update the state with the best response
    setOralRes([bestResponse.data]);
    dispatch(setAlcoOraltoxAIResult(bestResponse.data));
    return bestResponse.data;
  };

  return {
    msg,
    isSuccess,
    alcoOralHasRes,
    alcoOralRes,
    showTimer,
    time,
    isLoaderVisible,
    recapture: resetState,
    stopTimer,
    isLoading
  };
};
export default useOraltoxDetector;
