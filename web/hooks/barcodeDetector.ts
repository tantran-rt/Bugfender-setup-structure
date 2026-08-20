import { detectBarcodesAI2 } from "@/utils/queries";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import Webcam from "react-webcam";

const useBarcodeDetector = (cameraRef: React.RefObject<Webcam | null>) => {
  const [barcode, setBarcode] = useState<string>("");
  const [detectionEnded, setDetectionEnded] = useState<boolean>(false);
  const startDetection = useRef<boolean>(false);
  const timerId = useRef<NodeJS.Timeout | undefined>(undefined);

  const detectBarcode = useCallback(async () => {
    try {
      const imageSrc = cameraRef?.current!.getScreenshot();

      // const barcodeResult = await detectBarcodesAI(imageSrc!);
      const barcodeResult = await detectBarcodesAI2(imageSrc!);

      console.log("bc scan res:", barcodeResult);

      if (barcodeResult.status === "complete") {
        // const code = barcodeResult.result[0].data;
        const code = barcodeResult.data.parsed;
        setBarcode(code);
      }

      if (barcodeResult.status === "error") {
        toast.warn(`${barcodeResult.message}`);
      }
    } catch (error) {
      toast.error("Error detecting barcode. Please try again.");
      console.error("Barcode Capture Error:", error);
    }
  }, [cameraRef]);

  useEffect(() => {
    if (startDetection.current) {
      timerId.current = setInterval(detectBarcode, 100);

      setTimeout(() => {
        startDetection.current = false;
        clearInterval(timerId.current);
        setDetectionEnded(false);
      }, 60000);
    }
    if (barcode) clearInterval(timerId.current);
    return () => clearInterval(timerId.current);
  }, [barcode, detectBarcode]);

  return { startDetection, barcode, detectionEnded };
};

export default useBarcodeDetector;
