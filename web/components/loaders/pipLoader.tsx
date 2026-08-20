"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import "./pipLoader.css";

interface IPipLoader {
  pipStep: number;
  isVisible: boolean;
  onClose?: () => void;
}

const PipLoader = ({ pipStep, isVisible, onClose }: IPipLoader) => {
  const [progress, setProgress] = useState(0);
  const [currentLoaderIndex, setCurrentLoaderIndex] = useState(0); // State to control the currently displayed item
  const [loaderData] = useState([
    {
      id: 1,
      desc: "Face Extraction, please wait...",
      img: "/icons/face-extraction-loader.svg",
    },
    {
      id: 2,
      desc: "Face Comparison, please wait....",
      img: "/icons/facial-comparison-loader.svg",
    },
    {
      id: 3,
      desc: "Face Processing, please wait....",
      img: "/icons/face-processing-loader.svg",
    },
  ]);

  useEffect(() => {
    if (isVisible) {
      // Reset progress and loader index when the loader becomes visible
      setProgress(0);
      setCurrentLoaderIndex(pipStep === 2 ? 0 : pipStep - 1); // Set initial index based on pipStep

      // Start the progress bar animation
      const interval = setInterval(() => {
        setProgress((prevProgress) => {
          const newProgress = prevProgress + 1;
          return newProgress <= 100 ? newProgress : 100;
        });
      }, 100); // Increase progress by 1% every 100ms (10 seconds total)
      if (pipStep === 2) {
        setCurrentLoaderIndex(2);
      }
      // If pipStep is 2, handle the time-based switching
      if (pipStep === 2) {
        const switchToSecondItem = setTimeout(() => {
          setCurrentLoaderIndex(1); // Switch to the second item (index 1) after 5 seconds
        }, 5000); // Switch at 5 seconds

        return () => {
          clearInterval(interval);
          clearTimeout(switchToSecondItem);
        };
      }

      // Cleanup interval if pipStep is not 2 (no switching logic)
      return () => clearInterval(interval);
    }
  }, [isVisible, pipStep]);

  useEffect(() => {
    if (isVisible) {
      // Set a timer to hide the loader after 10 seconds
      const timer = setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 10000); // 10 seconds

      // Cleanup timer on component unmount or when isVisible changes
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  // Get the current loader data based on the index
  const currentLoaderData = loaderData[currentLoaderIndex];

  return (
    <div className="pip-loader-bg">
      <div className="pip-loader">
        <Image
          src={currentLoaderData.img} // Dynamically display the image based on the current index
          alt="Loader Icon"
          className="pip-loader-icon"
          width={5000}
          height={5000}
          loading="lazy"
        />
        <p>{currentLoaderData.desc}</p>{" "}
        {/* Dynamically display the description */}
        <div className="progress-bar">
          <div
            className="progress-level"
            style={{ width: `${progress}%` }} // Set width based on progress
          ></div>
        </div>
      </div>
    </div>
  );
};

export default PipLoader;
