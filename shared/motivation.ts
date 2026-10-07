/**
 * v5 Phase 6: motivation, done respectfully. Pure rules shared by the server (reminders, recaps,
 * the team board) and the client (celebrations, the welcome). No clock and no database here.
 *
 * - Celebrations: four kinds, three sizes, each at most 2 s, skippable, a static badge under
 *   reduced motion, and none at all when the learner turned them off.
 * - Reminders: at the learner's chosen time, only if they haven't learned today, never inside
 *   quiet hours, and never more than one a day.
 * - The weekly recap: progress, what's next and one kind line, in plain words (HTML + text).
 * - The team board: off unless an admin turns it on; then only learners who opted in, same
 *   department, first name and weekly XP, no rank numbers.
 */

import { emailButton, emailLink, emailList, emailP, escapeHtml, type EmailBody } from "./emailParts";

// ---------------------------------------------------------------------------
// Celebrations
// ---------------------------------------------------------------------------

export const CELEBRATION_KINDS = ["lesson", "level_up", "weekly_summit", "certificate"] as const;
export type CelebrationKind = (typeof CELEBRATION_KINDS)[number];
export type CelebrationSize = "small" | "medium" | "big";

export interface CelebrationSpec {
  size: CelebrationSize;
  /** Never above 2000 ms (the design system clamps too). */
  durationMs: number;
  confetti: boolean;
  title: string;
}

export const CELEBRATIONS: Record<CelebrationKind, CelebrationSpec> = {
  lesson: { size: "small", durationMs: 1200, confetti: false, title: "Lesson done" },
  level_up: { size: "medium", durationMs: 1600, confetti: true, title: "Skill level up" },
  weekly_summit: { size: "big", durationMs: 2000, confetti: true, title: "Weekly goal reached" },
  certificate: { size: "big", durationMs: 2000, confetti: true, title: "Certificate earned" },
};

export function isCelebrationKind(value: unknown): value is CelebrationKind {
  return typeof value === "string" && (CELEBRATION_KINDS as readonly string[]).includes(value);
}

export function celebrationFor(kind: CelebrationKind): CelebrationSpec {
  return CELEBRATIONS[kind];
}

/** XP kinds that are a milestone worth a moment. Steps and reviews only get the "+10 XP" chip. */
export const XP_KIND_CELEBRATION: Partial<Record<string, CelebrationKind>> = {
  lesson_completed: "lesson",
  skill_level_up: "level_up",
  certificate: "certificate",
};

export type CelebrationMode = "off" | "static" | "animated";

/**
 * How a celebration shows: off when the learner turned celebrations off, a static badge when
 * reduced motion is on (their setting, or the system's while their setting is "system").
 */
export function celebrationMode(input: { celebrations: boolean; reducedMotion: "system" | "on" | "off"; systemReduce: boolean }): CelebrationMode {
  if (!input.celebrations) return "off";
  if (input.reducedMotion === "on") return "static";
  if (input.reducedMotion === "system" && input.systemReduce) return "static";
  return "animated";
}

/** The bigger moment wins when two arrive together (a lesson that also levelled a skill up). */
export function biggestCelebration(kinds: readonly CelebrationKind[]): CelebrationKind | null {
  const rank: Record<CelebrationSize, number> = { small: 1, medium: 2, big: 3 };
  let best: CelebrationKind | null = null;
  for (const k of kinds) if (!best || rank[CELEBRATIONS[k].size] > rank[CELEBRATIONS[best].size]) best = k;
  return best;
}

// ---------------------------------------------------------------------------
// Welcome (first run)
// ---------------------------------------------------------------------------

export const WELCOME_STEPS = [
  {
    id: "plan",
    title: "Here's your plan",
    body: "Each week you get a short list of lessons, picked for your role. Today shows the next one. My plan shows the whole week.",
  },
  {
    id: "lessons",
    title: "Here's how lessons work",
    body: "Every lesson has up to four steps: Watch, Read, Do and Check. Your place is saved, so you can stop and come back any time.",
  },
  {
    id: "ask",
    title: "Here's Ask Oye",
    body: "Stuck on a lesson? Ask Oye answers from the lesson itself and shows where it found the answer. It gives hints, not the full solution.",
  },
] as const;

/**
 * Whether the welcome opens: once (until `welcomeDoneAt` is set), only on Today, and always when
 * the learner asks to see it again (`/learn?welcome=1`).
 */
export function shouldShowWelcome(input: { welcomeDoneAt: number | null; pathname: string; search: string }): boolean {
  if (input.pathname !== "/learn" && input.pathname !== "/learn/") return false;
  if (new URLSearchParams(input.search).get("welcome") === "1") return true;
  return input.welcomeDoneAt === null;
}

// ---------------------------------------------------------------------------
// Local time (a learner's reminder time is in their own time zone)
// ---------------------------------------------------------------------------

export interface LocalClock {
  /** "YYYY-MM-DD" in that zone. */
  day: string;
  /** Minutes since local midnight. */
  minutes: number;
}

/** The local day and time at `ms` in `timeZone` (an IANA name). Unknown zones use the server's. */
export function localClock(ms: number, timeZone?: string | null): LocalClock {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone || undefined,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(ms));
  } catch {
    return localClock(ms, null);
  }
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  const hour = Number(get("hour")) % 24;
  return { day: `${get("year")}-${get("month")}-${get("day")}`, minutes: hour * 60 + Number(get("minute")) };
}

export function isValidTimeZone(zone: unknown): zone is string {
  if (typeof zone !== "string" || zone.length === 0 || zone.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** "18:30" → 1110. Null for anything else. */
export function minutesOf(hhmm: string | null | undefined): number | null {
  const m = typeof hhmm === "string" ? /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm) : null;
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Quiet hours may cross midnight (22:00–07:00). Equal ends mean no quiet hours. */
export function inQuietHours(minutes: number, quiet: { from: string; to: string } | null | undefined): boolean {
  if (!quiet) return false;
  const from = minutesOf(quiet.from);
  const to = minutesOf(quiet.to);
  if (from === null || to === null || from === to) return false;
  return from < to ? minutes >= from && minutes < to : minutes >= from || minutes < to;
}

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------

/** A reminder that couldn't go out at its time (quiet hours, a restart) waits at most this long. */
export const REMINDER_LATE_LIMIT_MIN = 4 * 60;

export interface ReminderInput {
  reminderTime: string | null;
  quietHours: { from: string; to: string } | null;
  /** The learner's local clock now. */
  now: LocalClock;
  learnedToday: boolean;
  /** The learner-local day of the last reminder sent, if any. */
  lastReminderDay: string | null;
}

export type ReminderSkip = "no_time" | "too_early" | "too_late" | "quiet_hours" | "learned_today" | "already_sent";
export type ReminderDecision = { send: true } | { send: false; reason: ReminderSkip };

/**
 * One reminder a day at most, at or after the chosen time, never in quiet hours, and only when
 * they haven't learned anything yet today. The order matters only for the reason reported.
 */
export function reminderDecision(input: ReminderInput): ReminderDecision {
  const at = minutesOf(input.reminderTime);
  if (at === null) return { send: false, reason: "no_time" };
  if (input.lastReminderDay === input.now.day) return { send: false, reason: "already_sent" };
  if (input.now.minutes < at) return { send: false, reason: "too_early" };
  if (input.now.minutes - at > REMINDER_LATE_LIMIT_MIN) return { send: false, reason: "too_late" };
  if (inQuietHours(input.now.minutes, input.quietHours)) return { send: false, reason: "quiet_hours" };
  if (input.learnedToday) return { send: false, reason: "learned_today" };
  return { send: true };
}

export const REMINDER_KIND = "v5.reminder";
export const REMINDER_EMAIL_KIND = "learner.reminder";
export const RECAP_KIND = "learner.weekly_recap";

export function reminderText(firstName: string, nextTitle: string | null): { title: string; body: string } {
  return {
    title: nextTitle ? `Ready for "${nextTitle}"?` : "A few minutes of learning today?",
    body: nextTitle
      ? `Hi ${firstName}, your next lesson is waiting. Ten minutes is enough to move it forward.`
      : `Hi ${firstName}, ten minutes is enough to keep your week moving.`,
  };
}

/**
 * The email copy of a reminder: the same two lines, a button, and how to turn it off. The body only;
 * the server wraps it in the Oyelearn frame (server/src/v5/email/layout.ts).
 */
export function reminderEmail(text: { title: string; body: string }, url: string, appUrl: string): EmailBody {
  const settings = `${appUrl.replace(/\/+$/, "")}/learn/me?tab=settings`;
  return {
    subject: text.title,
    preheader: text.body,
    text: [text.body, "", `Open it: ${url}`, "", `Change or turn off reminders in Me, Settings: ${settings}`].join("\n"),
    bodyHtml: [
      emailP(escapeHtml(text.body), { spaceAfter: 8 }),
      emailButton(url, "Open the lesson"),
      emailP(`${emailLink(settings, "Change or turn off reminders in Me, Settings", { muted: true })}.`, { muted: true, small: true, spaceAfter: 0 }),
    ].join(""),
  };
}

// ---------------------------------------------------------------------------
// The weekly recap
// ---------------------------------------------------------------------------

export interface RecapSchedule {
  /** 0 = Sunday … 6 = Saturday, server-local. */
  weekday: number;
  /** 0–23, server-local. */
  hour: number;
}

export const DEFAULT_RECAP_SCHEDULE: RecapSchedule = { weekday: 1, hour: 8 };

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** "mon 08:00" (or "1 8") → a schedule; anything unreadable → Monday 08:00. */
export function parseRecapSchedule(value: string | undefined | null): RecapSchedule {
  if (!value) return DEFAULT_RECAP_SCHEDULE;
  const m = /^\s*([a-z]{3}|[0-6])\w*\s+(\d{1,2})(?::\d{2})?\s*$/i.exec(value);
  if (!m) return DEFAULT_RECAP_SCHEDULE;
  const weekday = /^\d$/.test(m[1]) ? Number(m[1]) : WEEKDAYS.indexOf(m[1].slice(0, 3).toLowerCase());
  const hour = Number(m[2]);
  if (weekday < 0 || hour > 23) return DEFAULT_RECAP_SCHEDULE;
  return { weekday, hour };
}

/**
 * Recaps go out from the scheduled hour until the end of that day (server-local), so an hourly
 * tick that lands at 08:40 or a restart at 10:00 still sends. Per-learner idempotency is the
 * caller's (one recap row per learner in the last 6 days).
 */
export function recapWindowOpen(at: Date, schedule: RecapSchedule): boolean {
  return at.getDay() === schedule.weekday && at.getHours() >= schedule.hour;
}

export interface RecapInput {
  firstName: string;
  /** "Week 41". */
  weekLabel: string;
  xpLastWeek: number;
  lessonsLastWeek: number;
  /** Logged minutes last week, and the goal (null = the 3 steps rule). */
  minutesLastWeek: number;
  goalMinutes: number | null;
  lastWeek: { met: boolean; frozen: boolean } | null;
  streak: { current: number; freezesLeft: number };
  next: { title: string; href: string }[];
  appUrl: string;
}

/** The recap body; the server wraps it in the Oyelearn frame. */
export type RecapEmail = EmailBody;

function hoursLabel(minutes: number): string {
  const h = Math.round((minutes / 60) * 10) / 10;
  return `${h} ${h === 1 ? "hour" : "hours"}`;
}

/** One kind line, picked by how the week went. Never guilt: a quiet week gets a fresh start. */
export function encouragement(input: Pick<RecapInput, "lastWeek" | "lessonsLastWeek" | "streak">): string {
  if (input.lastWeek?.frozen) return "Last week was busy, so a freeze kept your streak safe. This week is a fresh start.";
  if (input.lastWeek?.met && input.streak.current >= 4) return `${input.streak.current} weeks in a row. That's a real habit now.`;
  if (input.lastWeek?.met) return "You reached your goal last week. Keep the same pace this week.";
  if (input.lessonsLastWeek > 0) return "Every lesson counts. A little more this week and you'll reach your goal.";
  return "A new week, a fresh start. One short lesson is a great way to begin.";
}


export function buildWeeklyRecap(input: RecapInput): RecapEmail {
  const base = input.appUrl.replace(/\/+$/, "");
  const goalLine =
    input.goalMinutes !== null
      ? `You learned for ${hoursLabel(input.minutesLastWeek)} of your ${hoursLabel(input.goalMinutes)} goal.`
      : `You finished ${input.lessonsLastWeek} ${input.lessonsLastWeek === 1 ? "lesson" : "lessons"}.`;
  const streakLine =
    input.streak.current > 0
      ? `Your weekly streak is ${input.streak.current} ${input.streak.current === 1 ? "week" : "weeks"}.`
      : "Your weekly streak starts again when you reach this week's goal.";
  const progress = [
    goalLine,
    input.goalMinutes !== null ? `You finished ${input.lessonsLastWeek} ${input.lessonsLastWeek === 1 ? "lesson" : "lessons"}.` : null,
    `You earned ${input.xpLastWeek} XP.`,
    streakLine,
  ].filter((l): l is string => l !== null);
  const kind = encouragement(input);
  const next = input.next.slice(0, 3).map((n) => ({ title: n.title, url: `${base}${n.href}` }));
  const subject = input.lastWeek?.met ? `${input.firstName}, you reached your goal last week` : `${input.firstName}, your week in learning`;

  const text = [
    `Hi ${input.firstName},`,
    "",
    `Here's how ${input.weekLabel} went.`,
    ...progress.map((l) => `- ${l}`),
    "",
    next.length ? "What's next:" : "Your next lessons show on Today.",
    ...next.map((n) => `- ${n.title}: ${n.url}`),
    "",
    kind,
    "",
    `Open Today: ${base}/learn`,
    "",
    `You get this email because weekly emails are on. Turn them off in Me, Settings: ${base}/learn/me?tab=settings`,
  ].join("\n");

  const bodyHtml = [
    emailP(`Hi ${escapeHtml(input.firstName)},`),
    emailP(`Here's how ${escapeHtml(input.weekLabel)} went.`),
    emailList(progress.map((l) => escapeHtml(l))),
    next.length
      ? `${emailP("What's next", { strong: true, spaceAfter: 4 })}${emailList(next.map((n) => emailLink(n.url, n.title)))}`
      : emailP("Your next lessons show on Today."),
    emailP(escapeHtml(kind)),
    emailButton(`${base}/learn`, "Open Today"),
    emailP(
      `You get this email because weekly emails are on. ${emailLink(`${base}/learn/me?tab=settings`, "Turn them off in Me, Settings", { muted: true })}.`,
      { muted: true, small: true, spaceAfter: 0 },
    ),
  ].join("");

  return { subject, preheader: goalLine, text, bodyHtml };
}

// ---------------------------------------------------------------------------
// The team board (opt-in leaderboard)
// ---------------------------------------------------------------------------

export const LEADERBOARD_META_KEY = "motivation.leaderboards";
export const LEADERBOARD_SIZE = 10;

export interface BoardCandidate {
  userId: string;
  displayName: string;
  departmentId: string | null;
  optedIn: boolean;
  active: boolean;
  xp: number;
}

export interface BoardEntry {
  firstName: string;
  xp: number;
  you: boolean;
}

export interface BoardView {
  entries: BoardEntry[];
  /** The viewer, when they opted in but aren't in the top list. */
  you: BoardEntry | null;
  /** How many opted-in people share the board (including the viewer). */
  size: number;
}

export function firstNameOf(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] || "Someone";
}

/**
 * Opted-in, active learners in the viewer's department (no department matches no department),
 * most XP first, then by name. First names and XP only; the client shows no rank numbers.
 */
export function buildBoard(viewerId: string, viewerDepartment: string | null, candidates: readonly BoardCandidate[], size = LEADERBOARD_SIZE): BoardView {
  const pool = candidates
    .filter((c) => c.optedIn && c.active && (c.departmentId ?? null) === (viewerDepartment ?? null))
    .map((c) => ({ userId: c.userId, firstName: firstNameOf(c.displayName), xp: Math.max(0, Math.round(c.xp)) }))
    .sort((a, b) => b.xp - a.xp || a.firstName.localeCompare(b.firstName) || a.userId.localeCompare(b.userId));
  const top = pool.slice(0, size);
  const mine = pool.find((p) => p.userId === viewerId) ?? null;
  return {
    entries: top.map((p) => ({ firstName: p.firstName, xp: p.xp, you: p.userId === viewerId })),
    you: mine && !top.some((p) => p.userId === viewerId) ? { firstName: mine.firstName, xp: mine.xp, you: true } : null,
    size: pool.length,
  };
}

// ---------------------------------------------------------------------------
// API shapes
// ---------------------------------------------------------------------------

export interface MotivationXpEvent {
  kind: string;
  refId: string;
  xp: number;
  createdAt: number;
}

/** `GET /api/v5/motivation?since=` — everything the learner shell's host needs, in one cheap call. */
export interface MotivationSummary {
  serverTime: number;
  xp: { total: number; thisWeek: number };
  /** XP awarded after `since` (newest last, at most 20). Empty without `since`. */
  events: MotivationXpEvent[];
  unread: number;
  prefs: MotivationPrefs;
  leaderboards: boolean;
  /** Minutes a week the learner is held to when `prefs.weeklyGoalHours` is null (plan or onboarding), or null. */
  defaultGoalMinutes?: number | null;
}

export interface MotivationPrefs {
  celebrations: boolean;
  reducedMotion: "system" | "on" | "off";
  weeklyGoalHours: number | null;
  leaderboardOptIn: boolean;
  welcomeDoneAt: number | null;
  timeZone: string | null;
}

export const MAX_WEEKLY_GOAL_HOURS = 40;

export interface LeaderboardResponse {
  enabled: boolean;
  optedIn: boolean;
  /** The department's name, or null when the learner has none. */
  team: string | null;
  week: string;
  board: BoardView | null;
}

export interface MotivationAdminSettings {
  leaderboards: boolean;
  email: { configured: boolean; reason: string | null; queued: number; sent: number; skipped: number; failed: number };
}
