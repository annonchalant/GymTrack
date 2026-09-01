// Exercise picker: trigger button that opens a bottom sheet listing built-in
// and user-defined exercises, with delete icons next to custom rows and an
// "Add custom" affordance.

import { useState } from "react";
import {
  IoAdd,
  IoCheckmark,
  IoChevronDown,
  IoTrashOutline,
} from "react-icons/io5";

import Sheet from "@/components/Sheet";

import "./logger.css";

export type ExerciseOption = {
  name: string;
  // Present only for user-added (custom) exercises. Drives the delete icon.
  customId?: string;
};

type Props = {
  value: string;
  onChange: (next: string) => void;
  // Built-ins first, then custom entries (with customId set).
  exercises: ExerciseOption[];
  // Optional handler to surface the "Add custom" row. When undefined the row
  // is hidden.
  onAddCustom?: () => void;
  // Optional handler to delete a custom exercise. When undefined the trash
  // icon next to custom rows is hidden.
  onDeleteCustom?: (customId: string) => Promise<void> | void;
};

export default function ExercisePicker({
  value,
  onChange,
  exercises,
  onAddCustom,
  onDeleteCustom,
}: Props) {
  const [open, setOpen] = useState(false);

  const handleDelete = async (e: ExerciseOption) => {
    if (!onDeleteCustom || !e.customId) return;
    await onDeleteCustom(e.customId);
  };

  return (
    <>
      <button
        className="exercise-trigger"
        onClick={() => setOpen(true)}
        data-testid="exercise-picker-trigger"
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="trigger-label">EXERCISE</div>
          <div className="trigger-value" data-testid="exercise-picker-value">
            {value}
          </div>
        </div>
        <IoChevronDown className="trigger-chevron" />
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        testId="exercise-picker-modal"
      >
        <div className="sheet-title-label">Choose exercise</div>
        <div style={{ maxHeight: 480, overflowY: "auto" }}>
          {exercises.map((ex) => {
            const selected = ex.name === value;
            const isCustom = !!ex.customId;
            return (
              <div
                key={ex.customId ?? ex.name}
                className={`exercise-option-row${selected ? " selected" : ""}`}
                data-testid={`exercise-option-${ex.name
                  .replace(/\s+/g, "-")
                  .toLowerCase()}`}
              >
                <button
                  className="exercise-option-main"
                  onClick={() => {
                    onChange(ex.name);
                    setOpen(false);
                  }}
                >
                  <span>{ex.name}</span>
                  {isCustom && (
                    <span className="exercise-custom-badge">CUSTOM</span>
                  )}
                </button>

                {selected && !isCustom && (
                  <IoCheckmark className="exercise-check-icon" />
                )}

                {isCustom && onDeleteCustom && (
                  <button
                    onClick={() => handleDelete(ex)}
                    className="exercise-delete-btn"
                    aria-label={`Delete ${ex.name}`}
                    data-testid={`exercise-delete-${ex.customId}`}
                  >
                    <IoTrashOutline />
                  </button>
                )}
              </div>
            );
          })}

          {onAddCustom && (
            <button
              className="exercise-add-row"
              onClick={() => {
                setOpen(false);
                onAddCustom();
              }}
              data-testid="exercise-add-custom-button"
            >
              <span className="add-icon-wrap">
                <IoAdd />
              </span>
              Add custom exercise
            </button>
          )}
        </div>
      </Sheet>
    </>
  );
}
