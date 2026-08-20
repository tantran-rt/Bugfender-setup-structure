"use client";
import React from "react";
import { Button } from "@/components";

interface AgreementFooterProps {
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
  backdisabled?: boolean;
  leftdisabled?: boolean;
  rightdisabled?: boolean;
}

const AgreementFooter = ({
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
  backdisabled,
  leftdisabled,
  rightdisabled
}: AgreementFooterProps) => {
  return (
    <div className="agreement-footer-container">
      {btnBackText ? (
        <div className="btn-back">
          <Button
            classname="decline-btn"
            onClick={onClickBtnBackAction}
            disabled={backdisabled}
            link={btnBackLink}
          >
            {btnBackText}
          </Button>
        </div>
      ) : (
        ""
      )}

      <div className="btn-left">
        {btnLeftText ? (
          <Button
            classname="decline-btn"
            onClick={onClickBtnLeftAction}
            disabled={leftdisabled}
            link={btnLeftLink}
          >
            {btnLeftText}
          </Button>
        ) : (
          <div style={{ width: "90px" }}></div>
        )}
      </div>

      <div className="btn-right">
        {btnRightText ? (
          <Button
            classname="accepted-btn"
            onClick={onClickBtnRightAction}
            disabled={rightdisabled}
            link={btnRightLink}
          >
            {btnRightText}
          </Button>
        ) : (
          <div style={{ width: "90px" }}></div>
        )}
      </div>
    </div>
  );
};

export default AgreementFooter;
