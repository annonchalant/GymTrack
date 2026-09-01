// Exercise → muscle group mapping for the Progress tab pie chart.
// Built-in mapping below; user-added custom exercises are merged in at call
// site via `buildExerciseMuscleLookup`. Ported unchanged from the mobile app.

import { EXERCISES } from "@/utils/cycle";

export type MuscleGroup = "Legs" | "Chest" | "Back" | "Shoulders";

export const BUILTIN_EXERCISE_TO_MUSCLE: Record<string, MuscleGroup> = {
  Squat: "Legs",
  "Bench Press": "Chest",
  Deadlift: "Back",
  "Overhead Press": "Shoulders",
  "Barbell Row": "Back",
};

// Stable, vibrant neon-on-dark palette. Keys are MuscleGroup values.
export const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  Legs: "#3B82F6", // electric blue
  Chest: "#22D3EE", // neon cyan
  Back: "#A78BFA", // violet
  Shoulders: "#F472B6", // hot pink
};

export const MUSCLE_GROUPS: MuscleGroup[] = ["Legs", "Chest", "Back", "Shoulders"];

// Build a combined name→group lookup using built-in + caller-provided custom
// entries. Custom entries override built-ins on name collision.
export function buildExerciseMuscleLookup(
  customs: { name: string; muscleGroup: MuscleGroup }[],
): Record<string, MuscleGroup> {
  const out: Record<string, MuscleGroup> = { ...BUILTIN_EXERCISE_TO_MUSCLE };
  for (const c of customs) {
    out[c.name] = c.muscleGroup;
  }
  return out;
}

// Aggregates per-exercise counts into per-muscle-group counts using the given
// lookup. Exercises without a mapping are silently dropped.
export function aggregateByMuscle(
  countsByExercise: Record<string, number>,
  lookup: Record<string, MuscleGroup> = BUILTIN_EXERCISE_TO_MUSCLE,
): Record<MuscleGroup, number> {
  const out: Record<MuscleGroup, number> = {
    Legs: 0,
    Chest: 0,
    Back: 0,
    Shoulders: 0,
  };
  for (const exercise of Object.keys(countsByExercise)) {
    const group = lookup[exercise];
    if (group) out[group] += countsByExercise[exercise] ?? 0;
  }
  return out;
}

export const EXERCISE_TO_MUSCLE = BUILTIN_EXERCISE_TO_MUSCLE;
export { EXERCISES };
