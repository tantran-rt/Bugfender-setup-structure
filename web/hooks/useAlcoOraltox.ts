import {
  setAlcoOraltoxAIResult,
  setAlocholImg,
  setAlcoOraltoxAIResult_,
  setOraltoxImg,
  setRapidTestResultString,
} from "@/redux/slices/appConfig";
import { testData } from "@/redux/slices/drugTest";
import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Webcam from "react-webcam";

interface AlcoOralResponse {
  status: string;
  message: string;
  data: any;
}

interface UseAlcoOralDetectorProps {
  cameraRef: React.RefObject<Webcam | null>;
  testType: "alco" | "oraltox";
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

interface UseAlcoOralDetectorReturn {
  msg?: string;
  isSuccess: boolean;
  alcoOralHasRes: boolean;
  alcoOralRes: AlcoOralResponse | null;
  showTimer: boolean;
  time: number;
  isLoaderVisible: boolean;
  recapture: () => void;
  stopTimer: boolean;
}

const useAlcoOralDetector = ({
  cameraRef,
  testType,
  canvasRef,
}: UseAlcoOralDetectorProps): UseAlcoOralDetectorReturn => {
  const DEFAULT_TIMER = 10;
  const MAX_RETRIES = 3;
  const DETECTION_TIMEOUT = 30 * 1000;

  const { timerObjs } = useSelector(testData);
  const dispatch = useDispatch();

  const [state, setState] = useState({
    alcoOralRes: null as AlcoOralResponse | null,
    alcoOralHasRes: false,
    msg: undefined as string | undefined,
    isSuccess: false,
    stopTimer: false,
    counter: 0,
    retryCounter: 0,
    showTimer: true,
    time: DEFAULT_TIMER,
    isLoaderVisible: false,
    capturedCanvas: null as string | null,
  });

  const resetState = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isLoaderVisible: false,
      time: timerObjs[0]?.step_time || DEFAULT_TIMER,
      showTimer: true,
      alcoOralHasRes: false,
      stopTimer: false,
      counter: 0,
      capturedCanvas: null,
    }));

    if (canvasRef?.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        context.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
      }
    }
  }, [canvasRef, timerObjs]);

  const captureCanvasImage = useCallback(() => {
    if (!cameraRef.current?.video || !canvasRef?.current) return null;

    const video = cameraRef.current.video;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return null;

    const silhouette = {
      x: 0,
      y: 0,
      width: 40,
      height: video.videoHeight,
    };

    canvas.width = silhouette.width;
    canvas.height = silhouette.height;

    context.drawImage(
      video,
      silhouette.x,
      silhouette.y,
      silhouette.width,
      silhouette.height,
      0,
      0,
      silhouette.width,
      silhouette.height
    );

    return canvas.toDataURL("image/png");
  }, [cameraRef, canvasRef]);

  const handleResponse = useCallback(
    (response: AlcoOralResponse, screenshot: string) => {
      const { status, message, data } = response;

      if (status === "error") {
        if (state.counter < MAX_RETRIES) {
          setState((prev) => ({
            ...prev,
            counter: prev.counter + 1,
          }));
          return;
        }

        dispatch(
          testType === "alco"
            ? setAlcoOraltoxAIResult_(data)
            : setRapidTestResultString(data)
        );
        toast.error(message);
        setState((prev) => ({ ...prev, isSuccess: false }));
      } else {
        dispatch(
          testType === "alco"
            ? setAlocholImg(screenshot)
            : setOraltoxImg(screenshot)
        );
        setState((prev) => ({ ...prev, isSuccess: true }));
      }

      dispatch(setAlcoOraltoxAIResult(data));
      setState((prev) => ({
        ...prev,
        alcoOralRes: response,
        msg: message,
        alcoOralHasRes: true,
        isLoaderVisible: true,
      }));
    },
    [dispatch, state.counter, testType]
  );

  const checkAlcoOraltoxAIRes = useCallback(
    (response: AlcoOralResponse) => {
      if (state.retryCounter !== 3) return;

      if (testType === "oraltox" && response.data?.length < 8) {
        toast.info(
          "Tilt the device to reduce glare and move closer for a more accurate detection."
        );
      } else if (testType === "alco" && response.data !== "Positive") {
        toast.info(
          "Ensure the strip is within the silhouette for optimal detection."
        );
      }

      setState((prev) => ({
        ...prev,
        retryCounter: prev.retryCounter + 1,
      }));
    },
    [state.retryCounter, testType]
  );

  const checkForAlcoOraltox = useCallback(async () => {
    if (!cameraRef.current) return false;

    const screenshot = cameraRef.current.getScreenshot();
    if (!screenshot) return false;

    const imageBase64 =
      testType === "alco"
        ? captureCanvasImage()?.replace(/^data:image\/\w+;base64,/, "")
        : screenshot.replace(/^data:image\/\w+;base64,/, "");

    if (!imageBase64) {
      toast.error("Failed to capture the image.");
      return false;
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BEAM_SERVICE_URL}/read-oraltox-device`,
        { base64_image: imageBase64, type: testType },
        { headers: { "Content-Type": "application/json" } }
      );

      handleResponse(response.data, screenshot);
      checkAlcoOraltoxAIRes(response.data);
    } catch (error) {
      console.error("Error checking device:", error);
      toast.error("Failed to process the image.");
    }
  }, [
    cameraRef,
    testType,
    captureCanvasImage,
    handleResponse,
    checkAlcoOraltoxAIRes,
  ]);

  useEffect(() => {
    if (state.stopTimer) return;

    const timer = setTimeout(() => {
      checkForAlcoOraltox();
      setState((prev) => ({
        ...prev,
        showTimer: false,
        stopTimer: true,
      }));
    }, DETECTION_TIMEOUT);

    return () => clearTimeout(timer);
  }, [state.stopTimer, checkForAlcoOraltox]);

  return {
    msg: state.msg,
    isSuccess: state.isSuccess,
    alcoOralHasRes: state.alcoOralHasRes,
    alcoOralRes: state.alcoOralRes,
    showTimer: state.showTimer,
    time: state.time,
    isLoaderVisible: state.isLoaderVisible,
    recapture: resetState,
    stopTimer: state.stopTimer,
  };
};

export default useAlcoOralDetector;
