// Weight + Reps input pair with a prominent Save Set button.
// Stateful — parent supplies the current exercise and a save handler.

import { useState, type FormEvent } from "react";
import { IoAddCircle } from "react-icons/io5";

import "./logger.css";

type Props = {
  exercise: string;
  onSave: (input: { weight: number; reps: number }) => Promise<void> | void;
};

export default function SetForm({ exercise, onSave }: Props) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [saving, setSaving] = useState(false);

  // Allow "0" but not blank / non-numeric.
  const weightNum = parseFloat(weight);
  const repsNum = parseInt(reps, 10);
  const valid =
    Number.isFinite(weightNum) &&
    weightNum >= 0 &&
    Number.isFinite(repsNum) &&
    repsNum > 0;

  const handleSave = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    try {
      await onSave({ weight: weightNum, reps: repsNum });
      setReps("");
      // Keep `weight` so the user doesn't retype it for follow-on sets.
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} data-testid="set-form">
      <div className="set-inputs-row">
        <div className="set-input-box">
          <label className="set-input-label">WEIGHT</label>
          <input
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            inputMode="decimal"
            placeholder="0"
            maxLength={6}
            data-testid="set-weight-input"
          />
        </div>
        <div className="set-input-box">
          <label className="set-input-label">REPS</label>
          <input
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            inputMode="numeric"
            placeholder="0"
            maxLength={3}
            data-testid="set-reps-input"
          />
        </div>
      </div>

      <button
        type="submit"
        className="save-set-btn"
        disabled={!valid || saving}
        data-testid="save-set-button"
      >
        <IoAddCircle />
        {saving ? "Saving..." : `Save ${exercise} Set`}
      </button>
    </form>
  );
}
