import type { AssessmentResultsResponse, FirstStep, ReviewItem } from "@shared/assessmentResults";
import type { MasteryView, MissingLinkView } from "@shared/assessmentV4";

/**
 * The results story: "You're strong at X. We'll start with Y because Z." (pure, tested).
 *
 * Built only from what the evaluation and the path actually say:
 * - **strong**: the evaluation's strengths; else measured skills at level 3 or more.
 * - **start**: the path's first open step; else the first "focus first" skill; else the first
 *   missing link.
 * - **because**: a missing link that names the start ("Backend needs it at level 3, and you're at
 *   1"); else the path item's own reason; else "it matters most for your goals".
 */

export interface StoryInput {
  strengths: readonly string[];
  focusFirst: readonly string[];
  mastery: readonly MasteryView[];
  missingLinks: readonly MissingLinkView[];
  firstSteps: readonly FirstStep[];
  /** Nothing scored yet (no full marks, nothing still being marked). Changes the opening line (UX review A6). */
  nothingScored?: boolean;
}

export interface Story {
  strong: string[];
  start: string | null;
  because: string | null;
  /** The sentences, ready to show. */
  sentences: string[];
}

/** "A", "A and B", "A, B and C". */
export function listWords(words: readonly string[]): string {
  if (words.length <= 1) return words[0] ?? "";
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

const lowerFirst = (s: string) => (/^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const noStop = (s: string) => s.trim().replace(/[.!\s]+$/, "");
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function mentions(a: string, b: string): boolean {
  const x = norm(a);
  const y = norm(b);
  return Boolean(x && y && (x.includes(y) || y.includes(x)));
}

export function becauseOfLink(link: MissingLinkView): string {
  const now = link.mastery ?? 0;
  const blocks = link.blocks[0];
  const forWhat = link.forGoal || blocks;
  const base = forWhat ? `${forWhat} needs it at level ${link.neededLevel}` : `you need it at level ${link.neededLevel}`;
  return `${base}, and you're at ${now} now`;
}

const nowWords = (at: string) => (/^\d\/5$/.test(at) ? `you're at level ${at.slice(0, -2)} now` : "we haven't measured yours yet");

/**
 * The path's reasons are written for staff ("Critical goal X: you're at 0/5 and it needs 3/5.").
 * On the learner's results they read as a plain clause (Phase 9.2), without the priority word or
 * the "/5" shorthand. Reasons in any other shape come back without their full stop.
 */
export function plainReason(reason: string): string {
  const r = noStop(reason);
  let m = /^[A-Z][a-z-]* goal (.+?): you're at (not measured yet|\d\/5) and it needs (\d)\/5$/.exec(r);
  if (m) return `your ${m[1]} goal needs level ${m[3]}, and ${nowWords(m[2])}`;
  m = /^Before (.+?) because \1 needs (.+?), which you're missing \((not measured yet|\d\/5); it needs (\d)\/5\)$/.exec(r);
  if (m) return `${m[1]} needs ${m[2]} first. It needs level ${m[4]}, and ${nowWords(m[3])}`;
  m = /^Moved up: (.+)$/.exec(r);
  if (m) return m[1];
  m = /^Next for your (.+?) goal, after (.+)$/.exec(r);
  if (m) return `it comes next for your ${m[1]} goal, after ${m[2]}`;
  // v4.5 P0: the natural reason forms (shared/pathReasons.ts).
  m = /^Next step towards your goal: (.+)$/.exec(r);
  if (m) return `it's the next step towards your goal: ${m[1]}`;
  m = /^[A-Z][a-z-]* goal: (.+?)\. You're at (not measured yet|\d\/5) and it needs (\d)\/5$/.exec(r);
  if (m) return `your goal (${m[1]}) needs level ${m[3]}, and ${nowWords(m[2])}`;
  m = /^Comes before your goal: (.+?)\. It needs (.+?), which you're missing \((not measured yet|\d\/5); it needs (\d)\/5\)$/.exec(r);
  if (m) return `your goal (${m[1]}) needs ${m[2]} first. It needs level ${m[4]}, and ${nowWords(m[3])}`;
  return lowerFirst(r);
}

/** The same reason as a sentence of its own, for the "Your first steps" cards. */
export function plainReasonSentence(reason: string): string {
  const clause = plainReason(reason);
  return clause ? `${clause.charAt(0).toUpperCase()}${clause.slice(1)}.` : "";
}

export function buildStory(input: StoryInput): Story {
  const strong = (input.strengths.length
    ? [...input.strengths]
    : input.mastery
        .filter((m) => m.source === "measured" && m.level >= 3)
        .sort((a, b) => b.level - a.level)
        .map((m) => m.skillName)
  ).slice(0, 2);

  const step = input.firstSteps[0] ?? null;
  const start = step?.title ?? input.focusFirst[0] ?? input.missingLinks[0]?.skillName ?? null;

  let because: string | null = null;
  if (start) {
    const link = input.missingLinks.find((l) => mentions(l.skillName, start)) ?? (step ? null : input.missingLinks[0]);
    if (link) because = becauseOfLink(link);
    else if (step?.reason && noStop(step.reason)) because = plainReason(step.reason);
    else if (input.focusFirst.length) because = "it matters most for your goals";
  }

  const sentences: string[] = [];
  sentences.push(strong.length ? `You're strong at ${listWords(strong)}.` : input.nothingScored ? "You've taken the first step." : "You've made a solid start.");
  if (start) sentences.push(because ? `We'll start with ${start} because ${because}.` : `We'll start with ${start}.`);
  else sentences.push("Your plan builds on what you already know.");
  return { strong, start, because, sentences };
}

export function storyFrom(results: AssessmentResultsResponse): Story | null {
  if (!results.result) return null;
  return buildStory({
    strengths: results.result.strengths,
    focusFirst: results.result.focusFirst,
    mastery: results.result.mastery,
    missingLinks: results.result.missingLinks,
    firstSteps: results.firstSteps,
    nothingScored: nothingScored(results),
  });
}

/** No full marks and nothing still being marked; without the answers list, every skill level is 0 or unmeasured. */
export function nothingScored(results: Pick<AssessmentResultsResponse, "items" | "result">): boolean {
  if (results.items) {
    const counts = reviewCounts(results.items);
    return results.items.length > 0 && counts.full === 0 && counts.waiting === 0;
  }
  const skills = results.result?.skills ?? [];
  return skills.length > 0 && skills.every((s) => !s.level);
}

// ---------------------------------------------------------------------------
// The answers list
// ---------------------------------------------------------------------------

export const VERDICT_WORDS: Record<ReviewItem["verdict"], string> = {
  full: "Full marks",
  not_yet: "Not yet",
  waiting: "Being marked",
};

export function reviewCounts(items: readonly ReviewItem[]): { full: number; notYet: number; waiting: number } {
  return {
    full: items.filter((i) => i.verdict === "full").length,
    notYet: items.filter((i) => i.verdict === "not_yet").length,
    waiting: items.filter((i) => i.verdict === "waiting").length,
  };
}

/** What they answered, in words, for the review list. */
export function answerWords(item: ReviewItem): string {
  if (item.unknown) return "You said \"I don't know yet\".";
  if (item.unanswered) return "No answer was given.";
  if (item.options && item.chosen !== null) return item.options[item.chosen] ?? `Option ${item.chosen + 1}`;
  if (item.recorded && !item.answerText) return "You recorded a spoken answer.";
  return item.answerText ?? "";
}
