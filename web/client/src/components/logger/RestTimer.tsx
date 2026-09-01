// Rest timer — 90s countdown.
// Parent provides a `runId` (e.g., the just-saved set id). Each new runId
// triggers a fresh countdown. Internal state, but exposes a Skip button.

import { useEffect, useRef, useState } from "react";
import { IoCheckmark, IoTimerOutline } from "react-icons/io5";

import "./logger.css";

type Props = {
  // Changing this prop (re)starts the timer. `null` keeps it idle.
  runId: string | null;
  durationSec?: number;
  onDone?: () => void;
};

function formatMMSS(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function RestTimer({ runId, durationSec = 90, onDone }: Props) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // (Re)start whenever runId changes to a non-null value.
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!runId) {
      setRemaining(null);
      return;
    }
    setRemaining(durationSec);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onDoneRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [runId, durationSec]);

  if (remaining === null) return null;

  const pct = Math.min(1, Math.max(0, (durationSec - remaining) / durationSec));
  const done = remaining === 0;

  const handleSkip = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRemaining(null);
  };

  return (
    <div
      className={`rest-timer-card${done ? " done" : ""}`}
      data-testid="rest-timer-card"
    >
      <div className="rest-timer-row">
        <div className="icon-bubble" style={{ color: "var(--accent)", fontSize: 22 }}>
          {done ? <IoCheckmark /> : <IoTimerOutline />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="timer-label">{done ? "REST COMPLETE" : "RESTING"}</div>
          <div className="timer-value" data-testid="rest-timer-value">
            {done ? "Ready for next set" : formatMMSS(remaining)}
          </div>
        </div>
        <button
          onClick={handleSkip}
          className="skip-btn"
          data-testid="rest-timer-skip-button"
        >
          {done ? "Dismiss" : "Skip"}
        </button>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${pct * 100}%` }}
          data-testid="rest-timer-progress"
        />
      </div>
    </div>
  );
}
