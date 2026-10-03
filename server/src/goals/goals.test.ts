import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import type { SkillResult } from "../../../shared/assessmentV4";
import type { GoalInput, OnboardSuggestion } from "../../../shared/goals";
import { MockProvider } from "../ai/adapters/mock";
import { MOCK_UNKNOWN_SKILL } from "../ai/adapters/mockGoals";
import { schema } from "../db";
import { now } from "../lib/ids";
import { recordAttempt } from "../progress/repo";
import { listSkillPriorities, saveSetup } from "../setup/repo";
import { activeLearner, adminSession, as, createTestApp, type Session, type TestContext } from "../test/harness";
import { ensureOutcomeSeed, listOutcomes, OUTCOME_SEEDS } from "./outcomes";
import { achieveGoal, createSuggestions, gapCandidates, listGoals, listSuggestions, migrateV43Goals, refreshSuggestions, saveGoals } from "./repo";
import { rulesProfile } from "./rules";
import { rulesCatalog } from "./suggest";

const DESCRIPTION = "Frontend dev, 2 yrs React, weak on Git, we want him doing backend + AI-driven work";

/** A tiny placeholder library for these tests only (the real seeds are written elsewhere). */
const TERMINAL_CASE = {
  id: "test-merge-conflict",
  departmentId: "engineering",
  title: "Resolve a merge conflict and push",
  statement: "Can resolve a merge conflict in a feature branch and push a clean result.",
  skillIds: ["eng-git", "eng-github-flow"],
  level: 2,
  aliases: ["merge conflict"],
  capstone: {
    kind: "task",
    title: "The cart conflict",
    task: {
      kind: "terminal",
      title: "Resolve the cart conflict",
      prompt: "You pulled main and got a conflict in src/cart.js. Resolve it, commit and push.",
      cwd: "~/shop (feature/cart)",
      intro: "CONFLICT (content): Merge conflict in src/cart.js",
      files: [{ path: "src/cart.js", content: "<<<<<<< HEAD\nconst a = 1;\n=======\nconst a = 2;\n>>>>>>> main\n" }],
      steps: [
        { id: "add", goal: "Mark the file resolved", accept: ["^git add (src/cart\\.js|\\.)$"], output: "" },
        { id: "commit", goal: "Commit the merge", accept: ["^git commit( -m .+)?$"], output: "[feature/cart abc123] Merge" },
        { id: "push", goal: "Push the branch", accept: ["^git push( origin feature/cart)?$"], output: "To github.com:x/shop.git" },
      ],
      fileChecks: [{ path: "src/cart.js", mustContain: ["const a = 1;"], mustNotContain: ["<<<<<<<", "=======", ">>>>>>>"] }],
      explanation: "Keep HEAD's line, remove the markers, add, commit, push.",
    },
  },
};
const NEXT_CASE = { ...TERMINAL_CASE, id: "test-rebase-cleanly", title: "Rebase a branch cleanly", statement: "Can rebase a feature branch on main and resolve conflicts.", skillIds: ["eng-git", "eng-git-advanced"], level: 4, aliases: [] };
const TOPIC_CASE = {
  id: "test-react-agents",
  departmentId: "engineering",
  title: "Explain the ReAct pattern",
  statement: "Can explain how a ReAct agent interleaves reasoning and tool calls.",
  skillIds: ["eng-ai-claude-code"],
  level: 3,
  aliases: [],
  capstone: { kind: "topic", title: "ReAct practice", topicId: "agents-react-pattern" },
};
const BAD_SKILL = { ...TOPIC_CASE, id: "test-bad-skill", skillIds: ["pm-not-an-engineering-skill"] };
const BAD_TASK = { ...TERMINAL_CASE, id: "test-bad-task", capstone: { kind: "task", title: "Broken", task: { kind: "terminal", title: "x" } } };

let ctx: TestContext;
let admin: Session;
let learner: { id: string; username: string; session: Session };

async function setUp(options: Parameters<typeof createTestApp>[1] = {}) {
  ctx = await createTestApp({}, options);
  admin = await adminSession(ctx);
  learner = await activeLearner(ctx, admin);
  ensureOutcomeSeed(ctx.db, [TERMINAL_CASE, NEXT_CASE, TOPIC_CASE], { log: () => {} });
}

afterEach(async () => {
  await ctx?.close();
});

const goal = (over: Partial<GoalInput>): GoalInput => ({
  type: "skill",
  originalText: "x",
  outcome: "Can do x.",
  skillIds: ["eng-git"],
  targetLevel: 3,
  caseId: null,
  slider: 3,
  ...over,
});

describe("the practical-outcomes library", () => {
  beforeEach(() => setUp());

  test("upserts valid seeds and skips invalid ones with a reason", () => {
    const lines: string[] = [];
    const report = ensureOutcomeSeed(ctx.db, [TERMINAL_CASE, BAD_SKILL, BAD_TASK, { id: "Not An Id" }], { log: (l) => lines.push(l) });
    expect(report.upserted).toBe(1);
    expect(report.skipped.map((s) => s.id)).toEqual(["test-bad-skill", "test-bad-task", "Not An Id"]);
    expect(lines).toHaveLength(3);
    expect(listOutcomes(ctx.db, "engineering").some((o) => o.id === "test-merge-conflict")).toBe(true);
  });

  test("checks topic capstones when it knows the topics", () => {
    const report = ensureOutcomeSeed(ctx.db, [{ ...TOPIC_CASE, id: "test-missing-topic", capstone: { kind: "topic", title: "Gone", topicId: "no-such-topic" } }], {
      topicExists: (id) => ctx.content.hasTopic(id),
      log: () => {},
    });
    expect(report.skipped[0]?.reason).toMatch(/does not exist/);
  });

  test("the department seeds load (whatever is valid today)", () => {
    expect(Array.isArray(OUTCOME_SEEDS)).toBe(true);
    const report = ensureOutcomeSeed(ctx.db, OUTCOME_SEEDS, { log: () => {} });
    expect(report.upserted + report.skipped.length).toBe(OUTCOME_SEEDS.length);
  });

  test("the admin route searches a department's cases", async () => {
    const res = await ctx.app.inject({ method: "GET", url: "/api/admin/outcomes?departmentId=engineering&q=merge%20conflict", ...as(admin) });
    expect(res.statusCode).toBe(200);
    expect(res.json().outcomes[0].id).toBe("test-merge-conflict");
  });
});

describe("Suggest", () => {
  const suggest = async () => {
    const res = await ctx.app.inject({ method: "POST", url: "/api/admin/onboard/suggest", ...as(admin), payload: { departmentId: "engineering", description: DESCRIPTION } });
    expect(res.statusCode).toBe(200);
    return res.json().suggestion as OnboardSuggestion;
  };
  const expectDescriptionAware = (s: OnboardSuggestion) => {
    expect(s.experienceBand).toBe("1-2");
    expect(s.level).toBe(2);
    expect(s.hoursPerWeek).toBe(15);
    expect(s.stackIds).toContain("stack-react");
    expect(s.trackId).toBe("backend");
    const git = s.goals.find((g) => g.skillIds.includes("eng-git"));
    expect(git?.slider).toBe(5);
    expect(s.goals[0].slider).toBe(5);
    expect(s.goals.some((g) => g.skillIds.some((id) => id.startsWith("eng-ai-")))).toBe(true);
    expect(s.goals.flatMap((g) => g.skillIds)).not.toContain(MOCK_UNKNOWN_SKILL);
    // React is a strength, not a goal.
    expect(s.goals.some((g) => g.skillIds.includes("eng-react-fundamentals"))).toBe(false);
    expect(s.extras.length).toBeGreaterThan(0);
    expect(s.extras.every((e) => !s.goals.some((g) => g.caseId === null && e.caseId === null && e.skillIds.every((id) => g.skillIds.includes(id))))).toBe(true);
  };

  test("with the (mock) AI: one cached call, validated against the catalog", async () => {
    await setUp();
    const s = await suggest();
    expect(s.source).toBe("ai");
    expectDescriptionAware(s);
    const calls = ctx.db.select().from(schema.aiCalls).where(eq(schema.aiCalls.task, "onboard_suggest")).all();
    expect(calls).toHaveLength(1);
  });

  test("without AI: the rules fill everything and never block", async () => {
    await setUp({ noAi: true });
    const s = await suggest();
    expect(s.source).toBe("rules");
    expectDescriptionAware(s);
  });

  test("when the AI fails: falls back to the rules", async () => {
    await setUp({ provider: new MockProvider({}, new Error("provider down")) });
    const s = await suggest();
    expect(s.source).toBe("rules");
    expect(s.goals.length).toBeGreaterThan(0);
  });

  test("a description with nothing to match still gets the department defaults", async () => {
    await setUp({ noAi: true });
    const s = rulesProfile(rulesCatalog(ctx.db, "pm"), "New joiner, starts Monday");
    expect(s.goals.length).toBeGreaterThan(0);
  });
});

describe("free-text goals", () => {
  const interpret = async (text: string) => {
    const res = await ctx.app.inject({ method: "POST", url: "/api/admin/goals/interpret", ...as(admin), payload: { departmentId: "engineering", text } });
    expect(res.statusCode).toBe(200);
    return res.json();
  };

  test("reads skills (validated) and a level", async () => {
    await setUp();
    const r = await interpret("debug a failing Laravel queue in production");
    expect(r.source).toBe("ai");
    expect(r.interpretation.skillIds).toContain("eng-laravel-queues");
    expect(r.interpretation.skillIds).not.toContain(MOCK_UNKNOWN_SKILL);
    expect(r.interpretation.targetLevel).toBe(4);
    expect(r.interpretation.outcome).toMatch(/^Can debug/);
  });

  test("matches a library case", async () => {
    await setUp({ noAi: true });
    const r = await interpret("resolve a merge conflict on their own");
    expect(r.source).toBe("rules");
    expect(r.interpretation.caseId).toBe("test-merge-conflict");
    expect(r.interpretation.targetLevel).toBe(3);
  });

  test("says so when nothing links (and the AI's unknown skill is refused)", async () => {
    await setUp();
    const r = await interpret("sing in the office choir");
    expect(r.interpretation).toBeNull();
    expect(r.message).toMatch(/Pick the skills/);
  });
});

describe("goals drive the priorities (D2)", () => {
  beforeEach(() => setUp());

  test("each skill takes its highest slider; order is goal order then skill order", async () => {
    const res = await ctx.app.inject({
      method: "PUT",
      url: `/api/admin/users/${learner.id}/goals`,
      ...as(admin),
      payload: {
        goals: [
          goal({ type: "case", caseId: "test-merge-conflict", skillIds: ["eng-git", "eng-github-flow"], slider: 3 }),
          goal({ type: "text", skillIds: ["eng-docker", "eng-github-flow"], slider: 4, outcome: "Can ship a container." }),
          goal({ skillIds: ["eng-git"], slider: 5 }),
        ],
      },
    });
    expect(res.statusCode).toBe(200);
    const priorities = listSkillPriorities(ctx.db, learner.id);
    expect(priorities.map((p) => [p.skillId, p.slider])).toEqual([
      ["eng-git", 5],
      ["eng-github-flow", 4],
      ["eng-docker", 4],
    ]);
    expect(res.json().setup.goals).toHaveLength(3);
  });

  test("the setup save takes goals, and a v4.2 client's priorities become skill goals", async () => {
    const base = { departmentId: "engineering", trackId: "backend", stackIds: [], experienceBand: "1-2" as const, level: 2 as const, skip: [], hoursPerWeek: 15, advanced: { weekStartsMonday: false, deadlineWeeks: null, courseCap: 5, autoPublish: false, personalisation: "balanced" as const, autoAddSuggestions: false } };
    saveSetup(ctx.db, learner.id, { ...base, priorities: [{ skillId: "eng-sql", slider: 2 }], goals: [goal({ skillIds: ["eng-docker"], slider: 4 })] }, admin.user.id);
    expect(listSkillPriorities(ctx.db, learner.id).map((p) => p.skillId)).toEqual(["eng-docker"]);

    saveSetup(ctx.db, learner.id, { ...base, priorities: [{ skillId: "eng-sql", slider: 2 }, { skillId: "eng-http", slider: 5 }] }, admin.user.id);
    const goals = listGoals(ctx.db, learner.id);
    expect(goals.map((g) => [g.type, g.skillIds[0], g.slider])).toEqual([
      ["skill", "eng-http", 5],
      ["skill", "eng-sql", 2],
    ]);
    expect(goals[0].targetLevel).toBe(3);
  });

  test("a skill from another department is refused", async () => {
    const pmSkill = ctx.db.select().from(schema.skills).where(eq(schema.skills.departmentId, "pm")).get()!;
    const res = await ctx.app.inject({ method: "PUT", url: `/api/admin/users/${learner.id}/goals`, ...as(admin), payload: { goals: [goal({ skillIds: [pmSkill.id] })] } });
    expect(res.statusCode).toBe(400);
  });

  test("migrateV43Goals turns existing priorities into skill goals, once", () => {
    ctx.db.delete(schema.appMeta).where(eq(schema.appMeta.key, "v4.3.goals_migrated")).run();
    ctx.db.delete(schema.learnerGoals).run();
    ctx.db.delete(schema.learnerSkillPriorities).where(eq(schema.learnerSkillPriorities.userId, learner.id)).run();
    ctx.db.insert(schema.learnerSkillPriorities).values([
      { userId: learner.id, skillId: "eng-sql", skillName: "SQL", slider: 3, position: 0, createdAt: now() },
      { userId: learner.id, skillId: "eng-git", skillName: "Git fundamentals", slider: 5, position: 1, createdAt: now() },
    ]).run();
    expect(migrateV43Goals(ctx.db)).toBeGreaterThanOrEqual(1);
    const goals = listGoals(ctx.db, learner.id);
    expect(goals.map((g) => [g.type, g.skillIds[0], g.slider])).toEqual([
      ["skill", "eng-git", 5],
      ["skill", "eng-sql", 3],
    ]);
    expect(migrateV43Goals(ctx.db)).toBe(0);
    expect(listGoals(ctx.db, learner.id)).toHaveLength(2);
  });
});

describe("suggestions", () => {
  beforeEach(() => setUp());

  const weak = (skillId: string, skillName: string, level: number, slider: number | null = 4): SkillResult => ({
    skillId,
    skillName,
    group: "focus",
    slider,
    priority: null,
    asked: 3,
    unknown: 0,
    score: level / 5,
    level,
  });

  test("gaps from the assessment, without duplicates, and dismissed ones stay dismissed", async () => {
    const result = { skills: [weak("eng-docker", "Docker fundamentals", 1), weak("eng-sql", "SQL", 2), weak("eng-http", "HTTP", 4)] };
    const first = refreshSuggestions(ctx.db, learner.id, result);
    expect(first.map((s) => s.kind)).toEqual(["gap", "gap"]);
    expect(first.flatMap((s) => s.skillIds)).not.toContain("eng-http");
    expect(refreshSuggestions(ctx.db, learner.id, result)).toEqual([]);

    const res = await ctx.app.inject({ method: "POST", url: `/api/admin/users/${learner.id}/goal-suggestions/${first[0].id}/dismiss`, ...as(admin) });
    expect(res.statusCode).toBe(200);
    expect(refreshSuggestions(ctx.db, learner.id, result)).toEqual([]);
    expect(listSuggestions(ctx.db, learner.id).map((s) => s.id)).toEqual([first[1].id]);
  });

  test("Undo of a dismiss (restore) puts the suggestion back as open; restoring an added one changes nothing", async () => {
    const [a, b] = createSuggestions(ctx.db, learner.id, gapCandidates(ctx.db, learner.id, { skills: [weak("eng-docker", "Docker fundamentals", 1), weak("eng-sql", "SQL", 2)] }));
    const url = (id: string, action: string) => `/api/admin/users/${learner.id}/goal-suggestions/${id}/${action}`;
    await ctx.app.inject({ method: "POST", url: url(a.id, "dismiss"), ...as(admin) });
    expect(listSuggestions(ctx.db, learner.id).map((s) => s.id)).toEqual([b.id]);
    const res = await ctx.app.inject({ method: "POST", url: url(a.id, "restore"), ...as(admin) });
    expect(res.statusCode).toBe(200);
    expect((res.json().suggestions as { id: string }[]).map((s) => s.id).sort()).toEqual([a.id, b.id].sort());

    await ctx.app.inject({ method: "POST", url: url(b.id, "add"), ...as(admin) });
    await ctx.app.inject({ method: "POST", url: url(b.id, "restore"), ...as(admin) });
    expect(listSuggestions(ctx.db, learner.id).map((s) => s.id)).toEqual([a.id]);
    expect((await ctx.app.inject({ method: "POST", url: url("nope", "restore"), ...as(admin) })).statusCode).toBe(404);
  });

  test("Add turns a suggestion into a goal and re-derives the priorities", async () => {
    const [s] = createSuggestions(ctx.db, learner.id, gapCandidates(ctx.db, learner.id, { skills: [weak("eng-docker", "Docker fundamentals", 1)] }));
    const res = await ctx.app.inject({ method: "POST", url: `/api/admin/users/${learner.id}/goal-suggestions/${s.id}/add`, ...as(admin) });
    expect(res.statusCode).toBe(200);
    expect(res.json().goal.source).toBe("suggested");
    expect(listSkillPriorities(ctx.db, learner.id).some((p) => p.skillId === "eng-docker")).toBe(true);
    expect(listSuggestions(ctx.db, learner.id)).toEqual([]);
    // Already a goal now: never suggested again.
    expect(refreshSuggestions(ctx.db, learner.id, { skills: [weak("eng-docker", "Docker fundamentals", 1)] })).toEqual([]);
  });

  test("a goal that already covers it is never suggested", () => {
    saveGoals(ctx.db, learner.id, [goal({ skillIds: ["eng-docker"], targetLevel: 4 })]);
    expect(refreshSuggestions(ctx.db, learner.id, { skills: [weak("eng-docker", "Docker fundamentals", 1)] })).toEqual([]);
  });

  test("auto-add (Advanced, off by default) adds without a click", () => {
    ctx.db.update(schema.learnerPriorities).set({ autoAddSuggestions: true }).where(eq(schema.learnerPriorities.userId, learner.id)).run();
    if (!ctx.db.select().from(schema.learnerPriorities).where(eq(schema.learnerPriorities.userId, learner.id)).get()) {
      ctx.db.insert(schema.learnerPriorities).values({ userId: learner.id, targetRole: "", autoAddSuggestions: true, updatedAt: now() }).run();
    }
    const created = refreshSuggestions(ctx.db, learner.id, { skills: [weak("eng-sql", "SQL", 1)] });
    expect(created).toHaveLength(1);
    expect(listSuggestions(ctx.db, learner.id, "added")).toHaveLength(1);
    expect(listGoals(ctx.db, learner.id).find((g) => g.skillIds.includes("eng-sql"))?.source).toBe("auto");
  });
});

describe("capstones and achievement", () => {
  beforeEach(() => setUp());

  const caseGoal = () => goal({ type: "case", caseId: "test-merge-conflict", skillIds: ["eng-git", "eng-github-flow"], targetLevel: 2, outcome: TERMINAL_CASE.statement });

  test("passing a terminal capstone achieves the goal and suggests the next level", async () => {
    const [g] = saveGoals(ctx.db, learner.id, [caseGoal()]);
    const list = await ctx.app.inject({ method: "GET", url: "/api/me/goals", ...as(learner.session) });
    expect(list.json().goals[0]).toMatchObject({ id: g.id, status: "active", capstone: { kind: "task", title: "The cart conflict" } });

    const cap = await ctx.app.inject({ method: "GET", url: `/api/me/goals/${g.id}/capstone`, ...as(learner.session) });
    expect(cap.statusCode).toBe(200);
    expect(cap.json().capstone.task.kind).toBe("terminal");
    expect(cap.json().capstone.task.fileChecks).toEqual([{ path: "src/cart.js" }]);
    expect(cap.json().capstone.task.explanation).toBeUndefined();

    const attempt = (response: unknown) => ctx.app.inject({ method: "POST", url: `/api/me/goals/${g.id}/capstone/attempt`, ...as(learner.session), payload: { response } });
    const wrong = await attempt({ kind: "terminal", commands: ["git push", "git status"], files: {} });
    expect(wrong.json()).toMatchObject({ passed: false, achieved: false, review: null });

    const right = await attempt({ kind: "terminal", commands: ["git status", "git add .", "git commit -m 'merge'", "git push"], files: { "src/cart.js": "const a = 1;\n" } });
    expect(right.json()).toMatchObject({ score: 1, passed: true, achieved: true });
    expect(right.json().review.explanation).toMatch(/Keep HEAD/);
    const stored = listGoals(ctx.db, learner.id)[0];
    expect(stored.status).toBe("achieved");
    expect(stored.achievedAt).not.toBeNull();
    // The next case up on the same skills: the lowest level above 2 (a real seed may sit below test-rebase-cleanly's 4).
    const [next] = listSuggestions(ctx.db, learner.id);
    expect(next.kind).toBe("next-level");
    const nextCase = listOutcomes(ctx.db, "engineering").find((o) => o.id === next.caseId)!;
    expect(nextCase.level).toBeGreaterThan(2);
    expect(nextCase.level).toBeLessThanOrEqual(4);
    expect(nextCase.skillIds.some((id) => id === "eng-git" || id === "eng-github-flow")).toBe(true);

    // A second pass does not achieve it again.
    expect((await attempt({ kind: "terminal", commands: ["git add .", "git commit", "git push"], files: { "src/cart.js": "const a = 1;" } })).json().achieved).toBe(false);
  });

  test("a goal at the top of the library is suggested at the next level on the same skills", () => {
    const [g] = saveGoals(ctx.db, learner.id, [goal({ skillIds: ["eng-docker"], targetLevel: 3 })]);
    achieveGoal(ctx.db, learner.id, g.id);
    const [s] = listSuggestions(ctx.db, learner.id);
    expect(s).toMatchObject({ kind: "next-level", skillIds: ["eng-docker"], targetLevel: 4, caseId: null });
  });

  test("passing a capstone topic's own practice achieves the goal", () => {
    const [g] = saveGoals(ctx.db, learner.id, [goal({ type: "case", caseId: "test-react-agents", skillIds: ["eng-ai-claude-code"] })]);
    recordAttempt(ctx.db, { userId: learner.id, topicId: "agents-react-pattern", kind: "quiz", score: 40, passed: false });
    expect(listGoals(ctx.db, learner.id)[0].status).toBe("active");
    recordAttempt(ctx.db, { userId: learner.id, topicId: "agents-react-pattern", kind: "quiz", score: 90, passed: true });
    const stored = ctx.db.select().from(schema.learnerGoals).where(and(eq(schema.learnerGoals.userId, learner.id), eq(schema.learnerGoals.id, g.id))).get();
    expect(stored?.status).toBe("achieved");
  });

  test("another learner's goal is not found", async () => {
    const [g] = saveGoals(ctx.db, learner.id, [caseGoal()]);
    const other = await activeLearner(ctx, admin, "learner.two");
    const res = await ctx.app.inject({ method: "GET", url: `/api/me/goals/${g.id}/capstone`, ...as(other.session) });
    expect(res.statusCode).toBe(404);
  });
});
