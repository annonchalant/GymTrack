// Data + behavior for the Progress screen: strength series, muscle
// aggregation inputs, and custom-exercise management.

import { useEffect, useState } from "react";

import { type ExerciseOption } from "@/components/logger/ExercisePicker";
import { EXERCISES } from "@/utils/cycle";
import {
  deleteCustomExercise,
  getCustomExercises,
  type CustomExercise,
} from "@/utils/custom-exercises-storage";
import {
  getMaxWeightSeries,
  getSetCountsByExercise,
  hasAnySets,
  type StrengthPoint,
} from "@/utils/workout-storage";

export function useProgress() {
  const [loading, setLoading] = useState(true);
  const [anyData, setAnyData] = useState(false);
  const [exercise, setExercise] = useState<string>(EXERCISES[0]);
  const [series, setSeries] = useState<StrengthPoint[]>([]);
  const [muscleCounts, setMuscleCounts] = useState<Record<string, number>>({});
  const [customs, setCustoms] = useState<CustomExercise[]>([]);

  // Combined picker list: built-in + custom names (no "Add custom" affordance
  // on Progress — creation lives on the Logger tab).
  const exerciseList: ExerciseOption[] = [
    ...EXERCISES.map((name) => ({ name })),
    ...customs.map((c) => ({ name: c.name, customId: c.id })),
  ];

  // Reload whenever the selected exercise changes (the page remounts on tab
  // navigation, which covers the mobile app's focus-refresh behaviour).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const has = await hasAnySets();
      if (cancelled) return;
      setAnyData(has);
      if (has) {
        const [s, counts, cs] = await Promise.all([
          getMaxWeightSeries(exercise),
          getSetCountsByExercise(),
          getCustomExercises(),
        ]);
        if (cancelled) return;
        setSeries(s);
        setMuscleCounts(counts);
        setCustoms(cs);
      } else {
        // Still load customs so a brand-new user sees them in the picker.
        const cs = await getCustomExercises();
        if (cancelled) return;
        setSeries([]);
        setMuscleCounts({});
        setCustoms(cs);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [exercise]);

  const removeCustom = async (customId: string) => {
    const toDelete = customs.find((c) => c.id === customId);
    await deleteCustomExercise(customId);
    setCustoms(await getCustomExercises());
    if (toDelete && exercise === toDelete.name) {
      setExercise(EXERCISES[0]);
    }
  };

  return {
    loading,
    anyData,
    exercise,
    setExercise,
    exerciseList,
    series,
    muscleCounts,
    customs,
    removeCustom,
  };
}
