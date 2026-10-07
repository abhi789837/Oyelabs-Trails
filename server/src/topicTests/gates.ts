import { z } from "zod";

import { GATE_LIMITS, type GateCheck, type TestItemGates, type TestItemPayload, type TopicGroundingContent } from "../../../shared/topicTests";
import { sizeProblems } from "../../../shared/timing";
import type { AiTask } from "../../../shared/aiRouting";
import type { AiPurpose } from "../../../shared/enums";
import type { AiService } from "../ai/service";
import type { GenerateJsonRequest } from "../ai/types";
import { citationProblem, normaliseWs, sha } from "./grounding";

/**
 * The quality gates every topic-test item must pass before a learner sees it (v4.3 Phase 5).
 *
 * Kurdi et al. (2020) found automatically generated questions are under-evaluated, so nothing the
 * writer produces is trusted; and the static items written by hand are put through the same gates
 * by the re-check job. The gates, in order of cost:
 *
 *  1. **Format** (code). Haladyna, Downing & Rodriguez (2002) item-writing rules: 3–5 options, no
 *     duplicates, a valid key, single-select has exactly one key, no "all/none of the above", no
 *     unemphasised negative stems or double negatives.
 *  2. **Relevance** (code + Haiku). The cited quote must be an exact, whitespace-normalised substring
 *     of the cited passage *of this topic* — this is what stops an off-topic or hallucinated item.
 *     Then a Haiku call confirms the passage actually supports the keyed answer.
 *  3. **Answerability** (Haiku). Round-trip consistency (Alberti et al., ACL 2019): a separate call,
 *     given ONLY the topic passages and the options shuffled (position-bias guard, Zheng et al. 2023),
 *     must pick exactly the key. A broken key or an unanswerable item fails here.
 *  4. **Not trivial** (Haiku + code). A third call answers WITHOUT the content; correct with
 *     confidence ≥ 90 means the item does not test the topic. Plus the longest-option cue: the key may
 *     not be the strictly longest option by more than 30%, and at test level at most 40% of items may
 *     key their longest option.
 *  5. **Distractors** (code). Each wrong option needs a one-line misconception rationale (Gierl et
 *     al. 2017: plausible, misconception-based distractors are the main quality lever). Generated
 *     items get them from the writer; static items get them from the relevance checker.
 *  6. **Size** (code, generated items). The v4.1 MCQ size limits (shared/timing.ts) so a 10-item test
 *     fits its ~8 minute budget.
 *
 * AI budget: three Haiku calls per *topic batch*, not per item. The blind answer "with" and "without"
 * the content are deliberately two calls: in one call the model would already have read the content
 * when giving its "without" answer, which makes the triviality check meaningless.
 */

export interface GateCandidate {
  /** Unique within the batch: a row id or a temporary id for a fresh candidate. */
  key: string;
  origin: "static" | "generated";
  payload: TestItemPayload;
}

export interface GateOutcome {
  gates: TestItemGates;
  /** For static items without one: the citation the relevance checker found (verified by code). */
  proposedCitation?: { passageId: string; quote: string };
  /** For static items: the checker's misconception per distractor. */
  proposedRationales?: (string | null)[];
}

// ---------------------------------------------------------------------------
// Code checks
// ---------------------------------------------------------------------------

const BANNED_OPTION = /\b(all|none|both|neither) of (the )?(above|these|the above|those|the options)\b/i;
/** "Which of the following is not…" / "…except" without emphasis (NOT, EXCEPT, **not**). */
const UNEMPHASISED_NEGATIVE = /\b[Ww](hich|hat)\b[^?]*\b(is|are|does|do|would|should|can)\s+not\b|\bexcept\b/;
const DOUBLE_NEGATIVE = [
  /\b(not|never)\b[^.?!]{0,30}\b(not|never|cannot|can't|isn't|doesn't|don't|won't)\b/i,
  /\bnot\s+(un|in|im|il|ir|non)[a-z]{3,}/i,
];

export function keyIndices(payload: Pick<TestItemPayload, "correctIndex" | "correctIndices">): number[] {
  return payload.correctIndices && payload.correctIndices.length > 1
    ? [...new Set(payload.correctIndices)].sort((a, b) => a - b)
    : [payload.correctIndex];
}

export function formatProblems(payload: TestItemPayload): string[] {
  const problems: string[] = [];
  const options = payload.options ?? [];
  if (options.length < GATE_LIMITS.minOptions || options.length > GATE_LIMITS.maxOptions) {
    problems.push(`${options.length} options (needs ${GATE_LIMITS.minOptions}–${GATE_LIMITS.maxOptions})`);
  }
  const normalised = options.map((o) => normaliseWs(o).toLowerCase());
  if (normalised.some((o) => o.length === 0)) problems.push("an empty option");
  if (new Set(normalised).size !== normalised.length) problems.push("duplicate options");
  const keys = keyIndices(payload);
  if (keys.some((k) => !Number.isInteger(k) || k < 0 || k >= options.length)) problems.push("the key points at no option");
  if (payload.correctIndices && payload.correctIndices.length > 1) {
    if (new Set(payload.correctIndices).size !== payload.correctIndices.length) problems.push("the key repeats an option");
    if (payload.correctIndices.length >= options.length) problems.push("every option is keyed");
  } else if (payload.correctIndices && payload.correctIndices.length === 1 && payload.correctIndices[0] !== payload.correctIndex) {
    problems.push("single-select key disagrees with itself");
  }
  if (options.some((o) => BANNED_OPTION.test(o))) problems.push('uses "all/none of the above"');
  const stem = payload.prompt ?? "";
  if (UNEMPHASISED_NEGATIVE.test(stem)) problems.push("negative stem without emphasis (write NOT / EXCEPT)");
  if (DOUBLE_NEGATIVE.some((re) => re.test(stem))) problems.push("double negative in the stem");
  if (normaliseWs(stem).length < 10) problems.push("the question is too short");
  if (!payload.explanation || normaliseWs(payload.explanation).length < 10) problems.push("no explanation");
  return problems;
}

/** Ratio of the longest keyed option to the longest distractor; > 1 means a key is the longest. */
export function longestKeyRatio(payload: TestItemPayload): number {
  const keys = new Set(keyIndices(payload));
  const lengths = payload.options.map((o) => normaliseWs(o).length);
  const keyMax = Math.max(0, ...lengths.filter((_, i) => keys.has(i)));
  const otherMax = Math.max(0, ...lengths.filter((_, i) => !keys.has(i)));
  return otherMax === 0 ? Infinity : keyMax / otherMax;
}

export function keyIsLongest(payload: TestItemPayload): boolean {
  return longestKeyRatio(payload) > 1;
}

export function distractorProblems(payload: TestItemPayload, rationales: (string | null)[] | undefined): string[] {
  const keys = new Set(keyIndices(payload));
  if (!rationales || rationales.length !== payload.options.length) return ["no misconception rationale per option"];
  const problems: string[] = [];
  const seen = new Set<string>();
  payload.options.forEach((_, i) => {
    if (keys.has(i)) return;
    const r = normaliseWs(rationales[i] ?? "");
    if (r.length < 5) problems.push(`option ${i + 1} has no misconception rationale`);
    else if (seen.has(r.toLowerCase())) problems.push(`option ${i + 1} repeats another rationale`);
    seen.add(r.toLowerCase());
  });
  return problems;
}

export function itemSizeProblems(payload: TestItemPayload): string[] {
  return sizeProblems({
    type: "mcq",
    prompt: payload.prompt,
    coding: null,
    task: null,
    mcq: { options: payload.options, correctIndex: payload.correctIndex, explanation: payload.explanation, snippet: null },
  } as unknown as Parameters<typeof sizeProblems>[0]);
}

const ok = (detail?: string): GateCheck => ({ ok: true, ...(detail ? { detail } : {}) });
const fail = (detail: string): GateCheck => ({ ok: false, detail });
const skipped = (detail: string): GateCheck => ({ ok: false, skipped: true, detail });

/** Every gate that needs no model. Items that fail a hard one here never reach the AI calls. */
export function codeGates(grounding: TopicGroundingContent, candidate: GateCandidate): TestItemGates {
  const p = candidate.payload;
  const format = formatProblems(p);
  const ratio = longestKeyRatio(p);
  const relevanceProblem = candidate.origin === "generated" || p.citation ? citationProblem(grounding, p.citation) : null;
  const distractors = candidate.origin === "generated" ? distractorProblems(p, p.distractorRationales) : [];
  const size = candidate.origin === "generated" ? itemSizeProblems(p) : [];
  return {
    checkedAt: Date.now(),
    passed: false,
    hard: false,
    failures: [],
    format: format.length ? fail(format.join("; ")) : ok(),
    relevanceCode:
      candidate.origin === "static" && !p.citation
        ? { ok: true, detail: "static item: the checker proposes a citation" }
        : relevanceProblem
          ? fail(relevanceProblem)
          : ok(),
    relevanceAi: skipped("not run"),
    answerable: skipped("not run"),
    notTrivial:
      ratio > GATE_LIMITS.longestKeyRatio
        ? fail(`the key is the longest option by ${Math.round((ratio - 1) * 100)}%`)
        : skipped("not run"),
    distractors:
      candidate.origin === "static" ? skipped("static item: the checker supplies rationales") : distractors.length ? fail(distractors.join("; ")) : ok(),
    size: candidate.origin === "static" ? ok("static item: size limits apply to generated items") : size.length ? fail(size.join("; ")) : ok(),
  };
}

const HARD: (keyof TestItemGates)[] = ["format", "relevanceCode", "relevanceAi", "answerable", "distractors"];
const ALL: (keyof TestItemGates)[] = ["format", "relevanceCode", "relevanceAi", "answerable", "notTrivial", "distractors", "size", "testLevel"];

export function finalise(gates: TestItemGates): TestItemGates {
  const failures: string[] = [];
  let hard = false;
  for (const name of ALL) {
    const check = gates[name] as GateCheck | undefined;
    if (!check || check.ok) continue;
    failures.push(`${name}: ${check.detail ?? "failed"}`);
    if (HARD.includes(name)) hard = true;
  }
  return { ...gates, passed: failures.length === 0, hard, failures };
}

function codeHardFailed(gates: TestItemGates): boolean {
  return !gates.format.ok || !gates.relevanceCode.ok || (!gates.distractors.ok && !gates.distractors.skipped);
}

// ---------------------------------------------------------------------------
// AI checks (three Haiku calls per batch)
// ---------------------------------------------------------------------------

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export const relevanceSchema = z.object({
  items: z
    .array(
      z.object({
        n: z.number().int().min(1).max(50),
        supported: z.boolean(),
        passageId: z.string().max(20).nullable(),
        quote: z.string().max(500).nullable(),
        misconceptions: z.array(z.string().max(300)).max(8),
        reason: z.string().max(300),
      }),
    )
    .max(50),
});

export const answerSchema = z.object({
  answers: z
    .array(
      z.object({
        n: z.number().int().min(1).max(50),
        choices: z.array(z.string().max(2)).max(8),
        confidence: z.number().int().min(0).max(100),
      }),
    )
    .max(50),
});

export const RELEVANCE_SYSTEM = `You check multiple-choice test items against the teaching text of one topic.
For each item you get the options, which option(s) are keyed correct, and possibly a cited passage.
Decide whether the topic passages SUPPORT the keyed answer as correct and the other options as wrong.
- supported: true only if the passages state or directly imply the keyed answer. General knowledge
  that the passages do not cover is NOT support.
- passageId + quote: the passage that supports it and an EXACT short quote copied from that passage
  (8-40 words, verbatim). Use the item's citation if it is right; null if nothing supports it.
- misconceptions: for each NON-keyed option, in order, one line naming the misconception that would
  lead a learner to pick it; "" if the option is not a plausible mistake.
Return JSON only.`;

export const ANSWER_WITH_SYSTEM = `You are a careful student taking a test on ONE topic.
Answer each item using ONLY the passages provided. If the passages do not let you decide, choose
nothing ([]) and give low confidence. Multi-select items say so; pick every correct option.
choices are option letters. confidence is 0-100: how sure you are the choice is right. JSON only.`;

export const ANSWER_WITHOUT_SYSTEM = `You are a student who has NOT read the course. Answer each item from the question and
options alone. Give your honest best guess and a calibrated confidence 0-100 (100 = certain; a
guess among four options is about 25). Multi-select items say so. choices are option letters. JSON only.`;

function passagesBlock(grounding: TopicGroundingContent): string {
  return grounding.passages.map((p) => `<passage id="${p.id}" heading="${p.heading.replace(/"/g, "'")}">\n${p.text}\n</passage>`).join("\n");
}

/** Deterministic shuffle of option indices, seeded per item and per call. */
export function shuffledOrder(length: number, seed: string): number[] {
  const order = Array.from({ length }, (_, i) => i);
  let state = parseInt(sha(seed).slice(0, 8), 16) || 1;
  for (let i = order.length - 1; i > 0; i--) {
    state = (Math.imul(state ^ (state >>> 15), 2246822507) + 0x6d2b79f5) >>> 0;
    const j = state % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

function itemBlock(n: number, payload: TestItemPayload, order: number[], withKey: boolean): string {
  const multi = keyIndices(payload).length > 1;
  const lines = [`### Item ${n}`, `Question${multi ? " (select ALL that apply)" : ""}: ${payload.prompt}`];
  order.forEach((original, shown) => lines.push(`${LETTERS[shown]}) ${payload.options[original]}`));
  if (withKey) {
    const keys = keyIndices(payload);
    lines.push(`Keyed: ${order.map((original, shown) => (keys.includes(original) ? LETTERS[shown] : null)).filter(Boolean).join(", ")}`);
    lines.push(payload.citation ? `Cited: ${payload.citation.passageId} | "${payload.citation.quote}"` : "Cited: none");
  }
  return lines.join("\n");
}

function lettersToOriginal(choices: string[], order: number[]): number[] {
  const out = new Set<number>();
  for (const c of choices) {
    const shown = LETTERS.indexOf(c.trim().toUpperCase().replace(/[^A-H]/g, ""));
    if (shown >= 0 && shown < order.length) out.add(order[shown]);
  }
  return [...out].sort((a, b) => a - b);
}

function sameSet(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export interface GateDeps {
  ai: AiService;
}

/**
 * v4.5 (module tests): optional overrides for the three AI calls (task, purpose, schema names, cost
 * attribution). Every field defaults to the v4.3 topic-test value.
 */
export interface GateOverrides {
  purpose?: AiPurpose;
  relevanceTask?: AiTask;
  answerTask?: AiTask;
  relevanceSchemaName?: string;
  answerSchemaName?: string;
  meta?: GenerateJsonRequest<unknown>["meta"];
}

/**
 * Runs every gate over a batch of one topic's candidates. Returns one outcome per candidate key.
 * Throws when the AI layer is not configured or a call fails; the caller decides what that means.
 */
export async function runGates(
  deps: GateDeps,
  grounding: TopicGroundingContent,
  candidates: GateCandidate[],
  overrides: GateOverrides = {},
): Promise<Map<string, GateOutcome>> {
  const outcomes = new Map<string, GateOutcome>();
  const live: GateCandidate[] = [];
  for (const candidate of candidates) {
    const gates = codeGates(grounding, candidate);
    outcomes.set(candidate.key, { gates });
    if (codeHardFailed(gates)) {
      for (const name of ["relevanceAi", "answerable", "notTrivial"] as const) {
        if (gates[name].skipped) gates[name] = skipped("not run: a code gate already failed");
      }
      outcomes.set(candidate.key, { gates: finalise(gates) });
    } else {
      live.push(candidate);
    }
  }
  if (live.length === 0) return outcomes;

  const meta = overrides.meta ?? {};
  const purpose = overrides.purpose ?? "topic_test_check";
  const relevanceTask = overrides.relevanceTask ?? "topic_test_relevance";
  const answerTask = overrides.answerTask ?? "topic_test_answer";
  const relevanceSchemaName = overrides.relevanceSchemaName ?? "topic_test_relevance";
  const answerSchemaName = overrides.answerSchemaName ?? "topic_test_answer";
  const passages = passagesBlock(grounding);

  // 1. Relevance: does the cited passage support the key?
  const relevanceUser = [
    `Topic: ${grounding.title} (${grounding.level})`,
    "Passages:",
    passages,
    "",
    "Items:",
    ...live.map((c, i) => itemBlock(i + 1, c.payload, c.payload.options.map((_, k) => k), true)),
  ].join("\n");
  const relevance = await deps.ai.generateJson({
    purpose,
    task: relevanceTask,
    system: RELEVANCE_SYSTEM,
    user: relevanceUser,
    schema: relevanceSchema,
    schemaName: relevanceSchemaName,
    meta,
  });

  // 2 and 3. Blind answers, with and then without the content, options shuffled differently.
  const withOrders = live.map((c) => shuffledOrder(c.payload.options.length, `${c.key}:with`));
  const withoutOrders = live.map((c) => shuffledOrder(c.payload.options.length, `${c.key}:without`));
  const withContent = await deps.ai.generateJson({
    purpose,
    task: answerTask,
    system: ANSWER_WITH_SYSTEM,
    user: [`Topic: ${grounding.title}`, "Passages:", passages, "", "Items:", ...live.map((c, i) => itemBlock(i + 1, c.payload, withOrders[i], false))].join("\n"),
    schema: answerSchema,
    schemaName: answerSchemaName,
    meta,
  });
  const withoutContent = await deps.ai.generateJson({
    purpose,
    task: answerTask,
    system: ANSWER_WITHOUT_SYSTEM,
    user: ["Items:", ...live.map((c, i) => itemBlock(i + 1, c.payload, withoutOrders[i], false))].join("\n"),
    schema: answerSchema,
    schemaName: answerSchemaName,
    meta,
  });

  live.forEach((candidate, i) => {
    const n = i + 1;
    const outcome = outcomes.get(candidate.key)!;
    const gates = outcome.gates;
    const keys = keyIndices(candidate.payload);

    // Relevance (AI), with the proposed citation verified by code.
    const verdict = relevance.data.items.find((v) => v.n === n);
    if (!verdict) {
      gates.relevanceAi = fail("the checker gave no verdict");
    } else if (!verdict.supported) {
      gates.relevanceAi = fail(`not supported by the topic: ${verdict.reason || "no reason given"}`);
    } else {
      gates.relevanceAi = ok(verdict.passageId ?? undefined);
      if (!candidate.payload.citation) {
        const proposed = verdict.passageId && verdict.quote ? { passageId: verdict.passageId, quote: verdict.quote } : null;
        const problem = citationProblem(grounding, proposed);
        if (problem || !proposed) gates.relevanceCode = fail(`checker's citation failed: ${problem ?? "none given"}`);
        else {
          gates.relevanceCode = ok("citation found by the checker");
          outcome.proposedCitation = proposed;
        }
      }
    }
    if (candidate.origin === "static" && verdict) {
      // Map the checker's misconceptions (one per non-keyed option, in order) onto option indices.
      const rationales: (string | null)[] = [];
      let next = 0;
      candidate.payload.options.forEach((_, k) => {
        if (keys.includes(k)) rationales.push(null);
        else rationales.push(verdict.misconceptions[next++] ?? "");
      });
      const problems = distractorProblems(candidate.payload, rationales);
      gates.distractors = problems.length ? fail(problems.join("; ")) : ok("rationales from the checker");
      outcome.proposedRationales = rationales;
    } else if (candidate.origin === "static") {
      gates.distractors = fail("the checker gave no misconceptions");
    }

    // Answerability: with the content, the blind answer must be exactly the key.
    const withAnswer = withContent.data.answers.find((a) => a.n === n);
    const picked = withAnswer ? lettersToOriginal(withAnswer.choices, withOrders[i]) : [];
    gates.answerable = !withAnswer
      ? fail("the checker gave no answer")
      : sameSet(picked, keys)
        ? ok(`answered from the content (confidence ${withAnswer.confidence})`)
        : fail(`answered from the content as ${picked.length ? picked.map((k) => k + 1).join(",") : "nothing"}; key is ${keys.map((k) => k + 1).join(",")}`);

    // Not trivial: without the content it must not be answered correctly with high confidence.
    if (gates.notTrivial.skipped) {
      const blind = withoutContent.data.answers.find((a) => a.n === n);
      const blindPicked = blind ? lettersToOriginal(blind.choices, withoutOrders[i]) : [];
      gates.notTrivial =
        blind && sameSet(blindPicked, keys) && blind.confidence >= GATE_LIMITS.trivialConfidence
          ? fail(`answered correctly without the content at confidence ${blind.confidence}`)
          : ok(blind ? `without the content: ${sameSet(blindPicked, keys) ? "right" : "wrong"} at confidence ${blind.confidence}` : "no blind answer");
    }

    outcome.gates = finalise(gates);
  });

  return outcomes;
}

/**
 * The test-level longest-option rule: at most 40% of a topic's items may key their longest option.
 * Given candidates in preference order, returns the keys to drop (the latest-preferred offenders).
 */
export function testLevelExcess(payloads: { key: string; payload: TestItemPayload }[]): string[] {
  const allowed = Math.floor(payloads.length * GATE_LIMITS.maxLongestKeyedShare);
  const offenders = payloads.filter((p) => keyIsLongest(p.payload));
  return offenders.length <= allowed ? [] : offenders.slice(allowed).map((p) => p.key);
}
