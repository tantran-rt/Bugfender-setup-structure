import { useState, useEffect } from "react";

const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    if (typeof document.hidden !== "undefined") {
      document.addEventListener(
        "visibilitychange",
        handleVisibilityChange,
        false
      );
    } else if (typeof document.hidden === "undefined") {
      document.addEventListener(
        "webkitvisibilitychange",
        handleVisibilityChange,
        false
      );
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener(
        "webkitvisibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  return isVisible;
};

export default usePageVisibility;
