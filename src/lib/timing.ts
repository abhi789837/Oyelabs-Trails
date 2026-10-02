import { formatMinutes } from "@shared/timing";

/**
 * Display helpers for v4.1 timing: designed length, time actually spent, and AI cost. Pure, so they
 * are tested without a React tree.
 */

/** "About 29 minutes" from a designed length in seconds. Null for an unknown or zero length. */
export function aboutMinutes(seconds: number | null | undefined): string | null {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return null;
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `About ${minutes} minute${minutes === 1 ? "" : "s"}`;
}

/** "est. 29 min", for header lines. */
export function estMinutes(seconds: number | null | undefined): string | null {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return null;
  return `est. ${Math.max(1, Math.round(seconds / 60))} min`;
}

/** "Finished in 31:40 (est. 29:00)"; without the estimate when it is unknown; null when not finished. */
export function finishedLine(finishedSeconds: number | null | undefined, estSeconds: number | null | undefined): string | null {
  if (finishedSeconds === null || finishedSeconds === undefined || !Number.isFinite(finishedSeconds) || finishedSeconds < 0) return null;
  const est = estSeconds && estSeconds > 0 ? ` (est. ${formatMinutes(estSeconds)})` : "";
  return `Finished in ${formatMinutes(finishedSeconds)}${est}`;
}

/**
 * Micro-dollars (the server's `costMicros`) as money. `$0.03` normally, `$0.0042` under a cent so a
 * cheap call does not read as free, `$0.00` for nothing.
 */
export function formatCostMicros(micros: number | null | undefined): string {
  if (!micros || !Number.isFinite(micros) || micros <= 0) return "$0.00";
  const usd = micros / 1_000_000;
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Seconds as "1:05"; `—` when unknown. */
export function clockOrDash(seconds: number | null | undefined): string {
  return seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0 ? "—" : formatMinutes(seconds);
}
