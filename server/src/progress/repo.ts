import { and, desc, eq } from "drizzle-orm";

import type { TopicProgressValue } from "../../../shared/content";
import type { AttemptKind } from "../../../shared/enums";
import { schema, type Db } from "../db";
import { newId, now } from "../lib/ids";

export function getProgress(db: Db, userId: string): Record<string, TopicProgressValue> {
  const rows = db.select().from(schema.topicProgress).where(eq(schema.topicProgress.userId, userId)).all();
  const progress: Record<string, TopicProgressValue> = {};
  for (const row of rows) {
    progress[row.topicId] = {
      status: row.status,
      bestScore: row.bestScore,
      attempts: row.attempts,
      completedAt: row.completedAt,
    };
  }
  return progress;
}

export function getTopicProgress(db: Db, userId: string, topicId: string): TopicProgressValue | null {
  const row = db
    .select()
    .from(schema.topicProgress)
    .where(and(eq(schema.topicProgress.userId, userId), eq(schema.topicProgress.topicId, topicId)))
    .get();
  return row ? { status: row.status, bestScore: row.bestScore, attempts: row.attempts, completedAt: row.completedAt } : null;
}

/** Opening a topic marks it started. Never downgrades a completed topic. */
export function markInProgress(db: Db, userId: string, topicId: string): void {
  const current = getTopicProgress(db, userId, topicId);
  if (current && current.status !== "not-started") return;
  const timestamp = now();
  db.insert(schema.topicProgress)
    .values({ userId, topicId, status: "in-progress", bestScore: null, attempts: 0, completedAt: null, updatedAt: timestamp })
    .onConflictDoUpdate({
      target: [schema.topicProgress.userId, schema.topicProgress.topicId],
      set: { status: "in-progress", updatedAt: timestamp },
    })
    .run();
}

export interface RecordAttemptInput {
  userId: string;
  topicId: string;
  kind: AttemptKind;
  score: number;
  passed: boolean;
  answers?: unknown;
  code?: string | null;
}

/**
 * Writes an attempt and folds it into the topic's progress.
 *
 * The v2 rule carries over and is now enforced server-side: once a topic is completed, a later
 * failed retry never un-completes it, and `completedAt` keeps its original value. Best score is
 * a maximum, so retrying can only help.
 */
export function recordAttempt(db: Db, input: RecordAttemptInput): TopicProgressValue {
  const timestamp = now();

  db.insert(schema.topicAttempts)
    .values({
      id: newId(),
      userId: input.userId,
      topicId: input.topicId,
      kind: input.kind,
      score: Math.round(input.score),
      passed: input.passed,
      answers: input.answers ?? null,
      code: input.code ?? null,
      createdAt: timestamp,
    })
    .run();

  const current = getTopicProgress(db, input.userId, input.topicId);
  const completed = input.passed || current?.status === "completed";
  const next: TopicProgressValue = {
    status: completed ? "completed" : "in-progress",
    bestScore: Math.max(current?.bestScore ?? 0, Math.round(input.score)),
    attempts: (current?.attempts ?? 0) + 1,
    completedAt: completed ? (current?.completedAt ?? timestamp) : null,
  };

  db.insert(schema.topicProgress)
    .values({ userId: input.userId, topicId: input.topicId, ...next, updatedAt: timestamp })
    .onConflictDoUpdate({
      target: [schema.topicProgress.userId, schema.topicProgress.topicId],
      set: { ...next, updatedAt: timestamp },
    })
    .run();

  return next;
}

export function attemptsForTopic(db: Db, userId: string, topicId: string, limit = 20) {
  return db
    .select()
    .from(schema.topicAttempts)
    .where(and(eq(schema.topicAttempts.userId, userId), eq(schema.topicAttempts.topicId, topicId)))
    .orderBy(desc(schema.topicAttempts.createdAt))
    .limit(limit)
    .all();
}

export function resetTopic(db: Db, userId: string, topicId: string): void {
  db.delete(schema.topicProgress)
    .where(and(eq(schema.topicProgress.userId, userId), eq(schema.topicProgress.topicId, topicId)))
    .run();
}
