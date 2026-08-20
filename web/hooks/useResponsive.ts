"use client";

import { useState, useLayoutEffect } from "react";

const useResponsive = (breakpoint = 700, debounceTime = 200) => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    const classifyViewport = () => {
      // Short-edge keeps phones mobile in landscape (wide width, short height).
      const shortEdge = Math.min(window.screen.width, window.screen.height);
      const nextIsDesktop = shortEdge >= breakpoint;
      setIsDesktop(nextIsDesktop);
      setIsLoading(false);
    };

    classifyViewport();

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const updateView = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(classifyViewport, debounceTime);
      console.log(
        `Update view on orientation changed: w${window.innerWidth} x h${window.innerHeight}`
      );
    };

    window.addEventListener("resize", updateView);
    window.addEventListener("orientationchange", updateView);

    const screenOrientation = window.screen?.orientation;
    if (screenOrientation?.addEventListener) {
      screenOrientation.addEventListener("change", updateView);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateView);
      window.removeEventListener("orientationchange", updateView);
      if (screenOrientation?.removeEventListener) {
        screenOrientation.removeEventListener("change", updateView);
      }
    };
  }, [breakpoint, debounceTime]);

  return { isDesktop, isLoading };
};

export default useResponsive;
