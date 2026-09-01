// Login / Register screen — premium dark-mode design matching the app's theme.
// Handles both sign-in and sign-up with a smooth toggle animation.

import { useState, type FormEvent } from "react";
import {
  IoAlertCircleOutline,
  IoBarbell,
  IoCheckmarkCircleOutline,
  IoEyeOffOutline,
  IoEyeOutline,
  IoLockClosedOutline,
  IoPersonOutline,
} from "react-icons/io5";
import { useNavigate } from "react-router-dom";

import * as authApi from "@/api/auth-api";
import { ApiRequestError } from "@/api/http";
import { useAuth } from "@/context/auth-context";
import { storage } from "@/utils/storage";

import "./login.css";

type Mode = "login" | "register";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [switching, setSwitching] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  function switchMode(next: Mode) {
    setError(null);
    setSuccessMsg(null);
    setSwitching(true);
    setTimeout(() => {
      setMode(next);
      setSwitching(false);
    }, 150);
  }

  const canSubmit =
    username.trim().length >= 3 && password.trim().length >= 6 && !loading;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const trimmedUsername = username.trim().toLowerCase();

    try {
      if (mode === "register") {
        await authApi.register(trimmedUsername, password.trim());
        // Auto-login after registration
        setSuccessMsg("Account created! Signing you in…");
      }
      await handleLogin(trimmedUsername, password.trim());
    } catch (e) {
      setError(
        e instanceof ApiRequestError
          ? e.detail
          : "Could not reach the server. Please check your connection.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(user: string, pass: string) {
    const data = await authApi.login(user, pass);
    // Persist token → updates auth state → router redirects
    await login(data.access_token, data.username);
    // Sync user data from backend after login
    await storage.syncWithBackend().catch(() => {});
    navigate("/", { replace: true });
  }

  return (
    <div className="login-screen">
      {/* ── Logo / Brand ─────────────────────────────────────────────── */}
      <div className="login-brand">
        <div className="login-logo-circle">
          <IoBarbell />
        </div>
        <div className="login-app-name">GymTrack</div>
        <div className="login-tagline">Your progress, securely yours</div>
      </div>

      {/* ── Card ─────────────────────────────────────────────────────── */}
      <form
        className={`login-card${switching ? " switching" : ""}`}
        onSubmit={handleSubmit}
      >
        <div className="login-card-title">
          {mode === "login" ? "Welcome back" : "Create account"}
        </div>
        <div className="login-card-subtitle">
          {mode === "login"
            ? "Sign in to access your workout data"
            : "Join GymTrack and start your journey"}
        </div>

        {/* Username */}
        <label className="login-label">Username</label>
        <div className="login-input-wrap">
          <IoPersonOutline className="login-input-icon" />
          <input
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError(null);
            }}
            placeholder="e.g. john_doe"
            className="login-input"
            autoCapitalize="none"
            autoCorrect="off"
            data-testid="auth-username-input"
          />
        </div>

        {/* Password */}
        <label className="login-label">Password</label>
        <div className="login-input-wrap">
          <IoLockClosedOutline className="login-input-icon" />
          <input
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            placeholder="Min. 6 characters"
            type={showPassword ? "text" : "password"}
            className="login-input pad-right"
            autoCapitalize="none"
            autoCorrect="off"
            data-testid="auth-password-input"
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="login-eye-btn"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
          </button>
        </div>

        {/* Error / Success */}
        {error && (
          <div className="login-banner error" data-testid="auth-error-banner">
            <IoAlertCircleOutline />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="login-banner success">
            <IoCheckmarkCircleOutline />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="login-submit"
          disabled={!canSubmit}
          data-testid="auth-submit-button"
        >
          {loading ? (
            <span className="spinner" />
          ) : mode === "login" ? (
            "Sign In"
          ) : (
            "Create Account"
          )}
        </button>

        {/* Mode toggle */}
        <div className="login-toggle-row">
          <span>
            {mode === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="login-toggle-link"
            onClick={() => switchMode(mode === "login" ? "register" : "login")}
            data-testid="auth-mode-toggle"
          >
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </div>
      </form>

      {/* ── Footer hint ──────────────────────────────────────────────── */}
      <div className="login-footer">
        Your data is encrypted and tied to your account.
      </div>
    </div>
  );
}
