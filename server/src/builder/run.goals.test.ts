import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import type { SkillResult, V4Result } from "../../../shared/assessmentV4";
import type { GoalInput } from "../../../shared/goals";
import { schema } from "../db";
import { createSuggestions, listGoals, listSuggestions } from "../goals/repo";
import { activeLearner, adminSession, as, createTestApp, type TestContext } from "../test/harness";
import { analyseEvaluation, goalPathContext, progressionCandidates } from "./goalPath";
import { runBuilder } from "./run";
import { currentPath } from "./repo";

/**
 * v4.3 Phase 2c, end to end through `runBuilder` on the real engineering catalog and skill graph:
 * the brief's worked example, mastered goals skipped, the no-gap continuation, and capstones.
 *
 * The worked example's skills, mapped to the closest real catalog ids:
 *   Git basics → eng-git · Git branching & PRs → eng-github-flow ·
 *   AI-driven development fundamentals → eng-ai-prompting-for-code · async JS → eng-js-async ·
 *   Node/Express → eng-node-runtime + eng-express · databases → eng-sql ·
 *   auth → eng-auth-sessions-jwt · deployment → eng-paas-deploy ·
 *   advanced AI-driven workflows → eng-ai-context-files + eng-ai-reusable-skills (the graph puts
 *   context files between prompting and reusable workflows, so both are that step).
 */

const skill = (skillId: string, level: number, group: SkillResult["group"] = "focus"): SkillResult => ({
  skillId, skillName: skillId, group, slider: null, priority: null, asked: 3, unknown: 0, score: level / 5, level,
});

const goal = (originalText: string, skillIds: string[], slider: number, targetLevel = 3, extra: Partial<GoalInput> = {}): GoalInput => ({
  type: "text", originalText, outcome: `Can ${originalText.toLowerCase()} at work.`, skillIds, targetLevel, caseId: null, slider, ...extra,
});

async function learnerWithGoals(ctx: TestContext, goals: GoalInput[], trackId = "frontend") {
  const admin = await adminSession(ctx);
  const learner = await activeLearner(ctx, admin, `goals.${Math.random().toString(36).slice(2, 8)}`);
  const res = await ctx.app.inject({
    method: "PUT",
    url: `/api/admin/users/${learner.id}/setup`,
    ...as(admin),
    payload: {
      departmentId: "engineering", trackId, stackIds: ["stack-react"], experienceBand: "3-5", level: 3,
      priorities: [], skip: [], hoursPerWeek: 15, goals,
      advanced: { weekStartsMonday: false, deadlineWeeks: null, courseCap: 5, autoPublish: false },
      assign: false,
    },
  });
  expect(res.statusCode).toBe(200);
  return { admin, learner };
}

const v4 = (skills: SkillResult[]): V4Result => ({ format: "v4", skills, strengths: [], focusFirst: [], rawScore: 40, pendingWritten: 0, answered: skills.length, total: skills.length });

const pathItems = (ctx: TestContext, pathId: string) =>
  ctx.db.select().from(schema.pathItems).where(eq(schema.pathItems.pathId, pathId)).all().sort((a, b) => a.position - b.position);

/** Distinct skills in path order. */
const skillOrder = (items: { skillId: string | null }[]) => [...new Set(items.map((i) => i.skillId).filter((id): id is string => Boolean(id)))];

describe("the worked example (frontend developer: Git Critical, Backend High, AI-driven Medium)", () => {
  const goals = [
    goal("Git", ["eng-git", "eng-github-flow"], 5),
    goal("Backend", ["eng-node-runtime", "eng-express", "eng-sql", "eng-auth-sessions-jwt", "eng-paas-deploy"], 4),
    goal("AI-driven development", ["eng-ai-prompting-for-code", "eng-ai-reusable-skills"], 3),
  ];
  // Git basics 2/5, AI skills 1/5, async JS 1/5. What a frontend developer is good at is measured
  // too (JavaScript, React, the event loop, HTTP), so it is not pulled in as a missing link.
  const evaluation = v4([
    skill("eng-git", 2),
    skill("eng-ai-prompting-for-code", 1),
    skill("eng-ai-context-files", 1),
    skill("eng-ai-reusable-skills", 1),
    skill("eng-js-async", 1, "other"),
    skill("eng-javascript", 4, "basics"),
    skill("eng-react-fundamentals", 4, "basics"),
    skill("eng-js-event-loop", 3, "other"),
    skill("eng-http", 3, "other"),
  ]);

  test("the built path's skill order is exactly the brief's", async () => {
    const ctx = await createTestApp();
    const { learner } = await learnerWithGoals(ctx, goals);
    const outcome = await runBuilder({ userId: learner.id, assessmentId: null, evaluation, adminNotes: "" }, { db: ctx.db, env: ctx.env, ai: ctx.ai, content: ctx.content });
    expect(outcome.status).toBe("ready");

    const items = pathItems(ctx, outcome.pathId);
    expect(skillOrder(items)).toEqual([
      "eng-git", // Git basics
      "eng-github-flow", // Git branching & PRs
      "eng-ai-prompting-for-code", // AI-driven development fundamentals (boosted must-have)
      "eng-js-async", // async JS (missing link for Backend)
      "eng-node-runtime", // Node/Express
      "eng-express",
      "eng-sql", // databases
      "eng-auth-sessions-jwt", // auth
      "eng-paas-deploy", // deployment
      "eng-ai-context-files", // advanced AI-driven workflows
      "eng-ai-reusable-skills",
    ]);

    // Each step carries the algorithm's one-line reason.
    const reasonOf = (id: string) => items.find((i) => i.skillId === id)!.reason;
    expect(reasonOf("eng-ai-prompting-for-code")).toBe("Moved up: the evaluation found AI-driven skills weak (1/5), and they speed up the rest of your path.");
    expect(reasonOf("eng-js-async")).toBe("Comes before your goal: backend. It needs Promises & async/await, which you're missing (1/5; it needs 3/5).");
    expect(reasonOf("eng-node-runtime")).toMatch(/backend/i);
    // Parts are priority bands and never go backwards: Critical/High first, then the Medium AI goal.
    expect(items.every((item, i) => i === 0 || item.partNumber! >= items[i - 1].partNumber!)).toBe(true);
    expect(items.filter((i) => i.skillId === "eng-ai-reusable-skills").every((i) => i.partNumber === 2)).toBe(true);
    expect(items.find((i) => i.skillId === "eng-js-async")).toMatchObject({ partType: "prerequisite", targetSkill: "Node.js runtime & core modules" });

    // The run checked its own order (prerequisites, parts) and found nothing to say.
    const audit = ctx.db.select().from(schema.aiAuditLog).where(eq(schema.aiAuditLog.pathId, outcome.pathId)).all();
    expect(audit.filter((a) => a.step === "parts")).toEqual([]);
    expect(audit.some((a) => a.step === "order")).toBe(true);

    // The modules of every step reach the learner's library.
    const view = currentPath(ctx.db, learner.id, ctx.content)!;
    expect(view.items.every((i) => i.reason.length > 0)).toBe(true);
    await ctx.close();
  }, 120_000);

  test("the evaluation names the missing link and mastery per skill", async () => {
    const ctx = await createTestApp();
    const { learner } = await learnerWithGoals(ctx, goals);
    const analysis = analyseEvaluation(ctx.db, learner.id, evaluation);
    expect(analysis.missingLinks).toEqual([
      {
        skillId: "eng-js-async",
        skillName: "Promises & async/await",
        mastery: 1,
        neededLevel: 3,
        forGoal: "Backend",
        blocks: ["Node.js runtime & core modules", "Express.js"],
      },
    ]);
    expect(analysis.noGap).toBe(false);
    // Measured levels as given; JavaScript's prerequisites inferred from the 4/5 on React and JS.
    expect(analysis.mastery.find((m) => m.skillId === "eng-git")).toMatchObject({ level: 2, source: "measured" });
    expect(analysis.mastery.find((m) => m.skillId === "eng-js-execution-context")).toMatchObject({ level: 3, source: "inferred" });
    await ctx.close();
  }, 60_000);
});

describe("mastered goals, no gap, capstones", () => {
  test("a mastered goal skill is skipped and reported as met", async () => {
    const ctx = await createTestApp();
    const { learner } = await learnerWithGoals(ctx, [goal("Git", ["eng-git", "eng-github-flow"], 5), goal("SQL", ["eng-sql"], 4)]);
    const evaluation = v4([skill("eng-git", 4), skill("eng-github-flow", 1), skill("eng-sql", 2)]);
    const outcome = await runBuilder({ userId: learner.id, assessmentId: null, evaluation, adminNotes: "" }, { db: ctx.db, env: ctx.env, ai: ctx.ai, content: ctx.content });
    expect(skillOrder(pathItems(ctx, outcome.pathId))).toEqual(["eng-github-flow", "eng-sql"]);
    const analysis = analyseEvaluation(ctx.db, learner.id, evaluation);
    expect(analysis.metGoals).toEqual([{ skillId: "eng-git", skillName: "Git fundamentals", mastery: 4, neededLevel: 3, optionalAdvanced: true }]);
    await ctx.close();
  }, 60_000);

  test("with no gap the path continues the progression and the admin is offered the next goals", async () => {
    const ctx = await createTestApp();
    const { learner } = await learnerWithGoals(ctx, [goal("Git", ["eng-git"], 5)]);
    const evaluation = v4([skill("eng-git", 4)]);
    const analysis = analyseEvaluation(ctx.db, learner.id, evaluation);
    expect(analysis.noGap).toBe(true);
    expect(analysis.missingLinks).toEqual([]);
    expect(analysis.order.steps.length).toBeGreaterThan(0);
    expect(analysis.order.steps.every((s) => s.kind === "continuation")).toBe(true);
    // Git → GitHub flow / advanced Git: what builds on the goal.
    expect(analysis.order.steps.map((s) => s.skillId)).toContain("eng-github-flow");

    const names = new Map(goalPathContext(ctx.db, learner.id, evaluation).catalog.skills.map((s) => [s.id, s.name]));
    const created = createSuggestions(ctx.db, learner.id, progressionCandidates(analysis, names));
    expect(created.length).toBeGreaterThan(0);
    expect(created.every((s) => s.kind === "progression")).toBe(true);
    expect(listSuggestions(ctx.db, learner.id).map((s) => s.skillIds[0])).toContain("eng-github-flow");

    const outcome = await runBuilder({ userId: learner.id, assessmentId: null, evaluation, adminNotes: "" }, { db: ctx.db, env: ctx.env, ai: ctx.ai, content: ctx.content });
    const items = pathItems(ctx, outcome.pathId);
    // In the continuation's order. v4.4: a step with no curriculum module (code review) is on the path
    // as a course being made, waiting here because the web search isn't connected in tests.
    const ordered = skillOrder(items);
    expect(ordered).toEqual(analysis.order.steps.map((s) => s.skillId));
    expect(outcome.waitingForResearch ?? 0).toBe(items.filter((i) => i.moduleId?.startsWith("newcourse:")).length);
    expect(items[0].reason).toBe("Next after Git fundamentals. You've met your goal (Git), so this continues it.");
    await ctx.close();
  }, 60_000);

  test("a case goal ends with its capstone, which shows achieved once the goal is", async () => {
    const ctx = await createTestApp();
    const { admin, learner } = await learnerWithGoals(ctx, [
      goal("Resolve a merge conflict and open a clean PR", ["eng-git", "eng-github-flow"], 5, 2, { type: "case", caseId: "eng-git-merge-conflict-pr" }),
      goal("SQL", ["eng-sql"], 3),
    ]);
    const evaluation = v4([skill("eng-git", 1), skill("eng-github-flow", 1), skill("eng-sql", 1)]);
    const outcome = await runBuilder({ userId: learner.id, assessmentId: null, evaluation, adminNotes: "" }, { db: ctx.db, env: ctx.env, ai: ctx.ai, content: ctx.content });
    const items = pathItems(ctx, outcome.pathId);
    const capstoneAt = items.findIndex((i) => i.partType === "capstone");
    const lastGit = items.map((i) => i.skillId).lastIndexOf("eng-github-flow");
    expect(capstoneAt).toBe(lastGit + 1);
    expect(items.findIndex((i) => i.skillId === "eng-sql")).toBeGreaterThan(capstoneAt);
    const goalId = listGoals(ctx.db, learner.id)[0].id;
    expect(items[capstoneAt].moduleId).toBe(`goal:${goalId}`);

    let view = currentPath(ctx.db, learner.id, ctx.content)!;
    let capstone = view.items.find((i) => i.goalId === goalId)!;
    expect(capstone).toMatchObject({ href: `/goals/${goalId}`, goalAchieved: false, courseTitle: "Capstone: Resolve a conflict in cart.js and open the PR" });

    // The admin's "Mark achieved" (for a capstone that cannot be auto-graded) shows on the path.
    const res = await ctx.app.inject({ method: "POST", url: `/api/admin/users/${learner.id}/goals/${goalId}/achieve`, ...as(admin) });
    expect(res.statusCode).toBe(200);
    view = currentPath(ctx.db, learner.id, ctx.content)!;
    capstone = view.items.find((i) => i.goalId === goalId)!;
    expect(capstone).toMatchObject({ goalAchieved: true, completedCount: 1 });
    await ctx.close();
  }, 60_000);
});
