# Fitness App — PRD

A lightweight, offline-first mobile fitness app built phase-by-phase.

## Phase 1 (Complete) — App Skeleton & Onboarding

- Bottom tabs (Logger / Progress / Calendar) via Expo Router.
- Dark theme + electric blue accent (`src/theme/colors.ts`).
- First-launch onboarding modal asking about cycle tracking; persists `CyclePrefs` (trackingEnabled, lastPeriodStart, cycleLength) to AsyncStorage via `src/utils/cycle-storage.ts`.

## Phase 2 (Complete) — Logger Tab

**Goal:** Fully functional offline workout logger driven by AsyncStorage.

### Scope delivered
- **DateBar** (`src/components/logger/DateBar.tsx`) — prev / current / next chevrons plus a "Today" jump button. Defaults to today; the chosen date drives every other section.
- **AdaptiveBanner** (`src/components/logger/AdaptiveBanner.tsx`) — reads `CyclePrefs` and shows:
  - Days 1–5 → "**Recovery Phase:** We suggest lighter weights today. Recovery is progress."
  - Days 6+ → "**Peak Energy Phase:** Great day to push for personal records!"
  - Hidden entirely when cycle tracking is disabled.
  - Cycle-day math lives in `src/utils/cycle.ts::getCycleStatus`.
- **ExercisePicker** (`src/components/logger/ExercisePicker.tsx`) — bottom-sheet modal listing the hardcoded library: Squat, Bench Press, Deadlift, Overhead Press, Barbell Row.
- **SetForm** (`src/components/logger/SetForm.tsx`) — large numeric Weight + Reps inputs and a prominent "Save \<Exercise\> Set" button. Disabled until valid (weight ≥ 0, reps > 0). On save, clears reps but keeps weight for follow-on sets.
- **Save logic** (`src/utils/workout-storage.ts`) — single AsyncStorage key `fit.workouts.v1` holding `Record<DateKey, WorkoutSet[]>`. Exposes `getSetsForDate`, `addSet`, `deleteSet`.
- **RestTimer** (`src/components/logger/RestTimer.tsx`) — 90-second visible countdown with progress bar, auto-triggered after each save. Skip button dismisses it; "Rest Complete" copy when it hits zero.
- **SetList** (`src/components/logger/SetList.tsx`) — scrollable list of sets for the selected date with set number, exercise, weight × reps, time, and a trash delete button. Empty-state hint when none exist. Header label adapts ("Today's sets" vs "Sets · \<weekday, date\>").

### Verified by testing agent (all flows pass)
Onboarding persistence, date navigation, banner copy for both phases, exercise selection, input validation, save + timer countdown, history persistence per date, and delete.

## Phase 3 (Complete) — Analytics & Progress

**Goal:** Visualise the data persisted by Phase 2 on the Progress tab.

### Scope delivered
- **Dependencies:** `react-native-chart-kit@6.12.3` + `react-native-svg@15.12.1` (Expo SDK 54 compatible).
- **Aggregation helpers** in `src/utils/workout-storage.ts`:
  - `getAllSets()` — flat sorted list.
  - `hasAnySets()` — empty-state gate.
  - `getMaxWeightSeries(exercise)` — `[{ dateKey, maxWeight }]` series for the strength chart (one point per date, heaviest weight that day).
  - `getSetCountsByExercise()` — counts for the pie chart aggregator.
- **Muscle mapping** (`src/utils/muscle-groups.ts`): Squat→Legs, Bench Press→Chest, Deadlift→Back, Overhead Press→Shoulders, Barbell Row→Back. Bundled neon-on-dark colours per group (electric blue / neon cyan / violet / hot pink).
- **Progress screen** (`app/(tabs)/progress.tsx`):
  - Strength card with reused `ExercisePicker` and a `LineChart` of max weight by session (capped to last 10 points for readability, with a `Best` and `Sessions` meta row).
  - Muscle card with a `PieChart` and a custom legend showing `<group> <pct>% · <count>`.
  - Per-card mini empty states when the selected exercise / muscle has no data.
  - `useFocusEffect` reload so sets logged on the Logger tab show up instantly when switching tabs.
- **Global empty state:** if `fit.workouts.v1` is empty, both charts are skipped and a centered card renders the exact copy: *"Log your first workout to see your progress charts!"*

### Verified by testing agent (7/7 flows pass)
Empty state, single-set rendering, per-exercise empty state, multi-date max aggregation, muscle pie with correct legend, and refresh-on-focus.

## Phase 4 (Complete — App finished) — Calendar & Streaks

**Goal:** Wrap the app with a Calendar tab that surfaces history at a glance, a consistency-streak metric, and lightweight pre-planning.

### Scope delivered
- **Dependencies:** `react-native-calendars@1.1314.0` (Expo SDK 54 compatible).
- **Pure streak helper** (`src/utils/streak.ts::computeStreak`) — counts consecutive days ending today (or yesterday if today is still empty), driven by the dateKeys exposed by `getAllSets()`.
- **`getAllSets` enriched** to return `WorkoutSetEntry` (`WorkoutSet & { dateKey }`) so streak/calendar/aggregation code can stay self-describing.
- **New AsyncStorage utility** (`src/utils/planned-storage.ts`, key `fit.planned.v1`): `getAllPlans`, `getPlanForDate`, `savePlan`, `deletePlan`. One plan per date.
- **StreakCard** (`src/components/calendar/StreakCard.tsx`) — hero metric card with flame icon, oversized streak numeral, accent-glow border when active, contextual subtitle for 0 / 1 / 2+ day states.
- **Calendar grid** (`app/(tabs)/calendar.tsx`) — react-native-calendars themed to the dark palette (charcoal surface, white text, electric-blue arrows + today indicator):
  - Past/today logged days → solid **#3B82F6** electric-blue dot (`COMPLETED_DOT`).
  - Future planned days → muted **#A78BFA** violet dot (`PLANNED_DOT`) — visually distinct from completed.
  - Today gets a subtle accent-tinted pill highlight.
- **Plan modal** (`src/components/calendar/PlanModal.tsx`) — bottom-sheet only fires when tapping a strictly-future date. Renders the four muscle-group chips from `MUSCLE_GROUPS` (Legs / Chest / Back / Shoulders) with per-group colour swatch, supports both create + update + remove plans.
- **Upcoming card** lists the next 5 planned workouts with weekday/date and muscle group, colour-coded to match the calendar dot.
- **`useFocusEffect`** reload — switching from Logger → Calendar after logging a set immediately reflects the new streak and dot without an app reload.
- **Zero TypeScript errors** (`tsc --noEmit` clean) and lint clean.

### Verified by testing agent (12/12 assertions pass)
Empty state, single-day streak roll-up, future-only modal gating, plan save / update / delete, persistence across navigation, and live focus-refresh.

## Phase 5 (Complete) — Personalisation: Profile + Custom Exercises + Weekly Split

**Goal:** Make the app feel like the user's, not a generic template.

### Scope delivered
- **Profile capture** (`src/utils/profile-storage.ts`, key `fit.profile.v1`) — name, date of birth, email/contact collected as the first step of onboarding. Logger greets the user by first name ("HI, ALEX").
- **Custom exercises** (`src/utils/custom-exercises-storage.ts`, key `fit.custom_exercises.v1`):
  - "+ Add custom exercise" row in the exercise picker (Logger) opens a small modal collecting name + muscle group.
  - Custom exercises appear alongside the 5 built-ins everywhere a picker is used (Logger + Progress).
  - `Exercise` type relaxed to `string`; `aggregateByMuscle` now takes a runtime lookup via `buildExerciseMuscleLookup(customs)` so the Progress pie chart aggregates custom exercises into their chosen muscle group correctly.
- **Weekly split with reset** (`src/utils/weekly-split-storage.ts`, key `fit.weekly_split.v1`):
  - 7-day repeating plan (Mon-Sun) of free-text labels (e.g. "Chest + Triceps").
  - Editable via a sheet-style modal reachable from the new "Today's Plan" banner on Logger. "Reset" button clears all 7 days at once.
  - The Logger banner surfaces today's planned label automatically (e.g. "Friday, Jun 19 · Chest + Triceps"), or a "Tap to set your weekly split" CTA when empty.
- **Onboarding rewritten** as a 3-step scrollable flow: Profile → Cycle question → (optional) Cycle details. Keyboard-aware.

### Zero regressions
- `tsc --noEmit` clean, lint clean across `src/**` and `app/**`.
- All previous testIDs retained; new testIDs added for `onboarding-name-input`, `onboarding-contact-input`, `today-plan-banner`, `weekly-split-modal`, `weekly-split-reset-button`, `custom-exercise-modal`, `exercise-add-custom-button` etc.

## Summary

Four AsyncStorage keys → eight, all offline:
`fit.profile.v1`, `fit.onboarding.complete.v1`, `fit.cycle.prefs.v1`, `fit.workouts.v1`, `fit.planned.v1`, `fit.custom_exercises.v1`, `fit.weekly_split.v1`. No backend, no third-party APIs.
