import { and, eq, inArray, isNotNull } from "drizzle-orm";

import { AUTO_RETIRE_MIN_USES, AUTO_RETIRE_TOO_EASY, AUTO_RETIRE_TOO_HARD } from "../../../shared/bank";
import type { Db } from "../db";
import * as schema from "../db/schema";
import { now } from "../lib/ids";

/**
 * Item statistics and automatic retirement (v4 Phase 5), run nightly.
 *
 * - **Mean score** is kept incrementally at grading time (`times_scored`, `score_sum`).
 * - **Discrimination** is the correlation between an item's score and the rest of that sitting's
 *   score (item-rest correlation): a good item is answered well by strong sittings and badly by
 *   weak ones. Computed here from graded rows, once there are 10 or more.
 * - **Auto-retire** an active item used ≥ AUTO_RETIRE_MIN_USES times that almost everyone fails
 *   (mean ≤ 5%) or almost everyone passes (mean ≥ 95%): either it is broken or it measures nothing.
 *   Retired items stay in the table with a reason and can be restored by an admin.
 */
export function recomputeBankStats(db: Db): { updated: number; retired: string[] } {
  const graded = db
    .select({ assessmentId: schema.assessmentItems.assessmentId, bankItemId: schema.assessmentItems.bankItemId, score: schema.assessmentItems.score })
    .from(schema.assessmentItems)
    .where(and(isNotNull(schema.assessmentItems.bankItemId), isNotNull(schema.assessmentItems.score)))
    .all() as { assessmentId: string; bankItemId: string; score: number }[];

  const sittingTotals = new Map<string, { sum: number; count: number }>();
  for (const row of graded) {
    const t = sittingTotals.get(row.assessmentId) ?? { sum: 0, count: 0 };
    t.sum += row.score;
    t.count += 1;
    sittingTotals.set(row.assessmentId, t);
  }

  const byItem = new Map<string, { item: number; rest: number }[]>();
  for (const row of graded) {
    const total = sittingTotals.get(row.assessmentId)!;
    if (total.count < 2) continue;
    const rest = (total.sum - row.score) / (total.count - 1);
    const list = byItem.get(row.bankItemId) ?? [];
    list.push({ item: row.score, rest });
    byItem.set(row.bankItemId, list);
  }

  let updated = 0;
  db.transaction((tx) => {
    for (const [id, pairs] of byItem) {
      if (pairs.length < 10) continue;
      tx.update(schema.questionBank).set({ discrimination: correlation(pairs) }).where(eq(schema.questionBank.id, id)).run();
      updated += 1;
    }
  });

  const candidates = db
    .select()
    .from(schema.questionBank)
    .where(eq(schema.questionBank.status, "active"))
    .all()
    .filter((row) => row.timesScored >= AUTO_RETIRE_MIN_USES);
  const retired: string[] = [];
  for (const row of candidates) {
    const mean = row.scoreSum / row.timesScored;
    const reason = mean <= AUTO_RETIRE_TOO_HARD ? `auto: ${Math.round(mean * 100)}% mean over ${row.timesScored} uses (almost everyone fails)` : mean >= AUTO_RETIRE_TOO_EASY ? `auto: ${Math.round(mean * 100)}% mean over ${row.timesScored} uses (almost everyone passes)` : null;
    if (!reason) continue;
    retired.push(row.id);
    db.update(schema.questionBank).set({ status: "retired", retiredReason: reason, updatedAt: now() }).where(eq(schema.questionBank.id, row.id)).run();
  }
  return { updated, retired };
}

function correlation(pairs: { item: number; rest: number }[]): number | null {
  const n = pairs.length;
  const mx = pairs.reduce((s, p) => s + p.item, 0) / n;
  const my = pairs.reduce((s, p) => s + p.rest, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const p of pairs) {
    sxy += (p.item - mx) * (p.rest - my);
    sxx += (p.item - mx) ** 2;
    syy += (p.rest - my) ** 2;
  }
  if (sxx === 0 || syy === 0) return null;
  return Math.round((sxy / Math.sqrt(sxx * syy)) * 1000) / 1000;
}

/** Active item counts per skill and type, for the "thin skills" view and the gap-fill decision. */
export function bankCoverage(db: Db, departmentId: string, skillIds?: readonly string[]) {
  const rows = db
    .select({ skillId: schema.questionBank.skillId, type: schema.questionBank.type, difficulty: schema.questionBank.difficulty })
    .from(schema.questionBank)
    .where(
      and(
        eq(schema.questionBank.departmentId, departmentId),
        eq(schema.questionBank.status, "active"),
        ...(skillIds && skillIds.length ? [inArray(schema.questionBank.skillId, [...skillIds])] : []),
      ),
    )
    .all();
  const coverage = new Map<string, { coding: number; mcq: number; task: number }>();
  for (const row of rows) {
    const entry = coverage.get(row.skillId) ?? { coding: 0, mcq: 0, task: 0 };
    entry[row.type] += 1;
    coverage.set(row.skillId, entry);
  }
  return coverage;
}
