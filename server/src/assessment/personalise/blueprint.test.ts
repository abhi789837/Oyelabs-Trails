import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import type { GoalInput } from "../../../../shared/goals";
import { OUTCOME_SLOT_SEC, outcomeTaskVariant, withOutcomeSlots, type Slot } from "../../../../shared/personalise";
import { ASSESSMENT_HANDS_ON, ASSESSMENT_MAX_MINUTES, ASSESSMENT_MCQ, ASSESSMENT_TOTAL, planBlueprintMix } from "../../../../shared/setup";
import { checkTask, gradeTask, taskSchema } from "../../../../shared/tasks";
import { TOTAL_MAX_SEC } from "../../../../shared/timing";
import { schema } from "../../db";
import { getOutcome } from "../../goals/outcomes";
import { activeLearner, adminSession, as, createTestApp, type TestContext } from "../../test/harness";
import { understand } from "./understand";

/**
 * v4.3 Phase 2b: the goal blueprint. The 25 slots cover the Critical/High goals, their immediate
 * prerequisites (missing-link probes) and the role's core skills, and a practical-case goal is
 * tested once as a task modelled on its capstone (a terminal merge conflict for the Git case). The
 * 25 items, the 18/7 split and the time window are unchanged.
 */

const goal = (originalText: string, skillIds: string[], slider: number, extra: Partial<GoalInput> = {}): GoalInput => ({
  type: "text", originalText, outcome: `Can ${originalText.toLowerCase()} at work.`, skillIds, targetLevel: 3, caseId: null, slider, ...extra,
});

async function learner(ctx: TestContext, goals: GoalInput[]) {
  const admin = await adminSession(ctx);
  const person = await activeLearner(ctx, admin);
  const res = await ctx.app.inject({
    method: "PUT",
    url: `/api/admin/users/${person.id}/setup`,
    ...as(admin),
    payload: {
      departmentId: "engineering", trackId: "frontend", stackIds: ["stack-react"], experienceBand: "3-5", level: 3,
      priorities: [], skip: [], hoursPerWeek: 15, goals,
      description: "React developer moving to backend work for overseas clients",
      advanced: { weekStartsMonday: false, deadlineWeeks: null, courseCap: 5, autoPublish: false, personalisation: "high" },
      assign: true,
    },
  });
  expect(res.statusCode).toBe(200);
  const id = res.json().issued.assessmentId as string;
  await ctx.drainJobs();
  return { id, userId: person.id };
}

describe("the blueprint mix", () => {
  test("every probe and core skill gets a question; the 25 and the 18/7 split hold", () => {
    const priorities = [
      { skillId: "a", skillName: "A", slider: 5 },
      { skillId: "b", skillName: "B", slider: 4 },
      { skillId: "c", skillName: "C", slider: 3 },
    ];
    const core = ["k1", "k2", "k3"].map((id) => ({ skillId: id, skillName: id, slider: 0 }));
    const probes = ["p1", "p2", "p3", "p4"].map((id) => ({ skillId: id, skillName: id, slider: 0 }));
    const mix = planBlueprintMix(priorities, core, probes);
    expect(mix.total).toBe(ASSESSMENT_TOTAL);
    expect([mix.handsOn, mix.mcq]).toEqual([ASSESSMENT_HANDS_ON, ASSESSMENT_MCQ]);
    const count = (id: string) => mix.lines.find((l) => l.skillId === id)?.count ?? 0;
    // At most three probes; each probe and core skill is asked at least once.
    for (const id of ["p1", "p2", "p3", "k1", "k2", "k3"]) expect(count(id)).toBeGreaterThanOrEqual(1);
    expect(count("p4")).toBe(0);
    // The goals keep most of the sheet.
    expect(count("a") + count("b")).toBeGreaterThanOrEqual(10);
  });

  test("an outcome slot replaces one hands-on slot of the case's skills and keeps the totals", () => {
    const slots: Slot[] = Array.from({ length: 25 }, (_, index) => ({
      index, skillId: index < 10 ? "eng-git" : "eng-sql", skillName: "x", group: "focus", type: index % 4 === 3 ? "mcq" : "coding", subtype: index % 4 === 3 ? "mcq-text" : "code", difficulty: 3, targetSec: index % 4 === 3 ? 50 : 80, hint: "",
    }));
    const out = withOutcomeSlots(slots, [{ caseId: "eng-git-merge-conflict-pr", title: "Resolve a merge conflict and open a clean PR", skillIds: ["eng-git", "eng-github-flow"], skillNames: {}, kind: "terminal" }]);
    const outcome = out.filter((s) => s.outcomeCaseId);
    expect(outcome).toHaveLength(1);
    expect(outcome[0]).toMatchObject({ skillId: "eng-git", type: "task", subtype: "terminal", targetSec: OUTCOME_SLOT_SEC });
    expect(out.filter((s) => s.type === "mcq")).toHaveLength(slots.filter((s) => s.type === "mcq").length);
    expect(out).toHaveLength(25);
  });

  test("the shortened capstone is still a valid, gradable task that an empty answer fails", async () => {
    const ctx = await createTestApp();
    const outcome = getOutcome(ctx.db, "eng-git-merge-conflict-pr")!;
    const variant = taskSchema.parse(outcomeTaskVariant(outcome.capstone.kind === "task" ? outcome.capstone.task : {}));
    expect(variant.kind).toBe("terminal");
    expect(checkTask(variant)).toEqual([]);
    expect(gradeTask(variant, { kind: "terminal", commands: [], files: {} }).score ?? 0).toBeLessThan(0.8);
    await ctx.close();
  }, 60_000);
});

describe("the goal blueprint, end to end with the mock provider", () => {
  test("covers the goals, their immediate prerequisites and the core skills within 25 items and the time window, and tests the Git case as a terminal task", async () => {
    const ctx = await createTestApp();
    const { id, userId } = await learner(ctx, [
      goal("Resolve a merge conflict and open a clean PR", ["eng-git", "eng-github-flow"], 5, { type: "case", caseId: "eng-git-merge-conflict-pr", targetLevel: 2 }),
      goal("Backend", ["eng-express"], 4),
      goal("AI-driven development", ["eng-ai-prompting-for-code"], 3),
    ]);

    const understanding = await understand({ db: ctx.db, ai: ctx.ai }, userId);
    const slots = understanding.slots;
    expect(slots).toHaveLength(ASSESSMENT_TOTAL);
    expect(slots.filter((s) => s.type === "mcq")).toHaveLength(ASSESSMENT_MCQ);
    const skills = new Set(slots.map((s) => s.skillId));
    // Goals.
    for (const id of ["eng-git", "eng-github-flow", "eng-express", "eng-ai-prompting-for-code"]) expect(skills).toContain(id);
    // Express's immediate prerequisites: the missing-link probes.
    for (const id of ["eng-node-runtime", "eng-http"]) expect(skills).toContain(id);
    // Core skills of a React frontend developer (the track basics).
    expect(skills).toContain("eng-javascript");
    // The Git case, once, as a terminal task.
    const outcome = slots.filter((s) => s.outcomeCaseId === "eng-git-merge-conflict-pr");
    expect(outcome).toHaveLength(1);
    expect(outcome[0]).toMatchObject({ type: "task", subtype: "terminal" });
    expect(["eng-git", "eng-github-flow"]).toContain(outcome[0].skillId);
    expect(slots.reduce((sum, s) => sum + s.targetSec, 0)).toBeLessThanOrEqual(TOTAL_MAX_SEC);

    const items = ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.assessmentId, id)).all();
    expect(items).toHaveLength(ASSESSMENT_TOTAL);
    expect(items.filter((i) => i.kind === "mcq")).toHaveLength(ASSESSMENT_MCQ);
    const terminal = items.filter((i) => (i.payload as { task?: { kind?: string } }).task?.kind === "terminal");
    expect(terminal.length).toBeGreaterThanOrEqual(1);
    expect(["eng-git", "eng-github-flow"]).toContain(terminal[0].area);
    const total = items.reduce((s, i) => s + (i.estSeconds ?? 0), 0);
    expect(total).toBeLessThanOrEqual(ASSESSMENT_MAX_MINUTES * 60);
    expect(total).toBeLessThanOrEqual(TOTAL_MAX_SEC);
    await ctx.close();
  }, 180_000);
});
