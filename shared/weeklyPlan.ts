import { z } from "zod";

import { LANE_ORDER } from "./weeklyPlanCore";

export { LANE_ORDER, doneCount, formatRange, fromIsoDate, isWeekComplete, itemsInLane, toIsoDate, weekHasEnded } from "./weeklyPlanCore";

/**
 * The weekly plan — one week of work, not the whole journey.
 *
 * The library (`learning_plans.topic_ids`, plus whatever courses are assigned) stays exactly as
 * wide as the AI and the admin decided. This is the layer on top that answers a narrower and much
 * more useful question: *what am I doing this week?* A learner opening a page that says "0 of 204
 * lessons, 190 h 50 min" learns nothing they can act on before lunch.
 *
 * Four lanes, in the order they are shown:
 *
 * - **Do it now** — the admin's High must-haves where the assessment found a real gap. Capped at
 *   half the week, because a week that is all emergency is a week with no room to learn anything
 *   properly.
 * - **Must know** — short prerequisites the other lanes depend on. Sits second, above Medium,
 *   because its whole purpose is to unblock the lane above it.
 * - **Medium** — Medium-weight must-haves and strong detected gaps.
 * - **Low** — what fits if the week goes well. Genuinely skippable.
 *
 * Every rule in here is enforced in `server/src/plans/weekly/enforce.ts` rather than only asked
 * for in a prompt. A prompt is a request; a check is a guarantee.
 */

// ---------------------------------------------------------------------------
// Lanes
// ---------------------------------------------------------------------------

export const planLaneSchema = z.enum(["do_now", "must_know", "medium", "low"]);
export type PlanLane = z.infer<typeof planLaneSchema>;


/** The key each lane uses in the AI's reply and in the API, camel-cased. */
export const LANE_KEYS = { do_now: "doNow", must_know: "mustKnow", medium: "medium", low: "low" } as const;
export type LaneKey = (typeof LANE_KEYS)[PlanLane];

export const LANE_BY_KEY: Record<LaneKey, PlanLane> = {
  doNow: "do_now",
  mustKnow: "must_know",
  medium: "medium",
  low: "low",
};

/**
 * Why an item is in the plan.
 *
 * `prerequisite` is not a priority — it is a *reason*, and it is what puts something in Must know
 * regardless of how urgent the thing it unblocks is.
 */
export const planItemSourceSchema = z.enum(["admin_priority", "ai_gap", "prerequisite"]);
export type PlanItemSource = z.infer<typeof planItemSourceSchema>;

export const planItemStatusSchema = z.enum(["pending", "done", "skipped"]);
export type PlanItemStatus = z.infer<typeof planItemStatusSchema>;

// ---------------------------------------------------------------------------
// Budgets and shapes
// ---------------------------------------------------------------------------

/** The admin's default, in hours. Set per learner during onboarding. */
export const DEFAULT_HOURS_PER_WEEK = 15;
export const MIN_HOURS_PER_WEEK = 1;
export const MAX_HOURS_PER_WEEK = 60;

export const DEFAULT_DAYS_PER_WEEK = 5;
export const MIN_DAYS_PER_WEEK = 1;
export const MAX_DAYS_PER_WEEK = 7;

/**
 * How far over budget a week may land: 10%.
 *
 * Not zero, because trimming to the exact minute means dropping a 50-minute topic to save 3 and
 * leaving 47 minutes of the week empty. A little over is a better plan than a lot under.
 */
export const BUDGET_TOLERANCE = 0.1;

/** The share of the week "Do it now" may take. Half, at most. */
export const DO_NOW_SHARE = 0.5;

/** Target size for the red lane. Not a hard cap — the budget share is the hard cap. */
export const DO_NOW_TARGET_ITEMS = { min: 2, max: 4 } as const;

/** Must know is a checklist, not a course: short items only. */
export const MUST_KNOW_MINUTES = { min: 15, max: 45 } as const;

/** A plan covers seven days, whatever the working days within it are. */
export const WEEK_LENGTH_DAYS = 7;

/** The summary is three sentences, about sixty words. Enforced, because it was 450 before. */
export const SUMMARY_MAX_WORDS = 60;

/** Skipped this many weeks in a row and the admin hears about it. */
export const SKIP_ALERT_THRESHOLD = 2;

export function budgetCeiling(budgetMinutes: number): number {
  return Math.round(budgetMinutes * (1 + BUDGET_TOLERANCE));
}

export function doNowCeiling(budgetMinutes: number): number {
  return Math.round(budgetMinutes * DO_NOW_SHARE);
}

/** Words, for the summary cap. Collapses whitespace so "a  b" is two, not three. */
export function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

/**
 * Trims a summary to the word cap without cutting mid-sentence where it can avoid it.
 *
 * The model is asked for sixty words and usually obliges. When it does not, dropping whole
 * sentences from the end reads like a shorter summary; truncating at word sixty reads like a bug.
 */
export function clampSummary(text: string, maxWords = SUMMARY_MAX_WORDS): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (wordCount(clean) <= maxWords) return clean;

  const sentences = clean.match(/[^.!?]+[.!?]*/g) ?? [clean];
  let kept = "";
  for (const sentence of sentences) {
    const candidate = (kept + sentence).trim();
    if (wordCount(candidate) > maxWords) break;
    kept = candidate + " ";
  }
  if (kept.trim() !== "") return kept.trim();

  // One very long sentence. Cut it and say so with an ellipsis rather than stopping dead.
  return clean.split(/\s+/).slice(0, maxWords).join(" ") + "…";
}

// ---------------------------------------------------------------------------
// What the model returns, and what the builder produces
// ---------------------------------------------------------------------------

/**
 * Which lesson an item points at.
 *
 * Two kinds of lesson exist in this product and the plan has to be able to schedule both: a
 * curriculum topic (graded, `topic_progress`) and a course lesson (self-reported or tested,
 * `course_progress`). Exactly one of the two is set; `courseId` travels with a lesson so the UI can
 * link to it without a second lookup.
 */
export const planItemRefSchema = z
  .object({
    topicId: z.string().trim().min(1).max(120).nullable().default(null),
    courseId: z.string().trim().min(1).max(64).nullable().default(null),
    lessonId: z.string().trim().min(1).max(64).nullable().default(null),
  })
  .refine((ref) => (ref.topicId === null) !== (ref.lessonId === null), {
    message: "An item points at either a curriculum topic or a course lesson, not both and not neither.",
  })
  .refine((ref) => ref.lessonId === null || ref.courseId !== null, {
    message: "A course lesson needs the course it belongs to.",
  });
export type PlanItemRef = z.infer<typeof planItemRefSchema>;

/** The stable identity of an item within a week: whichever of the two ids it carries. */
export function itemKey(ref: { topicId: string | null; lessonId: string | null }): string {
  return ref.topicId ?? ref.lessonId ?? "";
}

export const weeklyPlanItemSchema = z.object({
  topicId: z.string().trim().min(1).max(120).nullable().default(null),
  courseId: z.string().trim().min(1).max(64).nullable().default(null),
  lessonId: z.string().trim().min(1).max(64).nullable().default(null),
  minutes: z.number().int().min(1).max(600),
  /** One line, shown to the learner. "Admin: DevOps · High · you missed 4 of 5 deployment questions". */
  reason: z.string().trim().min(3).max(300),
  source: planItemSourceSchema,
  /** Keys of items this one needs first. Those live in Must know; this one stays in its own lane. */
  dependsOn: z.array(z.string().trim().min(1).max(120)).max(6).default([]),
});
export type WeeklyPlanItem = z.infer<typeof weeklyPlanItemSchema>;

export const weeklyPlanLanesSchema = z.object({
  doNow: z.array(weeklyPlanItemSchema).max(20).default([]),
  mustKnow: z.array(weeklyPlanItemSchema).max(20).default([]),
  medium: z.array(weeklyPlanItemSchema).max(20).default([]),
  low: z.array(weeklyPlanItemSchema).max(20).default([]),
});
export type WeeklyPlanLanes = z.infer<typeof weeklyPlanLanesSchema>;

export const EMPTY_LANES: WeeklyPlanLanes = { doNow: [], mustKnow: [], medium: [], low: [] };

/** `yyyy-mm-dd`, so a week's boundaries read the same in a prompt, a row and a URL. */
export const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a yyyy-mm-dd date");

/**
 * The whole plan for one week — the shape the AI must return and the shape the builder produces.
 *
 * Validated before anything is stored. The rules that zod cannot express (budget, lane exclusivity,
 * admin-first ordering, the skip list) are applied afterwards by `enforce`.
 */
export const weeklyPlanDraftSchema = z.object({
  weekNumber: z.number().int().min(1).max(520),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  /** Three sentences, about sixty words. Clamped rather than rejected when the model overruns. */
  summary: z.string().trim().min(10).max(1200),
  weeklyBudgetMinutes: z.number().int().min(30).max(MAX_HOURS_PER_WEEK * 60),
  lanes: weeklyPlanLanesSchema,
  /** 3–5 titles for "coming up next week". Nothing is scheduled from it. */
  nextWeekPreview: z.array(z.string().trim().min(2).max(200)).max(8).default([]),
  /** The long-term story that used to be the whole page. Now behind a collapsed section. */
  roadmapNarrative: z.string().trim().max(4000).default(""),
});
export type WeeklyPlanDraft = z.infer<typeof weeklyPlanDraftSchema>;

/** Every item in a draft, in lane order, with its lane attached. */
export function flattenLanes(lanes: WeeklyPlanLanes): { lane: PlanLane; item: WeeklyPlanItem }[] {
  return LANE_ORDER.flatMap((lane) => lanes[LANE_KEYS[lane]].map((item) => ({ lane, item })));
}

export function laneMinutes(items: readonly WeeklyPlanItem[]): number {
  return items.reduce((sum, item) => sum + item.minutes, 0);
}

export function draftMinutes(lanes: WeeklyPlanLanes): number {
  return LANE_ORDER.reduce((sum, lane) => sum + laneMinutes(lanes[LANE_KEYS[lane]]), 0);
}

// ---------------------------------------------------------------------------
// What the UI reads
// ---------------------------------------------------------------------------

export const weekStatusSchema = z.enum(["active", "completed", "superseded"]);
export type WeekStatus = z.infer<typeof weekStatusSchema>;

/** `ai` when a model shaped the lanes, `rules` when the deterministic builder did it alone. */
export const weekSourceSchema = z.enum(["ai", "rules", "admin"]);
export type WeekSource = z.infer<typeof weekSourceSchema>;

export interface WeekItemView {
  id: string;
  lane: PlanLane;
  position: number;
  topicId: string | null;
  courseId: string | null;
  lessonId: string | null;
  /** The lesson's own title, resolved server-side so the client needs no second fetch. */
  title: string;
  /** "JavaScript Core · Frontend", or the course title for a course lesson. */
  context: string;
  /** A curriculum level, or null for a course lesson, which has none. */
  level: "beginner" | "intermediate" | "advanced" | "expert" | null;
  minutes: number;
  reason: string;
  source: PlanItemSource;
  status: PlanItemStatus;
  /** Where to send the learner. Already the right shape for either kind of lesson. */
  href: string;
  /** Titles and keys of the Must-know items this one waits on, for the "Needs: …" line. */
  dependsOn: { key: string; title: string }[];
  pinned: boolean;
  /** True when this item was carried over from an earlier week. */
  carried: boolean;
  skipCount: number;
}

export interface WeekView {
  id: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  status: WeekStatus;
  source: WeekSource;
  summary: string;
  roadmapNarrative: string;
  nextWeekPreview: string[];
  budgetMinutes: number;
  plannedMinutes: number;
  items: WeekItemView[];
  /** How wide the library is behind this week: "204 lessons unlocked". */
  libraryLessonCount: number;
  /** True once every Do-it-now and Must-know item is done — the gate on "plan my next week". */
  readyForNextWeek: boolean;
  generatedAt: number;
}

export interface WeekHistoryEntry {
  id: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  status: WeekStatus;
  doneCount: number;
  totalCount: number;
}

export interface WeekResponse {
  week: WeekView | null;
  history: WeekHistoryEntry[];
  /** Set when there is no week and none can be built yet, e.g. nothing is unlocked. */
  reason: string | null;
}


// ---------------------------------------------------------------------------
// Admin edits
// ---------------------------------------------------------------------------

export const moveItemRequestSchema = z.object({
  lane: planLaneSchema.optional(),
  /** Pinning forces an item into Do it now and keeps it there through a regeneration. */
  pinned: z.boolean().optional(),
});
export type MoveItemRequest = z.infer<typeof moveItemRequestSchema>;

export const regenerateWeekRequestSchema = z.object({
  /** Skip the model and rebuild from the rules alone. Fast, free, and sometimes what you want. */
  rulesOnly: z.boolean().default(false),
  /** Start a new week rather than reshaping the current one. */
  advance: z.boolean().default(false),
});
export type RegenerateWeekRequest = z.infer<typeof regenerateWeekRequestSchema>;

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

const DAY_MS = 86_400_000;


/**
 * When a week starting now begins.
 *
 * Today by default: somebody who finishes their assessment on a Wednesday should not wait until
 * Monday to be given something to do. `weekStartsMonday` moves it back to the Monday of the
 * current week for teams that want everyone's week aligned.
 */
export function weekStart(nowMs: number, startsMonday: boolean): number {
  const midnight = Math.floor(nowMs / DAY_MS) * DAY_MS;
  if (!startsMonday) return midnight;
  const dow = new Date(midnight).getUTCDay(); // 0 = Sunday
  const back = (dow + 6) % 7; // Monday = 0
  return midnight - back * DAY_MS;
}

export function weekEnd(startMs: number): number {
  return startMs + (WEEK_LENGTH_DAYS - 1) * DAY_MS;
}

