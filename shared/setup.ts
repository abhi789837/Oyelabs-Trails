import { z } from "zod";

import { goalInputSchema, MAX_GOALS, type LearnerGoal } from "./goals";
import { intentsFieldsSchema, type Intent } from "./intents";

/**
 * The admin's Setup screen (v4 Phase 3): one model for who a learner is and what they are for.
 *
 * Priorities are a 5-stop slider per skill. Three places need to agree on what a slider value
 * means, so the mapping lives here and nowhere else:
 *
 * - the **path** (Critical and High are "Do it now", every one of them gets a course),
 * - the **assessment** (about 60% of questions go to Critical/High skills, asked first),
 * - the **weekly plan** lanes.
 */

export const SLIDER_VALUES = [1, 2, 3, 4, 5] as const;
export type Slider = (typeof SLIDER_VALUES)[number];
export const sliderSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);

export const SLIDER_LABELS: Record<Slider, string> = {
  1: "Optional",
  2: "Low",
  3: "Medium",
  4: "High",
  5: "Critical",
};

export const DEFAULT_SLIDER: Slider = 3;

/** The three-way priority the rest of the system speaks. Critical and High are both "high". */
export type PriorityBucket = "high" | "medium" | "low";

export function sliderToPriority(slider: number): PriorityBucket {
  if (slider >= 4) return "high";
  if (slider === 3) return "medium";
  return "low";
}

/** For data that only ever knew three levels (`learner_targets`, `must_have`). */
export function priorityToSlider(priority: PriorityBucket): Slider {
  return priority === "high" ? 4 : priority === "medium" ? 3 : 2;
}

/** The lane label used on the path and the plan: "Do it now" is Critical + High. */
export const BUCKET_LABELS: Record<PriorityBucket, string> = { high: "High", medium: "Medium", low: "Low" };

export interface PriorityEntry {
  skillId: string;
  skillName: string;
  slider: Slider;
  /** Selection order. Breaks ties between equal sliders; never overrides a slider. */
  position: number;
}

/**
 * Highest slider first; equal sliders keep the order they were picked in. The canonical order —
 * the Setup screen shows it, the path follows it, the assessment asks in it.
 */
export function sortPriorities<T extends { slider: number; position: number }>(entries: readonly T[]): T[] {
  return [...entries].sort((a, b) => b.slider - a.slider || a.position - b.position);
}

export const EXPERIENCE_BANDS = ["0", "1-2", "3-5", "6+"] as const;
export const experienceBandSchema = z.enum(EXPERIENCE_BANDS);
export type ExperienceBand = z.infer<typeof experienceBandSchema>;

export const EXPERIENCE_LABELS: Record<ExperienceBand, string> = {
  "0": "0 years",
  "1-2": "1–2 years",
  "3-5": "3–5 years",
  "6+": "6+ years",
};

/** The level chips are pre-filled from experience; the admin can change them. */
export function levelFromExperience(band: ExperienceBand): Slider {
  return band === "0" ? 1 : band === "1-2" ? 2 : band === "3-5" ? 3 : 4;
}

export function experienceBandFromYears(years: number | null): ExperienceBand | null {
  if (years == null) return null;
  if (years < 1) return "0";
  if (years <= 2) return "1-2";
  if (years <= 5) return "3-5";
  return "6+";
}

/** A representative number of years for a band, for code that still reads `years_experience`. */
export function yearsFromBand(band: ExperienceBand | null): number | null {
  return band == null ? null : band === "0" ? 0 : band === "1-2" ? 2 : band === "3-5" ? 4 : 7;
}

// ---------------------------------------------------------------------------
// The request and the stored shape
// ---------------------------------------------------------------------------

export const MAX_PRIORITIES = 40;
export const DEFAULT_HOURS_PER_WEEK = 15;

export const setupAdvancedSchema = z.object({
  weekStartsMonday: z.boolean().default(false),
  /** Weeks until the path should be done. Null = no deadline. */
  deadlineWeeks: z.number().int().min(1).max(104).nullable().default(null),
  /** How many courses one path build may generate with AI. */
  courseCap: z.number().int().min(0).max(20).default(5),
  /** Legacy (pre-v4.4) per-learner switch. Kept and saved, but no longer decides anything. */
  autoPublish: z.boolean().default(false),
  /**
   * v4.4: publish this learner's new courses that pass the quality check. Null = follow the global
   * setting (`builder.auto_publish`, on by default). Omitted = keep what is stored.
   */
  autoPublishOverride: z.enum(["on", "off"]).nullable().optional(),
  /** v4.1: how much of the assessment the AI writes fresh (see shared/personalise.ts). */
  personalisation: z.enum(["high", "balanced", "low"]).default("balanced"),
  /** v4.3: add "Suggested next" goals without the admin's click. Off by default. */
  autoAddSuggestions: z.boolean().default(false),
});
export type SetupAdvanced = z.infer<typeof setupAdvancedSchema>;

export const setupSchema = z.object({
  departmentId: z.string().min(1).max(48),
  trackId: z.string().min(1).max(64).nullable().default(null),
  stackIds: z.array(z.string().min(1).max(64)).max(30).default([]),
  experienceBand: experienceBandSchema.nullable().default(null),
  level: sliderSchema.nullable().default(null),
  /** In the order the admin picked them. The server re-sorts by slider, stable on this order. */
  priorities: z
    .array(z.object({ skillId: z.string().min(1).max(80), slider: sliderSchema }))
    .max(MAX_PRIORITIES)
    .default([]),
  skip: z.array(z.string().min(1).max(80)).max(MAX_PRIORITIES).default([]),
  hoursPerWeek: z.number().int().min(1).max(60).default(DEFAULT_HOURS_PER_WEEK),
  advanced: setupAdvancedSchema.default({ weekStartsMonday: false, deadlineWeeks: null, courseCap: 5, autoPublish: false, autoPublishOverride: null, personalisation: "balanced", autoAddSuggestions: false }),
  /**
   * v4.1: "About this person and what you want" — the admin's own words, which the AI reads to plan
   * the assessment. Stored as the profile's notes. Omitted = leave the notes as they are.
   */
  description: z.string().max(2000).optional(),
  /**
   * v4.3: the "What should they be able to do?" entries. When present, the skill priorities are
   * derived from them (D2) and `priorities` is ignored. Omitted = a v4.2 client: `priorities` is
   * saved as before and becomes the learner's skill goals.
   */
  goals: z.array(goalInputSchema).max(MAX_GOALS).optional(),
  /**
   * v4.4: the intents Suggest read from `description` (each quoting its phrase), and any Unsure
   * still open. A save with an open Unsure, or with intents that leave a phrase of the description
   * uncovered, is refused (400). Omitted = keep the saved intents when the description is unchanged.
   */
  ...intentsFieldsSchema.shape,
});
export type SetupInput = z.infer<typeof setupSchema>;

export const saveSetupRequestSchema = setupSchema.extend({
  /** Save, then issue the assessment — in that order, so it is built from what was just saved. */
  assign: z.boolean().default(false),
});
export type SaveSetupRequest = z.infer<typeof saveSetupRequestSchema>;

export interface LearnerSetup {
  departmentId: string;
  trackId: string | null;
  stackIds: string[];
  experienceBand: ExperienceBand | null;
  level: Slider | null;
  /** Sorted: slider desc, then selection order. */
  priorities: PriorityEntry[];
  skip: { skillId: string; skillName: string }[];
  hoursPerWeek: number;
  advanced: SetupAdvanced;
  description: string;
  /** v4.3: the goals the priorities are derived from, in order. */
  goals: LearnerGoal[];
  /** v4.4: the intents read from the description (empty before v4.4 or without Suggest). */
  intents: Intent[];
}

// ---------------------------------------------------------------------------
// The assessment mix — shared by the Setup summary and the assembler
// ---------------------------------------------------------------------------

/** v4.3: at most this many immediate prerequisites of Critical/High goals are probed. */
export const MAX_PROBES = 3;

/**
 * v4.3 Phase 2b: the goal blueprint's mix. The focus/other split comes from the goal-derived
 * priorities as before; the basics group is the prerequisite probes (immediate prerequisites of the
 * Critical and High goals: the "missing link" candidates) followed by the role's core skills, and
 * each of them gets at least one question. Same 25 items and 18/7 split.
 */
export function planBlueprintMix(priorities: readonly MixSkill[], core: readonly MixSkill[], probes: readonly MixSkill[] = [], intents: readonly IntentSlotGroup[] = []): AssessmentMix {
  const seen = new Set(priorities.map((p) => p.skillId));
  const basics: MixSkill[] = [];
  for (const skill of [...probes.slice(0, MAX_PROBES), ...core]) {
    if (seen.has(skill.skillId)) continue;
    seen.add(skill.skillId);
    basics.push({ ...skill, slider: 0 });
  }
  return ensureIntentSlots(planAssessmentMix(priorities, basics, ASSESSMENT_TOTAL, { basicsMin: basics.length }), intents);
}

/**
 * v4.4: one description intent and the skills that can stand for it in the test, best first
 * (current_role: the core skills). `group` is where a new line goes when one has to be added.
 */
export interface IntentSlotGroup {
  intentId: string;
  skills: MixSkill[];
  group: MixGroup;
}

/**
 * v4.4 guarantee, enforced in code: every intent of the description gets at least one question on
 * one of its skills. An intent with none takes one question from the biggest line (never below
 * one, so nothing else loses its only question), on its first skill. The total (25), the hands-on
 * and multiple-choice totals (18/7) and MAX_PER_SKILL are unchanged.
 */
export function ensureIntentSlots(mix: AssessmentMix, intents: readonly IntentSlotGroup[]): AssessmentMix {
  if (intents.length === 0) return mix;
  const lines = mix.lines.map((l) => ({ ...l }));
  for (const intent of intents) {
    if (intent.skills.length === 0) continue;
    if (lines.some((l) => l.count > 0 && intent.skills.some((s) => s.skillId === l.skillId))) continue;
    const donor = [...lines].filter((l) => l.count > 1).sort((a, b) => b.count - a.count || b.handsOn - a.handsOn)[0];
    if (!donor) continue;
    donor.count -= 1;
    const handsOn = donor.handsOn > 0;
    if (handsOn) donor.handsOn -= 1;
    else donor.mcq -= 1;
    const skill = intent.skills[0]!;
    const line: MixLine = { skillId: skill.skillId, skillName: skill.skillName, group: intent.group, count: 1, handsOn: handsOn ? 1 : 0, mcq: handsOn ? 0 : 1 };
    // Asking order: focus, other, basics. The new line goes at the end of its group.
    const order: MixGroup[] = ["focus", "other", "basics"];
    const at = lines.findIndex((l) => order.indexOf(l.group) > order.indexOf(intent.group));
    if (at < 0) lines.push(line);
    else lines.splice(at, 0, line);
  }
  return { ...mix, lines };
}

export const ASSESSMENT_TOTAL = 25;
export const ASSESSMENT_HANDS_ON = 18;
export const ASSESSMENT_MCQ = 7;
export const ASSESSMENT_TARGET_MINUTES = 30;
export const ASSESSMENT_MAX_MINUTES = 50;
/** Never more than this many questions on one skill, so one Critical pick cannot be the whole test. */
export const MAX_PER_SKILL = 8;

/** Share of the 25 questions per group, before redistribution. Sums to ASSESSMENT_TOTAL. */
const GROUP_SHARE = { focus: 15, other: 6, basics: 4 } as const;

export type MixGroup = "focus" | "other" | "basics";

export interface MixSkill {
  skillId: string;
  skillName: string;
  /** For `basics`, the track/stack fundamentals skill; slider is irrelevant there (use 0). */
  slider: number;
}

export interface MixLine {
  skillId: string;
  skillName: string;
  group: MixGroup;
  count: number;
  handsOn: number;
  mcq: number;
}

export interface AssessmentMix {
  lines: MixLine[];
  total: number;
  handsOn: number;
  mcq: number;
  targetMinutes: number;
  maxMinutes: number;
}

/**
 * Splits 25 questions across the admin's priorities and the learner's own-stack basics.
 *
 * - About 60% on Critical/High ("focus"), 25% on Medium/Low/Optional ("other"), 15% on basics.
 * - An empty group gives its share away, focus first, so an admin who picked only High skills
 *   gets a test about them rather than a padded one.
 * - Every listed skill gets at least one question while there are questions to give; inside a
 *   group, higher sliders get the extras first; no skill gets more than MAX_PER_SKILL.
 * - Lines come back in asking order: focus (slider order), then other, then basics.
 * - Hands-on vs multiple choice is 18:7 overall, MCQs spread one per skill, biggest first.
 */
export function planAssessmentMix(
  priorities: readonly MixSkill[],
  basics: readonly MixSkill[],
  total = ASSESSMENT_TOTAL,
  /**
   * v4.3: `basicsMin` raises the basics share so that many basics each get a question (the goal
   * blueprint's core skills plus prerequisite probes), taken from focus, then other, never below
   * one question per listed priority.
   */
  options: { basicsMin?: number } = {},
): AssessmentMix {
  const ordered = sortPriorities(priorities.map((p, position) => ({ ...p, position })));
  const groups: Record<MixGroup, MixSkill[]> = {
    focus: ordered.filter((p) => p.slider >= 4),
    other: ordered.filter((p) => p.slider < 4),
    basics: [...basics],
  };

  const scale = total / ASSESSMENT_TOTAL;
  const share: Record<MixGroup, number> = {
    focus: Math.round(GROUP_SHARE.focus * scale),
    other: Math.round(GROUP_SHARE.other * scale),
    basics: 0,
  };
  share.basics = total - share.focus - share.other;

  // Give away the share of an empty group: focus ← other ← basics, in that preference.
  const order: MixGroup[] = ["focus", "other", "basics"];
  for (const group of order) {
    if (groups[group].length > 0 || share[group] === 0) continue;
    const receiver = order.find((g) => g !== group && groups[g].length > 0);
    if (!receiver) continue;
    share[receiver] += share[group];
    share[group] = 0;
  }

  // v4.3: room for every basics skill the blueprint lists (core skills and prerequisite probes).
  if (options.basicsMin && groups.basics.length > 0) {
    let want = Math.min(options.basicsMin, groups.basics.length, total - groups.focus.length - groups.other.length) - share.basics;
    while (want > 0) {
      if (share.focus > groups.focus.length) share.focus -= 1;
      else if (share.other > groups.other.length) share.other -= 1;
      else break;
      share.basics += 1;
      want -= 1;
    }
  }

  // Every listed skill gets one question: a short group borrows from basics (keeping one basics
  // question when there are basics), then from the other priority group's surplus.
  for (const group of ["focus", "other"] as const) {
    let deficit = groups[group].length - share[group];
    const otherGroup = group === "focus" ? "other" : "focus";
    while (deficit > 0) {
      if (share.basics > Math.min(1, groups.basics.length)) share.basics -= 1;
      else if (share[otherGroup] > groups[otherGroup].length) share[otherGroup] -= 1;
      else break;
      share[group] += 1;
      deficit -= 1;
    }
  }

  const counts = new Map<string, { skill: MixSkill; group: MixGroup; count: number }>();
  let overflow = 0;
  for (const group of order) {
    const list = groups[group];
    let left = share[group] + (group === "basics" ? overflow : 0);
    if (list.length === 0) continue;
    for (const skill of list) counts.set(`${group}:${skill.skillId}`, { skill, group, count: 0 });
    // Round-robin, highest slider first, so the extras land where the admin cares most.
    let progressed = true;
    while (left > 0 && progressed) {
      progressed = false;
      for (const skill of list) {
        if (left === 0) break;
        const entry = counts.get(`${group}:${skill.skillId}`)!;
        if (entry.count >= MAX_PER_SKILL) continue;
        entry.count += 1;
        left -= 1;
        progressed = true;
      }
    }
    if (group !== "basics") overflow += left;
  }

  // Anything that still did not fit (every skill capped) goes back to focus/other uncapped.
  let assigned = [...counts.values()].reduce((sum, e) => sum + e.count, 0);
  const all = [...counts.values()];
  for (let i = 0; assigned < total && all.length > 0; i += 1) {
    const roomy = all.filter((e) => e.count < MAX_PER_SKILL);
    const pool = roomy.length > 0 ? roomy : all;
    pool[i % pool.length].count += 1;
    assigned += 1;
  }

  const lines: MixLine[] = all
    .filter((e) => e.count > 0)
    .map((e) => ({ skillId: e.skill.skillId, skillName: e.skill.skillName, group: e.group, count: e.count, handsOn: e.count, mcq: 0 }));

  const totalAssigned = lines.reduce((sum, l) => sum + l.count, 0);
  let mcqLeft = Math.round((ASSESSMENT_MCQ / ASSESSMENT_TOTAL) * totalAssigned);
  const bySize = [...lines].sort((a, b) => b.count - a.count);
  // Same sizes, lowest priority first (lines are in asking order): when a skill's only question has
  // to become multiple choice, a Critical or High skill keeps its hands-on one longest.
  const lowestFirst = [...lines].reverse().sort((a, b) => b.count - a.count);
  // First pass keeps at least one hands-on question per skill; the second may use the last one.
  for (const floor of [1, 0]) {
    let moved = true;
    while (mcqLeft > 0 && moved) {
      moved = false;
      for (const line of floor === 1 ? bySize : lowestFirst) {
        if (mcqLeft === 0) break;
        if (line.handsOn > floor && line.mcq < Math.ceil(line.count / 2)) {
          line.handsOn -= 1;
          line.mcq += 1;
          mcqLeft -= 1;
          moved = true;
        }
      }
    }
  }

  return {
    lines,
    total: totalAssigned,
    handsOn: lines.reduce((sum, l) => sum + l.handsOn, 0),
    mcq: lines.reduce((sum, l) => sum + l.mcq, 0),
    targetMinutes: ASSESSMENT_TARGET_MINUTES,
    maxMinutes: ASSESSMENT_MAX_MINUTES,
  };
}
