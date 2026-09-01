// Date selector: prev / current date / next, plus a "Today" jump.
// Uses a single `dateKey` (YYYY-MM-DD) prop so parent owns state.

import { IoChevronBack, IoChevronForward } from "react-icons/io5";

import {
  addDays,
  formatDateLong,
  fromDateKey,
  toDateKey,
} from "@/utils/cycle";

import "./logger.css";

type Props = {
  dateKey: string;
  onChange: (next: string) => void;
};

export default function DateBar({ dateKey, onChange }: Props) {
  const current = fromDateKey(dateKey);
  const todayKey = toDateKey(new Date());
  const isToday = dateKey === todayKey;

  const goPrev = () => onChange(toDateKey(addDays(current, -1)));
  const goNext = () => onChange(toDateKey(addDays(current, 1)));
  const goToday = () => onChange(todayKey);

  return (
    <div className="date-bar" data-testid="date-bar">
      <button
        onClick={goPrev}
        className="arrow-btn"
        aria-label="Previous day"
        data-testid="date-prev-button"
      >
        <IoChevronBack />
      </button>

      <div className="date-center">
        <span className="date-label" data-testid="date-label">
          {isToday ? "Today" : formatDateLong(current)}
        </span>
        {!isToday && (
          <span className="date-sublabel">{formatDateLong(current)}</span>
        )}
      </div>

      <button
        onClick={goNext}
        className="arrow-btn"
        aria-label="Next day"
        data-testid="date-next-button"
      >
        <IoChevronForward />
      </button>

      {!isToday && (
        <button
          onClick={goToday}
          className="today-btn"
          data-testid="date-today-button"
        >
          Today
        </button>
      )}
    </div>
  );
}
