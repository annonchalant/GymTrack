// Month calendar grid — web replica of react-native-calendars as themed on the
// mobile Calendar screen: dark surface, Monday-first weeks, extra days from
// adjacent months dimmed, dot marking, today highlighted with an accent pill.

import { useState } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

import { toDateKey } from "@/utils/cycle";

import "@/pages/calendar.css";

export type MarkedMap = Record<
  string,
  {
    marked?: boolean;
    dotColor?: string;
    selected?: boolean;
    selectedColor?: string;
  }
>;

type Props = {
  markedDates: MarkedMap;
  onDayPress: (dateKey: string) => void;
};

const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Cell = { dateKey: string; day: number; outside: boolean };

// Build a Monday-first grid covering the whole month, padded with the
// adjacent months' days (shown dimmed, like hideExtraDays={false}).
function buildGrid(year: number, month: number): Cell[] {
  const first = new Date(year, month, 1);
  // getDay(): 0=Sun..6=Sat → Monday-first offset.
  const lead = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((lead + daysInMonth) / 7) * 7;

  const cells: Cell[] = [];
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(year, month, 1 - lead + i, 12);
    cells.push({
      dateKey: toDateKey(d),
      day: d.getDate(),
      outside: d.getMonth() !== month,
    });
  }
  return cells;
}

export default function MonthCalendar({ markedDates, onDayPress }: Props) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const goMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const cells = buildGrid(viewYear, viewMonth);
  const todayKey = toDateKey(new Date());
  const monthTitle = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    undefined,
    { month: "long", year: "numeric" },
  );

  return (
    <div>
      <div className="cal-header">
        <button
          className="cal-arrow"
          onClick={() => goMonth(-1)}
          aria-label="Previous month"
        >
          <IoChevronBack />
        </button>
        <span className="cal-month-title">{monthTitle}</span>
        <button
          className="cal-arrow"
          onClick={() => goMonth(1)}
          aria-label="Next month"
        >
          <IoChevronForward />
        </button>
      </div>

      <div className="cal-dow-row">
        {DOW_LABELS.map((d) => (
          <span key={d} className="cal-dow">
            {d}
          </span>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((cell) => {
          const mark = markedDates[cell.dateKey];
          const classes = [
            "cal-day",
            cell.outside ? "outside" : "",
            cell.dateKey === todayKey ? "today" : "",
            mark?.selected ? "selected" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={cell.dateKey}
              className={classes}
              onClick={() => onDayPress(cell.dateKey)}
              data-testid={`calendar-day-${cell.dateKey}`}
            >
              <span
                className="day-num"
                style={
                  mark?.selected && mark.selectedColor
                    ? { background: mark.selectedColor }
                    : undefined
                }
              >
                {cell.day}
              </span>
              {mark?.marked && (
                <span
                  className="day-dot"
                  style={{ backgroundColor: mark.dotColor }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
