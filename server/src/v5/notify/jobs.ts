import { and, desc, eq, gte } from "drizzle-orm";

import { settingsFrom } from "../../../../shared/me";
import {
  buildWeeklyRecap,
  firstNameOf,
  localClock,
  parseRecapSchedule,
  RECAP_KIND,
  recapWindowOpen,
  REMINDER_EMAIL_KIND,
  reminderEmail,
  REMINDER_KIND,
  reminderDecision,
  reminderText,
  type RecapSchedule,
  type ReminderDecision,
} from "../../../../shared/motivation";
import { isoWeekKey, mondayOf } from "../../../../shared/streak";
import type { ContentStore } from "../../content/store";
import { schema, type Db } from "../../db";
import { newId } from "../../lib/ids";
import { notify } from "../../lib/notify";
import { activeWeek, weekView } from "../../plans/weekly/repo";
import { activityByWeek, refreshStreak } from "../streak/repo";
import { motivationPrefsFrom, readPrefs } from "./prefs";

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

interface Learner {
  id: string;
  username: string;
  displayName: string;
  lastLoginAt: number | null;
}

/** Active learners (not staff) who have signed in at least once. */
function learners(db: Db): Learner[] {
  return db
    .select({ id: schema.users.id, username: schema.users.username, displayName: schema.users.displayName, lastLoginAt: schema.users.lastLoginAt, role: schema.users.role })
    .from(schema.users)
    .where(and(eq(schema.users.status, "active"), eq(schema.users.role, "learner")))
    .all()
    .filter((u) => u.lastLoginAt !== null);
}

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------

/** Any XP award or lesson autosave on the learner's local day counts as learning today. */
export function learnedOn(db: Db, userId: string, day: string, timeZone: string | null, nowMs: number): boolean {
  const since = nowMs - 36 * HOUR_MS;
  const xp = db
    .select({ at: schema.xpEvents.createdAt })
    .from(schema.xpEvents)
    .where(and(eq(schema.xpEvents.userId, userId), gte(schema.xpEvents.createdAt, since)))
    .all();
  const saved = db
    .select({ at: schema.lessonState.updatedAt })
    .from(schema.lessonState)
    .where(and(eq(schema.lessonState.userId, userId), gte(schema.lessonState.updatedAt, since)))
    .all();
  return [...xp, ...saved].some((r) => r.at <= nowMs && localClock(r.at, timeZone).day === day);
}

function lastReminderAt(db: Db, userId: string): number | null {
  return (
    db
      .select({ at: schema.notifications.createdAt })
      .from(schema.notifications)
      .where(and(eq(schema.notifications.recipientId, userId), eq(schema.notifications.kind, REMINDER_KIND)))
      .orderBy(desc(schema.notifications.createdAt))
      .get()?.at ?? null
  );
}

function nextLesson(db: Db, content: ContentStore, userId: string): { title: string; href: string } | null {
  const row = activeWeek(db, userId);
  if (!row) return null;
  try {
    const item = weekView(db, content, userId, row, { reconcile: false }).items.find((i) => i.status !== "done" && i.status !== "skipped");
    if (!item) return null;
    return { title: item.title, href: item.topicId ? `/learn/lesson/${encodeURIComponent(item.topicId)}` : "/learn" };
  } catch {
    return null;
  }
}

export interface ReminderOutcome {
  userId: string;
  decision: ReminderDecision;
}

/**
 * One pass over learners with a reminder time. The check (last reminder on this local day) and
 * the write (the notification row that *is* the record) run in one synchronous transaction, so two
 * ticks can't both send. An email copy is queued with it; the sender skips it when email isn't set up.
 */
export function sendDueReminders(db: Db, content: ContentStore, appUrl: string, nowMs = Date.now()): ReminderOutcome[] {
  const out: ReminderOutcome[] = [];
  for (const learner of learners(db)) {
    const data = readPrefs(db, learner.id);
    const settings = settingsFrom(data);
    if (!settings.reminderTime) continue;
    const prefs = motivationPrefsFrom(data);
    const clock = localClock(nowMs, prefs.timeZone);
    const decision = db.transaction(() => {
      const last = lastReminderAt(db, learner.id);
      const result = reminderDecision({
        reminderTime: settings.reminderTime,
        quietHours: settings.quietHours,
        now: clock,
        learnedToday: learnedOn(db, learner.id, clock.day, prefs.timeZone, nowMs),
        lastReminderDay: last === null ? null : localClock(last, prefs.timeZone).day,
      });
      if (!result.send) return result;
      const next = nextLesson(db, content, learner.id);
      const text = reminderText(firstNameOf(learner.displayName), next?.title ?? null);
      const link = next?.href ?? "/learn";
      notify(db, { recipientId: learner.id, kind: REMINDER_KIND, title: text.title, body: text.body, link });
      const mail = reminderEmail(text, `${appUrl.replace(/\/+$/, "")}${link}`, appUrl);
      db.insert(schema.emailOutbox)
        .values({ id: newId(), toUserId: learner.id, toAddress: learner.username, kind: REMINDER_EMAIL_KIND, subject: text.title, html: mail.html, text: mail.text, status: "queued", createdAt: nowMs })
        .run();
      return result;
    });
    out.push({ userId: learner.id, decision });
  }
  return out;
}

// ---------------------------------------------------------------------------
// The weekly recap
// ---------------------------------------------------------------------------

export function recapScheduleFromEnv(env: NodeJS.ProcessEnv = process.env): RecapSchedule {
  return parseRecapSchedule(env.WEEKLY_RECAP_AT);
}

function hasRecentRecap(db: Db, userId: string, nowMs: number): boolean {
  return !!db
    .select({ id: schema.emailOutbox.id })
    .from(schema.emailOutbox)
    .where(and(eq(schema.emailOutbox.toUserId, userId), eq(schema.emailOutbox.kind, RECAP_KIND), gte(schema.emailOutbox.createdAt, nowMs - 6 * DAY_MS)))
    .get();
}

/** Builds one learner's recap of the ISO week before `nowMs`. Exported for tests. */
export function recapFor(db: Db, content: ContentStore, learner: Learner, appUrl: string, nowMs: number) {
  const lastMonday = mondayOf(nowMs) - WEEK_MS;
  const lastWeekKey = isoWeekKey(lastMonday);
  const streak = refreshStreak(db, content, learner.id, nowMs);
  const events = db
    .select({ kind: schema.xpEvents.kind, xp: schema.xpEvents.xp, at: schema.xpEvents.createdAt })
    .from(schema.xpEvents)
    .where(and(eq(schema.xpEvents.userId, learner.id), gte(schema.xpEvents.createdAt, lastMonday)))
    .all()
    .filter((e) => e.at < lastMonday + WEEK_MS);
  const activity = activityByWeek(db, content, learner.id, lastMonday).get(lastWeekKey) ?? { minutes: 0, steps: 0 };
  const record = streak.state.history.find((w) => w.week === lastWeekKey) ?? null;
  const next = nextLesson(db, content, learner.id);
  const row = activeWeek(db, learner.id);
  let upNext: { title: string; href: string }[] = next ? [next] : [];
  if (row) {
    try {
      upNext = weekView(db, content, learner.id, row, { reconcile: false })
        .items.filter((i) => i.status !== "done" && i.status !== "skipped")
        .slice(0, 3)
        .map((i) => ({ title: i.title, href: i.topicId ? `/learn/lesson/${encodeURIComponent(i.topicId)}` : "/learn/plan" }));
    } catch {
      // keep the single next lesson
    }
  }
  return buildWeeklyRecap({
    firstName: firstNameOf(learner.displayName),
    weekLabel: `week ${Number(lastWeekKey.slice(-2))}`,
    xpLastWeek: events.reduce((sum, e) => sum + e.xp, 0),
    lessonsLastWeek: events.filter((e) => e.kind === "lesson_completed").length,
    minutesLastWeek: Math.round(activity.minutes),
    goalMinutes: streak.goal.goalMinutes,
    lastWeek: record ? { met: record.met, frozen: record.frozen } : null,
    streak: { current: streak.state.current, freezesLeft: streak.state.freezesLeft },
    next: upNext,
    appUrl,
  });
}

/**
 * Queues this week's recap for every learner with the weekly email on (the default), once per
 * learner per week, inside the schedule window (Monday 08:00 server-local unless
 * `WEEKLY_RECAP_AT` says otherwise). `force` skips the window check (the admin "run now").
 */
export function queueWeeklyRecaps(
  db: Db,
  content: ContentStore,
  options: { appUrl: string; nowMs?: number; schedule?: RecapSchedule; force?: boolean },
): number {
  const nowMs = options.nowMs ?? Date.now();
  if (!options.force && !recapWindowOpen(new Date(nowMs), options.schedule ?? recapScheduleFromEnv())) return 0;
  let queued = 0;
  for (const learner of learners(db)) {
    if (!settingsFrom(readPrefs(db, learner.id)).weeklyEmail) continue;
    if (hasRecentRecap(db, learner.id, nowMs)) continue;
    const mail = recapFor(db, content, learner, options.appUrl, nowMs);
    db.insert(schema.emailOutbox)
      .values({ id: newId(), toUserId: learner.id, toAddress: learner.username, kind: RECAP_KIND, subject: mail.subject, html: mail.html, text: mail.text, status: "queued", createdAt: nowMs })
      .run();
    queued += 1;
  }
  return queued;
}
