// Weight + Reps input pair with a prominent Save Set button.
// Stateful — parent supplies the current exercise and a save handler.

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { colors, radius, spacing, typography } from "@/src/theme/colors";

type Props = {
  exercise: string;
  onSave: (input: { weight: number; reps: number }) => Promise<void> | void;
};

export default function SetForm({ exercise, onSave }: Props) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [saving, setSaving] = useState(false);

  // Allow "0" but not blank / non-numeric.
  const weightNum = parseFloat(weight);
  const repsNum = parseInt(reps, 10);
  const valid =
    Number.isFinite(weightNum) &&
    weightNum >= 0 &&
    Number.isFinite(repsNum) &&
    repsNum > 0;

  const handleSave = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await onSave({ weight: weightNum, reps: repsNum });
      setReps("");
      // Keep `weight` so the user doesn't retype it for follow-on sets.
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      testID="set-form"
    >
      <View style={styles.inputsRow}>
        <View style={styles.inputBox}>
          <Text style={styles.label}>WEIGHT</Text>
          <TextInput
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            maxLength={6}
            testID="set-weight-input"
            returnKeyType="next"
          />
        </View>
        <View style={styles.inputBox}>
          <Text style={styles.label}>REPS</Text>
          <TextInput
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            maxLength={3}
            testID="set-reps-input"
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, (!valid || saving) && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={!valid || saving}
        activeOpacity={0.85}
        testID="save-set-button"
      >
        <Ionicons name="add-circle" size={22} color="#fff" />
        <Text style={styles.saveText}>
          {saving ? "Saving..." : `Save ${exercise} Set`}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  inputsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  inputBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: 4,
  },
  input: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.textPrimary,
    paddingVertical: 4,
    minHeight: 52,
    letterSpacing: -0.5,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveText: {
    ...typography.heading,
    color: "#fff",
    fontSize: 18,
  },
});
