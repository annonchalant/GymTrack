// Data + behavior for the Logger screen. The page component stays
// presentational; every load, save, and derived value lives here.

import { useCallback, useEffect, useMemo, useState } from "react";

import { type ExerciseOption } from "@/components/logger/ExercisePicker";
import { EXERCISES, getCycleStatus, fromDateKey, toDateKey } from "@/utils/cycle";
import {
  getCyclePrefs,
  isOnboardingComplete,
  type CyclePrefs,
} from "@/utils/cycle-storage";
import {
  addCustomExercise,
  deleteCustomExercise,
  getCustomExercises,
  type CustomExercise,
} from "@/utils/custom-exercises-storage";
import { type MuscleGroup } from "@/utils/muscle-groups";
import { getProfile, type Profile } from "@/utils/profile-storage";
import {
  dayKeyForDate,
  getWeeklySplit,
  resetWeeklySplit,
  saveWeeklySplit,
  EMPTY_SPLIT,
  type WeeklySplit,
} from "@/utils/weekly-split-storage";
import {
  addSet,
  deleteSet,
  getSetsForDate,
  type WorkoutSet,
} from "@/utils/workout-storage";

export function useLogger() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cyclePrefs, setCyclePrefs] = useState<CyclePrefs | null>(null);
  const [customs, setCustoms] = useState<CustomExercise[]>([]);
  const [split, setSplit] = useState<WeeklySplit>(EMPTY_SPLIT);

  const [dateKey, setDateKey] = useState<string>(toDateKey(new Date()));
  const [exercise, setExercise] = useState<string>(EXERCISES[0]);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [timerRunId, setTimerRunId] = useState<string | null>(null);

  // Combined exercise list for the picker — built-ins first, then custom
  // entries (which carry customId so the picker can render delete icons).
  const exerciseList = useMemo<ExerciseOption[]>(
    () => [
      ...EXERCISES.map((name) => ({ name })),
      ...customs.map((c) => ({ name: c.name, customId: c.id })),
    ],
    [customs],
  );

  // Today's plan label, based on the selected date's weekday.
  const todayPlan = split[dayKeyForDate(fromDateKey(dateKey))].trim();
  const cycleStatus = getCycleStatus(cyclePrefs, dateKey);

  const reloadPersonalisation = useCallback(async () => {
    const [p, prefs, cs, wp] = await Promise.all([
      getProfile(),
      getCyclePrefs(),
      getCustomExercises(),
      getWeeklySplit(),
    ]);
    setProfile(p);
    setCyclePrefs(prefs);
    setCustoms(cs);
    setSplit(wp);
  }, []);

  // First-launch gate + load personalised data.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const done = await isOnboardingComplete();
      if (cancelled) return;
      if (!done) {
        setShowOnboarding(true);
      } else {
        await reloadPersonalisation();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadPersonalisation]);

  // Reload sets when date changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = await getSetsForDate(dateKey);
      if (!cancelled) setSets(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [dateKey]);

  const closeOnboarding = useCallback(async () => {
    setShowOnboarding(false);
    await reloadPersonalisation();
  }, [reloadPersonalisation]);

  const saveSet = useCallback(
    async ({ weight, reps }: { weight: number; reps: number }) => {
      const saved = await addSet(dateKey, { exercise, weight, reps });
      setSets(await getSetsForDate(dateKey));
      setTimerRunId(saved.id);
    },
    [dateKey, exercise],
  );

  const removeSet = useCallback(
    async (id: string) => {
      await deleteSet(dateKey, id);
      setSets(await getSetsForDate(dateKey));
    },
    [dateKey],
  );

  const addCustom = useCallback(async (name: string, muscleGroup: MuscleGroup) => {
    const created = await addCustomExercise(name, muscleGroup);
    setCustoms(await getCustomExercises());
    // Auto-select the newly-added exercise so the user can log immediately.
    setExercise(created.name);
  }, []);

  const removeCustom = useCallback(
    async (customId: string) => {
      const toDelete = customs.find((c) => c.id === customId);
      await deleteCustomExercise(customId);
      setCustoms(await getCustomExercises());
      // If the currently-selected exercise was the one being deleted, fall
      // back to the first built-in so the picker label doesn't go stale.
      if (toDelete && exercise === toDelete.name) {
        setExercise(EXERCISES[0]);
      }
    },
    [customs, exercise],
  );

  const saveSplit = useCallback(async (next: WeeklySplit) => {
    await saveWeeklySplit(next);
    setSplit(next);
  }, []);

  const resetSplit = useCallback(async () => {
    await resetWeeklySplit();
    setSplit({ ...EMPTY_SPLIT });
  }, []);

  return {
    showOnboarding,
    closeOnboarding,
    profile,
    cycleStatus,
    split,
    todayPlan,
    dateKey,
    setDateKey,
    exercise,
    setExercise,
    exerciseList,
    sets,
    timerRunId,
    saveSet,
    removeSet,
    addCustom,
    removeCustom,
    saveSplit,
    resetSplit,
  };
}
