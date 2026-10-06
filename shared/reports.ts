/**
 * v5 Phase 7: admin overview and reports (`/admin/overview`, `/admin/reports`).
 *
 * The server reads the tables and hands rows to these helpers; the maths lives here so it is
 * tested without a database and so the CSV the browser downloads matches the numbers on screen.
 * Copy is admin copy: plain words only (docs/v4.4/COPY_GUIDE.md).
 */

const DAY_MS = 86_400_000;

// ---------------------------------------------------------------------------
// Date ranges
// ---------------------------------------------------------------------------

export interface ReportRange {
  /** Inclusive start (ms, local midnight). */
  from: number;
  /** Exclusive end (ms). */
  to: number;
}

export const RANGE_PRESETS = [
  { id: "7d", days: 7, label: "Last 7 days" },
  { id: "30d", days: 30, label: "Last 30 days" },
  { id: "90d", days: 90, label: "Last 90 days" },
] as const;
export type RangePresetId = (typeof RANGE_PRESETS)[number]["id"];

/** The longest range a report may ask for. */
export const MAX_RANGE_DAYS = 366;

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** The last `days` whole days including today: from midnight `days - 1` days ago to now. */
export function rangeForDays(days: number, now: number): ReportRange {
  const today = startOfDay(now);
  const from = new Date(today);
  from.setDate(from.getDate() - (days - 1));
  return { from: from.getTime(), to: now };
}

/**
 * Reads `?from=YYYY-MM-DD&to=YYYY-MM-DD` (or `?days=N`). Bad or missing values fall back to the last
 * 30 days; a reversed range is swapped; anything longer than `MAX_RANGE_DAYS` is cut to it.
 */
export function parseRange(query: { from?: string | null; to?: string | null; days?: string | number | null }, now: number): ReportRange {
  const days = Number(query.days);
  if (Number.isInteger(days) && days >= 1) return rangeForDays(Math.min(days, MAX_RANGE_DAYS), now);
  const day = (v: string | null | undefined): number | null => {
    if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
    const [y, m, d] = v.split("-").map(Number);
    const date = new Date(y!, m! - 1, d!);
    return Number.isNaN(date.getTime()) || date.getMonth() !== m! - 1 ? null : date.getTime();
  };
  let from = day(query.from);
  let toDay = day(query.to);
  if (from === null && toDay === null) return rangeForDays(30, now);
  if (from === null) from = toDay! - 29 * DAY_MS;
  if (toDay === null) toDay = startOfDay(now);
  if (from > toDay) [from, toDay] = [toDay, from];
  const end = new Date(toDay);
  end.setDate(end.getDate() + 1);
  let to = Math.min(end.getTime(), Math.max(now, from + DAY_MS));
  if (to - from > MAX_RANGE_DAYS * DAY_MS) to = from + MAX_RANGE_DAYS * DAY_MS;
  return { from, to };
}

export function inRange(ts: number | null | undefined, range: ReportRange): ts is number {
  return typeof ts === "number" && ts >= range.from && ts < range.to;
}

/** `YYYY-MM-DD` in local time. */
export function isoDay(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Local midnights covering the range, oldest first. DST-safe (calendar days, not 24 h steps). */
export function dayStarts(range: ReportRange): number[] {
  const out: number[] = [];
  const d = new Date(startOfDay(range.from));
  while (d.getTime() < range.to && out.length <= MAX_RANGE_DAYS) {
    out.push(d.getTime());
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/** Adds each event's value (default 1) to its day. Events outside the range are ignored. */
export function bucketByDay(starts: readonly number[], events: readonly { at: number | null; value?: number }[]): number[] {
  const out = new Array<number>(starts.length).fill(0);
  if (starts.length === 0) return out;
  for (const e of events) {
    if (e.at === null || e.at < starts[0]!) continue;
    for (let i = starts.length - 1; i >= 0; i -= 1) {
      if (e.at >= starts[i]!) {
        out[i] += e.value ?? 1;
        break;
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Maths
// ---------------------------------------------------------------------------

/** 0–100, rounded; 0 when there is nothing to divide by. */
export function percent(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

/** Hours to one decimal place. */
export function hoursFromMinutes(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}

/** US dollars to two places, from the micro-dollars `ai_calls.cost_micros` stores. */
export function dollarsFromMicros(micros: number): number {
  return Math.round(micros / 10_000) / 100;
}

export interface EvaluationSkills {
  userId: string;
  at: number;
  skills: readonly { skillId: string; skillName?: string; level: number | null }[];
}

/**
 * Skill level-ups in the range: for each learner, each evaluation is compared with that learner's
 * previous one, and every skill whose level went up counts once per evaluation. A first evaluation
 * has nothing to compare with, so it counts nothing.
 */
export function skillLevelUps(evaluations: readonly EvaluationSkills[], range: ReportRange): { count: number; bySkill: { skill: string; count: number }[]; learners: number } {
  const byUser = new Map<string, EvaluationSkills[]>();
  for (const e of evaluations) byUser.set(e.userId, [...(byUser.get(e.userId) ?? []), e]);
  const bySkill = new Map<string, number>();
  const learners = new Set<string>();
  let count = 0;
  for (const [userId, list] of byUser) {
    const sorted = [...list].sort((a, b) => a.at - b.at);
    for (let i = 1; i < sorted.length; i += 1) {
      const cur = sorted[i]!;
      if (!inRange(cur.at, range)) continue;
      const before = new Map(sorted[i - 1]!.skills.map((s) => [s.skillId, s.level ?? 0]));
      for (const s of cur.skills) {
        const prev = before.get(s.skillId);
        if (prev === undefined || s.level === null || s.level <= prev) continue;
        count += 1;
        learners.add(userId);
        const name = s.skillName ?? s.skillId;
        bySkill.set(name, (bySkill.get(name) ?? 0) + 1);
      }
    }
  }
  return {
    count,
    learners: learners.size,
    bySkill: [...bySkill].map(([skill, n]) => ({ skill, count: n })).sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill)),
  };
}

/** Topic tests and placement tests in the range: how many, how many passed, the average mark. */
export function testOutcomes(attempts: readonly { passed: boolean; score: number }[]): { attempts: number; passed: number; passRate: number; averageScore: number } {
  const passed = attempts.filter((a) => a.passed).length;
  const avg = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length) : 0;
  return { attempts: attempts.length, passed, passRate: percent(passed, attempts.length), averageScore: avg };
}

/** Unique (learner, thing) pairs, so one passed case counted from two sources is counted once. */
export function uniquePairs(pairs: readonly { userId: string; ref: string; at: number }[], range: ReportRange): number {
  return new Set(pairs.filter((p) => inRange(p.at, range)).map((p) => `${p.userId}\u0000${p.ref}`)).size;
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

export type OverviewTileId = "active" | "hours" | "skills" | "cases";

export interface OverviewTile {
  id: OverviewTileId;
  label: string;
  value: number;
  /** The same number for the 7 days before, for "3 more than last week". */
  previous: number;
  /** Where one click goes for the detail. */
  href: string;
}

export interface CohortRow {
  /** `YYYY-MM`: the month they joined. */
  cohort: string;
  label: string;
  learners: number;
  /** Average share of their plan done, 0–100. */
  averageDone: number;
}

export interface DepartmentRow {
  id: string;
  name: string;
  learners: number;
  activeThisWeek: number;
  averageDone: number;
  stuck: number;
}

export interface OverviewResponse {
  tiles: OverviewTile[];
  cohorts: CohortRow[];
  departments: DepartmentRow[];
  generatedAt: number;
}

export interface ReportsResponse {
  range: ReportRange;
  days: string[];
  completion: { lessonsDone: number; perDay: number[]; learnersWithPlan: number; averagePlanDone: number; plansFinished: number };
  time: { hours: number; perDay: number[]; activeLearners: number };
  skills: { levelUps: number; learners: number; bySkill: { skill: string; count: number }[]; casesPassed: number };
  tests: { topic: { attempts: number; passed: number; passRate: number; averageScore: number }; placement: { finished: number; averageScore: number } };
  ai: { dollars: number; calls: number; failed: number; perDay: number[] };
  /** `available`: mail is set up on the server; without it the weekly email option is hidden. */
  weeklyEmail: { on: boolean; lastQueuedAt: number | null; available: boolean };
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

export interface CsvColumnDef<T> {
  label: string;
  value: (row: T) => string | number | boolean | null | undefined;
}

/**
 * One CSV cell. Quotes when needed (comma, quote, newline) and defuses spreadsheet formulas: a
 * cell starting with = + - @ (or a tab or carriage return) gets a leading apostrophe, so opening
 * the file can never run something. Negative numbers stay numbers.
 */
export function csvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Header plus one line per row, CRLF line ends (what spreadsheets expect). */
export function toCsv<T>(rows: readonly T[], columns: readonly CsvColumnDef<T>[]): string {
  const lines = [columns.map((c) => csvCell(c.label)).join(",")];
  for (const row of rows) lines.push(columns.map((c) => csvCell(c.value(row))).join(","));
  return `${lines.join("\r\n")}\r\n`;
}

/** The report's day series as rows, for "Download CSV". */
export function reportDayRows(report: ReportsResponse): { day: string; lessons: number; hours: number; aiDollars: number }[] {
  return report.days.map((day, i) => ({
    day,
    lessons: report.completion.perDay[i] ?? 0,
    hours: report.time.perDay[i] ?? 0,
    aiDollars: report.ai.perDay[i] ?? 0,
  }));
}

export const REPORT_DAY_COLUMNS: CsvColumnDef<ReturnType<typeof reportDayRows>[number]>[] = [
  { label: "Day", value: (r) => r.day },
  { label: "Lessons finished", value: (r) => r.lessons },
  { label: "Hours learned", value: (r) => r.hours },
  { label: "AI cost (USD)", value: (r) => r.aiDollars },
];

// ---------------------------------------------------------------------------
// Weekly email to the admin
// ---------------------------------------------------------------------------

/** app_meta: "on" or "off". */
export const WEEKLY_REPORT_META_KEY = "v5.reports.weekly_email";
/** app_meta: when the last one was queued (ms, as a string). */
export const WEEKLY_REPORT_LAST_META_KEY = "v5.reports.weekly_email_last";
export const WEEKLY_REPORT_KIND = "admin.weekly_report";

/** Due when it is on and nothing was queued in the last 7 days. */
export function weeklyReportDue(on: boolean, lastQueuedAt: number | null, now: number): boolean {
  if (!on) return false;
  return lastQueuedAt === null || now - lastQueuedAt >= 7 * DAY_MS;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** The email body: the week in five lines, plain text and a matching simple HTML version. */
export function weeklyReportEmail(report: ReportsResponse, name: string): { subject: string; text: string; html: string } {
  const lines = [
    `${report.time.activeLearners} people learned this week, for ${report.time.hours} hours in total.`,
    `${report.completion.lessonsDone} lessons finished. Plans are ${report.completion.averagePlanDone}% done on average.`,
    `${report.skills.levelUps} skill level-ups and ${report.skills.casesPassed} practical cases passed.`,
    `Topic tests: ${report.tests.topic.passed} of ${report.tests.topic.attempts} passed.`,
    `AI cost: $${report.ai.dollars.toFixed(2)}.`,
  ];
  const greeting = `Hi ${name.trim().split(/\s+/)[0] || "there"},`;
  const text = [greeting, "", "Here's last week on Oyelearn.", "", ...lines.map((l) => `- ${l}`), "", "Open Reports in Oyelearn for the details."].join("\n");
  const html = `<p>${escapeHtml(greeting)}</p><p>Here's last week on Oyelearn.</p><ul>${lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul><p>Open Reports in Oyelearn for the details.</p>`;
  return { subject: "Your weekly Oyelearn report", text, html };
}
