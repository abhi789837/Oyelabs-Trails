import type { EvaluationResult } from "../../../shared/assessment";
import type { LearnerPriorities, ScoredGap } from "../../../shared/builder";
import { LEARNER_TRACK_LABELS, type LearnerTrack } from "../../../shared/targets";

/**
 * The learner's path, in parts.
 *
 * Before this, a path was a flat list of courses ordered by gap score. That is a reasonable answer
 * to "what is missing" and a poor answer to "what should I do", because it opens wherever the
 * biggest number happens to be — which for a backend engineer with a Docker gap is Docker, before
 * anything has shored up the backend work they do every day.
 *
 * So the first two parts are fixed, and the order is enforced here rather than asked for in a
 * prompt:
 *
 * - **Part 1 — strengthen your current track.** Built from the gaps in *their own* stack. Three to
 *   six hours. Not a re-teach of the track: only the things the assessment actually found.
 * - **Part 2 — AI-driven development for that stack.** Three to five hours, and specific: not
 *   "prompting" but "prompting for a Laravel controller with validation". The stack string from
 *   onboarding is what makes that possible, which is most of why it is a required field.
 * - **Part 3 onward — everything else**, by the admin's priority and then by gap severity.
 *
 * Parts 1 and 2 go into week one's "Do it now" lane. They are the ground the rest stands on.
 */

export type PartType = "track" | "ai_dev" | "general";

export interface PlannedPart {
  /** 1-based, and contiguous. Part 1 is always `track`, part 2 always `ai_dev`. */
  partNumber: number;
  type: PartType;
  /**
   * What to build. Parts 1 and 2 are synthesised from the learner's own track and stack rather
   * than detected, because neither is something an assessment reports as a "gap" — the first is a
   * reading of several gaps at once, and the second is not tested at all.
   */
  gap: ScoredGap;
}

export interface PartsInput {
  track: LearnerTrack | null;
  stack: string | null;
  /** Already scored and sorted: admin-listed first, then by score. */
  gaps: readonly ScoredGap[];
  priorities: LearnerPriorities;
  evaluation: EvaluationResult | null;
  /** How many courses this run may produce in total, parts 1 and 2 included. */
  courseCap: number;
}

/** A track's fundamentals, in the words somebody would use for them. */
const TRACK_FOUNDATIONS: Record<LearnerTrack, string> = {
  frontend: "state management, rendering performance, accessibility and component testing",
  backend: "database indexing, authentication, error handling and API design",
  fullstack: "API contracts between front and back, auth end to end, and deployment",
  mobile: "navigation, offline state, platform differences and release builds",
  devops: "pipelines, container images, secrets handling and observability",
  "ai-ml": "data handling, evaluation, prompt and model selection, and cost",
  other: "the fundamentals of the stack they work in",
};

/**
 * Builds the ordered parts.
 *
 * The two fixed parts are produced whether or not the assessment found anything specific to hang
 * them on. That is deliberate: "we did not detect a gap in your own track" is usually a statement
 * about what the test asked rather than about the person, and Part 2 is about how somebody works,
 * which no placement test measures at all.
 */
export function planParts(input: PartsInput): PlannedPart[] {
  const parts: PlannedPart[] = [];
  const actionable = input.gaps.filter((gap) => !gap.skipped);

  parts.push({ partNumber: 1, type: "track", gap: trackPart(input, actionable) });
  parts.push({ partNumber: 2, type: "ai_dev", gap: aiDevPart(input) });

  /* Everything the two fixed parts already cover is dropped, so the learner does not get a Docker
     course in Part 3 that Part 1 just taught them. Matched on the skill name, loosely, the same way
     `scoring.ts` matches an admin's entry against a detected gap. */
  const claimed = new Set([...trackSkills(actionable, input), ...[aiDevSkill(input)]].map(normalise));

  for (const gap of actionable) {
    if (parts.length >= Math.max(2, input.courseCap)) break;
    if (claimed.has(normalise(gap.skill))) continue;
    parts.push({ partNumber: parts.length + 1, type: "general", gap });
  }

  return parts;
}

/**
 * Part 1's subject: the weak links in the learner's own track.
 *
 * Assembled from the gaps that are actually about their track, with the track's own fundamentals as
 * the fallback when the assessment found nothing there. The evidence sentence is the learner-facing
 * "why", so it is written from what happened rather than from a template where one exists.
 */
function trackPart(input: PartsInput, gaps: readonly ScoredGap[]): ScoredGap {
  const track = input.track ?? "other";
  const label = LEARNER_TRACK_LABELS[track];
  const relevant = trackSkills(gaps, input);

  const weakAreas = (input.evaluation?.areas ?? [])
    .filter((area) => area.level <= 3)
    .sort((a, b) => a.level - b.level)
    .slice(0, 3)
    .map((area) => area.area);

  const subject = relevant.length > 0 ? relevant.slice(0, 3).join(", ") : TRACK_FOUNDATIONS[track];

  const summary =
    weakAreas.length > 0
      ? `Your assessment was strongest elsewhere and thinnest on ${weakAreas.join(", ")}. This shores up the ${label.toLowerCase()} work you do every day before anything new is added on top.`
      : `A short course on the parts of your own ${label.toLowerCase()} work worth being solid on: ${subject}.`;

  return {
    skill: `${label} foundations: ${subject}`,
    severity: 0.7,
    roleRelevance: 1,
    weight: 1,
    source: "admin_priority",
    priorityScore: 0.7,
    evidence: { summary, itemIds: [], missed: 0, asked: 0 },
    skipped: false,
  };
}

/** Part 2's subject. Named for the stack, because that is the whole point of it. */
function aiDevPart(input: PartsInput): ScoredGap {
  const stack = input.stack?.trim() || LEARNER_TRACK_LABELS[input.track ?? "other"];

  return {
    skill: aiDevSkill(input),
    severity: 0.6,
    roleRelevance: 1,
    weight: 1,
    source: "admin_priority",
    priorityScore: 0.6,
    evidence: {
      summary: `How to build with AI in ${stack} specifically — writing prompts that carry the right context, planning before generating, reviewing and testing what comes back, keeping a codebase coherent across many small changes, and knowing when not to use it.`,
      itemIds: [],
      missed: 0,
      asked: 0,
    },
    skipped: false,
  };
}

function aiDevSkill(input: PartsInput): string {
  const stack = input.stack?.trim() || LEARNER_TRACK_LABELS[input.track ?? "other"];
  return `AI-driven development with ${stack}`;
}

/**
 * Which of the detected gaps are about the learner's own track.
 *
 * Deliberately generous. A gap that is arguably about their track belongs in Part 1, where it is
 * covered early, rather than in Part 5 — and the cost of being wrong in that direction is a slightly
 * broader Part 1, while the cost of being wrong the other way is the thing this whole ordering
 * exists to prevent.
 */
function trackSkills(gaps: readonly ScoredGap[], input: PartsInput): string[] {
  const track = input.track ?? "other";
  const stackWords = (input.stack ?? "")
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((word) => word.length >= 2);
  const trackWords = [track.replace("-", " "), LEARNER_TRACK_LABELS[track].toLowerCase()];
  const foundationWords = TRACK_FOUNDATIONS[track].toLowerCase().split(/[^a-z]+/).filter((w) => w.length >= 4);

  return gaps
    .filter((gap) => {
      const skill = gap.skill.toLowerCase();
      return (
        stackWords.some((word) => skill.includes(word)) ||
        trackWords.some((word) => skill.includes(word)) ||
        foundationWords.some((word) => skill.includes(word))
      );
    })
    .map((gap) => gap.skill);
}

function normalise(skill: string): string {
  return skill.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Checks the promise the ordering makes.
 *
 * Exported so the run can assert it after the fact rather than trusting the loop above — the same
 * split the weekly plan uses. A function that tries to produce the right order, and a check that it
 * did.
 */
export function assertPartOrder(parts: readonly PlannedPart[]): string[] {
  const problems: string[] = [];
  if (parts.length === 0) return problems;

  if (parts[0]?.type !== "track") problems.push("Part 1 is not the learner's own track");
  if (parts.length > 1 && parts[1]?.type !== "ai_dev") problems.push("Part 2 is not AI-driven development");

  parts.forEach((part, index) => {
    if (part.partNumber !== index + 1) problems.push(`Part ${part.partNumber} is out of sequence at position ${index + 1}`);
  });

  const general = parts.filter((part) => part.type === "general");
  if (general.some((part) => part.partNumber <= 2)) problems.push("A general part is numbered 1 or 2");

  return problems;
}
