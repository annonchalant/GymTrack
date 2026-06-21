// Local-only persistence for onboarding + menstrual cycle preferences.
// Backed by the shared `storage` helper (AsyncStorage on native, IndexedDB on web).

import { storage } from "@/src/utils/storage";

const KEYS = {
  onboardingComplete: "fit.onboarding.complete.v1",
  cyclePrefs: "fit.cycle.prefs.v1",
} as const;

export type CyclePrefs = {
  // Whether the user opted in to cycle-based training adaptation.
  trackingEnabled: boolean;
  // ISO date string (YYYY-MM-DD) of the start of the last period. Null if not tracking.
  lastPeriodStart: string | null;
  // Average cycle length in days. Defaults to 28.
  cycleLength: number;
};

export const DEFAULT_CYCLE_LENGTH = 28;

export async function isOnboardingComplete(): Promise<boolean> {
  const value = await storage.getItem<boolean>(KEYS.onboardingComplete, false);
  return value === true;
}

export async function markOnboardingComplete(): Promise<void> {
  await storage.setItem(KEYS.onboardingComplete, true);
}

export async function getCyclePrefs(): Promise<CyclePrefs | null> {
  // Stored as a JSON string so we can round-trip the full object.
  const raw = await storage.getItem<string>(KEYS.cyclePrefs, "");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CyclePrefs;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveCyclePrefs(prefs: CyclePrefs): Promise<void> {
  await storage.setItem(KEYS.cyclePrefs, JSON.stringify(prefs));
}

// Test-only: reset everything onboarding-related. Not wired into UI for Phase 1.
export async function resetOnboarding(): Promise<void> {
  await storage.removeItem(KEYS.onboardingComplete);
  await storage.removeItem(KEYS.cyclePrefs);
}
