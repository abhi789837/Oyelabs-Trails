import { z } from "zod";

import type { LessonStepId, TutorCitation } from "../../../../shared/lesson";
import type { GroundingPassage } from "../../../../shared/topicTests";
import type { AuthoredTopic } from "../../content/store";
import { buildPassages, citationProblem, normaliseWs } from "../../topicTests/grounding";

/**
 * "Ask Oye", the in-lesson tutor (v5 Phase 3).
 *
 * Grounded the same way as the v4.3 topic tests: the lesson's own text is split into numbered
 * passages (`buildPassages`: `sum.p1`, `s2.p3`), the tutor answers from them only and cites the
 * passage it used with an exact quote, and the quote is checked in code (`citationProblem`) before it
 * is shown. A citation that doesn't check out is dropped, never shown as if it did.
 *
 * Everything stable about the lesson (the rules and the passages) is in `system`, which the AI
 * router caches, so a learner's tenth question about a lesson costs little more than its question.
 */

export const TUTOR_RULES = `You are Oye, a patient tutor inside one lesson of a company training app. Answer the learner's question
using ONLY the lesson passages below. Write plain, friendly English a 12-year-old could follow. Short
sentences. At most 120 words.

Rules:
1. Ground every answer in the passages. Cite 1-3 passages you used, by id, each with an exact quote
   (8-120 characters) copied from that passage. If the passages don't cover the question, say so in
   one sentence, point to the closest passage, and suggest asking a teammate.
2. During practice (step "do"): coach, don't solve. Ask a guiding question or give one small hint
   about the next step. Never write the full solution, and never more than 3 lines of code.
3. Never reveal or guess answers to the lesson's test.
4. Don't invent facts, links or APIs that aren't in the passages.

Return JSON: {"answer": "...", "citations": [{"passageId": "sum.p1", "quote": "..."}]}.`;

export const tutorAnswerSchema = z.object({
  answer: z.string().min(1).max(2000),
  citations: z
    .array(z.object({ passageId: z.string().min(1).max(20), quote: z.string().min(1).max(400) }))
    .max(5),
});
export type TutorAnswer = z.infer<typeof tutorAnswerSchema>;

/** One line per passage: `[sum.p1] {Summary} text`. */
export function passageLines(passages: readonly GroundingPassage[]): string {
  return passages.map((p) => `[${p.id}] {${p.heading}} ${normaliseWs(p.text)}`).join("\n");
}

/** The cached part: rules, then the lesson. Identical for every question about this lesson. */
export function tutorSystem(topic: AuthoredTopic): string {
  const parts = [TUTOR_RULES, "", `LESSON: ${topic.title} (${topic.level})`, "", "PASSAGES:", passageLines(buildPassages(topic))];
  if (topic.challengeType === "code" && topic.codeChallenge) {
    parts.push("", `PRACTICE TASK (do not solve it for them): write \`${topic.codeChallenge.functionName}\`.`, topic.codeChallenge.instructions);
  } else if (topic.practice && "prompt" in topic.practice && typeof topic.practice.prompt === "string") {
    parts.push("", "PRACTICE TASK (do not solve it for them):", topic.practice.prompt);
  }
  return parts.join("\n");
}

export interface TutorTurn {
  question: string;
  answer: string;
}

/** The per-question part: where the learner is, their code, the last few turns, the question. */
export function tutorUser(input: { step: LessonStepId; question: string; code?: string; history?: readonly TutorTurn[] }): string {
  const lines = [`STEP: ${input.step}`];
  if (input.code?.trim()) lines.push("", "LEARNER'S CODE:", "```", input.code.slice(0, 8000), "```");
  const history = (input.history ?? []).slice(-3);
  if (history.length) {
    lines.push("", "EARLIER IN THIS CHAT:");
    for (const t of history) lines.push(`Q: ${t.question.slice(0, 300)}`, `A: ${t.answer.slice(0, 400)}`);
  }
  lines.push("", `QUESTION: ${input.question}`);
  return lines.join("\n");
}

/** Keeps citations whose quote really is in the cited passage; adds the heading for the link. */
export function checkedCitations(topic: AuthoredTopic, citations: TutorAnswer["citations"]): TutorCitation[] {
  const passages = buildPassages(topic);
  const out: TutorCitation[] = [];
  const seen = new Set<string>();
  for (const c of citations) {
    if (seen.has(c.passageId)) continue;
    if (citationProblem({ passages }, c) !== null) continue;
    const passage = passages.find((p) => p.id === c.passageId)!;
    seen.add(c.passageId);
    out.push({ passageId: c.passageId, heading: passage.heading, quote: normaliseWs(c.quote) });
  }
  return out.slice(0, 3);
}

/**
 * On the Do step a code block longer than `maxLines` is cut down to its first lines: the prompt asks
 * for hints, and this makes sure a full solution can't slip through anyway.
 */
export function limitCode(answer: string, step: LessonStepId, maxLines = 3): string {
  if (step !== "do") return answer;
  return answer.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang: string, body: string) => {
    const lines = body.replace(/\n$/, "").split("\n");
    if (lines.length <= maxLines) return `\`\`\`${lang}\n${body}\`\`\``;
    return `\`\`\`${lang}\n${lines.slice(0, maxLines).join("\n")}\n// …the rest is yours to write\n\`\`\``;
  });
}
