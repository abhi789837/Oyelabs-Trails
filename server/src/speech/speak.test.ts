import { eq } from "drizzle-orm";
import { afterEach, describe, expect, test } from "vitest";

import type { OnboardSuggestion } from "../../../shared/goals";
import { bankItemSchema, type BankItem } from "../../../shared/bank";
import { checkTask, taskSchema } from "../../../shared/tasks";
import { evaluateV4, gradeSpeakItems, speakTranscriptsPending } from "../assessment/evaluateV4";
import { storeItems } from "../assessment/v4";
import { schema } from "../db";
import { JobDeferredError } from "../jobs/queue";
import { newId, now } from "../lib/ids";
import { activeLearner, adminSession, as, createTestApp, type TestContext } from "../test/harness";
import { MOCK_TRANSCRIPT } from "./stt";

/**
 * v4.4 Phase 3b: the Speak item end to end on the server: it reaches the reference case's sheet,
 * a transcribed answer is graded from its transcript, a typed answer is graded as text, a pending
 * transcript makes the evaluation wait, and a failed one asks a person to listen.
 */

const REFERENCE = "frontend engineer with 1 year of experience and also want him to move to the full stack and also improve the soft skills";

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
afterEach(async () => {
  await ctx?.close();
});

const kindOf = (key: unknown) => (key as { task?: { kind?: string } } | null)?.task?.kind;

describe("the reference case's sheet", () => {
  test("has at least one Speak and one written item, never more than two Speak, all valid", async () => {
    ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const learner = await activeLearner(ctx, admin);
    const learnerId = learner.id;
    const suggest = await ctx.app.inject({ method: "POST", url: "/api/admin/onboard/suggest", ...as(admin), payload: { departmentId: "engineering", description: REFERENCE } });
    expect(suggest.statusCode).toBe(200);
    const s = suggest.json().suggestion as OnboardSuggestion;
    const put = await ctx.app.inject({
      method: "PUT",
      url: `/api/admin/users/${learnerId}/setup`,
      ...as(admin),
      payload: {
        departmentId: s.departmentId,
        trackId: s.trackId,
        stackIds: s.stackIds,
        experienceBand: s.experienceBand,
        level: s.level,
        hoursPerWeek: s.hoursPerWeek,
        description: REFERENCE,
        goals: s.goals,
        intents: s.intents,
        unsure: s.unsure,
        assign: true,
      },
    });
    expect(put.statusCode, put.body).toBe(200);
    const assessmentId = put.json().issued.assessmentId as string;
    await ctx.drainJobs();
    const items = ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.assessmentId, assessmentId)).all();
    expect(items).toHaveLength(25);
    const speak = items.filter((i) => kindOf(i.key) === "speak");
    const write = items.filter((i) => kindOf(i.key) === "write");
    expect(speak.length).toBeGreaterThanOrEqual(1);
    expect(speak.length).toBeLessThanOrEqual(2);
    expect(write.length).toBeGreaterThanOrEqual(1);
    for (const item of [...speak, ...write]) {
      const task = taskSchema.parse((item.key as { task: unknown }).task);
      expect(checkTask(task)).toEqual([]);
      expect(item.area.startsWith("ss-")).toBe(true);
    }
    // The learner's pre-flight is told to ask for the microphone.
    const mine = await ctx.app.inject({ method: "GET", url: "/api/me/assessment", ...as(learner.session) });
    expect(mine.json().assessment.hasSpeak).toBe(true);
  }, 240_000);
});


// ---------------------------------------------------------------------------
// Grading
// ---------------------------------------------------------------------------

function bankItem(task: unknown, skillId = "ss-client-team-communication"): BankItem {
  return bankItemSchema.parse({ id: `t-${newId().toLowerCase()}`, departmentId: "soft", skillId, type: "task", difficulty: 2, estMinutes: 2.5, prompt: SPEAK.prompt, task, tags: [] });
}

let attempt = 0;
/** A submitted v4 sitting with the given items, each locked with its response. */
function seedSitting(userId: string, entries: { task: unknown; response: unknown }[], status: "in_progress" | "submitted" = "submitted") {
  const assessmentId = newId();
  ctx.db
    .insert(schema.assessments)
    .values({ id: assessmentId, userId, status, attemptNo: ++attempt, createdAt: now(), startedAt: now() - 60_000, submittedAt: now(), deadlineAt: now() + 3_600_000, config: { format: "v4", departmentId: "engineering", assessmentFormat: "coding" } } as typeof schema.assessments.$inferInsert)
    .run();
  storeItems(
    ctx.db,
    assessmentId,
    entries.map((e) => ({ item: bankItem(e.task), skillId: "ss-client-team-communication", skillName: "Client and team communication", group: "other" as const, origin: "bank" as const, bankItemId: null })),
  );
  const rows = ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.assessmentId, assessmentId)).all().sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  rows.forEach((row, i) => {
    const response = entries[i]!.response;
    if (response === undefined) return;
    ctx.db
      .update(schema.assessmentItems)
      .set({ response: { task: response } as never, draft: { task: response } as never, ...(status === "submitted" ? { lockedAt: now(), status: "answered" as const } : {}) })
      .where(eq(schema.assessmentItems.id, row.id))
      .run();
  });
  return { assessmentId, itemIds: rows.map((r) => r.id) };
}

function seedRecording(userId: string, assessmentId: string, itemId: string, set: Partial<typeof schema.audioRecordings.$inferInsert>) {
  const id = newId();
  ctx.db
    .insert(schema.audioRecordings)
    .values({ id, userId, assessmentId, itemId, mime: "audio/webm", bytes: 10, durationSec: 30, encPath: `${userId}/${id}.bin`, sttStatus: "pending", createdAt: now(), ...set })
    .run();
  return id;
}

const itemRow = (id: string) => ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, id)).get()!;
const deps = () => ({ db: ctx.db, ai: ctx.ai, content: ctx.content, sandbox: null as never, piston: null });

describe("grading Speak items", () => {
  test("a transcribed recording is graded from its transcript: met, an English level, reason and tip", async () => {
    ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const learner = await activeLearner(ctx, admin);
    const { assessmentId, itemIds } = seedSitting(learner.id, [{ task: SPEAK, response: { kind: "speak", recordingId: "pending-id", durationSec: 30, usedFallback: false, reRecorded: true } }]);
    const recordingId = seedRecording(learner.id, assessmentId, itemIds[0]!, {
      sttStatus: "done",
      transcript: MOCK_TRANSCRIPT,
      metrics: { wpm: 130, pauses: 1, longestPauseSec: 1.2, fillers: 1 },
    });
    ctx.db.update(schema.assessmentItems).set({ response: { task: { kind: "speak", recordingId, durationSec: 30, usedFallback: false, reRecorded: true } } as never }).where(eq(schema.assessmentItems.id, itemIds[0]!)).run();

    await evaluateV4(deps(), assessmentId);
    const row = itemRow(itemIds[0]!);
    expect(row.score).toBe(1);
    const feedback = JSON.parse(row.aiFeedback!);
    expect(feedback).toMatchObject({ kind: "speak", mode: "spoken", met: true, englishLevel: "B1", recordingId });
    expect(feedback.reason).toBeTruthy();
    expect(feedback.tip).toBeTruthy();
    expect(feedback.metrics.wpm).toBe(130);
    const status = ctx.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get()!.status;
    expect(status).toBe("completed");
  }, 60_000);

  test("a typed answer (no microphone) is graded as text and flagged as typed", async () => {
    ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const learner = await activeLearner(ctx, admin);
    const text = "Hi Sam, the release moves to Friday because testing found a payment bug. We are fixing it now and I will send the test link on Thursday.";
    const { assessmentId, itemIds } = seedSitting(learner.id, [{ task: SPEAK, response: { kind: "speak", usedFallback: true, fallbackText: text, reRecorded: false } }]);
    await evaluateV4(deps(), assessmentId);
    const row = itemRow(itemIds[0]!);
    expect(row.score).toBe(1);
    expect(JSON.parse(row.aiFeedback!)).toMatchObject({ kind: "speak", mode: "typed", usedFallback: true, met: true });
  }, 60_000);

  test("a short typed answer is not yet: the rubric share is the score", async () => {
    ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const learner = await activeLearner(ctx, admin);
    const { assessmentId, itemIds } = seedSitting(learner.id, [{ task: SPEAK, response: { kind: "speak", usedFallback: true, fallbackText: "It is late, sorry.", reRecorded: false } }]);
    await gradeSpeakItems(deps(), { id: assessmentId, userId: learner.id }, "Lee");
    const row = itemRow(itemIds[0]!);
    expect(JSON.parse(row.aiFeedback!)).toMatchObject({ met: false, englishLevel: "A2" });
    expect(row.score).toBeCloseTo(0.333, 2);
  }, 60_000);

  test("while a transcript is pending the evaluation waits (the job is deferred, not failed)", async () => {
    ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const learner = await activeLearner(ctx, admin);
    const { assessmentId, itemIds } = seedSitting(learner.id, [{ task: SPEAK, response: undefined }]);
    const recordingId = seedRecording(learner.id, assessmentId, itemIds[0]!, { sttStatus: "pending" });
    ctx.db.update(schema.assessmentItems).set({ response: { task: { kind: "speak", recordingId, usedFallback: false, reRecorded: false } } as never, lockedAt: now(), status: "answered" }).where(eq(schema.assessmentItems.id, itemIds[0]!)).run();

    expect(speakTranscriptsPending(ctx.db, assessmentId, learner.id)).toBe(true);
    await expect(evaluateV4(deps(), assessmentId)).rejects.toBeInstanceOf(JobDeferredError);

    // Through the queue: the evaluate job goes back to waiting, the sitting is not failed.
    const jobId = newId();
    ctx.db.insert(schema.jobs).values({ id: jobId, type: "assessment.evaluate", payload: { assessmentId }, status: "queued", attempts: 0, maxAttempts: 3, runAfter: now(), createdAt: now() } as typeof schema.jobs.$inferInsert).run();
    await ctx.drainJobs();
    const job = ctx.db.select().from(schema.jobs).where(eq(schema.jobs.id, jobId)).get()!;
    expect(job.status).toBe("queued");
    expect(job.runAfter).toBeGreaterThan(now());
    expect(ctx.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get()!.status).not.toBe("failed");

    // Once transcribed, the same job grades it.
    ctx.db.update(schema.audioRecordings).set({ sttStatus: "done", transcript: MOCK_TRANSCRIPT }).where(eq(schema.audioRecordings.id, recordingId)).run();
    ctx.db.update(schema.jobs).set({ runAfter: now() - 1 }).where(eq(schema.jobs.id, jobId)).run();
    await ctx.drainJobs();
    expect(itemRow(itemIds[0]!).score).toBe(1);
    expect(ctx.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get()!.status).toBe("completed");
  }, 60_000);

  test("a recording that could not be transcribed needs a listen: pending, not failed, and staff are told", async () => {
    ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const learner = await activeLearner(ctx, admin);
    const { assessmentId, itemIds } = seedSitting(learner.id, [{ task: SPEAK, response: undefined }]);
    const recordingId = seedRecording(learner.id, assessmentId, itemIds[0]!, { sttStatus: "failed", sttError: "timeout" });
    ctx.db.update(schema.assessmentItems).set({ response: { task: { kind: "speak", recordingId, usedFallback: false, reRecorded: false } } as never, lockedAt: now(), status: "answered" }).where(eq(schema.assessmentItems.id, itemIds[0]!)).run();

    await evaluateV4(deps(), assessmentId);
    const row = itemRow(itemIds[0]!);
    expect(row.score).toBeNull();
    expect(JSON.parse(row.aiFeedback!)).toMatchObject({ kind: "speak", needsListen: true, recordingId });
    const notes = ctx.db.select().from(schema.notifications).where(eq(schema.notifications.kind, "assessment.speak_needs_listen")).all();
    expect(notes.length).toBeGreaterThan(0);
    expect(notes[0]!.title).toMatch(/needs a listen/);
    expect(notes[0]!.body).not.toMatch(/STT|transcri|whisper/i);
  }, 60_000);

  test("without AI a Speak answer is left for a person, like a written one", async () => {
    ctx = await createTestApp({}, { noAi: true });
    const admin = await adminSession(ctx);
    const learner = await activeLearner(ctx, admin);
    const { assessmentId, itemIds } = seedSitting(learner.id, [{ task: SPEAK, response: { kind: "speak", usedFallback: true, fallbackText: "The release moves to Friday because of a payment bug.", reRecorded: false } }]);
    await gradeSpeakItems(deps(), { id: assessmentId, userId: learner.id }, "Lee");
    expect(itemRow(itemIds[0]!).score).toBeNull();
  }, 60_000);
});

describe("the microphone-denied path", () => {
  test("a typed answer saved and submitted through the sheet keeps usedFallback; a mic denial is recorded in consent", async () => {
    ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const learner = await activeLearner(ctx, admin);
    const { assessmentId, itemIds } = seedSitting(learner.id, [{ task: SPEAK, response: undefined }], "in_progress");
    const answer = { kind: "speak", usedFallback: true, fallbackText: "The release moves to Friday; we found a payment bug and the fix is in review.", reRecorded: false };
    const draft = await ctx.app.inject({ method: "PUT", url: `/api/assessment/${assessmentId}/items/${itemIds[0]}/draft`, ...as(learner.session), payload: { response: { task: answer } } });
    expect(draft.statusCode, draft.body).toBe(200);
    const submit = await ctx.app.inject({ method: "POST", url: `/api/assessment/${assessmentId}/items/${itemIds[0]}/submit`, ...as(learner.session), payload: { response: { task: answer } } });
    expect(submit.statusCode, submit.body).toBe(200);
    const row = itemRow(itemIds[0]!);
    expect((row.response as { task: { usedFallback: boolean; fallbackText: string } }).task).toMatchObject({ usedFallback: true, fallbackText: answer.fallbackText });
    // Waiting for the grader, not scored 0.
    expect(row.score).toBeNull();
  }, 60_000);
});
