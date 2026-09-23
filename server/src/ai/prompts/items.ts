import type { BlueprintArea } from "../../../../shared/assessment";
import type { AreaDigest } from "../../assessment/digest";
import { ITEM_QUALITY_RULES, MEASUREMENT_PRINCIPLES } from "./itemRules";

/**
 * AI call 2 (brief §9.2): generate one area's item pool, across all five difficulties.
 *
 * A pool rather than a fixed test, because the selector is adaptive: it needs an unserved item at
 * whatever difficulty the learner has climbed or fallen to, and it cannot wait for a generation
 * mid-test.
 */
export const ITEMS_SYSTEM = `You write placement assessment items for working software engineers.

${MEASUREMENT_PRINCIPLES}

${ITEM_QUALITY_RULES}

Kinds by difficulty:
- Difficulty 1-2: mcq, multi, predict_output.
- Difficulty 3-5: find_bug, multi, predict_output, code.
- At most one \`code\` item per area.

Per kind:
- mcq: 4 options typically (3-6 allowed), exactly one correct. Put its index in correctIndices as a single-element array.
- multi: 2 or more correct, never all of them. End the prompt with "(Select all that apply.)".
- predict_output: the prompt contains a short program; expectedOutput is exactly what it prints. Whitespace is normalised before comparison, so do not rely on alignment.
- find_bug: the prompt contains code with one real defect; the options are candidate fixes, exactly one of which is correct.
- code: give starterCode declaring functionName, a referenceSolution that passes every test, 2-3 visibleTests and 2-4 hiddenTests. Arguments and expected values must be plain JSON data — no functions, dates or class instances. JavaScript only: it is the only language this platform can execute.

Write items that a competent engineer at the target difficulty gets right and one a level below gets wrong. An item everyone passes and an item everyone fails both measure nothing.`;

export function buildItemsUser(area: BlueprintArea, digest: AreaDigest, targetPerLevel: number): string {
  const topics = digest.topics.map((t) => `- ${t.id} · ${t.title} (${t.level}) · ${t.module}`).join("\n");

  return `## Area

Name: ${area.name}
Why it is being tested: ${area.rationale}
Expected level for this person: ${area.hypothesisLevel}/5

## Topics in this area

Tag every item with 1-3 of these ids, and use no others.

${topics}

## What to produce

About ${targetPerLevel} items at each difficulty from 1 to 5, spread across the kinds allowed for that difficulty. At most one \`code\` item in total.

Do not generate \`explain\` items here; they are written separately for the whole assessment.`;
}

/**
 * The free-text items, generated once for the whole assessment and placed at the end (§9.2).
 * They are graded later against their rubric, which is why the rubric has to be specific enough
 * for a second model to apply consistently.
 */
export const EXPLAIN_SYSTEM = `You write short written-answer questions for a placement assessment.

${MEASUREMENT_PRINCIPLES}

Each item asks the engineer to explain a tradeoff, a failure mode, or a decision they would make. Good questions cannot be answered by definition: "What is a database index?" is bad, "You add an index and writes get slower — explain why, and when you would accept that" is good.

Each item needs a rubric of 2-6 points with weights summing to roughly 1. A rubric point names something a good answer contains, specifically enough that two different readers would agree whether it is present.

Set kind to "explain" and difficulty between 3 and 5. maxChars is 1200 unless the question needs more.`;

export function buildExplainUser(areas: BlueprintArea[], topicIds: string[], count: number): string {
  return `## Areas being assessed

${areas.map((a) => `- ${a.name} (expected level ${a.hypothesisLevel}/5): ${a.rationale}`).join("\n")}

## Topic ids you may tag

${topicIds.join(", ")}

Write ${count} written-answer items covering different areas.`;
}
