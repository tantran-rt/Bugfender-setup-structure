"use client";
import React from "react";
import { Button } from "@/components";

interface DesktopFooterProps {
  onProgressBar?: boolean;
  onClickBtnBackAction?: () => void;
  onClickBtnLeftAction?: () => void;
  onClickBtnRightAction?: () => void;
  currentNumber?: number;
  outOf?: number;
  btnBackLink?: string;
  btnLeftLink?: string;
  btnRightLink?: string;
  btnBackText?: string;
  btnLeftText?: string;
  btnRightText?: string;
  backDisabled?: boolean;
  leftdisabled?: boolean;
  rightdisabled?: boolean;
}

const DesktopFooter = ({
  onClickBtnBackAction,
  onClickBtnLeftAction,
  onClickBtnRightAction,
  currentNumber,
  outOf,
  btnBackLink,
  btnLeftLink,
  btnRightLink,
  btnBackText,
  btnLeftText,
  btnRightText,
  backDisabled,
  leftdisabled,
  rightdisabled,
  onProgressBar
}: DesktopFooterProps) => {
  return (
    <div className="agreement-footer-container">
      <div className="gap-"></div>
      <div className="dxtop-wrap-btn">
        {/* <div className="btn-left"> */}
        {btnBackText && (
          <Button
            classname="decline-btn"
            onClick={onClickBtnBackAction}
            disabled={backDisabled}
            link={btnBackLink}
          >
            {btnBackText}
          </Button>
        )}
        {btnLeftText && (
          <Button
            classname="decline-btn"
            onClick={onClickBtnLeftAction}
            disabled={leftdisabled}
            link={btnLeftLink}
          >
            {btnLeftText}
          </Button>
        )}
        {/* </div> */}

        {/* <div className="btn-right"> */}
        {btnRightText && (
          <Button
            classname="accepted-btn"
            onClick={onClickBtnRightAction}
            disabled={rightdisabled}
            link={btnRightLink}
          >
            {btnRightText}
          </Button>
        )}
        {/* </div> */}
      </div>
    </div>
  );
};

export default DesktopFooter;
