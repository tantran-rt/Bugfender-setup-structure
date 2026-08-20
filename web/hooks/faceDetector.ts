// import * as ml5 from "ml5";
// import { useEffect, useState } from "react";
// import { toast } from "react-toastify";
// import Webcam from "react-webcam";

// const useFaceDetector = (cameraRef: React.RefObject<Webcam | null>) => {
//   const [faceDetector, setFaceDetector] = useState<any>(null);
//   const [faceDetected, setFaceDetected] = useState(false);
//   const [faceDetectorEnabled, setFaceDetectorEnabled] = useState(false);
//   const loadFaceDetector = async () => {
//     try {
//       await ml5
//         .objectDetector("cocossd")
//         .then((detector: any) => {
//           setFaceDetector(detector);
//         })
//         .then(() => {
//           setFaceDetectorEnabled(true);
//         });
//     } catch (error) {
//       toast.error("Error loading face detector model.");
//     }
//   };
//   useEffect(() => {
//     (async () => {
//       await loadFaceDetector();
//     })();
//   }, []);

//   useEffect(() => {
//     const checkForFace = async () => {
//       if (window !== undefined) {
//         if (cameraRef.current && faceDetector) {
//           const screenshot = cameraRef.current.getScreenshot();
//           if (screenshot) {
//             const img = new window.Image();
//             img.src = screenshot;
//             img.onload = () => {
//               faceDetector.detect(img, (err: any, results: any[]) => {
//                 if (err) {
//                   console.error("Detection error:", err);
//                   return;
//                 }
//                 const face = results.find(
//                   (obj: { label: string }) => obj.label === "person"
//                 );
//                 setFaceDetected(!!face);
//               });
//             };
//           }
//         }
//       }
//     };

//     const interval = setInterval(checkForFace, 1000);
//     return () => {
//       clearInterval(interval);
//       // setFaceDetectorEnabled(false);
//     };
//   }, [cameraRef, faceDetector]);

//   return { faceDetected, faceDetector, faceDetectorEnabled };
// };

// export default useFaceDetector;
