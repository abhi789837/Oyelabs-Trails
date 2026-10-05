import { desc, eq, gte } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { V4Result } from "../../../../shared/assessmentV4";
import { computeResult, getMinFinishMinutes, isV4, itemsOf, keyOf, setMinFinishMinutes, splitItem, toSheetItem } from "../../assessment/v4";
import { markSpokenAnswer } from "../../assessment/markByHand";
import { generateOne, swapCandidate } from "../../assessment/personalise/pipeline";
import { timingConstants } from "../../bank/timing";
import { estimateSeconds } from "../../../../shared/timing";
import type { BankItem } from "../../../../shared/bank";
import type { Slot } from "../../../../shared/personalise";
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

  /** v4.1: estimated vs actual time per finished v4 assessment, newest first (the admin chart). */
  app.get("/api/admin/assessments/timing", async (request) => {
    const { days } = parseOrThrow(z.object({ days: z.coerce.number().int().min(1).max(365).default(90) }), request.query);
    const since = Date.now() - days * 86_400_000;
    const rows = app.db.select().from(schema.assessments).where(gte(schema.assessments.createdAt, since)).orderBy(desc(schema.assessments.createdAt)).all();
    const users = new Map(app.db.select({ id: schema.users.id, name: schema.users.displayName }).from(schema.users).all().map((u) => [u.id, u.name]));
    return {
      constants: timingConstants(app.db),
      assessments: rows
        .filter((a) => isV4(a) && a.startedAt && a.submittedAt)
        .map((a) => {
          const items = itemsOf(app.db, a.id);
          return {
            assessmentId: a.id,
            learner: users.get(a.userId) ?? "(deleted)",
            submittedAt: a.submittedAt,
            estSeconds: items.reduce((s, i) => s + (i.estSeconds ?? 0), 0),
            actualSeconds: Math.round((a.submittedAt! - a.startedAt!) / 1000),
            costMicros: ((a.config as { personalisation?: { costMicros?: number } }).personalisation?.costMicros ?? 0),
          };
        }),
    };
  });

  app.put("/api/admin/assessment-settings", async (request) => {
    const actor = requireStaff(request);
    const body = parseOrThrow(z.object({ minFinishMinutes: z.number().int().min(0).max(45).nullable() }), request.body);
    setMinFinishMinutes(app.db, body.minFinishMinutes);
    writeAudit(app.db, { actorId: actor.id, action: "assessment.settings_updated", details: body });
    return { minFinishMinutes: getMinFinishMinutes(app.db) };
  });

  /**
   * v4.1: swap one item for another bank item, or have the model write a new one (one small call).
   * Allowed before the learner starts and, after, on any item they have not submitted.
   */
  const replaceTarget = (assessmentId: string, itemId: string) => {
    const assessment = app.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get();
    if (!assessment) throw notFound("No such assessment.");
    if (!isV4(assessment) || !["ready", "in_progress"].includes(assessment.status)) throw conflict("Only a ready or running v4 assessment can be changed.");
    const item = app.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, itemId)).get();
    if (!item || item.assessmentId !== assessmentId) throw notFound("No such question.");
    if (item.lockedAt) throw conflict("The learner has already submitted this question.");
    const key = keyOf(item);
    const payload = item.payload as { task?: { kind?: string }; snippet?: string | null };
    const slot: Slot = {
      index: item.position ?? 0,
      skillId: item.area,
      skillName: key.skillName,
      group: key.group === "filler" ? "other" : key.group,
      type: key.type,
      subtype: (key.type === "coding" ? "code" : key.type === "mcq" ? (payload.snippet ? "mcq-code" : "mcq-text") : (payload.task?.kind ?? "scenario")) as Slot["subtype"],
      difficulty: item.difficulty,
      targetSec: key.type === "mcq" ? 50 : 80,
      hint: "",
    };
    return { assessment, item, slot };
  };

  const writeReplacement = (
    assessmentId: string,
    item: typeof schema.assessmentItems.$inferSelect,
    slot: Slot,
    replacement: BankItem,
    origin: "bank" | "generated",
    actorId: string,
    action: string,
  ) => {
    const { payload, key } = splitItem(replacement, slot.skillId, slot.skillName, slot.group, `${assessmentId}:${item.position}:${replacement.id}`);
    const est = estimateSeconds(replacement, timingConstants(app.db));
    app.db
      .update(schema.assessmentItems)
      .set({ payload: { ...payload, estSeconds: est }, key, bankItemId: replacement.id, difficulty: replacement.difficulty, estSeconds: est, origin, draft: null, runsUsed: 0, flagged: false })
      .where(eq(schema.assessmentItems.id, item.id))
      .run();
    writeAudit(app.db, { actorId, action, targetType: "assessment", targetId: assessmentId, details: { itemId: item.id, bankItemId: replacement.id } });
  };

  const itemParams = z.object({ assessmentId: z.string().min(1).max(64), itemId: z.string().min(1).max(64) });

  app.post("/api/admin/assessments/:assessmentId/items/:itemId/swap", async (request) => {
    const actor = requireStaff(request);
    const { assessmentId, itemId } = parseOrThrow(itemParams, request.params);
    const { assessment, item, slot } = replaceTarget(assessmentId, itemId);
    const onSheet = new Set(itemsOf(app.db, assessmentId).map((i) => i.bankItemId).filter((x): x is string => Boolean(x)));
    const department = (assessment.config as { departmentId?: string }).departmentId ?? "engineering";
    const replacement = swapCandidate(app.db, assessment.userId, department, slot, onSheet);
    if (!replacement) throw conflict("The question library has no other question for this skill and type.");
    writeReplacement(assessmentId, item, slot, replacement, "bank", actor.id, "assessment.item_swapped");
    return { ok: true };
  });

  /** v4.4 P6: an admin listened to a spoken answer and marks it Full marks or Not yet. */
  app.post("/api/admin/assessments/:assessmentId/items/:itemId/mark", async (request) => {
    const actor = requireStaff(request);
    const { assessmentId, itemId } = parseOrThrow(itemParams, request.params);
    const body = parseOrThrow(z.object({ mark: z.enum(["full", "not_yet"]), note: z.string().max(500).default("") }), request.body);
    return { ok: true, ...markSpokenAnswer(app.db, actor, assessmentId, itemId, body.mark, body.note) };
  });

  app.post("/api/admin/assessments/:assessmentId/items/:itemId/regenerate", async (request) => {
    const actor = requireStaff(request);
    const { assessmentId, itemId } = parseOrThrow(itemParams, request.params);
    const { assessment, item, slot } = replaceTarget(assessmentId, itemId);
    if (!app.ai.isConfigured()) throw conflict("The AI isn't connected yet. Use Swap to pick another question from the library.");
    const result = await generateOne({ db: app.db, ai: app.ai, sandbox: app.sandbox, piston: app.piston }, assessmentId, assessment.userId, slot);
    if (!result.item) throw conflict(`The new item did not pass its checks (${result.problems.join("; ").slice(0, 200)}). The old one is kept.`);
    writeReplacement(assessmentId, item, slot, result.item, "generated", actor.id, "assessment.item_regenerated");
    return { ok: true };
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
          // v4.4: Full marks / Not yet, the grader's own 0..1, the note and any review.
          rawScore: item.rawScore,
          verdict: item.verdict ?? null,
          verdictNote: item.verdictNote ?? null,
          reviewStatus: item.reviewStatus ?? null,
          feedback: item.aiFeedback,
          origin: item.origin ?? null,
          activeMs: item.activeMs,
          answer: key.mcq ? { correctIndex: key.mcq.correctIndex, explanation: key.mcq.explanation } : key.task ? { task: key.task } : null,
        };
      }),
    };
  });
}
