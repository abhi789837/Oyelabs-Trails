import { normaliseSkill } from "../../builder/scoring";
import type { Candidate } from "./types";

/**
 * Finding the lessons that answer a skill.
 *
 * The gap map talks in skills ("server deployment", "Laravel Eloquent"); the library talks in
 * lessons ("Multi-Stage Builds", "The N+1 Query Problem"). Something has to join the two, and it
 * cannot be another model call — this runs on every week for every learner, and a wrong answer here
 * is a wasted week rather than a wrong sentence.
 *
 * So it is text matching, kept deliberately shallow and readable: normalise, drop the words that
 * carry no signal, and score on how much of the skill the lesson's own title, module, track and
 * course name account for. Shallow matching that an admin can predict beats clever matching that
 * surprises them.
 */

/**
 * Words that match everything and therefore mean nothing here.
 *
 * "Advanced" and "fundamentals" are on the list for the same reason "the" is: a skill written as
 * "advanced testing" should match testing lessons, not every lesson with "advanced" in its module
 * name. They are cheap to drop and expensive to keep.
 */
const STOPWORDS = new Set([
  "a", "an", "and", "the", "of", "for", "in", "on", "to", "with", "using", "your", "you",
  "basic", "basics", "core", "fundamental", "fundamentals", "intro", "introduction", "advanced",
  "beginner", "deep", "dive", "guide", "course", "lesson", "topic", "skills", "skill",
  "development", "developer", "engineering", "engineer", "knowledge", "understanding",
]);

/**
 * The spellings of a word that should count as the same word.
 *
 * Generating forms rather than stemming down to a root, because stemming gets the interesting cases
 * wrong in both directions: "indexes" reduces to "indexe", and a rule that fixes that ("-es" → "")
 * turns "databases" into "databas". Expanding instead means "index" and "indexes" meet in the middle
 * without either having to be mangled, and a wrong extra form simply never appears in a haystack.
 */
function variants(word: string): string[] {
  const forms = new Set([word, `${word}s`, `${word}es`, `${word}ing`]);
  if (word.endsWith("y")) forms.add(`${word.slice(0, -1)}ies`);
  if (word.endsWith("ies")) forms.add(`${word.slice(0, -3)}y`);
  if (word.endsWith("es")) forms.add(word.slice(0, -2));
  if (word.endsWith("s") && !word.endsWith("ss")) forms.add(word.slice(0, -1));

  /* The -ing forms, which this vocabulary is full of: an admin writes "cache invalidation" and the
     module is called "Caching"; they write "deployment" and the lesson is "Deploying a MERN App".
     Without these, half the curriculum's own titles fail to match the words used to ask for them. */
  if (word.endsWith("e")) forms.add(`${word.slice(0, -1)}ing`);
  if (word.endsWith("ing") && word.length > 5) {
    forms.add(word.slice(0, -3));
    forms.add(`${word.slice(0, -3)}e`);
  }
  return [...forms];
}

/**
 * The words of a skill that are worth matching on.
 *
 * Two characters is the floor: "js", "ci", "db" and "go" are all real, and dropping them would
 * make "Go" and "CI/CD" unmatchable. Anything shorter is punctuation.
 */
export function skillTokens(skill: string): string[] {
  const words = normaliseSkill(skill)
    .replace(/[^a-z0-9+#./ -]/g, " ")
    .split(/[\s/-]+/)
    .filter((word) => word.length >= 2 && !STOPWORDS.has(word));
  return [...new Set(words)];
}

/** The words of a lesson's searchable text, lowercased. */
function haystackTokens(haystack: string): Set<string> {
  return new Set(
    haystack
      .toLowerCase()
      .replace(/[^a-z0-9+#./ -]/g, " ")
      .split(/[\s/-]+/)
      .filter((word) => word.length >= 2),
  );
}

/**
 * How much of a skill this lesson accounts for, 0–1.
 *
 * The share of the skill's words the lesson's own text covers — with the whole phrase appearing
 * verbatim short-circuiting to a full match, since "Cache Invalidation Strategies" obviously answers
 * "cache invalidation" without the arithmetic needing to agree.
 *
 * Coverage across the *whole* haystack rather than the title alone is deliberate and matters: a
 * lesson called "Invalidation" inside a module called "Caching" is exactly what somebody means by
 * "cache invalidation", and scoring only its title would miss it.
 */
export function matchScore(skill: string, haystack: string): number {
  const tokens = skillTokens(skill);
  if (tokens.length === 0) return 0;

  const lower = haystack.toLowerCase();
  const phrase = normaliseSkill(skill);
  if (phrase.length >= 4 && lower.includes(phrase)) return 1;

  const present = haystackTokens(haystack);
  const hits = tokens.filter((token) => variants(token).some((form) => present.has(form)) || lower.includes(token)).length;
  return hits / tokens.length;
}

/** Below this, a lesson is not about the skill and scheduling it would be noise. */
export const MATCH_THRESHOLD = 0.5;

export interface Match {
  candidate: Candidate;
  score: number;
}

/**
 * The lessons that answer one skill, best first.
 *
 * Ties break on trail order rather than arbitrarily, so a module's earlier lesson comes before its
 * later one when both match equally — which is both the more useful order and a stable one.
 */
export function matchesFor(skill: string, candidates: readonly Candidate[]): Match[] {
  const scored: Match[] = [];
  for (const candidate of candidates) {
    const score = matchScore(skill, candidate.haystack);
    if (score >= MATCH_THRESHOLD) scored.push({ candidate, score });
  }
  return scored.sort((a, b) => b.score - a.score || a.candidate.order - b.candidate.order);
}

/**
 * Does the admin's skip list cover this lesson?
 *
 * Checked against candidates as well as gaps. `scoreGaps` already marks a *gap* skipped, but the
 * low lane is filled from whatever is left in trail order, and without this check "don't teach them
 * Docker" would hold while Docker was the named reason for a lesson and then quietly fail the
 * moment Docker turned up as filler.
 */
export function isSkipped(candidate: Candidate, skip: readonly string[]): boolean {
  return skip.some((entry) => {
    const tokens = skillTokens(entry);
    if (tokens.length === 0) return false;
    return matchScore(entry, candidate.haystack) >= MATCH_THRESHOLD;
  });
}
