"use client";

import { useMemo, useRef } from "react";
import { sendLogs } from "@/utils/sendAnalytics.utils";
import { isDevicePositionMatched } from "@/utils/utils";
import {
  ObjectDetectionClass,
  AI_Options,
  REALTIME_INSTRUCTIONS,
  ArmPoseResult,
  RealtimeMessage
} from "@/types/object-detections";
import {
  KitDetectionData,
  ObjectClassMapping,
  ObjectDetectionResult
} from "@/types/object-detections";
import { Step } from "@/types/testCollection";
import { isIncludesAIOption } from "@/utils/testCollectionUtils";

export interface UseObjectDetectionProps {
  currentStep: Step | null;
  kitDetectionData: KitDetectionData | null;
  objectsDetected: ObjectDetectionResult[];
  fillBloodVialDelayPassed?: boolean;
  poseArmResult?: ArmPoseResult | null;
  frameCaptureWidth?: number;
  frameCaptureHeight?: number;
}

export interface DetectedObject {
  type: "default" | "arm";
  boundingBox: number[];
}

export interface UseObjectDetectionReturn {
  enableObjectDetection: boolean;
  results: DetectedObject[];
  instructionMessage: RealtimeMessage | null;
}

const ARM_BOX_SCALE = { width: 0.5, height: 0.2, centerShiftX: 0.5 };
const EMPTY_OBJECTS: DetectedObject[] = [];
const EMPTY_POSITION: number[] = [];

/**
 * Encapsulates object detection state and effects for the test collection flow:
 * - Position match (arm vs device) for "Device on Arm"
 * - Enable detection and message from current step + kit config
 * - Bounding boxes and success state derived from objectsDetected
 */
export function useObjectDetection({
  currentStep,
  kitDetectionData,
  objectsDetected,
  poseArmResult,
  frameCaptureWidth,
  frameCaptureHeight
}: UseObjectDetectionProps): UseObjectDetectionReturn {
  const currentOption =
    currentStep?.ai_options && kitDetectionData?.ai_options
      ? kitDetectionData.ai_options.find((optionMapping: ObjectClassMapping) =>
          isIncludesAIOption(currentStep.ai_options, optionMapping.name)
        )
      : null;
  const isHeatingPadStep = isIncludesAIOption(
    currentStep?.ai_options,
    AI_Options.HeatPackOnArm
  );

  const armPosRef = useRef<number[]>(EMPTY_POSITION);
  const devicePositionRef = useRef<number[]>(EMPTY_POSITION);
  const heatingPackDetected = useRef<boolean>(false);

  // Combine pose arm detection with websocket object detections in a single
  // normalized [0, 1] coordinate space. Server-side boxes arrive in the
  // downscaled frame's pixel space (frameCaptureWidth x frameCaptureHeight);
  // divide through once here so every downstream consumer — overlap checks,
  // render overlays — speaks the same units as the MediaPipe arm box.
  const fusedObjects = useMemo(() => {
    const canNormalize =
      !!frameCaptureWidth &&
      !!frameCaptureHeight &&
      frameCaptureWidth > 0 &&
      frameCaptureHeight > 0;

    const normalizedWsObjects = canNormalize
      ? objectsDetected
          .filter((e) => e.class !== ObjectDetectionClass.ArmVisible)
          .map((e) => ({
            ...e,
            //Convert server-side box to normalized [0, 1] coordinates
            box: [
              e.box[0] / frameCaptureWidth,
              e.box[1] / frameCaptureHeight,
              e.box[2] / frameCaptureWidth,
              e.box[3] / frameCaptureHeight
            ]
          }))
      : [];

    if (!poseArmResult?.armVisible || !poseArmResult.armBox) {
      return normalizedWsObjects;
    }
    return [
      ...normalizedWsObjects,
      {
        class: ObjectDetectionClass.ArmVisible,
        box: poseArmResult.armBox,
        score: poseArmResult.confidence
      }
    ];
  }, [objectsDetected, poseArmResult, frameCaptureWidth, frameCaptureHeight]);

  const { detectedObjects, deviceOnCorrectPosition } = useMemo(() => {
    if (fusedObjects.length === 0) {
      devicePositionRef.current = EMPTY_POSITION;
      return { detectedObjects: EMPTY_OBJECTS, deviceOnCorrectPosition: false };
    }

    const filtered = fusedObjects.filter((element) =>
      currentOption?.objects.includes(element.class)
    );

    const objects: DetectedObject[] = filtered.map((element) => {
      const [x1, y1, x2, y2] = element.box;
      switch (element.class) {
        case ObjectDetectionClass.ArmVisible: {
          const width = x2 - x1;
          const height = y2 - y1;
          const centerX = x1 + width / 2;
          const centerY = y1 + height / 2;
          const newWidth = width * ARM_BOX_SCALE.width;
          const newHeight = height * ARM_BOX_SCALE.height;

          const bestPosition = [
            centerX - newWidth / 2 - newWidth * ARM_BOX_SCALE.centerShiftX,
            centerY - newHeight / 2,
            centerX + newWidth / 2 - newWidth * ARM_BOX_SCALE.centerShiftX,
            centerY + newHeight / 2
          ];
          armPosRef.current = bestPosition;
          return {
            type: isHeatingPadStep ? "arm" : "default",
            boundingBox: bestPosition
          };
        }

        case ObjectDetectionClass.KitVisible:
        case ObjectDetectionClass.KitActivated:
        case ObjectDetectionClass.ArmWithEmptyVial:
        case ObjectDetectionClass.ArmWithBloodFilledVial:
        case ObjectDetectionClass.HeatingPackVisible:
        case ObjectDetectionClass.HeatingPackActivated: {
          heatingPackDetected.current = true;
          const newDevPos = [x1, y1, x2, y2];
          devicePositionRef.current = newDevPos;
          return { type: "default", boundingBox: newDevPos };
        }

        default: {
          return { type: "default", boundingBox: [x1, y1, x2, y2] };
        }
      }
    });

    const arm = armPosRef.current;
    const devPos = devicePositionRef.current;
    let positionMatched = false;

    if (arm.length > 0 && devicePositionRef.current.length > 0) {
      positionMatched = isDevicePositionMatched(arm, devPos);
      if (!positionMatched) {
        sendLogs(`Checking arm and device position match: ${positionMatched}`);
      }
    }

    return {
      detectedObjects: objects,
      deviceOnCorrectPosition: positionMatched
    };
  }, [fusedObjects, currentOption?.objects, isHeatingPadStep]);

  const getDefaultMessage = (option: string) => {
    switch (option) {
      case AI_Options.HeatPackOnArm:
        if (armPosRef.current.length) {
          return heatingPackDetected.current
            ? REALTIME_INSTRUCTIONS.heatingPackOnIncorrectSpot
            : REALTIME_INSTRUCTIONS.keepArmInfrontOfCamera;
        } else {
          return REALTIME_INSTRUCTIONS.keepArmInfrontOfCamera;
        }
      case AI_Options.Device_On_Arm:
        return REALTIME_INSTRUCTIONS.keepArmInfrontOfCamera;
      case AI_Options.FilledBloodVial:
        return REALTIME_INSTRUCTIONS.keepArmWithDeviceInFrontOfCamera;
      default:
        return REALTIME_INSTRUCTIONS.default;
    }
  };

  const generateHeatingPackMessage = useMemo(
    () =>
      (
        objectsDetected: ObjectDetectionResult[],
        armPosition: number[]
      ): RealtimeMessage | null => {
        const heatingPadVisible = objectsDetected.some(
          (e) =>
            e.class === ObjectDetectionClass.HeatingPackVisible ||
            e.class === ObjectDetectionClass.HeatingPackActivated
        );
        if (armPosition.length === 0) {
          return {
            status: false,
            message: REALTIME_INSTRUCTIONS.keepArmInfrontOfCamera
          };
        } else {
          if (heatingPadVisible) {
            return deviceOnCorrectPosition
              ? {
                  status: true,
                  message: REALTIME_INSTRUCTIONS.heatPackOnCorrectPosition
                }
              : {
                  status: false,
                  message: REALTIME_INSTRUCTIONS.heatingPackOnIncorrectSpot
                };
          } else {
            return heatingPackDetected.current
              ? {
                  status: false,
                  message: REALTIME_INSTRUCTIONS.heatingPackOnIncorrectSpot
                }
              : {
                  status: false,
                  message: REALTIME_INSTRUCTIONS.putHeatingPackOnCorrectSpot
                };
          }
        }
      },
    [deviceOnCorrectPosition]
  );

  const generateDeviceOnArmMessage = useMemo(
    () =>
      (
        objectsDetected: ObjectDetectionResult[],
        armPosition: number[]
      ): RealtimeMessage | null => {
        const kitVisible = objectsDetected.some(
          (e) =>
            e.class === ObjectDetectionClass.KitVisible ||
            e.class === ObjectDetectionClass.KitActivated ||
            e.class === ObjectDetectionClass.ArmWithEmptyVial ||
            e.class === ObjectDetectionClass.ArmWithBloodFilledVial
        );
        if (armPosition.length === 0) {
          return {
            status: false,
            message: REALTIME_INSTRUCTIONS.keepArmInfrontOfCamera
          };
        } else {
          if (kitVisible) {
            return deviceOnCorrectPosition
              ? {
                  status: true,
                  message: REALTIME_INSTRUCTIONS.deviceHasOnCorrectPosition
                }
              : {
                  status: false,
                  message: REALTIME_INSTRUCTIONS.deviceOnInCorrectSpot
                };
          }
          return {
            status: false,
            message: REALTIME_INSTRUCTIONS.putDeviceOnCorrectPosition
          };
        }
      },
    [deviceOnCorrectPosition]
  );

  const message: RealtimeMessage | null = useMemo(() => {
    if (!currentOption)
      return { status: false, message: REALTIME_INSTRUCTIONS.default };
    if (fusedObjects.length === 0) {
      const defaultMessage = {
        status: false,
        message: getDefaultMessage(currentOption.name)
      };
      return defaultMessage;
    }

    switch (currentOption.name) {
      case AI_Options.Specimen_Vial_In_Hand:
        const kitVisible = fusedObjects.some(
          (e) => e.class === ObjectDetectionClass.SalivaContainer
        );

        return kitVisible
          ? null
          : { status: false, message: REALTIME_INSTRUCTIONS.default };
      case AI_Options.HeatPackInHand: {
        const isActivated = fusedObjects.some(
          (e) => e.class === ObjectDetectionClass.HeatingPackActivated
        );
        return isActivated
          ? {
              status: true,
              message: REALTIME_INSTRUCTIONS.heatingPackIsActivated
            }
          : {
              status: false,
              message: REALTIME_INSTRUCTIONS.heatingPackIsNotActivated
            };
      }
      case AI_Options.HeatPackOnArm: {
        return generateHeatingPackMessage(fusedObjects, armPosRef.current);
      }
      case AI_Options.Device_On_Arm:
        return generateDeviceOnArmMessage(fusedObjects, armPosRef.current);
      case AI_Options.ActivatedDeviceOnArm: {
        const isActivated = fusedObjects.some(
          (e) => e.class === ObjectDetectionClass.KitActivated
        );
        return isActivated
          ? {
              status: true,
              message: REALTIME_INSTRUCTIONS.deviceIsActivated
            }
          : {
              status: false,
              message: REALTIME_INSTRUCTIONS.deviceIsNotActivated
            };
      }
      case AI_Options.FilledBloodVial: {
        const hasBloodFilled = fusedObjects.some(
          (e) => e.class === ObjectDetectionClass.ArmWithBloodFilledVial
        );

        const hasEmptyVial =
          kitDetectionData?.type === "red-drop-whole-blood"
            ? fusedObjects.some(
                (e) =>
                  e.class === ObjectDetectionClass.KitVisible ||
                  e.class === ObjectDetectionClass.KitActivated
              )
            : fusedObjects.some(
                (e) => e.class === ObjectDetectionClass.ArmWithEmptyVial
              );

        if (hasBloodFilled)
          return { status: true, message: REALTIME_INSTRUCTIONS.bloodFilled };
        if (hasEmptyVial)
          return { status: false, message: REALTIME_INSTRUCTIONS.emptyVial };
        return {
          status: false,
          message: REALTIME_INSTRUCTIONS.keepArmWithDeviceInFrontOfCamera
        };
      }
      default:
        return { status: false, message: REALTIME_INSTRUCTIONS.default };
    }
  }, [
    currentOption,
    fusedObjects,
    generateDeviceOnArmMessage,
    generateHeatingPackMessage,
    kitDetectionData?.type
  ]);

  const enableObjectDetection =
    Boolean(currentOption) && Boolean(kitDetectionData);

  return {
    enableObjectDetection,
    results: detectedObjects,
    instructionMessage: message
  };
}
