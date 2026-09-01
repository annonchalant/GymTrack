// List of sets for the currently selected date, with a delete affordance.

import { IoList, IoTrashOutline } from "react-icons/io5";

import { formatTime } from "@/utils/cycle";
import type { WorkoutSet } from "@/utils/workout-storage";

import "./logger.css";

type Props = {
  sets: WorkoutSet[];
  onDelete: (id: string) => void;
  // Optional label override for the section header (e.g. "Today's sets",
  // "Sets on Mon, Jun 15"). Falls back to "Sets" if unset.
  headerLabel?: string;
};

export default function SetList({ sets, onDelete, headerLabel }: Props) {
  if (sets.length === 0) {
    return (
      <div className="set-list-empty" data-testid="set-list-empty">
        <IoList />
        <span>No sets logged yet. Hit Save Set above to start.</span>
      </div>
    );
  }

  return (
    <div className="set-list" data-testid="set-list">
      <div className="set-list-header">
        <span className="header-title">{headerLabel ?? "Sets"}</span>
        <span className="header-count" data-testid="set-list-count">
          {sets.length} {sets.length === 1 ? "set" : "sets"}
        </span>
      </div>
      {sets.map((s, idx) => {
        const setNumber = sets.length - idx; // newest = highest number
        return (
          <div key={s.id} className="set-row" data-testid={`set-row-${s.id}`}>
            <div className="set-number">#{setNumber}</div>
            <div className="set-main">
              <div className="set-exercise">{s.exercise}</div>
              <div className="set-meta">
                {s.weight} × {s.reps} reps · {formatTime(s.loggedAt)}
              </div>
            </div>
            <button
              onClick={() => onDelete(s.id)}
              className="set-delete-btn"
              aria-label={`Delete set #${setNumber}`}
              data-testid={`delete-set-${s.id}`}
            >
              <IoTrashOutline />
            </button>
          </div>
        );
      })}
    </div>
  );
}
