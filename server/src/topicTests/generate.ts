import { z } from "zod";

import { BAND_MIX, testItemBandSchema, type TestItemBand, type TestItemPayload, type TopicGroundingContent } from "../../../shared/topicTests";
import type { AiService } from "../ai/service";

/**
 * The grounded item writer (v4.3 Phase 5), Sonnet 5.5 via task `topic_test_write`.
 *
 * It receives ONLY the topic's grounding passages, its learning objectives and its level — never the
 * video (no transcript; RESEARCH §4), never the static questions' answers, never anything from other
 * topics. Every item must cite one passage by id with an exact quote, which the relevance gate then
 * checks by code (RAG-style grounding, Lewis et al. 2020).
 *
 * The prompt carries the Haladyna, Downing & Rodriguez (2002) rules that matter here and asks for a
 * misconception behind every distractor (Gierl et al. 2017). Nothing it writes is trusted: the gates
 * in gates.ts decide.
 */

const writtenOptionSchema = z.object({
  text: z.string().min(1).max(300),
  correct: z.boolean(),
  /** Empty for a correct option; one line naming the misconception for a distractor. */
  misconception: z.string().max(300),
});

export const writtenItemSchema = z.object({
  objectiveId: z.string().min(1).max(20),
  band: testItemBandSchema,
  prompt: z.string().min(10).max(800),
  options: z.array(writtenOptionSchema).min(3).max(5),
  explanation: z.string().min(10).max(1200),
  citation: z.object({ passageId: z.string().min(1).max(20), quote: z.string().min(8).max(400) }),
});
export type WrittenItem = z.infer<typeof writtenItemSchema>;

/** What the model is asked for. */
export const writeContractSchema = z.object({ items: z.array(writtenItemSchema).min(1).max(15) });
/** What we accept: element by element, so one malformed item costs that item, not the batch. */
const writeLenientSchema = z.object({ items: z.array(z.unknown()).max(15) });

export const WRITE_SYSTEM = `You write multiple-choice test items for ONE topic of a software agency's internal course.
You may use ONLY the passages given. Never test anything the passages do not teach, and never go
beyond the topic's level. Each item tests one idea.
Rules (Haladyna item-writing guidelines):
- Every item cites the passage it comes from: passageId plus an EXACT quote copied verbatim from that
  passage (8-40 words) that supports the correct answer.
- 3-5 options. Exactly one correct option, unless the item clearly says "Select ALL that apply".
- No trick wording, no double negatives, no "all of the above" / "none of the above". Phrase stems
  positively; if a negative is unavoidable write it in capitals (NOT).
- Options are homogeneous and of similar length; the correct one must NOT be the longest. Vary which
  position is correct.
- Each wrong option reflects a real misconception a learner of this topic has. Give it in one line in
  "misconception" ("" for the correct option).
- Bands: recall = recall/understand a stated idea; apply = use it in a small realistic situation;
  harder_apply = combine two ideas from the passages or spot a subtle pitfall they describe.
- Keep the question under 60 words and each option under 15 words.
- The explanation says why the key is right and names the misconception behind the most tempting
  distractor.
Return JSON only.`;

export function bandPlan(count: number): Record<TestItemBand, number> {
  const harder = count >= 8 ? Math.max(1, Math.round(count * BAND_MIX.harder_apply)) : 0;
  const recall = Math.round(count * BAND_MIX.recall);
  return { recall, apply: Math.max(0, count - recall - harder), harder_apply: harder };
}

export function writePrompt(grounding: TopicGroundingContent, count: number, round: number, avoid: string[]): string {
  const plan = bandPlan(count);
  return [
    `Topic: ${grounding.title}`,
    `Level: ${grounding.level}`,
    `Round: ${round}`,
    `Write exactly ${count} items: ${plan.recall} recall, ${plan.apply} apply, ${plan.harder_apply} harder_apply.`,
    "",
    "Learning objectives (tag each item with one objectiveId):",
    ...grounding.objectives.map((o) => `<objective id="${o.id}">${o.text}</objective>`),
    "",
    "Passages (the ONLY source you may use):",
    ...grounding.passages.map((p) => `<passage id="${p.id}" heading="${p.heading.replace(/"/g, "'")}">\n${p.text}\n</passage>`),
    ...(avoid.length ? ["", "Do not repeat or paraphrase these existing questions:", ...avoid.slice(0, 20).map((a) => `- ${a.slice(0, 200)}`)] : []),
  ].join("\n");
}

/** A written item in the stored shape. A key-less item keeps correctIndex -1 so the format gate rejects it. */
export function toPayload(item: WrittenItem): TestItemPayload {
  const keyed = item.options.map((o, i) => (o.correct ? i : -1)).filter((i) => i >= 0);
  return {
    prompt: item.prompt.trim(),
    options: item.options.map((o) => o.text.trim()),
    correctIndex: keyed[0] ?? -1,
    ...(keyed.length > 1 ? { correctIndices: keyed } : {}),
    explanation: item.explanation.trim(),
    citation: { passageId: item.citation.passageId.trim(), quote: item.citation.quote.trim() },
    objectiveId: item.objectiveId,
    band: item.band,
    distractorRationales: item.options.map((o) => (o.correct ? null : o.misconception.trim())),
  };
}

export interface WriteResult {
  payloads: TestItemPayload[];
  /** Elements the model returned that did not parse. */
  malformed: number;
}

export async function writeItems(
  ai: AiService,
  grounding: TopicGroundingContent,
  options: { count: number; round: number; avoid: string[] },
): Promise<WriteResult> {
  if (grounding.passages.length === 0) return { payloads: [], malformed: 0 };
  const result = await ai.generateJson({
    purpose: "topic_test_write",
    task: "topic_test_write",
    system: WRITE_SYSTEM,
    user: writePrompt(grounding, options.count, options.round, options.avoid),
    schema: writeLenientSchema,
    contractSchema: writeContractSchema,
    schemaName: "topic_test_items",
    meta: {},
  });
  const payloads: TestItemPayload[] = [];
  let malformed = 0;
  for (const raw of result.data.items) {
    const parsed = writtenItemSchema.safeParse(raw);
    if (parsed.success) payloads.push(toPayload(parsed.data));
    else malformed += 1;
  }
  return { payloads, malformed };
}
