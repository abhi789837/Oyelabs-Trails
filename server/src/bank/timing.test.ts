import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import type { BankItem } from "../../../shared/bank";
import { DEFAULT_TIMING, estimateSeconds, sizeProblems, TOTAL_MAX_SEC, TOTAL_MIN_SEC } from "../../../shared/timing";
import { schema } from "../db";
import { activeLearner, adminSession, as, createTestApp } from "../test/harness";
import { calibrateTiming } from "./calibrate";
import { balanceTiming, timingConstants } from "./timing";

const coding = (id: string, starterLines: number, changed: number): BankItem => {
  const starter = Array.from({ length: starterLines }, (_, i) => `  const v${i} = ${i};`).join("\n");
  const reference = starter + "\n" + Array.from({ length: changed }, (_, i) => `  const w${i} = ${i};`).join("\n");
  return {
    id, departmentId: "engineering", skillId: "s", trackId: null, stackId: null, type: "coding", difficulty: 2, estMinutes: 1, prompt: "Fix it.",
    coding: { language: "javascript", mode: "function", functionName: "f", starterCode: starter, referenceSolution: reference, sampleTests: [{ args: [], expected: 1 }], hiddenTests: [{ args: [], expected: 1 }, { args: [], expected: 1 }, { args: [], expected: 1 }] },
    mcq: null, task: null,
  };
};

describe("the timing formula", () => {
  test("reading + work + thinking, deterministic", () => {
    const item = coding("a", 6, 2);
    // 2 words read, 6 code lines read, 2 lines written, 15 s thinking.
    expect(estimateSeconds(item, DEFAULT_TIMING)).toBe(Math.round((2 / 200) * 60 + 6 * 6 + 2 * 10 + 15));
  });

  test("size limits reject long starters, big fixes, long prompts and long options", () => {
    expect(sizeProblems(coding("b", 20, 1)).join()).toMatch(/starter code/);
    expect(sizeProblems(coding("c", 5, 7)).join()).toMatch(/fix needs/);
    expect(sizeProblems({ ...coding("d", 3, 1), prompt: "word ".repeat(70) }).join()).toMatch(/question text/);
    const mcq: BankItem = { ...coding("e", 1, 1), type: "mcq", coding: null, mcq: { options: ["a very long option that has far more than fifteen words in it to make the limit fail clearly", "b", "c", "d"], correctIndex: 1, explanation: "x", snippet: null, snippetLanguage: null } };
    expect(sizeProblems(mcq).join()).toMatch(/option/);
  });

  test("balancing swaps bank items until the sheet lands in 26–32 minutes", () => {
    const short = Array.from({ length: 25 }, (_, i) => coding(`short${i}`, 2, 1));
    const long = Array.from({ length: 40 }, (_, i) => coding(`long${i}`, 12, 4));
    const picks = short.map((item) => ({ item, skillId: "s", group: "focus" as const, origin: "bank" as const, swappable: true }));
    const before = short.reduce((s, i) => s + estimateSeconds(i), 0);
    expect(before).toBeLessThan(TOTAL_MIN_SEC);
    const after = balanceTiming(picks, long, DEFAULT_TIMING).reduce((s, p) => s + estimateSeconds(p.item), 0);
    expect(after).toBeGreaterThanOrEqual(TOTAL_MIN_SEC);
    expect(after).toBeLessThanOrEqual(TOTAL_MAX_SEC);
  });

  test("generated items are never swapped out by balancing", () => {
    const picks = Array.from({ length: 25 }, (_, i) => ({ item: coding(`g${i}`, 2, 1), skillId: "s", group: "focus" as const, origin: "generated" as const, swappable: false }));
    const out = balanceTiming(picks, [coding("x", 12, 4)], DEFAULT_TIMING);
    expect(out.map((p) => p.item.id)).toEqual(picks.map((p) => p.item.id));
  });
});

describe("calibration and the admin's tools", () => {
  test("calibration flags slow items and scales the constants from real times", async () => {
    const ctx = await createTestApp({}, { noAi: true });
    const admin = await adminSession(ctx);
    const learner = await activeLearner(ctx, admin);
    const setup = { departmentId: "engineering", trackId: "frontend", stackIds: [], experienceBand: "1-2", level: 2, priorities: [{ skillId: "eng-javascript", slider: 5 }], skip: [], hoursPerWeek: 15, advanced: { weekStartsMonday: false, deadlineWeeks: null, courseCap: 5, autoPublish: false, personalisation: "balanced" }, assign: true };
    const issued = (await ctx.app.inject({ method: "PUT", url: `/api/admin/users/${learner.id}/setup`, ...as(admin), payload: setup })).json().issued;
    // A second, finished sitting so there are enough samples (30+). Everyone took twice the estimate.
    ctx.db.update(schema.assessments).set({ status: "completed" }).where(eq(schema.assessments.id, issued.assessmentId)).run();
    const second = (await ctx.app.inject({ method: "PUT", url: `/api/admin/users/${learner.id}/setup`, ...as(admin), payload: setup })).json().issued;
    const finished = ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.assessmentId, issued.assessmentId)).all();
    for (const item of finished) ctx.db.update(schema.assessmentItems).set({ lockedAt: Date.now(), activeMs: (item.estSeconds ?? 60) * 2000 }).where(eq(schema.assessmentItems.id, item.id)).run();
    const secondItems = ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.assessmentId, second.assessmentId)).all();
    for (const item of secondItems.slice(5)) ctx.db.update(schema.assessmentItems).set({ lockedAt: Date.now(), activeMs: (item.estSeconds ?? 60) * 2000 }).where(eq(schema.assessmentItems.id, item.id)).run();
    const items = secondItems.slice(0, 5);
    const result = calibrateTiming(ctx.db, { force: true });
    expect(result.ratio).toBe(1.2); // damped to +20% a week
    expect(timingConstants(ctx.db).thinkSec).toBeGreaterThan(DEFAULT_TIMING.thinkSec);

    // Swap: one item replaced by another bank item of the same skill and type.
    const target = items[0];
    const swap = await ctx.app.inject({ method: "POST", url: `/api/admin/assessments/${second.assessmentId}/items/${target.id}/swap`, ...as(admin) });
    expect(swap.statusCode).toBe(200);
    const after = ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, target.id)).get()!;
    expect(after.bankItemId).not.toBe(target.bankItemId);
    expect(after.area).toBe(target.area);

    // Regenerate needs an AI credential and says so.
    const regen = await ctx.app.inject({ method: "POST", url: `/api/admin/assessments/${second.assessmentId}/items/${target.id}/regenerate`, ...as(admin) });
    expect(regen.statusCode).toBe(409);
    await ctx.close();
  }, 120_000);

  test("the Setup preview explains the plan even with no AI", async () => {
    const ctx = await createTestApp({}, { noAi: true });
    const admin = await adminSession(ctx);
    const res = await ctx.app.inject({
      method: "POST",
      url: "/api/admin/setup/understand",
      ...as(admin),
      payload: { departmentId: "engineering", trackId: "backend", stackIds: [], experienceBand: "1-2", level: 2, priorities: [{ skillId: "eng-sql-joins", slider: 5 }, { skillId: "eng-git", slider: 2 }], skip: [], hoursPerWeek: 15, description: "Weak on joins." },
    });
    expect(res.statusCode).toBe(200);
    const u = res.json().understanding;
    expect(u.source).toBe("rules");
    expect(u.slots).toHaveLength(25);
    expect(u.split.find((s: { skillName: string }) => s.skillName === "SQL joins")).toBeTruthy();
    await ctx.close();
  }, 60_000);
});
