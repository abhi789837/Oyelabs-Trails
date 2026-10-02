import { desc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { V4Result } from "../../../../shared/assessmentV4";
import { computeResult, getMinFinishMinutes, isV4, itemsOf, keyOf, setMinFinishMinutes, toSheetItem } from "../../assessment/v4";
import { requireStaff, staffOnly } from "../../auth/guards";
import { schema } from "../../db";
import { writeAudit } from "../../lib/audit";
import { conflict, notFound, parseOrThrow } from "../../lib/errors";
import { getSetup } from "../../setup/repo";

const params = z.object({ assessmentId: z.string().min(1).max(64) });

/** Admin views of a v4 sitting, and the one assessment-wide setting (minimum time before Finish). */
export async function registerAdminAssessmentV4Routes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", staffOnly);

  app.get("/api/admin/assessment-settings", async () => ({ minFinishMinutes: getMinFinishMinutes(app.db) }));

  app.put("/api/admin/assessment-settings", async (request) => {
    const actor = requireStaff(request);
    const body = parseOrThrow(z.object({ minFinishMinutes: z.number().int().min(0).max(45).nullable() }), request.body);
    setMinFinishMinutes(app.db, body.minFinishMinutes);
    writeAudit(app.db, { actorId: actor.id, action: "assessment.settings_updated", details: body });
    return { minFinishMinutes: getMinFinishMinutes(app.db) };
  });

  /** Every question with the learner's answer, the key and the score, plus the report. */
  app.get("/api/admin/assessments/:assessmentId/v4", async (request) => {
    const { assessmentId } = parseOrThrow(params, request.params);
    const assessment = app.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get();
    if (!assessment) throw notFound("No such assessment.");
    if (!isV4(assessment)) throw conflict("This assessment uses the older format.");
    const items = itemsOf(app.db, assessmentId);
    const evaluation = app.db
      .select()
      .from(schema.evaluations)
      .where(eq(schema.evaluations.assessmentId, assessmentId))
      .orderBy(desc(schema.evaluations.createdAt))
      .get();
    const result = (evaluation?.result as V4Result | undefined) ?? computeResult(items, getSetup(app.db, assessment.userId).priorities);
    return {
      config: assessment.config,
      result,
      items: items.map((item) => {
        const key = keyOf(item);
        return {
          ...toSheetItem(item),
          difficulty: item.difficulty,
          bankItemId: item.bankItemId,
          response: item.response ?? null,
          score: item.score,
          feedback: item.aiFeedback,
          answer: key.mcq ? { correctIndex: key.mcq.correctIndex, explanation: key.mcq.explanation } : key.task ? { task: key.task } : null,
        };
      }),
    };
  });
}
