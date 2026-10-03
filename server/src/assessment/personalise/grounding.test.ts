import { and, eq, like } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { MockProvider } from "../../ai/adapters/mock";
import type { GenerateJsonRequest, GenerateJsonResult } from "../../ai/types";
import { schema } from "../../db";
import { activeLearner, adminSession, as, createTestApp, type TestContext } from "../../test/harness";
import { TOTAL_MAX_SEC, TOTAL_MIN_SEC } from "../../../../shared/timing";
import { enforceBlueprint, ROLEPLAY_SLOT_SEC } from "../../../../shared/personalise";
import type { Task } from "../../../../shared/tasks";
import { allowsRoleplay, groundingProblems, isProcessSkill, mergePicks, pickEntries, roleplayScenarioFor, type HandbookIndex, type HandbookIndexEntry } from "./grounding";

/**
 * v4.2 Phase 5: generation grounded in the handbook. Process items must cite handbook entries that
 * exist and are live; classification keys are recomputed from the stated facts with the decision
 * tool; a mini role-play stays short and only appears for meeting and client skills.
 */

const entry = (kind: HandbookIndexEntry["kind"], id: string, data: Record<string, unknown>, archived = false): [string, HandbookIndexEntry] => [
  `${kind}:${id}`,
  { kind, id, version: 3, archived, data: { id, status: "to-confirm", ...data } },
];

const index: HandbookIndex = new Map([
  entry("term", "change-request", { name: "Change request", aka: ["CR"], definition: "A change to agreed scope.", oyelabsMeaning: "x" }),
  entry("term", "enhancement", { name: "Enhancement", aka: [], definition: "An improvement.", oyelabsMeaning: "x" }),
  entry("term", "bug", { name: "Bug", aka: [], definition: "Does not work as specified.", oyelabsMeaning: "x" }),
  entry("term", "warranty", { name: "Warranty", aka: [], definition: "Free fixes after go-live.", oyelabsMeaning: "x" }),
  entry("term", "old-term", { name: "Old term", aka: [], definition: "Gone.", oyelabsMeaning: "x" }, true),
  entry("rule", "billing-change-request", { name: "Billing: change request", statement: "Typically billable." }),
  entry("stage", "custom-scope-control", { name: "Scope control", purpose: "Classify requests.", moduleId: "pmp-a09" }),
]);

const classifyTask = (answer: Record<string, string>): Task => ({
  kind: "categorize",
  prompt: "Classify.",
  mode: "classify-request",
  categories: [
    { id: "change-request", label: "Change request" },
    { id: "enhancement", label: "Enhancement" },
  ],
  items: [
    { id: "a", text: "Change the agreed checkout flow", explanation: "" },
    { id: "b", text: "Make search faster", explanation: "" },
  ],
  answer,
});

describe("handbook grounding rules", () => {
  test("process skills are pm-proc-* or tagged process", () => {
    expect(isProcessSkill({ id: "pm-proc-terms", tags: [] })).toBe(true);
    expect(isProcessSkill({ id: "bd-proc-terms", tags: ["process"] })).toBe(true);
    expect(isProcessSkill({ id: "pm-excel-for-pms", tags: ["excel"] })).toBe(false);
    expect(allowsRoleplay("pm-proc-meetings")).toBe(true);
    expect(allowsRoleplay("pm-client-management")).toBe(true);
    expect(allowsRoleplay("pm-proc-terms")).toBe(false);
  });

  test("a process item needs refs, and every ref must be a live entry", () => {
    const base = { skillId: "pm-proc-terms", processSkill: true, index, task: null, facts: null };
    expect(groundingProblems({ ...base, refs: [] })).toEqual(["a process item must cite handbook entries (handbookRefs)"]);
    expect(groundingProblems({ ...base, refs: ["term:change-request"] })).toEqual([]);
    expect(groundingProblems({ ...base, refs: ["term:no-such-term"] })).toEqual(["cites unknown handbook entry term:no-such-term"]);
    expect(groundingProblems({ ...base, refs: ["term:old-term"] })).toEqual(["cites archived handbook entry term:old-term"]);
    // A non-process item may go without refs, but a bad ref is still a bad ref.
    expect(groundingProblems({ ...base, processSkill: false, refs: [] })).toEqual([]);
    expect(groundingProblems({ ...base, processSkill: false, refs: ["rule:nope"] })).toEqual(["cites unknown handbook entry rule:nope"]);
  });

  test("a classification key is recomputed from the facts with the decision tool", () => {
    const base = { skillId: "pm-proc-terms", processSkill: true, index, refs: ["term:change-request"] };
    const facts = { a: { worksAsSpecified: "yes" as const, changeKind: "change" as const }, b: { worksAsSpecified: "yes" as const, changeKind: "improve" as const } };
    expect(groundingProblems({ ...base, task: classifyTask({ a: "change-request", b: "enhancement" }), facts })).toEqual([]);
    expect(groundingProblems({ ...base, task: classifyTask({ a: "enhancement", b: "enhancement" }), facts })).toEqual(["classify: a is keyed enhancement but its facts give change-request"]);
    expect(groundingProblems({ ...base, task: classifyTask({ a: "change-request", b: "enhancement" }), facts: null })).toEqual(["classify: no facts for a", "classify: no facts for b"]);
    expect(groundingProblems({ ...base, task: classifyTask({ a: "change-request", b: "enhancement" }), facts: { ...facts, b: { worksAsSpecified: "yes" } } })).toEqual([
      "classify: the facts for b do not decide a classification",
    ]);
  });

  test("an assessment role-play is 2-3 turns, a known scenario, no follow-up, and only for meeting and client skills", () => {
    const task: Task = { kind: "roleplay", prompt: "", scenarioId: "scope-creep", personaId: "startup-founder", maxTurns: 2, brief: "Hold scope.", rubric: [{ label: "Scope", points: 2 }], followUp: false };
    const base = { processSkill: true, index, refs: ["term:change-request"], facts: null };
    expect(groundingProblems({ ...base, skillId: "pm-proc-meetings", task })).toEqual([]);
    expect(groundingProblems({ ...base, skillId: "pm-proc-meetings", task: { ...task, maxTurns: 6 } })).toEqual(["roleplay: 6 turns (an assessment allows 2-3)"]);
    expect(groundingProblems({ ...base, skillId: "pm-proc-meetings", task: { ...task, scenarioId: "nope", followUp: true } })).toEqual(["roleplay: unknown scenario nope", "roleplay: no follow-up email inside an assessment"]);
    expect(groundingProblems({ ...base, skillId: "pm-proc-terms", task })).toEqual(["roleplay is not used for pm-proc-terms"]);
  });

  test("entries are picked by aliases, the hint and the scenario's terms, never archived, about 12 per call", () => {
    const skill = { id: "pm-proc-terms", name: "Project terminology mastery", aliases: ["change request", "warranty"], tags: ["process"], contentModules: ["pmp-a09"] };
    const picked = pickEntries(index, { skill, hint: "client says it is a bug" });
    expect(picked).toEqual(expect.arrayContaining(["term:change-request", "term:warranty", "term:bug", "stage:custom-scope-control"]));
    expect(picked).not.toContain("term:old-term");
    const scenario = roleplayScenarioFor(0, "");
    const withScenario = pickEntries(index, { skill: { ...skill, aliases: [] }, scenarioTermIds: ["enhancement"] });
    expect(withScenario[0]).toBe("term:enhancement");
    expect(scenario.scenarioId).toBeTruthy();
    expect(mergePicks([["a", "b", "c"], ["b", "d"]], 3)).toEqual(["a", "b", "d"]);
    expect(mergePicks(Array.from({ length: 5 }, (_, i) => Array.from({ length: 8 }, (_, j) => `${i}-${j}`)))).toHaveLength(12);
  });

  test("the blueprint keeps role-play only where it is allowed, in a longer slot", () => {
    const slots = enforceBlueprint({
      proposed: [
        { skillId: "meet", kind: "handsOn", subtype: "roleplay", difficulty: 2, hint: "" },
        { skillId: "terms", kind: "handsOn", subtype: "roleplay", difficulty: 2, hint: "" },
      ],
      mix: { lines: [{ skillId: "meet", skillName: "Meetings", group: "focus", count: 1, handsOn: 1, mcq: 0 }, { skillId: "terms", skillName: "Terms", group: "focus", count: 1, handsOn: 1, mcq: 0 }] } as never,
      skip: [],
      skillNames: new Map(),
      format: "tasks",
      difficultyOrder: [2, 3, 1],
      defaultHandsOn: () => "categorize",
      defaultMcq: () => "mcq-text",
      allowSubtype: (skillId, subtype) => subtype !== "roleplay" || skillId === "meet",
    });
    expect(slots.map((s) => [s.skillId, s.subtype, s.targetSec])).toEqual([
      ["meet", "roleplay", ROLEPLAY_SLOT_SEC],
      ["terms", "categorize", 80],
    ]);
  });
});

// ---------------------------------------------------------------------------
// The pipeline
// ---------------------------------------------------------------------------

type Slot = { slot: number; type: string; subtype: string; skill: string; refs?: string[]; scenarioId?: string; personaId?: string };

class ScriptedProvider extends MockProvider {
  users: unknown[] = [];
  constructor(private readonly generate: (slots: Slot[], user: { handbook?: { ref: string }[] }) => unknown[]) {
    super();
  }
  override async generateJson<T>(request: GenerateJsonRequest<T>): Promise<GenerateJsonResult<T>> {
    if (request.schemaName !== "assessment_items") return super.generateJson(request);
    const user = JSON.parse(request.user);
    this.users.push(user);
    return { data: request.schema.parse({ items: this.generate(user.slots, user) }), usage: { input: 100, output: 100 }, latencyMs: 1, model: "claude-sonnet-5-5" };
  }
}

const classifyItem = (slot: number, refs: string[], keyed: string) => ({
  slot,
  prompt: "Classify these client requests as the handbook defines them.",
  coding: null,
  mcq: null,
  task: {
    kind: "categorize",
    prompt: "Put each request in its category.",
    mode: "classify-request",
    categories: [
      { id: "change-request", label: "Change request" },
      { id: "enhancement", label: "Enhancement" },
      { id: "new-feature", label: "New feature" },
    ],
    items: [
      { id: "a", text: "Change the agreed two-step checkout into one step", explanation: "" },
      { id: "b", text: "Make the working search faster", explanation: "" },
      { id: "c", text: "Add a loyalty module nobody specified", explanation: "" },
      { id: "d", text: "Rename the agreed Orders tab to History", explanation: "" },
    ],
    answer: { a: keyed, b: "enhancement", c: "new-feature", d: "change-request" },
  },
  answerIsOutput: false,
  tags: [],
  handbookRefs: refs,
  facts: {
    a: { worksAsSpecified: "yes", changeKind: "change" },
    b: { worksAsSpecified: "yes", changeKind: "improve" },
    c: { worksAsSpecified: "yes", changeKind: "neither", brandNew: "yes" },
    d: { worksAsSpecified: "yes", changeKind: "change" },
  },
});

async function pmLearner(ctx: TestContext, priorities: { skillId: string; slider: number }[]) {
  const admin = await adminSession(ctx);
  const learner = await activeLearner(ctx, admin);
  const res = await ctx.app.inject({
    method: "PUT",
    url: `/api/admin/users/${learner.id}/setup`,
    ...as(admin),
    payload: {
      departmentId: "pm", trackId: "pm-agile", stackIds: [], experienceBand: "3-5", level: 3,
      priorities, skip: [], hoursPerWeek: 15,
      description: "Runs custom and white-label projects for overseas clients",
      advanced: { weekStartsMonday: false, deadlineWeeks: null, courseCap: 5, autoPublish: false, personalisation: "high" },
      assign: true,
    },
  });
  expect(res.statusCode).toBe(200);
  const id = res.json().issued.assessmentId as string;
  await ctx.drainJobs();
  return { id };
}

const reportOf = (ctx: TestContext, id: string) =>
  (ctx.db.select().from(schema.assessments).where(eq(schema.assessments.id, id)).get()!.config as { personalisation: { generated: number; rejected: { slot: number; reason: string }[] } }).personalisation;

describe("grounded generation", () => {
  test("process items without refs, with unknown or archived refs, or with a wrong classification key are rejected and logged", async () => {
    let call = 0;
    const provider = new ScriptedProvider((slots, user) => {
      call += 1;
      const known = (user.handbook ?? []).map((h) => h.ref);
      expect(known.length).toBeGreaterThan(0);
      expect(known.length).toBeLessThanOrEqual(12);
      return slots
        .filter((s) => s.type === "task")
        .map((s, i) => {
          // First round: one of each failure, then valid items.
          if (call === 1 && i === 0) return classifyItem(s.slot, [], "change-request");
          if (call === 1 && i === 1) return classifyItem(s.slot, ["term:not-in-the-handbook"], "change-request");
          if (call === 1 && i === 2) return classifyItem(s.slot, ["term:change-request"], "enhancement");
          return classifyItem(s.slot, [s.refs?.[0] ?? known[0]], "change-request");
        });
    });
    const ctx = await createTestApp({}, { provider });
    const { id } = await pmLearner(ctx, [
      { skillId: "pm-proc-terms", slider: 5 },
      { skillId: "pm-proc-custom", slider: 5 },
    ]);
    const report = reportOf(ctx, id);
    const reasons = report.rejected.map((r) => r.reason).join(" | ");
    expect(reasons).toMatch(/a process item must cite handbook entries/);
    expect(reasons).toMatch(/cites unknown handbook entry term:not-in-the-handbook/);
    expect(reasons).toMatch(/classify: a is keyed enhancement but its facts give change-request/);
    expect(report.generated).toBeGreaterThan(0);

    // Every generated process item is in the bank with its citations at the current versions.
    // (v4.3: the goal blueprint also probes the goals' prerequisite, the agency SDLC, which is not a
    // process skill, so only the process skills' generated items are counted here.)
    const rows = ctx.db.select().from(schema.questionBank).where(and(eq(schema.questionBank.source, "generated"), like(schema.questionBank.skillId, "pm-proc-%"))).all();
    const generatedProcess = ctx.db
      .select()
      .from(schema.assessmentItems)
      .where(and(eq(schema.assessmentItems.assessmentId, id), eq(schema.assessmentItems.origin, "generated"), like(schema.assessmentItems.area, "pm-proc-%")))
      .all();
    expect(rows.length).toBe(generatedProcess.length);
    const versions = new Map(ctx.db.select().from(schema.handbookEntries).all().map((e) => [`${e.kind}:${e.id}`, e.version]));
    for (const row of rows) {
      expect(row.handbookRefs.length).toBeGreaterThan(0);
      for (const ref of row.handbookRefs) expect(ref.version).toBe(versions.get(`${ref.kind}:${ref.id}`));
    }
    await ctx.close();
  }, 180_000);

  test("an archived entry cannot be cited", async () => {
    const provider = new ScriptedProvider((slots) => slots.filter((s) => s.type === "task").map((s) => classifyItem(s.slot, ["term:change-request"], "change-request")));
    const ctx = await createTestApp({}, { provider });
    ctx.db.update(schema.handbookEntries).set({ archived: true }).where(and(eq(schema.handbookEntries.kind, "term"), eq(schema.handbookEntries.id, "change-request"))).run();
    const { id } = await pmLearner(ctx, [{ skillId: "pm-proc-terms", slider: 5 }]);
    const report = reportOf(ctx, id);
    expect(report.rejected.some((r) => /cites archived handbook entry term:change-request/.test(r.reason))).toBe(true);
    // The archived entry is never offered to the model either.
    for (const user of provider.users as { handbook?: { ref: string }[] }[]) expect((user.handbook ?? []).map((h) => h.ref)).not.toContain("term:change-request");
    await ctx.close();
  }, 180_000);

  test("PM process slots get grounded categorize and form items plus a role-play, within the time window", async () => {
    const ctx = await createTestApp({}, { provider: new MockProvider() });
    const { id } = await pmLearner(ctx, [
      { skillId: "pm-proc-meetings", slider: 5 },
      { skillId: "pm-proc-terms", slider: 5 },
      { skillId: "pm-proc-custom", slider: 4 },
    ]);
    const items = ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.assessmentId, id)).all();
    expect(items).toHaveLength(25);
    const generatedKinds = new Set(items.filter((i) => i.origin === "generated").map((i) => (i.key as { task?: { kind: string } } | null)?.task?.kind ?? i.kind));
    expect([...generatedKinds]).toEqual(expect.arrayContaining(["categorize", "form"]));
    // The role-play slot is generated or, now that the bank holds validated role-plays, reused from it.
    const allKinds = new Set(items.map((i) => (i.key as { task?: { kind: string } } | null)?.task?.kind ?? i.kind));
    expect(allKinds.has("roleplay")).toBe(true);
    const roleplay = items.find((i) => (i.key as { task?: { kind: string } } | null)?.task?.kind === "roleplay")!;
    const task = (roleplay.key as { task: { maxTurns: number; scenarioId: string } }).task;
    expect(task.maxTurns).toBeGreaterThanOrEqual(2);
    expect(task.maxTurns).toBeLessThanOrEqual(3);
    expect(roleplay.estSeconds ?? 0).toBeLessThanOrEqual(ROLEPLAY_SLOT_SEC * 1.15);
    const bank = ctx.db.select().from(schema.questionBank).where(and(eq(schema.questionBank.source, "generated"), like(schema.questionBank.skillId, "pm-proc-%"))).all();
    expect(bank.length).toBeGreaterThan(0);
    for (const row of bank) expect(row.handbookRefs.length).toBeGreaterThan(0);
    const total = items.reduce((s, i) => s + (i.estSeconds ?? 0), 0);
    expect(total).toBeGreaterThanOrEqual(TOTAL_MIN_SEC);
    expect(total).toBeLessThanOrEqual(TOTAL_MAX_SEC);
    await ctx.close();
  }, 180_000);
});
