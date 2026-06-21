// 7-day repeating workout split (e.g. Mon=Chest+Triceps, Tue=Back+Biceps).
// Stored as a flat record keyed by short weekday names. Default = all empty.

import { storage } from "@/src/utils/storage";

const KEY = "fit.weekly_split.v1";

export type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export const DAY_ORDER: DayKey[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const DAY_LABELS: Record<DayKey, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

export type WeeklySplit = Record<DayKey, string>;

export const EMPTY_SPLIT: WeeklySplit = {
  sun: "",
  mon: "",
  tue: "",
  wed: "",
  thu: "",
  fri: "",
  sat: "",
};

export async function getWeeklySplit(): Promise<WeeklySplit> {
  const raw = await storage.getItem<string>(KEY, "");
  if (!raw) return { ...EMPTY_SPLIT };
  try {
    const parsed = JSON.parse(raw) as Partial<WeeklySplit>;
    return { ...EMPTY_SPLIT, ...parsed };
  } catch {
    return { ...EMPTY_SPLIT };
  }
}

export async function saveWeeklySplit(split: WeeklySplit): Promise<void> {
  await storage.setItem(KEY, JSON.stringify(split));
}

export async function resetWeeklySplit(): Promise<void> {
  await storage.setItem(KEY, JSON.stringify(EMPTY_SPLIT));
}

// Map JS Date.getDay() (0=Sun..6=Sat) to our DayKey.
const JS_DAY_TO_KEY: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function dayKeyForDate(d: Date): DayKey {
  return JS_DAY_TO_KEY[d.getDay()];
}

export function hasAnyPlanSet(split: WeeklySplit): boolean {
  return DAY_ORDER.some((k) => split[k].trim().length > 0);
}
