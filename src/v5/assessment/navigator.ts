import type { ItemResponseV4, SheetItem } from "@shared/assessmentV4";

import { chipState, countStates, type ChipState, type SheetCounts } from "@/features/assessment/v4/clock";
import type { SaveStatus } from "@/features/assessment/v4/useAutosave";

/**
 * The v5 sheet's navigator and status words, as pure functions (tested in assessment.test.ts).
 *
 * The chip rules themselves come from the v4 sheet (`chipState`, `countStates`), so both designs
 * agree on what "answered" means. This file adds the words around them: labels, the summary line,
 * filters, "next not answered", the autosave line and the plain proctoring status.
 */

export type { ChipState, SheetCounts };

export interface NavEntry {
  id: string;
  /** 1-based, as the learner reads it. */
  number: number;
  index: number;
  state: ChipState;
  flagged: boolean;
}

export type NavFilter = "all" | "unanswered" | "flagged";

export const STATE_WORDS: Record<ChipState, string> = {
  unanswered: "not answered",
  answered: "answered",
  unknown: "don't know yet",
  submitted: "handed in",
};

export function navEntries(items: readonly Pick<SheetItem, "id" | "state" | "flagged">[], responses: Readonly<Record<string, ItemResponseV4 | null>>): NavEntry[] {
  return items.map((item, index) => ({
    id: item.id,
    number: index + 1,
    index,
    state: chipState(item, responses[item.id] ?? null),
    flagged: item.flagged,
  }));
}

export function navCounts(entries: readonly NavEntry[]): SheetCounts {
  return countStates(
    entries.map((e) => e.state),
    entries.map((e) => e.flagged),
  );
}

/** "Question 3: answered, flagged" — the chip's accessible name (the e2e uses the prefix). */
export function navLabel(entry: NavEntry): string {
  return `Question ${entry.number}: ${STATE_WORDS[entry.state]}${entry.flagged ? ", flagged" : ""}`;
}

/** Answered includes "handed in": both are answers the learner has given. */
export function answeredCount(counts: SheetCounts): number {
  return counts.answered + counts.submitted;
}

/** "5 of 18 answered · 2 flagged". */
export function navSummary(counts: SheetCounts, total: number): string {
  const parts = [`${answeredCount(counts)} of ${total} answered`];
  if (counts.flagged) parts.push(`${counts.flagged} flagged`);
  if (counts.unknown) parts.push(`${counts.unknown} don't know yet`);
  return parts.join(" · ");
}

export function filterEntries(entries: readonly NavEntry[], filter: NavFilter): NavEntry[] {
  if (filter === "flagged") return entries.filter((e) => e.flagged);
  if (filter === "unanswered") return entries.filter((e) => e.state === "unanswered");
  return [...entries];
}

/** The next question after `from` with no answer yet, wrapping round; null when all have one. */
export function nextUnanswered(entries: readonly NavEntry[], from: number): number | null {
  const n = entries.length;
  for (let step = 1; step <= n; step++) {
    const entry = entries[(from + step) % n];
    if (entry.state === "unanswered") return entry.index;
  }
  return null;
}

/** The lines in "Hand in your answers?", most important first. Empty lines are left out. */
export function finishLines(counts: SheetCounts): string[] {
  const lines: string[] = [];
  if (counts.unanswered) lines.push(`${counts.unanswered} ${counts.unanswered === 1 ? "question has" : "questions have"} no answer yet.`);
  if (counts.flagged) lines.push(`${counts.flagged} ${counts.flagged === 1 ? "is" : "are"} flagged to come back to.`);
  if (counts.unknown) lines.push(`${counts.unknown} marked "I don't know yet". That's fine: it costs nothing.`);
  if (!lines.length) lines.push("Every question has an answer.");
  return lines;
}

// ---------------------------------------------------------------------------
// Autosave line
// ---------------------------------------------------------------------------

export interface SaveLine {
  text: string;
  tone: "quiet" | "ok" | "warn";
}

/** What the autosave indicator says. Never silent once something has been saved. */
export function saveLine(status: SaveStatus, savedOnce: boolean): SaveLine {
  if (status === "saving") return { text: "Saving…", tone: "quiet" };
  if (status === "error") return { text: "Not saved yet, trying again", tone: "warn" };
  if (status === "saved" || savedOnce) return { text: "All answers saved", tone: "ok" };
  return { text: "Answers save as you go", tone: "quiet" };
}

// ---------------------------------------------------------------------------
// Proctoring, in plain words
// ---------------------------------------------------------------------------

export interface ProctorWord {
  id: "camera" | "tab" | "fullscreen";
  ok: boolean;
  text: string;
}

/**
 * The status chips: "Camera on", "Stay on this tab", "Full screen on". Calm words; when something
 * needs doing, the chip says what to do ("Turn your camera back on"), never what was "detected".
 */
export function proctorWords(state: { cameraLive: boolean; visible: boolean; fullscreen: boolean }): ProctorWord[] {
  return [
    { id: "camera", ok: state.cameraLive, text: state.cameraLive ? "Camera on" : "Turn your camera back on" },
    { id: "tab", ok: state.visible, text: "Stay on this tab" },
    { id: "fullscreen", ok: state.fullscreen, text: state.fullscreen ? "Full screen on" : "Go back to full screen" },
  ];
}

/** "No warnings" / "1 of 3 warnings": plain, and shown once there is something to show. */
export function warningsLine(count: number, limit: number): string {
  return count === 0 ? "No warnings" : `${count} of ${limit} warnings`;
}

/** The hard-warning dialog's consequence line, without alarm. */
export function warningConsequence(count: number, limit: number, terminal: boolean): string {
  if (terminal) return "The test has ended. Everything you answered is saved and will still be marked.";
  const left = Math.max(0, limit - count);
  if (left === 1) return "One more of these ends the test.";
  return `${left} more of these end the test.`;
}
