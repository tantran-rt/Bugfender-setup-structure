import { configureStore } from "@reduxjs/toolkit";

import { auth, appConfig, drugTest, preTest, scoreMatrix, bacTest, demographics, measurement } from "./slices";

export const store = configureStore({
  reducer: { auth, appConfig, drugTest, preTest, scoreMatrix, bacTest, demographics, measurement },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["drugTest/saveClip"],
        // Ignore these field paths in all actions
        ignoredActionPaths: ["meta.arg", "payload.size", "payload.type"],
        // Ignore these paths in the state
        ignoredPaths: ["drugTest.testClip"],
      },
    }),
});

// RootState and AppDispatch types
export type AppDispatch = typeof store.dispatch;
