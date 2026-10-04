import { and, asc, eq, inArray, sql } from "drizzle-orm";

import type { QuizAttemptResult, ServedQuizQuestion } from "../../../shared/content";
import {
  minimumActiveCount,
  targetItemCount,
  type TestItemPayload,
  type TestItemStatus,
  type TopicGroundingContent,
} from "../../../shared/topicTests";
import type { AuthoredQuizQuestion, AuthoredTopic } from "../content/store";
import { gradeQuiz } from "../content/grade";
import { schema, type Db } from "../db";
import { newId, now } from "../lib/ids";
import { enqueue } from "../jobs/queue";
import { buildGrounding, citationProblem, questionHash, topicHash } from "./grounding";
import { keyIndices } from "./gates";

/**
 * Topic tests in the database (v4.3 Phase 5).
 *
 * `ensureTopicTests` is idempotent and cheap after the first call: it rebuilds a topic's grounding
 * and re-imports its static quiz only when the topic's content hash changed. It runs at boot for the
 * whole curriculum, and lazily before a topic's test is served or graded, so a test database (or a
 * fresh deploy whose boot import has not reached a topic yet) still serves the right items.
 */

export type TestItemRowDb = typeof schema.topicTestItems.$inferSelect;

export function payloadOf(row: Pick<TestItemRowDb, "item">): TestItemPayload {
  return row.item as unknown as TestItemPayload;
}

/** The id a learner's answers use. Static items keep the content question id, so nothing a client already holds breaks. */
export function servedIdOf(row: Pick<TestItemRowDb, "sourceId" | "id">): string {
  return row.sourceId ?? row.id;
}

const memo = new WeakMap<Db, Map<string, { hash: string; grounding: TopicGroundingContent }>>();
function memoFor(db: Db) {
  let map = memo.get(db);
  if (!map) {
    map = new Map();
    memo.set(db, map);
  }
  return map;
}

function staticPayload(question: AuthoredQuizQuestion, order: number): TestItemPayload {
  return {
    prompt: question.prompt,
    options: question.options,
    correctIndex: question.correctIndex,
    ...(question.correctIndices && question.correctIndices.length > 1 ? { correctIndices: question.correctIndices } : {}),
    explanation: question.explanation,
    ...(question.isEdgeCaseOrInterviewQuestion ? { isEdgeCaseOrInterviewQuestion: true } : {}),
    citation: null,
    order,
    sourceHash: questionHash(question),
  };
}

export function retireRow(db: Db, id: string, reason: string): void {
  db.update(schema.topicTestItems).set({ status: "retired", retiredReason: reason.slice(0, 500), updatedAt: now() }).where(eq(schema.topicTestItems.id, id)).run();
}

/** Builds/refreshes grounding and imports static items. Returns the grounding. */
export function ensureTopicTests(db: Db, topic: AuthoredTopic): TopicGroundingContent {
  const hash = topicHash(topic);
  const cache = memoFor(db);
  const hit = cache.get(topic.id);
  if (hit && hit.hash === hash) return hit.grounding;

  const row = db.select().from(schema.topicGrounding).where(eq(schema.topicGrounding.topicId, topic.id)).get();
  if (row && row.hash === hash) {
    const grounding = row.content as unknown as TopicGroundingContent;
    cache.set(topic.id, { hash, grounding });
    return grounding;
  }

  const grounding = buildGrounding(topic);
  let retiredGenerated = 0;
  db.transaction(() => {
    const at = now();
    db.insert(schema.topicGrounding)
      .values({ topicId: topic.id, content: grounding as unknown as Record<string, unknown>, hash, updatedAt: at })
      .onConflictDoUpdate({ target: schema.topicGrounding.topicId, set: { content: grounding as unknown as Record<string, unknown>, hash, updatedAt: at } })
      .run();

    // Static import, keyed by (topicId, sourceId): idempotent.
    const existing = db
      .select()
      .from(schema.topicTestItems)
      .where(and(eq(schema.topicTestItems.topicId, topic.id), eq(schema.topicTestItems.origin, "static")))
      .all();
    const bySource = new Map(existing.map((r) => [r.sourceId, r]));
    const quiz = topic.challengeType === "quiz" ? (topic.quiz ?? []) : [];
    const sourceIds = new Set<string>();
    quiz.forEach((question, index) => {
      sourceIds.add(question.id);
      const payload = staticPayload(question, index);
      const current = bySource.get(question.id);
      if (!current) {
        db.insert(schema.topicTestItems)
          .values({
            id: newId(),
            topicId: topic.id,
            origin: "static",
            sourceId: question.id,
            status: "active",
            item: payload as unknown as Record<string, unknown>,
            gates: null,
            groundingHash: null,
            createdAt: at,
            updatedAt: at,
          })
          .onConflictDoNothing()
          .run();
        return;
      }
      const old = payloadOf(current);
      if (old.sourceHash !== payload.sourceHash && !old.editedAt) {
        // The content file changed this question: a new version, so its stats start again.
        db.update(schema.topicTestItems)
          .set({ item: payload as unknown as Record<string, unknown>, gates: null, attempts: 0, passes: 0, strongAttempts: 0, strongFails: 0, flagReason: null, updatedAt: at })
          .where(eq(schema.topicTestItems.id, current.id))
          .run();
      } else if (old.order !== index) {
        db.update(schema.topicTestItems).set({ item: { ...old, order: index } as unknown as Record<string, unknown> }).where(eq(schema.topicTestItems.id, current.id)).run();
      }
    });
    for (const r of existing) {
      if (r.sourceId && !sourceIds.has(r.sourceId) && r.status !== "retired") retireRow(db, r.id, "removed from the content file");
    }

    // Generated items cite passages: if the content moved under them, check the quote still holds.
    const generated = db
      .select()
      .from(schema.topicTestItems)
      .where(and(eq(schema.topicTestItems.topicId, topic.id), eq(schema.topicTestItems.origin, "generated")))
      .all()
      .filter((r) => r.status !== "retired" && r.groundingHash !== grounding.passagesHash);
    for (const r of generated) {
      const problem = citationProblem(grounding, payloadOf(r).citation);
      if (problem) {
        retireRow(db, r.id, `content changed: ${problem}`);
        retiredGenerated += 1;
      } else {
        db.update(schema.topicTestItems).set({ groundingHash: grounding.passagesHash, updatedAt: at }).where(eq(schema.topicTestItems.id, r.id)).run();
      }
    }
  });
  if (retiredGenerated > 0) queueFillIfShort(db, topic, "content changed");
  cache.set(topic.id, { hash, grounding });
  return grounding;
}

export function getGrounding(db: Db, topicId: string): TopicGroundingContent | null {
  const row = db.select().from(schema.topicGrounding).where(eq(schema.topicGrounding.topicId, topicId)).get();
  return row ? (row.content as unknown as TopicGroundingContent) : null;
}

export function topicRows(db: Db, topicId: string, statuses?: TestItemStatus[]): TestItemRowDb[] {
  const rows = db
    .select()
    .from(schema.topicTestItems)
    .where(
      statuses
        ? and(eq(schema.topicTestItems.topicId, topicId), inArray(schema.topicTestItems.status, statuses))
        : eq(schema.topicTestItems.topicId, topicId),
    )
    .orderBy(asc(schema.topicTestItems.createdAt))
    .all();
  // Static items in authored order first, then generated items oldest first.
  return rows.sort((a, b) => {
    if (a.origin !== b.origin) return a.origin === "static" ? -1 : 1;
    if (a.origin === "static") return (payloadOf(a).order ?? 0) - (payloadOf(b).order ?? 0);
    return a.createdAt - b.createdAt || a.id.localeCompare(b.id);
  });
}

export function activeCount(db: Db, topicId: string): number {
  return (
    db
      .select({ n: sql<number>`count(*)` })
      .from(schema.topicTestItems)
      .where(and(eq(schema.topicTestItems.topicId, topicId), eq(schema.topicTestItems.status, "active")))
      .get()?.n ?? 0
  );
}

export function staticCount(topic: AuthoredTopic): number {
  return topic.challengeType === "quiz" ? (topic.quiz?.length ?? 0) : 0;
}

export function targetFor(topic: AuthoredTopic): number {
  return targetItemCount(topic.level, staticCount(topic));
}

/** Queues a fill for a topic below its target, unless one is already waiting. */
export function queueFillIfShort(db: Db, topic: AuthoredTopic, reason: string): boolean {
  if (topic.challengeType !== "quiz") return false;
  if (activeCount(db, topic.id) >= targetFor(topic) && reason !== "retire pending") return false;
  const waiting = db
    .select({ n: sql<number>`count(*)` })
    .from(schema.jobs)
    .where(
      and(
        eq(schema.jobs.type, "topic_tests.fill"),
        inArray(schema.jobs.status, ["queued", "running"]),
        sql`json_extract(${schema.jobs.payload}, '$.topicId') = ${topic.id}`,
      ),
    )
    .get()?.n ?? 0;
  if (waiting > 0) return false;
  enqueue(db, { type: "topic_tests.fill", payload: { topicId: topic.id, reason } });
  return true;
}

// ---------------------------------------------------------------------------
// Serving and grading
// ---------------------------------------------------------------------------

function toAuthored(row: TestItemRowDb): AuthoredQuizQuestion {
  const p = payloadOf(row);
  return {
    id: servedIdOf(row),
    prompt: p.prompt,
    options: p.options,
    correctIndex: p.correctIndex,
    ...(p.correctIndices && p.correctIndices.length > 1 ? { correctIndices: p.correctIndices } : {}),
    explanation: p.explanation,
    ...(p.isEdgeCaseOrInterviewQuestion ? { isEdgeCaseOrInterviewQuestion: true } : {}),
  };
}

/**
 * The served quiz for a topic: only `active` items, in the same shape as before (so the client's
 * runner and multi-select keep working). A topic left with no active items falls back to its content
 * quiz rather than becoming impossible to complete.
 */
export function servedQuizFor(db: Db, topic: AuthoredTopic, includeKeys: boolean): ServedQuizQuestion[] | undefined {
  if (topic.challengeType !== "quiz" || !topic.quiz) return undefined;
  ensureTopicTests(db, topic);
  const rows = topicRows(db, topic.id, ["active"]);
  const questions = rows.length ? rows.map(toAuthored) : topic.quiz;
  return questions.map((q) => {
    const multi = Array.isArray(q.correctIndices) && q.correctIndices.length > 1;
    const base: ServedQuizQuestion = { id: q.id, prompt: q.prompt, options: q.options, multi };
    if (!includeKeys) return base;
    return {
      ...base,
      correctIndices: multi ? [...q.correctIndices!].sort((a, b) => a - b) : [q.correctIndex],
      explanation: q.explanation,
      ...(q.isEdgeCaseOrInterviewQuestion ? { isEdgeCaseOrInterviewQuestion: true } : {}),
    };
  });
}

export interface GradedTopicQuiz {
  result: QuizAttemptResult;
  /** One entry per graded stored item (empty when the content fallback was used). */
  itemResults: { rowId: string; servedId: string; correct: boolean }[];
}

/**
 * Grades against the stored items: every active item, plus any non-active item of this topic the
 * learner answered (it was active when they loaded the test and was retired since). Adds the
 * "From: <section>" source to each result.
 */
export function gradeTopicQuiz(db: Db, topic: AuthoredTopic, answers: Record<string, number[]>): GradedTopicQuiz {
  const grounding = ensureTopicTests(db, topic);
  const all = topicRows(db, topic.id);
  const answered = new Set(Object.keys(answers));
  const rows = all.filter((r) => r.status === "active" || answered.has(servedIdOf(r)));
  if (rows.length === 0) {
    const result = gradeQuiz(topic.quiz ?? [], answers);
    result.perQuestion = result.perQuestion.map((entry) => ({ ...entry, sourcePending: true }));
    return { result, itemResults: [] };
  }
  const result = gradeQuiz(rows.map(toAuthored), answers);
  const byServed = new Map(rows.map((r) => [servedIdOf(r), r]));
  const headings = new Map(grounding.passages.map((p) => [p.id, p.heading]));
  result.perQuestion = result.perQuestion.map((entry) => {
    const citation = payloadOf(byServed.get(entry.id)!).citation;
    const heading = citation ? headings.get(citation.passageId) : undefined;
    return heading ? { ...entry, source: heading } : { ...entry, sourcePending: true };
  });
  return {
    result,
    itemResults: result.perQuestion.map((entry) => ({ rowId: byServed.get(entry.id)!.id, servedId: entry.id, correct: entry.correct })),
  };
}

// ---------------------------------------------------------------------------
// Admin edits
// ---------------------------------------------------------------------------

export function minimumFor(topic: AuthoredTopic): number {
  return minimumActiveCount(targetFor(topic));
}

export function editPayload(old: TestItemPayload, edit: { prompt: string; options: string[]; correctIndices: number[]; explanation: string }): TestItemPayload {
  const keys = [...new Set(edit.correctIndices)].sort((a, b) => a - b);
  const next: TestItemPayload = {
    ...old,
    prompt: edit.prompt,
    options: edit.options,
    correctIndex: keys[0],
    explanation: edit.explanation,
    editedAt: now(),
  };
  if (keys.length > 1) next.correctIndices = keys;
  else delete next.correctIndices;
  // Options changed: the old misconceptions may no longer line up.
  if (old.options.join("\u0000") !== edit.options.join("\u0000")) delete next.distractorRationales;
  return next;
}

export { keyIndices };

/** Tests only: forget what this process already synced for a database. */
export function resetTopicTestMemo(db: Db): void {
  memo.delete(db);
}
