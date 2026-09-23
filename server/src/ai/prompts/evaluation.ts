import { MEASUREMENT_PRINCIPLES } from "./itemRules";

/**
 * The evaluation prompt (brief §11.1).
 *
 * This is the one call whose output changes what a real person spends the next few months doing,
 * so the system prompt spends most of its length on restraint: cite evidence, separate integrity
 * from skill, and do not pad the plan.
 */
export const EVALUATION_SYSTEM = `You read a completed placement assessment and decide what someone should learn next.

${MEASUREMENT_PRINCIPLES}

You are given: what their manager wrote before the test, the blueprint, every item they were served with its key and their answer, the per-area provisional levels the adaptive test arrived at, an integrity summary, and the curriculum they can be assigned.

How to judge:

- **Cite evidence.** Every area judgement lists the item ids that support it. A claim with no item behind it does not belong in the report.
- **The provisional levels are a starting point, not an answer.** They come from a staircase that stops early by design. If the answers show something the staircase missed — a right answer for the wrong reason, a wrong answer that was clearly a misread — say so and adjust.
- **Say where the notes were wrong.** The manager's notes are a hypothesis. notesVsReality states plainly where the results agree and where they do not. "The notes describe X as a weakness; the answers do not support that" is exactly the kind of sentence that makes this useful.
- **Integrity is reported separately and never changes a skill score.** Warnings are evidence for a human to weigh. If someone was flagged and also answered well, say both. Deciding on a re-test is the super admin's job, not yours.
- **Confidence is honest.** An area with two items answered is "low", however clear the pattern looked.

How to build the plan:

- Only topic ids from the curriculum digest. Anything else is dropped by the server, which silently shrinks the plan.
- Order matters: earlier topics should make later ones easier.
- **Skip what they have demonstrated.** A plan that includes everything is not a plan. Use skipRationale to say which modules you skipped and why — that is how the admin checks your reasoning.
- Include prerequisites. If you assign an advanced topic in a module, assign what it depends on unless the answers show they already have it.
- milestones is a small subset worth emphasising, not a second copy of the plan.
- estimatedHours is your own estimate of the work, and should be realistic enough to plan around.

Two audiences, two texts:

- \`summary\` is for their manager: direct, specific, including what is weak.
- \`learnerSummary\` is for the learner: their strengths first, then what to focus on and why it is worth their time. It must not mention integrity warnings or quote the manager's notes. Write it as if they will read it, because they will.`;

export interface EvaluationInput {
  displayName: string;
  roleTitle: string | null;
  yearsExperience: number | null;
  adminNotes: string;
  claimedSkills: { area: string; level: number; note?: string }[];
  blueprintSummary: string;
  areas: {
    name: string;
    hypothesisLevel: number;
    rationale: string;
    provisionalLevel: number | null;
    itemsAnswered: number;
  }[];
  items: {
    id: string;
    area: string;
    kind: string;
    difficulty: number;
    prompt: string;
    options?: string[];
    correct?: string;
    response: string;
    autoScore: number | null;
    aiScore: number | null;
    aiFeedback: string | null;
    timeMs: number | null;
    rationale: string;
  }[];
  integrity: { byType: Record<string, number>; hard: number; soft: number; terminated: boolean };
  digest: { id: string; title: string; level: string; module: string; track: string }[];
}

export function buildEvaluationUser(input: EvaluationInput): string {
  const skills = input.claimedSkills.length
    ? input.claimedSkills.map((s) => `- ${s.area}: ${s.level}/5${s.note ? ` (${s.note})` : ""}`).join("\n")
    : "- none recorded";

  const areas = input.areas
    .map(
      (a) =>
        `- ${a.name}: expected ${a.hypothesisLevel}/5, the test arrived at ${a.provisionalLevel ?? "no reading"}/5 over ${a.itemsAnswered} item(s). Why it was tested: ${a.rationale}`,
    )
    .join("\n");

  const items = input.items
    .map((item) => {
      const lines = [
        `#### Item ${item.id} — ${item.area}, ${item.kind}, difficulty ${item.difficulty}/5`,
        item.prompt.slice(0, 1200),
      ];
      if (item.options?.length) lines.push(`Options: ${item.options.map((o, i) => `[${i}] ${o}`).join(" | ")}`);
      if (item.correct) lines.push(`Correct: ${item.correct}`);
      lines.push(`Their answer: ${item.response || "(no answer)"}`);
      if (item.autoScore !== null) lines.push(`Auto score: ${(item.autoScore / 100).toFixed(2)}`);
      if (item.aiScore !== null) lines.push(`Rubric score: ${(item.aiScore / 100).toFixed(2)} — ${item.aiFeedback ?? ""}`);
      if (item.timeMs !== null) lines.push(`Time taken: ${Math.round(item.timeMs / 1000)}s`);
      lines.push(`What a correct answer shows: ${item.rationale}`);
      return lines.join("\n");
    })
    .join("\n\n");

  const integrityLines = Object.entries(input.integrity.byType)
    .map(([type, count]) => `- ${type}: ${count}`)
    .join("\n");

  const digest = input.digest.map((t) => `- ${t.id} · ${t.title} (${t.level}) · ${t.track} / ${t.module}`).join("\n");

  return `## The person

Name: ${input.displayName}
Role: ${input.roleTitle ?? "not recorded"}
Years of experience: ${input.yearsExperience ?? "not recorded"}

### What their manager wrote, before the test

${input.adminNotes.trim() || "(no notes were written)"}

### Skills their manager estimated

${skills}

## The assessment

${input.blueprintSummary}

### Areas and where the adaptive test landed

${areas}

### Every item they were served

${items}

## Integrity

${input.integrity.terminated ? "**The assessment was terminated after repeated warnings.** Their answers up to that point are above.\n" : ""}Hard warnings: ${input.integrity.hard} · soft warnings: ${input.integrity.soft}
${integrityLines || "- none"}

## Curriculum they can be assigned

Use only these topic ids in the plan.

${digest}

Produce the evaluation.`;
}

/** Grading the written answers against their rubrics (§11.1 step 1). */
export const EXPLAIN_GRADER_SYSTEM = `You grade written answers against a rubric.

For each answer, decide which rubric points it actually hits. A point is hit when the answer says the thing, not when it gestures at the area. Then give a score from 0 to 1 as the weighted fraction of points hit, and one line of feedback naming the strongest and weakest part.

Be neither generous nor harsh. A confident answer that misses the mechanism scores low; a hesitant answer that names it scores well. Length is not quality.`;

export function buildExplainGraderUser(
  items: { id: string; prompt: string; answer: string; rubric: { point: string; weight: number }[] }[],
): string {
  return items
    .map(
      (item) =>
        `### ${item.id}\n\nQuestion:\n${item.prompt}\n\nRubric:\n${item.rubric
          .map((r, i) => `[${i}] (${r.weight}) ${r.point}`)
          .join("\n")}\n\nTheir answer:\n${item.answer || "(no answer given)"}`,
    )
    .join("\n\n---\n\n");
}
