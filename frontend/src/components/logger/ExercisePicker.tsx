// Exercise picker: trigger button that opens a modal listing built-in and
// user-defined exercises, with delete icons next to custom rows and an
// "Add custom" affordance.

import { Ionicons } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { colors, radius, spacing, typography } from "@/src/theme/colors";
import { useState } from "react";

export type ExerciseOption = {
  name: string;
  // Present only for user-added (custom) exercises. Drives the delete icon.
  customId?: string;
};

type Props = {
  value: string;
  onChange: (next: string) => void;
  // Built-ins first, then custom entries (with customId set).
  exercises: ExerciseOption[];
  // Optional handler to surface the "Add custom" row. When undefined the row
  // is hidden.
  onAddCustom?: () => void;
  // Optional handler to delete a custom exercise. When undefined the trash
  // icon next to custom rows is hidden.
  onDeleteCustom?: (customId: string) => Promise<void> | void;
};

export default function ExercisePicker({
  value,
  onChange,
  exercises,
  onAddCustom,
  onDeleteCustom,
}: Props) {
  const [open, setOpen] = useState(false);

  const handleDelete = async (e: ExerciseOption) => {
    if (!onDeleteCustom || !e.customId) return;
    await onDeleteCustom(e.customId);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        testID="exercise-picker-trigger"
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>EXERCISE</Text>
          <Text style={styles.value} testID="exercise-picker-value">
            {value}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={22} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
        testID="exercise-picker-modal"
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={styles.sheet}
            onPress={(e) => e.stopPropagation()}
            testID="exercise-picker-sheet"
          >
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Choose exercise</Text>
            <ScrollView
              style={styles.list}
              showsVerticalScrollIndicator={false}
            >
              {exercises.map((ex) => {
                const selected = ex.name === value;
                const isCustom = !!ex.customId;
                return (
                  <View
                    key={ex.customId ?? ex.name}
                    style={[
                      styles.optionRow,
                      selected && styles.optionRowSelected,
                    ]}
                    testID={`exercise-option-${ex.name
                      .replace(/\s+/g, "-")
                      .toLowerCase()}`}
                  >
                    <TouchableOpacity
                      style={styles.optionMain}
                      onPress={() => {
                        onChange(ex.name);
                        setOpen(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          selected && styles.optionTextSelected,
                        ]}
                      >
                        {ex.name}
                      </Text>
                      {isCustom && (
                        <View style={styles.customBadge}>
                          <Text style={styles.customBadgeText}>CUSTOM</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {selected && !isCustom && (
                      <Ionicons
                        name="checkmark"
                        size={22}
                        color={colors.accent}
                        style={styles.checkIcon}
                      />
                    )}

                    {isCustom && onDeleteCustom && (
                      <TouchableOpacity
                        onPress={() => handleDelete(ex)}
                        style={styles.deleteBtn}
                        activeOpacity={0.6}
                        accessibilityLabel={`Delete ${ex.name}`}
                        testID={`exercise-delete-${ex.customId}`}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color={colors.danger}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}

              {onAddCustom && (
                <TouchableOpacity
                  style={styles.addRow}
                  onPress={() => {
                    setOpen(false);
                    onAddCustom();
                  }}
                  activeOpacity={0.8}
                  testID="exercise-add-custom-button"
                >
                  <View style={styles.addIconWrap}>
                    <Ionicons name="add" size={20} color={colors.accent} />
                  </View>
                  <Text style={styles.addText}>Add custom exercise</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 64,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: 2,
  },
  value: {
    ...typography.heading,
    color: colors.textPrimary,
  },
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
    maxHeight: "80%",
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  sheetTitle: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  list: {
    maxHeight: 480,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    minHeight: 56,
    marginBottom: 2,
  },
  optionRowSelected: {
    backgroundColor: colors.accentSoft,
  },
  optionMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
    minHeight: 56,
  },
  optionText: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: colors.accent,
    fontWeight: "700",
  },
  checkIcon: {
    paddingHorizontal: spacing.md,
  },
  customBadge: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  deleteBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.accent,
    marginTop: spacing.sm,
  },
  addIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: {
    ...typography.bodyLarge,
    color: colors.accent,
    fontWeight: "700",
  },
});
