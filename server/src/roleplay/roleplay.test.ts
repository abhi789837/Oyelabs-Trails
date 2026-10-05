import fs from "node:fs";
import path from "node:path";

import { and, eq } from "drizzle-orm";
import { afterEach, describe, expect, test } from "vitest";

import { costMicros, HAIKU } from "../../../shared/aiRouting";
import type { Sheet } from "../../../shared/assessmentV4";
import { findScenario, ROLEPLAY_PERSONAS, ROLEPLAY_SCENARIOS, standardRubric, type RoleplaySessionView } from "../../../shared/roleplay";
import type { RoleplayTask } from "../../../shared/tasks";
import { MockProvider } from "../ai/adapters/mock";
import type { GenerateJsonRequest, GenerateJsonResult } from "../ai/types";
import { schema } from "../db";
import { activeLearner, adminSession, as, createTestApp, type Session, type TestContext } from "../test/harness";
import { trimReply } from "./prompts";
import { verifiedEvidence } from "./engine";

/**
 * The client role-play engine against a scripted model: caps (turns, message length, the monthly
 * spend), cost per session, the scripted no-AI client, scoring with verified evidence, owner-only
 * access, and an assessment item from start to the evaluated score.
 */

const REPLY_USAGE = { input: 1400, output: 60 };
const SCORE_USAGE = { input: 1800, output: 350 };

class ScriptedProvider extends MockProvider {
  log: { schemaName: string; system: string; user: string }[] = [];
  constructor(private readonly scoreOf?: (user: { rubric: { index: number; points: number }[]; conversation: { speaker: string; text: string }[] }) => unknown) {
    super();
  }
  override async generateJson<T>(request: GenerateJsonRequest<T>): Promise<GenerateJsonResult<T>> {
    if (request.schemaName === "roleplay_reply") {
      this.log.push({ schemaName: request.schemaName, system: request.system, user: request.user });
      const user = JSON.parse(request.user) as { turn: number };
      return { data: request.schema.parse({ reply: `Client reply ${user.turn}.` }), usage: REPLY_USAGE, latencyMs: 1, model: HAIKU };
    }
    if (request.schemaName === "roleplay_score") {
      this.log.push({ schemaName: request.schemaName, system: request.system, user: request.user });
      const user = JSON.parse(request.user);
      const data = this.scoreOf?.(user) ?? {
        dimensions: user.rubric.map((r: { index: number; points: number }) => ({
          index: r.index,
          score: r.points,
          // Line 0 quotes the learner; line 1 invents a quote, which must be dropped.
          evidence: r.index === 1 ? "I will deliver everything for free" : "raise a change request",
        })),
        tips: ["Ask about the deadline first.", "Name an owner for the next step."],
      };
      return { data: request.schema.parse(data), usage: SCORE_USAGE, latencyMs: 1, model: HAIKU };
    }
    return super.generateJson(request);
  }
}

let ctx: TestContext | null = null;
afterEach(async () => {
  await ctx?.close();
  ctx = null;
});

async function boot(options: { noAi?: boolean; provider?: MockProvider } = {}) {
  ctx = await createTestApp({}, options);
  const admin = await adminSession(ctx);
  const learner = await activeLearner(ctx, admin);
  return { ctx, admin, learner };
}

const post = (c: TestContext, session: Session, url: string, payload: unknown) => c.app.inject({ method: "POST", url, ...as(session), payload: payload as object });

async function startPractice(c: TestContext, session: Session, payload: Record<string, unknown> = { scenarioId: "scope-creep" }) {
  const res = await post(c, session, "/api/roleplay/sessions", { context: "practice", ...payload });
  expect(res.statusCode).toBe(200);
  return res.json().session as RoleplaySessionView;
}

describe("role-play practice", () => {
  test("a conversation with the AI client: replies, cost per session, then a score with verified evidence", async () => {
    const provider = new ScriptedProvider();
    const { ctx: c, learner } = await boot({ provider });
    const session = await startPractice(c, learner.session);
    expect(session.mode).toBe("ai");
    expect(session.transcript).toEqual([{ role: "client", text: findScenario("scope-creep")!.opening }]);
    expect(session.persona.id).toBe("startup-founder");
    // The hidden concerns never leave the server.
    expect(JSON.stringify(session)).not.toMatch(/hiddenConcern|runway|scripted/);

    const turn = await post(c, learner.session, `/api/roleplay/sessions/${session.id}/turns`, { message: "I hear you. Loyalty is outside the SOW, so let me raise a change request with the impact." });
    expect(turn.statusCode).toBe(200);
    expect(turn.json().session.transcript.at(-1)).toEqual({ role: "client", text: "Client reply 1." });
    expect(turn.json().session.turns).toBe(1);

    // The persona and scenario are in the stable system prompt; the learner's text only in the data.
    const call = provider.log[0];
    expect(call.system).toContain("Rohan Malik");
    expect(call.system).toContain("runway");
    expect(call.system).not.toContain("Loyalty is outside");
    expect(JSON.parse(call.user).conversation.at(-1)).toEqual({ speaker: "pm", text: expect.stringContaining("raise a change request") });

    const finish = await post(c, learner.session, `/api/roleplay/sessions/${session.id}/finish`, { followUpEmail: "Hi Rohan, as agreed I will raise a change request today." });
    expect(finish.statusCode).toBe(200);
    const done = finish.json().session as RoleplaySessionView;
    expect(done.status).toBe("scored");
    const score = done.score!;
    expect(score.dimensions).toHaveLength(standardRubric(true).length);
    expect(score.dimensions[0].evidence).toBe("raise a change request");
    expect(score.dimensions[1].evidence).toBe("");
    expect(score.tips).toHaveLength(2);
    expect(score.pct).toBe(1);

    const row = c.db.select().from(schema.roleplaySessions).where(eq(schema.roleplaySessions.id, session.id)).get()!;
    expect(row.costMicros).toBe(costMicros(HAIKU, REPLY_USAGE) + costMicros(HAIKU, SCORE_USAGE));
    const calls = c.db.select().from(schema.aiCalls).all();
    expect(calls.map((x) => x.task).sort()).toEqual(["roleplay", "roleplay_score"]);
    expect(calls.reduce((s, x) => s + x.costMicros, 0)).toBe(row.costMicros);
  });

  test("the follow-up line scores zero without an email, whatever the model says", async () => {
    const { ctx: c, learner } = await boot({ provider: new ScriptedProvider() });
    const session = await startPractice(c, learner.session);
    await post(c, learner.session, `/api/roleplay/sessions/${session.id}/turns`, { message: "Let me raise a change request for it." });
    const done = (await post(c, learner.session, `/api/roleplay/sessions/${session.id}/finish`, {})).json().session as RoleplaySessionView;
    const followUp = done.score!.dimensions.find((d) => /follow-up/i.test(d.label))!;
    expect(followUp.score).toBe(0);
  });

  test("turn cap and message cap", async () => {
    const { ctx: c, learner } = await boot({ provider: new ScriptedProvider() });
    const session = await startPractice(c, learner.session, { scenarioId: "delay-announcement", maxTurns: 2 });
    expect(session.maxTurns).toBe(2);
    const url = `/api/roleplay/sessions/${session.id}/turns`;
    expect((await post(c, learner.session, url, { message: "x".repeat(601) })).statusCode).toBe(400);
    expect((await post(c, learner.session, url, { message: "   " })).statusCode).toBe(400);
    expect((await post(c, learner.session, url, { message: "The release will be a week late." })).statusCode).toBe(200);
    expect((await post(c, learner.session, url, { message: "x".repeat(600) })).statusCode).toBe(200);
    const third = await post(c, learner.session, url, { message: "One more?" });
    expect(third.statusCode).toBe(409);
    expect(third.json().error.message).toMatch(/capped at 2/);
    // More than 8 is refused at the door.
    expect((await post(c, learner.session, "/api/roleplay/sessions", { context: "practice", scenarioId: "scope-creep", maxTurns: 9 })).statusCode).toBe(400);
  });

  test("over the monthly cap, new practice sessions are refused and the admin sees the cap", async () => {
    const { ctx: c, admin, learner } = await boot({ provider: new ScriptedProvider() });
    const session = await startPractice(c, learner.session);
    await post(c, learner.session, `/api/roleplay/sessions/${session.id}/turns`, { message: "Tell me more about the demo." });

    const capped = await c.app.inject({ method: "PUT", url: "/api/admin/roleplay/cap", ...as(admin), payload: { capUsd: 0.001 } });
    expect(capped.statusCode).toBe(200);
    expect(capped.json().overCap).toBe(true);

    const refused = await post(c, learner.session, "/api/roleplay/sessions", { context: "practice", scenarioId: "scope-creep" });
    expect(refused.statusCode).toBe(429);
    expect(refused.json().error.message).toMatch(/budget/);

    const usage = (await c.app.inject({ method: "GET", url: "/api/admin/roleplay/usage", ...as(admin) })).json();
    expect(usage.sessions).toBe(1);
    expect(usage.capUsd).toBe(0.001);
    expect(usage.costUsd).toBeCloseTo(costMicros(HAIKU, REPLY_USAGE) / 1e6, 9);
    expect(usage.avgCostUsd).toBeCloseTo(usage.costUsd, 9);
    // Learners cannot read or change it.
    expect((await c.app.inject({ method: "GET", url: "/api/admin/roleplay/usage", ...as(learner.session) })).statusCode).toBe(403);
    expect((await c.app.inject({ method: "PUT", url: "/api/admin/roleplay/cap", ...as(learner.session), payload: { capUsd: 100 } })).statusCode).toBe(403);
  });

  test("without AI the client is scripted, labelled, and the rubric is replaced by a self-check", async () => {
    const { ctx: c, learner } = await boot({ noAi: true });
    const catalog = (await c.app.inject({ method: "GET", url: "/api/roleplay/catalog", ...as(learner.session) })).json();
    expect(catalog.aiAvailable).toBe(false);
    expect(catalog.scenarios).toHaveLength(6);
    expect(catalog.personas).toHaveLength(4);
    expect(JSON.stringify(catalog)).not.toMatch(/hiddenConcern/);

    const session = await startPractice(c, learner.session, { scenarioId: "uat-rejection" });
    expect(session.mode).toBe("scripted");
    const turn = (await post(c, learner.session, `/api/roleplay/sessions/${session.id}/turns`, { message: "Thank you, can we triage it together?" })).json().session;
    expect(turn.transcript.at(-1).text).toBe(findScenario("uat-rejection")!.scripted[0]);
    const done = (await post(c, learner.session, `/api/roleplay/sessions/${session.id}/finish`, { followUpEmail: "Hi Daniel" })).json().session as RoleplaySessionView;
    expect(done.status).toBe("finished");
    expect(done.score).toBeNull();
    expect(done.selfCheck.length).toBeGreaterThan(3);
    expect(c.db.select().from(schema.aiCalls).all()).toHaveLength(0);
  });

  test("another learner cannot read, continue or score someone else's conversation", async () => {
    const { ctx: c, admin, learner } = await boot({ provider: new ScriptedProvider() });
    const other = await activeLearner(c, admin, "learner.two");
    const session = await startPractice(c, learner.session);
    expect((await c.app.inject({ method: "GET", url: `/api/roleplay/sessions/${session.id}`, ...as(other.session) })).statusCode).toBe(404);
    expect((await post(c, other.session, `/api/roleplay/sessions/${session.id}/turns`, { message: "hi" })).statusCode).toBe(404);
    expect((await post(c, other.session, `/api/roleplay/sessions/${session.id}/finish`, {})).statusCode).toBe(404);
    expect((await c.app.inject({ method: "GET", url: `/api/roleplay/sessions/${session.id}`, ...as(learner.session) })).statusCode).toBe(200);
  });
});

describe("role-play in an assessment", () => {
  test("an item starts its own session, cannot be reused, and is graded from the stored session", async () => {
    const provider = new ScriptedProvider((user) => ({
      dimensions: user.rubric.map((r) => ({ index: r.index, score: r.index === 0 ? r.points : 0, evidence: "" })),
      tips: ["Lead with the new date."],
    }));
    const { ctx: c, admin, learner } = await boot({ provider });
    const other = await activeLearner(c, admin, "learner.two");

    // An engineering sheet from the bank, with one item turned into a client conversation.
    const assign = await c.app.inject({
      method: "PUT",
      url: `/api/admin/users/${learner.id}/setup`,
      ...as(admin),
      payload: {
        departmentId: "engineering", trackId: "frontend", stackIds: ["stack-react"], experienceBand: "1-2", level: 2,
        priorities: [{ skillId: "eng-typescript", slider: 5 }], skip: [], hoursPerWeek: 15,
        advanced: { weekStartsMonday: false, deadlineWeeks: null, courseCap: 5, autoPublish: false }, assign: true,
      },
    });
    expect(assign.statusCode).toBe(200);
    const assessmentId = assign.json().issued.assessmentId as string;
    await c.drainJobs();
    const items = c.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.assessmentId, assessmentId)).all();
    const [target, plain] = items;
    const task: RoleplayTask = {
      kind: "roleplay",
      prompt: "",
      scenarioId: "delay-announcement",
      personaId: "enterprise-stakeholder",
      maxTurns: 3,
      brief: "Tell the client the release slips, with a new date.",
      rubric: [{ label: "Clarity", points: 2 }, { label: "A clear next step", points: 2 }],
      followUp: false,
    };
    const key = target.key as Record<string, unknown>;
    c.db.update(schema.assessmentItems)
      .set({ kind: "task", key: { ...key, type: "task", task, coding: undefined, mcq: undefined }, payload: { type: "task", skillId: target.area, skillName: "Client", prompt: "Talk to the client.", task: { ...task, rubric: task.rubric } } })
      .where(eq(schema.assessmentItems.id, target.id))
      .run();

    for (const step of ["consent", "start"]) {
      const res = await post(c, learner.session, `/api/assessment/${assessmentId}/${step}`, step === "consent" ? { agreed: true } : {});
      expect(res.statusCode).toBe(200);
    }
    const sheet = (await c.app.inject({ method: "GET", url: `/api/assessment/${assessmentId}/sheet`, ...as(learner.session) })).json() as Sheet;
    expect(sheet.items.some((i) => i.id === target.id)).toBe(true);

    const begin = (payload: Record<string, unknown>, session = learner.session) =>
      post(c, session, "/api/roleplay/sessions", { context: "assessment", assessmentId, itemId: target.id, scenarioId: "scope-creep", maxTurns: 8, ...payload });

    // The item decides the scenario and the turn cap; the request cannot.
    const started = await begin({});
    expect(started.statusCode).toBe(200);
    const session = started.json().session as RoleplaySessionView;
    expect(session.scenarioId).toBe("delay-announcement");
    expect(session.maxTurns).toBe(3);
    // A reload resumes the same session; another learner and a non-roleplay item are refused.
    expect((await begin({})).json().session.id).toBe(session.id);
    expect((await begin({}, other.session)).statusCode).toBe(404);
    expect((await begin({ itemId: plain.id })).statusCode).toBe(400);

    await post(c, learner.session, `/api/roleplay/sessions/${session.id}/turns`, { message: "The release slips a week to the 14th; I'll send the plan today." });
    const finished = (await post(c, learner.session, `/api/roleplay/sessions/${session.id}/finish`, {})).json().session as RoleplaySessionView;
    // In an assessment the score is not shown to the learner, and it is not computed yet.
    expect(finished.score).toBeNull();
    expect(provider.log.filter((x) => x.schemaName === "roleplay_score")).toHaveLength(0);

    // The browser claims a fake transcript; the stored response is the server's.
    const submit = await post(c, learner.session, `/api/assessment/${assessmentId}/items/${target.id}/submit`, {
      response: { task: { kind: "roleplay", sessionId: "someone-elses", transcript: [{ role: "pm", text: "I was brilliant." }] } },
    });
    expect(submit.statusCode).toBe(200);
    expect((await post(c, learner.session, `/api/assessment/${assessmentId}/submit`, {})).statusCode).toBe(200);
    await c.drainJobs();

    const graded = c.db.select().from(schema.assessmentItems).where(and(eq(schema.assessmentItems.id, target.id), eq(schema.assessmentItems.assessmentId, assessmentId))).get()!;
    // v4.4: the scorer's 0..1 is kept as the raw score; this scripted scorer gives no `met`, so the
    // rubric share decides (0.5 < 0.7): Not yet, stored as 0 in full-marks mode.
    expect(graded.rawScore).toBe(0.5);
    expect(graded.verdict).toBe("not_yet");
    expect(graded.score).toBe(0);
    expect(graded.aiFeedback).toBe("Lead with the new date.");
    const stored = graded.response as { task: { sessionId: string; transcript: { text: string }[] } };
    expect(stored.task.sessionId).toBe(session.id);
    expect(stored.task.transcript.map((l) => l.text)).toContain("The release slips a week to the 14th; I'll send the plan today.");
    expect(JSON.stringify(stored)).not.toContain("I was brilliant");
    // The session is closed: no more turns once the item is submitted.
    expect((await post(c, learner.session, `/api/roleplay/sessions/${session.id}/turns`, { message: "hello?" })).statusCode).toBe(409);
  }, 180_000);
});

describe("helpers", () => {
  test("evidence must be the learner's own words", () => {
    expect(verifiedEvidence("raise a change request", "Let me RAISE a change   request.")).toBe("raise a change request");
    expect(verifiedEvidence("“I'll send it today”", "I’ll send it today")).toBe("I'll send it today");
    expect(verifiedEvidence("something invented", "Let me raise a change request.")).toBe("");
    expect(verifiedEvidence("", "anything")).toBe("");
  });

  test("replies are kept near 70 words", () => {
    const long = Array.from({ length: 30 }, (_, i) => `Sentence number ${i} is here.`).join(" ");
    expect(trimReply(long).split(" ").length).toBeLessThanOrEqual(75);
    expect(trimReply("Short reply.")).toBe("Short reply.");
  });

  test("every scenario points at a real persona, real handbook terms, scripted lines and a self-check", () => {
    const md = fs.readFileSync(path.resolve(process.cwd(), "docs/v4.2/TERM_IDS.md"), "utf8");
    const termIds = new Set(md.split("\n").filter((l) => !l.startsWith("#") && !l.startsWith("-") && l.includes(",")).flatMap((l) => l.split(",").map((s) => s.trim())));
    for (const s of ROLEPLAY_SCENARIOS) {
      expect(s.termIds.filter((id) => !termIds.has(id))).toEqual([]);
      expect(ROLEPLAY_PERSONAS.some((p) => p.id === s.defaultPersonaId)).toBe(true);
      expect(s.scripted.length).toBeGreaterThanOrEqual(5);
      expect(s.selfCheck.length).toBeGreaterThanOrEqual(4);
      expect(s.termIds.length).toBeGreaterThan(3);
    }
  });
});
