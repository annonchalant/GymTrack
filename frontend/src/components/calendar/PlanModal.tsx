// Bottom-sheet modal to plan a future workout. User picks a target muscle
// group (Legs / Chest / Back / Shoulders) and saves it. If a plan already
// exists for the date, supports updating it or removing it.

import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { colors, radius, spacing, typography } from "@/src/theme/colors";
import { fromDateKey } from "@/src/utils/cycle";
import {
  MUSCLE_COLORS,
  MUSCLE_GROUPS,
  type MuscleGroup,
} from "@/src/utils/muscle-groups";

type Props = {
  visible: boolean;
  dateKey: string | null;
  existingGroup: MuscleGroup | null;
  // Free-text baseline coming from the weekly split (e.g. "Chest"). Shown as
  // contextual chip when there's no override yet so the user knows what's
  // already scheduled for that weekday.
  baselineText?: string;
  onClose: () => void;
  onSave: (dateKey: string, group: MuscleGroup) => Promise<void> | void;
  onDelete: (dateKey: string) => Promise<void> | void;
};

function formatLong(dateKey: string): string {
  return fromDateKey(dateKey).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function PlanModal({
  visible,
  dateKey,
  existingGroup,
  baselineText,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [selected, setSelected] = useState<MuscleGroup | null>(existingGroup);
  const [busy, setBusy] = useState(false);

  // Sync local state when the modal opens for a new date.
  useEffect(() => {
    if (visible) setSelected(existingGroup);
  }, [visible, existingGroup]);

  if (!visible || !dateKey) return null;

  const handleSave = async () => {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await onSave(dateKey, selected);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onDelete(dateKey);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      testID="plan-modal"
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.sheet}
          onPress={(e) => e.stopPropagation()}
          testID="plan-sheet"
        >
          <View style={styles.handle} />
          <Text style={styles.eyebrow}>PLAN A WORKOUT</Text>
          <Text style={styles.title} testID="plan-modal-date">
            {formatLong(dateKey)}
          </Text>
          <Text style={styles.body}>
            Pick a target muscle group. You can always change it later.
          </Text>

          {baselineText && !existingGroup && (
            <View style={styles.baselineChip} testID="plan-baseline-chip">
              <Ionicons name="repeat" size={14} color={colors.accent} />
              <Text style={styles.baselineText}>
                Weekly plan says: <Text style={styles.baselineEm}>{baselineText}</Text>
              </Text>
            </View>
          )}

          <View style={styles.grid}>
            {MUSCLE_GROUPS.map((g) => {
              const active = selected === g;
              const color = MUSCLE_COLORS[g];
              return (
                <TouchableOpacity
                  key={g}
                  onPress={() => setSelected(g)}
                  activeOpacity={0.85}
                  style={[
                    styles.chip,
                    active && {
                      borderColor: color,
                      backgroundColor: `${color}22`,
                    },
                  ]}
                  testID={`plan-muscle-${g.toLowerCase()}`}
                >
                  <View
                    style={[styles.chipDot, { backgroundColor: color }]}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      active && { color: colors.textPrimary },
                    ]}
                  >
                    {g}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark" size={18} color={color} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.actions}>
            {existingGroup && (
              <TouchableOpacity
                style={[styles.btn, styles.btnDanger]}
                onPress={handleDelete}
                disabled={busy}
                activeOpacity={0.8}
                testID="plan-delete-button"
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={colors.danger}
                />
                <Text style={styles.btnDangerText}>Remove plan</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.btn,
                styles.btnPrimary,
                (!selected || busy) && styles.btnDisabled,
              ]}
              onPress={handleSave}
              disabled={!selected || busy}
              activeOpacity={0.85}
              testID="plan-save-button"
            >
              <Text style={styles.btnPrimaryText}>
                {existingGroup ? "Update plan" : "Save plan"}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  eyebrow: {
    ...typography.label,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  baselineChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.35)",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  baselineText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  baselineEm: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  chipDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  chipText: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    flex: 1,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  btn: {
    flex: 1,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  btnPrimary: {
    backgroundColor: colors.accent,
  },
  btnPrimaryText: {
    ...typography.bodyLarge,
    color: "#fff",
    fontWeight: "700",
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnDanger: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  btnDangerText: {
    ...typography.bodyLarge,
    color: colors.danger,
    fontWeight: "600",
  },
});
