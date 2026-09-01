// Calendar — (presentational; data/behavior in useCalendar)
// - StreakCard
// - Month grid marking past completed days (electric blue) and future
//   planned days (violet for explicit overrides, dimmer indigo for
//   weekly-split baseline plans).
// - Tapping a future day opens PlanModal to set/update an OVERRIDE for that
//   date; the baseline weekly split is shown as context.
// - Upcoming list renders effective plans (override > baseline).

import { useState } from "react";
import { IoChevronForward, IoInformationCircle } from "react-icons/io5";

import MonthCalendar, {
  type MarkedMap,
} from "@/components/calendar/MonthCalendar";
import PlanModal from "@/components/calendar/PlanModal";
import StreakCard from "@/components/calendar/StreakCard";
import { useCalendar } from "@/hooks/use-calendar";
import { colors } from "@/theme/colors";
import { addDays, fromDateKey, toDateKey } from "@/utils/cycle";
import { MUSCLE_COLORS, type MuscleGroup } from "@/utils/muscle-groups";
import { getEffectivePlan, type EffectivePlan, type PlannedWorkout } from "@/utils/planned-storage";
import { dayKeyForDate, type WeeklySplit } from "@/utils/weekly-split-storage";

import "./calendar.css";

const COMPLETED_DOT = colors.accent; // electric blue
const OVERRIDE_DOT = "#A78BFA"; // violet — explicit per-date override
const BASELINE_DOT = "#6366F1"; // indigo — derived from weekly split
const FUTURE_WINDOW_DAYS = 120; // mark plans up to ~4 months ahead

function buildMarkedDates(
  loggedKeys: Set<string>,
  plans: PlannedWorkout[],
  weeklySplit: WeeklySplit,
  todayKey: string,
): MarkedMap {
  const marked: MarkedMap = {};

  // Past + today completed sessions — solid bright blue dot.
  for (const dateKey of loggedKeys) {
    marked[dateKey] = { marked: true, dotColor: COMPLETED_DOT };
  }

  // Future window — overlay overrides (preferred) or baseline plans.
  const today = fromDateKey(todayKey);
  for (let i = 1; i <= FUTURE_WINDOW_DAYS; i++) {
    const d = addDays(today, i);
    const dk = toDateKey(d);
    if (marked[dk]) continue; // never overwrite a completed dot

    const override = plans.find((p) => p.dateKey === dk);
    if (override) {
      marked[dk] = { marked: true, dotColor: OVERRIDE_DOT };
      continue;
    }
    const baseline = weeklySplit[dayKeyForDate(d)]?.trim() ?? "";
    if (baseline.length > 0) {
      marked[dk] = { marked: true, dotColor: BASELINE_DOT };
    }
  }

  // Highlight today with a subtle pill.
  marked[todayKey] = {
    ...marked[todayKey],
    selected: true,
    selectedColor: "rgba(59, 130, 246, 0.18)",
  };

  return marked;
}

export default function CalendarPage() {
  const {
    streak,
    loggedKeys,
    plans,
    split,
    todayKey,
    saveDatePlan,
    deleteDatePlan,
  } = useCalendar();

  // Modal state is pure UI state — it stays in the component.
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDateKey, setModalDateKey] = useState<string | null>(null);
  const [modalExisting, setModalExisting] = useState<MuscleGroup | null>(null);
  const [modalBaseline, setModalBaseline] = useState<string | undefined>(
    undefined,
  );

  const handleDayPress = (dateString: string) => {
    // Only future dates can be planned. Today + past are no-ops.
    if (dateString <= todayKey) return;
    const existing = plans.find((p) => p.dateKey === dateString) ?? null;
    const baseline =
      split[dayKeyForDate(fromDateKey(dateString))]?.trim() ?? "";
    setModalDateKey(dateString);
    setModalExisting(existing?.muscleGroup ?? null);
    setModalBaseline(baseline.length > 0 ? baseline : undefined);
    setModalOpen(true);
  };

  const markedDates = buildMarkedDates(loggedKeys, plans, split, todayKey);

  // Build the upcoming list using effective plans. Walk the future window in
  // order so the user sees dates chronologically.
  const upcoming: EffectivePlan[] = [];
  const todayDate = fromDateKey(todayKey);
  for (let i = 1; i <= FUTURE_WINDOW_DAYS && upcoming.length < 5; i++) {
    const dk = toDateKey(addDays(todayDate, i));
    const eff = getEffectivePlan(dk, plans, split);
    if (eff) upcoming.push(eff);
  }

  return (
    <div className="screen" data-testid="calendar-screen">
      <div className="eyebrow">HISTORY</div>
      <h1 className="display-title" style={{ marginBottom: 24 }}>
        Calendar
      </h1>

      <div className="logger-block">
        <StreakCard streak={streak} />
      </div>

      <div className="logger-block cal-wrap" data-testid="calendar-grid-wrap">
        <MonthCalendar markedDates={markedDates} onDayPress={handleDayPress} />
      </div>

      <div className="logger-block cal-legend" data-testid="calendar-legend">
        <div className="legend-item">
          <span
            className="legend-dot"
            style={{ backgroundColor: COMPLETED_DOT }}
          />
          Logged
        </div>
        <div className="legend-item">
          <span
            className="legend-dot"
            style={{ backgroundColor: OVERRIDE_DOT }}
          />
          Planned
        </div>
        <div className="legend-item">
          <span
            className="legend-dot"
            style={{ backgroundColor: BASELINE_DOT }}
          />
          Weekly plan
        </div>
      </div>

      {upcoming.length > 0 && (
        <div className="logger-block upcoming-card" data-testid="upcoming-plans">
          <div className="card-label">UPCOMING</div>
          {upcoming.map((eff) => {
            const dotColor =
              eff.source === "override"
                ? MUSCLE_COLORS[eff.muscleGroup!]
                : BASELINE_DOT;
            return (
              <div
                key={eff.dateKey}
                className="upcoming-row"
                data-testid={`upcoming-${eff.dateKey}`}
              >
                <span
                  className="upcoming-dot"
                  style={{ backgroundColor: dotColor }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="upcoming-date">
                    {fromDateKey(eff.dateKey).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="upcoming-muscle">
                    {eff.text}
                    {eff.source === "baseline" && (
                      <span className="source-tag"> · weekly plan</span>
                    )}
                  </div>
                </div>
                <IoChevronForward className="upcoming-chevron" />
              </div>
            );
          })}
        </div>
      )}

      <div className="cal-hint-row">
        <IoInformationCircle />
        <span style={{ flex: 1 }}>
          Tap a future date to override its plan. Reset on the weekly split
          won&apos;t touch your overrides.
        </span>
      </div>

      <PlanModal
        visible={modalOpen}
        dateKey={modalDateKey}
        existingGroup={modalExisting}
        baselineText={modalBaseline}
        onClose={() => setModalOpen(false)}
        onSave={saveDatePlan}
        onDelete={deleteDatePlan}
      />
    </div>
  );
}
