// Dark-mode design tokens — ported 1:1 from the mobile app
// (frontend/src/theme/colors.ts). CSS variables in theme.css mirror these;
// this module exists for logic that needs color values at runtime (charts,
// muscle-group dots, calendar marking).

export const colors = {
  // Backgrounds — deep charcoal, no pure black so cards/borders are visible.
  background: "#0B0B0F",
  surface: "#16161D",
  surfaceElevated: "#1E1E27",
  border: "#2A2A36",

  // Text — crisp white with two muted tiers.
  textPrimary: "#FFFFFF",
  textSecondary: "#B5B5C3",
  textMuted: "#6E6E80",

  // Accent — electric blue.
  accent: "#3B82F6",
  accentPressed: "#2563EB",
  accentSoft: "rgba(59, 130, 246, 0.15)",

  // Status.
  success: "#22C55E",
  danger: "#EF4444",
};
