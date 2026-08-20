"use client";

import { uploadImagesToS3 } from "@/app/identity-profile/id-detection/step-1/action";
import {
  idType,
  setExtractedFaceImage,
  setIDFront,
} from "@/redux/slices/appConfig";
import {
  setGovernmentID,
  setIdDetails,
  setPassport,
  setProofID,
} from "@/redux/slices/drugTest";
import { extractIdAndFace } from "@/utils/queries";
import { sendLogs } from "@/utils/sendAnalytics.utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Webcam from "react-webcam";

export const useIDDetection = (
  participant_id: string,
  cameraRef: React.RefObject<Webcam | null>
) => {
  const docType = useSelector(idType);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(5);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isLoaderVisible, setLoaderVisible] = useState(false);
  const [isDocTypeVisible, setDocTypeVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preCaturedImage, setPreCapturedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCountdown, setShowCountdown] = useState<boolean>(false);
  const [idInformation, setIDInformation] = useState<
    | {
        first_name: string;
        last_name: string;
        middle_name: string;
        date_of_birth: string;
        address: string;
        city: string;
        state: string;
        zipcode: string;
      }[]
  >([]);

  const dispatch = useDispatch();

  // A ref to track if images have been set already (ensures first successful response)
  const isFirstResponse = useRef(true);

  const extractFace = useCallback(
    async (imgBase64: string) => {
      try {
        const extractedFaces = await extractIdAndFace(
          imgBase64,
          docType === "DL" ? "driver_license" : "passport"
        );
        if (extractedFaces?.message === "0 faces found" && !faceImage) {
          // setCapturedImage(null);
          sendLogs(`extractFace 0 faces found`);
          return false;
        } else if (extractedFaces.status === "error" && !faceImage) {
          // setCapturedImage(null);
          sendLogs(`extractFace failed ${JSON.stringify(extractedFaces)}`);
          return false;
        }

        setLoaderVisible(true);

        return {
          face: extractedFaces?.result,
          capturedImg: extractedFaces?.base64_image,
          data: extractedFaces?.data,
        };
      } catch (error) {
        console.error("Error extracting face", error);
        return false;
      }
    },
    [docType, faceImage]
  );

  const captureFrame = useCallback(async () => {
    try {
      setShowCountdown(true);
      const imageSrc = cameraRef?.current?.getScreenshot();

      setPreCapturedImage(imageSrc as string);

      if (imageSrc && !faceImage) {
        extractFace(imageSrc!.replace(/^data:image\/\w+;base64,/, "")).then(
          (result: any) => {
            const face = result?.face;
            const dateNow = Date.now();
            const idCapture = `${participant_id}-IDCapture-${dateNow}.png`;
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
            if (idInformation.length < 3) {
              setIDInformation((prev) => {
                return [...prev, idDetails];
              });
            }

            // Only set `capturedImage` and `faceImage` on the first successful response
            if (
              face &&
              !faceImage &&
              !capturedImage &&
              isFirstResponse.current
            ) {
              isFirstResponse.current = false;
              sendLogs(`extractFace successed - stopCapture`);
              stopCapture();
              setCapturedImage(`data:image/png;base64,${result?.capturedImg}`);
              dispatch(setGovernmentID(idCapture));
              dispatch(
                setIDFront(`data:image/png;base64,${result?.capturedImg}`)
              );
              uploadImagesToS3(
                `data:image/png;base64,${result?.capturedImg}`,
                idCapture
              );

              const faceBase64 = `data:image/png;base64,${face[0]}`;
              setFaceImage(faceBase64);
              dispatch(setExtractedFaceImage(faceBase64));
              const passportCapture = `${participant_id}-PassportCapture-${dateNow}.png`;
              const proofId = idCapture.split(".")[0];
              dispatch(setPassport(passportCapture));
              uploadImagesToS3(faceBase64, passportCapture);
              dispatch(setProofID(proofId));

              // console.log(idDetails);
              dispatch(setIdDetails(idDetails));
            }
          }
        );
      }
    } catch (error) {
      console.error("Error capturing image. Please try again.");
      sendLogs(`Error capturing image. Please try again ${error}`);
    }
  }, [
    cameraRef,
    extractFace,
    // sendMessage,
    faceImage,
    dispatch,
    participant_id,
    preCaturedImage,
    capturedImage,
  ]);

  const startCapture = useCallback(() => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
    }
    sendLogs(`Start screen captured ...`);
    captureIntervalRef.current = setInterval(captureFrame, 1000);
    isFirstResponse.current = true;
  }, [captureFrame]);

  const stopCapture = useCallback(() => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
  }, []);
  const handleLoaderClose = () => {
    setLoaderVisible(false);
  };

  const handleDocClose = () => {
    setIsLoading(true);
    startCapture();
    // startRecording(setPreCapturedImage);
    setDocTypeVisible(false);
  };

  const recaptureImage = () => {
    setCapturedImage(null);
    setFaceImage(null);
    setFaceImage("");
    setLoaderVisible(false);
    setDocTypeVisible(true);
    startCapture();
    // startRecording(setPreCapturedImage);
  };

  useEffect(() => {
    setDocTypeVisible(true);
  }, []);

  return {
    capturedImage,
    faceImage,
    timeLeft,
    captureFrame,
    // isVisible,
    stopCapture,
    isLoaderVisible,
    isDocTypeVisible,
    isLoading,
    recaptureImage,
    handleDocClose,
    handleLoaderClose,
    // isConnected,
    errorMsg,
    idInformation,
    showCountdown,
  };
};
