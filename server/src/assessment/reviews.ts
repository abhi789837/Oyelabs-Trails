import { and, desc, eq, inArray } from "drizzle-orm";

import { QUIZ_PASS_THRESHOLD } from "../../../shared/content";
import type { ItemResponseV4 } from "../../../shared/assessmentV4";
import type { ReviewRequestBody, ReviewRequestView, ReviewSource } from "../../../shared/scoring";
import type { ContentStore } from "../content/store";
import { schema, type Db } from "../db";
import { achieveGoalsForTopic } from "../goals/repo";
import { writeAudit } from "../lib/audit";
import { badRequest, conflict, notFound } from "../lib/errors";
import { newId, now } from "../lib/ids";
import { notify, staffIds } from "../lib/notify";
import { gradeTopicQuiz, payloadOf, servedIdOf } from "../topicTests/repo";
import { feedbackJson, recomputeEvaluation } from "./scoring";
import { keyOf, toSheetItem } from "./v4";

/**
 * v4.4 Phase 4: "Request review". A learner asks for one Not-yet answer to be looked at again; an
 * admin gives full marks (override) or keeps "Not yet" (uphold). An override goes in the audit log,
 * counts as a pass for the question's stats, and recomputes the learner's result.
 *
 * `refId` is an assessment item id (`assessment_item`), a topic test item id (`topic_item`, a quiz
 * question, with the attempt it was answered in), or a topic id (`topic_item`, a code challenge).
 */

type RequestRow = typeof schema.reviewRequests.$inferSelect;
type ItemRow = typeof schema.assessmentItems.$inferSelect;
type AttemptRow = typeof schema.topicAttempts.$inferSelect;

interface Resolved {
  kind: "assessment" | "quiz" | "code";
  item?: ItemRow;
  attempt?: AttemptRow;
  testItem?: typeof schema.topicTestItems.$inferSelect;
}

function openRequestFor(db: Db, userId: string, source: ReviewSource, refId: string): RequestRow | undefined {
  return db
    .select()
    .from(schema.reviewRequests)
    .where(and(eq(schema.reviewRequests.userId, userId), eq(schema.reviewRequests.source, source), eq(schema.reviewRequests.refId, refId), eq(schema.reviewRequests.status, "open")))
    .get();
}

function sameSet(a: readonly number[], b: readonly number[]): boolean {
  const x = [...new Set(a)].sort((m, n) => m - n);
  const y = [...new Set(b)].sort((m, n) => m - n);
  return x.length === y.length && x.every((v, i) => v === y[i]);
}

function keyIndicesOf(p: { correctIndex: number; correctIndices?: number[] }): number[] {
  return p.correctIndices && p.correctIndices.length > 1 ? p.correctIndices : [p.correctIndex];
}

/** Finds what a request points at and checks it is the learner's own Not-yet answer. */
function resolveTarget(db: Db, userId: string, body: Pick<ReviewRequestBody, "source" | "refId" | "attemptId">): Resolved {
  if (body.source === "assessment_item") {
    const item = db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, body.refId)).get();
    const assessment = item && db.select().from(schema.assessments).where(eq(schema.assessments.id, item.assessmentId)).get();
    if (!item || !assessment || assessment.userId !== userId) throw notFound("We couldn't find that answer.");
    if (!item.lockedAt) throw conflict("This answer hasn't been submitted yet.");
    if (item.verdict !== "not_yet") throw conflict("Only answers marked Not yet can be reviewed.");
    return { kind: "assessment", item };
  }
  if (!body.attemptId) throw badRequest("Say which attempt this answer is from.");
  const attempt = db.select().from(schema.topicAttempts).where(eq(schema.topicAttempts.id, body.attemptId)).get();
  if (!attempt || attempt.userId !== userId) throw notFound("We couldn't find that attempt.");
  if (attempt.kind === "code") {
    if (attempt.topicId !== body.refId) throw badRequest("That attempt is from another topic.");
    if (attempt.passed) throw conflict("This attempt already passed.");
    return { kind: "code", attempt };
  }
  const testItem = db.select().from(schema.topicTestItems).where(eq(schema.topicTestItems.id, body.refId)).get();
  if (!testItem || testItem.topicId !== attempt.topicId) throw notFound("We couldn't find that question.");
  const answers = (attempt.answers ?? {}) as Record<string, number[]>;
  const chosen = answers[servedIdOf(testItem)];
  if (!chosen) throw badRequest("That question wasn't in this attempt.");
  if (sameSet(chosen, keyIndicesOf(payloadOf(testItem)))) throw conflict("Only answers marked Not yet can be reviewed.");
  return { kind: "quiz", attempt, testItem };
}

export function createReviewRequest(db: Db, user: { id: string; displayName?: string }, body: ReviewRequestBody): RequestRow {
  resolveTarget(db, user.id, body);
  if (openRequestFor(db, user.id, body.source, body.refId)) throw conflict("You already asked for a review of this answer.");
  const row: RequestRow = {
    id: newId(),
    userId: user.id,
    source: body.source,
    refId: body.refId,
    attemptId: body.attemptId ?? null,
    status: "open",
    learnerNote: body.note ?? "",
    createdAt: now(),
    resolvedBy: null,
    resolvedAt: null,
    resolution: null,
  };
  db.insert(schema.reviewRequests).values(row).run();
  if (body.source === "assessment_item") {
    db.update(schema.assessmentItems).set({ reviewStatus: "requested" }).where(eq(schema.assessmentItems.id, body.refId)).run();
  }
  const name = user.displayName ?? db.select({ n: schema.users.displayName }).from(schema.users).where(eq(schema.users.id, user.id)).get()?.n ?? "A learner";
  for (const recipientId of staffIds(db)) {
    notify(db, {
      recipientId,
      kind: "review.requested",
      title: `${name} asked for a review`,
      body: "They think one of their answers deserves full marks. Have a look and decide.",
      link: "/admin/reviews",
    });
  }
  return row;
}

/** The learner's own requests, newest first (the UI shows "Review requested" from these). */
export function myReviewRequests(db: Db, userId: string) {
  return db
    .select()
    .from(schema.reviewRequests)
    .where(eq(schema.reviewRequests.userId, userId))
    .orderBy(desc(schema.reviewRequests.createdAt))
    .limit(200)
    .all()
    .map((r) => ({ id: r.id, source: r.source, refId: r.refId, attemptId: r.attemptId, status: r.status, resolution: r.resolution, createdAt: r.createdAt }));
}

// ---------------------------------------------------------------------------
// Admin view
// ---------------------------------------------------------------------------

function describeAnswer(item: ItemRow): string {
  const response = item.response as ItemResponseV4 | null;
  if (!response) return "(no answer)";
  if ("unknown" in response) return "I don't know yet";
  if ("code" in response) return response.code;
  if ("choice" in response) {
    const options = (item.payload as { options?: string[] }).options ?? [];
    return options[response.choice] ?? `Option ${response.choice + 1}`;
  }
  if ("task" in response) {
    const t = response.task as Record<string, unknown>;
    if (typeof t.text === "string") return t.text;
    if (typeof t.fallbackText === "string" && t.fallbackText) return t.fallbackText;
    if (t.values && typeof t.values === "object") {
      return Object.entries(t.values as Record<string, unknown>)
        .map(([k, v]) => `${k}: ${String(v)}`)
        .join("\n");
    }
    return JSON.stringify(t).slice(0, 2000);
  }
  return "(no answer)";
}

function describeReason(item: ItemRow): string {
  const detail = feedbackJson(item);
  if (typeof detail?.reason === "string" && detail.reason) return [detail.reason, typeof detail.tip === "string" ? detail.tip : ""].filter(Boolean).join(" ");
  if (typeof detail?.passed === "number" && typeof detail.total === "number") {
    return `${detail.passed} of ${detail.total} checks passed${typeof detail.compileError === "string" && detail.compileError ? `; the code did not run: ${detail.compileError}` : ""}.`;
  }
  if (Array.isArray(detail?.lines)) return (detail!.lines as unknown[]).map(String).join(" ");
  const key = keyOf(item);
  if (key.mcq) return `Not the right option. ${key.mcq.explanation}`;
  return item.verdictNote ?? item.aiFeedback ?? "Marked Not yet.";
}

export function listReviewRequests(db: Db, content: ContentStore, filter: { status?: "open" | "all"; userId?: string }): ReviewRequestView[] {
  const conditions = [
    ...(filter.status === "all" ? [] : [eq(schema.reviewRequests.status, "open" as const)]),
    ...(filter.userId ? [eq(schema.reviewRequests.userId, filter.userId)] : []),
  ];
  const rows = db
    .select()
    .from(schema.reviewRequests)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(schema.reviewRequests.createdAt))
    .limit(200)
    .all();
  const userIds = [...new Set(rows.map((r) => r.userId))];
  const names = new Map(
    userIds.length ? db.select({ id: schema.users.id, n: schema.users.displayName }).from(schema.users).where(inArray(schema.users.id, userIds)).all().map((u) => [u.id, u.n]) : [],
  );
  return rows.map((r) => {
    const base = {
      id: r.id,
      userId: r.userId,
      learnerName: names.get(r.userId) ?? "(deleted)",
      source: r.source,
      refId: r.refId,
      attemptId: r.attemptId,
      status: r.status,
      learnerNote: r.learnerNote,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
      resolution: r.resolution,
    };
    if (r.source === "assessment_item") {
      const item = db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, r.refId)).get();
      if (!item) return { ...base, where: "Assessment", question: "(question removed)", answer: "", reason: "" };
      return { ...base, where: `Assessment: ${keyOf(item).skillName}`, question: toSheetItem(item).prompt, answer: describeAnswer(item), reason: describeReason(item) };
    }
    const attempt = r.attemptId ? db.select().from(schema.topicAttempts).where(eq(schema.topicAttempts.id, r.attemptId)).get() : undefined;
    const topic = attempt ? content.getTopic(attempt.topicId)?.topic : undefined;
    const where = topic ? `Topic test: ${topic.title}` : "Topic test";
    if (attempt?.kind === "code") {
      return {
        ...base,
        where,
        question: topic?.codeChallenge?.instructions ?? "Code challenge",
        answer: attempt.code ?? "",
        reason: `${attempt.score}% of the tests passed; some main tests did not.`,
      };
    }
    const testItem = db.select().from(schema.topicTestItems).where(eq(schema.topicTestItems.id, r.refId)).get();
    if (!testItem) return { ...base, where, question: "(question removed)", answer: "", reason: "" };
    const p = payloadOf(testItem);
    const chosen = ((attempt?.answers ?? {}) as Record<string, number[]>)[servedIdOf(testItem)] ?? [];
    return {
      ...base,
      where,
      question: p.prompt,
      answer: chosen.map((i) => p.options[i] ?? `Option ${i + 1}`).join("; ") || "(no answer)",
      reason: `The right answer: ${keyIndicesOf(p).map((i) => p.options[i]).join("; ")}. ${p.explanation}`,
    };
  });
}

// ---------------------------------------------------------------------------
// Decisions
// ---------------------------------------------------------------------------

/** Re-grades a quiz attempt counting the overridden questions as right, and records a new pass. */
function regradeQuizAttempt(db: Db, content: ContentStore, attempt: AttemptRow): { score: number; passed: boolean } {
  const topic = content.getTopic(attempt.topicId)?.topic;
  if (!topic) return { score: attempt.score, passed: attempt.passed };
  const answers = (attempt.answers ?? {}) as Record<string, number[]>;
  const overriddenRows = db
    .select({ refId: schema.reviewRequests.refId })
    .from(schema.reviewRequests)
    .where(and(eq(schema.reviewRequests.attemptId, attempt.id), eq(schema.reviewRequests.status, "overridden")))
    .all()
    .map((r) => r.refId);
  const { result, itemResults } = gradeTopicQuiz(db, topic, answers);
  const overridden = new Set(itemResults.filter((r) => overriddenRows.includes(r.rowId)).map((r) => r.servedId));
  const answered = result.perQuestion.filter((q) => q.id in answers || overridden.has(q.id));
  const total = Math.max(answered.length, Object.keys(answers).length) || result.total;
  const correct = result.perQuestion.filter((q) => q.correct || overridden.has(q.id)).length;
  const score = total ? Math.round((correct / total) * 100) : 0;
  return { score: Math.max(score, attempt.score), passed: attempt.passed || score >= QUIZ_PASS_THRESHOLD };
}

function markAttemptPassed(db: Db, attempt: AttemptRow, score: number, passed: boolean): boolean {
  db.update(schema.topicAttempts).set({ score, passed }).where(eq(schema.topicAttempts.id, attempt.id)).run();
  const progress = db
    .select()
    .from(schema.topicProgress)
    .where(and(eq(schema.topicProgress.userId, attempt.userId), eq(schema.topicProgress.topicId, attempt.topicId)))
    .get();
  if (!progress) return false;
  const completedNow = passed && progress.status !== "completed";
  db.update(schema.topicProgress)
    .set({
      bestScore: Math.max(progress.bestScore ?? 0, score),
      ...(completedNow ? { status: "completed" as const, completedAt: now() } : {}),
      updatedAt: now(),
    })
    .where(and(eq(schema.topicProgress.userId, attempt.userId), eq(schema.topicProgress.topicId, attempt.topicId)))
    .run();
  if (completedNow) {
    try {
      achieveGoalsForTopic(db, attempt.userId, attempt.topicId);
    } catch {
      // Achievement is a bonus; the pass is recorded either way.
    }
  }
  return completedNow;
}

export interface DecisionResult {
  status: "overridden" | "upheld";
  levelsChanged?: boolean;
  topicCompleted?: boolean;
}

export function decideReviewRequest(
  db: Db,
  content: ContentStore,
  actor: { id: string },
  id: string,
  decision: "override" | "uphold",
  note: string,
): DecisionResult {
  const request = db.select().from(schema.reviewRequests).where(eq(schema.reviewRequests.id, id)).get();
  if (!request) throw notFound("No such review request.");
  if (request.status !== "open") throw conflict("This review has already been decided.");
  const at = now();
  const status = decision === "override" ? ("overridden" as const) : ("upheld" as const);
  const resolution = note.trim() || (decision === "override" ? "Full marks after a second look." : "Kept as Not yet after a second look.");
  db.update(schema.reviewRequests).set({ status, resolvedBy: actor.id, resolvedAt: at, resolution }).where(eq(schema.reviewRequests.id, id)).run();

  const out: DecisionResult = { status };
  let link = "/plan";
  if (request.source === "assessment_item") {
    const item = db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, request.refId)).get();
    if (item) {
      if (decision === "override") {
        db.update(schema.assessmentItems)
          .set({ reviewStatus: "overridden", verdict: "full", score: 1, autoScore: 1, reviewNote: resolution, reviewedBy: actor.id, reviewedAt: at })
          .where(eq(schema.assessmentItems.id, item.id))
          .run();
        // Calibration: the override counts as a pass for the bank question.
        if (item.bankItemId) {
          const bank = db.select({ scoreSum: schema.questionBank.scoreSum }).from(schema.questionBank).where(eq(schema.questionBank.id, item.bankItemId)).get();
          if (bank) db.update(schema.questionBank).set({ scoreSum: bank.scoreSum + (1 - (item.score ?? 0)) }).where(eq(schema.questionBank.id, item.bankItemId)).run();
        }
        out.levelsChanged = recomputeEvaluation(db, item.assessmentId, "review").levelsChanged;
      } else {
        db.update(schema.assessmentItems)
          .set({ reviewStatus: "upheld", reviewNote: resolution, reviewedBy: actor.id, reviewedAt: at })
          .where(eq(schema.assessmentItems.id, item.id))
          .run();
      }
    }
  } else if (request.attemptId && decision === "override") {
    const attempt = db.select().from(schema.topicAttempts).where(eq(schema.topicAttempts.id, request.attemptId)).get();
    if (attempt) {
      link = `/topic/${attempt.topicId}`;
      if (attempt.kind === "code") {
        out.topicCompleted = markAttemptPassed(db, attempt, 100, true);
      } else {
        // Calibration: the override counts as a pass for this test item.
        const row = db.select().from(schema.topicTestItems).where(eq(schema.topicTestItems.id, request.refId)).get();
        if (row && row.passes < row.attempts) {
          db.update(schema.topicTestItems).set({ passes: row.passes + 1, updatedAt: at }).where(eq(schema.topicTestItems.id, row.id)).run();
        }
        const regraded = regradeQuizAttempt(db, content, attempt);
        out.topicCompleted = markAttemptPassed(db, attempt, regraded.score, regraded.passed);
      }
    }
  }

  writeAudit(db, {
    actorId: actor.id,
    action: decision === "override" ? "review.overridden" : "review.upheld",
    targetType: request.source,
    targetId: request.refId,
    details: { requestId: id, userId: request.userId, attemptId: request.attemptId, note: resolution },
  });
  notify(db, {
    recipientId: request.userId,
    kind: decision === "override" ? "review.overridden" : "review.upheld",
    title: decision === "override" ? "Your answer now has full marks" : "Your answer stays at Not yet",
    body: decision === "override" ? `We looked at your answer again and gave it full marks. ${note.trim()}`.trim() : `We looked at your answer again. ${resolution}`,
    link,
  });
  return out;
}
