import {
  DO_NOW_SHARE,
  DO_NOW_TARGET_ITEMS,
  MUST_KNOW_MINUTES,
  SUMMARY_MAX_WORDS,
  type WeeklyPlanDraft,
} from "../../../../shared/weeklyPlan";

/**
 * The weekly plan prompt.
 *
 * ## Why the model revises rather than chooses
 *
 * The obvious design is to hand over the whole library and ask for a week back. It is also the wrong
 * one. Choosing twelve lessons out of two hundred by id is exactly the task a language model is worst
 * at — it drops ids, invents plausible-looking ones, and silently omits the admin's High priorities —
 * and every one of those failures costs a learner a week. So the deterministic builder chooses, and
 * the model is given the result to **revise**: it may move an item between lanes, reorder within a
 * lane, drop something that does not belong, and it writes the two pieces of prose that genuinely
 * need writing.
 *
 * What comes back is still validated against the same schema and still run through `enforce`, and if
 * the revision is worse than what went in, the built version is kept. The model gets to improve the
 * week; it does not get to break it.
 */
export const WEEK_PLAN_PROMPT_VERSION = "week-plan/1";

export const WEEK_PLAN_SYSTEM = `You shape one week of learning for one engineer, and you write the two short pieces of prose that go with it.

You are given a week that has already been assembled from the admin's priorities and the learner's
assessment. Your job is to improve it, not to replace it.

## What you may change

- Move an item to a different lane when it is clearly in the wrong one.
- Reorder items within a lane so the week reads as a sensible sequence.
- Drop an item that does not belong in this week at all.
- Write \`summary\`, and write \`roadmapNarrative\`.
- Write a better one-line \`reason\` for an item where the given one is vague.

## What you may not change

- **Never invent an id.** Every \`topicId\` and \`lessonId\` you return must appear in the candidate
  list you were given. An id that is not on that list is discarded, and the learner loses the lesson.
- Never add a lesson that is not on that list, however obviously useful it seems. You cannot see
  whether this learner has access to it.
- Never move an admin High-priority item out of \`doNow\`. A person decided that; you did not.
- Never change \`minutes\`. It is the library's number, not an estimate.
- Never put the same item in two lanes.

## The lanes

- \`doNow\` — blocking work. The admin's High must-haves where the assessment found a real gap.
  ${DO_NOW_TARGET_ITEMS.min}–${DO_NOW_TARGET_ITEMS.max} items, and never more than ${Math.round(DO_NOW_SHARE * 100)}% of the week's minutes.
- \`mustKnow\` — short prerequisites and baseline essentials that the other lanes depend on. Each item
  ${MUST_KNOW_MINUTES.min}–${MUST_KNOW_MINUTES.max} minutes. A compact checklist, not a course. If an item here unblocks
  something in another lane, name it in that item's \`dependsOn\`.
- \`medium\` — Medium-weight must-haves, and strong gaps the assessment found on its own.
- \`low\` — genuinely skippable. The learner may not reach these and that is fine.

## The prose

\`summary\`: at most ${SUMMARY_MAX_WORDS} words, three sentences, second person.
One sentence on what they are already good at. One on what this week is about. One on where they will
be by the end of it. No preamble, no "in this week you will", no list of topic names.

\`roadmapNarrative\`: the longer view — where this week sits in the months ahead. Two or three short
paragraphs. This is the only place a long answer is wanted.

\`reason\`: one line per item, under 200 characters, in the shape "Admin: DevOps · High · you missed 4
of 5 deployment questions". State the cause, not the benefit.

\`nextWeekPreview\`: 3–5 lesson titles from the candidate list that are *not* in this week.`;

export interface WeekPlanContext {
  targetRole: string;
  mustHave: { skill: string; weight: string }[];
  skip: string[];
  hoursPerWeek: number;
  daysPerWeek: number;
  strengths: string[];
  gaps: { skill: string; severity: number; source: string; evidence: string }[];
  /** Every lesson the learner may be given. The model may only cite ids from here. */
  candidates: { key: string; kind: "topic" | "lesson"; title: string; context: string; minutes: number; level: string }[];
  /** What the deterministic builder produced, for the model to revise. */
  built: WeeklyPlanDraft;
  /** Items carried from last week, which must not be dropped. */
  carried: string[];
}

export function buildWeekPlanUser(context: WeekPlanContext): string {
  const must = context.mustHave.length
    ? context.mustHave.map((entry) => `- ${entry.skill} — ${entry.weight}`).join("\n")
    : "- (none set)";

  const gaps = context.gaps.length
    ? context.gaps
        .map((gap) => `- ${gap.skill} · severity ${gap.severity.toFixed(2)} · ${gap.source} · ${gap.evidence}`)
        .join("\n")
    : "- (no assessment gaps recorded)";

  /* Capped. The whole library can be hundreds of lessons and the model only needs to see what it
     could plausibly move into this week — the built draft plus what is next in line. */
  const candidates = context.candidates
    .slice(0, 80)
    .map((c) => `- ${c.key} · ${c.kind} · ${c.title} · ${c.context} · ${c.minutes} min · ${c.level}`)
    .join("\n");

  return `## The learner

Target role: ${context.targetRole || "(not stated)"}
Time available: ${context.hoursPerWeek} hours per week, over ${context.daysPerWeek} days.
Already strong on: ${context.strengths.join(", ") || "(nothing recorded yet)"}

### Admin must-have skills, in priority order

${must}

### Skills the admin asked us to skip

${context.skip.length ? context.skip.map((s) => `- ${s}`).join("\n") : "- (none)"}

### Gaps from the assessment

${gaps}

## Candidate lessons — the only ids you may use

${candidates}

## Items carried over from last week — these must stay in the week

${context.carried.length ? context.carried.map((key) => `- ${key}`).join("\n") : "- (none)"}

## The week as assembled

Week ${context.built.weekNumber}, ${context.built.startDate} to ${context.built.endDate}.
Budget: ${context.built.weeklyBudgetMinutes} minutes.

\`\`\`json
${JSON.stringify(context.built.lanes, null, 2)}
\`\`\`

Return the same structure, revised, with \`summary\`, \`roadmapNarrative\` and \`nextWeekPreview\` written.`;
}
