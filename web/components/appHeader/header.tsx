"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Image from "next/image";
import styles from "./appHeader.module.css";
import { testData } from "@/redux/slices/drugTest";
import { GoMute } from "react-icons/go";
import { RxSpeakerLoud } from "react-icons/rx";
import { appData } from "@/redux/slices/appConfig";

interface AppHeaderProps {
  title: string;
  description?: string;
  className?: string;
  icon1?: JSX.Element;
  icon2?: JSX.Element;
  onClickMute?: () => void;
  muted?: boolean;
  hasMute: boolean;
  handleDialog?: () => void;
  toggleScan?: () => void;
}

const Header = ({
  title,
  description,
  className,
  icon1,
  icon2,
  onClickMute,
  muted,
  hasMute,
  handleDialog,
  toggleScan,
}: AppHeaderProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { testingKit } = useSelector(testData);
  const userPermissions = useSelector(appData);
  const permissions = userPermissions?.permissions;
  const appPermissions = permissions ? permissions.split(";") : undefined;
  const isTestCollectionPg = pathname === "/test-collection";

  const handleBack = () => {
    if (pathname === "/test-collection/collection-summary") {
      router.push("/home");
    } else if (pathname === `/test-collection/${testingKit?.kit_id}`) {
      toast.warn("You are taking a test. You cannot go back");
    } else {
      router.back();
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          marginTop: "0px",
          padding: "0 8px",
        }}
      >
        <div
          className={styles.iconContainer_}
          onClick={() => {
            pathname !== `/test-collection/${testingKit?.kit_id}`
              ? handleBack()
              : handleDialog?.();
          }}
        >
          {icon1}
        </div>

        <div className={styles.iconContainer}>{title}</div>

        <div
          onClick={onClickMute}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            cursor: "pointer",
            padding: "4px",
            borderRadius: "50%",
            backgroundColor: isHovered ? "#E5F5FF" : "transparent",
            transition: "background-color 0.2s ease",
          }}
        >
          {icon2}
          {hasMute ? (
            muted ? (
              <GoMute color={isHovered ? "#666" : "#adadad"} size={18} />
            ) : (
              <RxSpeakerLoud
                color={isHovered ? "#007acc" : "#009cf9"}
                size={18}
              />
            )
          ) : (
            isTestCollectionPg &&
            appPermissions?.includes("Detect Kit") && (
              <Image
                onClick={toggleScan}
                className="desktop-scan-icon"
                src={"/icons/scan-icon.png"}
                alt="proof image"
                width={3000}
                height={3000}
                loading="lazy"
              />
            )
          )}
        </div>
      </div>
      <div className={styles.descriptionContainer}>{description}</div>
    </>
  );
};

export default Header;
