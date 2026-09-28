import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import type { EvaluationResult } from "../../../../shared/assessment";
import type { AiService } from "../../ai/service";
import { setPathStatus } from "../../builder/repo";
import { runBuilder } from "../../builder/run";
import { schema, type Db } from "../../db";
import type { Env } from "../../env";
import type { Job } from "../queue";

const payloadSchema = z.object({
  userId: z.string().min(1).max(64),
  assessmentId: z.string().min(1).max(64).nullable().optional(),
});

/**
 * `path.build` — works out one learner's path, in the background.
 *
 * Queued when an evaluation lands, and on demand from the admin console. Generation is minutes of
 * provider calls, so it cannot happen inside a request; and because it is a job, the queue's
 * existing retry and backoff apply without anything new being written.
 *
 * Deliberately thin. Everything interesting is in `runBuilder`, which takes its clients as
 * arguments and is therefore testable without a queue.
 */
export function buildPathHandler(deps: { db: Db; env: Env; ai: AiService; log?: (message: string) => void }) {
  return async (job: Job): Promise<void> => {
    const payload = payloadSchema.parse(job.payload);
    const { db } = deps;

    const assessmentId =
      payload.assessmentId ??
      db
        .select({ id: schema.assessments.id })
        .from(schema.assessments)
        .where(eq(schema.assessments.userId, payload.userId))
        .orderBy(desc(schema.assessments.attemptNo))
        .get()?.id ??
      null;

    const evaluationRow = assessmentId
      ? db
          .select()
          .from(schema.evaluations)
          .where(eq(schema.evaluations.assessmentId, assessmentId))
          .orderBy(desc(schema.evaluations.createdAt))
          .get()
      : undefined;

    const profile = db
      .select({ adminNotes: schema.learnerProfiles.adminNotes })
      .from(schema.learnerProfiles)
      .where(eq(schema.learnerProfiles.userId, payload.userId))
      .get();

    const outcome = await runBuilder(
      {
        userId: payload.userId,
        assessmentId,
        evaluation: (evaluationRow?.result as EvaluationResult | undefined) ?? null,
        adminNotes: profile?.adminNotes ?? "",
      },
      { db, env: deps.env, ai: deps.ai },
    );

    /* A run that matched nothing and generated nothing is a failure worth surfacing, not a quiet
       "ready" with an empty path. The usual cause is a missing research key, which somebody can fix
       in thirty seconds once they are told — and never will, if the path just looks empty. */
    if (outcome.status === "ready" && outcome.failed > 0 && outcome.generated === 0 && outcome.unlocked === 0) {
      setPathStatus(db, outcome.pathId, {
        status: "failed",
        failureReason:
          "No course could be matched or generated. Check the research provider under Admin → AI connection.",
      });
    }

    deps.log?.(
      `path ${outcome.pathId}: ${outcome.unlocked} unlocked, ${outcome.reused} reused, ${outcome.generated} generated, ${outcome.failed} failed`,
    );
  };
}
