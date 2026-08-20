"use client";

import { useSelector } from "react-redux";
import Image from "next/image";
import { appData } from "@/redux/slices/appConfig";

interface HomeHeaderProps {
  title: string;
  greetings: string;
}

const HomeHeader = ({ title, greetings }: HomeHeaderProps) => {
  const { first_name, last_name, PROOF_Home_Message, PROOF_Home_Logo } =
    useSelector(appData);
  return (
    <div className="home-header">
      <Image
        src={PROOF_Home_Logo || "/icons/pin-icon.svg"}
        className="custome-logo"
        alt="image"
        width={24}
        height={24}
        loading="lazy"
      />
      <div className="user-home">
        <p className="greet-text">{greetings}</p>
        <p className="user-name">
          {(first_name || "") + " " + (last_name || "")}
        </p>
      </div>
      <div className="wrap-msg scroller-test">
        {PROOF_Home_Message && (
          <p className="text-content">{PROOF_Home_Message}</p>
        )}
      </div>
    </div>
  );
};

export default HomeHeader;
