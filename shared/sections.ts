import { z } from "zod";

/**
 * The five parts of the assessment.
 *
 * The old assessment was one flat round-robin over three to six areas, and two complaints came out
 * of it: it was too hard, and it was impossible to tell what it was *for*. Sections answer the
 * second, and the order answers the first — you start on the fundamentals of your own job, which is
 * the ground you are most likely to be standing on.
 *
 * Sections sit **above** areas rather than replacing them. An area is still a named group of modules
 * with a difficulty staircase; a section is which part of the test that area belongs to. That keeps
 * the blueprint, the pool, the selector and the evaluation working the way they already do, and
 * makes the whole change an extra field rather than a second system.
 */

export const assessmentSectionSchema = z.enum([
  "track_basics",
  "high_targets",
  "other_targets",
  "ai_working",
  "hands_on",
]);
export type AssessmentSection = z.infer<typeof assessmentSectionSchema>;

/** The order they are asked in. Everything that walks sections walks them in this order. */
export const SECTION_ORDER = [
  "track_basics",
  "high_targets",
  "other_targets",
  "ai_working",
  "hands_on",
] as const satisfies readonly AssessmentSection[];

export interface SectionMeta {
  id: AssessmentSection;
  /** The heading on the intro screen. */
  name: string;
  /** One or two sentences, shown before the section starts. Second person, plain. */
  intro: string;
  /** Share of the whole item target. `hands_on` is counted separately — see `SECTION_ITEMS`. */
  share: number;
  /** Minutes. A section timer, not a per-question one: generous, and spendable as they like. */
  minutes: number;
}

/**
 * What each section is, and how much of the test it is.
 *
 * The shares are deliberate:
 *
 * - **Track basics is always asked and is never weighted away.** You cannot skip the fundamentals of
 *   your own job by listing enough targets.
 * - **High targets get the largest slice** of what remains, because that is what the admin said
 *   mattered. Within it, `PRIORITY_BUDGET` in `targets.ts` does the splitting.
 * - **Working with AI is scored gently** and is small. It is a picture of how somebody works today,
 *   not a gate.
 * - **Hands-on is one to three tasks**, not a share — a coding task is five to ten minutes and three
 *   of them is already a fifth of the sitting.
 */
export const SECTIONS: Record<AssessmentSection, SectionMeta> = {
  track_basics: {
    id: "track_basics",
    name: "Your current track",
    intro:
      "A few questions on the fundamentals of the stack you work in day to day. This part is always asked, whatever else is on your plan.",
    share: 0.3,
    minutes: 10,
  },
  high_targets: {
    id: "high_targets",
    name: "What you are working towards",
    intro:
      "The skills your administrator marked as the priority for you. This is the longest part, and the one that shapes your plan most.",
    share: 0.4,
    minutes: 14,
  },
  other_targets: {
    id: "other_targets",
    name: "The rest of your list",
    intro: "A lighter check on the medium and low priorities, so your plan knows roughly where you stand.",
    share: 0.2,
    minutes: 8,
  },
  ai_working: {
    id: "ai_working",
    name: "Working with AI",
    intro:
      "How you use AI tools today. There is no right answer to most of these and they are scored gently — we are looking at how you work, not testing you.",
    share: 0.1,
    minutes: 6,
  },
  hands_on: {
    id: "hands_on",
    name: "Hands-on",
    intro:
      "One to three short coding tasks, with an editor right here on the page. Five to ten minutes each. You can run your code as often as you like.",
    share: 0,
    minutes: 20,
  },
};

/** Hands-on is counted in tasks rather than as a share of the item target. */
export const HANDS_ON_TASKS = { min: 1, max: 3 } as const;

// ---------------------------------------------------------------------------
// The size of the whole thing
// ---------------------------------------------------------------------------

/**
 * About 25–35 questions and about 45 minutes.
 *
 * The old ceiling was 30 minutes for 12–20 items, which sounds gentler and was not: it made every
 * question count, so the staircase had to start near the middle and climb fast. More questions with
 * a lower starting difficulty is the shorter path to an accurate level *and* the friendlier one.
 */
export const MIN_SECTIONED_ITEMS = 25;
export const MAX_SECTIONED_ITEMS = 35;
export const TARGET_SECTIONED_ITEMS = 30;

/** Sum of the section timers, which is what the learner's overall clock is set from. */
export const TOTAL_SECTION_MINUTES = SECTION_ORDER.reduce((sum, id) => sum + SECTIONS[id].minutes, 0);

/**
 * How many items each section gets, for a given total.
 *
 * `hands_on` is taken off the top as tasks, and the rest is split by share. Every section that is
 * present gets at least one item — a section with an intro screen and nothing behind it is worse
 * than no section.
 */
export function sectionItemCounts(
  total: number,
  present: readonly AssessmentSection[],
  handsOnTasks: number,
): Record<AssessmentSection, number> {
  const counts = Object.fromEntries(SECTION_ORDER.map((id) => [id, 0])) as Record<AssessmentSection, number>;

  const questionSections = present.filter((id) => id !== "hands_on");
  if (present.includes("hands_on")) {
    counts.hands_on = Math.max(HANDS_ON_TASKS.min, Math.min(HANDS_ON_TASKS.max, handsOnTasks));
  }

  const budget = Math.max(questionSections.length, total - counts.hands_on);
  const weight = questionSections.reduce((sum, id) => sum + SECTIONS[id].share, 0);
  if (weight === 0 || questionSections.length === 0) return counts;

  let assigned = 0;
  for (const id of questionSections) {
    counts[id] = Math.max(1, Math.round((SECTIONS[id].share / weight) * budget));
    assigned += counts[id];
  }

  /* Rounding can overshoot or undershoot by one or two. Correct it against the largest section, so
     the adjustment lands where it is proportionally smallest. */
  const largest = [...questionSections].sort((a, b) => SECTIONS[b].share - SECTIONS[a].share)[0];
  counts[largest] = Math.max(1, counts[largest] + (budget - assigned));

  return counts;
}

/** Which sections a learner actually gets, given what their admin filled in. */
export function sectionsFor(input: {
  hasTrack: boolean;
  highTargets: number;
  otherTargets: number;
  handsOn: boolean;
}): AssessmentSection[] {
  /* Track basics is unconditional. Somebody with no track set still has fundamentals — the blueprint
     falls back to their assigned trails to find them — and a learner who could skip the basics of
     their own job by leaving a field blank is a hole, not a feature. */
  const present: AssessmentSection[] = ["track_basics"];
  if (input.highTargets > 0) present.push("high_targets");
  if (input.otherTargets > 0) present.push("other_targets");
  present.push("ai_working");
  if (input.handsOn) present.push("hands_on");
  return present;
}
