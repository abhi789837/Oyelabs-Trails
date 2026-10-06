import { eq } from "drizzle-orm";
import { z } from "zod";

import { settingsFrom } from "../../../../shared/me";
import { isValidTimeZone, MAX_WEEKLY_GOAL_HOURS, type MotivationPrefs } from "../../../../shared/motivation";
import { schema, type Db } from "../../db";

/**
 * The motivation keys in `user_prefs.data` (docs/v5/PLAN.md, "Prefs keys"). Phase 4's settings
 * API owns theme, reminders, quiet hours, celebrations and the weekly email; these are the keys
 * it doesn't cover: weeklyGoalHours, leaderboardOptIn, welcomeDoneAt, plus timeZone (new, so a
 * reminder at "18:00" means the learner's 18:00). Writes merge; every other key is kept.
 */

export function readPrefs(db: Db, userId: string): Record<string, unknown> {
  return db.select().from(schema.userPrefs).where(eq(schema.userPrefs.userId, userId)).get()?.data ?? {};
}

export function writePrefs(db: Db, userId: string, change: Record<string, unknown>, at = Date.now()): Record<string, unknown> {
  const data = { ...readPrefs(db, userId) };
  for (const [key, value] of Object.entries(change)) if (value !== undefined) data[key] = value;
  db.insert(schema.userPrefs)
    .values({ userId, data, updatedAt: at })
    .onConflictDoUpdate({ target: schema.userPrefs.userId, set: { data, updatedAt: at } })
    .run();
  return data;
}

export function motivationPrefsFrom(data: Record<string, unknown>): MotivationPrefs {
  const settings = settingsFrom(data);
  const goal = data.weeklyGoalHours;
  const done = data.welcomeDoneAt;
  return {
    celebrations: settings.celebrations,
    reducedMotion: settings.reducedMotion,
    weeklyGoalHours: typeof goal === "number" && Number.isFinite(goal) && goal > 0 ? Math.min(goal, MAX_WEEKLY_GOAL_HOURS) : null,
    leaderboardOptIn: data.leaderboardOptIn === true,
    welcomeDoneAt: typeof done === "number" && Number.isFinite(done) ? done : null,
    timeZone: isValidTimeZone(data.timeZone) ? data.timeZone : null,
  };
}

export const motivationPrefsPatchSchema = z
  .object({
    /** Hours a week, 0.5 steps; null clears it (the admin's hours or the 3 steps rule apply). */
    weeklyGoalHours: z
      .number()
      .min(0.5)
      .max(MAX_WEEKLY_GOAL_HOURS)
      .refine((n) => Number.isInteger(n * 2), "Use whole or half hours.")
      .nullable(),
    leaderboardOptIn: z.boolean(),
    /** true marks the welcome as seen now; false shows it again next time. */
    welcomeDone: z.boolean(),
    timeZone: z.string().max(64).refine(isValidTimeZone, "Unknown time zone."),
  })
  .partial()
  .strict();
export type MotivationPrefsPatch = z.infer<typeof motivationPrefsPatchSchema>;

export function applyPrefsPatch(db: Db, userId: string, patch: MotivationPrefsPatch, at = Date.now()): MotivationPrefs {
  const change: Record<string, unknown> = {};
  if (patch.weeklyGoalHours !== undefined) change.weeklyGoalHours = patch.weeklyGoalHours;
  if (patch.leaderboardOptIn !== undefined) change.leaderboardOptIn = patch.leaderboardOptIn;
  if (patch.welcomeDone !== undefined) change.welcomeDoneAt = patch.welcomeDone ? at : null;
  if (patch.timeZone !== undefined) change.timeZone = patch.timeZone;
  return motivationPrefsFrom(writePrefs(db, userId, change, at));
}
