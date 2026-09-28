import { MATCH_CONFIDENCE_THRESHOLD, MIN_CRITERION, REVIEW_PASS_SCORE } from "../../../../shared/builder";
import type { VerifiedSource } from "../../builder/research";

/**
 * Prompts for the course builder, versioned.
 *
 * `PROMPT_VERSION` is stored on every `ai_audit_log` row and on every generated course. When a
 * course turns out badly six weeks from now, the first question is "which prompt wrote this?", and
 * without the version the answer is a guess. Bump it whenever the wording changes in a way that
 * could change output.
 */
export const PROMPT_VERSION = "course-builder/1";

/** Repeated in every prompt here, because it is the rule the whole feature rests on. */
const SOURCE_RULE = `You must never invent a URL. You do not have web access. When you are given a list of
sources, you may cite those and nothing else — not a URL you remember, not a URL you think is likely
to exist, not a "typical" documentation link. A citation that is not in the provided list is a
failure, not a best effort.`;

// ---------------------------------------------------------------------------
// 1. Gap analysis
// ---------------------------------------------------------------------------

export const GAP_SYSTEM = `You read a finished placement assessment and say what the learner cannot yet do.

Rules:
- Report skills, not topics. "Deploying a PHP app to shared hosting" is a skill; "Chapter 4" is not.
- severity is 0 to 1: how badly the skill is missing, judged from what they got wrong and how. A
  wrong answer on a hard question is weaker evidence than a wrong answer on an easy one.
- roleRelevance is 0 to 1: how much the stated target role needs this skill. A backend role does not
  need CSS grid, however badly they did on it.
- evidence.summary is written **for the learner**, in the second person, in one or two plain
  sentences that say what they missed. No scores, no jargon, no blame. It is shown to them as the
  reason a course was added, so it must be something a person would be content to read.
- Prefer a few real gaps over a long list. A gap that produces a course nobody needed costs the
  learner hours.`;

export function buildGapUser(input: {
  targetRole: string;
  adminNotes: string;
  mustHave: { skill: string; weight: string }[];
  overallLevel: number;
  areas: { area: string; level: number; gaps: string[]; strengths: string[] }[];
  items: { id: string; area: string; difficulty: number; correct: boolean | null; timeMs: number | null }[];
}): string {
  const items = input.items
    .map(
      (item) =>
        `- ${item.id} · ${item.area} · difficulty ${item.difficulty}/5 · ${
          item.correct === null ? "not graded" : item.correct ? "correct" : "WRONG"
        }${item.timeMs === null ? "" : ` · ${Math.round(item.timeMs / 1000)}s`}`,
    )
    .join("\n");

  const areas = input.areas
    .map(
      (area) =>
        `- ${area.area}: level ${area.level}/5. Gaps: ${area.gaps.join("; ") || "none noted"}. Strengths: ${
          area.strengths.join("; ") || "none noted"
        }`,
    )
    .join("\n");

  return `## The role they are being trained for

${input.targetRole || "Not stated."}

## What their administrator knows about them

${input.adminNotes || "Nothing recorded."}

## Skills their administrator marked as must-have

${input.mustHave.map((entry) => `- ${entry.skill} (${entry.weight} priority)`).join("\n") || "- none"}

## How the assessment graded them

Overall level ${input.overallLevel}/5.

${areas}

## Every item they were served

${items}

Return the skills they are missing.`;
}

// ---------------------------------------------------------------------------
// 2. Matching an existing course
// ---------------------------------------------------------------------------

export const MATCH_SYSTEM = `You decide whether an existing course already teaches a skill.

You are given one skill and a list of candidate courses with their titles, summaries and lesson
titles. Pick the one that genuinely teaches that skill, or none.

- confidence is 0 to 1. Return the course id only when you are at or above ${MATCH_CONFIDENCE_THRESHOLD}.
- A course that mentions the skill in passing does not teach it. A course on "Laravel" does not
  teach "deploying to cPanel" just because both involve PHP.
- Returning null is the right answer far more often than it feels like. A wrong match means the
  learner is sent to a course that does not cover what they are missing, and nobody finds out.`;

export function buildMatchUser(skill: string, candidates: { id: string; title: string; summary: string; topics: string[] }[]): string {
  const list = candidates
    .map((course) => `### ${course.id}\n${course.title}\n${course.summary}\nLessons: ${course.topics.join("; ")}`)
    .join("\n\n");
  return `## The skill\n\n${skill}\n\n## Candidate courses\n\n${list || "(none)"}`;
}

// ---------------------------------------------------------------------------
// 3. Planning a course
// ---------------------------------------------------------------------------

export const PLAN_SYSTEM = `You outline a practical course that closes one specific skill gap for one engineer.

${SOURCE_RULE}

At this stage you produce an outline and the **search queries** that should back each lesson. You do
not write the lessons and you do not cite anything yet.

Rules:
- Pitch it at a working engineer: someone with 1 to 10 years of experience who can already program,
  and who needs this specific thing rather than an introduction to computing.
- 2 to 5 sections, 2 to 6 lessons each. A lesson is one sitting.
- Every lesson has one objective, phrased as something they will be able to *do*.
- searchQueries are what you would type into a search engine to find the best current material for
  that lesson. Be specific: "deploy Laravel app cPanel Setup Node.js App" beats "cPanel tutorial".
- videoQuery is a separate, shorter query aimed at finding one good explainer video.
- Cover the practical path end to end, including the boring parts people actually get stuck on —
  permissions, paths, environment variables, logs.`;

export function buildPlanUser(input: { skill: string; targetRole: string; evidence: string; level: number }): string {
  return `## The skill to teach

${input.skill}

## Why it is being taught

${input.evidence}

## Who it is for

Target role: ${input.targetRole || "not stated"}. The assessment put them at level ${input.level}/5 overall.

Outline the course.`;
}

// ---------------------------------------------------------------------------
// 4. Writing a lesson
// ---------------------------------------------------------------------------

export const WRITE_SYSTEM = `You write one lesson of a technical course from sources that have already been fetched and checked.

${SOURCE_RULE}

You are given the verified sources below. Cite three or more of them in \`references\`, using their
URLs **exactly as given**. If the list has fewer than three, cite all of them — do not pad the list
with anything else.

Rules:
- summary: explain the thing itself, at senior-engineer depth. Why it works this way, what the
  trade-offs are, and the mistake people actually make. Not a summary of the sources.
- keyConcepts: the handful of terms someone must hold in their head afterwards.
- references: each with one line on why that source in particular is worth opening.
- practice: something they do on a real machine, with acceptance criteria they can check themselves.
- test: 10 or more questions, mixing mcq, multi and scenario. Every question carries an explanation
  and names the objective it tests. correctIndices is always a list, even for a single answer.
- Questions must test understanding, not recall of the lesson's wording. A question answerable by
  Ctrl-F on the summary is a wasted question.`;

export function buildWriteUser(input: {
  courseTitle: string;
  sectionTitle: string;
  topicTitle: string;
  objective: string;
  sources: VerifiedSource[];
  videoId: string | null;
  videoTitle: string | null;
}): string {
  const sources = input.sources
    .map((source, index) => `${index + 1}. ${source.url}\n   Title: ${source.title}\n   Extract: ${source.snippet}`)
    .join("\n\n");

  const video = input.videoId
    ? `A video has already been chosen and verified for this lesson: ${input.videoId} ("${input.videoTitle ?? "untitled"}"). Return exactly that id in videoId.`
    : `No usable video was found for this lesson. Return null for videoId. Do not invent one.`;

  return `## Course

${input.courseTitle}

## Section

${input.sectionTitle}

## This lesson

${input.topicTitle}

Objective: ${input.objective}

## Verified sources — the only URLs you may cite

${sources || "(none survived verification)"}

## Video

${video}

Write the lesson.`;
}

// ---------------------------------------------------------------------------
// 5. Review
// ---------------------------------------------------------------------------

export const REVIEW_SYSTEM = `You review a generated course against a rubric, as a senior engineer who would have to defend it.

Score each criterion 1 to 5:
- accuracy: is it correct? A confidently wrong sentence is a 1, whatever else is good.
- depth: is it pitched at an engineer with 1 to 10 years of experience, rather than a beginner?
- gapCoverage: does it actually close the stated skill gap, end to end?
- linkQuality: are the references worth opening, and do they support what the lesson claims?
- testQuality: do the questions test understanding rather than recall? Are the answers right?
- noFiller: is there padding, repetition, or a lesson that says nothing?

A course passes at ${REVIEW_PASS_SCORE} overall with no criterion below ${MIN_CRITERION}. Be
willing to fail one. Listing a weak lesson in weakTopics costs one regeneration; passing a bad
course costs a person their time.`;

export function buildReviewUser(input: {
  skill: string;
  courseTitle: string;
  topics: { title: string; objective: string; summary: string; references: string[]; questionCount: number }[];
}): string {
  const topics = input.topics
    .map(
      (topic) =>
        `### ${topic.title}\nObjective: ${topic.objective}\nReferences: ${topic.references.join(", ")}\nQuestions: ${
          topic.questionCount
        }\n\n${topic.summary}`,
    )
    .join("\n\n---\n\n");

  return `## The gap this course is meant to close\n\n${input.skill}\n\n## The course: ${input.courseTitle}\n\n${topics}`;
}
