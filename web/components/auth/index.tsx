"use client";

import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { authToken } from "@/redux/slices/auth";

import { SessionModal } from "@/components";
import { setCookie } from "@/utils/utils";
import { testData } from "@/redux/slices/drugTest";

function Auth({ children }: Readonly<{ children: React.ReactNode }>) {
  const { token, participant_id, pin, loggedOut } = useSelector(authToken);
  const { testingKit } = useSelector(testData);
  const router = useRouter();
  const pathname = usePathname();
  const tokenCookie = Cookies.get("token");
  const landingCookie = Cookies.get("welView");

  const [showSessionModal, setShowSessionModal] = useState(false);

  const stayLoggedIn = () => {
    setShowSessionModal(false);
    setCookie("token", "true", 1 / 24);
  };

  const handleSessionModal = useCallback(() => {
    setShowSessionModal(false);
    toast.warning("Session expired! Please login again");
    router.push("/auth/sign-in");
  }, [router]);

  useEffect(() => {
    // Exempt Mobile QR scan link from authentication checks
    if (
      !pathname.includes(
        "/identity-profile/id-detection/mobile-scan-step-2/"
      ) &&
      !pathname.includes(
        "/identity-profile/id-detection/mobile-scan-step-1/"
      ) &&
      pathname !== "/sentry-example-page" &&
      // pathname !== "/" &&
      pathname !== "/auth/forgot-pin" &&
      pathname !== "/auth/enter-otp" &&
      pathname !== "/auth/set-new-pin" &&
      pathname !== "/auth/sign-in" &&
      pathname !== "/new-to-proof" &&
      tokenCookie === undefined &&
      token === false
    ) {
      !loggedOut ? toast.warning("Invalid Session! Please login again") : null;
      router.push("/auth/sign-in");
    } else if (
      pathname === "/auth/sign-in" &&
      token === true &&
      tokenCookie === "true"
    ) {
      landingCookie !== undefined && landingCookie === "true"
        ? router.push("/")
        : router.push("/home");
    }
    // Checks if the user reloads the page
    if (
      // pathname !== "/" &&
      pathname !== "/auth/forgot-pin" &&
      pathname !== "/auth/enter-otp" &&
      pathname !== "/auth/set-new-pin" &&
      pathname !== "/auth/sign-in" &&
      pathname !== "/health-assessment" &&
      pathname !== "/health-assessment/measurement" &&
      pathname !== "/health-assessment/results" &&
      participant_id === 0 &&
      tokenCookie === "true"
    ) {
      toast.error("Session Invalidated! Please login again.");
      Cookies.remove("token");

      setTimeout(() => {
        router.push("/auth/sign-in");
      }, 100);
    }

    // Checks if the user's session has expired
    if (
      // pathname !== "/" &&
      pathname !== "/auth/forgot-pin" &&
      pathname !== "/auth/enter-otp" &&
      pathname !== "/auth/set-new-pin" &&
      pathname !== "/auth/sign-in" &&
      participant_id !== 0 &&
      tokenCookie === undefined
    ) {
      if (
        pathname === `/test-collection/${testingKit?.kit_id}` ||
        pathname === "/test-collection/collection-summary"
      ) {
        setShowSessionModal(true);
      } else {
        toast.warning("Session expired! Please login again");
        router.push("/auth/sign-in");
      }
    }
  }, [
    pathname,
    token,
    router,
    tokenCookie,
    participant_id,
    pin,
    landingCookie,
    loggedOut,
    testingKit,
  ]);

  return (
    <>
      <SessionModal
        show={showSessionModal}
        handleEnd={handleSessionModal}
        onClick={stayLoggedIn}
      />
      {children}
    </>
  );
}

export default Auth;
