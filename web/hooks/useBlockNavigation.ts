"use client";

import { useCallback, useEffect, useRef } from "react";

export const useBlockBackNavigation = (onBackAttempt: () => void) => {
  const blockRef = useRef(true); // toggle blocking logic
  const hasPushedState = useRef(false);
  const isAllowingNavigation = useRef(false);
  const onBackAttemptRef = useRef(onBackAttempt);
  onBackAttemptRef.current = onBackAttempt;

  useEffect(() => {
    // Don't set up blocking if we're in the process of allowing navigation
    if (!blockRef.current) return;

    if (!hasPushedState.current) {
      window.history.pushState(null, "", window.location.href);
      hasPushedState.current = true;
    }

    const handlePopState = (e: PopStateEvent) => {
      // Don't handle popstate if we're allowing navigation
      if (isAllowingNavigation.current) {
        return;
      }

      if (blockRef.current) {
        e.preventDefault();
        onBackAttemptRef.current();
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
    // Listener is stable via onBackAttemptRef — do not rebind on callback identity.
  }, []);

  const allowNavigation = useCallback(() => {
    isAllowingNavigation.current = true;
    blockRef.current = false;

    if (hasPushedState.current) {
      window.history.back();
      hasPushedState.current = false;
    }
  }, []);

  return { allowNavigation };
};
