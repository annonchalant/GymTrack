// Small modal to add a user-defined exercise with a chosen muscle group.
// Wrapped in KeyboardAvoidingView + ScrollView so the on-screen keyboard
// doesn't cover the inputs / action buttons.

import { useState } from "react";
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
  MUSCLE_COLORS,
  MUSCLE_GROUPS,
  type MuscleGroup,
} from "@/src/utils/muscle-groups";

type Props = {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, muscleGroup: MuscleGroup) => Promise<void> | void;
};

export default function CustomExerciseModal({ visible, onClose, onAdd }: Props) {
  const [name, setName] = useState("");
  const [group, setGroup] = useState<MuscleGroup | null>(null);
  const [busy, setBusy] = useState(false);

  const valid = name.trim().length > 0 && group !== null;

  const handleAdd = async () => {
    if (!valid || busy) return;
    setBusy(true);
    try {
      await onAdd(name.trim(), group!);
      setName("");
      setGroup(null);
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
      testID="custom-exercise-modal"
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable
            style={styles.sheet}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.handle} />
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.eyebrow}>NEW EXERCISE</Text>
              <Text style={styles.title}>Add a custom exercise</Text>

              <Text style={styles.label}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Romanian Deadlift"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                autoFocus
                maxLength={40}
                testID="custom-exercise-name-input"
                returnKeyType="done"
              />

              <Text style={styles.label}>Muscle group</Text>
              <View style={styles.grid}>
                {MUSCLE_GROUPS.map((g) => {
                  const active = group === g;
                  const color = MUSCLE_COLORS[g];
                  return (
                    <TouchableOpacity
                      key={g}
                      onPress={() => setGroup(g)}
                      activeOpacity={0.85}
                      style={[
                        styles.chip,
                        active && {
                          borderColor: color,
                          backgroundColor: `${color}22`,
                        },
                      ]}
                      testID={`custom-exercise-muscle-${g.toLowerCase()}`}
                    >
                      <View
                        style={[styles.chipDot, { backgroundColor: color }]}
                      />
                      <Text
                        style={[
                          styles.chipText,
                          active && {
                            color: colors.textPrimary,
                            fontWeight: "700",
                          },
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnSecondary]}
                  onPress={onClose}
                  disabled={busy}
                  activeOpacity={0.8}
                  testID="custom-exercise-cancel-button"
                >
                  <Text style={styles.btnSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.btnPrimary,
                    (!valid || busy) && styles.btnDisabled,
                  ]}
                  onPress={handleAdd}
                  disabled={!valid || busy}
                  activeOpacity={0.85}
                  testID="custom-exercise-add-button"
                >
                  <Text style={styles.btnPrimaryText}>Add exercise</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
    maxHeight: "92%",
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
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
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "500",
    minHeight: 52,
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
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  chipDot: { width: 10, height: 10, borderRadius: 5 },
  chipText: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    flex: 1,
  },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
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
