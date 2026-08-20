"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Image from "next/image";
import styles from "./appHeader.module.css";
import { testData } from "@/redux/slices/drugTest";
import { appData } from "@/redux/slices/appConfig";

interface AppHeaderProps {
  title: string;
  className?: string;
  muted?: boolean;
  hasMute: boolean;
  currentStep?: number;
  totalSteps?: number;
  onClickMute?: () => void;
  onHomePressed?: () => void;
}

function AppHeader({
  title,
  className,
  muted = true,
  hasMute = true,
  currentStep = 0,
  totalSteps = 0,
  onClickMute,
  onHomePressed,
}: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { PROOF_Home_Logo } = useSelector(appData);
  const { testingKit } = useSelector(testData);

  const [homeButtonHover, setHomeButtonHover] = useState(false);
  const [muteButtonHover, setMuteButtonHover] = useState(false);

  const handleBack = () => {
    if (pathname === "/test-collection/collection-summary") {
      router.push("/test-collection");
    } else if (pathname === `/test-collection/${testingKit.kit_id}`) {
      toast.warn("You are taking a test. You can not go back");
    } else {
      router.back();
    }
  };

  const goHome = () => {
    if (
      pathname === `/test-collection/${testingKit.kit_id}` ||
      pathname === `/feedback` ||
      pathname === `/test-collection/rapid-test/oraltox` ||
      pathname === `/test-collection/rapid-test/oraltox/oraltox-detection` ||
      pathname === `/test-collection/rapid-test/oraltox/oral-result` ||
      pathname === `/test-collection/rapid-test/quiktox` ||
      pathname === `/test-collection/rapid-test/quiktox/quiktox-detection` ||
      pathname === `/test-collection/rapid-test/quiktox/results` ||
      pathname === `/test-collection/rapid-test/screenshots` ||
      pathname === `/test-collection/collection-summary`
    ) {
      onHomePressed?.();
      return;
    }
    router.push("/test-collection");
  };

  return (
    <div className={styles.appHeaderContainer}>
      <div className={styles.routeHome}>
        <div className={styles.leftButtonsContainer}>
          <div
            onClick={goHome}
            onMouseEnter={() => setHomeButtonHover(true)}
            onMouseLeave={() => setHomeButtonHover(false)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              backgroundColor: homeButtonHover ? "#007cc9" : "transparent",
              borderRadius: "8px",
              padding: "6px 10px",
              transform: homeButtonHover ? "scale(1.02)" : "scale(1)",
              transition: "all 0.2s ease-in-out",
              whiteSpace: "nowrap",
            }}
          >
            <Image
              src="/icons/home-icon.png"
              width={16}
              height={16}
              alt="Home icon"
              loading="lazy"
              style={{
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "14px",
                lineHeight: "1",
                fontWeight: "bold",
                color: "#ffffff",
                transition: "color 0.2s ease-in-out",
                display: "inline-block",
                margin: 0,
              }}
            >
              Home
            </span>
          </div>

          {hasMute && (
            <div
              onClick={onClickMute}
              onMouseEnter={() => setMuteButtonHover(true)}
              onMouseLeave={() => setMuteButtonHover(false)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                backgroundColor: muteButtonHover ? "#007cc9" : "transparent",
                borderRadius: "8px",
                padding: "6px 10px",
                transform: muteButtonHover ? "scale(1.02)" : "scale(1)",
                transition: "all 0.2s ease-in-out",
                whiteSpace: "nowrap",
              }}
            >
              {muted ? (
                <Image
                  src="/icons/icon-speaker-muted.png"
                  width={16}
                  height={16}
                  alt="Speaker icon"
                  style={{
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <Image
                  src="/icons/icon-speaker-unmuted.png"
                  width={16}
                  height={16}
                  alt="Speaker icon"
                  style={{
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
              )}
              <span
                style={{
                  fontSize: "14px",
                  lineHeight: "1",
                  fontWeight: "bold",
                  color: "#ffffff",
                  transition: "color 0.2s ease-in-out",
                  display: "inline-block",
                  margin: 0,
                }}
              >
                {muted ? "Unmute" : "Mute"}
              </span>
            </div>
          )}
        </div>

        <div className={styles.rightImageContainer}>
          <Image
            className={styles.btnDesktopImg}
            src={"/icons/proof-header-icon.png"}
            width={5000}
            height={5000}
            alt="List view icon"
            loading="lazy"
          />
          <Image
            className={styles.btnDesktopImg}
            src={PROOF_Home_Logo || "/icons/pr-home-icon.svg"}
            width={5000}
            height={5000}
            alt="List view icon"
            loading="lazy"
          />
        </div>
      </div>

      <div className={styles.wrapSubHeader}>
        {totalSteps > 0 && (
          <p className={styles.stepNumber}>
            STEP {currentStep} of {totalSteps}
          </p>
        )}
        <div className={styles.titleContainer}>{title} </div>
      </div>
    </div>
  );
}

export default AppHeader;
