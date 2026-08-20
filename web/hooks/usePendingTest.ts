"use client";

import { useEffect, useState } from "react";
import Crypto from "crypto-js";
import { sendLogs } from "@/utils/sendAnalytics.utils";
import type { PendingTestOptions } from "@/types/testCollection";

export interface UsePendingTestProps {
  filename?: string;
  testingKit: any;
  participant_id?: string | number;
  startTime?: string | number;
  endTime?: string | number;
  barcode?: string;
  scanBarcodeKitValue?: string;
  signature?: string;
  storage: any;
  lookAwayTimeslots?: string[];
  handsOut: any;
  trackingNumber: any;
  shippingLabel: any;
  barcodeKit: any;
  detectKit: any;
  proofId: any;
  faceCompare: any;
  faceScans: any;
  imageCaptures: any;
  passport: any;
  governmentID: any;
  idDetails: any;
  uploadId: any;
}

/**
 * Syncs the current test state to localStorage as an encrypted "pending test"
 * whenever test data or options change. Enables recovery if the user closes
 * the tab or navigates away mid-test.
 */
export function usePendingTest({
  filename,
  testingKit,
  participant_id,
  startTime,
  endTime,
  barcode,
  scanBarcodeKitValue,
  signature,
  storage,
  lookAwayTimeslots = [],
  handsOut,
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
  uploadId
}: UsePendingTestProps) {
  const [pendingTestOptions, setPendingTestOptions] =
    useState<PendingTestOptions>({
      confirmationNo: "",
      s3: true,
      ai_inference: true
    });

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (!filename || !testingKit || participant_id == null) {
        sendLogs("Skipped updated pending test on invalid data");
        return;
      }

      const testPending = {
        kit: testingKit,
        startTime,
        endTime,
        id: filename,
        filename,
        barcode,
        scanBarcodeKitValue,
        signature,
        storage,
        lookAwayTimeslots,
        handsOut,
        trackingNumber,
        shippingLabel,
        barcodeKit,
        detectKit,
        proofId,
        participant_id,
        faceCompare,
        faceScans,
        imageCaptures,
        passport,
        governmentID,
        idDetails,
        uploadId,
        confirmationNo: pendingTestOptions.confirmationNo,
        s3: pendingTestOptions.s3,
        ai_inference: pendingTestOptions.ai_inference
      };

      sendLogs(`Updated pending test ${JSON.stringify(pendingTestOptions)}`);

      const encrypted = Crypto.AES.encrypt(
        JSON.stringify(testPending),
        process.env.NEXT_PUBLIC_SECRET_KEY as string
      ).toString();
      localStorage.setItem("pendingTest", encrypted);
    } catch (error) {
      console.error("Error in usePendingTestSync:", error);
    }
  }, [
    filename,
    testingKit,
    participant_id,
    startTime,
    endTime,
    barcode,
    scanBarcodeKitValue,
    signature,
    storage,
    lookAwayTimeslots,
    handsOut,
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
    uploadId,
    pendingTestOptions
  ]);

  return {
    setPendingTestOptions
  };
}
