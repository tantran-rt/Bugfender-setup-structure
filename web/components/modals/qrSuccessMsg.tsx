"use client";

import Image from "next/image";
import "./documentTypeModal.css";

interface ModalProps {
  onClose?: () => void;
}

const QrSuccessMsg = ({ onClose }: ModalProps) => {
  return (
    <div className="modal-overlay-document-type">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px 24px",
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={"/icons/qr-success-msg.svg"}
          alt="Loader Icon"
          className="pip-loader-icon"
          width={5000}
          height={5000}
          loading="lazy"
        />
        <br />
        <p
          style={{ fontSize: "16px", fontWeight: "400px", textAlign: "center" }}
        >
          QR Code Scanned
          <br />
          Successfully
        </p>
        <br />
        <br />
        <button
          style={{
            height: "48px",
            padding: "12px 90px",
            color: "#FFFFFF",
            backgroundColor: "#009CF9",
            border: "none",
            borderRadius: "12px",
          }}
          onClick={onClose}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default QrSuccessMsg;
