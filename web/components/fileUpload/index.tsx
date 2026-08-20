"use client";

import React, { CSSProperties, useRef } from 'react';
import Image from 'next/image';
import Button from '../button';

interface FileUploadProps {
    style?: CSSProperties;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onClose: () => void;
    onUpload: (base64: string) => void; // onUpload now handles base64 string
}

const FileUpload: React.FC<FileUploadProps> = ({ style, onChange, onClose, onUpload }) => {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];

            // Convert file to base64 string
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                onUpload(base64String); // Pass base64 string to onUpload
            };
            reader.readAsDataURL(file); // Converts to base64 string

            onChange(event); // Trigger onChange event
        }
    };

    const handleClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div style={{ width: '50%', display: 'flex' }}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept="image/png, image/jpeg, image/jpg"
            />
            <Button white style={style} onClick={handleClick}>
                <Image
                    className="upload-icon"
                    src="/icons/upload-icon.svg"
                    alt="Upload Icon"
                    width={20}
                    height={20}
                />
                Upload File
            </Button>
        </div>
    );
};

export default FileUpload;
