"use client";

import { useEffect, useState } from "react";
import { AI_Options } from "@/types/object-detections";
import { KitDetectionData } from "@/types/object-detections";
import { Step } from "@/types/testCollection";
import { isIncludesAIOption } from "@/utils/testCollectionUtils";
import { sendLogs } from "@/utils/sendAnalytics.utils";

export interface UseFillBloodVialDelayProps {
  currentStep: Step | null;
  kitDetectionData: KitDetectionData;
}

export interface UseFillBloodVialDelayReturn {
  isFillBloodVialStep: boolean;
  delayPassed: boolean;
}

/**
 * Single source of truth for the FillBloodVial 20s delay.
 * When the step uses AI_Options.FillBloodVial, delayPassed becomes true only after FILL_BLOOD_VIAL_DELAY_MS.
 */

export const FILL_BLOOD_VIAL_DELAY = 20000;

export function useFillBloodVialDelay({
  currentStep,
  kitDetectionData
}: UseFillBloodVialDelayProps): UseFillBloodVialDelayReturn {
  const isFillBloodVialStep = Boolean(
    isIncludesAIOption(currentStep?.ai_options, AI_Options.FilledBloodVial)
  );

  const [delayPassed, setDelayPassed] = useState(false);

  useEffect(() => {
    if (!isFillBloodVialStep) {
      setDelayPassed(false);
      return;
    }
    const timeoutId = setTimeout(() => {
      setDelayPassed(true);
      sendLogs(
        `Start detect filled blood vial after ${FILL_BLOOD_VIAL_DELAY} ms`
      );
    }, FILL_BLOOD_VIAL_DELAY);
    return () => clearTimeout(timeoutId);
  }, [isFillBloodVialStep]);

  return { isFillBloodVialStep, delayPassed };
}
