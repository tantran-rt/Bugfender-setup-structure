"use client";

import { Carousel, CheckBox, HeaderText } from "@/components";
import React, { useState } from "react";
import { IoIosArrowForward } from "react-icons/io";
import Link from "next/link";
import styles from "./welcome-screen.module.css";
import Image from "next/image";
import { StaticImport } from "next/dist/shared/lib/get-img-props";

interface IWelcomeScreen {
  handleSwitch: () => void;
  tokenCookie: string | undefined;
  checked: boolean;
  welcomeMsg?: string | undefined;
  welcomeLogo?: string | StaticImport;
}
const WelcomeScreenDesktop = ({
  handleSwitch,
  tokenCookie,
  checked,
  welcomeMsg,
  welcomeLogo,
}: IWelcomeScreen) => {
  return (
    <div className={styles.welcomeScreenContaine}>
      <div
        className={styles.welcomeScreenDescription}
        style={{
          padding: "24px 98px 24px 24px",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            height: "fit-content",
            minHeight: "10px",
            flexGrow: "1",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ position: "relative" }}>
            <Image
              className={styles.welcomeScreenPrLogo}
              src={welcomeLogo || "/icons/pr-logo.svg"}
              alt="image"
              width={3000}
              height={3000}
              priority
            />
          </div>
          <div style={{ marginTop: "auto", marginBottom: "auto" }}>
            <h2 className={styles.welcomeScreenHeader}>Welcome</h2>
            <br />
            <p className={styles.welcomeScreenText}>
              {welcomeMsg ||
                "PROOF is a mobile solution that simplifies data management and facilitates customized testing programs. You have received an account to PROOF to perform one or more of the following tasks"
              }
            </p>
            <div className={styles.welcomeScreenCheckboxNextBtnContainer}>
              <CheckBox
                checked={checked}
                onChange={handleSwitch}
                label="Don`t show welcome screen."
              />
              <Link
                href={tokenCookie !== undefined ? "/tutorial" : "/auth/sign-in"}
              >
                <button className={styles.welcomeScreenNextBtn}>Next</button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Carousel />
    </div>
  );
};

export default WelcomeScreenDesktop;
