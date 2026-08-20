"use client";

import React, { useState } from "react";
import "./actionModal.css";

interface ActionModalProps {
  isVisible: boolean;
  success?: boolean;
  onClose?: () => void;
}

const ActionModal = ({
  isVisible,
  success = false,
  onClose = () => {}
}: ActionModalProps) => {
  // Exit early if modal is not visible
  if (!isVisible) return null;

  // Define variables for conditional rendering
  const title = success ? "Success!" : "Rapid Test Completed";
  const message = success
    ? "Your rapid test results have been uploaded. Please set aside the additional PROOF kit. We’ll contact you if another test is needed. Click Continue to upload your collection video."
    : "Your rapid test results have been uploaded. Click Continue to begin your additional test.";

  const primaryButtonText = "Continue";

  return (
    <div className="modal-bg" role="dialog" aria-labelledby="modal-title">
      <div className="modal-container">
        <p id="modal-title" className="modal-title">
          {title}
        </p>
        <p
          className="message"
          dangerouslySetInnerHTML={{ __html: message }}
        ></p>
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

export default ActionModal;
