"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { authToken } from "@/redux/slices/auth";
import { sendLogs } from "@/utils/sendAnalytics.utils";

interface CameraPermissionsOptions {
  showToast?: boolean;
  showInstructions?: boolean;
  resetPermissions?: boolean;
}

export const useCameraPermissions = ({
  showToast = true,
  showInstructions = true,
  resetPermissions = false,
}: CameraPermissionsOptions = {}) => {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [status, setStatus] = useState<"acquiring" | "granted" | "denied">(
    "acquiring"
  );
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const loginData = useSelector((state: any) => state.auth);

  // Memoize the function to avoid recreating it on each render
  const checkPermissions = useCallback(async () => {
    let mediaStream: MediaStream | null = null;

    try {
      // Check the permission status using navigator.permissions API (if supported)
      sendLogs(`Verify camera permissions...`);
      const permissionStatus = await navigator.permissions.query({
        name: "camera" as any,
      });
      sendLogs(`permissionStatus ${JSON.stringify(permissionStatus.state)}`);
      if (permissionStatus?.state === "granted") {
        // Permission is already granted
        setPermissionsGranted(true);
        setStatus("granted");
      } else if (permissionStatus?.state === "prompt" || !permissionStatus) {
        // Permission is in the "prompt" state (or Permissions API is unsupported)
        await navigator.mediaDevices
          .getUserMedia({
            video: true,
          })
          .then((stream) => {
            sendLogs(`Permission allowed`);
            setPermissionsGranted(true);
            setStatus("granted");
            stream.getTracks().forEach((track) => track.stop()); // Close the stream after obtaining the camera
          })
          .catch((error) => {
            setStatus("denied");
            console.log(`Camera access failed ${error}`);
          });
      } else if (permissionStatus?.state === "denied") {
        setPermissionsGranted(false);
        setStatus("denied");
        setPermissionError(
          "Camera access has been denied. Please enable it in your browser settings to continue."
        );
        if (showToast) {
          toast.error(
            "Camera access has been denied. Please enable it in your browser settings to continue."
          );
        }
        if (showInstructions) {
          showEnableCameraInstructions();
        }
      }
    } catch (error) {
      setStatus("denied");
      setPermissionError(
        "Error accessing camera. Please allow camera access to continue."
      );
      if (showToast) {
        toast.error(
          "Error accessing camera. Please allow camera access to continue."
        );
      }
    }
  }, [showToast]);

  // Function to show instructions to the user on how to enable camera access
  const showEnableCameraInstructions = useCallback(() => {
    alert(
      "Camera access has been denied. Please enable it in your browser settings:\n\n1. Click the lock icon next to the URL, or behind the URL.\n2. Under Permissions, change Camera to 'Allow'.\n3. Refresh the page to use the camera."
    );
  }, []);

  useEffect(() => {
    // Reset permissions if resetPermissions flag is true
    if (resetPermissions) {
      setPermissionsGranted(false);
      setPermissionError(null);
    }

    // Only check permissions if the user is logged in and permissions haven't been granted yet
    if (loginData.token && !permissionsGranted) {
      checkPermissions();
    }

    return () => {
      // Cleanup logic can go here if necessary
    };
  }, [loginData.token, resetPermissions, permissionsGranted, checkPermissions]);

  return { status, permissionsGranted, permissionError };
};

// export const useCameraPermissions = ({
//   showToast = true,
//   resetPermissions = false,
// }: CameraPermissionsOptions = {}) => {
//   const [permissionsGranted, setPermissionsGranted] = useState(false);
//   const [permissionError, setPermissionError] = useState<string | null>(null);
//   const loginData = useSelector((state: any) => state.auth);

//   useEffect(() => {
//     // Cleanup previous media stream when component unmounts or permissions change
//     let mediaStream: MediaStream | null = null;

//     // Reset permissions if resetPermissions flag is true
//     if (resetPermissions) {
//       setPermissionsGranted(false);
//       setPermissionError(null);
//     }

//     const checkPermissions = async () => {
//       console.log("checkPermissions");

//       try {
//         // Check the permission status using navigator.permissions API (if supported)
//         const permissionStatus = await navigator.permissions.query({
//           name: "camera" as any,
//         });

//         console.log(permissionStatus, "permissionStatus");

//         if (permissionStatus?.state === "granted") {
//           // Permission is already granted
//           setPermissionsGranted(true);
//         } else if (permissionStatus?.state === "prompt" || !permissionStatus) {
//           // Permission is in the "prompt" state (or Permissions API is unsupported)
//           console.log(permissionStatus, "permissionStatus");

//           // Request the camera access
//           mediaStream = await navigator.mediaDevices.getUserMedia({
//             video: true,
//           });
//           setPermissionsGranted(true);
//           mediaStream.getTracks().forEach((track) => track.stop()); // Close the stream after obtaining the camera
//         } else if (permissionStatus?.state === "denied") {
//           // Permission is denied
//           console.log("Permission denied. Informing user to enable manually.");

//           // Show error message and instructions to enable camera access manually
//           setPermissionError(
//             "Camera access has been denied. Please enable it in your browser settings to continue."
//           );
//           if (showToast) {
//             toast.error(
//               "Camera access has been denied. Please enable it in your browser settings to continue."
//             );
//           }

//           // Show instructions to help the user re-enable camera permissions
//           showEnableCameraInstructions();
//         } else {
//           // Fallback if the permission API status is not recognized
//           console.log("Unexpected permission status");
//         }
//       } catch (error) {
//         console.log(error, "error");
//         setPermissionError(
//           "Error accessing camera. Please allow camera access to continue."
//         );
//         if (showToast) {
//           toast.error(
//             "Error accessing camera. Please allow camera access to continue."
//           );
//         }
//       }
//     };

//     // Function to show instructions to the user on how to enable camera access
//     const showEnableCameraInstructions = () => {
//       alert(
//         "Camera access has been denied. Please enable it in your browser settings:\n\n1. Click the lock icon next to the URL, or behind the URL.\n2. Under Permissions, change Camera to 'Allow'.\n3. Refresh the page to use the camera."
//       );
//     };

//     // Only check permissions if they haven't been granted and if the user is logged in
//     if (!permissionsGranted && loginData.token) {
//       checkPermissions();
//     }

//     // Cleanup function: Stop the media stream if it exists and cleanup async operations
//     return () => {
//       if (mediaStream) {
//         mediaStream.getTracks().forEach((track) => track.stop());
//       }
//     };
//   }, [permissionsGranted, showToast, resetPermissions, loginData.token]);

//   return { permissionsGranted, permissionError };
// };
