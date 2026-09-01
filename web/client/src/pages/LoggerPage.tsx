// Logger — main screen (presentational; data/behavior in useLogger).
// Hosts: profile greeting · today's plan banner · date bar · cycle banner ·
// exercise picker (built-in + custom) · set form · rest timer · history list.

import { useState } from "react";
import {
  IoCalendarClear,
  IoCreateOutline,
  IoLogOutOutline,
} from "react-icons/io5";
import { useNavigate } from "react-router-dom";

import OnboardingModal from "@/components/OnboardingModal";
import AdaptiveBanner from "@/components/logger/AdaptiveBanner";
import CustomExerciseModal from "@/components/logger/CustomExerciseModal";
import DateBar from "@/components/logger/DateBar";
import ExercisePicker from "@/components/logger/ExercisePicker";
import RestTimer from "@/components/logger/RestTimer";
import SetForm from "@/components/logger/SetForm";
import SetList from "@/components/logger/SetList";
import WeeklySplitModal from "@/components/logger/WeeklySplitModal";
import { useAuth } from "@/context/auth-context";
import { useLogger } from "@/hooks/use-logger";
import { formatDateLong, fromDateKey, toDateKey } from "@/utils/cycle";

import "@/components/logger/logger.css";

export default function LoggerPage() {
  const { logout, username } = useAuth();
  const navigate = useNavigate();

  const {
    showOnboarding,
    closeOnboarding,
    profile,
    cycleStatus,
    split,
    todayPlan,
    dateKey,
    setDateKey,
    exercise,
    setExercise,
    exerciseList,
    sets,
    timerRunId,
    saveSet,
    removeSet,
    addCustom,
    removeCustom,
    saveSplit,
    resetSplit,
  } = useLogger();

  // Modal visibility is pure UI state — it stays in the component.
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);

  const todayLabel = formatDateLong(fromDateKey(dateKey));
  const greeting = profile?.name
    ? `HI, ${profile.name.split(" ")[0].toUpperCase()}`
    : username
      ? `HI, ${username.toUpperCase()}`
      : "LOGGER";

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      await logout();
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="screen" data-testid="logger-screen">
      {/* Header row: greeting + logout */}
      <div className="logger-header-row">
        <div style={{ flex: 1 }}>
          <div className="eyebrow">{greeting}</div>
          <h1 className="display-title">Log a set</h1>
        </div>
        <button
          onClick={handleLogout}
          className="logout-btn"
          aria-label="Sign out"
          data-testid="logout-button"
        >
          <IoLogOutOutline />
        </button>
      </div>

      {/* Today's plan banner — surfaces the configured weekly split */}
      <button
        className="plan-banner"
        onClick={() => setSplitModalOpen(true)}
        data-testid="today-plan-banner"
      >
        <span className="plan-icon">
          <IoCalendarClear />
        </span>
        <span className="plan-body">
          <span className="plan-label" style={{ display: "block" }}>
            TODAY&apos;S PLAN
          </span>
          {todayPlan ? (
            <span className="plan-value" data-testid="today-plan-value">
              {todayLabel} · {todayPlan}
            </span>
          ) : (
            <span className="plan-muted" data-testid="today-plan-empty">
              Tap to set your weekly split
            </span>
          )}
        </span>
        <IoCreateOutline className="plan-edit-icon" />
      </button>

      <div className="logger-block">
        <DateBar dateKey={dateKey} onChange={setDateKey} />
      </div>

      {cycleStatus.enabled && (
        <div className="logger-block">
          <AdaptiveBanner status={cycleStatus} />
        </div>
      )}

      <div className="logger-block">
        <ExercisePicker
          value={exercise}
          onChange={setExercise}
          exercises={exerciseList}
          onAddCustom={() => setCustomModalOpen(true)}
          onDeleteCustom={removeCustom}
        />
      </div>

      <div className="logger-block">
        <SetForm exercise={exercise} onSave={saveSet} />
      </div>

      {timerRunId && (
        <div className="logger-block">
          <RestTimer runId={timerRunId} />
        </div>
      )}

      <div className="logger-block">
        <SetList
          sets={sets}
          onDelete={removeSet}
          headerLabel={
            dateKey === toDateKey(new Date())
              ? "Today's sets"
              : `Sets · ${formatDateLong(fromDateKey(dateKey))}`
          }
        />
      </div>

      <OnboardingModal visible={showOnboarding} onClose={closeOnboarding} />
      <WeeklySplitModal
        visible={splitModalOpen}
        initial={split}
        onClose={() => setSplitModalOpen(false)}
        onSave={saveSplit}
        onReset={resetSplit}
      />
      <CustomExerciseModal
        visible={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        onAdd={addCustom}
      />
    </div>
  );
}
