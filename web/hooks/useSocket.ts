import { ObjectDetectionResult } from "@/types/object-detections";
import { sendLogs } from "@/utils/sendAnalytics.utils";
import { useCallback, useEffect, useRef, useState } from "react";

// "wss://proof-image-socket-9c08c36.app.beam.cloud"
interface WebSocketMessage {
  event: string;
  payload: any;
}

const useSocketConnection = <T = string>(
  socketUrl: string,
  returnType?: T,
  retryCount: number = 0
) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [closeConnection, setCloseConnection] = useState(false);
  const [response, setResponse] = useState<T | null>(null);
  const [objectsDetected, setObjectsDetected] = useState<
    ObjectDetectionResult[]
  >([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentRetryCount = useRef<number>(0);
  const RETRY_INTERVAL = 20000;

  const connectWebSocket = useCallback(() => {
    if (socket) {
      socket.close();
    }

    // Create a WebSocket connection to the server
    const ws: WebSocket = new WebSocket(socketUrl);

    // Event listener when WebSocket opens
    ws.onopen = () => {
      setIsConnected(true);
      // console.log("Connected to WebSocket server");
      sendLogs("Socket connected");
      setCloseConnection(false);
      currentRetryCount.current = 0;
    };
    //
    // Event listener when a message is received from the server
    ws.onmessage = (event) => {
      if (typeof returnType === "boolean") {
        const response = JSON.parse(event.data);
        const result = response?.result;
        switch (response.event) {
          case "detect-face-boolean":
            if (!Boolean(result)) {
              sendLogs(
                `event: ${response.event} - results: ${JSON.stringify(result)}`
              );
            }
            setResponse(
              typeof returnType === "boolean" ? Boolean(result) : result
            );
            break;
          case "kit-detection":
            // sendLogs(
            //   `event: ${response.event} - results: ${JSON.stringify(result)}`
            // );
            if (result.value === 1) {
              setObjectsDetected(result.data);
            } else {
              // sendLogs(
              //   `event: ${response.event} - results: ${JSON.stringify(result)}`
              // );
              setObjectsDetected([]);
            }
            break;
          default:
            setResponse(
              typeof returnType === "boolean"
                ? Boolean(event?.data)
                : event?.data
            );
            break;
        }
      } else {
        setResponse(
          typeof returnType === "boolean" ? Boolean(event?.data) : event?.data
        );
      }
    };

    // Event listener when WebSocket closes
    ws.onclose = () => {
      setIsConnected(false);
      sendLogs("Disconnected from WebSocket server");
    };

    // Save WebSocket instance in state
    setSocket(ws);

    return ws;
  }, [socketUrl, returnType]);

  useEffect(() => {
    const ws = connectWebSocket();

    return () => {
      ws.close();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [connectWebSocket]);

  useEffect(() => {
    if (isConnected && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // if retryCount > 0 then start a timer for Retry
    if (
      !isConnected &&
      retryCount > 0 &&
      !intervalRef.current &&
      !closeConnection
    ) {
      intervalRef.current = setInterval(() => {
        if (currentRetryCount.current < retryCount) {
          sendLogs(
            `Retry socket connection after ${RETRY_INTERVAL}ms ${currentRetryCount.current}`
          );
          currentRetryCount.current += 1;
          connectWebSocket();
        } else {
          // Stop retrying when max attempts reached
          sendLogs(`Connection closed after ${retryCount} attempts`);
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
        }
      }, RETRY_INTERVAL);
    }
  }, [closeConnection, connectWebSocket, isConnected, retryCount]);

  const closeSocket = useCallback(() => {
    if (socket) {
      sendLogs("Closing socket connection");
      socket.close();
      setCloseConnection(true);
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [socket]);

  const openSocket = () => {
    return socket?.OPEN;
  };

  const sendMessageToEvent = useCallback(
    (eventType: string, data: any) => {
      if (socket && isConnected) {
        const message: WebSocketMessage = {
          event: eventType,
          payload: data
        };
        socket?.send(JSON.stringify(message));
      } else {
        console.warn("WebSocket is not open.");
      }
    },
    [socket, isConnected]
  );

  // Send a message to the WebSocket server
  const sendMessage = (message: string) => {
    if (message && isConnected) {
      socket?.send(message); // Send message to server
    } else {
      sendLogs("Socket not yet connected");
    }
  };

  return {
    isConnected,
    response,
    sendMessage,
    connecting: socket?.CONNECTING,
    closeSocket,
    openSocket,
    sendMessageToEvent,
    objectsDetected
    // startRecording,
    // stopRecording,
  };
};

export default useSocketConnection;
