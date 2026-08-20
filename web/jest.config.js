const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "jsdom",
  transform: {
    // '^.+\\.[tj]sx?$' to process ts,js,tsx,jsx with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process ts,js,tsx,jsx,mts,mjs,mtsx,mjsx with `ts-jest`
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.jest.json",
      },
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(scandit-web-datacapture-core|scandit-web-datacapture-barcode|scandit-web-datacapture-id)/)",
  ],
  setupFilesAfterEnv: ["<rootDir>/jest-setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.ts",
    "^react-player$": "<rootDir>/__mocks__/react-player.tsx",
    "^@nuralogix\\.ai/web-measurement-embedded-app$":
      "<rootDir>/__mocks__/@nuralogix.ai/web-measurement-embedded-app.ts",
    "^@nuralogix\\.ai/(.*)$": "<rootDir>/__mocks__/@nuralogix.ai/$1.ts",
  },
};
