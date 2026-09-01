// Small modal to add a user-defined exercise with a chosen muscle group.

import { useState } from "react";

import Sheet from "@/components/Sheet";
import {
  MUSCLE_COLORS,
  MUSCLE_GROUPS,
  type MuscleGroup,
} from "@/utils/muscle-groups";

import "./logger.css";

type Props = {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, muscleGroup: MuscleGroup) => Promise<void> | void;
};

export default function CustomExerciseModal({ visible, onClose, onAdd }: Props) {
  const [name, setName] = useState("");
  const [group, setGroup] = useState<MuscleGroup | null>(null);
  const [busy, setBusy] = useState(false);

  const valid = name.trim().length > 0 && group !== null;

  const handleAdd = async () => {
    if (!valid || busy) return;
    setBusy(true);
    try {
      await onAdd(name.trim(), group!);
      setName("");
      setGroup(null);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={visible} onClose={onClose} testId="custom-exercise-modal">
      <div className="eyebrow">NEW EXERCISE</div>
      <div className="sheet-title">Add a custom exercise</div>

      <label className="field-label">Name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Romanian Deadlift"
        className="text-input"
        autoFocus
        maxLength={40}
        data-testid="custom-exercise-name-input"
      />

      <label className="field-label">Muscle group</label>
      <div className="chip-grid">
        {MUSCLE_GROUPS.map((g) => {
          const active = group === g;
          const color = MUSCLE_COLORS[g];
          return (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`chip${active ? " active" : ""}`}
              style={
                active
                  ? { borderColor: color, backgroundColor: `${color}22` }
                  : undefined
              }
              data-testid={`custom-exercise-muscle-${g.toLowerCase()}`}
            >
              <span className="chip-dot" style={{ backgroundColor: color }} />
              <span className="chip-text" style={active ? { fontWeight: 700 } : undefined}>
                {g}
              </span>
            </button>
          );
        })}
      </div>

      <div className="actions-row">
        <button
          className="btn btn-secondary"
          onClick={onClose}
          disabled={busy}
          data-testid="custom-exercise-cancel-button"
        >
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={handleAdd}
          disabled={!valid || busy}
          data-testid="custom-exercise-add-button"
        >
          Add exercise
        </button>
      </div>
    </Sheet>
  );
}
