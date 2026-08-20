"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { sendLogs } from "@/utils/sendAnalytics.utils";
import { getNextStep } from "@/utils/testCollectionUtils";
import { Step } from "@/types/testCollection";

const TIMER_END_AUDIO_PATH = "/audio/chime_twice_sound.mp3";
const STEP_ADVANCE_DELAY_MS = 1000;
const SHOW_TIMER_DELAY_MS = 2000;

export interface UseTimerStepProps {
  activeStep: number;
  timerObjs: any[] | undefined;
  test: any[];
  performLabelScan: boolean;
  generateBeamBlob: () => void;
  setCurrentStep: (step: Step | null) => void;
  setActiveStep: (step: number) => void;
}

export interface UseTimerStepReturn {
  showTimer: boolean;
  time: number;
  handleTimerEnd: () => void;
}

/**
 * Manages the timed-step flow during a test collection:
 * - Activates a countdown timer when a step has a configured timer
 * - Plays audio chime when time expires
 * - Advances to the next step after a short delay
 */
export function useTimerStep({
  activeStep,
  timerObjs,
  test,
  performLabelScan,
  generateBeamBlob,
  setCurrentStep,
  setActiveStep,
}: UseTimerStepProps): UseTimerStepReturn {
  const [showTimer, setShowTimer] = useState(false);
  const [time, setTime] = useState(0);
  const timerEndedAudioRef = useRef(new Audio(TIMER_END_AUDIO_PATH));

  useEffect(() => {
    console.log("Current Step:", activeStep);
    const timerStep = timerObjs?.find(
      (timerObj) => timerObj.after_step === activeStep
    );

    if (timerStep) {
      console.log("timer next-->", timerStep);
      setTime(timerStep.step_time);
      setTimeout(() => {
        setShowTimer(true);
      }, SHOW_TIMER_DELAY_MS);
    }
  }, [activeStep, timerObjs]);

  const handleTimerEnd = useCallback(() => {
    setTime(0);
    generateBeamBlob();
    timerEndedAudioRef.current.play().catch((error) => {
      console.log("Playing timer end audio failed:", error);
    });
    sendLogs("Timer ended, moving to next step");
    setTimeout(() => {
      setCurrentStep(getNextStep(test, activeStep, performLabelScan));
      setActiveStep(activeStep + 1);
      setShowTimer(false);
    }, STEP_ADVANCE_DELAY_MS);
  }, [
    activeStep,
    performLabelScan,
    test,
    generateBeamBlob,
    setCurrentStep,
    setActiveStep,
  ]);

  return { showTimer, time, handleTimerEnd };
}
