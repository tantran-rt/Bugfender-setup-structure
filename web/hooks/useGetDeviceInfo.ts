"use client";
import { useState, useEffect } from "react";
import { UAParser } from "ua-parser-js";
import platform from "platform";
interface DeviceInfo {
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  deviceModel?: string;
  deviceType?: string;
  deviceVendor?: string;
}

/**
 * iPadOS Safari (and Chrome) request a desktop site by default and send a
 * Macintosh / macOS UA. Multi-touch on MacIntel is the reliable split from a
 * real Mac.
 */
export function isIPadOSDesktopUA(
  nav?: Pick<Navigator, "platform" | "maxTouchPoints"> | null
): boolean {
  const resolvedNav =
    nav ?? (typeof navigator !== "undefined" ? navigator : null);
  if (!resolvedNav) return false;
  return resolvedNav.platform === "MacIntel" && resolvedNav.maxTouchPoints > 1;
}

const useGetDeviceInfo = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    screenWidth: typeof window !== "undefined" ? window.innerWidth : 0,
    screenHeight: typeof window !== "undefined" ? window.innerHeight : 0,
    devicePixelRatio:
      typeof window !== "undefined" ? window.devicePixelRatio : 1,
  });

  useEffect(() => {
    const parser = new UAParser();
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();
    const ipadDesktopUa = isIPadOSDesktopUA();

    setDeviceInfo({
      screenWidth: window.screen.width ?? "",
      screenHeight: window.screen.height ?? "",
      devicePixelRatio: window.devicePixelRatio ?? "",
      browserName:
        browser?.name || platform.parse(navigator.userAgent).name || "",
      browserVersion:
        browser?.version || platform.parse(navigator.userAgent).version || "",
      osName: ipadDesktopUa
        ? "iPadOS"
        : os?.name || platform.parse(navigator.userAgent).os?.toString() || "",
      osVersion:
        os?.version || platform.parse(navigator.userAgent).os?.version || "",
      deviceModel: ipadDesktopUa
        ? "iPad"
        : device?.model ||
          platform.parse(navigator.userAgent).os?.architecture?.toString() ||
          "",
      deviceType: ipadDesktopUa
        ? "tablet"
        : device?.vendor || platform.parse(navigator.userAgent).product || "",
      deviceVendor:
        device?.vendor || platform.parse(navigator.userAgent).os?.family || "",
    });

    const handleResize = () => {
      setDeviceInfo((prevState) => ({
        ...prevState,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
      }));
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return deviceInfo;
};

export default useGetDeviceInfo;
