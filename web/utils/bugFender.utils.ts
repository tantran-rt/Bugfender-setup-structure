import { Bugfender } from "@bugfender/sdk";

const NextBugfender = {
  init: async () => {
    await Bugfender.init({
      appKey: process.env.NEXT_PUBLIC_BUGFENDER_APP_KEY as string,
      overrideConsoleMethods: true,
      apiURL: "https://api.bugfender.com/",
      baseURL: "https://dashboard.bugfender.com/",
      logUIEvents: false
    });
    Bugfender.forceSendOnce();
  },

  setDeviceKey: (key: string, value: string) => {
    Bugfender.setDeviceKey(key, value);
  },

  log: (...messages: string[]) => {
    Bugfender.log(messages.join());
  },

  warn: (...messages: string[]) => {
    Bugfender.warn(messages.join());
  },

  error: (...messages: string[]) => {
    Bugfender.error(messages.join());
  },

  sendUserFeedback: (key: string, value: string) => {
    Bugfender.sendUserFeedback(key, value);
  },

  sendIssue: (key: string, value: string) => {
    Bugfender.sendIssue(key, value);
  },

  sendCrash: (key: string, value: string) => {
    Bugfender.sendCrash(key, value);
  }
};

export default NextBugfender;
