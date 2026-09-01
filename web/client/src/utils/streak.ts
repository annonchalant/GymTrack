// Pure streak calculator. Given the dates that have logged workouts,
// returns the number of consecutive days ending today (or yesterday if the
// streak hasn't been broken yet but today has nothing yet).
// Ported unchanged from the mobile app.

import { addDays, toDateKey } from "@/utils/cycle";

export function computeStreak(loggedDateKeys: Iterable<string>): number {
  const days = new Set(loggedDateKeys);
  if (days.size === 0) return 0;

  const today = new Date();
  const todayKey = toDateKey(today);

  let cursor: Date;
  if (days.has(todayKey)) {
    cursor = today;
  } else {
    const yesterday = addDays(today, -1);
    if (days.has(toDateKey(yesterday))) {
      cursor = yesterday;
    } else {
      return 0;
    }
  }

  let count = 0;
  while (days.has(toDateKey(cursor))) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}
