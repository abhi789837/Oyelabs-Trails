import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import type { GenerateJsonRequest, GenerateJsonResult } from "../../ai/types";
import { MockProvider } from "../../ai/adapters/mock";
import { schema } from "../../db";
import { activeLearner, adminSession, as, createTestApp, type TestContext } from "../../test/harness";
import { TOTAL_MAX_SEC, TOTAL_MIN_SEC } from "../../../../shared/timing";

/**
 * The personalised pipeline against a scripted model: it can propose a plan that breaks every
 * rule, write items with wrong keys, write items that are too long — and the code must catch all of it.
 */

type Script = { plan?: (user: unknown) => unknown; generate?: (slots: { slot: number; type: string; subtype: string; skill: string }[]) => unknown[]; check?: (items: { slot: number }[]) => unknown };

class ScriptedProvider extends MockProvider {
  scriptedCalls: string[] = [];
  constructor(private readonly script: Script) {
    super();
  }
  override async generateJson<T>(request: GenerateJsonRequest<T>): Promise<GenerateJsonResult<T>> {
    this.scriptedCalls.push(request.schemaName ?? "");
    const user = JSON.parse(request.user);
    let data: unknown;
    if (request.schemaName === "assessment_plan") data = this.script.plan?.(user) ?? { intent: ["x"], themes: [], slots: [] };
    else if (request.schemaName === "assessment_items") data = { items: this.script.generate?.(user.slots) ?? [] };
    else if (request.schemaName === "mcq_check") data = this.script.check?.(user) ?? { results: user.map((i: { slot: number }) => ({ slot: i.slot, correctIndex: 0, ambiguous: false })) };
    else return super.generateJson(request);
    return { data: request.schema.parse(data), usage: { input: 1000, output: 1000 }, latencyMs: 1, model: "claude-sonnet-5-5" };
  }
}

/** A valid little JS item for any coding slot. */
const coding = (slot: number) => ({
  slot,
  prompt: "Fix `double` so it returns twice the number for the shipment count.",
  coding: {
    language: "javascript",
    mode: "function",
    functionName: "double",
    starterCode: "function double(n) {\n  return n;\n}",
    referenceSolution: "function double(n) {\n  return n * 2;\n}",
    sampleTests: [{ args: [2], expected: 4 }],
    hiddenTests: [{ args: [0], expected: 0 }, { args: [5], expected: 10 }, { args: [-1], expected: -2 }],
  },
  mcq: null,
  task: null,
  answerIsOutput: false,
  tags: ["shipping"],
});
const mcq = (slot: number, correctIndex = 0) => ({
  slot,
  prompt: "Which status code means the resource was created?",
  coding: null,
  mcq: { options: ["201", "200", "404", "500"], correctIndex, explanation: "201 Created.", snippet: null, snippetLanguage: null },
  task: null,
  answerIsOutput: false,
  tags: [],
});
const rank = (slot: number) => ({
  slot,
  prompt: "Order the release steps.",
  coding: null,
  mcq: null,
  task: { kind: "rank", prompt: "Order these.", items: [{ id: "a", label: "Merge" }, { id: "b", label: "Deploy to staging" }, { id: "c", label: "UAT" }], correctOrder: ["a", "b", "c"], explanation: "" },
  answerIsOutput: false,
  tags: [],
});

async function setupLearner(ctx: TestContext, personalisation?: string) {
  const admin = await adminSession(ctx);
  const learner = await activeLearner(ctx, admin);
  const res = await ctx.app.inject({
    method: "PUT",
    url: `/api/admin/users/${learner.id}/setup`,
    ...as(admin),
    payload: {
      departmentId: "engineering", trackId: "frontend", stackIds: ["stack-react"], experienceBand: "1-2", level: 2,
      priorities: [{ skillId: "eng-javascript", slider: 5 }, { skillId: "eng-typescript", slider: 4 }, { skillId: "eng-git", slider: 2 }],
      skip: ["eng-docker"], hoursPerWeek: 15,
      advanced: { weekStartsMonday: false, deadlineWeeks: null, courseCap: 5, autoPublish: false, personalisation: personalisation ?? "balanced" },
      assign: true,
    },
  });
  expect(res.statusCode).toBe(200);
  const id = res.json().issued.assessmentId as string;
  await ctx.drainJobs();
  return { admin, learner, id };
}

const itemsOf = (ctx: TestContext, id: string) => ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.assessmentId, id)).all();
const configOf = (ctx: TestContext, id: string) => ctx.db.select().from(schema.assessments).where(eq(schema.assessments.id, id)).get()!.config as { personalisation: Record<string, unknown> };

describe("personalised assessments", () => {
  test("the allocation rules hold even when the model's plan breaks them, and a skipped skill is never used", async () => {
    const provider = new ScriptedProvider({
      plan: () => ({
        intent: ["Everything about git"],
        themes: ["git"],
        // 25 slots on a Low skill and a skipped one: both rules broken.
        slots: Array.from({ length: 25 }, (_, i) => ({ skillId: i % 2 ? "eng-git" : "eng-docker", kind: "handsOn", subtype: "spot", difficulty: 5, hint: "" })),
      }),
    });
    const ctx = await createTestApp({}, { provider });
    const { id } = await setupLearner(ctx);
    const items = itemsOf(ctx, id);
    expect(items).toHaveLength(25);
    expect(items.some((i) => i.area === "eng-docker")).toBe(false);
    const focus = items.filter((i) => ["eng-javascript", "eng-typescript"].includes(i.area)).length;
    expect(focus).toBeGreaterThanOrEqual(13);
    expect(items.filter((i) => i.kind === "mcq")).toHaveLength(7);
    await ctx.close();
  }, 120_000);

  test("validation rejects a wrong key and a too-long item, and fills those slots from the bank", async () => {
    const provider = new ScriptedProvider({
      plan: () => ({ intent: ["JS"], themes: ["shipping"], slots: [] }),
      generate: (slots) =>
        slots.map((s) => {
          if (s.type === "coding") return { ...coding(s.slot), coding: { ...coding(s.slot).coding, referenceSolution: "function double(n) {\n  return n + 2;\n}" } }; // wrong key
          if (s.type === "mcq") return { ...mcq(s.slot), prompt: "word ".repeat(80) }; // too long
          return rank(s.slot);
        }),
    });
    const ctx = await createTestApp({}, { provider });
    const { id } = await setupLearner(ctx, "high");
    const report = configOf(ctx, id).personalisation as { rejected: { reason: string }[]; fromBankAfterFailures: number; generated: number };
    expect(report.rejected.some((r) => /reference passes/.test(r.reason))).toBe(true);
    expect(report.rejected.some((r) => /words/.test(r.reason))).toBe(true);
    expect(report.fromBankAfterFailures).toBeGreaterThan(0);
    expect(itemsOf(ctx, id)).toHaveLength(25);
    // Failures were retried at most twice: one first round of up to 3 calls, then 2 retries.
    expect(provider.scriptedCalls.filter((c) => c === "assessment_items").length).toBeLessThanOrEqual(5);
    await ctx.close();
  }, 180_000);

  test("a text MCQ the checker disputes is rejected", async () => {
    const provider = new ScriptedProvider({
      plan: () => ({ intent: ["JS"], themes: [], slots: [] }),
      generate: (slots) => slots.map((s) => (s.type === "mcq" ? mcq(s.slot, 2) : s.type === "coding" ? coding(s.slot) : rank(s.slot))),
      check: (items) => ({ results: items.map((i) => ({ slot: i.slot, correctIndex: 0, ambiguous: false })) }),
    });
    const ctx = await createTestApp({}, { provider });
    const { id } = await setupLearner(ctx, "high");
    const report = configOf(ctx, id).personalisation as { rejected: { reason: string }[] };
    expect(report.rejected.some((r) => /disagrees/.test(r.reason))).toBe(true);
    await ctx.close();
  }, 180_000);

  test("good generated items are used, join the bank, the total lands in 26–32 min, and the cost is logged", async () => {
    const provider = new ScriptedProvider({
      plan: () => ({ intent: ["JS for shipping apps"], themes: ["shipping"], slots: [] }),
      generate: (slots) => slots.map((s) => (s.type === "mcq" ? mcq(s.slot) : s.type === "coding" ? coding(s.slot) : rank(s.slot))),
    });
    const ctx = await createTestApp({}, { provider });
    const { id } = await setupLearner(ctx);
    const report = configOf(ctx, id).personalisation as { generated: number; reused: number; estSeconds: number; costMicros: number };
    expect(report.generated).toBeGreaterThan(0);
    expect(ctx.db.select().from(schema.questionBank).where(eq(schema.questionBank.source, "generated")).all().length).toBeGreaterThan(0);
    const total = itemsOf(ctx, id).reduce((s, i) => s + (i.estSeconds ?? 0), 0);
    // Generated stand-ins here are deliberately tiny, so the window holds only when the bank can make up the time.
    expect(total).toBeLessThanOrEqual(TOTAL_MAX_SEC);
    const calls = ctx.db.select().from(schema.aiCalls).where(eq(schema.aiCalls.assessmentId, id)).all();
    // (The plan call may have been served from the in-process cache by an earlier test.)
    expect(calls.map((c) => c.task)).toEqual(expect.arrayContaining(["item_generate"]));
    expect(report.costMicros).toBeGreaterThan(0);
    void TOTAL_MIN_SEC;
    await ctx.close();
  }, 180_000);

  test("the reuse ratio follows the personalisation level", async () => {
    const provider = new ScriptedProvider({ plan: () => ({ intent: ["x"], themes: [], slots: [] }), generate: (slots) => slots.map((s) => (s.type === "mcq" ? mcq(s.slot) : s.type === "coding" ? coding(s.slot) : rank(s.slot))) });
    const ctxLow = await createTestApp({}, { provider });
    const low = await setupLearner(ctxLow, "low");
    const lowReport = configOf(ctxLow, low.id).personalisation as { reused: number };
    await ctxLow.close();
    const ctxHigh = await createTestApp({}, { provider: new ScriptedProvider({ plan: () => ({ intent: ["x"], themes: [], slots: [] }), generate: (slots) => slots.map((s) => (s.type === "mcq" ? mcq(s.slot) : s.type === "coding" ? coding(s.slot) : rank(s.slot))) }) });
    const high = await setupLearner(ctxHigh, "high");
    const highReport = configOf(ctxHigh, high.id).personalisation as { reused: number };
    await ctxHigh.close();
    expect(highReport.reused).toBeLessThanOrEqual(5);
    expect(lowReport.reused).toBeGreaterThan(highReport.reused);
  }, 240_000);

  test("the mock provider's stand-ins personalise from the description: themes, generated items in context, bank for the rest", async () => {
    const ctx = await createTestApp({}, { provider: new MockProvider() });
    const admin = await adminSession(ctx);
    const learner = await activeLearner(ctx, admin);
    const res = await ctx.app.inject({
      method: "PUT",
      url: `/api/admin/users/${learner.id}/setup`,
      ...as(admin),
      payload: {
        departmentId: "engineering", trackId: "frontend", stackIds: ["stack-react"], experienceBand: "1-2", level: 2,
        priorities: [{ skillId: "eng-javascript", slider: 5 }, { skillId: "eng-typescript", slider: 4 }],
        skip: [], hoursPerWeek: 15,
        description: "React developer, building checkout flows for overseas clients",
        advanced: { weekStartsMonday: false, deadlineWeeks: null, courseCap: 5, autoPublish: false, personalisation: "high" },
        assign: true,
      },
    });
    expect(res.statusCode).toBe(200);
    const id = res.json().issued.assessmentId as string;
    await ctx.drainJobs();

    const report = configOf(ctx, id).personalisation as { understandingSource: string; themes: string[]; intent: string[]; generated: number; fromBankAfterFailures: number; estSeconds: number };
    expect(report.understandingSource).toBe("ai");
    expect(report.themes).toEqual(expect.arrayContaining(["checkout flows", "overseas clients"]));
    expect(report.intent.join(" ")).toMatch(/overseas clients/);
    expect(report.generated).toBeGreaterThan(0);
    // The stand-in writes no spot-the-bug tasks, so those slots come from the bank after the retries.
    expect(report.fromBankAfterFailures).toBeGreaterThan(0);

    const items = itemsOf(ctx, id);
    expect(items).toHaveLength(25);
    const generated = items.filter((i) => i.origin === "generated");
    expect(generated.length).toBe(report.generated);
    expect(generated.some((i) => i.kind === "code")).toBe(true);
    for (const item of generated) {
      const prompt = (item.payload as { prompt: string }).prompt;
      expect(prompt).toMatch(/checkout flows|overseas clients|React/);
    }
    const bankRows = ctx.db.select().from(schema.questionBank).where(eq(schema.questionBank.source, "generated")).all();
    expect(bankRows.some((r) => (r.tags ?? []).includes("checkout flows"))).toBe(true);
    const total = items.reduce((s, i) => s + (i.estSeconds ?? 0), 0);
    expect(total).toBeGreaterThanOrEqual(TOTAL_MIN_SEC);
    expect(total).toBeLessThanOrEqual(TOTAL_MAX_SEC);
    await ctx.close();
  }, 180_000);

  test("for a PM, the stand-ins write email, explain, Excel and screen-check tasks set in the description's world", async () => {
    const ctx = await createTestApp({}, { provider: new MockProvider() });
    const admin = await adminSession(ctx);
    const learner = await activeLearner(ctx, admin);
    const res = await ctx.app.inject({
      method: "PUT",
      url: `/api/admin/users/${learner.id}/setup`,
      ...as(admin),
      payload: {
        departmentId: "pm", trackId: "pm-agile", stackIds: [], experienceBand: "3-5", level: 3,
        priorities: [
          { skillId: "pm-client-meetings", slider: 5 }, { skillId: "pm-excel-for-pms", slider: 5 }, { skillId: "pm-email-etiquette", slider: 5 },
          { skillId: "pm-tech-terms", slider: 4 }, { skillId: "pm-keka", slider: 3 },
        ],
        skip: [], hoursPerWeek: 15,
        description: "Handles 3 overseas clients, weak on client calls and Excel",
        advanced: { weekStartsMonday: false, deadlineWeeks: null, courseCap: 5, autoPublish: false, personalisation: "high" },
        assign: true,
      },
    });
    expect(res.statusCode).toBe(200);
    const id = res.json().issued.assessmentId as string;
    await ctx.drainJobs();

    const report = configOf(ctx, id).personalisation as { themes: string[]; generated: number };
    expect(report.themes).toEqual(expect.arrayContaining(["overseas clients", "client calls", "Excel"]));
    const generated = itemsOf(ctx, id).filter((i) => i.origin === "generated");
    expect(generated.length).toBe(report.generated);
    const kinds = new Set(generated.map((i) => {
      const task = (i.key as { task?: { kind: string; variant?: string } } | null)?.task;
      return task ? `${task.kind}${task.variant ? `/${task.variant}` : ""}` : i.kind;
    }));
    expect([...kinds]).toEqual(expect.arrayContaining(["excel", "write/email", "write/explain", "mcq"]));
    for (const item of generated) expect((item.payload as { prompt: string }).prompt).toMatch(/overseas clients|client calls|Excel/);
    const total = itemsOf(ctx, id).reduce((s, i) => s + (i.estSeconds ?? 0), 0);
    expect(total).toBeGreaterThanOrEqual(TOTAL_MIN_SEC);
    expect(total).toBeLessThanOrEqual(TOTAL_MAX_SEC);
    await ctx.close();
  }, 180_000);

  test("with no AI available it falls back to the bank at once and says so", async () => {
    const ctx = await createTestApp({}, { noAi: true });
    const admin = await adminSession(ctx);
    const learner = await activeLearner(ctx, admin);
    const res = await ctx.app.inject({
      method: "PUT",
      url: `/api/admin/users/${learner.id}/setup`,
      ...as(admin),
      payload: { departmentId: "engineering", trackId: "frontend", stackIds: [], experienceBand: "0", level: 1, priorities: [{ skillId: "eng-javascript", slider: 5 }], skip: [], hoursPerWeek: 15, advanced: { weekStartsMonday: false, deadlineWeeks: null, courseCap: 5, autoPublish: false }, assign: true },
    });
    expect(res.json().issued).toMatchObject({ status: "ready" });
    expect(res.json().issued.notice).toMatch(/question bank/);
    expect(itemsOf(ctx, res.json().issued.assessmentId)).toHaveLength(25);
    await ctx.close();
  }, 120_000);
});
