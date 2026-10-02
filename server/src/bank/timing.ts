import { eq } from "drizzle-orm";

import type { BankItem } from "../../../shared/bank";
import { DEFAULT_TIMING, estimateSeconds, sizeProblems, TOTAL_MAX_SEC, TOTAL_MIN_SEC, type TimingConstants } from "../../../shared/timing";
import type { MixGroup } from "../../../shared/setup";
import type { Db } from "../db";
import * as schema from "../db/schema";

const KEY = "timing.constants";

/** The formula's constants, as calibrated by the weekly job; the defaults until then. */
export function timingConstants(db: Db): TimingConstants {
  const row = db.select().from(schema.appMeta).where(eq(schema.appMeta.key, KEY)).get();
  if (!row) return DEFAULT_TIMING;
  try {
    return { ...DEFAULT_TIMING, ...(JSON.parse(row.value) as Partial<TimingConstants>) };
  } catch {
    return DEFAULT_TIMING;
  }
}

export function setTimingConstants(db: Db, constants: TimingConstants): void {
  const value = JSON.stringify(constants);
  db.insert(schema.appMeta).values({ key: KEY, value, updatedAt: Date.now() }).onConflictDoUpdate({ target: schema.appMeta.key, set: { value, updatedAt: Date.now() } }).run();
}

export interface BalancePick {
  item: BankItem;
  skillId: string;
  group: MixGroup | "filler";
  origin: "bank" | "generated" | "fallback";
  /** Generated-for-this-learner items are kept; only bank picks are swapped. */
  swappable: boolean;
  bankItemId?: string | null;
}

/**
 * Makes the sheet add up to 26–32 minutes by design (v4.1 §1c).
 *
 * Swaps one bank item at a time for another of the same skill and type — a longer one while the
 * total is short, a shorter one while it is long — always keeping items within the size limits
 * and never repeating one. Stops when the total is in the window or no swap helps.
 */
export function balanceTiming<T extends BalancePick>(picks: T[], pool: readonly BankItem[], constants: TimingConstants): T[] {
  const result = [...picks];
  const est = (item: BankItem) => estimateSeconds(item, constants);
  const total = () => result.reduce((s, p) => s + est(p.item), 0);
  const used = new Set(result.map((p) => p.item.id));
  for (let guard = 0; guard < 60; guard += 1) {
    const t = total();
    if (t >= TOTAL_MIN_SEC && t <= TOTAL_MAX_SEC) break;
    const tooShort = t < TOTAL_MIN_SEC;
    const need = tooShort ? TOTAL_MIN_SEC - t : t - TOTAL_MAX_SEC;
    let best: { index: number; replacement: BankItem; gain: number } | null = null;
    result.forEach((pick, index) => {
      if (!pick.swappable) return;
      const current = est(pick.item);
      for (const candidate of pool) {
        if (used.has(candidate.id) || candidate.skillId !== pick.item.skillId || candidate.type !== pick.item.type) continue;
        if (sizeProblems(candidate).length > 0) continue;
        const delta = est(candidate) - current;
        const gain = tooShort ? delta : -delta;
        if (gain <= 0) continue;
        // Prefer the swap that closes the gap without overshooting the other end.
        const score = Math.min(gain, need) - Math.max(0, gain - need - (TOTAL_MAX_SEC - TOTAL_MIN_SEC));
        if (!best || score > best.gain) best = { index, replacement: candidate, gain: score };
      }
    });
    if (!best) break;
    const chosen: { index: number; replacement: BankItem } = best;
    used.delete(result[chosen.index].item.id);
    used.add(chosen.replacement.id);
    result[chosen.index] = { ...result[chosen.index], item: chosen.replacement, bankItemId: chosen.replacement.id };
  }
  return result;
}

export function totalSeconds(items: readonly BankItem[], constants: TimingConstants): number {
  return items.reduce((s, i) => s + estimateSeconds(i, constants), 0);
}
