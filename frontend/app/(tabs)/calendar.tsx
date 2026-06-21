// Calendar — Phase 4 (final) + Phase 5 sync.
// - StreakCard
// - Month grid marking past completed days (electric blue) and future
//   planned days (violet for explicit overrides, dimmer indigo for
//   weekly-split baseline plans).
// - Tapping a future day opens PlanModal to set/update an OVERRIDE for that
//   date; the baseline weekly split is shown as context.
// - Upcoming list renders effective plans (override > baseline).

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, type DateData } from "react-native-calendars";

import PlanModal from "@/src/components/calendar/PlanModal";
import StreakCard from "@/src/components/calendar/StreakCard";
import { colors, radius, spacing, typography } from "@/src/theme/colors";
import { addDays, fromDateKey, toDateKey } from "@/src/utils/cycle";
import { MUSCLE_COLORS, type MuscleGroup } from "@/src/utils/muscle-groups";
import {
  deletePlan,
  getAllPlans,
  getEffectivePlan,
  savePlan,
  type EffectivePlan,
  type PlannedWorkout,
} from "@/src/utils/planned-storage";
import { computeStreak } from "@/src/utils/streak";
import {
  dayKeyForDate,
  EMPTY_SPLIT,
  getWeeklySplit,
  type WeeklySplit,
} from "@/src/utils/weekly-split-storage";
import { getAllSets } from "@/src/utils/workout-storage";

const COMPLETED_DOT = colors.accent; // electric blue
const OVERRIDE_DOT = "#A78BFA"; // violet — explicit per-date override
const BASELINE_DOT = "#6366F1"; // indigo — derived from weekly split
const FUTURE_WINDOW_DAYS = 120; // mark plans up to ~4 months ahead

type MarkedMap = Record<
  string,
  {
    marked?: boolean;
    dotColor?: string;
    selected?: boolean;
    selectedColor?: string;
  }
>;

function buildMarkedDates(
  loggedKeys: Set<string>,
  plans: PlannedWorkout[],
  weeklySplit: WeeklySplit,
  todayKey: string,
): MarkedMap {
  const marked: MarkedMap = {};

  // Past + today completed sessions — solid bright blue dot.
  for (const dateKey of loggedKeys) {
    marked[dateKey] = { marked: true, dotColor: COMPLETED_DOT };
  }

  // Future window — overlay overrides (preferred) or baseline plans.
  const today = fromDateKey(todayKey);
  for (let i = 1; i <= FUTURE_WINDOW_DAYS; i++) {
    const d = addDays(today, i);
    const dk = toDateKey(d);
    if (marked[dk]) continue; // never overwrite a completed dot

    const override = plans.find((p) => p.dateKey === dk);
    if (override) {
      marked[dk] = { marked: true, dotColor: OVERRIDE_DOT };
      continue;
    }
    const baseline = weeklySplit[dayKeyForDate(d)]?.trim() ?? "";
    if (baseline.length > 0) {
      marked[dk] = { marked: true, dotColor: BASELINE_DOT };
    }
  }

  // Highlight today with a subtle pill.
  marked[todayKey] = {
    ...marked[todayKey],
    selected: true,
    selectedColor: "rgba(59, 130, 246, 0.18)",
  };

  return marked;
}

const calendarTheme = {
  backgroundColor: colors.surface,
  calendarBackground: colors.surface,
  textSectionTitleColor: colors.textMuted,
  dayTextColor: colors.textPrimary,
  todayTextColor: colors.accent,
  selectedDayTextColor: colors.textPrimary,
  selectedDayBackgroundColor: "rgba(59, 130, 246, 0.18)",
  monthTextColor: colors.textPrimary,
  arrowColor: colors.accent,
  textDisabledColor: colors.textMuted,
  dotColor: COMPLETED_DOT,
  selectedDotColor: COMPLETED_DOT,
  textDayFontWeight: "600" as const,
  textMonthFontWeight: "700" as const,
  textDayHeaderFontWeight: "700" as const,
  textDayFontSize: 16,
  textMonthFontSize: 18,
  textDayHeaderFontSize: 12,
};

export default function CalendarScreen() {
  const [streak, setStreak] = useState(0);
  const [loggedKeys, setLoggedKeys] = useState<Set<string>>(new Set());
  const [plans, setPlans] = useState<PlannedWorkout[]>([]);
  const [split, setSplit] = useState<WeeklySplit>(EMPTY_SPLIT);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDateKey, setModalDateKey] = useState<string | null>(null);
  const [modalExisting, setModalExisting] = useState<MuscleGroup | null>(null);
  const [modalBaseline, setModalBaseline] = useState<string | undefined>(
    undefined,
  );

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

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        await reload();
        if (cancelled) return;
      })();
      return () => {
        cancelled = true;
      };
    }, [reload]),
  );

  const handleDayPress = (day: DateData) => {
    // Only future dates can be planned. Today + past are no-ops.
    if (day.dateString <= todayKey) return;
    const existing = plans.find((p) => p.dateKey === day.dateString) ?? null;
    const baseline =
      split[dayKeyForDate(fromDateKey(day.dateString))]?.trim() ?? "";
    setModalDateKey(day.dateString);
    setModalExisting(existing?.muscleGroup ?? null);
    setModalBaseline(baseline.length > 0 ? baseline : undefined);
    setModalOpen(true);
  };

  const handleSavePlan = async (dateKey: string, group: MuscleGroup) => {
    await savePlan(dateKey, group);
    await reload();
  };

  const handleDeletePlan = async (dateKey: string) => {
    await deletePlan(dateKey);
    await reload();
  };

  const markedDates = buildMarkedDates(loggedKeys, plans, split, todayKey);

  // Build the upcoming list using effective plans. Walk the future window in
  // order so the user sees dates chronologically.
  const upcoming: EffectivePlan[] = [];
  const todayDate = fromDateKey(todayKey);
  for (let i = 1; i <= FUTURE_WINDOW_DAYS && upcoming.length < 5; i++) {
    const dk = toDateKey(addDays(todayDate, i));
    const eff = getEffectivePlan(dk, plans, split);
    if (eff) upcoming.push(eff);
  }

  return (
    <SafeAreaView
      style={styles.safe}
      edges={["top", "left", "right"]}
      testID="calendar-screen"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>HISTORY</Text>
        <Text style={styles.title}>Calendar</Text>

        <View style={styles.block}>
          <StreakCard streak={streak} />
        </View>

        <View
          style={[styles.block, styles.calendarWrap]}
          testID="calendar-grid-wrap"
        >
          <Calendar
            theme={calendarTheme}
            markedDates={markedDates}
            markingType="dot"
            onDayPress={handleDayPress}
            enableSwipeMonths
            firstDay={1}
            hideExtraDays={false}
            style={styles.calendar}
          />
        </View>

        <View style={[styles.block, styles.legend]} testID="calendar-legend">
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: COMPLETED_DOT }]}
            />
            <Text style={styles.legendText}>Logged</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: OVERRIDE_DOT }]}
            />
            <Text style={styles.legendText}>Planned</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: BASELINE_DOT }]}
            />
            <Text style={styles.legendText}>Weekly plan</Text>
          </View>
        </View>

        {upcoming.length > 0 && (
          <View
            style={[styles.block, styles.upcomingCard]}
            testID="upcoming-plans"
          >
            <Text style={styles.cardLabel}>UPCOMING</Text>
            {upcoming.map((eff) => {
              const dotColor =
                eff.source === "override"
                  ? MUSCLE_COLORS[eff.muscleGroup!]
                  : BASELINE_DOT;
              return (
                <View
                  key={eff.dateKey}
                  style={styles.upcomingRow}
                  testID={`upcoming-${eff.dateKey}`}
                >
                  <View
                    style={[styles.upcomingDot, { backgroundColor: dotColor }]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.upcomingDate}>
                      {fromDateKey(eff.dateKey).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                    <Text style={styles.upcomingMuscle}>
                      {eff.text}
                      {eff.source === "baseline" && (
                        <Text style={styles.sourceTag}> · weekly plan</Text>
                      )}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textMuted}
                  />
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.hintRow}>
          <Ionicons
            name="information-circle"
            size={16}
            color={colors.textMuted}
          />
          <Text style={styles.hint}>
            Tap a future date to override its plan. Reset on the weekly split
            won&apos;t touch your overrides.
          </Text>
        </View>
      </ScrollView>

      <PlanModal
        visible={modalOpen}
        dateKey={modalDateKey}
        existingGroup={modalExisting}
        baselineText={modalBaseline}
        onClose={() => setModalOpen(false)}
        onSave={handleSavePlan}
        onDelete={handleDeletePlan}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  block: {
    marginBottom: spacing.md,
  },
  calendarWrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    overflow: "hidden",
  },
  calendar: {
    backgroundColor: colors.surface,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  upcomingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  upcomingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  upcomingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  upcomingDate: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  upcomingMuscle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sourceTag: {
    color: colors.textMuted,
    fontStyle: "italic",
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
});
