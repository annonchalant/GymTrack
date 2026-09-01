// Data + behavior for the Calendar screen: streak, logged/planned day sets,
// weekly split baseline, and plan-override mutations.

import { useCallback, useEffect, useState } from "react";

import { toDateKey } from "@/utils/cycle";
import { type MuscleGroup } from "@/utils/muscle-groups";
import {
  deletePlan,
  getAllPlans,
  savePlan,
  type PlannedWorkout,
} from "@/utils/planned-storage";
import { computeStreak } from "@/utils/streak";
import {
  EMPTY_SPLIT,
  getWeeklySplit,
  type WeeklySplit,
} from "@/utils/weekly-split-storage";
import { getAllSets } from "@/utils/workout-storage";

export function useCalendar() {
  const [streak, setStreak] = useState(0);
  const [loggedKeys, setLoggedKeys] = useState<Set<string>>(new Set());
  const [plans, setPlans] = useState<PlannedWorkout[]>([]);
  const [split, setSplit] = useState<WeeklySplit>(EMPTY_SPLIT);

  const todayKey = toDateKey(new Date());

  const reload = useCallback(async () => {
    const [allSets, allPlans, weeklySplit] = await Promise.all([
      getAllSets(),
      getAllPlans(),
      getWeeklySplit(),
    ]);
    const keys = new Set(allSets.map((s) => s.dateKey));
    setLoggedKeys(keys);
    setPlans(allPlans);
    setSplit(weeklySplit);
    setStreak(computeStreak(keys));
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveDatePlan = useCallback(
    async (dateKey: string, group: MuscleGroup) => {
      await savePlan(dateKey, group);
      await reload();
    },
    [reload],
  );

  const deleteDatePlan = useCallback(
    async (dateKey: string) => {
      await deletePlan(dateKey);
      await reload();
    },
    [reload],
  );

  return {
    streak,
    loggedKeys,
    plans,
    split,
    todayKey,
    saveDatePlan,
    deleteDatePlan,
  };
}
