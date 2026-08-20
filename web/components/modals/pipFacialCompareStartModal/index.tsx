"use client";

import { useState } from "react";
import Image from "next/image";
import "../../loaders/pipLoader.css";

interface IPipLoader {
  isVisible: boolean;
  onClose?: () => void;
}

const PipFacialCompareStartModal = ({ isVisible, onClose }: IPipLoader) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!isVisible) return null;

  return (
    <div className="pip-step-loader-bg">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          backgroundColor: "white",
          width: "386px",
          padding: "24px",
          borderRadius: "16px",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Image
          src={"/icons/facial-comparison-loader.svg"}
          alt="Facial Capture"
          width={100}
          height={100}
          loading="lazy"
        />
        <h3>Facial Capture</h3>
        <div style={{ marginBottom: "8px" }}>
          Please position your head and body in the silhouette you see on
          screen. Please be as still as possible and look directly at the
          camera.
        </div>

        <button
          style={{
            width: "338px",
            maxWidth: "90%",
            height: "48px",
            padding: "16px",
            gap: "8px",
            borderRadius: "12px",
            background: isHovered ? "#007ACC" : "#009CF9", // hover effect
            color: "#FFFFFF",
            border: "none",
            cursor: "pointer",
            transition: "background 0.3s ease",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={onClose}
        >
          Start Capture
        </button>
      </div>
    </div>
  );
};

export default PipFacialCompareStartModal;
