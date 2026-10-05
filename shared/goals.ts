import { z } from "zod";

/**
 * v4.3: what an admin wants a learner to be able to do.
 *
 * A goal is one of three things, mixed freely in the "What should they be able to do?" box:
 * - `skill`: a catalog skill ("Git").
 * - `case`: a practical outcome from the department library ("Resolve a merge conflict and open a
 *   clean PR").
 * - `text`: a free-text line the AI turned into an outcome statement, skills and a target level.
 *
 * Every goal has the same 5-stop slider as a skill priority. The skill priorities that drive the
 * assessment and the path are derived from the goals (see server/src/goals/).
 */

export const GOAL_TYPES = ["skill", "case", "text"] as const;
export const goalTypeSchema = z.enum(GOAL_TYPES);
export type GoalType = z.infer<typeof goalTypeSchema>;

/** Mastery scale shared by goals, outcomes and the evaluation: 0 = none … 5 = can teach it. */
export const targetLevelSchema = z.number().int().min(1).max(5);

const text = (max: number) => z.string().trim().min(1).max(max);

/**
 * The practice task that proves an outcome. Either a task (any `taskSchema` kind from
 * shared/tasks.ts, including the v4.3 `terminal` kind) or an existing course topic whose practice or
 * code challenge already proves it. Passing the capstone marks the goal achieved.
 */
export const capstoneSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("task"), title: text(120), task: z.record(z.string(), z.unknown()) }),
  z.object({ kind: z.literal("topic"), title: text(120), topicId: text(120) }),
]);
export type Capstone = z.infer<typeof capstoneSchema>;

/**
 * One entry of a department's practical-outcomes library.
 *
 * `statement` is a "can do" statement that starts with "Can" and uses an observable verb
 * (resolve, build, deploy, run, classify, write…), never "understand" or "know".
 */
export const practicalOutcomeSeedSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(80),
  departmentId: text(40),
  title: text(120),
  statement: text(300),
  skillIds: z.array(text(80)).min(1).max(6),
  level: targetLevelSchema,
  aliases: z.array(text(60)).max(10).default([]),
  capstone: capstoneSchema,
});
export type PracticalOutcomeSeed = z.infer<typeof practicalOutcomeSeedSchema>;

export interface PracticalOutcome extends PracticalOutcomeSeed {
  status: "active" | "archived";
  position: number;
}

/** What the AI made of a free-text goal. The admin sees it as a chip and can accept or edit it. */
export const goalInterpretationSchema = z.object({
  outcome: text(300),
  skillIds: z.array(text(80)).min(1).max(6),
  targetLevel: targetLevelSchema,
  /** The closest library case, when one is a good match. */
  caseId: z.string().max(80).nullable().default(null),
});
export type GoalInterpretation = z.infer<typeof goalInterpretationSchema>;

/** v4.4: a goal may link this many skills (raised from 6 for skill-group goals). */
export const MAX_GOAL_SKILLS = 12;

export const goalInputSchema = z.object({
  /** Present when editing an existing goal. */
  id: z.string().max(40).optional(),
  type: goalTypeSchema,
  originalText: text(300),
  outcome: text(300),
  /** v4.4: up to 12 (a skill group such as the ten soft skills is one goal). */
  skillIds: z.array(text(80)).min(1).max(MAX_GOAL_SKILLS),
  targetLevel: targetLevelSchema,
  caseId: z.string().max(80).nullable().default(null),
  slider: z.number().int().min(1).max(5),
  /** v4.4: the description intent (shared/intents.ts) this goal was built from. */
  intentId: z.string().max(16).nullable().optional(),
});
export type GoalInput = z.infer<typeof goalInputSchema>;

export interface LearnerGoal extends GoalInput {
  id: string;
  position: number;
  status: "active" | "achieved";
  achievedAt: number | null;
  source: "admin" | "suggested" | "auto";
}

export interface GoalSuggestion {
  id: string;
  kind: "next-level" | "gap" | "progression";
  title: string;
  outcome: string;
  skillIds: string[];
  targetLevel: number;
  caseId: string | null;
  reason: string;
  status: "open" | "added" | "dismissed";
  createdAt: number;
}

// ---------------------------------------------------------------------------
// v4.3 Phase 1: derivation, requests and views
// ---------------------------------------------------------------------------

export const MAX_GOALS = 40;

export const TARGET_LEVEL_LABELS: Record<number, string> = {
  1: "Beginner",
  2: "Basic",
  3: "Intermediate",
  4: "Advanced",
  5: "Expert",
};

/**
 * D2: the skill priorities, derived from the goals. Each linked skill takes the highest slider of
 * any goal that links it; the order is goal order, then skill order inside the goal. Pure, so the
 * Setup screen's live summary and the server agree.
 */
export function deriveSkillPriorities(goals: readonly { skillIds: readonly string[]; slider: number }[]): { skillId: string; slider: number }[] {
  const out = new Map<string, number>();
  for (const goal of goals) {
    for (const skillId of goal.skillIds) out.set(skillId, Math.max(out.get(skillId) ?? 0, goal.slider));
  }
  return [...out].map(([skillId, slider]) => ({ skillId, slider }));
}

/** Same skills at the same level: the duplicate test for suggestions. */
export function goalKey(skillIds: readonly string[], targetLevel: number): string {
  return `${[...new Set(skillIds)].sort().join("+")}@${targetLevel}`;
}

/** "Can resolve a merge conflict" from "resolve a merge conflict"; already-"Can" text is kept. */
export function asOutcome(text: string): string {
  const t = text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.]+$/, "")
    // "should be able to fix…", "they must be able to fix…", "needs to fix…" read as "Can fix…".
    .replace(/^(?:(?:he|she|they|the learner|this person)\s+)?(?:(?:should|must|will|needs? to|has to|have to)\s+)?(?:be\s+)?able\s+to\s+/i, "")
    .replace(/^(?:(?:he|she|they|the learner|this person)\s+)?(?:should|must|needs? to|has to|have to)\s+/i, "");
  if (!t) return t;
  if (/^can\b/i.test(t)) return `${t.charAt(0).toUpperCase()}${t.slice(1)}.`.slice(0, 300);
  return `Can ${t.charAt(0).toLowerCase()}${t.slice(1)}.`.slice(0, 300);
}

export const saveGoalsRequestSchema = z.object({ goals: z.array(goalInputSchema).max(MAX_GOALS) });

export const onboardSuggestRequestSchema = z.object({
  departmentId: text(48),
  description: z.string().trim().min(3).max(600),
  name: z.string().trim().max(120).optional(),
});

export const goalInterpretRequestSchema = z.object({
  departmentId: text(48),
  text: text(300),
});

/** A goal the system proposes; the admin adds it with one click. */
export type SuggestedGoal = Omit<GoalInput, "id"> & { reason: string };

/** Quick onboarding's Suggest: everything the full Setup screen needs, pre-filled. */
export interface OnboardSuggestion {
  departmentId: string;
  trackId: string | null;
  stackIds: string[];
  experienceBand: import("./setup").ExperienceBand | null;
  level: number | null;
  hoursPerWeek: number;
  /** v4.4: from a constraint intent ("in 3 months"), else null. */
  deadlineWeeks?: number | null;
  /** Ranked, highest slider first. */
  goals: GoalInput[];
  /** "Suggested for a Frontend dev with your description": each with + Add. */
  extras: SuggestedGoal[];
  source: "ai" | "rules";
  /** v4.4: every intent read from the description, each quoting its exact phrase. */
  intents: import("./intents").Intent[];
  /** v4.4: phrases nothing covered: Save stays blocked until each is answered. */
  unsure: import("./intents").Unsure[];
}

export interface GoalInterpretResult {
  interpretation: GoalInterpretation | null;
  source: "ai" | "rules";
  /** Set when nothing could be linked: the admin picks skills by hand. */
  message?: string;
}

/** One library case, as the goal box's picker lists it. */
export interface OutcomeOption {
  id: string;
  title: string;
  statement: string;
  skillIds: string[];
  level: number;
  aliases: string[];
  capstoneTitle: string;
}

/** v4.3: a goal's capstone as the admin's goal list shows it. */
export interface CapstoneSummary {
  title: string;
  kind: "task" | "topic";
  /** The task kind ("terminal", "roleplay"…), null for a topic capstone. */
  taskKind: string | null;
  /** Code cannot grade it (a role-play, a written answer, a form): the admin marks it achieved. */
  manual: boolean;
}

/** What the learner sees of a goal: the outcome, whether it is achieved, and how to prove it. */
export interface LearnerGoalView {
  id: string;
  outcome: string;
  skillIds: string[];
  skillNames: string[];
  targetLevel: number;
  status: "active" | "achieved";
  achievedAt: number | null;
  capstone: { kind: "task" | "topic"; title: string; topicId: string | null } | null;
}
