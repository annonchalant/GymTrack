// Custom exercises added by the user, on top of the built-in 5.
// Ported unchanged from the mobile app.

import { STORAGE_KEYS } from "@/constants/storage-keys";
import { storage } from "@/utils/storage";
import type { MuscleGroup } from "@/utils/muscle-groups";

const KEY = STORAGE_KEYS.customExercises;

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
