import { and, eq, inArray } from "drizzle-orm";

import { CALIBRATION } from "../../../shared/topicTests";
import type { AuthoredTopic } from "../content/store";
import { schema, type Db } from "../db";
import { now } from "../lib/ids";
import { activeCount, minimumFor, queueFillIfShort, retireRow, type TestItemRowDb } from "./repo";

/**
 * Per-item calibration from real attempts (classical test theory; RESEARCH §5).
 *
 * - Difficulty p = passes / attempts. More than 90% failing (after 10 attempts) flags an item as a
 *   probable miskey, ambiguity or something the course never taught.
 * - A cheap upper-group discrimination signal: a "strong" attempt is one that scored ≥ 90% on the
 *   topic's OTHER items (the rest score, so the item does not inflate its own group). If at least
 *   half of ≥ 5 strong attempts get the item wrong, the item is flagged — strong learners failing is
 *   the classic signature of a broken key (low or negative discrimination).
 * - Flagged items are auto-retired at 20 attempts, unless that would leave the topic below its
 *   minimum; then a replacement fill is queued first and the retirement waits for it.
 * - 100% pass after 20 attempts → "review (too easy)": kept live, shown to admins.
 *
 * Only a learner's first exposure to an item counts, and staff attempts never count, so retries
 * after reading the explanations do not make every item look easy.
 */

export const PENDING_RETIRE = "retire pending replacement";

export interface ItemResult {
  rowId: string;
  servedId: string;
  correct: boolean;
}

/** Served ids this learner already answered in earlier attempts on this topic. */
export function previouslyAnswered(db: Db, userId: string, topicId: string): Set<string> {
  const rows = db
    .select({ answers: schema.topicAttempts.answers })
    .from(schema.topicAttempts)
    .where(and(eq(schema.topicAttempts.userId, userId), eq(schema.topicAttempts.topicId, topicId), eq(schema.topicAttempts.kind, "quiz")))
    .all();
  const seen = new Set<string>();
  for (const row of rows) {
    if (row.answers && typeof row.answers === "object") for (const key of Object.keys(row.answers as object)) seen.add(key);
  }
  return seen;
}

export function flagReasonFor(row: Pick<TestItemRowDb, "attempts" | "passes" | "strongAttempts" | "strongFails">): { reason: string | null; retire: boolean } {
  const reasons: string[] = [];
  const failRate = row.attempts ? 1 - row.passes / row.attempts : 0;
  if (row.attempts >= CALIBRATION.minAttemptsToFlag && failRate > CALIBRATION.hardFailRate) {
    reasons.push(`${Math.round(failRate * 100)}% fail rate`);
  }
  if (row.strongAttempts >= CALIBRATION.minStrongAttempts && row.strongFails / row.strongAttempts >= CALIBRATION.strongFailShare) {
    reasons.push(`strong learners fail (${row.strongFails} of ${row.strongAttempts})`);
  }
  if (reasons.length) return { reason: reasons.join("; "), retire: row.attempts >= CALIBRATION.autoRetireAfter };
  if (row.attempts >= CALIBRATION.tooEasyAfter && row.passes === row.attempts) return { reason: "review (too easy)", retire: false };
  return { reason: null, retire: false };
}

/** Folds one graded attempt into the items' counters, then flags or retires. */
export function calibrateAttempt(db: Db, topic: AuthoredTopic, results: ItemResult[], options: { skipServedIds?: Set<string> } = {}): { retired: string[]; flagged: string[] } {
  const retired: string[] = [];
  const flagged: string[] = [];
  if (results.length === 0) return { retired, flagged };
  const totalCorrect = results.filter((r) => r.correct).length;
  const n = results.length;
  const counted = results.filter((r) => !options.skipServedIds?.has(r.servedId));
  if (counted.length === 0) return { retired, flagged };

  const rows = db.select().from(schema.topicTestItems).where(inArray(schema.topicTestItems.id, counted.map((r) => r.rowId))).all();
  const byId = new Map(rows.map((r) => [r.id, r]));
  const at = now();
  let needFill = false;

  for (const result of counted) {
    const row = byId.get(result.rowId);
    if (!row) continue;
    const rest = n > 1 ? (totalCorrect - (result.correct ? 1 : 0)) / (n - 1) : 0;
    const strong = n > 1 && rest >= CALIBRATION.strongRestShare;
    const next = {
      attempts: row.attempts + 1,
      passes: row.passes + (result.correct ? 1 : 0),
      strongAttempts: row.strongAttempts + (strong ? 1 : 0),
      strongFails: row.strongFails + (strong && !result.correct ? 1 : 0),
    };
    const verdict = flagReasonFor(next);
    let flagReason = verdict.reason;
    if (verdict.retire && row.status === "active") {
      if (activeCount(db, topic.id) - 1 >= minimumFor(topic)) {
        db.update(schema.topicTestItems).set({ ...next, flagReason, updatedAt: at }).where(eq(schema.topicTestItems.id, row.id)).run();
        retireRow(db, row.id, `auto-retired after ${next.attempts} attempts: ${verdict.reason}`);
        retired.push(row.id);
        needFill = true;
        continue;
      }
      flagReason = `${verdict.reason}; ${PENDING_RETIRE}`;
      needFill = true;
    }
    if (flagReason) flagged.push(row.id);
    db.update(schema.topicTestItems).set({ ...next, flagReason, updatedAt: at }).where(eq(schema.topicTestItems.id, row.id)).run();
  }
  if (needFill) queueFillIfShort(db, topic, "retire pending");
  return { retired, flagged };
}

/** After a fill: retire items whose retirement was waiting for replacements, while the minimum holds. */
export function applyPendingRetirements(db: Db, topic: AuthoredTopic): number {
  const pending = db
    .select()
    .from(schema.topicTestItems)
    .where(and(eq(schema.topicTestItems.topicId, topic.id), eq(schema.topicTestItems.status, "active")))
    .all()
    .filter((r) => r.flagReason?.includes(PENDING_RETIRE) || r.flagReason?.includes("failed re-check"));
  let done = 0;
  for (const row of pending) {
    if (activeCount(db, topic.id) - 1 < minimumFor(topic)) break;
    retireRow(db, row.id, row.flagReason ?? "retired after replacement");
    done += 1;
  }
  return done;
}
