// Scrollable list of sets for the currently selected date. Swipe-free row
// with a small delete affordance.

import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { formatTime } from "@/src/utils/cycle";
import type { WorkoutSet } from "@/src/utils/workout-storage";
import { colors, radius, spacing, typography } from "@/src/theme/colors";

type Props = {
  sets: WorkoutSet[];
  onDelete: (id: string) => void;
  // Optional label override for the section header (e.g. "Today's sets",
  // "Sets on Mon, Jun 15"). Falls back to "Sets" if unset.
  headerLabel?: string;
};

export default function SetList({ sets, onDelete, headerLabel }: Props) {
  if (sets.length === 0) {
    return (
      <View style={styles.empty} testID="set-list-empty">
        <Ionicons name="list" size={20} color={colors.textMuted} />
        <Text style={styles.emptyText}>
          No sets logged yet. Hit Save Set above to start.
        </Text>
      </View>
    );
  }

  // Group by exercise for at-a-glance readability while keeping the order
  // (newest first across the screen).
  return (
    <View testID="set-list" style={styles.list}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{headerLabel ?? "Sets"}</Text>
        <Text style={styles.headerCount} testID="set-list-count">
          {sets.length} {sets.length === 1 ? "set" : "sets"}
        </Text>
      </View>
      {sets.map((s, idx) => {
        const setNumber = sets.length - idx; // newest = highest number
        return (
          <View
            key={s.id}
            style={styles.row}
            testID={`set-row-${s.id}`}
          >
            <View style={styles.setNumber}>
              <Text style={styles.setNumberText}>#{setNumber}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.exercise}>{s.exercise}</Text>
              <Text style={styles.meta}>
                {s.weight} × {s.reps} reps · {formatTime(s.loggedAt)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => onDelete(s.id)}
              style={styles.deleteBtn}
              accessibilityLabel={`Delete set #${setNumber}`}
              testID={`delete-set-${s.id}`}
              activeOpacity={0.6}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: spacing.xs,
  },
  headerTitle: {
    ...typography.label,
    color: colors.textMuted,
  },
  headerCount: {
    ...typography.label,
    color: colors.accent,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 64,
  },
  setNumber: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  setNumberText: {
    ...typography.label,
    color: colors.accent,
  },
  exercise: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: "700",
    marginBottom: 2,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    flex: 1,
  },
});
