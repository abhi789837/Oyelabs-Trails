import { z } from "zod";

import type { CodingMode } from "./bank";
import type { SandboxLanguage } from "./catalog";
import type { MixGroup, PriorityBucket } from "./setup";
import { taskResponseSchema, type LearnerTask } from "./tasks";

/**
 * The v4 assessment as the learner sees it (Phase 4): one sheet of at most 25 items, free
 * navigation, one overall clock (about 30 minutes, hard stop at 50), no per-question timer, and an
 * "I don't know yet" on every item that costs nothing.
 */

export const RUN_LIMIT = 3;
export const V4_MAX_MINUTES = 50;
export const V4_TARGET_MINUTES = 30;

export type SheetItemType = "coding" | "mcq" | "task";

/** A visible sample test, in the shape its mode uses. Hidden tests never leave the server. */
export type SampleTest = { args: unknown[]; expected: unknown } | { stdin: string; expected: string } | { setup: string; expected: unknown[] };

export interface SheetItemBase {
  id: string;
  position: number;
  type: SheetItemType;
  skillId: string;
  skillName: string;
  prompt: string;
  /** `unanswered` → `answered` (a draft exists) → `submitted` (locked; graded or waiting on a rubric). */
  state: "unanswered" | "answered" | "submitted";
  flagged: boolean;
  runsUsed: number;
  /** The learner's latest saved answer, so a refresh or a second device resumes exactly. */
  draft: ItemResponseV4 | null;
}

export interface CodingSheetItem extends SheetItemBase {
  type: "coding";
  language: SandboxLanguage;
  mode: CodingMode;
  functionName: string | null;
  starterCode: string;
  sampleTests: SampleTest[];
  /** JS/TS run in the browser after the server counts the run; everything else runs on the server. */
  runsOn: "browser" | "server";
}

export interface McqSheetItem extends SheetItemBase {
  type: "mcq";
  options: string[];
  snippet: string | null;
  snippetLanguage: SandboxLanguage | null;
  runsOn: "browser" | "server" | null;
}

export interface TaskSheetItem extends SheetItemBase {
  type: "task";
  task: LearnerTask;
}

export type SheetItem = CodingSheetItem | McqSheetItem | TaskSheetItem;

export interface Sheet {
  assessmentId: string;
  status: string;
  startedAt: number | null;
  /** Server-authoritative. The client counts down to this and submits at it. */
  deadlineAt: number | null;
  /** Finish is disabled until this time, when the admin turned on a minimum (off by default). */
  minFinishAt: number | null;
  serverNow: number;
  targetMinutes: number;
  maxMinutes: number;
  /** v4.1: the sheet's designed length, from the per-item estimates. */
  estSeconds: number;
  items: SheetItem[];
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

export const itemResponseV4Schema = z.union([
  z.object({ unknown: z.literal(true) }),
  z.object({ code: z.string().max(40_000) }),
  z.object({ choice: z.number().int().min(0).max(10) }),
  z.object({ task: taskResponseSchema }),
]);
export type ItemResponseV4 = z.infer<typeof itemResponseV4Schema>;

export const saveDraftRequestSchema = z.object({
  response: itemResponseV4Schema.nullable().optional(),
  flagged: z.boolean().optional(),
  /** v4.1: milliseconds the learner spent on this item since the last save (visible, focused). */
  elapsedMs: z.number().int().min(0).max(120_000).optional(),
});

export const runRequestSchema = z.object({ code: z.string().max(40_000) });

export interface RunTestOutcome {
  index: number;
  passed: boolean;
  expected: string;
  actual?: string;
  error?: string;
}

export interface RunResponse {
  runsUsed: number;
  runsLeft: number;
  /** True when this was the last run and the item has now been submitted with this code. */
  autoSubmitted: boolean;
  /** `browser`: the client runs the sample tests itself now that the run is counted. */
  runsOn: "browser" | "server";
  /** Server runs only. */
  result?: { outcomes: RunTestOutcome[]; passedCount: number; total: number; compileError?: string; timedOut: boolean };
  /** Server snippet runs only. */
  output?: { stdout: string; stderr: string; timedOut: boolean };
}

export const submitItemRequestSchema = z.object({ response: itemResponseV4Schema });

// ---------------------------------------------------------------------------
// Results — a report by priority skill, not a single scary percentage
// ---------------------------------------------------------------------------

export interface SkillResult {
  skillId: string;
  skillName: string;
  group: MixGroup | "filler";
  /** The admin's slider, when the skill was a priority. */
  slider: number | null;
  priority: PriorityBucket | null;
  asked: number;
  /** Items answered "I don't know yet". */
  unknown: number;
  /** 0..1 mean score, difficulty-weighted. Null when every answer is still waiting on a rubric. */
  score: number | null;
  /** 0–5, from the score and the difficulty it was reached at. */
  level: number | null;
}

export interface V4Result {
  format: "v4";
  skills: SkillResult[];
  /** Skill names the learner is already strong in. */
  strengths: string[];
  /** Up to three Critical/High skills with the lowest level: what the path starts with. */
  focusFirst: string[];
  /** Admin only: 0–100 across every graded item. */
  rawScore: number;
  /** Written answers still waiting for rubric grading (no AI credential at the time). */
  pendingWritten: number;
  answered: number;
  total: number;
  /** v4.1: "Finished in 31:40 (est. 29:00)". Seconds; null when not known. */
  finishedSeconds?: number | null;
  estSeconds?: number | null;
  /**
   * v4.3: mastery per skill (0–5), measured or inferred from a measured skill that builds on it
   * (`estimateMastery` in shared/pathOrder.ts). Absent on results stored before v4.3.
   */
  mastery?: MasteryView[];
  /** v4.3: prerequisites below the level the learner's goals need (D4). Absent before v4.3. */
  missingLinks?: MissingLinkView[];
  /** v4.3: goal skills already at the level their goal needs, so the path skips them. */
  metGoals?: MetGoalView[];
}

export interface MasteryView {
  skillId: string;
  skillName: string;
  level: number;
  source: "measured" | "inferred";
}

/** "async JS 1/5 → needed 3/5 for Backend". */
export interface MissingLinkView {
  skillId: string;
  skillName: string;
  /** Null when the evaluation did not measure it (it counts as 0). */
  mastery: number | null;
  neededLevel: number;
  /** The goal it is mainly needed for, as the admin named it. */
  forGoal: string;
  /** Names of the path skills it blocks, in path order. */
  blocks: string[];
}

export interface MetGoalView {
  skillId: string;
  skillName: string;
  mastery: number;
  neededLevel: number;
  /** Below 5/5: an advanced course is still on offer. */
  optionalAdvanced: boolean;
}

/** Level 0–5 from a difficulty-weighted score: roughly "the hardest band you can reliably do". */
export function levelFrom(score: number, avgDifficulty: number): number {
  return Math.max(0, Math.min(5, Math.round(score * (avgDifficulty + 1))));
}
