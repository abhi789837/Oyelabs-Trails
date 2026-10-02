import { and, eq, gt, inArray, isNotNull } from "drizzle-orm";

import { DEFAULT_TIMING, estimateSeconds, type TimingConstants } from "../../../shared/timing";
import type { Db } from "../db";
import * as schema from "../db/schema";
import { fromRow } from "./repo";
import { setTimingConstants, timingConstants } from "./timing";

const LAST_RUN_KEY = "timing.calibrated_at";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_SAMPLES = 30;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Weekly calibration of the timing formula (v4.1 §1c) from what learners actually spent.
 *
 * - Per bank item with ≥ 5 timed answers: store the median, and flag it when the median is over
 *   1.5× its estimate (it gets shortened before it is served again — the assembler skips flagged items).
 * - Across everything (≥ 30 answers): scale the formula's time constants by the median
 *   actual/estimate ratio, damped to ±20% a week so one odd cohort cannot swing it.
 */
export function calibrateTiming(db: Db, options: { force?: boolean; now?: number } = {}): { items: number; flagged: number; ratio: number | null; constants: TimingConstants } {
  const at = options.now ?? Date.now();
  const last = Number(db.select().from(schema.appMeta).where(eq(schema.appMeta.key, LAST_RUN_KEY)).get()?.value ?? 0);
  if (!options.force && at - last < WEEK_MS) return { items: 0, flagged: 0, ratio: null, constants: timingConstants(db) };

  const rows = db
    .select({ bankItemId: schema.assessmentItems.bankItemId, activeMs: schema.assessmentItems.activeMs, estSeconds: schema.assessmentItems.estSeconds })
    .from(schema.assessmentItems)
    .where(and(isNotNull(schema.assessmentItems.lockedAt), gt(schema.assessmentItems.activeMs, 0), isNotNull(schema.assessmentItems.estSeconds)))
    .all();

  const byItem = new Map<string, number[]>();
  const ratios: number[] = [];
  for (const row of rows) {
    const seconds = row.activeMs / 1000;
    if (seconds < 3 || seconds > 900) continue; // idle or walked away: not a measurement
    if (row.estSeconds) ratios.push(seconds / row.estSeconds);
    if (row.bankItemId) byItem.set(row.bankItemId, [...(byItem.get(row.bankItemId) ?? []), seconds]);
  }

  const constants = timingConstants(db);
  let updated = 0;
  let flagged = 0;
  const ids = [...byItem.keys()];
  const bankRows = ids.length ? db.select().from(schema.questionBank).where(inArray(schema.questionBank.id, ids)).all() : [];
  for (const row of bankRows) {
    const times = byItem.get(row.id)!;
    if (times.length < 5) continue;
    const med = Math.round(median(times));
    const est = estimateSeconds(fromRow(row), constants);
    const slow = med > est * 1.5;
    if (slow) flagged += 1;
    db.update(schema.questionBank).set({ medianSeconds: med, flaggedSlow: slow }).where(eq(schema.questionBank.id, row.id)).run();
    updated += 1;
  }

  let ratio: number | null = null;
  let next = constants;
  if (ratios.length >= MIN_SAMPLES) {
    ratio = Math.min(1.2, Math.max(0.8, median(ratios)));
    next = {
      readWpm: Math.round(constants.readWpm / ratio),
      codeLineSec: round1(constants.codeLineSec * ratio),
      writeLineSec: round1(constants.writeLineSec * ratio),
      cellSec: round1(constants.cellSec * ratio),
      writeWpm: Math.round(constants.writeWpm / ratio),
      thinkSec: round1(constants.thinkSec * ratio),
    };
    setTimingConstants(db, next);
  }
  db.insert(schema.appMeta)
    .values({ key: LAST_RUN_KEY, value: String(at), updatedAt: at })
    .onConflictDoUpdate({ target: schema.appMeta.key, set: { value: String(at), updatedAt: at } })
    .run();
  return { items: updated, flagged, ratio, constants: next };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export { DEFAULT_TIMING };
