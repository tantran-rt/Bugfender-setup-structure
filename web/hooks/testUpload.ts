import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import { createPresignedUrl } from "@/app/test-collection/[slug]/action";
import { authToken } from "@/redux/slices/auth";
import {
  saveConfirmationNo,
  setUploadingStatus,
  testData
} from "@/redux/slices/drugTest";
import { blobToBuffer, getConnectionType } from "@/utils/utils";
import { toast } from "react-toastify";
import useGetDeviceInfo from "./useGetDeviceInfo";
import { sendLogs } from "@/utils/sendAnalytics.utils";

function useTestupload() {
  const dispatch = useDispatch();
  const {
    storage,
    lookAwayTimeslots,
    handsOut,
    filename,
    testingKit,
    startTime,
    endTime,
    signature,
    barcode,
    trackingNumber,
    shippingLabel,
    barcodeKit,
    detectKit,
    proofId,
    faceCompare,
    faceScans,
    imageCaptures,
    passport,
    governmentID,
    idDetails,
    barcodePip2Url,
    scanBarcodeKitValue
  } = useSelector(testData);
  const { participant_id } = useSelector(authToken);
  const {
    osName,
    osVersion,
    deviceModel,
    deviceType,
    deviceVendor,
    browserName
  } = useGetDeviceInfo();

  const testUpload = useCallback(async () => {
    try {
      const connectionType = getConnectionType();
      const keyFilename = filename.replace(/[\/\(\)\[\]\{\}#&?%=+~`;*^$]/g, "");
      const body = JSON.stringify({
        record_id: keyFilename,
        record: {
          participant_id: participant_id as string,
          url: keyFilename || "",
          photo_url: faceCompare ? `${faceCompare}` : "",
          start_time: startTime,
          end_time: endTime,
          submitted: Date.now().toString(),
          barcode_string: barcode,
          internet_connection: connectionType,
          app_version: "web-2.7.0",
          os_version: `${osName}-${osVersion}`,
          phone_model: `${deviceModel}`,
          device_name: `${deviceVendor}-${deviceType}-${browserName}`,
          device_storage: storage,
          look_away_time: lookAwayTimeslots.join(","),
          hand_out_of_frame: handsOut,
          drugkitname: testingKit?.kit_name,
          kit_id: testingKit?.kit_id,
          tracking_number: trackingNumber,
          shippinglabelurl: shippingLabel ? `${shippingLabel}` : "",
          barcode_url: barcodeKit,
          scan_barcode_kit_value: scanBarcodeKitValue,
          detect_kit_value: detectKit,

          signature_screenshot: signature ? `${signature}` : "",
          proof_id:
            proofId && (proofId.includes(".png") ? proofId : proofId + ".png"),

          // face_compare_url: faceCompare ? `${faceCompare}` : "",
          face_compare_url: proofId.includes(".png")
            ? proofId
            : proofId + ".png",
          face_scan1_url: faceScans[0] ? `${faceScans[0]?.url}` : "",
          face_scan2_url: faceScans[1] ? `${faceScans[1]?.url}` : "",
          face_scan3_url: faceScans[2] ? `${faceScans[2]?.url}` : "",
          face_scan1_percentage: faceScans[0]
            ? `${faceScans[0]?.percentage}`
            : "",
          face_scan2_percentage: faceScans[1]
            ? `${faceScans[1]?.percentage}`
            : "",
          face_scan3_percentage: faceScans[2]
            ? `${faceScans[2]?.percentage}`
            : "",
          // image_capture1_url: imageCaptures ? `${imageCaptures[0]!}` : "",
          image_capture1_url: imageCaptures?.[0] ?? "",
          image_capture2_url: imageCaptures?.[1] ?? "",
          passport_photo_url: passport ? `${passport}` : "",
          government_photo_url: governmentID
            ? `${governmentID}`
            : (imageCaptures?.[0] ?? ""),
          first_name: idDetails.first_name,
          last_name: idDetails.last_name,
          middle_name: idDetails.middle_name,
          date_of_birth: idDetails.date_of_birth,
          address: idDetails.address,
          city: idDetails.city,
          state: idDetails.state,
          zipcode: idDetails.zipcode,
          bucket: "web app"
        }
      });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BEAM_SERVICE_URL}/send-results`,
        {
          method: "POST",
          headers: {
            Accept: "*/*",
            "Accept-Encoding": "gzip, deflate",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_BEAM_AUTH}`,
            "Content-Type": "application/json",
            Connection: "keep-alive"
          },
          body: body
        }
      );
      const data = await response.json();
      if (data.status === "success") {
        sendLogs(`Self Drug Test Upload success`);
        const confirmationNumber = `${Date.now()}`;
        dispatch(saveConfirmationNo(confirmationNumber));
        return { ...data, confirmationNo: confirmationNumber };
      } else {
        sendLogs("Self Drug Test Upload failed:", JSON.stringify(data));
        throw Error("Self Drug Test Upload failed");
      }
    } catch (error) {
      console.error("Self Drug Test Upload error:", error);
      sendLogs(`Self Drug Test Upload error: ${error}`);
      throw error;
    }
  }, [
    filename,
    participant_id,
    faceCompare,
    startTime,
    endTime,
    barcode,
    osName,
    osVersion,
    browserName,
    deviceModel,
    deviceVendor,
    deviceType,
    storage,
    lookAwayTimeslots,
    handsOut,
    testingKit?.kit_name,
    testingKit?.kit_id,
    trackingNumber,
    shippingLabel,
    barcodeKit,
    scanBarcodeKitValue,
    detectKit,
    signature,
    proofId,
    faceScans,
    imageCaptures,
    passport,
    governmentID,
    idDetails.first_name,
    idDetails.last_name,
    idDetails.middle_name,
    idDetails.date_of_birth,
    idDetails.address,
    idDetails.city,
    idDetails.state,
    idDetails.zipcode,
    dispatch
  ]);
  const uploadVideo = async (url: string, buffer: Buffer, blob: Blob) => {
    const response = await fetch(url, {
      method: "PUT",
      body: Buffer.from(buffer),
      headers: {
        "Content-Length": blob!.size as unknown as string,
        "Content-Type": "video/mp4"
      }
    });
    if (response.status === 200) {
      return true;
    } else {
      throw new Error("S3 Upload Error");
    }
  };
  const convertToMp4 = async (filename: string) => {
    fetch(`${process.env.NEXT_PUBLIC_BEAM_SERVICE_URL}/convert-to-mp4`, {
      method: "POST",
      headers: {
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_BEAM_AUTH}`,
        "Content-Type": "application/json",
        Connection: "keep-alive"
      },
      body: JSON.stringify({
        uri: filename
      })
    });
  };
  const uploader = useCallback(
    async (blob: Blob, pendingTest?: () => void) => {
      try {
        const webmBlob = new Blob([blob], { type: "video/mp4" });
        const buffer = await blobToBuffer(webmBlob!);
        const keyFilename = filename.replace(
          /[\/\(\)\[\]\{\}#&?%=+~`;*^$]/g,
          ""
        );
        dispatch(setUploadingStatus(true));
        await testUpload();

        const url = await createPresignedUrl(keyFilename, "video/webm");
        if (url) {
          await uploadVideo(url, buffer as Buffer, webmBlob);
          setTimeout(() => {
            dispatch(setUploadingStatus(false));
            //only do this if it not mp4
            convertToMp4(keyFilename);
          }, 45000);
        }
        return true;
      } catch (error) {
        setTimeout(() => {
          pendingTest?.();
          if (error instanceof Error) {
            toast.error(error.message);
          }
          console.error("Upload error:", error);
          return false;
        }, 45000);
      }
    },
    [dispatch, testUpload, filename]
  );

  return { uploader, testUpload };
}

export default useTestupload;
