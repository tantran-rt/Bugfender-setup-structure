"use client";

import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

import { AppHeader, Button, DinamicMenuLayout } from '@/components';
import { setAIConfig, testData, type AIConfig } from '../../redux/slices/drugTest';
import { scoreMatrix, setScore, type AIItem } from '@/redux/slices/score-matrix';
import { testMapping } from '@/utils/appData';

function Debug() {
    const { AIConfig } = useSelector(testData);
    const scoringData = useSelector(scoreMatrix);
    const dispatch = useDispatch();

    const [testReviewThreshold, setTestReviewThreshold] = useState(AIConfig.test_review_threshold);
    const [testReviewTime, setTestReviewTime] = useState(AIConfig.test_review_time);
    const [handsTrackingConfidence, setHandsTrackingConfidence] = useState(AIConfig.hands_tracking_confidence);
    const [handsDetectionConfidence, setHandsDetectionConfidence] = useState(AIConfig.hands_detection_confidence);
    const [faceModelSelection, setFaceModelSelection] = useState(AIConfig.face_model_selection);
    const [faceDetectionConfidence, setFaceDetectionConfidence] = useState(AIConfig.face_detection_confidence);
    const [noiseFilteringAgressiveness, setNoiseFilteringAgressiveness] = useState(AIConfig.noise_filtering_aggressiveness);

    const handleInputChange = (score: number, index: number, key: string) => {
        const scoreData = {
            label: key,
            index: index,
            score: score
        }
        dispatch(setScore(scoreData))
    };

    const handleSaveConfig = () => {
        const configData: AIConfig = {
            test_review_threshold: testReviewThreshold,
            test_review_time: testReviewTime,
            hands_tracking_confidence: handsTrackingConfidence,
            hands_detection_confidence: handsDetectionConfidence,
            face_model_selection: faceModelSelection,
            face_detection_confidence: faceDetectionConfidence,
            noise_filtering_aggressiveness: noiseFilteringAgressiveness
        };
        dispatch(setAIConfig(configData));
        toast.success('AI configuration saved!');
    };

    return (
        <DinamicMenuLayout>
            <AppHeader title="AI Config" hasMute={false} />
            <div className='tutorial-container' style={{ marginTop: '20px' }}>
                <h1 style={{ color: '#009cf9', textDecoration: 'underline' }}>Scoring Matrix</h1>
                {Object.entries(scoringData).map((scoreArr, index) => (
                    <ScoreItem key={index} labelkey={scoreArr[0]} labels={scoreArr[1]} onChange={handleInputChange} />
                ))}
                <h1 style={{ color: '#009cf9', textDecoration: 'underline', marginBottom: '20px' }}>AI Dectection Configuration</h1>
                <div className='config-content'>
                    <article className='config'>
                        <h3 className='config-text'>Test Review Threshold: <span className='config-val'>{testReviewThreshold}</span></h3>
                        <Slider min={0} max={1} step={0.05} /*marks={{ 0.05: <></>, 0.10: <></> }}*/ value={testReviewThreshold} onChange={(value) => setTestReviewThreshold(+value)} />
                        <p className='config-text'>The highest acuracy for detection of proof test items</p>
                    </article>
                    <article className='config'>
                        <h3 className='config-text'>Test Review Time: <span className='config-val'>{testReviewTime}</span></h3>
                        <Slider min={5} max={30} step={1} value={testReviewTime} onChange={(value) => setTestReviewTime(+value)} />
                        <p className='config-text'>Time in seconds to review the test item before making a decision</p>
                    </article>
                    <article className='config'>
                        <h3 className='config-text'>Hands Tracking Confidence: <span className='config-val'>{handsTrackingConfidence}</span></h3>
                        <Slider min={0} max={1} step={0.05} value={handsTrackingConfidence} onChange={(value) => setHandsTrackingConfidence(+value)} />
                        <p className='config-text'>0 being the lowest and 1 being the highest acuracy for tracking of hands in the video</p>
                    </article>
                    <article className='config'>
                        <h3 className='config-text'>Hands Detection Confidence: <span className='config-val'>{handsDetectionConfidence}</span></h3>
                        <Slider min={0} max={1} step={0.05} value={handsDetectionConfidence} onChange={(value) => setHandsDetectionConfidence(+value)} />
                        <p className='config-text'>0 being the lowest and 1 being the highest acuracy for detection of hands in the video.</p>
                    </article>
                    <article className='config'>
                        <h3 className='config-text'>Face Model Selection: <span className='config-val'>{faceModelSelection}</span></h3>
                        <Slider min={0} max={1} step={1} value={faceModelSelection} onChange={(value) => setFaceModelSelection(+value)} />
                        <p className='config-text'>0 to select a short-range model that works best for faces within 2 meters from the camera, and 1 for a full-rangemodel best for faces within 5 meters</p>
                    </article>
                    <article className='config'>
                        <h3 className='config-text'>Face Detection Confidence: <span className='config-val'>{faceDetectionConfidence}</span></h3>
                        <Slider min={0} max={1} step={0.05} value={faceDetectionConfidence} onChange={(value) => setFaceDetectionConfidence(+value)} />
                        <p className='config-text'>0 being the lowest and 1 being the highest acuracy for detection of face in the video</p>
                    </article>
                    <article className='config'>
                        <h3 className='config-text'>Noise Filtering Agressiveness: <span className='config-val'>{noiseFilteringAgressiveness}</span></h3>
                        <Slider min={0} max={3} step={1} value={noiseFilteringAgressiveness} onChange={(value) => setNoiseFilteringAgressiveness(+value)} />
                        <p className='config-text'>0 is the least aggressive about filtering out non-speech, 3 is the most aggressive</p>
                    </article>
                </div>
                <Button blue onClick={handleSaveConfig} style={{ marginTop: '30px', width: '10rem', height: '3rem', marginBottom: '50px' }}>
                    Save Config
                </Button>
            </div>
        </DinamicMenuLayout>
    )
};

export default Debug;

//Was too lazy create a component this works fine haha
type ScoreItemProps = {
    labelkey: string;
    labels: AIItem[];
    onChange(score: number, index: number, key: string): void;
};

const ScoreItem = ({ labelkey, labels, onChange }: ScoreItemProps) => {
    return (<div className='score-item'>
        <h2>{testMapping[labelkey]}</h2>
        <div className='config-content'>
            {labels.map(({ label, value, score }, index) => (
                <article className='score' key={index}>
                    <label htmlFor={value}>{label}</label>
                    <input type='number' id={value} name={value} value={score} onChange={(e) => onChange(+e.target.value, index, labelkey)} />
                </article>
            ))}
        </div>
    </div>)
}