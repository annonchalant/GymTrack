// Login / Register screen — premium dark-mode design matching the app's theme.
// Handles both sign-in and sign-up with smooth toggle animation.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/context/auth-context";
import { colors, radius, spacing, typography } from "@/src/theme/colors";
import { API_URL } from "@/src/utils/storage/storage-base";
import { storage } from "@/src/utils/storage";

type Mode = "login" | "register";

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const { login } = useAuth();
  const router = useRouter();

  function switchMode(next: Mode) {
    setError(null);
    setSuccessMsg(null);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setTimeout(() => setMode(next), 150);
  }

  const canSubmit =
    username.trim().length >= 3 && password.trim().length >= 6 && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const trimmedUsername = username.trim().toLowerCase();

    try {
      if (mode === "register") {
        // ── Register ──────────────────────────────────────────────────────────
        const res = await fetch(`${API_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: trimmedUsername,
            password: password.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.detail ?? "Registration failed. Please try again.");
          return;
        }
        // Auto-login after registration
        setSuccessMsg("Account created! Signing you in…");
        await handleLogin(trimmedUsername, password.trim());
      } else {
        // ── Login ─────────────────────────────────────────────────────────────
        await handleLogin(trimmedUsername, password.trim());
      }
    } catch (e) {
      setError("Could not reach the server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(user: string, pass: string) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pass }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.detail ?? "Login failed. Check your credentials.");
      return;
    }
    // Persist token → updates auth state → root layout re-renders
    await login(data.access_token, data.username);
    // Sync user data from backend after login
    await storage.syncWithBackend().catch(() => {});
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Logo / Brand ─────────────────────────────────────────────── */}
          <View style={styles.brand}>
            <View style={styles.logoCircle}>
              <Ionicons name="barbell" size={36} color={colors.accent} />
            </View>
            <Text style={styles.appName}>GymTrack</Text>
            <Text style={styles.tagline}>Your progress, securely yours</Text>
          </View>

          {/* ── Card ─────────────────────────────────────────────────────── */}
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <Text style={styles.cardTitle}>
              {mode === "login" ? "Welcome back" : "Create account"}
            </Text>
            <Text style={styles.cardSubtitle}>
              {mode === "login"
                ? "Sign in to access your workout data"
                : "Join GymTrack and start your journey"}
            </Text>

            {/* Username */}
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrap}>
              <Ionicons
                name="person-outline"
                size={18}
                color={colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                value={username}
                onChangeText={(v) => {
                  setUsername(v);
                  setError(null);
                }}
                placeholder="e.g. john_doe"
                placeholderTextColor={colors.textMuted}
                style={styles.textInput}
                autoCapitalize="none"
                autoCorrect={false}
                testID="auth-username-input"
              />
            </View>

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setError(null);
                }}
                placeholder="Min. 6 characters"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                style={[styles.textInput, styles.textInputPadRight]}
                autoCapitalize="none"
                autoCorrect={false}
                testID="auth-password-input"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((p) => !p)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Error / Success */}
            {error && (
              <View style={styles.errorBanner} testID="auth-error-banner">
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color={colors.danger}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            {successMsg && (
              <View style={styles.successBanner}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color={colors.success}
                />
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                !canSubmit && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit}
              activeOpacity={0.85}
              testID="auth-submit-button"
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {mode === "login" ? "Sign In" : "Create Account"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Mode toggle */}
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>
                {mode === "login"
                  ? "Don't have an account? "
                  : "Already have an account? "}
              </Text>
              <TouchableOpacity
                onPress={() => switchMode(mode === "login" ? "register" : "login")}
                testID="auth-mode-toggle"
              >
                <Text style={styles.toggleLink}>
                  {mode === "login" ? "Sign Up" : "Sign In"}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* ── Footer hint ──────────────────────────────────────────────── */}
          <Text style={styles.footer}>
            Your data is encrypted and tied to your account.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },

  // Brand / logo
  brand: { alignItems: "center", marginBottom: spacing.xl },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: `${colors.accent}40`,
    marginBottom: spacing.md,
  },
  appName: {
    ...typography.display,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  tagline: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },

  // Form
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  inputIcon: { marginRight: spacing.sm },
  textInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "500",
    paddingVertical: 14,
  },
  textInputPadRight: { paddingRight: 36 },
  eyeBtn: { position: "absolute", right: spacing.md },

  // Feedback
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: `${colors.danger}18`,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.danger}40`,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    flex: 1,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: `${colors.success}18`,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.success}40`,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  successText: {
    ...typography.caption,
    color: colors.success,
    flex: 1,
  },

  // Submit
  submitBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: {
    ...typography.bodyLarge,
    color: "#fff",
    fontWeight: "700",
  },

  // Toggle
  toggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  toggleLabel: { ...typography.body, color: colors.textSecondary },
  toggleLink: {
    ...typography.body,
    color: colors.accent,
    fontWeight: "700",
  },

  // Footer
  footer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
