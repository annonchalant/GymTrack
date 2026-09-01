// Large hero card showing the user's current consistency streak.
// Visually distinct via a glowing accent border + oversized numeral.

import { IoFlame, IoFlameOutline } from "react-icons/io5";

import "@/pages/calendar.css";

type Props = {
  streak: number;
};

export default function StreakCard({ streak }: Props) {
  const active = streak > 0;
  const subtitle = active
    ? streak === 1
      ? "You're on the board. Keep it rolling."
      : `${streak} days strong. Don't break the chain.`
    : "Log a workout today to start your streak.";

  return (
    <div
      className={`streak-card${active ? " active" : ""}`}
      data-testid="streak-card"
    >
      <div className="streak-icon-wrap">
        {active ? <IoFlame /> : <IoFlameOutline />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="streak-label">CURRENT CONSISTENCY STREAK</div>
        <div className="streak-number-row">
          <span className="streak-number" data-testid="streak-value">
            {streak}
          </span>
          <span className="streak-unit">{streak === 1 ? "day" : "days"}</span>
        </div>
        <div className="streak-subtitle" data-testid="streak-subtitle">
          {subtitle}
        </div>
      </div>
    </div>
  );
}
