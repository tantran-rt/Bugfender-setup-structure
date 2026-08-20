"use client";

import { useState } from 'react'
import Image from 'next/image';
import { FiEdit } from "react-icons/fi";
import { TbCapture } from "react-icons/tb";
import { useDispatch } from 'react-redux';

import './modal.css';
import Button from '../button';
import MiniLoader from '../loaders/miniLoader';
import { saveBarcode } from '@/redux/slices/drugTest';

interface BarcodeCaptureProps {
    show: boolean;
    barcode: string;
    barcodeImage: string;
    barcodeUploaded: boolean | undefined;
    step: number;
    totalSteps: number;
    recapture(): void;
    closeModal(): void;
}


function BarcodeCaptureModal({ show, barcode, barcodeImage, barcodeUploaded, step, totalSteps, recapture, closeModal }: BarcodeCaptureProps) {
    const [enterBarcode, setEnterBarcode] = useState(false);
    const [barcodeValue, setBarcodeValue] = useState('');

    const dispatch = useDispatch();

    const handleSaveBarcode = () => {
        if (enterBarcode) {
            setEnterBarcode(false);
        }
        closeModal();
    };

    const barcodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const barcode = e.target.value;
        setBarcodeValue(barcode);
        dispatch(saveBarcode(barcode));
    };

    return (
        show && <div className='barcode-cap-modal'>
            {!barcodeUploaded && !enterBarcode && <div className='bc-content'>
                <p className='test-steps'>{`Step ${step} of ${totalSteps}`}</p>
                {barcodeUploaded === undefined ?
                    <div className='bc-upload-stats'>
                        <h2 style={{ color: '#24527b' }}>Processing Barcode Image...</h2>
                        <MiniLoader size='50px' />
                    </div>
                    : <div className='bc-upload-stats'>
                        <h2 style={{ color: '#24527b' }}>Barcode not detected</h2>
                        <Button classname='cap-btn' onClick={recapture}><TbCapture /> Recapture</Button>
                    </div>}
            </div>}

            {barcodeUploaded && !enterBarcode && barcode === '' &&
                <div className='bc-content'>
                    <p className='test-steps'>{`Step ${step} of ${totalSteps}`}</p>
                    <div className='bc-upload-stats'>
                        <h2 style={{ color: '#24527b' }}>Barcode not detected</h2>
                        <Button classname='cap-btn' onClick={recapture}><TbCapture /> Recapture</Button>
                    </div>
                </div>}

            {barcodeUploaded && !enterBarcode && barcode !== '' && <div className='bc-content'>
                <p className='test-steps'>{`Step ${step} of ${totalSteps}`}</p>
                <div className='sum-text'>
                    <h2 style={{ color: '#24527b' }}>{barcode}</h2>
                    <Button classname='td-right' onClick={handleSaveBarcode}>Confirm</Button>
                </div>
            </div>}

            {enterBarcode && <div className='bc-content'>
                <p className='test-steps'>{`Step ${step} of ${totalSteps}`}</p>
                <div className='sum-text'>
                    <h4 style={{ color: '#24527b' }}>Enter Barcode without spaces <span style={{ color: 'red' }}>*</span></h4>
                    <Button classname='td-right' onClick={handleSaveBarcode} disabled={barcodeValue === '' ? true : false}>Confirm</Button>
                </div>
                <input className='bc-input' type='text' placeholder='Enter Barcode or N/A, if no text is present.' onChange={barcodeInput} />
            </div>}
            <div className='barcode-cap-img'>
                <Image src={barcodeImage!} alt="barcode" width={5000} height={5000} className="barcode-img" loading='lazy' />
            </div>
            {!enterBarcode && <div className='barcode-btns' style={{ flexDirection: 'column', alignItems: 'center' }}>
                <Button classname='cap-btn' onClick={recapture}><TbCapture /> Recapture</Button>
                <Button classname='man-btn' onClick={() => setEnterBarcode(true)}><FiEdit /> Enter Manually</Button>
            </div>}
        </div>
    )
}

export default BarcodeCaptureModal;