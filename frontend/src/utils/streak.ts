// Pure streak calculator. Given the dates that have logged workouts,
// returns the number of consecutive days ending today (or yesterday if the
// streak hasn't been broken yet but today has nothing yet).

import { addDays, toDateKey } from "@/src/utils/cycle";

/**
 * Counts the user's current consistency streak.
 *
 * Rules:
 *  - If today has a logged set → streak counts back from today.
 *  - Else if yesterday has a logged set → streak counts back from yesterday
 *    (still alive because the user could still log today).
 *  - Otherwise → 0.
 *
 * @param loggedDateKeys list (or iterable) of "YYYY-MM-DD" strings that have
 *                      at least one logged set.
 */
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
