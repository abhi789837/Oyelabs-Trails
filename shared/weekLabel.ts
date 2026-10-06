/**
 * "2026-W41" → "5 Oct": the Monday an ISO week starts on, as a short date (UX review M3).
 * Self-contained (no zod, no streak module) so the Me page's chunk stays small.
 * Anything that isn't a week key comes back unchanged.
 */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 86_400_000;

export function weekStartLabel(key: string): string {
  const m = /^(\d{4})-W(\d{2})$/.exec(key);
  if (!m) return key;
  const year = Number(m[1]);
  const week = Number(m[2]);
  // Week 1 is the week with 4 January in it.
  const jan4 = Date.UTC(year, 0, 4);
  const week1Monday = jan4 - ((new Date(jan4).getUTCDay() + 6) % 7) * DAY_MS;
  const monday = new Date(week1Monday + (week - 1) * 7 * DAY_MS);
  return `${monday.getUTCDate()} ${MONTHS[monday.getUTCMonth()]}`;
}

/** "Week of 5 Oct", for screen readers and tooltips. */
export function weekOfLabel(key: string): string {
  const short = weekStartLabel(key);
  return short === key ? key : `Week of ${short}`;
}
