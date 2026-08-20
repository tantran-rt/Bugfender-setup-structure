import type { Profile } from "@nuralogix.ai/web-measurement-embedded-app";

// Helper to check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

export const getSavedTheme = () => {
  if (!isBrowser) return "light";
  return localStorage.getItem("theme") === "dark" ? "dark" : "light";
};

export const markPreviouslyAuthenticated = () => {
  if (!isBrowser) return;
  localStorage.setItem("hasPreviouslyAuthenticated", "1");
};

export const getHasPreviouslyAuthenticated = (): boolean => {
  if (!isBrowser) return false;
  return localStorage.getItem("hasPreviouslyAuthenticated") === "1";
};

export const clearPreviousAuth = () => {
  if (!isBrowser) return;
  localStorage.removeItem("hasPreviouslyAuthenticated");
};

const DEMO_KEY = "wmea_demo_v1";

export const loadSavedDemographics = (): Profile | null => {
  if (!isBrowser) return null;
  const raw = localStorage.getItem(DEMO_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as Profile;
};

export const saveDemographics = (profile: Profile) => {
  if (!isBrowser) return;
  localStorage.setItem(DEMO_KEY, JSON.stringify(profile));
};

export const clearDemographics = () => {
  if (!isBrowser) return;
  localStorage.removeItem(DEMO_KEY);
};
