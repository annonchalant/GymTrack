// Large hero card showing the user's current consistency streak.
// Visually distinct via a glowing accent border + oversized numeral.

import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/src/theme/colors";

type Props = {
  streak: number;
};

export default function StreakCard({ streak }: Props) {
  const active = streak > 0;
  const subtitle = active
    ? streak === 1
      ? "You're on the board. Keep it rolling."
      : `${streak} days strong. Don't break the chain.`
    : "Log a workout today to start your streak.";

  return (
    <View
      style={[styles.card, active && styles.cardActive]}
      testID="streak-card"
    >
      <View style={styles.iconWrap}>
        <Ionicons
          name={active ? "flame" : "flame-outline"}
          size={32}
          color={active ? colors.accent : colors.textMuted}
        />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.label}>CURRENT CONSISTENCY STREAK</Text>
        <View style={styles.numberRow}>
          <Text style={styles.number} testID="streak-value">
            {streak}
          </Text>
          <Text style={styles.unit}>{streak === 1 ? "day" : "days"}</Text>
        </View>
        <Text style={styles.subtitle} testID="streak-subtitle">
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardActive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.accent,
    // Subtle accent glow.
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flex: 1,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: 4,
  },
  numberRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 4,
  },
  number: {
    fontSize: 48,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -1,
    lineHeight: 52,
    fontVariant: ["tabular-nums"],
  },
  unit: {
    ...typography.heading,
    color: colors.textSecondary,
    fontSize: 18,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
