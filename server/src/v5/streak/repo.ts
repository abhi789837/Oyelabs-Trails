import { and, desc, eq, gte, inArray, ne } from "drizzle-orm";

import { computeStreak, isWeekMet, isoWeekKey, mondayOf, STREAK_MAX_WEEKS, type StreakState, type WeekActivity } from "../../../../shared/streak";
import type { TodayGoal } from "../../../../shared/today";
import { MAX_HOURS_PER_WEEK } from "../../../../shared/weeklyPlan";
import type { ContentStore } from "../../content/store";
import { schema, type Db } from "../../db";
import { now } from "../../lib/ids";
import { stepCountsByWeek, syncMilestoneXp } from "../xp/repo";

/**
 * v5 weekly streak, server side. The rules are pure, in shared/streak.ts; this file gathers the
 * per-week facts and stores the result in `weekly_streaks`.
 *
 * **What counts as time logged in a week** (ISO weeks, UTC):
 * - a curriculum topic completed that week counts its `estMinutes` (the lesson's planned length);
 * - a course lesson ticked off that week counts its `est_minutes`;
 * - video watched on a topic not completed yet counts its watched seconds, in the week the video
 *   was last played (video_progress keeps one running total per video, not a per-day log).
 * A completed topic's video time isn't added on top: the topic's minutes already stand for it.
 *
 * **Steps** (the rule when there's no goal): step awards from the lesson player
 * (`step_completed` XP), plus each topic or course lesson completed.
 *
 * **The goal:** the learner's own `weeklyGoalHours` pref, else the hours the admin set at
 * onboarding, else this week's plan budget, else none (then 3 steps meet the week).
 */

const DEFAULT_TOPIC_MINUTES = 20;
const WEEK_MS = 7 * 86_400_000;

export function goalMinutesFor(db: Db, userId: string): number | null {
  const prefs = db.select({ data: schema.userPrefs.data }).from(schema.userPrefs).where(eq(schema.userPrefs.userId, userId)).get()?.data;
  const pref = prefs?.weeklyGoalHours;
  if (typeof pref === "number" && Number.isFinite(pref) && pref > 0) return Math.round(Math.min(pref, MAX_HOURS_PER_WEEK) * 60);
  return defaultGoalMinutesFor(db, userId);
}

/**
 * The goal a learner has when they haven't picked one: the onboarding hours, else this week's plan
 * budget, else none. Me → Settings names it, so "no goal of my own" doesn't read as "no goal".
 */
export function defaultGoalMinutesFor(db: Db, userId: string): number | null {
  const priorities = db
    .select({ hours: schema.learnerPriorities.hoursPerWeek })
    .from(schema.learnerPriorities)
    .where(eq(schema.learnerPriorities.userId, userId))
    .get();
  if (priorities && priorities.hours > 0) return priorities.hours * 60;

  const week = db
    .select({ budget: schema.weeklyPlans.budgetMinutes })
    .from(schema.weeklyPlans)
    .where(and(eq(schema.weeklyPlans.userId, userId), eq(schema.weeklyPlans.status, "active")))
    .orderBy(desc(schema.weeklyPlans.weekNumber))
    .get();
  return week && week.budget > 0 ? week.budget : null;
}

/** Minutes and steps per ISO week since `sinceMs`. */
export function activityByWeek(db: Db, content: ContentStore, userId: string, sinceMs: number): Map<string, WeekActivity> {
  const out = new Map<string, WeekActivity>();
  const add = (at: number, minutes: number, steps: number) => {
    const key = isoWeekKey(at);
    const entry = out.get(key) ?? { minutes: 0, steps: 0 };
    entry.minutes += minutes;
    entry.steps += steps;
    out.set(key, entry);
  };

  const topics = db
    .select({ topicId: schema.topicProgress.topicId, status: schema.topicProgress.status, completedAt: schema.topicProgress.completedAt })
    .from(schema.topicProgress)
    .where(eq(schema.topicProgress.userId, userId))
    .all();
  const completed = new Set<string>();
  for (const t of topics) {
    if (t.status !== "completed" || t.completedAt === null) continue;
    completed.add(t.topicId);
    if (t.completedAt < sinceMs) continue;
    add(t.completedAt, content.topicIndex.get(t.topicId)?.meta.estMinutes ?? DEFAULT_TOPIC_MINUTES, 1);
  }

  const lessons = db
    .select({ completedAt: schema.courseProgress.completedAt, minutes: schema.courseTopics.estMinutes })
    .from(schema.courseProgress)
    .innerJoin(schema.courseTopics, eq(schema.courseTopics.id, schema.courseProgress.topicId))
    .where(and(eq(schema.courseProgress.userId, userId), gte(schema.courseProgress.completedAt, sinceMs)))
    .all();
  for (const l of lessons) add(l.completedAt, l.minutes, 1);

  const videos = db
    .select({ topicId: schema.videoProgress.topicId, watched: schema.videoProgress.watchedSeconds, updatedAt: schema.videoProgress.updatedAt })
    .from(schema.videoProgress)
    .where(and(eq(schema.videoProgress.userId, userId), gte(schema.videoProgress.updatedAt, sinceMs)))
    .all();
  for (const v of videos) {
    if (completed.has(v.topicId) || v.watched <= 0) continue;
    add(v.updatedAt, v.watched / 60, 0);
  }

  for (const [week, steps] of stepCountsByWeek(db, userId, sinceMs)) {
    const entry = out.get(week) ?? { minutes: 0, steps: 0 };
    entry.steps += steps;
    out.set(week, entry);
  }
  return out;
}

export interface StreakRead {
  state: StreakState;
  goal: TodayGoal;
}

/** Recomputes the streak from the record, stores it, and returns it with this week's goal. */
export function refreshStreak(db: Db, content: ContentStore, userId: string, nowMs = now()): StreakRead {
  const user = db.select({ createdAt: schema.users.createdAt }).from(schema.users).where(eq(schema.users.id, userId)).get();
  const currentWeek = isoWeekKey(nowMs);
  const earliest = mondayOf(nowMs) - STREAK_MAX_WEEKS * WEEK_MS;
  const since = Math.max(mondayOf(user?.createdAt ?? nowMs), earliest);
  const firstWeek = isoWeekKey(since);

  const goalMinutes = goalMinutesFor(db, userId);
  const activity = activityByWeek(db, content, userId, since);
  const state = computeStreak({
    firstWeek,
    currentWeek,
    isMet: (week) => isWeekMet(activity.get(week) ?? { minutes: 0, steps: 0 }, goalMinutes),
  });

  const stored = db.select({ best: schema.weeklyStreaks.best }).from(schema.weeklyStreaks).where(eq(schema.weeklyStreaks.userId, userId)).get();
  state.best = Math.max(state.best, stored?.best ?? 0);
  const values = {
    current: state.current,
    best: state.best,
    lastMetWeek: state.lastMetWeek,
    freezesLeft: state.freezesLeft,
    freezeMonth: state.freezeMonth,
    history: state.history,
    updatedAt: nowMs,
  };
  db.insert(schema.weeklyStreaks)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: schema.weeklyStreaks.userId, set: values })
    .run();

  const thisWeek = activity.get(currentWeek) ?? { minutes: 0, steps: 0 };
  return {
    state,
    goal: {
      week: currentWeek,
      goalMinutes,
      loggedMinutes: Math.round(thisWeek.minutes),
      steps: thisWeek.steps,
      met: state.metThisWeek,
    },
  };
}

/** Every active learner's streak and milestone XP. Run nightly so a streak is right before anyone looks. */
export function recomputeAllStreaks(db: Db, content: ContentStore, nowMs = now()): number {
  const users = db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.status, "active"), inArray(schema.users.role, ["learner"]), ne(schema.users.mustChangePassword, true)))
    .all();
  let done = 0;
  for (const user of users) {
    try {
      syncMilestoneXp(db, user.id);
      refreshStreak(db, content, user.id, nowMs);
      done += 1;
    } catch {
      // One learner's bad row must not stop everyone else's streak.
    }
  }
  return done;
}

/**
 * The nightly pass. Read paths recompute too, so this only matters for things that read the stored
 * row without recomputing (a future weekly email, admin reports).
 */
export function startNightlyStreaks(options: { db: Db; content: ContentStore; log?: (message: string) => void; intervalMs?: number }): () => void {
  const run = () => {
    try {
      const count = recomputeAllStreaks(options.db, options.content);
      options.log?.(`weekly streaks: ${count} learner(s) recomputed`);
    } catch (error) {
      options.log?.(`weekly streaks failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  const initial = setTimeout(run, 60_000);
  initial.unref?.();
  const timer = setInterval(run, options.intervalMs ?? 24 * 60 * 60 * 1000);
  timer.unref?.();
  return () => {
    clearTimeout(initial);
    clearInterval(timer);
  };
}

/** Kept for callers that only need the stored row (no recompute). */
export function storedStreak(db: Db, userId: string) {
  return db.select().from(schema.weeklyStreaks).where(eq(schema.weeklyStreaks.userId, userId)).get() ?? null;
}
