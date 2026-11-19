/** Simplified SM-2 spaced repetition. */
export type Grade = "again" | "hard" | "good" | "easy";

export type CardState = {
  ease: number;
  interval_days: number;
  repetitions: number;
};

export function schedule(card: CardState, grade: Grade, now: Date = new Date()) {
  let { ease, interval_days, repetitions } = card;

  if (grade === "again") {
    repetitions = 0;
    interval_days = 0; // see again today (10 minutes)
    ease = Math.max(1.3, ease - 0.2);
  } else {
    repetitions += 1;
    if (repetitions === 1) interval_days = grade === "easy" ? 3 : 1;
    else if (repetitions === 2) interval_days = grade === "hard" ? 3 : 6;
    else {
      const factor = grade === "hard" ? 1.2 : grade === "easy" ? ease * 1.3 : ease;
      interval_days = Math.max(interval_days + 1, Math.round(interval_days * factor));
    }
    if (grade === "hard") ease = Math.max(1.3, ease - 0.15);
    if (grade === "easy") ease = ease + 0.15;
  }

  const due = new Date(now);
  if (interval_days === 0) due.setMinutes(due.getMinutes() + 10);
  else due.setDate(due.getDate() + interval_days);

  return {
    ease: Math.round(ease * 100) / 100,
    interval_days,
    repetitions,
    due_at: due.toISOString(),
  };
}
