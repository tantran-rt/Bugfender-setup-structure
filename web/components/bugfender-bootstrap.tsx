"use client";

import { useEffect } from "react";
import { initializeBugfender } from "@/utils/sendAnalytics.utils";

const startBugfender = async () => {
  await initializeBugfender().catch((error) => {
    console.error("Bugfender init failed", error);
  });
};

// Start as soon as this client module evaluates, before React hydrates.
if (typeof window !== "undefined") {
  startBugfender();
}

/**
 * Boots Bugfender at app root, before routing and user interaction.
 */
export default function BugfenderBootstrap() {
  useEffect(() => {
    startBugfender();
  }, []);

  return null;
}
