import { afterEach, describe, expect, test } from "vitest";

import type { SkillResult } from "../../../shared/assessmentV4";
import type { SkillBundle } from "../../../shared/bundles";
import { trackBasics } from "../../../shared/catalog";
import type { OnboardSuggestion } from "../../../shared/goals";
import { intentCoverage, unsureMessage, type Intent } from "../../../shared/intents";
import type { AssessmentMix, LearnerSetup } from "../../../shared/setup";
import { MockProvider } from "../ai/adapters/mock";
import { MOCK_UNGROUNDED_PHRASE, MOCK_UNKNOWN_SKILL } from "../ai/adapters/mockGoals";
import { coreSkillIds, goalPathContext, planGoalPath } from "../builder/goalPath";
import { getCatalog } from "../catalog/repo";
import { activeLearner, adminSession, as, createTestApp, type Session, type TestContext } from "../test/harness";
import { ensureBundleSeed, getBundle, SEED_BUNDLES, SOFT_SKILL_IDS } from "./bundles";
import { checkIntents, rulesCatalog } from "./suggest";

/**
 * v4.4 Phase 1: nothing in the admin's description gets dropped. The reference case end to end:
 * Suggest → save → the assessment's mix → a weak evaluation → the planned path.
 */

const REFERENCE = "frontend engineer with 1 year of experience and also want him to move to the full stack and also improve the soft skills";
const NONSENSE = `${REFERENCE}, and also learn quantum basket weaving`;

let ctx: TestContext;
let admin: Session;
let learnerId: string;

async function setUp(options: Parameters<typeof createTestApp>[1] = {}) {
  ctx = await createTestApp({}, options);
  admin = await adminSession(ctx);
  learnerId = (await activeLearner(ctx, admin)).id;
}

afterEach(async () => {
  await ctx?.close();
});

async function suggest(description: string, departmentId = "engineering"): Promise<OnboardSuggestion> {
  const res = await ctx.app.inject({ method: "POST", url: "/api/admin/onboard/suggest", ...as(admin), payload: { departmentId, description } });
  expect(res.statusCode).toBe(200);
  return res.json().suggestion as OnboardSuggestion;
}

function saveBody(s: OnboardSuggestion, description: string, extra: Record<string, unknown> = {}) {
  return {
    departmentId: s.departmentId,
    trackId: s.trackId,
    stackIds: s.stackIds,
    experienceBand: s.experienceBand,
    level: s.level,
    hoursPerWeek: s.hoursPerWeek,
    description,
    goals: s.goals,
    intents: s.intents,
    unsure: s.unsure,
    ...extra,
  };
}

const fullstack = () => SEED_BUNDLES.find((b) => b.id === "eng-fullstack-from-frontend")!;

function expectReferenceIntents(s: OnboardSuggestion) {
  expect(s.unsure).toEqual([]);
  expect(s.intents.map((i) => [i.id, i.type, i.phrase])).toEqual([
    ["i1", "current_role", "frontend engineer with 1 year of experience"],
    ["i2", "move_role", "move to the full stack"],
    ["i3", "improve_area", "improve the soft skills"],
  ]);
  const [role, move, soft] = s.intents as [Intent, Intent, Intent];
  expect(role).toMatchObject({ trackId: "frontend", years: 1, slider: 0 });
  expect(role.skillIds.length).toBeGreaterThan(0);
  expect(move).toMatchObject({ bundleId: "eng-fullstack-from-frontend", slider: 4, statement: "Become a full-stack developer" });
  expect(move.skillIds).toEqual(fullstack().skillIds);
  expect(soft).toMatchObject({ bundleId: "soft-skills-engineer", slider: 3 });
  expect([...soft.skillIds].sort()).toEqual([...SOFT_SKILL_IDS].sort());
  // Ranked below the role move.
  expect(soft.slider).toBeLessThan(move.slider);
  // Goals built from the intents: two text goals that quote their phrase.
  expect(s.trackId).toBe("frontend");
  expect(s.experienceBand).toBe("1-2");
  expect(s.goals.map((g) => [g.type, g.originalText, g.intentId])).toEqual([
    ["text", "move to the full stack", "i2"],
    ["text", "improve the soft skills", "i3"],
  ]);
}

describe("the reference case", () => {
  test("Suggest (mock AI) returns exactly its three intents; the ungrounded quote and the unknown skill are dropped", async () => {
    await setUp();
    const s = await suggest(REFERENCE);
    expect(s.source).toBe("ai");
    expectReferenceIntents(s);
    expect(s.intents.some((i) => i.phrase === MOCK_UNGROUNDED_PHRASE)).toBe(false);
    expect(s.intents.flatMap((i) => i.skillIds)).not.toContain(MOCK_UNKNOWN_SKILL);
  });

  test("the rules (no AI) read the same three intents", async () => {
    await setUp({ noAi: true });
    const s = await suggest(REFERENCE);
    expect(s.source).toBe("rules");
    expectReferenceIntents(s);
  });

  test("when the AI fails, the rules still read every intent", async () => {
    await setUp({ provider: new MockProvider({}, new Error("provider down")) });
    expectReferenceIntents(await suggest(REFERENCE));
  });

  test("saved, tested and planned: every intent reaches the assessment and the path", async () => {
    await setUp();
    const s = await suggest(REFERENCE);
    const put = await ctx.app.inject({ method: "PUT", url: `/api/admin/users/${learnerId}/setup`, ...as(admin), payload: saveBody(s, REFERENCE) });
    expect(put.statusCode).toBe(200);
    const saved = put.json().setup as LearnerSetup;
    expect(saved.description).toBe(REFERENCE);
    expect(saved.intents.map((i) => i.id)).toEqual(["i1", "i2", "i3"]);
    expect(saved.goals.map((g) => g.intentId)).toEqual(["i2", "i3"]);

    // The assessment: frontend core, the start of the backend progression, and soft skills.
    const mix = put.json().mix as AssessmentMix;
    const asked = mix.lines.filter((l) => l.count > 0).map((l) => l.skillId);
    expect(mix.total).toBe(25);
    expect(mix.lines.reduce((n, l) => n + l.count, 0)).toBe(25);
    const catalog = getCatalog(ctx.db, { departmentId: "engineering", withAreas: true });
    const core = trackBasics(catalog, "engineering", "frontend", saved.stackIds).map((sk) => sk.id);
    expect(core.length).toBeGreaterThan(0);
    expect(asked.some((id) => core.includes(id))).toBe(true);
    expect(asked).toContain("eng-http");
    expect(asked.some((id) => fullstack().skillIds.includes(id))).toBe(true);
    expect(asked.some((id) => id.startsWith("ss-"))).toBe(true);
    const testCoverage = intentCoverage(saved.intents, asked, [], {}, { coreSkillIds: core });
    expect(testCoverage.missingBlueprint).toEqual([]);

    // A weak evaluation (1/5 on everything it touched), then the path.
    const touched = [...new Set([...core, ...saved.intents.flatMap((i) => i.skillIds)])];
    const skills: SkillResult[] = touched.map((skillId) => ({ skillId, skillName: skillId, group: "focus", slider: 4, priority: "high", asked: 2, unknown: 0, score: 0.2, level: 1 }));
    const pathCtx = goalPathContext(ctx.db, learnerId, { skills });
    const plan = planGoalPath(pathCtx, { gaps: [], refreshSkill: null, assessmentFoundGaps: true });
    const onPath = plan.items.map((i) => i.skillId).filter((id): id is string => id != null);
    // The full-stack progression…
    for (const id of ["eng-http", "eng-node-runtime", "eng-express", "eng-sql", "eng-auth-sessions-jwt"]) expect(onPath).toContain(id);
    // …and soft skills (TODO P2/P5: real courses; here the planned parts are asserted).
    expect(onPath.filter((id) => id.startsWith("ss-")).length).toBeGreaterThan(0);
    expect(plan.intents.missingPath).toEqual([]);
    expect(plan.intents.lines.map((l) => [l.intentId, l.inPath])).toEqual([
      ["i1", true],
      ["i2", true],
      ["i3", true],
    ]);
    expect(intentCoverage(saved.intents, asked, onPath, {}, { coreSkillIds: coreSkillIds(pathCtx.catalog, pathCtx.setup) }).missingPath).toEqual([]);
  });

  test("an intent the goals no longer reach still gets a test question and a path item", async () => {
    await setUp();
    const s = await suggest(REFERENCE);
    // The admin removed the soft-skills goal by hand but kept the intent: the guarantee still holds.
    const body = saveBody(s, REFERENCE, { goals: s.goals.filter((g) => g.intentId !== "i3") });
    const put = await ctx.app.inject({ method: "PUT", url: `/api/admin/users/${learnerId}/setup`, ...as(admin), payload: body });
    expect(put.statusCode).toBe(200);
    const mix = put.json().mix as AssessmentMix;
    expect(mix.lines.some((l) => l.count > 0 && l.skillId.startsWith("ss-"))).toBe(true);
    expect(mix.lines.reduce((n, l) => n + l.count, 0)).toBe(25);
    const pathCtx = goalPathContext(ctx.db, learnerId, { skills: [] });
    const plan = planGoalPath(pathCtx, { gaps: [], refreshSkill: null, assessmentFoundGaps: false });
    expect(plan.items.some((i) => i.skillId?.startsWith("ss-") && i.reasonText?.includes("improve the soft skills"))).toBe(true);
    expect(plan.intents.missingPath).toEqual([]);
  });

  test("an intent already met needs no path item, and says why", async () => {
    await setUp();
    const s = await suggest(REFERENCE);
    await ctx.app.inject({ method: "PUT", url: `/api/admin/users/${learnerId}/setup`, ...as(admin), payload: saveBody(s, REFERENCE) });
    const skills: SkillResult[] = SOFT_SKILL_IDS.map((skillId) => ({ skillId, skillName: skillId, group: "other", slider: 3, priority: "medium", asked: 1, unknown: 0, score: 1, level: 5 }));
    const plan = planGoalPath(goalPathContext(ctx.db, learnerId, { skills }), { gaps: [], refreshSkill: null, assessmentFoundGaps: false });
    const soft = plan.intents.lines.find((l) => l.intentId === "i3")!;
    expect(soft.inPath).toBe(false);
    expect(soft.reason).toBe("Already strong: scored 5/5");
    expect(plan.intents.missingPath).toEqual([]);
  });
});

describe("nothing is dropped silently", () => {
  test("a nonsense phrase becomes an Unsure, and every save path refuses until it is answered", async () => {
    await setUp();
    const s = await suggest(NONSENSE);
    expect(s.intents).toHaveLength(3);
    expect(s.unsure).toHaveLength(1);
    expect(s.unsure[0]!.phrase).toBe("learn quantum basket weaving");
    expect(s.unsure[0]!.options.at(-1)).toMatchObject({ leaveOut: true });

    const put = await ctx.app.inject({ method: "PUT", url: `/api/admin/users/${learnerId}/setup`, ...as(admin), payload: saveBody(s, NONSENSE) });
    expect(put.statusCode).toBe(400);
    expect(put.json().error.message).toBe(unsureMessage("learn quantum basket weaving"));

    // Sending no Unsure but intents that leave the phrase uncovered is refused the same way.
    const sneaky = await ctx.app.inject({ method: "PUT", url: `/api/admin/users/${learnerId}/setup`, ...as(admin), payload: saveBody(s, NONSENSE, { unsure: [] }) });
    expect(sneaky.statusCode).toBe(400);

    // Bulk onboarding refuses the row.
    const bulk = await ctx.app.inject({
      method: "POST",
      url: "/api/admin/onboard/bulk",
      ...as(admin),
      payload: { rows: [{ username: "bulk.one", displayName: "Bulk One", setup: saveBody(s, NONSENSE) }] },
    });
    expect(bulk.statusCode).toBe(200);
    expect(bulk.json().results[0]).toMatchObject({ ok: false, error: unsureMessage("learn quantum basket weaving") });

    // Answered with "Leave it out": saved.
    const leaveOut = { id: "i4", phrase: "learn quantum basket weaving", type: "improve_area", statement: "Leave it out", skillIds: [], targetLevel: 3, slider: 0, status: "left_out" };
    const ok = await ctx.app.inject({ method: "PUT", url: `/api/admin/users/${learnerId}/setup`, ...as(admin), payload: saveBody(s, NONSENSE, { unsure: [], intents: [...s.intents, leaveOut] }) });
    expect(ok.statusCode).toBe(200);
  });

  test("a phrase the model missed is mapped by code when it clearly names a catalog skill; else it is asked", async () => {
    await setUp({ noAi: true });
    const description = `${REFERENCE}, plus Docker Compose, plus quantum basket weaving`;
    // What a model that skipped the last two phrases would return (only the reference intents).
    const raw = (await suggest(REFERENCE)).intents.map((i) => ({ ...i, bundleId: i.bundleId ?? null, caseId: i.caseId ?? null, trackId: i.trackId ?? null, years: i.years ?? null, hoursPerWeek: null, deadlineWeeks: null }));
    const checked = checkIntents(rulesCatalog(ctx.db, "engineering"), getCatalog(ctx.db), description, raw);
    const mapped = checked.intents.find((i) => i.phrase === "Docker Compose");
    expect(mapped).toMatchObject({ autoMapped: true, skillIds: ["eng-docker-compose"] });
    expect(checked.unsure.map((u) => u.phrase)).toEqual(["quantum basket weaving"]);
    expect(checked.intents.map((i) => i.id)).toEqual(["i1", "i2", "i3", "i4"]);
  });

  test("a role and a want joined by 'who' are read separately; a plural finds the singular alias (v4.4 P7)", async () => {
    await setUp();
    // Found by the bulk e2e: the whole line was one phrase, so the role was lost and the row was
    // blocked on a question about all of it.
    const s = await suggest("Sales lead who should write proposals", "bd");
    expect(s.unsure).toEqual([]);
    expect(s.intents.map((i) => [i.type, i.phrase])).toEqual([
      ["current_role", "Sales lead"],
      ["improve_area", "write proposals"],
    ]);
    expect(s.intents[1]!.skillIds).toContain("bd-proposals-sows");
    // Without the AI the rules read it the same way; alone, "write proposals" is mapped by code.
    await ctx.close();
    await setUp({ noAi: true });
    expect((await suggest("Sales lead who should write proposals", "bd")).unsure).toEqual([]);
    const alone = await suggest("write proposals", "bd");
    expect(alone.unsure).toEqual([]);
    expect(alone.intents[0]).toMatchObject({ phrase: "write proposals", autoMapped: true, skillIds: ["bd-proposals-sows"] });
  });

  test("words that name two skills equally are asked about, not given to one of them (v4.4 P7)", async () => {
    await setUp();
    // "pipeline" is an alias of both Node streams and MongoDB aggregation; the rules used to pick
    // the first, so "zorblax" was silently read as Node streams at Most important.
    const description = `${REFERENCE} and also handle the zorblax pipeline`;
    const s = await suggest(description);
    expect(s.intents.map((i) => i.type)).toEqual(["current_role", "move_role", "improve_area"]);
    expect(s.unsure.map((u) => u.phrase)).toEqual(["handle the zorblax pipeline"]);
    expect(s.goals.some((g) => g.skillIds.includes("eng-node-streams"))).toBe(false);
    // A word written as an alias beats the same word as a folded plural of another skill's name.
    expect((await suggest("weak on pipelines")).intents[0]).toMatchObject({ phrase: "weak on pipelines", skillIds: ["eng-ci-cd"] });
    // A skill whose own name holds the word beats one that has it only as an alias.
    const pm = await suggest("New PM from client services, weak on Excel and client calls", "pm");
    expect(pm.unsure).toEqual([]);
    expect(pm.intents.find((i) => i.phrase === "weak on Excel")?.skillIds).toEqual(["pm-excel-for-pms"]);
  });

  test("a PM learner can have soft skills; an area is never a learner's department", async () => {
    await setUp({ noAi: true });
    const s = await suggest("project manager, 3 years, improve the soft skills", "pm");
    const soft = s.intents.find((i) => i.bundleId === "soft-skills-client");
    expect(soft?.skillIds.every((id) => id.startsWith("ss-"))).toBe(true);
    const put = await ctx.app.inject({ method: "PUT", url: `/api/admin/users/${learnerId}/setup`, ...as(admin), payload: saveBody(s, "project manager, 3 years, improve the soft skills") });
    expect(put.statusCode).toBe(200);
    expect((put.json().setup as LearnerSetup).goals.some((g) => g.skillIds.includes("ss-teamwork"))).toBe(true);

    const area = await ctx.app.inject({ method: "POST", url: "/api/admin/onboard/suggest", ...as(admin), payload: { departmentId: "soft", description: "anything" } });
    expect(area.statusCode).toBe(400);
  });
});

describe("skill groups", () => {
  test("seeded once; admin edits and deletes survive a re-seed", async () => {
    await setUp();
    const list = await ctx.app.inject({ method: "GET", url: "/api/admin/bundles", ...as(admin) });
    expect(list.statusCode).toBe(200);
    expect((list.json().bundles as SkillBundle[]).map((b) => b.id).sort()).toEqual(SEED_BUNDLES.map((b) => b.id).sort());

    const edited = { ...fullstack(), name: "Full-stack (ours)", phrases: ["full stack", "mern"], skillIds: ["eng-http", "eng-express"] };
    const put = await ctx.app.inject({ method: "PUT", url: "/api/admin/bundles/eng-fullstack-from-frontend", ...as(admin), payload: edited });
    expect(put.statusCode).toBe(200);
    const del = await ctx.app.inject({ method: "DELETE", url: "/api/admin/bundles/ai-driven-dev", ...as(admin) });
    expect(del.statusCode).toBe(200);
    ensureBundleSeed(ctx.db);
    expect(getBundle(ctx.db, "eng-fullstack-from-frontend")?.name).toBe("Full-stack (ours)");
    expect(getBundle(ctx.db, "ai-driven-dev")).toBeNull();
  });

  test("skills are checked: unknown ids and other departments' skills are refused, soft skills are fine", async () => {
    await setUp();
    const base = { name: "Client calls", departmentId: "pm", fromTrackIds: [], phrases: ["client calls"], targetLevel: 3, active: true };
    const unknown = await ctx.app.inject({ method: "POST", url: "/api/admin/bundles", ...as(admin), payload: { ...base, skillIds: ["nope"] } });
    expect(unknown.statusCode).toBe(400);
    const wrongDept = await ctx.app.inject({ method: "POST", url: "/api/admin/bundles", ...as(admin), payload: { ...base, skillIds: ["eng-git"] } });
    expect(wrongDept.statusCode).toBe(400);
    const ok = await ctx.app.inject({ method: "POST", url: "/api/admin/bundles", ...as(admin), payload: { ...base, skillIds: ["ss-client-team-communication"] } });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().bundle.id).toBe("client-calls");
  });
});
