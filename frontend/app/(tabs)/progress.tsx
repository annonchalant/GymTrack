// Progress — strength line chart + muscle-group pie chart.
// All data sourced from `fit.workouts.v1` AsyncStorage via workout-storage.

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart, PieChart } from "react-native-chart-kit";

import ExercisePicker, {
  type ExerciseOption,
} from "@/src/components/logger/ExercisePicker";
import { colors, radius, spacing, typography } from "@/src/theme/colors";
import { EXERCISES, fromDateKey } from "@/src/utils/cycle";
import {
  deleteCustomExercise,
  getCustomExercises,
  type CustomExercise,
} from "@/src/utils/custom-exercises-storage";
import {
  aggregateByMuscle,
  buildExerciseMuscleLookup,
  MUSCLE_COLORS,
  MUSCLE_GROUPS,
} from "@/src/utils/muscle-groups";
import {
  getMaxWeightSeries,
  getSetCountsByExercise,
  hasAnySets,
  type StrengthPoint,
} from "@/src/utils/workout-storage";

const SCREEN_PADDING = spacing.lg;
const CHART_WIDTH = Dimensions.get("window").width - SCREEN_PADDING * 2;
const MAX_POINTS = 10; // keep X-axis labels readable

const chartConfig = {
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  decimalPlaces: 0,
  // Both line + label colors honour the chart-kit opacity arg.
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(181, 181, 195, ${opacity})`,
  propsForBackgroundLines: { stroke: colors.border, strokeDasharray: "4 6" },
  propsForDots: { r: "5", strokeWidth: "2", stroke: colors.background },
  fillShadowGradient: colors.accent,
  fillShadowGradientOpacity: 0.25,
} as const;

function formatShortDate(dateKey: string): string {
  return fromDateKey(dateKey).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function ProgressScreen() {
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

  const handleDeleteCustom = async (customId: string) => {
    const toDelete = customs.find((c) => c.id === customId);
    await deleteCustomExercise(customId);
    const next = await getCustomExercises();
    setCustoms(next);
    if (toDelete && exercise === toDelete.name) {
      setExercise(EXERCISES[0]);
    }
  };

  // Reload every time the tab regains focus so logging on the Logger tab is
  // immediately reflected here.
  useFocusEffect(
    useCallback(() => {
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
    }, [exercise]),
  );

  // Empty state — no workout data anywhere.
  if (!loading && !anyData) {
    return (
      <SafeAreaView
        style={styles.safe}
        edges={["top", "left", "right"]}
        testID="progress-screen"
      >
        <View style={styles.emptyWrap} testID="progress-empty-state">
          <View style={styles.emptyIcon}>
            <Ionicons name="trending-up" size={40} color={colors.accent} />
          </View>
          <Text style={styles.emptyTitle}>No progress yet</Text>
          <Text style={styles.emptyBody}>
            Log your first workout to see your progress charts!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Trim series to the last N points so the X labels don't squash together.
  const trimmedSeries = series.slice(-MAX_POINTS);
  const seriesIsEmpty = trimmedSeries.length === 0;

  const muscleAgg = aggregateByMuscle(
    muscleCounts,
    buildExerciseMuscleLookup(customs),
  );
  const totalSetsLogged = Object.values(muscleCounts).reduce(
    (a, b) => a + b,
    0,
  );
  const pieData = MUSCLE_GROUPS.filter((g) => muscleAgg[g] > 0).map((g) => ({
    name: g,
    population: muscleAgg[g],
    color: MUSCLE_COLORS[g],
    legendFontColor: colors.textSecondary,
    legendFontSize: 13,
  }));

  return (
    <SafeAreaView
      style={styles.safe}
      edges={["top", "left", "right"]}
      testID="progress-screen"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>TRENDS</Text>
        <Text style={styles.title}>Progress</Text>

        {/* Strength progression */}
        <View style={styles.card} testID="strength-card">
          <Text style={styles.cardLabel}>STRENGTH PROGRESSION</Text>
          <Text style={styles.cardTitle}>Max weight by session</Text>

          <View style={styles.pickerWrap}>
            <ExercisePicker
              value={exercise}
              onChange={setExercise}
              exercises={exerciseList}
              onDeleteCustom={handleDeleteCustom}
            />
          </View>

          {seriesIsEmpty ? (
            <View style={styles.miniEmpty} testID="strength-chart-empty">
              <Ionicons
                name="analytics-outline"
                size={20}
                color={colors.textMuted}
              />
              <Text style={styles.miniEmptyText}>
                No sets logged for {exercise} yet.
              </Text>
            </View>
          ) : (
            <View testID="strength-chart">
              <LineChart
                data={{
                  labels: trimmedSeries.map((p) => formatShortDate(p.dateKey)),
                  datasets: [
                    { data: trimmedSeries.map((p) => p.maxWeight) },
                  ],
                }}
                width={CHART_WIDTH - spacing.lg * 2 + spacing.md}
                height={220}
                chartConfig={chartConfig}
                bezier
                withInnerLines
                withOuterLines={false}
                withVerticalLines={false}
                fromZero={false}
                style={styles.chart}
              />
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  Best:{" "}
                  <Text style={styles.metaValue}>
                    {Math.max(...trimmedSeries.map((p) => p.maxWeight))}
                  </Text>
                </Text>
                <Text style={styles.metaText}>
                  Sessions:{" "}
                  <Text style={styles.metaValue}>{trimmedSeries.length}</Text>
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Muscle group distribution */}
        <View style={styles.card} testID="muscle-card">
          <Text style={styles.cardLabel}>VOLUME BALANCE</Text>
          <Text style={styles.cardTitle}>Muscle group distribution</Text>

          {pieData.length === 0 ? (
            <View style={styles.miniEmpty} testID="muscle-chart-empty">
              <Ionicons
                name="pie-chart-outline"
                size={20}
                color={colors.textMuted}
              />
              <Text style={styles.miniEmptyText}>
                No sets logged yet across any muscle group.
              </Text>
            </View>
          ) : (
            <View testID="muscle-chart">
              <PieChart
                data={pieData}
                width={CHART_WIDTH - spacing.lg * 2 + spacing.md}
                height={200}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="0"
                center={[CHART_WIDTH * 0.13, 0]}
                hasLegend={false}
                avoidFalseZero
              />
              {/* Custom legend so colors + labels stay tight to the design. */}
              <View style={styles.legend} testID="muscle-legend">
                {pieData.map((slice) => {
                  const pct = totalSetsLogged
                    ? Math.round((slice.population / totalSetsLogged) * 100)
                    : 0;
                  return (
                    <View
                      key={slice.name}
                      style={styles.legendRow}
                      testID={`muscle-legend-${slice.name.toLowerCase()}`}
                    >
                      <View
                        style={[
                          styles.legendDot,
                          { backgroundColor: slice.color },
                        ]}
                      />
                      <Text style={styles.legendLabel}>{slice.name}</Text>
                      <Text style={styles.legendValue}>
                        {pct}% · {slice.population}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: SCREEN_PADDING,
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  pickerWrap: {
    marginBottom: spacing.md,
  },
  chart: {
    borderRadius: radius.md,
    marginLeft: -spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
  },
  metaText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  metaValue: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
  miniEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  miniEmptyText: {
    ...typography.body,
    color: colors.textMuted,
    flex: 1,
  },
  legend: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
  },
  legendLabel: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  legendValue: {
    ...typography.caption,
    color: colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  emptyTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  emptyBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 280,
  },
});
