import {
  AI_ONLY_WEIGHT,
  WEIGHT_VALUE,
  type DetectedGap,
  type GapSource,
  type LearnerPriorities,
  type ScoredGap,
} from "../../../shared/builder";

/**
 * Turning what the admin said and what the test found into one ordered list.
 *
 * Pure, and separated from everything that talks to a model or a database, because this is the part
 * that decides what a person spends the next month learning. It should be readable, arguable and
 * testable without standing up an assessment.
 */

/** Loose matching, so "Laravel " and "laravel" are the same skill and do not both get a course. */
export function normaliseSkill(skill: string): string {
  return skill.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Does this gap fall under one of the admin's entries?
 *
 * Substring in either direction on purpose: an admin writes "DevOps" and the model returns "DevOps
 * deployment on shared hosting". Requiring equality there would file an obvious match as
 * AI-detected and drop it below every listed skill, which is the opposite of what the admin meant.
 * Both sides are normalised first, and the shorter string has to be at least three characters so
 * that "Go" does not match "Django".
 */
function related(a: string, b: string): boolean {
  const left = normaliseSkill(a);
  const right = normaliseSkill(b);
  if (left === right) return true;
  const shorter = left.length <= right.length ? left : right;
  if (shorter.length < 3) return false;
  return left.includes(right) || right.includes(left);
}

/**
 * The score.
 *
 * `severity` is how badly it is missing, `roleRelevance` how much the role needs it, and `weight`
 * how much the admin said it matters. Multiplying rather than adding is deliberate: a skill that is
 * irrelevant to the role should not climb the list by being very badly missed, and one the admin
 * marked Low should not climb by being relevant. Any of the three near zero should sink it.
 */
export function priorityScore(severity: number, roleRelevance: number, weight: number): number {
  return clamp01(severity) * clamp01(roleRelevance) * weight;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Merges the admin's must-have list with what the model detected, scores everything, and orders it.
 *
 * ## The ordering rule that is not arithmetic
 *
 * A skill the admin listed **always** comes before a skill only the model found, whatever the
 * numbers say. The tie is broken on `source` first and the score only after. Without that, a
 * dramatic AI-detected gap (severity 1.0, relevance 1.0, weight 0.5 = 0.50) would outrank a Medium
 * must-have that the learner is merely shaky on (0.6 x 1.0 x 0.6 = 0.36) — and the admin would
 * watch the platform quietly reorder a decision they had made deliberately.
 *
 * ## Must-haves with no evidence still appear
 *
 * If the admin says Kubernetes is High and the assessment never asked about Kubernetes, that is a
 * gap. It gets a mid severity — the honest reading of "we do not know" — and says so in its
 * evidence, rather than being dropped because no question happened to cover it.
 */
export function scoreGaps(detected: DetectedGap[], priorities: LearnerPriorities): ScoredGap[] {
  const skipList = priorities.skip.map(normaliseSkill);
  const isSkipped = (skill: string) => skipList.some((entry) => related(entry, skill));

  const scored: ScoredGap[] = [];
  const claimed = new Set<string>();

  for (const gap of detected) {
    const match = priorities.mustHave.find((entry) => related(entry.skill, gap.skill));
    const source: GapSource = match ? "both" : "ai_detected";
    const weight = match ? WEIGHT_VALUE[match.weight] : AI_ONLY_WEIGHT;
    if (match) claimed.add(normaliseSkill(match.skill));

    scored.push({
      skill: gap.skill,
      severity: clamp01(gap.severity),
      roleRelevance: clamp01(gap.roleRelevance),
      weight,
      source,
      priorityScore: priorityScore(gap.severity, gap.roleRelevance, weight),
      evidence: gap.evidence,
      skipped: isSkipped(gap.skill),
    });
  }

  /* A must-have the test never touched. Severity 0.5 rather than 1.0 or 0: we genuinely do not
     know how bad it is, and claiming either extreme would be inventing evidence. */
  for (const entry of priorities.mustHave) {
    if (claimed.has(normaliseSkill(entry.skill))) continue;
    const weight = WEIGHT_VALUE[entry.weight];
    scored.push({
      skill: entry.skill,
      severity: 0.5,
      roleRelevance: 1,
      weight,
      source: "admin_priority",
      priorityScore: priorityScore(0.5, 1, weight),
      evidence: {
        summary: `Your administrator marked ${entry.skill} as a ${entry.weight} priority. The placement assessment did not cover it, so this is here on their say-so rather than on a result.`,
        itemIds: [],
        missed: 0,
        asked: 0,
      },
      skipped: isSkipped(entry.skill),
    });
  }

  return sortGaps(scored);
}

/** Admin-listed first, then by score, then by name so the order is stable between runs. */
export function sortGaps(gaps: ScoredGap[]): ScoredGap[] {
  const rank = (source: GapSource) => (source === "ai_detected" ? 1 : 0);
  return [...gaps].sort((a, b) => {
    const bySource = rank(a.source) - rank(b.source);
    if (bySource !== 0) return bySource;
    const byScore = b.priorityScore - a.priorityScore;
    if (byScore !== 0) return byScore;
    return a.skill.localeCompare(b.skill);
  });
}

/**
 * What the builder will actually act on.
 *
 * Skipped gaps are filtered here rather than in `scoreGaps`, so the skipped ones are still stored
 * and still shown on the gap map. "We know you are weak here and chose not to teach it" is a
 * different statement from "we never looked", and only one of them is true.
 */
export function actionableGaps(gaps: ScoredGap[], courseCap: number): ScoredGap[] {
  return gaps.filter((gap) => !gap.skipped).slice(0, Math.max(0, courseCap));
}

/**
 * The sentence the learner reads on their path.
 *
 * Built from the evidence rather than generated, so it cannot drift from what actually happened and
 * costs no tokens. The admin's weight is mentioned only when they set one — otherwise it would read
 * as though a person had singled this out when nobody had.
 */
export function reasonFor(gap: ScoredGap, priorities: LearnerPriorities): string {
  const parts = [gap.evidence.summary];
  const listed = priorities.mustHave.find((entry) => related(entry.skill, gap.skill));
  if (listed) {
    parts.push(`Your administrator marked ${listed.skill} as a ${listed.weight} priority.`);
  }
  return parts.join(" ");
}
