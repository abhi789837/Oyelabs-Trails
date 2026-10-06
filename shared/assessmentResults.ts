import type { MasteryView, MetGoalView, MissingLinkView } from "./assessmentV4";

/**
 * v5 results (Phase 5): `GET /api/v5/assessment/results`.
 *
 * Everything the results screen needs in one read: the evaluation (levels, mastery, missing links),
 * the goals with their skills, the first steps of the path with their reasons, and, once results
 * are out and the admin setting allows it, the learner's own questions to look back over.
 */

export const SHOW_ITEMS_AFTER_KEY = "assessment.show_items_after";

export type ReviewVerdict = "full" | "not_yet" | "waiting";

export interface ReviewItem {
  id: string;
  number: number;
  skillName: string;
  type: "coding" | "mcq" | "task";
  /** "Multiple choice", "Coding", "Speak", "Write", ... */
  kindLabel: string;
  prompt: string;
  /** Multiple choice only. */
  options: string[] | null;
  chosen: number | null;
  correct: number | null;
  /** Their code or written answer (typed instead of spoken included). */
  answerText: string | null;
  /** True when a spoken answer was recorded (the recording itself is never sent back). */
  recorded: boolean;
  unknown: boolean;
  unanswered: boolean;
  verdict: ReviewVerdict;
  /** Why: the option explanation, the grader's reason, or "N of M checks passed". */
  explanation: string | null;
  tip: string | null;
  reviewStatus: "requested" | "upheld" | "overridden" | null;
  /** Not yet, answered (not "I don't know yet"), and no review asked for yet. */
  canRequestReview: boolean;
}

export interface GoalLevels {
  id: string;
  title: string;
  targetLevel: number;
  achieved: boolean;
  skills: { skillId: string; name: string; level: number | null; source: "measured" | "inferred" | null }[];
}

export interface FirstStep {
  title: string;
  reason: string;
  href: string | null;
}

export interface AssessmentResultsResponse {
  assessment: {
    id: string;
    label: string | null;
    status: string;
    submittedAt: number | null;
    finishedSeconds: number | null;
    estSeconds: number | null;
  } | null;
  /** Completed and evaluated. Nothing below is filled until then. */
  released: boolean;
  result: {
    skills: { skillId: string; skillName: string; level: number | null; asked: number; priority: "high" | "medium" | "low" | null }[];
    strengths: string[];
    focusFirst: string[];
    mastery: MasteryView[];
    missingLinks: MissingLinkView[];
    metGoals: MetGoalView[];
  } | null;
  goals: GoalLevels[];
  firstSteps: FirstStep[];
  /** Null when hidden (the admin turned it off, or results aren't out). */
  items: ReviewItem[] | null;
  itemsHidden: boolean;
}

export interface AssessmentReviewSetting {
  showItemsAfter: boolean;
}
