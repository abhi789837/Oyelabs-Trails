import { z } from "zod";

import { AI_GRADED_KINDS, TERMINAL_PASS, type Task, type TaskKind, type TaskResponse } from "./tasks";

/**
 * v4.4 Phase 4: "full marks when the answer is good".
 *
 * Every graded answer gets a verdict: **Full marks** or **Not yet**. The grader's own 0..1 (the
 * "raw" score) is kept beside it, so a switch to partial credit, a re-score or an admin review never
 * needs the grader again. Skill levels still come from the pattern of full / not-yet answers across
 * difficulties (`levelFrom` in `assessmentV4.ts` works on 0/1 scores unchanged).
 *
 * - MCQ: the right option.
 * - Code: every **core** test passes. A failed **edge** test never costs the marks: it becomes a note.
 *   A test is core unless it is marked edge (`tier: "edge"` on a bank test, `isEdgeCase` on content).
 * - Deterministic tasks: `calculate` needs every field within tolerance, `rank` the exact order or
 *   one of the task's `acceptOrders`, `terminal` its own pass rule; the rest pass at MET_THRESHOLD.
 * - AI-graded tasks (write, form, roleplay, speak, and any later kind whose grader says `met`): the
 *   grader's `met`. Answers graded before v4.4 have no `met`; their rubric score decides at
 *   LEGACY_MET_THRESHOLD.
 */

export const SCORING_MODES = ["full", "partial"] as const;
export const scoringModeSchema = z.enum(SCORING_MODES);
export type ScoringMode = z.infer<typeof scoringModeSchema>;
export const DEFAULT_SCORING_MODE: ScoringMode = "full";

export const SCORING_MODE_LABELS: Record<ScoringMode, string> = {
  full: "Full marks or Not yet (recommended)",
  partial: "Partial credit",
};

/** A deterministic task at or above this share right does the job. */
export const MET_THRESHOLD = 0.8;
/** Old AI-graded answers (no `met` stored): a normalised rubric score at or above this meets it. */
export const LEGACY_MET_THRESHOLD = 0.7;

export type VerdictValue = "full" | "not_yet";

export const VERDICT_LABELS: Record<VerdictValue, string> = { full: "Full marks", not_yet: "Not yet" };

export interface Verdict {
  full: boolean;
  score: 0 | 1;
  /** One plain line: a missed edge case on an otherwise full answer, or the grader's tip. */
  note?: string;
}

export type TestTier = "core" | "edge";
export const testTierSchema = z.enum(["core", "edge"]);

export interface TieredOutcome {
  passed: boolean;
  tier: TestTier;
  /** What the learner may see about the test ("an empty list"), never hidden data. */
  label?: string;
}

/** What `verdictFor` needs, per kind. Built from stored rows, so a re-score needs no grader call. */
export type VerdictInput =
  /** "I don't know yet", or nothing submitted. */
  | { kind: "unanswered" }
  | { kind: "mcq"; correct: boolean }
  | { kind: "code"; outcomes: readonly TieredOutcome[]; compileError?: string | null }
  | {
      kind: "task";
      task: Task | { kind: string };
      response: TaskResponse | { kind: string } | null;
      /** The grader's 0..1 (code checks, rubric or both). Null = not graded yet. */
      raw: number | null;
      /** The AI grader's verdict, when it gave one. */
      met?: boolean | null;
      /** One-line tip from the AI grader. */
      tip?: string | null;
      /** A form's exact checks (0..1), when it has any. */
      checkScore?: number | null;
    };

const full = (note?: string): Verdict => ({ full: true, score: 1, ...(note ? { note } : {}) });
const notYet = (note?: string): Verdict => ({ full: false, score: 0, ...(note ? { note } : {}) });

export function tierOf(test: unknown): TestTier {
  if (!test || typeof test !== "object") return "core";
  const t = test as { tier?: unknown; isEdgeCase?: unknown };
  return t.tier === "edge" || t.isEdgeCase === true ? "edge" : "core";
}

/** True when the order is the key's order or one of its other accepted orders. */
export function rankOrderAccepted(task: { correctOrder: readonly string[]; acceptOrders?: readonly (readonly string[])[] }, order: readonly string[]): boolean {
  const same = (key: readonly string[]) => key.length === order.length && key.every((id, i) => order[i] === id);
  return same(task.correctOrder) || (task.acceptOrders ?? []).some(same);
}

function codeVerdict(outcomes: readonly TieredOutcome[], compileError?: string | null): Verdict {
  if (compileError || outcomes.length === 0) return notYet();
  // A key with only edge tests would pass anything: then every test counts.
  const anyCore = outcomes.some((o) => o.tier === "core");
  const core = anyCore ? outcomes.filter((o) => o.tier === "core") : outcomes;
  if (!core.every((o) => o.passed)) return notYet();
  const missed = anyCore ? outcomes.filter((o) => o.tier === "edge" && !o.passed) : [];
  if (missed.length === 0) return full();
  const named = missed.map((o) => o.label).filter((l): l is string => Boolean(l));
  const what = named.length ? `: ${named.slice(0, 3).join("; ")}` : "";
  return full(`Works for the main cases. Missed ${missed.length === 1 ? "an edge case" : `${missed.length} edge cases`}${what}.`.slice(0, 300));
}

/** True for a kind graded by a model (including kinds added later that report `met`). */
export function isAiGradedKind(kind: string): boolean {
  return (AI_GRADED_KINDS as readonly string[]).includes(kind) || kind === "speak";
}

/**
 * The verdict for one graded answer, or null while it waits for its grader (an AI-graded answer
 * not graded yet, or code the runner could not run).
 */
export function verdictFor(input: VerdictInput): Verdict | null {
  switch (input.kind) {
    case "unanswered":
      return notYet();
    case "mcq":
      return input.correct ? full() : notYet();
    case "code":
      return codeVerdict(input.outcomes, input.compileError);
    case "task": {
      const { task, response, raw } = input;
      const kind = task.kind;
      if (!response || response.kind !== kind) return isAiGradedKind(kind) && raw == null ? null : notYet();
      if (typeof input.met === "boolean") {
        // A form's exact checks are facts from the source (a date, an amount): they must hold too.
        if (kind === "form" && input.checkScore != null && input.checkScore < MET_THRESHOLD) return notYet(input.tip ?? undefined);
        return input.met ? full(input.tip ?? undefined) : notYet(input.tip ?? undefined);
      }
      if (raw == null) return null;
      if (isAiGradedKind(kind)) return raw >= LEGACY_MET_THRESHOLD ? full() : notYet();
      switch (kind as TaskKind) {
        case "calculate":
          return raw >= 1 - 1e-9 ? full() : notYet();
        case "rank": {
          const order = (response as { order?: string[] }).order ?? [];
          const key = task as { correctOrder?: string[]; acceptOrders?: string[][] };
          return key.correctOrder && rankOrderAccepted({ correctOrder: key.correctOrder, acceptOrders: key.acceptOrders }, order) ? full() : notYet();
        }
        case "terminal":
          return raw >= TERMINAL_PASS ? full() : notYet();
        default:
          return raw >= MET_THRESHOLD ? full() : notYet();
      }
    }
  }
}

/** The stored score: 0/1 in full mode, the raw 0..1 in partial mode. Null while pending. */
export function scoreFor(mode: ScoringMode, verdict: Verdict | null, raw: number | null): number | null {
  if (mode === "partial") return raw;
  return verdict ? verdict.score : null;
}

export function verdictValue(verdict: Verdict | null): VerdictValue | null {
  return verdict ? (verdict.full ? "full" : "not_yet") : null;
}

// ---------------------------------------------------------------------------
// Lenient comparison
// ---------------------------------------------------------------------------

const NUMBER_RE = /^[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)?(?:\.\d+)?(?:e[+-]?\d+)?$/i;

/** "1,000" → 1000, "2.50" → 2.5, " -3 " → -3; anything else → null. "1,5" is not a number. */
export function parseLooseNumber(value: string): number | null {
  const s = value.trim();
  if (!s || !/\d/.test(s) || !NUMBER_RE.test(s)) return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Equal within a relative 1e-9 (absolute 1e-9 near zero). */
export function numbersClose(a: number, b: number): boolean {
  if (a === b) return true;
  if (Number.isNaN(a) && Number.isNaN(b)) return true;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
}

/** Trim and collapse every run of whitespace (spaces, tabs, newlines) to one space. */
export function normaliseSpace(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
}

function looseText(a: string, b: string): boolean {
  const x = normaliseSpace(a);
  const y = normaliseSpace(b);
  if (x === y) return true;
  const tx = x.split(" ");
  const ty = y.split(" ");
  if (tx.length !== ty.length) return false;
  return tx.every((token, i) => {
    if (token === ty[i]) return true;
    const na = parseLooseNumber(token);
    const nb = parseLooseNumber(ty[i]);
    return na != null && nb != null && numbersClose(na, nb);
  });
}

/**
 * Lenient equality for answers: whitespace runs collapse and ends are trimmed on strings, numbers
 * match within a tiny tolerance and across formats ("1,000" = 1000, "2.50" = 2.5, word by word inside
 * text), object key order is ignored, arrays stay ordered. Booleans and null compare exactly.
 */
export function looselyEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a === "number" && typeof b === "number") return numbersClose(a, b);
  if (typeof a === "string" && typeof b === "string") return looseText(a, b);
  if (typeof a === "number" && typeof b === "string") {
    const n = parseLooseNumber(b);
    return n != null && numbersClose(a, n);
  }
  if (typeof a === "string" && typeof b === "number") return looselyEqual(b, a);
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => looselyEqual(v, b[i]));
  const ra = a as Record<string, unknown>;
  const rb = b as Record<string, unknown>;
  const ka = Object.keys(ra);
  if (ka.length !== Object.keys(rb).length) return false;
  return ka.every((k) => Object.prototype.hasOwnProperty.call(rb, k) && looselyEqual(ra[k], rb[k]));
}

// ---------------------------------------------------------------------------
// Review requests and the re-score report (API shapes)
// ---------------------------------------------------------------------------

export const REVIEW_SOURCES = ["assessment_item", "topic_item"] as const;
export type ReviewSource = (typeof REVIEW_SOURCES)[number];

export const reviewRequestBodySchema = z.object({
  source: z.enum(REVIEW_SOURCES),
  /** An assessment item id, a topic test item id, or (for a topic's code challenge) the topic id. */
  refId: z.string().min(1).max(120),
  attemptId: z.string().min(1).max(64).optional(),
  note: z.string().trim().max(600).default(""),
});
export type ReviewRequestBody = z.infer<typeof reviewRequestBodySchema>;

export const reviewDecisionSchema = z.object({
  decision: z.enum(["override", "uphold"]),
  note: z.string().trim().max(600).default(""),
});

export interface ReviewRequestView {
  id: string;
  userId: string;
  learnerName: string;
  source: ReviewSource;
  refId: string;
  attemptId: string | null;
  status: "open" | "upheld" | "overridden";
  learnerNote: string;
  createdAt: number;
  resolvedAt: number | null;
  resolution: string | null;
  /** Where it was asked: "Assessment" or the topic's title. */
  where: string;
  question: string;
  /** The learner's answer, as plain text. */
  answer: string;
  /** Why the answer was marked Not yet (the grader's reason, or the failed checks). */
  reason: string;
}

export interface RescoreReport {
  items: number;
  changed: number;
  resultsChanged: number;
  topicAttempts?: number;
  topicChanged?: number;
  mode: ScoringMode;
  at: number;
}
