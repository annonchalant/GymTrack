// 7-day repeating split editor. User types a free-text label per weekday
// (e.g. "Chest + Triceps"). "Reset all" clears every field. Saving persists
// to AsyncStorage.

import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { colors, radius, spacing, typography } from "@/src/theme/colors";
import {
  DAY_LABELS,
  DAY_ORDER,
  EMPTY_SPLIT,
  type WeeklySplit,
} from "@/src/utils/weekly-split-storage";

type Props = {
  visible: boolean;
  initial: WeeklySplit;
  onClose: () => void;
  onSave: (split: WeeklySplit) => Promise<void> | void;
  onReset: () => Promise<void> | void;
};

export default function WeeklySplitModal({
  visible,
  initial,
  onClose,
  onSave,
  onReset,
}: Props) {
  const [draft, setDraft] = useState<WeeklySplit>(initial);
  const [busy, setBusy] = useState(false);

  // Sync when modal reopens with fresh stored data.
  useEffect(() => {
    if (visible) setDraft(initial);
  }, [visible, initial]);

  const setDay = (k: keyof WeeklySplit, v: string) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const handleSave = async () => {
    setBusy(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setBusy(true);
    try {
      await onReset();
      setDraft({ ...EMPTY_SPLIT });
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
      testID="weekly-split-modal"
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.sheet}
          onPress={(e) => e.stopPropagation()}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>WEEKLY PLAN</Text>
                <Text style={styles.title}>Your 7-day split</Text>
                <Text style={styles.body}>
                  Type what you train each day. The plan repeats every week.
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleReset}
                style={styles.resetBtn}
                activeOpacity={0.7}
                testID="weekly-split-reset-button"
              >
                <Ionicons name="refresh" size={16} color={colors.danger} />
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={{ paddingBottom: spacing.md }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {DAY_ORDER.map((k) => (
                <View
                  key={k}
                  style={styles.dayRow}
                  testID={`weekly-split-day-${k}`}
                >
                  <Text style={styles.dayLabel}>{DAY_LABELS[k]}</Text>
                  <TextInput
                    value={draft[k]}
                    onChangeText={(v) => setDay(k, v)}
                    placeholder="Rest day"
                    placeholderTextColor={colors.textMuted}
                    style={styles.dayInput}
                    maxLength={50}
                    testID={`weekly-split-input-${k}`}
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={onClose}
                disabled={busy}
                activeOpacity={0.8}
                testID="weekly-split-cancel-button"
              >
                <Text style={styles.btnSecondaryText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary, busy && styles.btnDisabled]}
                onPress={handleSave}
                disabled={busy}
                activeOpacity={0.85}
                testID="weekly-split-save-button"
              >
                <Text style={styles.btnPrimaryText}>Save plan</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
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
    maxHeight: "90%",
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
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
    ...typography.caption,
    color: colors.textSecondary,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
  },
  resetText: {
    ...typography.label,
    color: colors.danger,
  },
  scroll: {
    maxHeight: 420,
  },
  dayRow: {
    marginBottom: spacing.sm,
  },
  dayLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: 4,
  },
  dayInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 16,
    minHeight: 48,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  btn: {
    flex: 1,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  btnPrimary: { backgroundColor: colors.accent },
  btnPrimaryText: {
    ...typography.bodyLarge,
    color: "#fff",
    fontWeight: "700",
  },
  btnDisabled: { opacity: 0.45 },
  btnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnSecondaryText: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: "600",
  },
});
