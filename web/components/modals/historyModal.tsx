'use client';

import { useEffect, useRef, useState } from 'react';

import { Modal, Button, ImageModal } from '@/components';
import Badge from '../badge';
import { SlClose } from 'react-icons/sl';
import { useSelector } from 'react-redux';
import { historyData } from '@/redux/slices/appConfig';
import Crypto from 'crypto-js';
import { authToken } from '@/redux/slices/auth';

interface SessionModalProps {
    show: boolean;
    onClose?: (a?: any) => void;
    data?: any;
}

const HistoryModal = ({ show, onClose, data }: SessionModalProps) => {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const history = useSelector(historyData);
    const id = data?.id || 0;
    const proofpass = history?.dtests?.find(
        (item: any, index: number) => index === parseInt(id as string),
    );
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [imageNames, setImageNames] = useState<string[]>([]);
    const [isLoadingImages, setIsLoadingImages] = useState(false);
    const { participant_id, pin } = useSelector(authToken);

    const getNumberOfDays = (startDate: string | undefined) => {
        if (!startDate) return NaN;
        const startDateObject = new Date(startDate);
        const currentDate = new Date();
        const difference = currentDate.getTime() - startDateObject.getTime();
        const daysDifference = difference / (1000 * 60 * 60 * 24);
        return Math.floor(daysDifference);
    };
    const openModal = () => setModalIsOpen(true);
    const closeModal = () => setModalIsOpen(false);

    useEffect(() => {
        if (participant_id && pin && proofpass?.Images) {
            const fetchImage = async (imageId: string | unknown) => {
                try {
                    const response = await fetch('/api/fetch-image', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            photo_id: imageId,
                            participant_id: participant_id as string,
                            pin: pin as string,
                        }),
                    });

                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }

                    const data = await response.json();
                    // console.log(data, "data from ov here");
                    // imageData.push(data?.data?.Imagebase64)
                    return data?.data?.Imagebase64;
                } catch (error) {
                    console.error('Error fetching image:', error);
                    return null;
                }
            };

            const handleSubmit = async () => {
                const images = proofpass.Images;
                // console.log(images, "before some logic was performed");
                const imagePromises = Object.values(images).map((imageId) =>
                    fetchImage(imageId),
                );
                const imgNames = Object.keys(images);
                const imageResponses = await Promise.all(imagePromises);
                // console.log(imageResponses, "from the useeffect");
                setImageUrls(imageResponses.filter(Boolean));
                setImageNames(imgNames);
                setIsLoadingImages(true);
            };

            handleSubmit();
        }
    }, [proofpass]);
    return (
        <Modal show={show} onClose={onClose}>
            <div className="history-modal">
                <div className="close-icon-row" onClick={onClose}>
                    <SlClose
                        size={30}
                        style={{ float: 'right' }}
                        className="clickable-icon-hover"
                    />
                </div>
                <h4 className="history-modal-title">{data?.ServiceType}</h4>
                <p className="history-modal-subtext">
                    {` This service took place ${getNumberOfDays(
                        data?.servicedate,
                    )} days ago`}
                </p>
                <Badge
                    type={
                        data?.DrugTestResultStatus
                            ? data?.DrugTestResultStatus
                            : 'Inconclusive'
                    }
                    text={
                        data?.DrugTestResultStatus
                            ? data?.DrugTestResultStatus
                            : 'Inconclusive'
                    }
                />
                <div className="history-modal-details">
                    <div className="history-modal-details-row">
                        <p>Donor/Participant ID:</p>
                        <p>{data?.ParticipantID}</p>
                    </div>
                    <div className="history-modal-details-row">
                        <p>Date of Service:</p>
                        <p>{data?.servicedate}</p>
                    </div>
                    <div className="history-modal-details-row">
                        <p>Identity:</p>
                        <p>{data?.GovernmentPhotoID || 'Not Applicable'}</p>
                    </div>
                    <div className="history-modal-details-row">
                        <p>Collection:</p>
                        <p>{data?.CollectionDesignation || 'Not Applicable'}</p>
                    </div>
                </div>
                {proofpass?.Images && (
                    <Button
                        blue
                        onClick={openModal}
                        style={{ height: '51px', marginBottom: '32px' }}
                    >
                        Document Images
                    </Button>
                )}
                <ImageModal
                    isOpen={modalIsOpen}
                    onClose={closeModal}
                    imageUrls={imageUrls}
                    imageNames={imageNames}
                />
                <h4 className="history-modal-title">PROOFpass</h4>
                <p className="history-modal-subtext">proof@recoverytrek.com</p>
            </div>
        </Modal>
    );
};

export default HistoryModal;
