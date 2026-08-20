"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { removeScanReport } from "@/redux/slices/appConfig";
import { ImagePreviewModal, Button } from "@/components";
import "./thumbnailGallery.css";

interface ThumbnailGalleryProps {
  images: string[];
}

const ThumbnailGallery = ({ images }: ThumbnailGalleryProps) => {
  const dispatch = useDispatch();
  const extractImages = images?.flatMap(
    (obj: { [s: string]: string } | ArrayLike<string>) => Object.values(obj)
  );
  const allKeysAndValues = images?.flatMap((obj) => Object.entries(obj));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePreview = (index: number) => {
    setCurrentIndex(index);
    setIsModalOpen(true);
  };

  const handleRemove = (index: number) => {
    dispatch(removeScanReport(index));
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="thumbnail-gallery">
      {extractImages.map((report, index) => (
        <div key={index} className="thumbnail">
          <Image
            src={report}
            alt={`Captured ${allKeysAndValues[index]}`}
            width={100}
            height={100}
          />
          <div className="thumbnail-overlay">
            <Button
              classname="thumbnail-overlay-btn-view"
              onClick={() => handlePreview(index)}
            >
              View
            </Button>
            <Button
              classname="thumbnail-overlay-btn-remove"
              onClick={() => handleRemove(index)}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
      {isModalOpen && (
        <ImagePreviewModal
          images={extractImages}
          currentIndex={currentIndex}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default ThumbnailGallery;
