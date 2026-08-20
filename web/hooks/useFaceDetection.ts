// hooks/useFaceDetection.ts
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import * as Sentry from "@sentry/nextjs";
import { extractFaceAI, extractIdAndFace } from "@/utils/queries";
import { setExtractedFaceImage, setIDFront } from "@/redux/slices/appConfig";
import {
  setGovernmentID,
  setIdDetails,
  setPassport,
  setProofID,
} from "@/redux/slices/drugTest";
import { useDispatch } from "react-redux";
import Webcam from "react-webcam";
import { uploadImagesToS3 } from "@/app/identity-profile/id-detection/step-1/action";
import { sendLogs } from "@/utils/sendAnalytics.utils";

export const useFaceDetection = (
  participant_id: string,
  cameraRef: React.RefObject<Webcam | null>
) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(5);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaderVisible, setLoaderVisible] = useState(false);
  const [isDocTypeVisible, setDocTypeVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCountdown, setShowCountdown] = useState<boolean>(false);
  const dispatch = useDispatch();
  const docTypeReft = useRef("");

  const extractFace = useCallback(
    async (imgBase64: string) => {
      setIsVisible(true);
      const selectedDocType = docTypeReft.current;
      const extractedFaces = await extractIdAndFace(
        imgBase64,
        selectedDocType === "DL" ? "driver_license" : "passport"
      );
      if (extractedFaces.message === "0 faces found" && !faceImage) {
        Sentry.captureMessage("An error occurred extracting face");
        toast.error("Face not detected, Re-try!");
        sendLogs(`An error occurred extracting face ${selectedDocType}`);
        setIsVisible(false);
        setLoaderVisible(false);
        setCapturedImage(null);
        setTimeLeft(5);
        setDocTypeVisible(true);
        setShowCountdown(false);
        return false;
      } else if (extractedFaces.status === "error" && !faceImage) {
        Sentry.captureMessage("Could not read id information");
        toast.error("Could not processs id, please Re-try!");
        sendLogs(`Could not read id information ${selectedDocType}`);
        setIsVisible(false);
        setLoaderVisible(false);
        setCapturedImage(null);
        setTimeLeft(5);
        setDocTypeVisible(true);
        setShowCountdown(false);
        return false;
      }
      setIsVisible(false);
      setLoaderVisible(true);

      return {
        face: extractedFaces?.result,
        capturedImg: extractedFaces?.base64_image,
        data: extractedFaces?.data,
      };
    },
    [docTypeReft, faceImage]
  );

  const captureFrame = useCallback(async () => {
    try {
      const dateNow = Date.now();
      const imageSrc = cameraRef?.current?.getScreenshot();
      const idCapture = `${participant_id}-IDCapture-${dateNow}.png`;
      setCapturedImage(imageSrc as any);
      dispatch(setGovernmentID(idCapture));
      dispatch(setIDFront(imageSrc!));
      // uploadFileToS3(imageSrc!, idCapture);
      uploadImagesToS3(imageSrc!, idCapture);

      await extractFace(imageSrc!.replace(/^data:image\/\w+;base64,/, "")).then(
        (result: any) => {
          if (result?.face) {
            sendLogs("Manual reading ID and extracting face successful");
            stopTimer();
            const faceBase64 = `data:image/png;base64,${result?.face[0]}`;
            setFaceImage(faceBase64);
            dispatch(setExtractedFaceImage(faceBase64));
            const passportCapture = `${participant_id}-PassportCapture-${dateNow}.png`;
            const proofId = idCapture.split(".")[0];
            dispatch(setPassport(passportCapture));
            dispatch(setProofID(proofId));
            // uploadFileToS3(faceBase64, passportCapture);
            uploadImagesToS3(faceBase64, passportCapture);
            const idDetails = {
              first_name: result?.data?.["first_name"],
              last_name: result?.data?.["last_name"],
              middle_name: result?.data?.["middle_name"],
              date_of_birth:
                typeof result?.data?.["date_of_birth"] === "number"
                  ? new Date(result?.data?.["date_of_birth"])
                  : result?.data?.["date_of_birth"],
              address: result?.data?.["address"],
              city: result?.data?.["city"],
              state: result?.data?.["state"],
              zipcode: result?.data?.["zip_code"],
              gender: "",
              height: "",
              eye_color: "",
            };
            dispatch(setIdDetails(idDetails));
          }
        }
      );
    } catch (error) {
      toast.error("Error capturing image. Please try again.");
      setIsVisible(false);
      recaptureImage();
    }
  }, [cameraRef, participant_id, dispatch, extractFace]);

  const startTimer = (timeLimit: number) => {
    setTimeLeft(timeLimit);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const updatedTime = prev - 1;
        if (updatedTime <= 0) {
          clearInterval(timerIntervalRef.current as NodeJS.Timeout);
          captureFrame().then(() => {
            setIsLoading(false);
          });
        }
        return updatedTime;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      setTimeLeft(0);
    }
  };
  const handleLoaderClose = () => {
    setLoaderVisible(false);
  };

  const handleDocClose = (docType: string) => {
    docTypeReft.current = docType;

    setShowCountdown(true);
    setIsLoading(true);
    startTimer(timeLeft);
    setDocTypeVisible(false);
  };
  const recaptureImage = () => {
    setCapturedImage(null);
    setFaceImage(null);
    setLoaderVisible(false);
    setTimeLeft(5);
    setDocTypeVisible(true);
    setShowCountdown(false);
  };

  useEffect(() => {
    setDocTypeVisible(true);
  }, []);

  return {
    manualCaptureImage: capturedImage,
    manualFaceImage: faceImage,
    timeLeft,
    captureFrame,
    isVisible,
    isLoaderVisible,
    isDocTypeVisible,
    isLoading,
    recaptureManualImage: recaptureImage,
    handleManualCapture: handleDocClose,
    handleLoaderClose,
    showCountdown,
  };
};
