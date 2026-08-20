"use client"

import { Carousel, CheckBox, HeaderText } from '@/components';
import React, { useState } from 'react';
import { IoIosArrowForward } from 'react-icons/io';
import Link from "next/link";
import styles from "./welcome-screen.module.css"
import { StaticImport } from 'next/dist/shared/lib/get-img-props';


interface IWelcomeScreen {
    handleSwitch: () => void;
    tokenCookie: string | undefined;
    checked: boolean;
    welcomeMsg?: string | undefined;
    welcomeLogo?: string | StaticImport;
}
const WelcomeScreenMobile = ({ handleSwitch, tokenCookie, checked, welcomeMsg, welcomeLogo }: IWelcomeScreen) => {

    return (
        <div className={styles.welcomeScreenContaine}>
            <h2 className={styles.welcomeScreenHeader}>Welcome</h2>
            <p className={styles.welcomeScreenText}>{welcomeMsg || "PROOF is a mobile solution that simplifies data management and facilitates customized testing programs. You have received an account to PROOF to perform one or more of the following tasks"}</p>
            <Carousel />
            <div className={styles.welcomeScreenCheckboxNextBtnContainer}>
                <CheckBox
                    checked={checked}
                    onChange={handleSwitch}
                    label="Don`t show welcome screen." />
                <Link href={tokenCookie !== undefined ? "/tutorial" : "/auth/sign-in"}>
                    <button className={styles.welcomeScreenNextBtn}>
                        Next
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default WelcomeScreenMobile;
