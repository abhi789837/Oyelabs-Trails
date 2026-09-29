import { z } from "zod";

import { skillWeightSchema, type SkillWeight } from "./builder";

/**
 * What a learner is being trained *for*, as an ordered list rather than a set.
 *
 * `learner_priorities.mustHave` already held weighted skills, and this replaces it for one reason:
 * an admin's priorities have an order inside a weight. "Docker deployment" and "Testing with Jest"
 * can both be High and still not be equally urgent, and a `{skill, weight}[]` with no position could
 * not say so — every read re-sorted it by weight and threw the rest away.
 *
 * These drive three things, and each one enforces the ordering in code rather than in a prompt:
 *
 * - the **assessment** weights its question budget by priority and asks High first;
 * - the **course builder** handles High targets before anything else;
 * - the **weekly plan** fills "Do it now" from High targets first.
 */

// ---------------------------------------------------------------------------
// Tracks and stacks
// ---------------------------------------------------------------------------

/**
 * The seven tracks an admin may put somebody on.
 *
 * Deliberately *not* `TRACK_IDS` from `enums.ts`. Those are curriculum trails — what content exists —
 * and this is a statement about a person's job. They overlap heavily and they are not the same list:
 * there is an `ai-driven` trail but nobody is hired as an "AI-driven developer", and "AI/ML" is a
 * real role with no trail behind it yet. Tying them together would mean adding a trail every time
 * somebody was hired into a new kind of role.
 */
export const learnerTrackSchema = z.enum([
  "frontend",
  "backend",
  "fullstack",
  "mobile",
  "devops",
  "ai-ml",
  "other",
]);
export type LearnerTrack = z.infer<typeof learnerTrackSchema>;

export const LEARNER_TRACK_LABELS: Record<LearnerTrack, string> = {
  frontend: "Frontend",
  backend: "Backend",
  fullstack: "Full-Stack",
  mobile: "Mobile",
  devops: "DevOps",
  "ai-ml": "AI / ML",
  other: "Other",
};

/**
 * The stack, as free text: "React + Next.js", "PHP + Laravel".
 *
 * Free text rather than a list, because this is the field that makes everything downstream specific.
 * "AI-driven development" as a course is useless; "prompting for a Laravel controller with
 * validation" is not, and the difference between them is this string. A dropdown would have to be
 * maintained forever and would still be wrong for the next hire.
 */
export const stackSchema = z.string().trim().min(2).max(120);

// ---------------------------------------------------------------------------
// Targets
// ---------------------------------------------------------------------------

/** Priorities reuse the builder's High/Medium/Low, so one weight means one thing everywhere. */
export const targetPrioritySchema = skillWeightSchema;
export type TargetPriority = SkillWeight;

export const PRIORITY_LABELS: Record<TargetPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

/** Display and processing order. Everything that walks targets walks them in this order. */
export const PRIORITY_ORDER = ["high", "medium", "low"] as const satisfies readonly TargetPriority[];

export const learnerTargetSchema = z.object({
  /** Stable across an edit, so reordering does not look like a delete and an insert. */
  id: z.string().trim().min(1).max(64).optional(),
  skill: z.string().trim().min(2).max(80),
  priority: targetPrioritySchema,
  /** Rank *within* a priority. Two High targets are not equally urgent. */
  position: z.number().int().min(0).max(200).default(0),
  /** `yyyy-mm-dd`. Optional: most targets are "soon", not "by the 14th". */
  targetDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a yyyy-mm-dd date")
    .nullable()
    .default(null),
});
export type LearnerTarget = z.infer<typeof learnerTargetSchema>;

export const MAX_TARGETS = 20;

export const learnerTargetsSchema = z.array(learnerTargetSchema).max(MAX_TARGETS);

/**
 * The question budget, by priority.
 *
 * Half the target questions go to High, and that is the number the whole assessment redesign turns
 * on: an assessment that spreads itself evenly across everything the admin listed tells you the
 * least about the thing they said mattered most.
 *
 * Applied to the *target* sections only. The current-track basics section is always asked and is not
 * drawn from this budget — you cannot weight your way out of the fundamentals of your own job.
 */
export const PRIORITY_BUDGET: Record<TargetPriority, number> = { high: 0.5, medium: 0.3, low: 0.2 };

/**
 * Splits a question budget across the targets that exist, in priority order.
 *
 * Two rules that are not arithmetic:
 *
 * - **A priority with no targets gives its share away** rather than wasting it. An admin who listed
 *   only High targets should get a whole assessment about them, not half of one.
 * - **Every listed target gets at least one question.** A Low target with a 0.2 share of a small
 *   budget rounds to zero, and "we asked you nothing about the thing we wrote down" is a worse
 *   answer than one question.
 *
 * Returns questions per target, keyed by index into the input.
 */
export function splitBudget(targets: readonly LearnerTarget[], total: number): number[] {
  if (targets.length === 0 || total <= 0) return targets.map(() => 0);
  if (total <= targets.length) {
    // Not enough to go round: the highest priorities get the one question each that exists.
    const order = rankTargets(targets);
    const counts = targets.map(() => 0);
    for (let i = 0; i < total; i++) counts[order[i]] = 1;
    return counts;
  }

  const present = PRIORITY_ORDER.filter((priority) => targets.some((target) => target.priority === priority));
  const weight = present.reduce((sum, priority) => sum + PRIORITY_BUDGET[priority], 0);

  const counts = targets.map(() => 1); // The floor: everybody listed gets asked something.
  let left = total - targets.length;

  for (const priority of present) {
    const group = targets.map((target, index) => ({ target, index })).filter((entry) => entry.target.priority === priority);
    const share = Math.round((PRIORITY_BUDGET[priority] / weight) * (total - targets.length));
    let remaining = Math.min(share, left);

    /* Spread within the group by position, so the first High target gets the extra question when a
       share does not divide evenly — which is what "drag to reorder within a priority" is for. */
    const ordered = [...group].sort((a, b) => a.target.position - b.target.position);
    let cursor = 0;
    while (remaining > 0 && ordered.length > 0) {
      counts[ordered[cursor % ordered.length].index] += 1;
      cursor += 1;
      remaining -= 1;
      left -= 1;
    }
  }

  return counts;
}

/** Indices into `targets`, ordered High-first and then by position. The canonical ordering. */
export function rankTargets(targets: readonly LearnerTarget[]): number[] {
  return targets
    .map((target, index) => ({ target, index }))
    .sort((a, b) => {
      const byPriority = PRIORITY_ORDER.indexOf(a.target.priority) - PRIORITY_ORDER.indexOf(b.target.priority);
      if (byPriority !== 0) return byPriority;
      if (a.target.position !== b.target.position) return a.target.position - b.target.position;
      return a.target.skill.localeCompare(b.target.skill);
    })
    .map((entry) => entry.index);
}

/** Targets in the order everything downstream should process them. */
export function orderedTargets(targets: readonly LearnerTarget[]): LearnerTarget[] {
  return rankTargets(targets).map((index) => targets[index]);
}

// ---------------------------------------------------------------------------
// The request the onboarding form sends
// ---------------------------------------------------------------------------

export const targetsRequestSchema = z.object({
  track: learnerTrackSchema,
  stack: stackSchema,
  yearsExperience: z.number().min(0).max(60).nullable().default(null),
  /** The admin's read of where they are, 1–5, before any testing. */
  selfLevel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).nullable().default(null),
  targets: learnerTargetsSchema,
  skip: z.array(z.string().trim().min(2).max(80)).max(20).default([]),
  hoursPerWeek: z.number().int().min(1).max(60).default(15),
});
export type TargetsRequest = z.infer<typeof targetsRequestSchema>;
