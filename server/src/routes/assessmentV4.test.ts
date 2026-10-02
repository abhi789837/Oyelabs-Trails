import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";

import type { Sheet } from "../../../shared/assessmentV4";
import { schema } from "../db";
import { setMinFinishMinutes } from "../assessment/v4";
import { activeLearner, adminSession, as, createTestApp, type Session, type TestContext } from "../test/harness";

/**
 * The v4 assessment end to end, against the real seeded bank: a learner whose admin picked two
 * skills gets a 25-question sheet assembled with no model call, moves freely, runs code three
 * times (the third submits), finishes, and gets a report by skill.
 */

let ctx: TestContext;
let admin: Session;
let learner: { id: string; session: Session };

const setup = {
  departmentId: "engineering",
  trackId: "frontend",
  stackIds: ["stack-react"],
  experienceBand: "1-2",
  level: 2,
  priorities: [
    { skillId: "eng-react-hooks", slider: 4 },
    { skillId: "eng-typescript", slider: 5 },
  ],
  skip: ["eng-vue-fundamentals"],
  hoursPerWeek: 15,
  advanced: { weekStartsMonday: false, deadlineWeeks: null, courseCap: 5, autoPublish: false },
};

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  learner = await activeLearner(ctx, admin);
});

async function assign(): Promise<string> {
  const res = await ctx.app.inject({ method: "PUT", url: `/api/admin/users/${learner.id}/setup`, ...as(admin), payload: { ...setup, assign: true } });
  expect(res.statusCode).toBe(200);
  const issued = res.json().issued;
  expect(issued.status).toBe("ready");
  return issued.assessmentId as string;
}

async function start(id: string): Promise<Sheet> {
  const consent = await ctx.app.inject({ method: "POST", url: `/api/assessment/${id}/consent`, ...as(learner.session), payload: { agreed: true } });
  expect(consent.statusCode).toBe(200);
  const started = await ctx.app.inject({ method: "POST", url: `/api/assessment/${id}/start`, ...as(learner.session), payload: {} });
  expect(started.statusCode).toBe(200);
  const sheet = await ctx.app.inject({ method: "GET", url: `/api/assessment/${id}/sheet`, ...as(learner.session) });
  return sheet.json() as Sheet;
}

describe("v4 assessment", () => {
  test("is assembled from the bank: 25 items, 18 hands-on, 7 MCQs, focus skills first, nothing skipped", async () => {
    const id = await assign();
    const sheet = await start(id);
    expect(sheet.items).toHaveLength(25);
    expect(sheet.items.filter((i) => i.type !== "mcq")).toHaveLength(18);
    expect(sheet.items.filter((i) => i.type === "mcq")).toHaveLength(7);
    expect(sheet.items[0].skillId).toBe("eng-typescript");
    expect(sheet.items.some((i) => i.skillId === "eng-vue-fundamentals")).toBe(false);
    expect(sheet.deadlineAt! - sheet.startedAt!).toBe(50 * 60_000);
    expect(sheet.minFinishAt).toBeNull();
    // Hidden tests and answers never reach the browser.
    expect(JSON.stringify(sheet)).not.toMatch(/hiddenTests|correctIndex|referenceSolution/);
    const calls = ctx.db.select().from(schema.aiCalls).all();
    expect(calls).toHaveLength(0);
  });

  test("the questions are not readable before the clock starts", async () => {
    const id = await assign();
    const res = await ctx.app.inject({ method: "GET", url: `/api/assessment/${id}/sheet`, ...as(learner.session) });
    expect(res.json().items).toHaveLength(0);
  });

  test("three runs per problem, counted on the server; the third submits it", async () => {
    const id = await assign();
    const sheet = await start(id);
    const coding = sheet.items.find((i) => i.type === "coding")!;
    const run = (code: string) => ctx.app.inject({ method: "POST", url: `/api/assessment/${id}/items/${coding.id}/run`, ...as(learner.session), payload: { code } });

    const first = (await run("// attempt 1")).json();
    expect(first).toMatchObject({ runsUsed: 1, runsLeft: 2, autoSubmitted: false });
    expect((await run("// attempt 2")).json()).toMatchObject({ runsUsed: 2, runsLeft: 1 });
    const third = (await run("// attempt 3")).json();
    expect(third).toMatchObject({ runsUsed: 3, runsLeft: 0, autoSubmitted: true });

    const fourth = await run("// attempt 4");
    expect(fourth.statusCode).toBe(409);
    const row = ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, coding.id)).get()!;
    expect(row.lockedAt).not.toBeNull();
    expect(row.response).toEqual({ code: "// attempt 3" });
    expect(row.score).toBe(0);
  });

  test("free navigation: answers autosave in any order and can be changed until submitted", async () => {
    const id = await assign();
    const sheet = await start(id);
    const mcqs = sheet.items.filter((i) => i.type === "mcq");
    const save = (itemId: string, payload: Record<string, unknown>) => ctx.app.inject({ method: "PUT", url: `/api/assessment/${id}/items/${itemId}/draft`, ...as(learner.session), payload });
    expect((await save(mcqs[2].id, { response: { choice: 1 }, flagged: true })).statusCode).toBe(200);
    expect((await save(mcqs[0].id, { response: { unknown: true } })).statusCode).toBe(200);
    expect((await save(mcqs[2].id, { response: { choice: 0 } })).statusCode).toBe(200);
    const again = (await ctx.app.inject({ method: "GET", url: `/api/assessment/${id}/sheet`, ...as(learner.session) })).json() as Sheet;
    const third = again.items.find((i) => i.id === mcqs[2].id)!;
    expect(third).toMatchObject({ state: "answered", flagged: true, draft: { choice: 0 } });
  });

  test("finishing grades every draft with no model call and reports by skill", async () => {
    const id = await assign();
    const sheet = await start(id);
    for (const item of sheet.items.filter((i) => i.type === "mcq")) {
      await ctx.app.inject({ method: "PUT", url: `/api/assessment/${id}/items/${item.id}/draft`, ...as(learner.session), payload: { response: { choice: 0 } } });
    }
    const finish = await ctx.app.inject({ method: "POST", url: `/api/assessment/${id}/submit`, ...as(learner.session), payload: {} });
    expect(finish.statusCode).toBe(200);
    await ctx.drainJobs();

    const assessment = ctx.db.select().from(schema.assessments).where(eq(schema.assessments.id, id)).get()!;
    expect(assessment.status).toBe("completed");
    const items = ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.assessmentId, id)).all();
    expect(items.every((i) => i.lockedAt != null)).toBe(true);

    const mine = (await ctx.app.inject({ method: "GET", url: "/api/me/evaluation", ...as(learner.session) })).json();
    expect(mine.evaluation.v4.skills.map((s: { skillName: string }) => s.skillName)).toContain("TypeScript fundamentals");
    expect(JSON.stringify(mine)).not.toContain("rawScore");
    // Grading and the report used no model (the path build that follows may match courses).
    const grading = ctx.db.select().from(schema.aiCalls).all().filter((c) => ["blueprint", "item_critic", "evaluation", "gap_analysis"].includes(c.purpose));
    expect(grading).toHaveLength(0);
  });

  test("past the deadline, writes are refused and the sitting is submitted", async () => {
    const id = await assign();
    const sheet = await start(id);
    ctx.db.update(schema.assessments).set({ deadlineAt: Date.now() - 1000 }).where(eq(schema.assessments.id, id)).run();
    const late = await ctx.app.inject({ method: "PUT", url: `/api/assessment/${id}/items/${sheet.items[0].id}/draft`, ...as(learner.session), payload: { response: { unknown: true } } });
    expect(late.statusCode).toBe(409);
    expect(ctx.db.select().from(schema.assessments).where(eq(schema.assessments.id, id)).get()!.status).toBe("submitted");
  });

  test("the minimum time before Finish is off by default, and enforced when set", async () => {
    setMinFinishMinutes(ctx.db, 10);
    const id = await assign();
    const sheet = await start(id);
    expect(sheet.minFinishAt).toBe(sheet.startedAt! + 10 * 60_000);
    const early = await ctx.app.inject({ method: "POST", url: `/api/assessment/${id}/submit`, ...as(learner.session), payload: {} });
    expect(early.statusCode).toBe(409);
  });

  test("a second sitting avoids the items from the first", async () => {
    const first = await assign();
    ctx.db.update(schema.assessments).set({ status: "completed" }).where(eq(schema.assessments.id, first)).run();
    const second = await assign();
    const ids = (a: string) => new Set(ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.assessmentId, a)).all().map((i) => i.bankItemId));
    const overlap = [...ids(second)].filter((x) => ids(first).has(x));
    expect(overlap.length).toBeLessThan(5);
  });
});
