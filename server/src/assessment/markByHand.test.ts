import { eq } from "drizzle-orm";
import { afterEach, describe, expect, test } from "vitest";

import { bankItemSchema } from "../../../shared/bank";
import type { NextAction } from "../../../shared/nextAction";
import { schema } from "../db";
import { newId, now } from "../lib/ids";
import { activeLearner, adminSession, as, createTestApp, type Session, type TestContext } from "../test/harness";
import { evaluateV4 } from "./evaluateV4";
import { storeItems } from "./v4";

/**
 * v4.4 Phase 6: a spoken answer that "needs a listen" is marked by an admin in one click (Full marks
 * or Not yet), the result is worked out again, the decision is audit-logged, and the learner page's
 * status line says "Needs a listen" until it is done.
 */

const SPEAK = {
  kind: "speak",
  title: "Explain a two-day delay to the client",
  prompt: "The release is two days late because testing found a payment bug. Tell the client.",
  audience: "client",
  prepSec: 20,
  maxSec: 90,
  lookFor: ["Says the new date first", "One plain reason, no blame", "What happens next"],
  writtenFallback: "Write what you would say to the client.",
  explanation: "Lead with the date, give one reason, end with the next step.",
};

let ctx: TestContext;
let admin: Session;
afterEach(async () => {
  await ctx?.close();
});

async function needsListenSitting() {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  const learner = await activeLearner(ctx, admin);
  const setup = await ctx.app.inject({ method: "PUT", url: `/api/admin/users/${learner.id}/setup`, ...as(admin), payload: { departmentId: "engineering", priorities: [{ skillId: "ss-client-team-communication", slider: 3 }] } });
  expect(setup.statusCode, setup.body).toBe(200);
  const assessmentId = newId();
  ctx.db
    .insert(schema.assessments)
    .values({ id: assessmentId, userId: learner.id, status: "submitted", attemptNo: 1, createdAt: now(), startedAt: now() - 60_000, submittedAt: now(), deadlineAt: now() + 3_600_000, config: { format: "v4", departmentId: "engineering", assessmentFormat: "coding" } } as typeof schema.assessments.$inferInsert)
    .run();
  const item = bankItemSchema.parse({ id: `t-${newId().toLowerCase()}`, departmentId: "soft", skillId: "ss-client-team-communication", type: "task", difficulty: 2, estMinutes: 2.5, prompt: SPEAK.prompt, task: SPEAK, tags: [] });
  storeItems(ctx.db, assessmentId, [{ item, skillId: "ss-client-team-communication", skillName: "Client and team communication", group: "other", origin: "bank", bankItemId: null }]);
  const row = ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.assessmentId, assessmentId)).get()!;
  const recordingId = newId();
  ctx.db
    .insert(schema.audioRecordings)
    .values({ id: recordingId, userId: learner.id, assessmentId, itemId: row.id, mime: "audio/webm", bytes: 10, durationSec: 30, encPath: `${learner.id}/${recordingId}.bin`, sttStatus: "failed", sttError: "timeout", createdAt: now() })
    .run();
  ctx.db
    .update(schema.assessmentItems)
    .set({ response: { task: { kind: "speak", recordingId, usedFallback: false, reRecorded: false } } as never, lockedAt: now(), status: "answered" })
    .where(eq(schema.assessmentItems.id, row.id))
    .run();
  await evaluateV4({ db: ctx.db, ai: ctx.ai, content: ctx.content, sandbox: null as never, piston: null }, assessmentId);
  return { learnerId: learner.id, assessmentId, itemId: row.id };
}

const itemRow = (id: string) => ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, id)).get()!;

async function nextAction(userId: string): Promise<NextAction> {
  const res = await ctx.app.inject({ method: "GET", url: `/api/admin/users/${userId}/next-action`, ...as(admin) });
  expect(res.statusCode).toBe(200);
  return res.json().action as NextAction;
}

describe("POST /api/admin/assessments/:id/items/:itemId/mark", () => {
  test("Full marks: the answer scores 1, is kept as an override, the result is recomputed and it is audit-logged", async () => {
    const { learnerId, assessmentId, itemId } = await needsListenSitting();
    expect(itemRow(itemId).score).toBeNull();
    expect(await nextAction(learnerId)).toMatchObject({ kind: "listen", title: "Needs a listen: 1 spoken answer", button: { tab: "assessment", anchor: "needs-listen" } });

    const res = await ctx.app.inject({ method: "POST", url: `/api/admin/assessments/${assessmentId}/items/${itemId}/mark`, ...as(admin), payload: { mark: "full" } });
    expect(res.statusCode, res.body).toBe(200);
    const row = itemRow(itemId);
    expect(row).toMatchObject({ score: 1, verdict: "full", reviewStatus: "overridden" });
    expect(JSON.parse(row.aiFeedback!)).toMatchObject({ needsListen: false, met: true, markedByHand: true });

    const audit = ctx.db.select().from(schema.auditLog).where(eq(schema.auditLog.action, "assessment.speak_marked")).all();
    expect(audit).toHaveLength(1);
    expect(audit[0]!.targetId).toBe(assessmentId);

    const evaluation = ctx.db.select().from(schema.evaluations).where(eq(schema.evaluations.assessmentId, assessmentId)).all().at(-1)!;
    const skill = (evaluation.result as { skills: { skillId: string; level: number | null }[] }).skills.find((s) => s.skillId === "ss-client-team-communication");
    expect(skill?.level ?? 0).toBeGreaterThan(0);
    expect((await nextAction(learnerId)).kind).not.toBe("listen");
  }, 60_000);

  test("Not yet: the answer scores 0 and stays not yet", async () => {
    const { assessmentId, itemId } = await needsListenSitting();
    const res = await ctx.app.inject({ method: "POST", url: `/api/admin/assessments/${assessmentId}/items/${itemId}/mark`, ...as(admin), payload: { mark: "not_yet", note: "Too quiet to follow." } });
    expect(res.statusCode).toBe(200);
    expect(itemRow(itemId)).toMatchObject({ score: 0, verdict: "not_yet", reviewStatus: "upheld", reviewNote: "Too quiet to follow." });
  }, 60_000);

  test("only spoken answers, only after hand-in, staff only", async () => {
    const { learnerId, assessmentId, itemId } = await needsListenSitting();
    const bad = await ctx.app.inject({ method: "POST", url: `/api/admin/assessments/${assessmentId}/items/${itemId}/mark`, ...as(admin), payload: { mark: "maybe" } });
    expect(bad.statusCode).toBe(400);
    const missing = await ctx.app.inject({ method: "POST", url: `/api/admin/assessments/${assessmentId}/items/nope/mark`, ...as(admin), payload: { mark: "full" } });
    expect(missing.statusCode).toBe(404);
    ctx.db.update(schema.assessments).set({ status: "in_progress" }).where(eq(schema.assessments.id, assessmentId)).run();
    const early = await ctx.app.inject({ method: "POST", url: `/api/admin/assessments/${assessmentId}/items/${itemId}/mark`, ...as(admin), payload: { mark: "full" } });
    expect(early.statusCode).toBe(409);
    const anon = await ctx.app.inject({ method: "POST", url: `/api/admin/assessments/${assessmentId}/items/${itemId}/mark`, payload: { mark: "full" } });
    expect([401, 403]).toContain(anon.statusCode);
    expect(learnerId).toBeTruthy();
  }, 60_000);
});
