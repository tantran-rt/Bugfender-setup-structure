"use client";

import React, { useState, useEffect, useCallback } from "react";
import ReactSignatureCanvas from "react-signature-canvas";

interface SignatureCaptureProps {
  clearSignatureConfirmed: boolean;
}

const SignatureCapture = ({
  clearSignatureConfirmed,
}: SignatureCaptureProps) => {
  const [sigCanvas, setSigCanvas] = useState<any | null>();

  const clearSignature = useCallback(() => {
    sigCanvas?.clear();
  }, [sigCanvas]);

  useEffect(() => {
    if (clearSignatureConfirmed) {
      clearSignature();
    }
  }, [clearSignature, clearSignatureConfirmed]);

  return (
    <div
  style={{
    width: "100%",
    height: "100%",
    border: "2px solid #24527B",
    borderRadius: "8px",
  }}
>
  <ReactSignatureCanvas
    ref={(data: any) => setSigCanvas(data)}
    penColor="#24527B"
    canvasProps={{ width: 600, height: 250, className: "sigCanvas" }}
  />
</div>

  );
};

export default SignatureCapture;
