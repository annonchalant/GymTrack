// Adaptive training banner — Recovery vs Peak Energy.
// Only renders when cycle tracking is enabled (parent passes `status.enabled`).

import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import type { CycleStatus } from "@/src/utils/cycle";
import { colors, radius, spacing, typography } from "@/src/theme/colors";

type Props = {
  status: CycleStatus;
};

const COPY = {
  recovery: {
    title: "Recovery Phase",
    body: "We suggest lighter weights today. Recovery is progress.",
    icon: "leaf" as const,
  },
  peak: {
    title: "Peak Energy Phase",
    body: "Great day to push for personal records!",
    icon: "flash" as const,
  },
};

export default function AdaptiveBanner({ status }: Props) {
  if (!status.enabled || !status.phase) return null;

  const copy = COPY[status.phase];
  const isRecovery = status.phase === "recovery";

  return (
    <View
      style={[
        styles.banner,
        isRecovery ? styles.bannerRecovery : styles.bannerPeak,
      ]}
      testID="adaptive-banner"
    >
      <View
        style={[
          styles.iconBubble,
          isRecovery ? styles.iconBubbleRecovery : styles.iconBubblePeak,
        ]}
      >
        <Ionicons
          name={copy.icon}
          size={22}
          color={isRecovery ? "#A5B4FC" : colors.accent}
        />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Text style={styles.title} testID="adaptive-banner-title">
            {copy.title}
          </Text>
          <Text style={styles.dayPill} testID="adaptive-banner-day">
            Day {status.day}
          </Text>
        </View>
        <Text style={styles.body} testID="adaptive-banner-body">
          {copy.body}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  bannerRecovery: {
    // Soft indigo wash — calm, restorative.
    backgroundColor: "rgba(129, 140, 248, 0.10)",
    borderColor: "rgba(129, 140, 248, 0.45)",
  },
  bannerPeak: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBubbleRecovery: {
    backgroundColor: "rgba(129, 140, 248, 0.20)",
  },
  iconBubblePeak: {
    backgroundColor: "rgba(59, 130, 246, 0.22)",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 2,
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
    fontSize: 17,
  },
  dayPill: {
    ...typography.caption,
    color: colors.textSecondary,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 21,
  },
});
