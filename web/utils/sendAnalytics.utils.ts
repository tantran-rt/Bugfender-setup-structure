// Extend the Window interface to add BugfenderInitialized
declare global {
  interface Window {
    BugfenderInitialized?: boolean; // This marks BugfenderInitialized as a property of window
    idSetonBugFender?: boolean; // This marks BugfenderInitialized as a property of window
  }
}

type NextBugfender = (typeof import("./bugFender.utils"))["default"];

let initPromise: Promise<NextBugfender> | null = null;

/**
 * Loads and initializes Bugfender once. Concurrent callers share the same
 * in-flight Promise. The initialized flag is set only after init resolves so
 * a failed attempt can retry.
 */
export const initializeBugfender = () => {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const NextBugfender = (await import("./bugFender.utils")).default;

    if (typeof window === "undefined") {
      return NextBugfender;
    }

    if (!window.BugfenderInitialized) {
      await NextBugfender.init();
      window.BugfenderInitialized = true;
    }
    return NextBugfender;
  })().catch((error) => {
    initPromise = null;
    throw error;
  });

  return initPromise;
};

/**
 * Sets Bugfender device key "id" at login time.
 * Authoritative path — do not rely on web-vitals sendAnalytics for this.
 */
export const setBugfenderDeviceId = async (participant_id: string | number) => {
  if (
    typeof window === "undefined" ||
    participant_id === undefined ||
    participant_id === null ||
    participant_id === "" ||
    participant_id === 0
  ) {
    return;
  }

  const NextBugfender = await initializeBugfender();
  NextBugfender.setDeviceKey("id", String(participant_id));
  window.idSetonBugFender = true;
};

export const sendAnalytics = async ({
  name,
  value,
  participant_id
}: {
  name: string;
  value: number;
  participant_id: string;
}) => {
  // 1. Import the Nextjs Bugfender Util module
  const NextBugfender = await initializeBugfender();

  if (participant_id && !window.idSetonBugFender) {
    NextBugfender.setDeviceKey("id", participant_id);
    window.idSetonBugFender = true;
  }

  // 3. Add condition to tackle the metrics
  if (name === "FCP") {
    if (value >= 0 && value <= 2000) {
      NextBugfender.log(
        `${name} value ${value} is in range and the speed is fast.`
      );
    } else if (value > 2000 && value <= 4000) {
      NextBugfender.warn(
        `${name} value ${value} is in a bit out of range and the speed is moderate.`
      );
      NextBugfender.sendUserFeedback(
        "FCP Warning",
        "The speed of loading this page may be moderate."
      );
    }
    if (value > 4000) {
      NextBugfender.error(
        `${name} value ${value} is completly out of range and the speed is slow.`
      );
      NextBugfender.sendIssue(
        "Issue with FCP",
        "The speed of loading this page may be slow. Creating an issue."
      );
    }
  } else if (name === "LCP") {
    // Send LCP related logs, events, etc.
  } else if (name === "CLS") {
    // Send CLS related logs, events, etc.
  } else if (name === "FID") {
    // Send FID related logs, events, etc.
  } else {
    NextBugfender.log(`${name} value is: ${value}`);
  }
};

export const sendLogs = async (...messages: string[]) => {
  const NextBugfender = await initializeBugfender();
  NextBugfender.log(`${messages}`);
};
