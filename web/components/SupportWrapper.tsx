"use client";

import { usePathname } from "next/navigation";
import Support from "./support-css";
import useResponsive from "@/hooks/useResponsive";
import { useSelector } from "react-redux";
import { appData } from "@/redux/slices/appConfig";
import { hasPermission } from "@/utils/utils";

export function SupportWrapper() {
  const pathname = usePathname();
  const { isDesktop } = useResponsive();
  const userPermissions = useSelector(appData);
  const permissions = userPermissions?.permissions;

  // Don't show support button on auth screens
  if (
    pathname.startsWith("/auth") ||
    pathname === "/new-to-proof" ||
    pathname === "/support"
  ) {
    return null;
  }

  if (hasPermission("Concierge Service", permissions)) {
    return isDesktop ? <Support /> : null;
  }
}
