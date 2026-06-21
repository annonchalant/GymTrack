// Dark-mode design tokens for the fitness app.
// Keep this file tiny — every screen imports from here so colors stay consistent.

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

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const typography = {
  display: { fontSize: 32, fontWeight: "800" as const, letterSpacing: -0.5 },
  title: { fontSize: 24, fontWeight: "700" as const, letterSpacing: -0.3 },
  heading: { fontSize: 20, fontWeight: "700" as const },
  body: { fontSize: 17, fontWeight: "500" as const },
  bodyLarge: { fontSize: 18, fontWeight: "500" as const },
  label: { fontSize: 14, fontWeight: "600" as const, letterSpacing: 0.3 },
  caption: { fontSize: 13, fontWeight: "500" as const },
};
