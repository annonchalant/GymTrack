// Pure helpers for cycle-day math and date keys. No storage, no UI.

import type { CyclePrefs } from "@/src/utils/cycle-storage";

export const EXERCISES = [
  "Squat",
  "Bench Press",
  "Deadlift",
  "Overhead Press",
  "Barbell Row",
] as const;

// Backwards-compat alias. Custom exercises (added via UI) are arbitrary
// strings outside this tuple, so we keep `Exercise` as `string` for ease.
export type Exercise = string;
export type BuiltinExercise = (typeof EXERCISES)[number];

// "YYYY-MM-DD" in local time, locale-independent.
export function toDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateKey(key: string): Date {
  // Construct at local noon to dodge DST edge cases when adding days.
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function formatDateLong(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

// Days between two date keys (target - start), ignoring time of day.
function daysBetween(startKey: string, targetKey: string): number {
  const a = fromDateKey(startKey).getTime();
  const b = fromDateKey(targetKey).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export type CyclePhase = "recovery" | "peak";

export type CycleStatus = {
  enabled: boolean;
  day: number | null; // 1..cycleLength, or null if not enabled
  phase: CyclePhase | null;
};

// Days 1-5 are "Recovery"; everything else in the cycle is "Peak Energy".
// If lastPeriodStart is in the future relative to the selected date, we wrap
// the cycle backwards so day stays in [1..cycleLength].
export function getCycleStatus(
  prefs: CyclePrefs | null,
  selectedDateKey: string,
): CycleStatus {
  if (!prefs || !prefs.trackingEnabled || !prefs.lastPeriodStart) {
    return { enabled: false, day: null, phase: null };
  }
  const length =
    prefs.cycleLength && prefs.cycleLength > 0 ? prefs.cycleLength : 28;
  const diff = daysBetween(prefs.lastPeriodStart, selectedDateKey);
  // (diff mod length) wrapped into [0, length-1], then +1 to get day 1..length.
  const dayIndex = ((diff % length) + length) % length;
  const day = dayIndex + 1;
  const phase: CyclePhase = day <= 5 ? "recovery" : "peak";
  return { enabled: true, day, phase };
}
