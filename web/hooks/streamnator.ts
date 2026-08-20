import { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";

const useSockets = (
  cameraRef: React.RefObject<Webcam | null>,
  liveVideo: any,
  status: string
) => {
  const canvasRef = useRef(null);
  const socketRef = useRef<WebSocket>(new WebSocket("ws://localhost:8000/ws"));

  useEffect(() => {
    // Handle processed frames from the backend
    socketRef.current.onmessage = (event) => {
      console.log("hand detection:", event);
    };

    const socketCopy = socketRef.current;

    return () => {
      socketCopy.close();
    };
  }, []);

  useEffect(() => {
    const sendFrame = () => {
      if (
        cameraRef?.current?.stream === undefined ||
        cameraRef?.current?.stream === null
      ) {
        return;
      }
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      context?.drawImage(liveVideo, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = `${reader?.result}`.split(",")[1];
          socketRef.current.send(base64data);
        };
        reader.readAsDataURL(blob!);
      }, "image/jpeg");

      requestAnimationFrame(sendFrame);
    };

    if (status === "previewing") {
      sendFrame();
    }
  }, [cameraRef, liveVideo, status]);
};

export default useSockets;
