import { and, eq, isNull } from "drizzle-orm";

import { schema, type Db } from "../db";
import { writeAudit } from "../lib/audit";
import { badRequest, conflict, notFound } from "../lib/errors";
import { now } from "../lib/ids";
import { countBankScore, feedbackJson, recomputeEvaluation } from "./scoring";
import { itemsOf, keyOf } from "./v4";

/**
 * v4.4 Phase 6: an admin listens to a spoken answer and marks it **Full marks** or **Not yet** in one
 * click. Built for Phase 3b's "needs a listen" items (a recording no machine could turn into text),
 * and allowed on any spoken answer once the test is handed in.
 *
 * It reuses Phase 4's machinery: Full marks is an override (`review_status = overridden`, score 1,
 * which `applyVerdict` and the re-score keep), Not yet is upheld at 0. The stored feedback gets
 * `met` so a later re-score reaches the same verdict, the bank stats count the mark, the result is
 * recomputed (`recomputeEvaluation`), and the decision is audit-logged.
 */

export type HandMark = "full" | "not_yet";

const MARKABLE = new Set(["submitted", "evaluating", "completed"]);

export function markSpokenAnswer(db: Db, actor: { id: string; displayName?: string }, assessmentId: string, itemId: string, mark: HandMark, note = ""): { levelsChanged: boolean } {
  const assessment = db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get();
  if (!assessment) throw notFound("We couldn't find that test.");
  const item = itemsOf(db, assessmentId).find((i) => i.id === itemId);
  if (!item) throw notFound("We couldn't find that answer in this test.");
  if (keyOf(item).task?.kind !== "speak") throw badRequest("Only spoken answers can be marked this way.");
  if (!MARKABLE.has(assessment.status)) throw conflict("They haven't handed the test in yet. Mark it after they finish.");

  const at = now();
  const full = mark === "full";
  const score = full ? 1 : 0;
  const reason = note.trim() || (full ? "Full marks after a listen." : "Not yet, after a listen.");
  const feedback = { ...(feedbackJson(item) ?? { kind: "speak", mode: "spoken" }), needsListen: false, markedByHand: true, met: full, reason };
  db.update(schema.assessmentItems)
    .set({
      score,
      rawScore: score,
      autoScore: score,
      verdict: full ? "full" : "not_yet",
      verdictNote: null,
      aiFeedback: JSON.stringify(feedback),
      reviewStatus: full ? "overridden" : "upheld",
      reviewNote: reason.slice(0, 500),
      reviewedBy: actor.id,
      reviewedAt: at,
    })
    .where(eq(schema.assessmentItems.id, item.id))
    .run();

  // The bank's stats: a first mark counts once; a change of mind moves the sum.
  if (item.bankItemId) {
    if (item.score == null) countBankScore(db, item.bankItemId, score);
    else if (item.score !== score) {
      const bank = db.select({ scoreSum: schema.questionBank.scoreSum }).from(schema.questionBank).where(eq(schema.questionBank.id, item.bankItemId)).get();
      if (bank) db.update(schema.questionBank).set({ scoreSum: bank.scoreSum + (score - item.score) }).where(eq(schema.questionBank.id, item.bankItemId)).run();
    }
  }

  // An open "please check again" request on this answer is answered by the same decision.
  db.update(schema.reviewRequests)
    .set({ status: full ? "overridden" : "upheld", resolvedBy: actor.id, resolvedAt: at, resolution: reason })
    .where(and(eq(schema.reviewRequests.source, "assessment_item"), eq(schema.reviewRequests.refId, item.id), eq(schema.reviewRequests.status, "open"), isNull(schema.reviewRequests.resolvedAt)))
    .run();

  const { levelsChanged } = recomputeEvaluation(db, assessmentId, "listen");
  writeAudit(db, {
    actorId: actor.id,
    action: "assessment.speak_marked",
    targetType: "assessment",
    targetId: assessmentId,
    details: { itemId: item.id, mark, before: item.score, needsListen: Boolean(feedbackJson(item)?.needsListen), levelsChanged },
  });
  return { levelsChanged };
}

/** Spoken answers on a test still waiting for a person to listen (no score, flagged by the grader). */
export function speakToListen(db: Db, assessmentId: string): number {
  return itemsOf(db, assessmentId).filter((item) => item.score == null && feedbackJson(item)?.needsListen === true).length;
}
