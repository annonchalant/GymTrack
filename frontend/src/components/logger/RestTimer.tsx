// Rest timer — 90s countdown.
// Parent provides a `runId` (e.g., the just-saved set id). Each new runId
// triggers a fresh countdown. Internal state, but exposes a Skip button.

import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors, radius, spacing, typography } from "@/src/theme/colors";

type Props = {
  // Changing this prop (re)starts the timer. `null` keeps it idle.
  runId: string | null;
  durationSec?: number;
  onDone?: () => void;
};

function formatMMSS(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function RestTimer({
  runId,
  durationSec = 90,
  onDone,
}: Props) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // (Re)start whenever runId changes to a non-null value.
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!runId) {
      setRemaining(null);
      return;
    }
    setRemaining(durationSec);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onDoneRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [runId, durationSec]);

  if (remaining === null) return null;

  const pct = Math.min(
    1,
    Math.max(0, (durationSec - remaining) / durationSec),
  );
  const done = remaining === 0;

  const handleSkip = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRemaining(null);
  };

  return (
    <View
      style={[styles.card, done && styles.cardDone]}
      testID="rest-timer-card"
    >
      <View style={styles.row}>
        <View style={styles.iconBubble}>
          <Ionicons
            name={done ? "checkmark" : "timer-outline"}
            size={22}
            color={colors.accent}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>
            {done ? "REST COMPLETE" : "RESTING"}
          </Text>
          <Text style={styles.time} testID="rest-timer-value">
            {done ? "Ready for next set" : formatMMSS(remaining)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipBtn}
          activeOpacity={0.7}
          testID="rest-timer-skip-button"
        >
          <Text style={styles.skipText}>{done ? "Dismiss" : "Skip"}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[styles.progressFill, { width: `${pct * 100}%` }]}
          testID="rest-timer-progress"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardDone: {
    borderColor: colors.success,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: 2,
  },
  time: {
    ...typography.title,
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  skipBtn: {
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  skipText: {
    ...typography.label,
    color: colors.textPrimary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.accent,
  },
});
