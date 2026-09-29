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

    /* Exactly one thing is said about a run, and it is said here.
    
       This used to mark a path `failed` whenever nothing was added, which put "No course could be
       matched or generated. Check the research provider" on the screen at the same time as the
       tab's own "Nothing was added — no gap needed a course". Both were true and they contradicted
       each other: one said the deployment was broken, the other said there had been nothing to do.
    
       Now a missing research provider is a *notice* on a successful run (`run.ts` writes it, and
       every catalog course it matched is still assigned), and only a run that added nothing while
       something was actually asked for is a failure. */
    const added = outcome.unlocked + outcome.reused + outcome.generated;
    if (outcome.status === "ready" && added === 0 && outcome.failed > 0) {
      setPathStatus(db, outcome.pathId, {
        status: "failed",
        failureReason: `Every course failed to generate. ${outcome.researchReason ?? "Check Admin → AI connection."}`,
      });
    }

    deps.log?.(
      `path ${outcome.pathId}: ${outcome.unlocked} unlocked, ${outcome.reused} reused, ${outcome.generated} generated, ` +
        `${outcome.failed} failed, ${outcome.waitingForResearch ?? 0} waiting for research`,
    );
  };
}
