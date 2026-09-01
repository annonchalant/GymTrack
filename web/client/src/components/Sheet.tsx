// Bottom-sheet modal wrapper — web equivalent of the RN transparent Modal +
// backdrop + sheet pattern used across the app. Clicking the backdrop closes;
// clicks inside the sheet don't propagate.

import { useEffect, type ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  // "sheet" slides up from the bottom (default); "center" renders a centered
  // dialog (used by onboarding).
  variant?: "sheet" | "center";
  testId?: string;
};

export default function Sheet({
  open,
  onClose,
  children,
  variant = "sheet",
  testId,
}: Props) {
  // Close on Escape, lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`modal-backdrop${variant === "center" ? " center" : ""}`}
      onClick={onClose}
      data-testid={testId}
    >
      <div
        className={variant === "center" ? "dialog" : "sheet"}
        onClick={(e) => e.stopPropagation()}
      >
        {variant === "sheet" && <div className="sheet-handle" />}
        {children}
      </div>
    </div>
  );
}
