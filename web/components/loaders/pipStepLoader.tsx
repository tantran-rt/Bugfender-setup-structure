"use client";

import { useEffect, useState } from 'react';
import './pipStepLoader.css';

interface IPipLoader {
    pipStep: number;
    isVisible: boolean;
    onClose?: () => void;
}

const PipStepLoader = ({ pipStep, isVisible, onClose }: IPipLoader) => {
    const [progress, setProgress] = useState(0);
    const [completedStepsMessage, setCompletedStepsMessage] = useState('');

    useEffect(() => {
        if (isVisible) {
            // Set progress based on pipStep
            if (pipStep === 1) {
                setProgress(33); // 33% for step 1
                setCompletedStepsMessage('You have successfully completed PIP Step 1.');
            } else if (pipStep === 2) {
                setProgress(66); // 66% for step 2
                setCompletedStepsMessage('You have successfully completed PIP Step 1 and Step 2.');
            } else if (pipStep === 3) {
                setProgress(100); // 100% for step 3
                setCompletedStepsMessage('You have successfully completed PIP Step 1, Step 2, and Step 3.');
            } else {
                setProgress(0); // Default to 0 for no step
                setCompletedStepsMessage('No steps completed yet.');
            }
        }
    }, [isVisible, pipStep]);

    if (!isVisible) return null;

    return (
        <div className="pip-step-loader-bg">
            <div className="pip-step-loader">
                <p style={{ textAlign: "left" }}>Good Job!</p>
                <p>{completedStepsMessage}</p>
                <div className="progress-bar-container">
                    <div className="progress-bar">
                        <div
                            className="progress-level"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <div className="step-indicators">
                        <div className={`progress-step ${pipStep >= 1 ? 'active' : ''}`}>1</div>
                        <div className={`progress-step ${pipStep >= 2 ? 'active' : ''}`}>2</div>
                        <div className={`progress-step ${pipStep >= 3 ? 'active' : ''}`}>3</div>
                    </div>
                </div>
                <button className='pip-step-loader-btn' onClick={onClose}>Continue</button>
            </div>
        </div>
    );
};

export default PipStepLoader;
