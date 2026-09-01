// Persistence for *planned* (future) workouts.
// Schema: a single JSON map keyed by dateKey -> { muscleGroup }.
// Ported unchanged from the mobile app.

import { STORAGE_KEYS } from "@/constants/storage-keys";
import { fromDateKey } from "@/utils/cycle";
import { storage } from "@/utils/storage";
import type { MuscleGroup } from "@/utils/muscle-groups";
import {
  dayKeyForDate,
  type WeeklySplit,
} from "@/utils/weekly-split-storage";

const KEY = STORAGE_KEYS.planned;

export type PlannedWorkout = {
  dateKey: string; // YYYY-MM-DD
  muscleGroup: MuscleGroup;
  updatedAt: string; // ISO timestamp
};

type Store = Record<string, PlannedWorkout>;

async function readStore(): Promise<Store> {
  const raw = await storage.getItem<string>(KEY, "");
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: Store): Promise<void> {
  await storage.setItem(KEY, JSON.stringify(store));
}

export async function getAllPlans(): Promise<PlannedWorkout[]> {
  const store = await readStore();
  return Object.values(store).sort((a, b) =>
    a.dateKey.localeCompare(b.dateKey),
  );
}

export async function getPlanForDate(
  dateKey: string,
): Promise<PlannedWorkout | null> {
  const store = await readStore();
  return store[dateKey] ?? null;
}

export async function savePlan(
  dateKey: string,
  muscleGroup: MuscleGroup,
): Promise<PlannedWorkout> {
  const store = await readStore();
  const plan: PlannedWorkout = {
    dateKey,
    muscleGroup,
    updatedAt: new Date().toISOString(),
  };
  store[dateKey] = plan;
  await writeStore(store);
  return plan;
}

export async function deletePlan(dateKey: string): Promise<void> {
  const store = await readStore();
  if (store[dateKey]) {
    delete store[dateKey];
    await writeStore(store);
  }
}

// ---------- Effective plan resolution (override > baseline) ----------

export type EffectivePlan = {
  dateKey: string;
  text: string; // Display label
  source: "override" | "baseline";
  muscleGroup?: MuscleGroup; // Only set when source === 'override'
};

/**
 * Resolve the effective plan for a single date.
 *
 * Precedence:
 *   1. If a date-specific override exists in `plans`, that wins (the muscle
 *      group name is used as the display text).
 *   2. Else, fall back to the baseline weekly split entry for that weekday
 *      (free-text label). Empty strings are treated as "no plan".
 *   3. Otherwise → null.
 */
export function getEffectivePlan(
  dateKey: string,
  plans: PlannedWorkout[],
  weeklySplit: WeeklySplit,
): EffectivePlan | null {
  const override = plans.find((p) => p.dateKey === dateKey);
  if (override) {
    return {
      dateKey,
      text: override.muscleGroup,
      source: "override",
      muscleGroup: override.muscleGroup,
    };
  }
  const baseline = weeklySplit[dayKeyForDate(fromDateKey(dateKey))]?.trim() ?? "";
  if (baseline.length > 0) {
    return { dateKey, text: baseline, source: "baseline" };
  }
  return null;
}
