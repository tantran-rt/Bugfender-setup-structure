"use client";

import { sendAnalytics } from "@/utils/sendAnalytics.utils";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals({ participant_id }: { participant_id: string }) {
  useReportWebVitals((metric) => {
    switch (metric.name) {
      case "FCP":
        // sendAnalytics({ ...metric, participant_id });
        break;
      case "LCP":
        sendAnalytics({ ...metric, participant_id });
        break;
      case "CLS":
        sendAnalytics({ ...metric, participant_id });
        break;
      case "FID":
        sendAnalytics({ ...metric, participant_id });
        break;
      case "TTFB":
        // sendAnalytics({ ...metric, participant_id });
        break;
      case "Next.js-hydration":
        sendAnalytics({ ...metric, participant_id });
        break;
      case "Next.js-route-change-to-render":
        sendAnalytics({ ...metric, participant_id });
        break;
      case "Next.js-render":
        sendAnalytics({ ...metric, participant_id });
        break;
      default:
        break;
    }
  });
}
