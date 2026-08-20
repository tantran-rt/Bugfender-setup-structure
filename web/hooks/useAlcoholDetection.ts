import {
  setAlocholImg,
  setAlcoOraltoxAIResult_,
} from "@/redux/slices/appConfig";
import axios from "axios";
import { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import Webcam from "react-webcam";

interface AlcoOralResponse {
  status: string;
  message: string;
  [key: string]: any;
}

const useAlcoholDetection = (
  cameraRef: React.RefObject<Webcam | null>,
  testType: "alcostrip" | "oraltox",
  isStripPositioned: boolean
) => {
  const dispatch = useDispatch();
  const [msg, setMsg] = useState<string | undefined>();
  const [isSuccess, setIsSuccess] = useState(false);
  const [stopTimer, setStopTimer] = useState(false);
  const [counter, setCounter] = useState(0);
  const [retryCounter, setRetryCounter] = useState(0);
  const [showTimer, setShowTimer] = useState<boolean>(true);
  const [time, setTime] = useState<number>(4);
  const [isModalVisible, setModalVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const previousStripPositionRef = useRef<boolean>(isStripPositioned);
  const responsesRef = useRef<AlcoOralResponse[]>([]);
  const hasPositiveRef = useRef<boolean>(false);
  const hasNegativeRef = useRef<boolean>(false);
  const startTimeRef = useRef<number | null>(null);
  const totalElapsedTimeRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const isRecapturingRef = useRef<boolean>(false);
  const firstResponseRef = useRef<AlcoOralResponse | null>(null);
  const isLoadingRef = useRef<boolean>(false);
  const alcoOralResRef = useRef<AlcoOralResponse | null>(null);
  const alcoOralHasResRef = useRef<boolean>(false);

  const recapture = () => {
    // Reset all states to initial values
    setModalVisible(false);
    setTime(4);
    setShowTimer(true);
    setStopTimer(false);
    setCounter(0);
    setRetryCounter(0);
    setIsSuccess(false);
    setMsg(undefined);

    // // Reset all refs
    responsesRef.current = [];
    hasPositiveRef.current = false;
    hasNegativeRef.current = false;
    startTimeRef.current = null;
    totalElapsedTimeRef.current = 0;
    isPausedRef.current = false;
    isRecapturingRef.current = false;
    firstResponseRef.current = null;
    isLoadingRef.current = false;
    alcoOralResRef.current = null;
    alcoOralHasResRef.current = false;
    previousStripPositionRef.current = isStripPositioned;

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleResponse = (response: AlcoOralResponse, screenshot: string) => {
    const { status, message } = response;

    // Store the response
    responsesRef.current.push(response);

    // If this is the first response, store it
    if (!firstResponseRef.current) {
      firstResponseRef.current = response;
    }

    // Check if we have a positive or negative response
    if (response.data === "positive") {
      hasPositiveRef.current = true;
    } else if (response.data === "negative") {
      hasNegativeRef.current = true;
    }

    // Handle response based on priority
    if (firstResponseRef.current.data === "positive") {
      // If first response was positive, use it immediately and ignore others
      dispatch(setAlcoOraltoxAIResult_(firstResponseRef.current.data));
      dispatch(setAlocholImg(screenshot));
      setIsSuccess(true);
      alcoOralResRef.current = firstResponseRef.current;
      setMsg(firstResponseRef.current.message);
      alcoOralHasResRef.current = true;
      setModalVisible(true);
      return;
    }

    if (firstResponseRef.current.data === "negative") {
      // If first response was negative, wait for all responses
      if (hasPositiveRef.current) {
        // If we got a positive later, use it
        const positiveResponse = responsesRef.current.find(
          (r) => r.data === "positive"
        );
        if (positiveResponse) {
          dispatch(setAlcoOraltoxAIResult_(positiveResponse.data));
          dispatch(setAlocholImg(screenshot));
          setIsSuccess(true);
          alcoOralResRef.current = positiveResponse;
          setMsg(positiveResponse.message);
          alcoOralHasResRef.current = true;
          setModalVisible(true);
        }
      } else if (responsesRef.current.length >= 4) {
        // If all responses are in and no positive, use the negative
        dispatch(setAlcoOraltoxAIResult_(firstResponseRef.current.data));
        dispatch(setAlocholImg(screenshot));
        setIsSuccess(true);
        alcoOralResRef.current = firstResponseRef.current;
        setMsg(firstResponseRef.current.message);
        alcoOralHasResRef.current = true;
        setModalVisible(true);
      }
      return;
    }

    // If first response was neither positive nor negative
    if (responsesRef.current.length >= 4) {
      if (hasPositiveRef.current) {
        // If we got a positive, use it
        const positiveResponse = responsesRef.current.find(
          (r) => r.data === "positive"
        );
        if (positiveResponse) {
          dispatch(setAlcoOraltoxAIResult_(positiveResponse.data));
          dispatch(setAlocholImg(screenshot));
          setIsSuccess(true);
          alcoOralResRef.current = positiveResponse;
          setMsg(positiveResponse.message);
          alcoOralHasResRef.current = true;
          setModalVisible(true);
        }
      } else if (hasNegativeRef.current) {
        // If no positive but negative exists, use negative
        const negativeResponse = responsesRef.current.find(
          (r) => r.data === "negative"
        );
        if (negativeResponse) {
          dispatch(setAlcoOraltoxAIResult_(negativeResponse.data));
          dispatch(setAlocholImg(screenshot));
          setIsSuccess(true);
          alcoOralResRef.current = negativeResponse;
          setMsg(negativeResponse.message);
          alcoOralHasResRef.current = true;
          setModalVisible(true);
        }
      } else {
        // If neither positive nor negative, use first response
        dispatch(setAlcoOraltoxAIResult_(firstResponseRef.current.data));
        dispatch(setAlocholImg(screenshot));
        setIsSuccess(true);
        alcoOralResRef.current = firstResponseRef.current;
        setMsg(firstResponseRef.current.message);
        alcoOralHasResRef.current = false; // Set to false since it's not positive/negative
        setModalVisible(true);
      }
    }
  };

  const checkAlcoOraltoxAIRes = (response: AlcoOralResponse) => {
    console.log("Response:", response.data);
    if (response.data === "positive") return true;
    if (response.data !== "positive" && retryCounter === 3) {
      toast.info("Ensure the strip is within view for optimal detection.");
      setRetryCounter(0);
      return false;
    }
    setRetryCounter((prev) => prev + 1);
    return false;
  };

  const checkForAlcoOraltox = useCallback(async () => {
    if (!cameraRef.current || isModalVisible) return false;

    const screenshot = cameraRef.current.getScreenshot();
    if (!screenshot) return false;

    const imageBase64 = screenshot.replace(/^data:image\/\w+;base64,/, "");

    if (!imageBase64) {
      toast.error("Failed to capture the image.");
      return false;
    }

    try {
      isLoadingRef.current = true;
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BEAM_YOLO_SERVICE}`,
        { base64_image: imageBase64, type: testType },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_BEAM_AUTH}`,
          },
        }
      );
      handleResponse(response.data, screenshot);
      const res = checkAlcoOraltoxAIRes(response.data);
      isLoadingRef.current = false;
      if (res) {
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking device:", error);
      toast.error("Failed to process the image.");
      isLoadingRef.current = false;
    }
  }, [cameraRef, testType, dispatch, counter, retryCounter, isModalVisible]);

  useEffect(() => {
    // Handle strip position changes
    if (previousStripPositionRef.current !== isStripPositioned) {
      if (!isStripPositioned) {
        // Strip was mispositioned - pause timer
        isPausedRef.current = true;
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        // Strip was repositioned - resume timer if not stopped and time remaining
        if (!stopTimer && !isModalVisible && totalElapsedTimeRef.current < 4) {
          isPausedRef.current = false;
          if (!startTimeRef.current) {
            startTimeRef.current = Date.now();
          }

          timerRef.current = setInterval(async () => {
            if (!isStripPositioned || isModalVisible) {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              return;
            }

            const currentTime = Date.now();
            const elapsedTime =
              (currentTime - (startTimeRef.current || currentTime)) / 1000;
            totalElapsedTimeRef.current = elapsedTime;

            if (totalElapsedTimeRef.current >= 4) {
              setShowTimer(false);
              setStopTimer(true);
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              setModalVisible(true);
              return;
            }

            const res = checkForAlcoOraltox();
            if (await res) {
              setShowTimer(false);
              setStopTimer(true);
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              setModalVisible(true);
              return;
            }

            setTime(4 - Math.floor(totalElapsedTimeRef.current));
          }, 1000);
        }
      }
      previousStripPositionRef.current = isStripPositioned;
    }
  }, [isStripPositioned, stopTimer, isModalVisible, checkForAlcoOraltox]);

  // Initial timer setup - only start if strip is positioned
  useEffect(() => {
    if (stopTimer || !isStripPositioned || isModalVisible) return;

    // Only start timer if we're not recapturing or if we're recapturing and strip is positioned
    if (
      !isRecapturingRef.current ||
      (isRecapturingRef.current && isStripPositioned)
    ) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(async () => {
        if (!isStripPositioned || isModalVisible) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return;
        }

        const currentTime = Date.now();
        const elapsedTime =
          (currentTime - (startTimeRef.current || currentTime)) / 1000;
        totalElapsedTimeRef.current = elapsedTime;

        if (totalElapsedTimeRef.current >= 4) {
          setShowTimer(false);
          setStopTimer(true);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setModalVisible(true);
          isRecapturingRef.current = false;
          return;
        }

        const res = checkForAlcoOraltox();
        if (await res) {
          setShowTimer(false);
          setStopTimer(true);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setModalVisible(true);
          isRecapturingRef.current = false;
          return;
        }

        setTime(4 - Math.floor(totalElapsedTimeRef.current));
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [stopTimer, isStripPositioned, isModalVisible, checkForAlcoOraltox]);

  // Effect to stop all captures and intervals when modal is visible
  useEffect(() => {
    if (isModalVisible) {
      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isModalVisible]);

  return {
    msg,
    isSuccess,
    alcoOralHasRes: alcoOralHasResRef.current,
    alcoOralRes: alcoOralResRef.current,
    showTimer,
    time,
    isModalVisible,
    recapture,
    stopTimer,
    isLoading: isLoadingRef.current,
  };
};
export default useAlcoholDetection;
