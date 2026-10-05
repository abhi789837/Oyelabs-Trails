import { and, count, eq, gte, inArray, sql } from "drizzle-orm";

import { costMicros } from "../../../shared/aiRouting";
import {
  findPersona,
  findScenario,
  isFollowUpDimension,
  publicPersona,
  publicScenario,
  ROLEPLAY_CAP_KEY,
  ROLEPLAY_DEFAULT_CAP_MICROS,
  ROLEPLAY_DEFAULT_TURNS,
  ROLEPLAY_MAX_TURNS,
  ROLEPLAY_MIN_TURNS,
  standardRubric,
  type RoleplayLine,
  type RoleplayScore,
  type RoleplaySessionView,
  type RoleplayUsage,
  type StartRoleplayRequest,
} from "../../../shared/roleplay";
import type { RoleplayTask } from "../../../shared/tasks";
import { monthStart } from "../ai/router";
import type { AiService } from "../ai/service";
import { isV4, keyOf } from "../assessment/v4";
import { schema, type Db } from "../db";
import { HttpError, badRequest, conflict, notFound } from "../lib/errors";
import { newId, now } from "../lib/ids";
import { ERROR_CODES } from "../../../shared/api";
import { clientReplySchema, clientSystemPrompt, clientUserMessage, SCORE_SYSTEM, scoreResultSchema, scoreUserMessage, trimReply } from "./prompts";

/**
 * The role-play engine: start a conversation, take a turn, finish and score it.
 *
 * Costs are bounded three ways: a hard turn cap per conversation (≤ 8 PM messages, each ≤ 600
 * characters), small output caps on the two AI tasks (`roleplay` 300 tokens, `roleplay_score` 900),
 * and a monthly spend cap on those two tasks together (app_meta `roleplay.monthly_cap_micros`).
 * Over the cap, new *practice* conversations are refused; an assessment item is never refused,
 * because a learner sitting a timed assessment cannot wait for next month.
 *
 * With no AI configured the client is scripted: one canned line per turn, clearly labelled, and the
 * rubric is skipped in favour of a self-check list.
 */

export interface RoleplayDeps {
  db: Db;
  ai: AiService;
  log?: (message: string) => void;
}

type SessionRow = typeof schema.roleplaySessions.$inferSelect;
const ROLEPLAY_TASKS = ["roleplay", "roleplay_score"];

// ---------------------------------------------------------------------------
// The monthly cap
// ---------------------------------------------------------------------------

export function getCapMicros(db: Db): number {
  const row = db.select().from(schema.appMeta).where(eq(schema.appMeta.key, ROLEPLAY_CAP_KEY)).get();
  const value = row ? Number(row.value) : NaN;
  return Number.isFinite(value) && value >= 0 ? value : ROLEPLAY_DEFAULT_CAP_MICROS;
}

export function setCapMicros(db: Db, micros: number): void {
  const value = String(Math.round(micros));
  db.insert(schema.appMeta)
    .values({ key: ROLEPLAY_CAP_KEY, value, updatedAt: now() })
    .onConflictDoUpdate({ target: schema.appMeta.key, set: { value, updatedAt: now() } })
    .run();
}

/** This month's spend on the two role-play tasks, from the AI usage rows. */
export function monthSpendMicros(db: Db): number {
  return (
    db
      .select({ m: sql<number>`coalesce(sum(${schema.aiCalls.costMicros}), 0)` })
      .from(schema.aiCalls)
      .where(and(gte(schema.aiCalls.createdAt, monthStart()), inArray(schema.aiCalls.task, ROLEPLAY_TASKS)))
      .get()?.m ?? 0
  );
}

export function withinCap(db: Db): boolean {
  return monthSpendMicros(db) < getCapMicros(db);
}

export function roleplayUsage(db: Db): RoleplayUsage {
  const start = monthStart();
  const sessions = schema.roleplaySessions;
  const row = db
    .select({ n: count(), scored: sql<number>`sum(case when ${sessions.status} = 'scored' then 1 else 0 end)`, micros: sql<number>`coalesce(sum(${sessions.costMicros}), 0)` })
    .from(sessions)
    .where(gte(sessions.createdAt, start))
    .get();
  const spent = monthSpendMicros(db);
  const cap = getCapMicros(db);
  const n = row?.n ?? 0;
  return {
    monthStart: start,
    sessions: n,
    scored: row?.scored ?? 0,
    costUsd: spent / 1_000_000,
    avgCostUsd: n ? (row?.micros ?? 0) / n / 1_000_000 : 0,
    capUsd: cap / 1_000_000,
    share: cap > 0 ? spent / cap : spent > 0 ? 1 : 0,
    overCap: spent >= cap,
  };
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

export function toView(row: SessionRow, options: { hideScore?: boolean; scoreError?: string } = {}): RoleplaySessionView {
  const persona = findPersona(row.personaId)!;
  const scenario = findScenario(row.scenarioId)!;
  return {
    id: row.id,
    scenarioId: row.scenarioId,
    personaId: row.personaId,
    context: row.context,
    assessmentId: row.assessmentId,
    itemId: row.itemId,
    mode: row.mode,
    status: row.status,
    transcript: row.transcript,
    turns: row.turns,
    maxTurns: row.maxTurns,
    followUpEmail: row.followUpEmail,
    // An assessment's score is for the report, not the sitting.
    score: options.hideScore || row.context === "assessment" ? null : ((row.score as RoleplayScore | null) ?? null),
    selfCheck: row.mode === "scripted" && row.status !== "active" ? scenario.selfCheck : [],
    persona: publicPersona(persona),
    scenario: publicScenario(scenario),
    createdAt: row.createdAt,
    finishedAt: row.finishedAt,
    ...(options.scoreError ? { scoreError: options.scoreError } : {}),
  };
}

/** The session, if this user owns it. Anyone else gets a plain 404, so ids cannot be probed. */
export function loadOwned(db: Db, userId: string, id: string): SessionRow {
  const row = db.select().from(schema.roleplaySessions).where(eq(schema.roleplaySessions.id, id)).get();
  if (!row || row.userId !== userId) throw notFound("That conversation doesn't exist.");
  return row;
}

// ---------------------------------------------------------------------------
// Assessment items
// ---------------------------------------------------------------------------

/** The roleplay task behind an assessment item the user may answer now. Throws otherwise. */
function assessmentTask(db: Db, userId: string, assessmentId: string, itemId: string): RoleplayTask {
  const assessment = db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get();
  if (!assessment || assessment.userId !== userId) throw notFound("That assessment doesn't exist.");
  if (!isV4(assessment) || assessment.status !== "in_progress") throw conflict("This assessment is not open.");
  if (assessment.deadlineAt !== null && now() > assessment.deadlineAt) throw conflict("Time is up for this assessment.");
  const item = db
    .select()
    .from(schema.assessmentItems)
    .where(and(eq(schema.assessmentItems.id, itemId), eq(schema.assessmentItems.assessmentId, assessmentId)))
    .get();
  if (!item) throw notFound("No such question.");
  if (item.lockedAt) throw conflict("This question has already been submitted.");
  const key = keyOf(item);
  if (key.type !== "task" || key.task?.kind !== "roleplay") throw badRequest("That question is not a client conversation.");
  return key.task;
}

/** For turns and finish in an assessment: the sitting must still be open and the item unlocked. */
function assertAssessmentOpen(db: Db, row: SessionRow): void {
  if (row.context !== "assessment" || !row.assessmentId || !row.itemId) return;
  assessmentTask(db, row.userId, row.assessmentId, row.itemId);
}

// ---------------------------------------------------------------------------
// Start, turn, finish
// ---------------------------------------------------------------------------

export function startSession(deps: RoleplayDeps, userId: string, request: StartRoleplayRequest): RoleplaySessionView {
  const { db } = deps;
  let scenarioId = request.scenarioId;
  let personaId = request.personaId;
  let maxTurns = request.maxTurns ?? ROLEPLAY_DEFAULT_TURNS;

  if (request.context === "assessment") {
    // The item decides the scenario, persona and turn cap, never the request.
    const task = assessmentTask(db, userId, request.assessmentId!, request.itemId!);
    const existing = db
      .select()
      .from(schema.roleplaySessions)
      .where(and(eq(schema.roleplaySessions.assessmentId, request.assessmentId!), eq(schema.roleplaySessions.itemId, request.itemId!)))
      .get();
    // One conversation per item: a reload resumes it rather than starting a second.
    if (existing) return toView(existing);
    scenarioId = task.scenarioId;
    personaId = task.personaId;
    maxTurns = task.maxTurns;
  } else if (!withinCap(db) && deps.ai.isConfigured()) {
    throw new HttpError(429, ERROR_CODES.RATE_LIMITED, "Client role-play practice has reached this month's AI budget. It opens again next month, or an admin can raise the cap.");
  }

  const scenario = findScenario(scenarioId);
  if (!scenario) throw badRequest("Unknown scenario.");
  const persona = findPersona(personaId ?? scenario.defaultPersonaId);
  if (!persona) throw badRequest("Unknown persona.");
  maxTurns = Math.min(ROLEPLAY_MAX_TURNS, Math.max(ROLEPLAY_MIN_TURNS, maxTurns));

  const row: SessionRow = {
    id: newId(),
    userId,
    scenarioId: scenario.id,
    personaId: persona.id,
    context: request.context,
    assessmentId: request.context === "assessment" ? request.assessmentId! : null,
    itemId: request.context === "assessment" ? request.itemId! : null,
    mode: deps.ai.isConfigured() ? "ai" : "scripted",
    transcript: [{ role: "client", text: scenario.opening }],
    turns: 0,
    maxTurns,
    status: "active",
    followUpEmail: null,
    score: null,
    costMicros: 0,
    createdAt: now(),
    finishedAt: null,
  };
  try {
    db.insert(schema.roleplaySessions).values(row).run();
  } catch (error) {
    // Two tabs racing to start the same item: the unique index lets one win; return that one.
    if (row.assessmentId && /UNIQUE/i.test(String(error))) {
      const winner = db
        .select()
        .from(schema.roleplaySessions)
        .where(and(eq(schema.roleplaySessions.assessmentId, row.assessmentId), eq(schema.roleplaySessions.itemId, row.itemId!)))
        .get();
      if (winner) return toView(winner);
    }
    throw error;
  }
  return toView(row);
}

function scriptedLine(row: SessionRow, turn: number): string {
  const lines = findScenario(row.scenarioId)!.scripted;
  return lines[Math.min(turn - 1, lines.length - 1)] ?? "I see. Please send me the details in writing.";
}

export async function takeTurn(deps: RoleplayDeps, userId: string, sessionId: string, message: string): Promise<RoleplaySessionView> {
  const { db, ai } = deps;
  const row = loadOwned(db, userId, sessionId);
  if (row.status !== "active") throw conflict("This conversation has finished.");
  if (row.turns >= row.maxTurns) throw conflict(`This conversation is capped at ${row.maxTurns} messages. Finish it and write the follow-up.`);
  assertAssessmentOpen(db, row);

  const text = message.trim();
  const turn = row.turns + 1;
  const transcript: RoleplayLine[] = [...row.transcript, { role: "pm", text }];

  // Claim the turn before the model call, so two quick sends cannot both be turn 8.
  const claimed = db
    .update(schema.roleplaySessions)
    .set({ turns: turn, transcript })
    .where(and(eq(schema.roleplaySessions.id, row.id), eq(schema.roleplaySessions.turns, row.turns), eq(schema.roleplaySessions.status, "active")))
    .run();
  if (claimed.changes === 0) throw conflict("Another message was sent at the same time. Reload the conversation.");

  let reply = scriptedLine(row, turn);
  let spent = 0;
  if (row.mode === "ai" && ai.isConfigured()) {
    const persona = findPersona(row.personaId)!;
    const scenario = findScenario(row.scenarioId)!;
    try {
      const result = await ai.generateJson({
        purpose: "roleplay",
        task: "roleplay",
        system: clientSystemPrompt(persona, scenario),
        user: clientUserMessage({ scenarioId: scenario.id, turn, maxTurns: row.maxTurns, transcript }),
        schema: clientReplySchema,
        schemaName: "roleplay_reply",
        timeoutMs: 60_000,
        meta: { subjectUserId: userId, assessmentId: row.assessmentId ?? undefined },
      });
      reply = trimReply(result.data.reply);
      spent = costMicros(result.model, result.usage);
    } catch (error) {
      // The learner keeps going with a scripted line rather than a dead chat.
      deps.log?.(`roleplay reply failed for ${row.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const finalTranscript: RoleplayLine[] = [...transcript, { role: "client", text: reply }];
  db.update(schema.roleplaySessions)
    .set({ transcript: finalTranscript, costMicros: sql`${schema.roleplaySessions.costMicros} + ${spent}` })
    .where(eq(schema.roleplaySessions.id, row.id))
    .run();
  return toView(db.select().from(schema.roleplaySessions).where(eq(schema.roleplaySessions.id, row.id)).get()!);
}

/** The rubric a session is scored against: the item's for an assessment, the standard one otherwise. */
function rubricFor(db: Db, row: SessionRow): { rubric: { label: string; points: number; description?: string }[]; brief: string; followUp: boolean } {
  if (row.context === "assessment" && row.itemId) {
    const item = db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, row.itemId)).get();
    const task = item ? keyOf(item).task : undefined;
    if (task?.kind === "roleplay") return { rubric: task.rubric, brief: task.brief, followUp: task.followUp };
  }
  return { rubric: standardRubric(true), brief: findScenario(row.scenarioId)!.objective, followUp: true };
}

/**
 * Ends the conversation (idempotent) and, for an AI session, scores it. In an assessment the score
 * is stored but not returned; `evaluateV4` reads it. Scripted sessions are never scored.
 */
export async function finishSession(
  deps: RoleplayDeps,
  userId: string,
  sessionId: string,
  followUpEmail: string | undefined,
  options: { score?: boolean; skipOpenCheck?: boolean } = {},
): Promise<RoleplaySessionView> {
  const { db } = deps;
  let row = loadOwned(db, userId, sessionId);
  if (row.status === "active") {
    if (!options.skipOpenCheck) assertAssessmentOpen(db, row);
    db.update(schema.roleplaySessions)
      .set({ status: "finished", finishedAt: now(), followUpEmail: followUpEmail?.trim() || null })
      .where(and(eq(schema.roleplaySessions.id, row.id), eq(schema.roleplaySessions.status, "active")))
      .run();
    row = loadOwned(db, userId, sessionId);
  }
  const wantScore = options.score ?? row.context === "practice";
  if (!wantScore || row.status === "scored" || row.mode !== "ai") return toView(row);
  try {
    await scoreSession(deps, row);
    return toView(loadOwned(db, userId, sessionId));
  } catch (error) {
    deps.log?.(`roleplay scoring failed for ${row.id}: ${error instanceof Error ? error.message : String(error)}`);
    return toView(row, { scoreError: "Scoring is not available right now. Try Finish again in a minute." });
  }
}

const normalise = (value: string) =>
  value
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();

/** Keeps a quote only if it really is the learner's own words (a model can paraphrase or invent). */
export function verifiedEvidence(quote: string, learnerText: string): string {
  const q = normalise(quote).replace(/^["'“‘]+|["'”’.…]+$/g, "").trim();
  if (q.length < 3) return "";
  return normalise(learnerText).includes(q) ? quote.trim().replace(/^["'“‘]+|["'”’]+$/g, "").slice(0, 200) : "";
}

/** Scores a finished AI session with Haiku and stores the result. Throws when the call fails. */
export async function scoreSession(deps: RoleplayDeps, row: SessionRow): Promise<RoleplayScore> {
  const { db, ai } = deps;
  const scenario = findScenario(row.scenarioId)!;
  const { rubric, brief, followUp } = rubricFor(db, row);
  const pmTurns = row.transcript.filter((l) => l.role === "pm");
  const email = row.followUpEmail ?? "";

  let score: RoleplayScore;
  let spent = 0;
  if (pmTurns.length === 0) {
    score = {
      dimensions: rubric.map((r) => ({ label: r.label, points: r.points, score: 0, evidence: "" })),
      total: 0,
      max: rubric.reduce((s, r) => s + r.points, 0),
      pct: 0,
      tips: ["Reply to the client: the conversation is the task."],
    };
  } else {
    const result = await ai.generateJson({
      purpose: "roleplay_score",
      task: "roleplay_score",
      system: SCORE_SYSTEM,
      user: scoreUserMessage({ scenario, brief, rubric, transcript: row.transcript, followUpEmail: email || null, followUpRequired: followUp }),
      schema: scoreResultSchema,
      schemaName: "roleplay_score",
      timeoutMs: 90_000,
      meta: { subjectUserId: row.userId, assessmentId: row.assessmentId ?? undefined },
    });
    spent = costMicros(result.model, result.usage);
    const learnerText = [...pmTurns.map((l) => l.text), email].join("\n");
    const dimensions = rubric.map((r, index) => {
      const got = result.data.dimensions.find((d) => d.index === index);
      let value = Math.max(0, Math.min(r.points, got?.score ?? 0));
      if (isFollowUpDimension(r.label) && !email.trim()) value = 0;
      return { label: r.label, points: r.points, score: value, evidence: got ? verifiedEvidence(got.evidence, learnerText) : "" };
    });
    const total = dimensions.reduce((s, d) => s + d.score, 0);
    const max = dimensions.reduce((s, d) => s + d.points, 0);
    score = {
      dimensions,
      total,
      max,
      pct: max ? Math.round((total / max) * 1000) / 1000 : 0,
      tips: result.data.tips.slice(0, 3),
      ...(typeof result.data.met === "boolean" ? { met: result.data.met, reason: result.data.reason ?? "", tip: result.data.tip ?? result.data.tips[0] ?? "" } : {}),
    };
  }

  db.update(schema.roleplaySessions)
    .set({ score: score as unknown as Record<string, unknown>, status: "scored", costMicros: sql`${schema.roleplaySessions.costMicros} + ${spent}` })
    .where(eq(schema.roleplaySessions.id, row.id))
    .run();
  return score;
}

// ---------------------------------------------------------------------------
// Assessment grading (called from evaluateV4)
// ---------------------------------------------------------------------------

/**
 * The score for one roleplay item, from the session the server holds for *that* item. The
 * response's own `sessionId` is never trusted: the lookup is by assessment and item, and the session
 * must belong to the assessment's learner, so a learner cannot borrow another session.
 *
 * `score` is null when it cannot be known yet (scripted mode, no AI): the item stays pending. The
 * server's transcript comes back too, so the stored response shows what was really said.
 */
export async function gradeRoleplayItem(
  deps: RoleplayDeps,
  input: { assessmentId: string; itemId: string; userId: string; followUpEmail?: string },
): Promise<{ score: number | null; feedback: string; sessionId: string | null; transcript: RoleplayLine[]; followUpEmail: string | null; met?: boolean; reason?: string; tip?: string }> {
  const { db } = deps;
  const row = db
    .select()
    .from(schema.roleplaySessions)
    .where(and(eq(schema.roleplaySessions.assessmentId, input.assessmentId), eq(schema.roleplaySessions.itemId, input.itemId)))
    .get();
  if (!row || row.userId !== input.userId) return { score: 0, feedback: "No conversation was held.", sessionId: null, transcript: [], followUpEmail: null };
  const base = { sessionId: row.id, transcript: row.transcript, followUpEmail: row.followUpEmail ?? input.followUpEmail ?? null };
  if (row.turns === 0) return { ...base, score: 0, feedback: "The conversation was started but the PM never replied to the client." };
  await finishSession(deps, input.userId, row.id, input.followUpEmail, { score: true, skipOpenCheck: true });
  const fresh = db.select().from(schema.roleplaySessions).where(eq(schema.roleplaySessions.id, row.id)).get()!;
  const score = fresh.score as RoleplayScore | null;
  const out = { sessionId: fresh.id, transcript: fresh.transcript, followUpEmail: fresh.followUpEmail };
  // Scripted mode, or scoring failed: the score cannot be known yet and the item stays pending.
  if (!score) return { ...out, score: null, feedback: "" };
  return {
    ...out,
    score: score.pct,
    feedback: score.tips.join(" ").slice(0, 400),
    ...(typeof score.met === "boolean" ? { met: score.met, reason: score.reason, tip: score.tip } : {}),
  };
}
