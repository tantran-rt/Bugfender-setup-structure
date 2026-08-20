"use client";

import React, { useState } from "react";
import "./actionModal.css";

interface HealthAssessmentModalProps {
  isVisible: boolean;
  success?: boolean;
  onClose?: () => void;
}

const HealthAssessmentModal = ({
  isVisible,
  success = false,
  onClose = () => {}
}: HealthAssessmentModalProps) => {
  // Exit early if modal is not visible
  if (!isVisible) return null;

  // Define variables for conditional rendering
  const title = "Measurement Failed";
  const message =
    "One issue during the measurement process. Please ensure you follow the instructions carefully. Click Continue to try again.";

  const primaryButtonText = "Continue";

  return (
    <div className="modal-bg" role="dialog" aria-labelledby="modal-title">
      <div
        id="container"
        className="flex flex-col items-start justify-start bg-white w-[500px] gap-2 text-left p-6 rounded-2xl"
      >
        <p id="modal-title" className="modal-title">
          {title}
        </p>
        <p
          className="message"
          dangerouslySetInnerHTML={{ __html: message }}
        ></p>
        <li style={{ textAlign: "left" }}>Avoid movement</li>
        <li style={{ textAlign: "left" }}>Improve lighting</li>
        <li style={{ textAlign: "left" }}>Move closer to the camera</li>
        <li style={{ textAlign: "left" }}>Remove obstructions from the face</li>
        <li style={{ textAlign: "left" }}>Clean your camera lens</li>

        <div
          className="wrap-btns"
          style={{
            display: "flex",
            width: "100%",
            gap: "12px",
            justifyContent: "center"
          }}
        >
          <button
            className="main-button"
            onClick={onClose}
            aria-label="Continue"
          >
            {primaryButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealthAssessmentModal;
