// Custom exercises added by the user, on top of the built-in 5.
// Each entry has a name and a muscle group from the existing palette so the
// pie chart and planning UI keep working without surprises.

import { storage } from "@/src/utils/storage";
import type { MuscleGroup } from "@/src/utils/muscle-groups";

const KEY = "fit.custom_exercises.v1";

export type CustomExercise = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
};

export async function getCustomExercises(): Promise<CustomExercise[]> {
  const raw = await storage.getItem<string>(KEY, "");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CustomExercise[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addCustomExercise(
  name: string,
  muscleGroup: MuscleGroup,
): Promise<CustomExercise> {
  const trimmed = name.trim();
  const list = await getCustomExercises();
  const entry: CustomExercise = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: trimmed,
    muscleGroup,
  };
  const next = [...list, entry];
  await storage.setItem(KEY, JSON.stringify(next));
  return entry;
}

export async function deleteCustomExercise(id: string): Promise<void> {
  const list = await getCustomExercises();
  const next = list.filter((e) => e.id !== id);
  await storage.setItem(KEY, JSON.stringify(next));
}
