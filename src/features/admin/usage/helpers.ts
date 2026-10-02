import { TASK_DEFAULTS, type AiTask } from "@shared/aiRouting";

/**
 * Money and series helpers for the AI usage page. Pure, so they are tested without a React tree.
 */

/**
 * `$12.34` normally; `$0.0042` when a value is real but under a cent, so a cheap Haiku call does
 * not read as free. Zero is `$0.00`.
 */
export function formatUsd(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "$0.00";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs < 0.01) return `${sign}$${abs.toFixed(4)}`;
  return `${sign}$${abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export type BudgetTone = "none" | "ok" | "warn" | "over";

/** Amber from 80% of the budget, red at 100%. `none` when no budget is set. */
export function budgetTone(share: number | null): BudgetTone {
  if (share === null) return "none";
  if (share >= 1) return "over";
  if (share >= 0.8) return "warn";
  return "ok";
}

/** Local `YYYY-MM-DD`, matching the server's `strftime(..., 'localtime')`. */
export function localDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * The server only returns days that had calls. A chart of those alone would squeeze a quiet week
 * out of existence, so every day in the window is filled in, oldest first, with zero where empty.
 */
export function fillDays(
  days: readonly { day: string; usd: number; calls: number }[],
  count: number,
  today: Date = new Date(),
): { day: string; usd: number; calls: number }[] {
  const byDay = new Map(days.map((d) => [d.day, d]));
  const out: { day: string; usd: number; calls: number }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const key = localDay(date);
    out.push(byDay.get(key) ?? { day: key, usd: 0, calls: 0 });
  }
  return out;
}

/** A task's human label; calls that predate tasks are grouped by purpose and shown as-is. */
export function taskLabel(task: string): string {
  return TASK_DEFAULTS[task as AiTask]?.label ?? task.replace(/_/g, " ");
}
