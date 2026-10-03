import fs from "node:fs";
import path from "node:path";

import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { priceFor, TASK_DEFAULTS } from "../../../shared/aiRouting";
import {
  GATE_LIMITS,
  recheckScopeSchema,
  type CostEstimate,
  type RecheckCounts,
  type RecheckRun,
  type RecheckScope,
  type TestItemGates,
  type TestItemPayload,
} from "../../../shared/topicTests";
import { AiNotConfiguredError, type AiService } from "../ai/service";
import { gradeCode } from "../content/grade";
import type { AuthoredTopic, ContentStore } from "../content/store";
import { schema, type Db } from "../db";
import { enqueue, type Job } from "../jobs/queue";
import { newId, now } from "../lib/ids";
import type { CodeSandbox } from "../sandbox";
import { applyPendingRetirements } from "./calibrate";
import { keyIsLongest, runGates, type GateCandidate } from "./gates";
import { writeItems } from "./generate";
import { activeCount, ensureTopicTests, minimumFor, payloadOf, retireRow, targetFor, topicRows } from "./repo";

/**
 * Generation and the re-check job (v4.3 Phase 5).
 *
 * `fillTopic` writes, gates and inserts items until a topic reaches its target count: one write, then
 * at most two regeneration rounds (GATE_LIMITS.maxRegenerations), then whatever is still missing is
 * dropped and counted. `recheckTopic` puts every active item (static included) through the same gates,
 * replaces failures, and retires them without ever leaving a topic below its minimum.
 *
 * `topic_tests.recheck` runs over a scope in small batches, persisting a cursor in app_meta after every
 * topic (resumable across restarts), waiting between batches (rate limit) and stopping when the run's
 * AI spend reaches its budget cap.
 */

export interface TopicTestDeps {
  db: Db;
  ai: AiService;
  content: ContentStore;
  sandbox: CodeSandbox;
  log?: (message: string) => void;
  /** Topics per job batch. */
  batchTopics?: number;
  /** Wait between batches. 0 in tests. */
  batchDelayMs?: number;
}

export const TOPIC_TEST_TASKS = ["topic_test_write", "topic_test_relevance", "topic_test_answer"] as const;
export const RUN_KEY = "topic_tests.recheck.run";
export const BUDGET_KEY = "topic_tests.recheck.budget_usd";
export const DEFAULT_BUDGET_USD = 25;
const DEFAULT_BATCH_TOPICS = 5;
const DEFAULT_BATCH_DELAY_MS = 3000;

// ---------------------------------------------------------------------------
// Fill
// ---------------------------------------------------------------------------

export interface FillResult {
  added: number;
  dropped: number;
  rounds: number;
}

function insertGenerated(db: Db, topicId: string, payload: TestItemPayload, gates: TestItemGates, groundingHash: string): string {
  const id = `tt_${newId()}`;
  const at = now();
  db.insert(schema.topicTestItems)
    .values({
      id,
      topicId,
      origin: "generated",
      sourceId: null,
      status: "active",
      item: payload as unknown as Record<string, unknown>,
      gates: gates as unknown as Record<string, unknown>,
      groundingHash,
      createdAt: at,
      updatedAt: at,
    })
    .run();
  return id;
}

/** Writes and gates items until `need` more are active, or the rounds run out. */
export async function fillTopic(deps: TopicTestDeps, topic: AuthoredTopic, need: number): Promise<FillResult> {
  const grounding = ensureTopicTests(deps.db, topic);
  let added = 0;
  let dropped = 0;
  let rounds = 0;
  if (need <= 0 || grounding.passages.length === 0) return { added, dropped, rounds };

  for (let round = 1; round <= 1 + GATE_LIMITS.maxRegenerations && added < need; round++) {
    rounds = round;
    const remaining = need - added;
    const active = topicRows(deps.db, topic.id, ["active"]);
    const avoid = active.map((r) => payloadOf(r).prompt);
    const written = await writeItems(deps.ai, grounding, { count: Math.min(12, remaining + (round === 1 ? 2 : 1)), round, avoid });
    dropped += written.malformed;
    const candidates: GateCandidate[] = written.payloads.map((payload, i) => ({ key: `r${round}c${i}`, origin: "generated", payload }));
    const outcomes = await runGates({ ai: deps.ai }, grounding, candidates);

    // Test-level cue rule, counted over what is already live plus what is accepted here.
    let total = active.length;
    let longest = active.filter((r) => keyIsLongest(payloadOf(r))).length;
    for (const candidate of candidates) {
      const outcome = outcomes.get(candidate.key)!;
      if (!outcome.gates.passed || added >= need) {
        dropped += 1;
        continue;
      }
      const isLongest = keyIsLongest(candidate.payload);
      if (isLongest && longest + 1 > Math.floor((total + 1) * GATE_LIMITS.maxLongestKeyedShare)) {
        dropped += 1;
        continue;
      }
      const gates: TestItemGates = { ...outcome.gates, testLevel: { ok: true } };
      insertGenerated(deps.db, topic.id, candidate.payload, gates, grounding.passagesHash);
      added += 1;
      total += 1;
      if (isLongest) longest += 1;
    }
  }
  return { added, dropped, rounds };
}

// ---------------------------------------------------------------------------
// Re-check one topic
// ---------------------------------------------------------------------------

export function emptyCounts(): RecheckCounts {
  return { topics: 0, checked: 0, retired: 0, regenerated: 0, dropped: 0, keptBelowMinimum: 0, codeChecked: 0, codeFailed: 0, errors: 0 };
}

function solutionsDir(): string | null {
  const dir = path.resolve(process.cwd(), "content-tests/solutions");
  return fs.existsSync(dir) ? dir : null;
}

/** Code topics: the reference solution must pass every test in the sandbox (the content check, reused). */
async function recheckCode(deps: TopicTestDeps, topic: AuthoredTopic, counts: RecheckCounts): Promise<void> {
  const dir = solutionsDir();
  const file = dir ? path.join(dir, `${topic.id}.js`) : null;
  if (!topic.codeChallenge || !file || !fs.existsSync(file)) return;
  counts.codeChecked += 1;
  const result = await gradeCode(topic.codeChallenge, fs.readFileSync(file, "utf8"), deps.sandbox);
  if (!result.passed) {
    counts.codeFailed += 1;
    deps.log?.(`topic_tests: reference solution for ${topic.id} fails ${result.total - result.passedCount} test(s)`);
  }
}

export async function recheckTopic(deps: TopicTestDeps, topic: AuthoredTopic, counts: RecheckCounts): Promise<void> {
  counts.topics += 1;
  if (topic.challengeType === "code") return recheckCode(deps, topic, counts);
  const grounding = ensureTopicTests(deps.db, topic);
  const rows = topicRows(deps.db, topic.id, ["active"]);
  counts.checked += rows.length;

  const candidates: GateCandidate[] = rows.map((r) => ({ key: r.id, origin: r.origin, payload: payloadOf(r) }));
  const outcomes = rows.length ? await runGates({ ai: deps.ai }, grounding, candidates) : new Map();

  // Test-level cue rule over the items that passed, in serving order.
  const passing = rows.filter((r) => outcomes.get(r.id)?.gates.passed);
  const allowed = Math.floor(passing.length * GATE_LIMITS.maxLongestKeyedShare);
  let longestSeen = 0;
  for (const r of passing) {
    const gates = outcomes.get(r.id)!.gates as TestItemGates;
    if (keyIsLongest(payloadOf(r))) {
      longestSeen += 1;
      if (longestSeen > allowed) {
        gates.testLevel = { ok: false, detail: `more than ${GATE_LIMITS.maxLongestKeyedShare * 100}% of the test keys its longest option` };
        gates.passed = false;
        gates.failures = [...gates.failures, "testLevel: too many keys are the longest option"];
        continue;
      }
    }
    gates.testLevel = { ok: true };
  }

  // Record gate results; static items that passed keep the checker's citation and rationales.
  const at = now();
  for (const r of rows) {
    const outcome = outcomes.get(r.id)!;
    const payload = payloadOf(r);
    const next: TestItemPayload = {
      ...payload,
      ...(outcome.proposedCitation && !payload.citation ? { citation: outcome.proposedCitation } : {}),
      ...(outcome.proposedRationales && !payload.distractorRationales ? { distractorRationales: outcome.proposedRationales } : {}),
    };
    deps.db
      .update(schema.topicTestItems)
      .set({ item: next as unknown as Record<string, unknown>, gates: outcome.gates as unknown as Record<string, unknown>, groundingHash: grounding.passagesHash, updatedAt: at })
      .where(eq(schema.topicTestItems.id, r.id))
      .run();
  }

  const failing = rows.filter((r) => !outcomes.get(r.id)!.gates.passed);
  const stillPassing = rows.length - failing.length;
  const need = targetFor(topic) - stillPassing;
  if (need > 0) {
    const fill = await fillTopic(deps, topic, need);
    counts.regenerated += fill.added;
    counts.dropped += fill.dropped;
  }

  // Retire failures, hard ones first, never below the minimum.
  failing.sort((a, b) => Number(Boolean(outcomes.get(b.id)!.gates.hard)) - Number(Boolean(outcomes.get(a.id)!.gates.hard)));
  for (const r of failing) {
    const reason = `failed re-check: ${(outcomes.get(r.id)!.gates.failures as string[]).join("; ")}`.slice(0, 500);
    if (activeCount(deps.db, topic.id) - 1 >= minimumFor(topic)) {
      retireRow(deps.db, r.id, reason);
      counts.retired += 1;
    } else {
      deps.db.update(schema.topicTestItems).set({ flagReason: `${reason} (kept to hold the minimum)`.slice(0, 500), updatedAt: now() }).where(eq(schema.topicTestItems.id, r.id)).run();
      counts.keptBelowMinimum += 1;
    }
  }
}

// ---------------------------------------------------------------------------
// Runs
// ---------------------------------------------------------------------------

function readMeta(db: Db, key: string): string | null {
  return db.select().from(schema.appMeta).where(eq(schema.appMeta.key, key)).get()?.value ?? null;
}

function writeMeta(db: Db, key: string, value: string): void {
  const at = now();
  db.insert(schema.appMeta).values({ key, value, updatedAt: at }).onConflictDoUpdate({ target: schema.appMeta.key, set: { value, updatedAt: at } }).run();
}

export function getRun(db: Db): RecheckRun | null {
  const raw = readMeta(db, RUN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RecheckRun;
  } catch {
    return null;
  }
}

function saveRun(db: Db, run: RecheckRun): void {
  writeMeta(db, RUN_KEY, JSON.stringify(run));
}

export function getBudgetUsd(db: Db): number {
  const value = Number(readMeta(db, BUDGET_KEY));
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_BUDGET_USD;
}

export function setBudgetUsd(db: Db, usd: number): void {
  writeMeta(db, BUDGET_KEY, String(usd));
}

export function spentSince(db: Db, since: number): number {
  const micros =
    db
      .select({ n: sql<number>`coalesce(sum(${schema.aiCalls.costMicros}), 0)` })
      .from(schema.aiCalls)
      .where(and(gte(schema.aiCalls.createdAt, since), inArray(schema.aiCalls.task, [...TOPIC_TEST_TASKS])))
      .get()?.n ?? 0;
  return micros / 1_000_000;
}

export function topicsInScope(content: ContentStore, scope: RecheckScope): string[] {
  const ids: string[] = [];
  for (const track of content.manifest) {
    if (scope.kind === "track" && track.id !== scope.id) continue;
    for (const mod of track.modules) {
      if (scope.kind === "module" && mod.id !== scope.id) continue;
      for (const topic of mod.topics) {
        if (scope.kind === "topic" && topic.id !== scope.id) continue;
        ids.push(topic.id);
      }
    }
  }
  return ids;
}

export function startRun(db: Db, content: ContentStore, scope: RecheckScope): RecheckRun {
  const current = getRun(db);
  if (current?.status === "running") throw new Error("A re-check is already running.");
  const run: RecheckRun = {
    runId: newId(),
    scope,
    status: "running",
    topicIds: topicsInScope(content, scope),
    cursor: 0,
    startedAt: now(),
    finishedAt: null,
    budgetUsd: getBudgetUsd(db),
    spentUsd: 0,
    counts: emptyCounts(),
    lastError: null,
  };
  saveRun(db, run);
  enqueue(db, { type: "topic_tests.recheck", payload: { runId: run.runId } });
  return run;
}

export function resumeRun(db: Db): RecheckRun | null {
  const run = getRun(db);
  if (!run || (run.status !== "paused_budget" && run.status !== "failed")) return run;
  run.status = "running";
  run.budgetUsd = getBudgetUsd(db);
  run.lastError = null;
  saveRun(db, run);
  enqueue(db, { type: "topic_tests.recheck", payload: { runId: run.runId } });
  return run;
}

export function cancelRun(db: Db): RecheckRun | null {
  const run = getRun(db);
  if (!run || run.status !== "running") return run;
  run.status = "cancelled";
  run.finishedAt = now();
  saveRun(db, run);
  return run;
}

const recheckPayload = z.object({ runId: z.string() });
const fillPayload = z.object({ topicId: z.string(), reason: z.string().optional() });

export function recheckHandler(deps: TopicTestDeps) {
  return async (job: Job): Promise<void> => {
    const { runId } = recheckPayload.parse(job.payload);
    const run = getRun(deps.db);
    if (!run || run.runId !== runId || run.status !== "running") return;
    if (!deps.ai.isConfigured()) {
      run.status = "failed";
      run.lastError = "No AI credential is set up.";
      run.finishedAt = now();
      saveRun(deps.db, run);
      return;
    }

    const batch = deps.batchTopics ?? DEFAULT_BATCH_TOPICS;
    for (let i = 0; i < batch && run.cursor < run.topicIds.length; i++) {
      // Re-read: an admin may have cancelled between topics.
      if (getRun(deps.db)?.status !== "running") return;
      run.spentUsd = spentSince(deps.db, run.startedAt);
      if (run.spentUsd >= run.budgetUsd) {
        run.status = "paused_budget";
        saveRun(deps.db, run);
        deps.log?.(`topic_tests.recheck paused: spent $${run.spentUsd.toFixed(2)} of $${run.budgetUsd}`);
        return;
      }
      const topicId = run.topicIds[run.cursor];
      const found = deps.content.getTopic(topicId);
      try {
        if (found) await recheckTopic(deps, found.topic, run.counts);
      } catch (error) {
        if (error instanceof AiNotConfiguredError) {
          run.status = "failed";
          run.lastError = error.message;
          saveRun(deps.db, run);
          return;
        }
        run.counts.errors += 1;
        run.lastError = `${topicId}: ${error instanceof Error ? error.message : String(error)}`.slice(0, 500);
      }
      run.cursor += 1;
      saveRun(deps.db, run);
    }

    run.spentUsd = spentSince(deps.db, run.startedAt);
    if (run.cursor >= run.topicIds.length) {
      run.status = "done";
      run.finishedAt = now();
      saveRun(deps.db, run);
      deps.log?.(`topic_tests.recheck done: ${JSON.stringify(run.counts)}`);
      return;
    }
    saveRun(deps.db, run);
    enqueue(deps.db, { type: "topic_tests.recheck", payload: { runId }, delayMs: deps.batchDelayMs ?? DEFAULT_BATCH_DELAY_MS });
  };
}

export function fillHandler(deps: TopicTestDeps) {
  return async (job: Job): Promise<void> => {
    const { topicId } = fillPayload.parse(job.payload);
    const found = deps.content.getTopic(topicId);
    if (!found || found.topic.challengeType !== "quiz") return;
    if (!deps.ai.isConfigured()) {
      deps.log?.(`topic_tests.fill ${topicId}: no AI credential; left as is`);
      return;
    }
    const topic = found.topic;
    ensureTopicTests(deps.db, topic);
    const pending = topicRows(deps.db, topicId, ["active"]).filter((r) => r.flagReason?.includes("retire pending") || r.flagReason?.includes("failed re-check")).length;
    const need = targetFor(topic) - activeCount(deps.db, topicId) + pending;
    const result = await fillTopic(deps, topic, need);
    const retired = applyPendingRetirements(deps.db, topic);
    deps.log?.(`topic_tests.fill ${topicId}: ${result.added} added, ${result.dropped} dropped, ${retired} pending retirements applied`);
  };
}

// ---------------------------------------------------------------------------
// Cost estimate
// ---------------------------------------------------------------------------

/**
 * Token assumptions per topic batch of ~10 items, from the prompt sizes (median topic text is
 * ~1,800 characters ≈ 450 tokens; each item ≈ 150 tokens to show, ≈ 250 to write).
 */
export const TOKEN_ASSUMPTIONS = {
  passages: 600,
  relevance: { system: 350, perItemIn: 160, perItemOut: 90 },
  answer: { system: 120, perItemIn: 120, perItemOut: 25 },
  write: { system: 600, objectives: 120, perItemOut: 260 },
};

function usd(model: string, input: number, output: number): number {
  const price = priceFor(model) ?? { input: 0, output: 0 };
  return (input * price.input + output * price.output) / 1_000_000;
}

export function estimateCost(topics: number, items: number, assumedFailShare = 0.5): CostEstimate {
  const t = TOKEN_ASSUMPTIONS;
  const haiku = TASK_DEFAULTS.topic_test_relevance.model;
  const sonnet = TASK_DEFAULTS.topic_test_write.model;
  const checkFor = (topicCount: number, itemCount: number) =>
    usd(haiku, topicCount * (t.relevance.system + t.passages) + itemCount * t.relevance.perItemIn, itemCount * t.relevance.perItemOut) +
    usd(haiku, topicCount * (t.answer.system + t.passages) + itemCount * t.answer.perItemIn, itemCount * t.answer.perItemOut) +
    usd(haiku, topicCount * t.answer.system + itemCount * t.answer.perItemIn, itemCount * t.answer.perItemOut);
  const checkUsd = checkFor(topics, items);
  // Replacements: overgenerate by ~30% for the gates' drop rate and the regeneration rounds,
  // and every written item goes through the same three checks.
  const replaced = Math.round(items * assumedFailShare * 1.3);
  const topicsNeedingWrites = Math.min(topics, Math.ceil(topics * Math.min(1, assumedFailShare * 1.5)));
  const generateUsd =
    usd(sonnet, topicsNeedingWrites * (t.write.system + t.write.objectives + t.passages), replaced * t.write.perItemOut) + checkFor(topicsNeedingWrites, replaced);
  return {
    topics,
    items,
    assumedFailShare,
    checkUsd: round2(checkUsd),
    generateUsd: round2(generateUsd),
    totalUsd: round2(checkUsd + generateUsd),
    basis: `3 Haiku calls per topic (${haiku}), 1+ Sonnet write per topic with failures (${sonnet}); ${Math.round(assumedFailShare * 100)}% of items assumed to fail and be replaced`,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export { recheckScopeSchema };

/**
 * Boot: builds every topic's grounding and imports its static quiz (idempotent, keyed by
 * topicId+sourceId; unchanged topics cost one hash and one SELECT). Yields between modules so a
 * first boot's ~9,000 inserts never hold the event loop for long.
 */
export async function syncAllTopicTests(db: Db, content: ContentStore, log?: (message: string) => void): Promise<number> {
  let topics = 0;
  const started = Date.now();
  for (const track of content.manifest) {
    for (const meta of track.modules) {
      if (!meta.available) continue;
      const mod = content.getModule(track.id, meta.id);
      for (const topic of mod?.topics ?? []) {
        ensureTopicTests(db, topic);
        topics += 1;
      }
      await new Promise((resolve) => setImmediate(resolve));
    }
  }
  log?.(`topic tests: grounding and static items in sync for ${topics} topics (${Date.now() - started} ms)`);
  return topics;
}
