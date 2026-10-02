import type { ItemResponseV4, SheetItem } from "@shared/assessmentV4";

/**
 * The v4 clock and navigator rules, as pure functions.
 *
 * One overall clock, counting **up** ("28:10 elapsed · ends at 50:00"): a countdown to a cliff is
 * what makes people panic, and there is no per-question timer anywhere. The server is the
 * authority; the client corrects for the difference between its clock and the server's once per
 * sheet load (`skewMs`).
 */

/** Amber from here on. No flashing. */
export const SHORT_TIME_MS = 5 * 60_000;

/** mm:ss, or h:mm:ss past an hour. Negative values clamp to 0. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Server time minus client time, measured when the sheet arrived. */
export function skewMs(serverNow: number, clientNowAtReceipt: number): number {
  return serverNow - clientNowAtReceipt;
}

export interface ClockView {
  elapsedMs: number;
  remainingMs: number;
  /** The deadline as a time on the same elapsed clock: "ends at 50:00". */
  endsAtLabel: string;
  elapsedLabel: string;
  short: boolean;
  over: boolean;
}

export function clockView(clientNow: number, skew: number, startedAt: number, deadlineAt: number): ClockView {
  const now = clientNow + skew;
  const elapsedMs = Math.max(0, now - startedAt);
  const remainingMs = Math.max(0, deadlineAt - now);
  return {
    elapsedMs,
    remainingMs,
    elapsedLabel: formatClock(Math.min(elapsedMs, deadlineAt - startedAt)),
    endsAtLabel: formatClock(deadlineAt - startedAt),
    short: remainingMs > 0 && remainingMs <= SHORT_TIME_MS,
    over: remainingMs <= 0,
  };
}

// ---------------------------------------------------------------------------
// Navigator
// ---------------------------------------------------------------------------

export type ChipState = "unanswered" | "answered" | "unknown" | "submitted";

/** What one chip shows, from the server's item and the learner's local (possibly unsaved) answer. */
export function chipState(item: Pick<SheetItem, "state">, response: ItemResponseV4 | null): ChipState {
  if (item.state === "submitted") return "submitted";
  if (!response) return "unanswered";
  if ("unknown" in response) return "unknown";
  return "answered";
}

export interface SheetCounts {
  answered: number;
  unknown: number;
  unanswered: number;
  submitted: number;
  flagged: number;
}

export function countStates(states: readonly ChipState[], flagged: readonly boolean[]): SheetCounts {
  return {
    answered: states.filter((s) => s === "answered").length,
    unknown: states.filter((s) => s === "unknown").length,
    unanswered: states.filter((s) => s === "unanswered").length,
    submitted: states.filter((s) => s === "submitted").length,
    flagged: flagged.filter(Boolean).length,
  };
}

/**
 * Whether a key press should drive the sheet ([ ] F and the number keys). Never while typing: a text
 * field, a contenteditable, or Monaco's hidden textarea all swallow it. A focused radio still lets
 * the number keys through, so after picking option 1 with the mouse, "2" picks option 2.
 */
export function isTypingTarget(target: { tagName?: string; isContentEditable?: boolean; type?: string; closest?: (s: string) => unknown } | null): boolean {
  if (!target) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") return target.type !== "radio" && target.type !== "checkbox";
  return Boolean(target.closest?.(".monaco-editor"));
}

/** Whether two responses are the same answer (so an unchanged draft is not saved again). */
export function sameResponse(a: ItemResponseV4 | null, b: ItemResponseV4 | null): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
