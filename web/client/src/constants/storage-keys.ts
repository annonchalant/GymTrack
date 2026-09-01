// Single source of truth for every persisted key.
// The fit.* keys are shared with the mobile app and mirrored to the backend —
// renaming any of them is a breaking data-migration, so they live here only.

export const STORAGE_KEYS = {
  workouts: "fit.workouts.v1",
  planned: "fit.planned.v1",
  profile: "fit.profile.v1",
  customExercises: "fit.custom_exercises.v1",
  weeklySplit: "fit.weekly_split.v1",
  cyclePrefs: "fit.cycle.prefs.v1",
  onboardingComplete: "fit.onboarding.complete.v1",
} as const;

export const AUTH_TOKEN_KEY = "auth.jwt.v1";
export const AUTH_USERNAME_KEY = "auth.username.v1";

// Keys with these prefixes are user data: cleared locally on logout and
// synced to the backend while logged in.
export const USER_DATA_PREFIXES = ["fit."] as const;
