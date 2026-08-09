import db from './db.js';

/* Cut-off arithmetic shared by performance reports, student detail, progress
   cards and the public self-check. Time events qualify at-or-under the mark;
   distance/count events at-or-over. "borderline" = within 10% of the mark. */

export const meets = (value, target, unit) =>
  unit === 'sec' ? value <= target : value >= target;

export function readinessStatus(value, target, unit) {
  if (meets(value, target, unit)) return 'ready';
  const within = unit === 'sec' ? value <= target * 1.1 : value >= target * 0.9;
  return within ? 'borderline' : 'at-risk';
}

/* gap > 0 means "this much still to close" in the event's own unit. */
export const gapTo = (value, target, unit) =>
  Math.round((unit === 'sec' ? value - target : target - value) * 100) / 100;

export function benchmarksFor({ event, gender, exam }) {
  const where = ['event = @event', 'gender = @gender'];
  const params = { event, gender: gender || 'M' };
  if (exam) { where.push('exam = @exam'); params.exam = exam; }
  return db.prepare(`SELECT * FROM benchmarks WHERE ${where.join(' AND ')} ORDER BY exam`).all(params);
}

/* Judge one result against every applicable cut-off; strictest first so the
   headline verdict is the hardest exam still in reach. */
export function judge({ event, gender, exam, value, unit }) {
  return benchmarksFor({ event, gender, exam })
    .filter(b => b.unit === unit)
    .map(b => ({
      exam: b.exam,
      target: b.value,
      unit: b.unit,
      gap: gapTo(value, b.value, b.unit),
      status: readinessStatus(value, b.value, b.unit)
    }))
    .sort((a, b) => (unit === 'sec' ? a.target - b.target : b.target - a.target));
}
