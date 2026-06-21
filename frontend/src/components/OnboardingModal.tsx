// Onboarding modal — first-launch flow.
// Step 1: Profile (Name, DOB, Email/Contact) — captured for personalisation.
// Step 2: Ask cycle-tracking question (Yes / No).
// Step 3 (if Yes): Pick last period start date + cycle length.

import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
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

import {
  CyclePrefs,
  DEFAULT_CYCLE_LENGTH,
  markOnboardingComplete,
  saveCyclePrefs,
} from "@/src/utils/cycle-storage";
import { saveProfile, type Profile } from "@/src/utils/profile-storage";
import { colors, radius, spacing, typography } from "@/src/theme/colors";

type Props = {
  visible: boolean;
  onClose: () => void;
};

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type Step = "profile" | "ask" | "details";

export default function OnboardingModal({ visible, onClose }: Props) {
  const [step, setStep] = useState<Step>("profile");

  // Profile state
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  // Default DOB: 25 years ago — feels neutral.
  const [dob, setDob] = useState<Date>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 25);
    return d;
  });
  const [showDobPicker, setShowDobPicker] = useState(false);

  // Cycle state
  const [periodStart, setPeriodStart] = useState<Date>(new Date());
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [cycleLengthInput, setCycleLengthInput] = useState<string>(
    String(DEFAULT_CYCLE_LENGTH),
  );

  const [saving, setSaving] = useState(false);

  const profileValid = name.trim().length > 0 && contact.trim().length > 0;

  const handleProfileNext = async () => {
    if (!profileValid || saving) return;
    setSaving(true);
    const profile: Profile = {
      name: name.trim(),
      dob: toISODate(dob),
      contact: contact.trim(),
    };
    await saveProfile(profile);
    setSaving(false);
    setStep("ask");
  };

  const handleDobChange = (_e: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowDobPicker(false);
    if (selected) setDob(selected);
  };

  const handleNo = async () => {
    setSaving(true);
    const prefs: CyclePrefs = {
      trackingEnabled: false,
      lastPeriodStart: null,
      cycleLength: DEFAULT_CYCLE_LENGTH,
    };
    await saveCyclePrefs(prefs);
    await markOnboardingComplete();
    setSaving(false);
    onClose();
  };

  const handleYes = () => setStep("details");

  const handlePeriodChange = (_e: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowPeriodPicker(false);
    if (selected) setPeriodStart(selected);
  };

  const handleSaveDetails = async () => {
    const parsed = parseInt(cycleLengthInput, 10);
    const cycleLength =
      Number.isFinite(parsed) && parsed >= 20 && parsed <= 45
        ? parsed
        : DEFAULT_CYCLE_LENGTH;

    setSaving(true);
    const prefs: CyclePrefs = {
      trackingEnabled: true,
      lastPeriodStart: toISODate(periodStart),
      cycleLength,
    };
    await saveCyclePrefs(prefs);
    await markOnboardingComplete();
    setSaving(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      testID="onboarding-modal"
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.sheetWrap} onPress={() => {}}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              style={styles.sheet}
              contentContainerStyle={styles.sheetContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              testID="onboarding-sheet"
            >
              {step === "profile" && (
                <>
                  <Text style={styles.eyebrow}>WELCOME</Text>
                  <Text style={styles.title}>A bit about you</Text>
                  <Text style={styles.body}>
                    We&apos;ll use these to personalise the app. Everything
                    stays on this device.
                  </Text>

                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Your full name"
                    placeholderTextColor={colors.textMuted}
                    style={styles.textInput}
                    maxLength={60}
                    testID="onboarding-name-input"
                    autoCapitalize="words"
                  />

                  <Text style={styles.label}>Date of birth</Text>
                  <Pressable
                    onPress={() => setShowDobPicker(true)}
                    style={styles.fieldButton}
                    testID="onboarding-dob-trigger"
                  >
                    <Text style={styles.fieldButtonText}>
                      {formatDate(dob)}
                    </Text>
                  </Pressable>
                  {showDobPicker && (
                    <View style={styles.pickerWrap}>
                      <DateTimePicker
                        value={dob}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        maximumDate={new Date()}
                        onChange={handleDobChange}
                        themeVariant="dark"
                        textColor={colors.textPrimary}
                        testID="onboarding-dob-picker"
                      />
                      {Platform.OS === "ios" && (
                        <TouchableOpacity
                          style={styles.pickerDoneBtn}
                          onPress={() => setShowDobPicker(false)}
                        >
                          <Text style={styles.pickerDoneText}>Done</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  <Text style={styles.label}>Email or contact number</Text>
                  <TextInput
                    value={contact}
                    onChangeText={setContact}
                    placeholder="you@example.com or +1 555 0123"
                    placeholderTextColor={colors.textMuted}
                    style={styles.textInput}
                    maxLength={80}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    testID="onboarding-contact-input"
                  />

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.buttonPrimary,
                        (!profileValid || saving) && styles.buttonDisabled,
                      ]}
                      onPress={handleProfileNext}
                      disabled={!profileValid || saving}
                      activeOpacity={0.85}
                      testID="onboarding-profile-next-button"
                    >
                      <Text style={styles.buttonPrimaryText}>Continue</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {step === "ask" && (
                <>
                  <Text style={styles.eyebrow}>STEP 2 OF 2</Text>
                  <Text style={styles.title}>Train with your body</Text>
                  <Text style={styles.body}>
                    Would you like to track your menstrual cycle to adapt your
                    training load to your energy levels?
                  </Text>

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[styles.button, styles.buttonSecondary]}
                      onPress={handleNo}
                      disabled={saving}
                      testID="onboarding-no-button"
                      activeOpacity={0.8}
                    >
                      <Text style={styles.buttonSecondaryText}>No, thanks</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.buttonPrimary]}
                      onPress={handleYes}
                      disabled={saving}
                      testID="onboarding-yes-button"
                      activeOpacity={0.85}
                    >
                      <Text style={styles.buttonPrimaryText}>Yes, track it</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {step === "details" && (
                <>
                  <Text style={styles.eyebrow}>CYCLE DETAILS</Text>
                  <Text style={styles.title}>Set your baseline</Text>
                  <Text style={styles.body}>
                    We&apos;ll use this to tailor your training load.
                  </Text>

                  <Text style={styles.label}>Start date of last period</Text>
                  <Pressable
                    onPress={() => setShowPeriodPicker(true)}
                    style={styles.fieldButton}
                    testID="onboarding-date-trigger"
                  >
                    <Text style={styles.fieldButtonText}>
                      {formatDate(periodStart)}
                    </Text>
                  </Pressable>
                  {showPeriodPicker && (
                    <View style={styles.pickerWrap}>
                      <DateTimePicker
                        value={periodStart}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        maximumDate={new Date()}
                        onChange={handlePeriodChange}
                        themeVariant="dark"
                        textColor={colors.textPrimary}
                        testID="onboarding-date-picker"
                      />
                      {Platform.OS === "ios" && (
                        <TouchableOpacity
                          style={styles.pickerDoneBtn}
                          onPress={() => setShowPeriodPicker(false)}
                        >
                          <Text style={styles.pickerDoneText}>Done</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  <Text style={styles.label}>Average cycle length (days)</Text>
                  <TextInput
                    value={cycleLengthInput}
                    onChangeText={setCycleLengthInput}
                    keyboardType="number-pad"
                    style={styles.textInput}
                    placeholder="28"
                    placeholderTextColor={colors.textMuted}
                    maxLength={2}
                    testID="onboarding-cycle-length-input"
                  />

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[styles.button, styles.buttonSecondary]}
                      onPress={() => setStep("ask")}
                      disabled={saving}
                      testID="onboarding-back-button"
                      activeOpacity={0.8}
                    >
                      <Text style={styles.buttonSecondaryText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.buttonPrimary]}
                      onPress={handleSaveDetails}
                      disabled={saving}
                      testID="onboarding-save-button"
                      activeOpacity={0.85}
                    >
                      <Text style={styles.buttonPrimaryText}>
                        Save & continue
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  sheetWrap: {
    maxHeight: "90%",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetContent: {
    padding: spacing.lg,
  },
  eyebrow: {
    ...typography.label,
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  fieldButton: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 52,
    justifyContent: "center",
  },
  fieldButtonText: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
  },
  pickerWrap: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  pickerDoneBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pickerDoneText: {
    ...typography.body,
    color: colors.accent,
    fontWeight: "700",
  },
  textInput: {
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
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    minHeight: 56,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  buttonPrimary: { backgroundColor: colors.accent },
  buttonPrimaryText: {
    ...typography.bodyLarge,
    color: "#fff",
    fontWeight: "700",
  },
  buttonDisabled: { opacity: 0.45 },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonSecondaryText: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: "600",
  },
});
