"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components";
import Link from "next/link";
import { GoHome } from "react-icons/go";
import { BsMortarboardFill, BsFillPersonCheckFill } from "react-icons/bs";
import { IoSettingsOutline } from "react-icons/io5";
import styles from "./appHeader.module.css";
import { usePathname, useRouter } from "next/navigation";
import { testData } from "@/redux/slices/drugTest";
import { useSelector } from "react-redux";
import { AiFillCloseCircle, AiOutlineArrowLeft } from "react-icons/ai";
import { toast } from "react-toastify";
interface DesktopFooterProps {
  onProgressBar?: boolean;
  onClickBtnLeftAction?: () => void;
  onClickBtnRightAction?: () => void;
  handleDialog?: () => void;
  currentNumber?: number;
  outOf?: number;
  btnLeftText?: string;
  btnRightText?: string;
  leftdisabled?: boolean;
  rightdisabled?: boolean;
}

const TestDesktopFooter = ({
  onClickBtnLeftAction,
  onClickBtnRightAction,
  handleDialog,
  currentNumber,
  outOf,
  btnLeftText,
  btnRightText,
  leftdisabled,
  rightdisabled,
  onProgressBar,
}: DesktopFooterProps) => {
  const progress = (currentNumber! / outOf!) * 100;
  const router = useRouter();
  const pathname = usePathname();
  const { testingKit } = useSelector(testData);
  const [navPath] = useState(`/test-collection/${testingKit?.kit_id}`);

  const handleBack = () => {
    const isSummaryPage = pathname === "/test-collection/collection-summary";
    const isTestCollectionPage = pathname.includes(
      `/test-collection/${testingKit?.kit_id}`
    );
    if (isSummaryPage) {
      router.push("/home");
    } else if (isTestCollectionPage) {
      toast.warn("You are taking a test. You cannot go back");
    } else {
      router.back();
    }
  };

  const renderIcon = () => {
    if (pathname === `${navPath}`) {
      return (
        <div className={styles.cancelBtn} onClick={handleDialog}>
          <p> Cancel</p>
          <AiFillCloseCircle
            color="red"
            onClick={handleDialog}
            style={{ cursor: "pointer" }}
          />
        </div>
      );
    } else {
      return (
        <AiOutlineArrowLeft
          onClick={handleBack}
          style={{ cursor: "pointer" }}
        />
      );
    }
  };

  return (
    <div className="test-agreement-footer-container">
      {onProgressBar && (
        <div
          className="deskTopProgressBar"
          style={{ width: `${progress}%` }}
        ></div>
      )}
      <div className={styles.iconContainer}>{renderIcon()}</div>

      <div className="dxtop-wrap-btn">
        {/* <div className="btn-left"> */}

        <Button
          classname="decline-btn"
          onClick={onClickBtnLeftAction}
          disabled={leftdisabled}
        >
          {btnLeftText ?? ""}
        </Button>

        <Button
          classname="accepted-btn"
          onClick={onClickBtnRightAction}
          disabled={rightdisabled}
        >
          {btnRightText ?? ""}
        </Button>
      </div>
    </div>
  );
};

export default TestDesktopFooter;
