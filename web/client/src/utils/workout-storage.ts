// Persistence for workout sets, keyed by date (YYYY-MM-DD).
// Stored as a single JSON map under one storage key for atomic reads/writes.
// Ported unchanged from the mobile app (storage backend swapped for web).

import { STORAGE_KEYS } from "@/constants/storage-keys";
import { storage } from "@/utils/storage";

const KEY = STORAGE_KEYS.workouts;

export type WorkoutSet = {
  id: string;
  exercise: string;
  weight: number; // raw number — units (lb/kg) are not tracked.
  reps: number;
  loggedAt: string; // ISO timestamp (UTC) for ordering & display.
};

type Store = Record<string, WorkoutSet[]>; // date "YYYY-MM-DD" -> sets

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

export async function getSetsForDate(date: string): Promise<WorkoutSet[]> {
  const store = await readStore();
  const sets = store[date] ?? [];
  // Newest first for display.
  return [...sets].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
}

export async function addSet(
  date: string,
  input: { exercise: string; weight: number; reps: number },
): Promise<WorkoutSet> {
  const store = await readStore();
  const set: WorkoutSet = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    exercise: input.exercise,
    weight: input.weight,
    reps: input.reps,
    loggedAt: new Date().toISOString(),
  };
  const existing = store[date] ?? [];
  store[date] = [...existing, set];
  await writeStore(store);
  return set;
}

export async function deleteSet(date: string, id: string): Promise<void> {
  const store = await readStore();
  const existing = store[date] ?? [];
  store[date] = existing.filter((s) => s.id !== id);
  if (store[date].length === 0) {
    delete store[date];
  }
  await writeStore(store);
}

// -------------- Aggregations for the Progress tab --------------

export type WorkoutSetEntry = WorkoutSet & { dateKey: string };

// Flat list of every set across every date, each tagged with its dateKey.
// Older first.
export async function getAllSets(): Promise<WorkoutSetEntry[]> {
  const store = await readStore();
  const all: WorkoutSetEntry[] = [];
  for (const dateKey of Object.keys(store)) {
    for (const s of store[dateKey]) all.push({ ...s, dateKey });
  }
  all.sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  return all;
}

// True if there is at least one set logged anywhere in storage.
export async function hasAnySets(): Promise<boolean> {
  const store = await readStore();
  for (const k of Object.keys(store)) {
    if (store[k] && store[k].length > 0) return true;
  }
  return false;
}

// Time-series of (dateKey, maxWeight) for one exercise. One point per date,
// representing the heaviest weight lifted on that date. Sorted oldest → newest.
export type StrengthPoint = { dateKey: string; maxWeight: number };

export async function getMaxWeightSeries(
  exercise: string,
): Promise<StrengthPoint[]> {
  const store = await readStore();
  const points: StrengthPoint[] = [];
  for (const dateKey of Object.keys(store)) {
    let max = -Infinity;
    for (const s of store[dateKey]) {
      if (s.exercise === exercise && s.weight > max) max = s.weight;
    }
    if (max > -Infinity) points.push({ dateKey, maxWeight: max });
  }
  points.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  return points;
}

// Count of sets per exercise across all history. Useful for the pie chart
// once mapped into muscle groups by the consumer.
export async function getSetCountsByExercise(): Promise<Record<string, number>> {
  const store = await readStore();
  const counts: Record<string, number> = {};
  for (const dateKey of Object.keys(store)) {
    for (const s of store[dateKey]) {
      counts[s.exercise] = (counts[s.exercise] ?? 0) + 1;
    }
  }
  return counts;
}
