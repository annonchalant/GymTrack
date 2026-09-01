// Bottom-sheet modal to plan a future workout. User picks a target muscle
// group (Legs / Chest / Back / Shoulders) and saves it. If a plan already
// exists for the date, supports updating it or removing it.

import { useEffect, useState } from "react";
import { IoCheckmark, IoRepeat, IoTrashOutline } from "react-icons/io5";

import Sheet from "@/components/Sheet";
import { fromDateKey } from "@/utils/cycle";
import {
  MUSCLE_COLORS,
  MUSCLE_GROUPS,
  type MuscleGroup,
} from "@/utils/muscle-groups";

import "@/pages/calendar.css";

type Props = {
  visible: boolean;
  dateKey: string | null;
  existingGroup: MuscleGroup | null;
  // Free-text baseline coming from the weekly split (e.g. "Chest"). Shown as
  // contextual chip when there's no override yet so the user knows what's
  // already scheduled for that weekday.
  baselineText?: string;
  onClose: () => void;
  onSave: (dateKey: string, group: MuscleGroup) => Promise<void> | void;
  onDelete: (dateKey: string) => Promise<void> | void;
};

function formatLong(dateKey: string): string {
  return fromDateKey(dateKey).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function PlanModal({
  visible,
  dateKey,
  existingGroup,
  baselineText,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [selected, setSelected] = useState<MuscleGroup | null>(existingGroup);
  const [busy, setBusy] = useState(false);

  // Sync local state when the modal opens for a new date.
  useEffect(() => {
    if (visible) setSelected(existingGroup);
  }, [visible, existingGroup]);

  if (!visible || !dateKey) return null;

  const handleSave = async () => {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await onSave(dateKey, selected);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onDelete(dateKey);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={visible} onClose={onClose} testId="plan-modal">
      <div className="eyebrow">PLAN A WORKOUT</div>
      <div className="sheet-title" data-testid="plan-modal-date">
        {formatLong(dateKey)}
      </div>
      <div className="sheet-body-text">
        Pick a target muscle group. You can always change it later.
      </div>

      {baselineText && !existingGroup && (
        <div className="baseline-chip" data-testid="plan-baseline-chip">
          <IoRepeat />
          <span style={{ flex: 1 }}>
            Weekly plan says: <span className="baseline-em">{baselineText}</span>
          </span>
        </div>
      )}

      <div className="chip-grid">
        {MUSCLE_GROUPS.map((g) => {
          const active = selected === g;
          const color = MUSCLE_COLORS[g];
          return (
            <button
              key={g}
              onClick={() => setSelected(g)}
              className={`chip${active ? " active" : ""}`}
              style={
                active
                  ? { borderColor: color, backgroundColor: `${color}22` }
                  : undefined
              }
              data-testid={`plan-muscle-${g.toLowerCase()}`}
            >
              <span className="chip-dot" style={{ backgroundColor: color }} />
              <span className="chip-text">{g}</span>
              {active && <IoCheckmark style={{ color, fontSize: 18 }} />}
            </button>
          );
        })}
      </div>

      <div className="actions-row">
        {existingGroup && (
          <button
            className="btn btn-danger-outline"
            onClick={handleDelete}
            disabled={busy}
            data-testid="plan-delete-button"
          >
            <IoTrashOutline style={{ fontSize: 18 }} />
            Remove plan
          </button>
        )}
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!selected || busy}
          data-testid="plan-save-button"
        >
          {existingGroup ? "Update plan" : "Save plan"}
        </button>
      </div>
    </Sheet>
  );
}
