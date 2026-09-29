import { and, eq } from "drizzle-orm";
import { z } from "zod";

import type { AiService } from "../../ai/service";
import type { ContentStore } from "../../content/store";
import { schema, type Db } from "../../db";
import { generateWeek } from "../../plans/weekly/generate";
import { activeWeek } from "../../plans/weekly/repo";
import type { Job } from "../queue";

const payloadSchema = z.object({
  userId: z.string().min(1).max(64),
  /** The rules-built week this was queued for. Stale if the learner has moved on since. */
  planId: z.string().min(1).max(64),
});

/**
 * `week.refine` — lets a model improve a week that has already been built and served.
 *
 * ## Why this is a job at all
 *
 * It was not, and that was a bug that made `/plan` unusable: `ensureWeek` ran the model call inside
 * `GET /api/me/week`. On a server with a real credential that is a 120-second timeout, a retry
 * policy and a concurrency semaphore of two — so the learner's page sat on its skeleton for minutes
 * and usually never resolved at all. `buildPathHandler` already says the rule in its own doc
 * comment: generation is minutes of provider calls, so it cannot happen inside a request.
 *
 * So the read path now builds the week deterministically, which is milliseconds and always works,
 * and this runs afterwards to improve the prose and the lane ordering. A learner who never comes
 * back still had a correct week; one who reloads a minute later gets the better one.
 *
 * ## When it declines to do anything
 *
 * Refining replaces the week, so it only runs while that is harmless:
 *
 * - the week it was queued for must still be the active one — the learner may have advanced;
 * - nothing in it may be finished yet, because replacing a week somebody has started would move
 *   items out from under them;
 * - it must still be young. A week refined on Thursday is a week that changed on Thursday.
 */
const MAX_AGE_MS = 10 * 60_000;

export function refineWeekHandler(deps: {
  db: Db;
  content: ContentStore;
  ai: AiService;
  log?: (message: string) => void;
}) {
  return async (job: Job): Promise<void> => {
    const { userId, planId } = payloadSchema.parse(job.payload);
    const { db } = deps;

    if (!deps.ai.isConfigured()) return;

    const current = activeWeek(db, userId);
    if (!current || current.id !== planId) {
      deps.log?.(`week refine skipped: ${planId} is no longer the active week`);
      return;
    }
    if (Date.now() - current.createdAt > MAX_AGE_MS) {
      deps.log?.(`week refine skipped: ${planId} is too old to replace quietly`);
      return;
    }

    const started = db
      .select({ id: schema.weeklyPlanItems.id })
      .from(schema.weeklyPlanItems)
      .where(and(eq(schema.weeklyPlanItems.planId, planId), eq(schema.weeklyPlanItems.status, "done")))
      .get();
    if (started) {
      deps.log?.(`week refine skipped: ${planId} has already been started`);
      return;
    }

    /* Reshapes in place — same week number, same dates. The learner is not moved to a new week by a
       background job; they get a better version of the one they already have. */
    const result = await generateWeek(
      { db, content: deps.content, ai: deps.ai, log: deps.log },
      { userId, rulesOnly: false },
    );

    deps.log?.(`week ${result.weekNumber} refined for ${userId} (source: ${result.source})`);
  };
}
