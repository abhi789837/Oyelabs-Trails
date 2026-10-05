import { z } from "zod";

import type { AssessmentMix, MixGroup } from "./setup";

/**
 * AI-personalised assessments (v4.1 Phase 1).
 *
 * A model reads the admin's setup and free-text description and proposes 25 slots; code then
 * enforces the allocation rules on that proposal, reuses validated bank items where they fit and
 * has the model write the rest. Nothing the model says can change the split, add a skipped skill or
 * break the time budget — those are checked after it answers.
 */

export const PERSONALISATION_LEVELS = ["high", "balanced", "low"] as const;
export const personalisationSchema = z.enum(PERSONALISATION_LEVELS);
export type Personalisation = z.infer<typeof personalisationSchema>;

export const PERSONALISATION_LABELS: Record<Personalisation, string> = {
  high: "High — mostly written for this person",
  balanced: "Balanced — reuse up to ~40% from the bank",
  low: "Low — mostly from the bank",
};

/** The most of the 25 that may come from the bank, per level. */
export const REUSE_RATIO: Record<Personalisation, number> = { high: 0.2, balanced: 0.4, low: 0.8 };

export const DESCRIPTION_MAX = 600;

/** What the subtype of a hands-on slot may be. Coding for engineering; task kinds for everyone. */
export const SLOT_SUBTYPES = ["code", "write", "rank", "calculate", "scenario", "spot", "excel", "allocate", "sim", "categorize", "form", "roleplay", "terminal", "speak", "mcq-code", "mcq-text"] as const;
export const slotSubtypeSchema = z.enum(SLOT_SUBTYPES);
export type SlotSubtype = z.infer<typeof slotSubtypeSchema>;

export interface Slot {
  index: number;
  skillId: string;
  skillName: string;
  group: MixGroup;
  type: "coding" | "task" | "mcq";
  subtype: SlotSubtype;
  difficulty: number;
  /** The ceiling this item must fit (seconds). */
  targetSec: number;
  /** A short scenario in the learner's own context, from the description. */
  hint: string;
  /**
   * v4.3: this slot tests a practical-case goal as a task ("resolve a merge conflict"): the case id.
   * Its subtype is the case capstone's task kind, and the capstone is the model the item follows.
   */
  outcomeCaseId?: string;
}

/** What the model returns when it reads a setup (validated with zod before use). */
export const understandingResponseSchema = z.object({
  intent: z.array(z.string().trim().min(3).max(160)).min(1).max(5),
  themes: z.array(z.string().trim().min(2).max(40)).max(8),
  slots: z
    .array(
      z.object({
        skillId: z.string().min(1).max(80),
        kind: z.enum(["handsOn", "mcq"]),
        subtype: slotSubtypeSchema,
        difficulty: z.number().int().min(1).max(5),
        hint: z.string().trim().max(160).default(""),
      }),
    )
    .max(40),
});
export type UnderstandingResponse = z.infer<typeof understandingResponseSchema>;

export interface Understanding {
  intent: string[];
  themes: string[];
  slots: Slot[];
  /** "Excel trackers: 4 hands-on", grouped by skill, for the summary card. */
  split: { skillName: string; handsOn: number; mcq: number }[];
  /** `ai` when the model read it; `rules` when it could not and the split comes from sliders alone. */
  source: "ai" | "rules";
  createdAt: number;
}

/**
 * Turns whatever the model proposed into exactly the slots the rules allow.
 *
 * - Counts per skill and per type come from the slider mix (`planAssessmentMix`): ~60% on
 *   Critical/High asked first, ~25% Medium/Low, ~15% track basics. The model cannot move them.
 * - A skipped skill or one outside the mix never gets a slot.
 * - Within a skill, the model's slots supply subtype, difficulty and scenario hint, in its order;
 *   missing ones are filled with the skill's default subtype and the level's starting difficulty.
 * - Difficulty is clamped to the band the learner's level allows.
 */
export function enforceBlueprint(input: {
  proposed: UnderstandingResponse["slots"];
  mix: AssessmentMix;
  skip: readonly string[];
  skillNames: ReadonlyMap<string, string>;
  format: "coding" | "tasks";
  /** Difficulties in the order the learner should meet them (from the assembler). */
  difficultyOrder: readonly number[];
  /** `nth`: which of the skill's hands-on slots this is (soft skills rotate their kinds). */
  defaultHandsOn: (skillId: string, nth?: number) => SlotSubtype;
  defaultMcq: (skillId: string) => SlotSubtype;
  /** v4.2: whether a skill may use a subtype (role-play only for meeting and client skills). */
  allowSubtype?: (skillId: string, subtype: SlotSubtype) => boolean;
  /** v4.4: what a Speak slot becomes once MAX_SPEAK_SLOTS are used (default "write"). */
  afterSpeakCap?: (skillId: string) => SlotSubtype;
}): Slot[] {
  const skip = new Set(input.skip);
  const start = input.difficultyOrder[0] ?? 2;
  const band = new Set(input.difficultyOrder.slice(0, 3));
  const clamp = (d: number) => (band.has(d) ? d : Math.min(Math.max(d, Math.min(...band)), Math.max(...band)));
  const slots: Slot[] = [];
  const usable = input.proposed.filter((p) => !skip.has(p.skillId));
  let speakSlots = 0;

  for (const line of shiftTowardEmphasis(input.mix.lines, usable)) {
    if (skip.has(line.skillId)) continue;
    const mine = usable.filter((p) => p.skillId === line.skillId);
    const handsOnProposals = mine.filter((p) => p.kind === "handsOn" && !p.subtype.startsWith("mcq"));
    const mcqProposals = mine.filter((p) => p.kind === "mcq" || p.subtype.startsWith("mcq"));
    const name = input.skillNames.get(line.skillId) ?? line.skillName;
    for (let i = 0; i < line.handsOn; i += 1) {
      const p = handsOnProposals[i];
      let subtype: SlotSubtype = p?.subtype ?? input.defaultHandsOn(line.skillId, i);
      // A coding department's hands-on is code unless the model chose a task kind; a task
      // department never gets a code slot.
      if (input.format === "tasks" && subtype === "code") subtype = input.defaultHandsOn(line.skillId, i);
      if (input.allowSubtype && !input.allowSubtype(line.skillId, subtype)) subtype = input.defaultHandsOn(line.skillId, i);
      // v4.4: at most MAX_SPEAK_SLOTS spoken answers per assessment; the rest are written.
      if (subtype === "speak") {
        if (speakSlots >= MAX_SPEAK_SLOTS) subtype = input.afterSpeakCap?.(line.skillId) ?? "write";
        else speakSlots += 1;
      }
      // A short client conversation (2-3 typed replies) and a spoken answer (prepare, speak, listen
      // back) get longer slots than other hands-on work.
      const targetSec = subtype === "roleplay" ? ROLEPLAY_SLOT_SEC : subtype === "speak" ? SPEAK_SLOT_SEC : 80;
      slots.push({ index: 0, skillId: line.skillId, skillName: name, group: line.group, type: subtype === "code" ? "coding" : "task", subtype, difficulty: clamp(p?.difficulty ?? start), targetSec, hint: p?.hint ?? "" });
    }
    for (let i = 0; i < line.mcq; i += 1) {
      const p = mcqProposals[i];
      const subtype: SlotSubtype = p && p.subtype.startsWith("mcq") ? p.subtype : input.defaultMcq(line.skillId);
      slots.push({ index: 0, skillId: line.skillId, skillName: name, group: line.group, type: "mcq", subtype, difficulty: clamp(p?.difficulty ?? start), targetSec: 50, hint: p?.hint ?? "" });
    }
  }
  return slots.map((slot, index) => ({ ...slot, index }));
}

/** v4.2: a mini role-play's slot (2-3 replies of ~25 s, plus reading the brief). */
export const ROLEPLAY_SLOT_SEC = 100;

/** v4.4: a Speak item's slot: 20 s to prepare, up to 90 s speaking, a listen back. Counted as hands-on. */
export const SPEAK_SLOT_SEC = 150;
/** v4.4: at most this many Speak items per assessment. */
export const MAX_SPEAK_SLOTS = 2;

/** At most this many hands-on slots move toward what the description stresses. */
export const EMPHASIS_SHIFT_MAX = 3;

/**
 * The sliders fix the split; the description may lean it. When the model proposes more hands-on
 * slots for a skill than the sliders gave it ("weak on client calls" → more meeting tasks), up to
 * EMPHASIS_SHIFT_MAX slots move there, one per emphasised skill, each taken from the lowest-priority
 * skill that still has two or more hands-on slots. Totals never change and no skill drops to zero.
 */
export function shiftTowardEmphasis(lines: readonly AssessmentMix["lines"][number][], proposed: UnderstandingResponse["slots"]): AssessmentMix["lines"] {
  const out = lines.map((l) => ({ ...l }));
  const asked = new Map<string, number>();
  for (const p of proposed) if (p.kind === "handsOn" && !p.subtype.startsWith("mcq")) asked.set(p.skillId, (asked.get(p.skillId) ?? 0) + 1);
  const excess = (l: (typeof out)[number]) => (asked.get(l.skillId) ?? 0) - l.handsOn;
  const receivers = out.filter((l) => excess(l) > 0).sort((a, b) => excess(b) - excess(a));
  const gained = new Set<string>();
  let moved = 0;
  for (const to of receivers) {
    if (moved >= EMPHASIS_SHIFT_MAX) break;
    // Lines are in asking order (focus, other, basics), so the donor search runs from the end.
    const donor = [...out].reverse().find((l) => l !== to && !gained.has(l.skillId) && l.handsOn >= 2 && excess(l) <= 0);
    if (!donor) break;
    donor.handsOn -= 1;
    donor.count -= 1;
    to.handsOn += 1;
    to.count += 1;
    gained.add(to.skillId);
    moved += 1;
  }
  return out;
}

export function splitOf(slots: readonly Slot[]): Understanding["split"] {
  const by = new Map<string, { skillName: string; handsOn: number; mcq: number }>();
  for (const s of slots) {
    const e = by.get(s.skillId) ?? { skillName: s.skillName, handsOn: 0, mcq: 0 };
    if (s.type === "mcq") e.mcq += 1;
    else e.handsOn += 1;
    by.set(s.skillId, e);
  }
  return [...by.values()];
}

/** The input the understanding is a function of. Same hash → reuse the stored understanding. */
export function understandingKey(input: unknown): string {
  const text = JSON.stringify(input);
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36) + text.length.toString(36);
}

// ---------------------------------------------------------------------------
// v4.3 Phase 2b: outcome slots for practical-case goals
// ---------------------------------------------------------------------------

/** An outcome task (a short terminal session, say) gets a longer slot than other hands-on work. */
export const OUTCOME_SLOT_SEC = 180;
/** At most this many case goals get an outcome slot, so the 25 stay a skills assessment. */
export const MAX_OUTCOME_SLOTS = 2;

export interface OutcomeCase {
  caseId: string;
  title: string;
  /** The goal's skills, in goal order. The slot goes to one of them. */
  skillIds: string[];
  skillNames: Record<string, string>;
  /** The capstone task's kind, which the slot's subtype copies (e.g. "terminal"). */
  kind: SlotSubtype;
}

/**
 * Turns one hands-on slot per practical-case goal into an outcome slot: the case's task kind, a
 * longer time ceiling and the case id, so the generator writes a task modelled on the capstone.
 * It takes a hands-on slot of one of the case's skills, or else the last plain hands-on slot (the
 * lowest priority), moved to the case's first skill. Totals, the hands-on/MCQ split and the slot
 * order never change.
 */
export function withOutcomeSlots(slots: readonly Slot[], cases: readonly OutcomeCase[]): Slot[] {
  const out = slots.map((s) => ({ ...s }));
  for (const kase of cases.slice(0, MAX_OUTCOME_SLOTS)) {
    if (out.some((s) => s.outcomeCaseId === kase.caseId)) continue;
    const free = (s: Slot) => s.type !== "mcq" && !s.outcomeCaseId;
    const own = out.find((s) => free(s) && kase.skillIds.includes(s.skillId));
    const slot = own ?? [...out].reverse().find(free);
    if (!slot) continue;
    if (!own) {
      slot.skillId = kase.skillIds[0];
      slot.skillName = kase.skillNames[kase.skillIds[0]] ?? kase.skillIds[0];
    }
    slot.type = "task";
    slot.subtype = kase.kind;
    slot.targetSec = OUTCOME_SLOT_SEC;
    slot.hint = `Outcome: ${kase.title}`.slice(0, 160);
    slot.outcomeCaseId = kase.caseId;
  }
  return out;
}

/** Whole sentences up to `max` words (cut mid-sentence only when the first is longer). */
export function clipSentences(text: string, max: number): string {
  const sentences = text.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/);
  let out = "";
  for (const sentence of sentences) {
    const next = `${out} ${sentence}`.trim();
    if (next.split(" ").length > max) break;
    out = next;
  }
  return out || text.split(/\s+/).slice(0, max).join(" ");
}

/** The words of a short outcome task's question text. */
export const OUTCOME_PROMPT_WORDS = 55;
/** The commands a short terminal outcome task keeps (the capstone has the full session). */
export const OUTCOME_TERMINAL_STEPS = 3;

/**
 * A compact version of a capstone task, sized for one assessment slot: the same situation and
 * kind, a shorter brief and (for a terminal) the first few commands. Used as the model the
 * generator follows, by the mock, and as the fallback item when generation fails, so a case goal
 * is always tested as a task. The capstone itself stays the full, final test.
 */
export function outcomeTaskVariant(task: Readonly<Record<string, unknown>>): Record<string, unknown> {
  const t: Record<string, unknown> = { ...task };
  if (typeof t.title === "string") t.title = `Practice: ${t.title}`.slice(0, 120);
  if (typeof t.prompt === "string") t.prompt = clipSentences(t.prompt, OUTCOME_PROMPT_WORDS);
  if (t.kind === "terminal" && Array.isArray(t.steps)) t.steps = t.steps.slice(0, OUTCOME_TERMINAL_STEPS);
  return t;
}
