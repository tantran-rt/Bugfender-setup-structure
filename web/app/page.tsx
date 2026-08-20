"use client";

import Cookies from "js-cookie";
import { useState } from "react";
import { setCookie } from "@/utils/utils";
import { appData } from "@/redux/slices/appConfig";
import WelcomeScreenDesktop from "./welcome-screen/desktop";
import WelcomeScreenMobile from "./welcome-screen/mobile";
import useResponsive from "@/hooks/useResponsive";
import { useSelector } from "react-redux";

function Welcome() {
  const {
    PROOF_Custom_Message,
    PROOF_Home_Message,
    PROOF_Custom_Logo,
    PROOF_Home_Logo,
  } = useSelector(appData);
  const { isDesktop } = useResponsive();
  const welcomeCookie = Cookies.get("welView");
  const tokenCookie = Cookies.get("token");
  const [checked, setChecked] = useState(
    welcomeCookie === "true" ? false : true
  );

  const handleSwitch = () => {
    if (welcomeCookie === "false") {
      setCookie("welView", "true", 2000);
      setChecked(false);
    } else {
      setCookie("welView", "false", 2000);
      setChecked(true);
    }
  };

  return (
    <>
      {isDesktop ? (
        <WelcomeScreenDesktop
          handleSwitch={handleSwitch}
          tokenCookie={tokenCookie}
          checked={checked}
          welcomeMsg={PROOF_Custom_Message ?? PROOF_Home_Message}
          welcomeLogo={PROOF_Custom_Logo ?? PROOF_Home_Logo}
        />
      ) : (
        <WelcomeScreenMobile
          handleSwitch={handleSwitch}
          tokenCookie={tokenCookie}
          checked={checked}
          welcomeMsg={PROOF_Custom_Message ?? PROOF_Home_Message}
          welcomeLogo={PROOF_Custom_Logo ?? PROOF_Home_Logo}
        />
      )}
    </>
  );
}

export default Welcome;
