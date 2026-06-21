// Logger — main screen.
// Hosts: profile greeting · today's plan banner · date bar · cycle banner ·
// exercise picker (built-in + custom) · set form · rest timer · history list.

import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AdaptiveBanner from "@/src/components/logger/AdaptiveBanner";
import CustomExerciseModal from "@/src/components/logger/CustomExerciseModal";
import DateBar from "@/src/components/logger/DateBar";
import ExercisePicker, {
  type ExerciseOption,
} from "@/src/components/logger/ExercisePicker";
import OnboardingModal from "@/src/components/OnboardingModal";
import RestTimer from "@/src/components/logger/RestTimer";
import SetForm from "@/src/components/logger/SetForm";
import SetList from "@/src/components/logger/SetList";
import WeeklySplitModal from "@/src/components/logger/WeeklySplitModal";
import { colors, radius, spacing, typography } from "@/src/theme/colors";
import {
  EXERCISES,
  formatDateLong,
  fromDateKey,
  getCycleStatus,
  toDateKey,
} from "@/src/utils/cycle";
import {
  getCyclePrefs,
  isOnboardingComplete,
  type CyclePrefs,
} from "@/src/utils/cycle-storage";
import {
  addCustomExercise,
  deleteCustomExercise,
  getCustomExercises,
  type CustomExercise,
} from "@/src/utils/custom-exercises-storage";
import { type MuscleGroup } from "@/src/utils/muscle-groups";
import { getProfile, type Profile } from "@/src/utils/profile-storage";
import {
  dayKeyForDate,
  getWeeklySplit,
  resetWeeklySplit,
  saveWeeklySplit,
  EMPTY_SPLIT,
  type WeeklySplit,
} from "@/src/utils/weekly-split-storage";
import {
  addSet,
  deleteSet,
  getSetsForDate,
  type WorkoutSet,
} from "@/src/utils/workout-storage";

export default function LoggerScreen() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [cyclePrefs, setCyclePrefs] = useState<CyclePrefs | null>(null);
  const [customs, setCustoms] = useState<CustomExercise[]>([]);
  const [split, setSplit] = useState<WeeklySplit>(EMPTY_SPLIT);

  const [dateKey, setDateKey] = useState<string>(toDateKey(new Date()));
  const [exercise, setExercise] = useState<string>(EXERCISES[0]);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [timerRunId, setTimerRunId] = useState<string | null>(null);

  // Modals
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);

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

  // First-launch gate + reload personalised data on focus.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleOnboardingClose = async () => {
    setShowOnboarding(false);
    await reloadPersonalisation();
  };

  const handleSave = useCallback(
    async ({ weight, reps }: { weight: number; reps: number }) => {
      const saved = await addSet(dateKey, { exercise, weight, reps });
      const next = await getSetsForDate(dateKey);
      setSets(next);
      setTimerRunId(saved.id);
    },
    [dateKey, exercise],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteSet(dateKey, id);
      const next = await getSetsForDate(dateKey);
      setSets(next);
    },
    [dateKey],
  );

  const handleAddCustom = async (name: string, muscleGroup: MuscleGroup) => {
    const created = await addCustomExercise(name, muscleGroup);
    const nextList = await getCustomExercises();
    setCustoms(nextList);
    // Auto-select the newly-added exercise so the user can log immediately.
    setExercise(created.name);
  };

  const handleDeleteCustom = async (customId: string) => {
    const toDelete = customs.find((c) => c.id === customId);
    await deleteCustomExercise(customId);
    const nextList = await getCustomExercises();
    setCustoms(nextList);
    // If the currently-selected exercise was the one being deleted, fall back
    // to the first built-in so the picker label doesn't go stale.
    if (toDelete && exercise === toDelete.name) {
      setExercise(EXERCISES[0]);
    }
  };

  const handleSaveSplit = async (next: WeeklySplit) => {
    await saveWeeklySplit(next);
    setSplit(next);
  };

  const handleResetSplit = async () => {
    await resetWeeklySplit();
    setSplit({ ...EMPTY_SPLIT });
  };

  const cycleStatus = getCycleStatus(cyclePrefs, dateKey);
  const todayLabel = formatDateLong(fromDateKey(dateKey));

  return (
    <SafeAreaView
      style={styles.safe}
      edges={["top", "left", "right"]}
      testID="logger-screen"
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>
          {profile?.name ? `HI, ${profile.name.split(" ")[0].toUpperCase()}` : "LOGGER"}
        </Text>
        <Text style={styles.title}>Log a set</Text>

        {/* Today's plan banner — surfaces the configured weekly split */}
        <TouchableOpacity
          style={styles.planBanner}
          onPress={() => setSplitModalOpen(true)}
          activeOpacity={0.85}
          testID="today-plan-banner"
        >
          <View style={styles.planIcon}>
            <Ionicons name="calendar-clear" size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.planLabel}>TODAY&apos;S PLAN</Text>
            {todayPlan ? (
              <Text style={styles.planValue} testID="today-plan-value">
                {todayLabel} · {todayPlan}
              </Text>
            ) : (
              <Text style={styles.planMuted} testID="today-plan-empty">
                Tap to set your weekly split
              </Text>
            )}
          </View>
          <Ionicons
            name="create-outline"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <View style={styles.block}>
          <DateBar dateKey={dateKey} onChange={setDateKey} />
        </View>

        {cycleStatus.enabled && (
          <View style={styles.block}>
            <AdaptiveBanner status={cycleStatus} />
          </View>
        )}

        <View style={styles.block}>
          <ExercisePicker
            value={exercise}
            onChange={setExercise}
            exercises={exerciseList}
            onAddCustom={() => setCustomModalOpen(true)}
            onDeleteCustom={handleDeleteCustom}
          />
        </View>

        <View style={styles.block}>
          <SetForm exercise={exercise} onSave={handleSave} />
        </View>

        {timerRunId && (
          <View style={styles.block}>
            <RestTimer runId={timerRunId} />
          </View>
        )}

        <View style={styles.block}>
          <SetList
            sets={sets}
            onDelete={handleDelete}
            headerLabel={
              dateKey === toDateKey(new Date())
                ? "Today's sets"
                : `Sets · ${formatDateLong(fromDateKey(dateKey))}`
            }
          />
        </View>
      </ScrollView>

      <OnboardingModal
        visible={showOnboarding}
        onClose={handleOnboardingClose}
      />
      <WeeklySplitModal
        visible={splitModalOpen}
        initial={split}
        onClose={() => setSplitModalOpen(false)}
        onSave={handleSaveSplit}
        onReset={handleResetSplit}
      />
      <CustomExerciseModal
        visible={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        onAdd={handleAddCustom}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  eyebrow: {
    ...typography.label,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.display,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  planBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    minHeight: 64,
  },
  planIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  planLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: 2,
  },
  planValue: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  planMuted: {
    ...typography.body,
    color: colors.textSecondary,
  },
  block: { marginBottom: spacing.md },
});
