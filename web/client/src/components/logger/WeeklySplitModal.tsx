// 7-day repeating split editor. User types a free-text label per weekday
// (e.g. "Chest + Triceps"). "Reset" clears every field. Saving persists.

import { useEffect, useState } from "react";
import { IoRefresh } from "react-icons/io5";

import Sheet from "@/components/Sheet";
import {
  DAY_LABELS,
  DAY_ORDER,
  EMPTY_SPLIT,
  type WeeklySplit,
} from "@/utils/weekly-split-storage";

import "./logger.css";

type Props = {
  visible: boolean;
  initial: WeeklySplit;
  onClose: () => void;
  onSave: (split: WeeklySplit) => Promise<void> | void;
  onReset: () => Promise<void> | void;
};

export default function WeeklySplitModal({
  visible,
  initial,
  onClose,
  onSave,
  onReset,
}: Props) {
  const [draft, setDraft] = useState<WeeklySplit>(initial);
  const [busy, setBusy] = useState(false);

  // Sync when modal reopens with fresh stored data.
  useEffect(() => {
    if (visible) setDraft(initial);
  }, [visible, initial]);

  const setDay = (k: keyof WeeklySplit, v: string) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const handleSave = async () => {
    setBusy(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setBusy(true);
    try {
      await onReset();
      setDraft({ ...EMPTY_SPLIT });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={visible} onClose={onClose} testId="weekly-split-modal">
      <div className="split-header-row">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow">WEEKLY PLAN</div>
          <div className="split-title">Your 7-day split</div>
          <div className="split-body">
            Type what you train each day. The plan repeats every week.
          </div>
        </div>
        <button
          onClick={handleReset}
          className="split-reset-btn"
          data-testid="weekly-split-reset-button"
        >
          <IoRefresh />
          Reset
        </button>
      </div>

      <div style={{ maxHeight: 420, overflowY: "auto", paddingBottom: 16 }}>
        {DAY_ORDER.map((k) => (
          <div
            key={k}
            className="split-day-row"
            data-testid={`weekly-split-day-${k}`}
          >
            <label className="split-day-label">{DAY_LABELS[k]}</label>
            <input
              value={draft[k]}
              onChange={(e) => setDay(k, e.target.value)}
              placeholder="Rest day"
              className="split-day-input"
              maxLength={50}
              data-testid={`weekly-split-input-${k}`}
            />
          </div>
        ))}
      </div>

      <div className="actions-row" style={{ marginTop: 16 }}>
        <button
          className="btn btn-secondary"
          onClick={onClose}
          disabled={busy}
          data-testid="weekly-split-cancel-button"
        >
          Close
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={busy}
          data-testid="weekly-split-save-button"
        >
          Save plan
        </button>
      </div>
    </Sheet>
  );
}
