"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { authToken } from "@/redux/slices/auth";
import {
  ensureBugfenderReady,
  initializeBugfender
} from "@/utils/sendAnalytics.utils";

const startBugfender = async () => {
  try {
    await initializeBugfender();
  } catch (error) {
    console.error("Bugfender init failed", error);
  }
};

// Start as soon as this client module evaluates, before React hydrates.
if (typeof window !== "undefined") {
  startBugfender();
}

/**
 * Boots Bugfender at app root, and flushes session when participant_id is known
 * (login reload / already authenticated).
 */
export default function BugfenderBootstrap() {
  const { participant_id } = useSelector(authToken);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await initializeBugfender();
        if (!cancelled && participant_id) {
          await ensureBugfenderReady(participant_id);
        }
      } catch (error) {
        console.error("Bugfender init failed", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [participant_id]);

  return null;
}
