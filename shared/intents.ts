import { z } from "zod";

import type { GoalInput } from "./goals";

/**
 * v4.4 Phase 1: nothing in the admin's description gets dropped.
 *
 * Suggest reads the description into **intents**: each one quotes the exact words it came from
 * (`phrase`) and says in plain English what they mean (`statement`). Code, not the model, then
 * checks that every meaningful phrase of the description is covered by an intent
 * (`coverageCheck`). A phrase nothing covers becomes either a mapped intent (the closest catalog
 * item, `autoMapped`) or an **Unsure** question with 2-3 options; Save is blocked until every Unsure
 * is answered. Downstream, `intentCoverage` checks that every intent reached the assessment and the
 * path (or has a reason it did not).
 *
 * Pure and dependency-free (no import of ./setup at runtime: setup imports this file).
 */

export const INTENT_TYPES = ["current_role", "move_role", "improve_area", "case", "constraint"] as const;
export const intentTypeSchema = z.enum(INTENT_TYPES);
export type IntentType = z.infer<typeof intentTypeSchema>;

/** Plain labels, for the "We understood" list. */
export const INTENT_TYPE_LABELS: Record<IntentType, string> = {
  current_role: "Who they are now",
  move_role: "Role to grow into",
  improve_area: "To get better at",
  case: "A real task to master",
  constraint: "Time they have",
};

export const MAX_INTENTS = 16;
export const MAX_INTENT_SKILLS = 12;

export const intentSchema = z.object({
  /** "i1", "i2", … stable within one description. */
  id: z.string().trim().min(1).max(16),
  /** The exact words of the description it came from (checked in code). */
  phrase: z.string().trim().min(1).max(300),
  type: intentTypeSchema,
  /** Plain English: "Become a full-stack developer". */
  statement: z.string().trim().min(1).max(300),
  /** Catalog ids, may include soft skills (`ss-*`). [] only for a constraint or a left-out phrase. */
  skillIds: z.array(z.string().trim().min(1).max(80)).max(MAX_INTENT_SKILLS).default([]),
  bundleId: z.string().max(80).optional(),
  caseId: z.string().max(80).optional(),
  targetLevel: z.number().int().min(1).max(5).default(3),
  /** Suggested priority 1-5; current_role and constraint use 0 (none). */
  slider: z.number().int().min(0).max(5).default(0),
  /** current_role: the job track; move_role: the target track. */
  trackId: z.string().max(64).optional(),
  /** current_role: years of experience. */
  years: z.number().min(0).max(60).optional(),
  constraint: z
    .object({
      hoursPerWeek: z.number().int().min(1).max(60).optional(),
      deadlineWeeks: z.number().int().min(1).max(104).optional(),
    })
    .optional(),
  /** Mapped by code from an uncovered phrase (the closest catalog item), not read by the model. */
  autoMapped: z.boolean().optional(),
  /**
   * `left_out`: the admin answered an Unsure with "Leave it out". The phrase counts as covered (it
   * was a deliberate choice) but makes no goal and no downstream promise.
   */
  status: z.enum(["mapped", "left_out"]).optional(),
});
export type Intent = z.infer<typeof intentSchema>;

export const unsureOptionSchema = z.object({
  label: z.string().trim().min(1).max(160),
  skillIds: z.array(z.string().trim().min(1).max(80)).max(MAX_INTENT_SKILLS).default([]),
  bundleId: z.string().max(80).optional(),
  caseId: z.string().max(80).optional(),
  /** The intent type this option becomes. Default improve_area (case when caseId is set). */
  type: intentTypeSchema.optional(),
  targetLevel: z.number().int().min(1).max(5).optional(),
  /** "Leave it out": the phrase is ignored on purpose. */
  leaveOut: z.boolean().optional(),
});
export type UnsureOption = z.infer<typeof unsureOptionSchema>;

export const unsureSchema = z.object({
  phrase: z.string().trim().min(1).max(300),
  options: z.array(unsureOptionSchema).min(1).max(3),
});
export type Unsure = z.infer<typeof unsureSchema>;

/** The one message every save path shows while an Unsure is open. */
export function unsureMessage(phrase: string): string {
  return `We weren't sure what you meant by '${phrase}'. Pick an option first.`;
}

export const LEAVE_OUT_LABEL = "Leave it out";

// ---------------------------------------------------------------------------
// Phrases and tokens
// ---------------------------------------------------------------------------

/** Whitespace collapsed, ends trimmed: the form every phrase check compares in. */
export function normaliseDescription(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * The exact substring of `description` that `phrase` quotes (case-insensitive, whitespace
 * normalised), in the description's own casing; null when it is not a real quote.
 */
export function groundPhrase(description: string, phrase: string): string | null {
  const d = normaliseDescription(description);
  const p = normaliseDescription(phrase).replace(/^["'“‘]+|["'”’.,;:!?]+$/g, "");
  if (!p) return null;
  const at = d.toLowerCase().indexOf(p.toLowerCase());
  return at < 0 ? null : d.slice(at, at + p.length);
}

/** Every [start, end) of `phrase` in the normalised description, case-insensitive. */
function spansOf(normDescription: string, phrase: string): [number, number][] {
  const hay = normDescription.toLowerCase();
  const p = normaliseDescription(phrase).toLowerCase();
  if (!p) return [];
  const out: [number, number][] = [];
  let at = hay.indexOf(p);
  while (at >= 0) {
    out.push([at, at + p.length]);
    at = hay.indexOf(p, at + 1);
  }
  return out;
}

/**
 * Words that carry no goal on their own: articles, pronouns, helpers, "want him to", generic verbs
 * of change ("improve", "move", "learn"), and experience words (the role intent owns those).
 */
const STOP_WORDS = new Set(
  (
    "a an the and also or but plus with of to in on for at by from into as is are was were be been being am " +
    "he she they them him her his hers their theirs its it we i our ours my me us you your this that these those who which what " +
    "will would should must can could shall may might need needs needed want wants wanted like likes love " +
    "very really just so then than more most some any all both well lot lots bit little much many " +
    "get gets got getting make makes making do does doing did done have has had having able " +
    "move moving moved improve improving improved learn learning become becoming grow growing work working " +
    "start starting focus focusing better upskill develop developing build building strengthen boost polish brush up " +
    "pick take taking transition switch switching shift go going keep help " +
    "year years yr yrs experience experienced exp now currently current someone person guy girl team member " +
    "please also again over about around today tomorrow monday tuesday wednesday thursday friday saturday sunday"
  ).split(" "),
);

/** "skills" → "skill"; short words and "-ss" endings are kept. */
function stem(word: string): string {
  return word.length > 3 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word;
}

interface Token {
  word: string;
  start: number;
  end: number;
}

function contentTokens(text: string, offset = 0): Token[] {
  const out: Token[] = [];
  for (const m of text.matchAll(/[A-Za-z0-9+#]+/g)) {
    const raw = m[0].toLowerCase();
    if (/^\d+$/.test(raw) || STOP_WORDS.has(raw) || STOP_WORDS.has(stem(raw))) continue;
    out.push({ word: stem(raw), start: offset + m.index!, end: offset + m.index! + m[0].length });
  }
  return out;
}

/** Filler a phrase never needs at its start: "and also want him to move…" → "move…". */
const LEADING_FILLER =
  /^(?:and|also|but|plus|then|so|i|we|they|he|she|would like|want(?:s|ed)?|need(?:s|ed)?|should|must|him|her|them|to|be able to|the|a|an)\b[\s,]*/i;

export interface DescriptionPhrase {
  /** Exact substring of the normalised description. */
  text: string;
  start: number;
  end: number;
  /** The whole clause before filler was trimmed ("want him to move to the full stack"). */
  clause: string;
}

/**
 * Splits the description into its meaningful phrases: clauses on `,` `;` `.` `and also` `also`
 * `and` `but` `plus` `+` `&` `while`, each with leading filler removed. A clause with no content
 * word left ("and he should") is not a phrase.
 */
export function descriptionPhrases(description: string): DescriptionPhrase[] {
  const d = normaliseDescription(description);
  const separators = /[,;\n]|\.(?=\s|$)|\s\+\s|\s&\s|\band also\b|\balso\b|\band\b|\bbut\b|\bplus\b|\bwhile\b/gi;
  const out: DescriptionPhrase[] = [];
  let from = 0;
  const push = (start: number, end: number) => {
    let s = start;
    let e = end;
    while (s < e && /[\s"'“”‘’()-]/.test(d[s]!)) s += 1;
    while (e > s && /[\s"'“”‘’().!?:-]/.test(d[e - 1]!)) e -= 1;
    for (;;) {
      const m = LEADING_FILLER.exec(d.slice(s, e));
      if (!m || m[0].length === 0) break;
      s += m[0].length;
    }
    if (e <= s || contentTokens(d.slice(s, e)).length === 0) return;
    out.push({ text: d.slice(s, e), start: s, end: e, clause: d.slice(start, end).trim() });
  };
  for (const m of d.matchAll(separators)) {
    push(from, m.index!);
    from = m.index! + m[0].length;
  }
  push(from, d.length);
  return out;
}

/** True when the intent's phrase still counts toward coverage. */
const counts = (intent: Pick<Intent, "status">) => intent.status !== undefined ? intent.status === "mapped" || intent.status === "left_out" : true;

/**
 * Code, not AI: every meaningful phrase must be covered by a kept intent. A phrase is covered when
 * at least two thirds of its content words fall inside the quoted phrase of some intent (by
 * position in the description, so "frontend" in one intent never covers "frontend testing"
 * somewhere else). Returns the uncovered phrases, exact substrings, in description order.
 */
export function coverageCheck(description: string, intents: readonly Pick<Intent, "phrase" | "status">[]): { uncovered: string[] } {
  const d = normaliseDescription(description);
  const spans = intents.filter(counts).flatMap((i) => spansOf(d, i.phrase));
  const inside = (t: Token) => spans.some(([s, e]) => t.start >= s && t.end <= e);
  const uncovered: string[] = [];
  for (const phrase of descriptionPhrases(d)) {
    const tokens = contentTokens(phrase.text, phrase.start);
    if (tokens.length === 0) continue;
    const missed = tokens.filter((t) => !inside(t)).length;
    if (missed > 0 && missed / tokens.length > 1 / 3) uncovered.push(phrase.text);
  }
  return { uncovered: [...new Set(uncovered)] };
}

/** Share (0..1) of `phrase`'s content words that occur in `text`, after stemming. */
export function wordOverlap(phrase: string, text: string): number {
  const a = contentTokens(phrase).map((t) => t.word);
  if (a.length === 0) return 0;
  const b = new Set(contentTokens(text).map((t) => t.word));
  return a.filter((w) => b.has(w)).length / a.length;
}

/** The content words of a phrase, stemmed (for candidate search). */
export function phraseWords(phrase: string): string[] {
  return contentTokens(phrase).map((t) => t.word);
}

// ---------------------------------------------------------------------------
// Intents → the setup
// ---------------------------------------------------------------------------

type Band = "0" | "1-2" | "3-5" | "6+";
function bandFromYears(years: number | undefined): Band | null {
  if (years == null) return null;
  if (years < 1) return "0";
  if (years <= 2) return "1-2";
  if (years <= 5) return "3-5";
  return "6+";
}

export interface IntentSetup {
  /** One goal per move_role / improve_area / case intent, in intent order, each with `intentId`. */
  goals: (Omit<GoalInput, "id"> & { intentId: string })[];
  /** The current role's track (the first current_role intent that names one). */
  trackId: string | null;
  experienceBand: Band | null;
  years: number | null;
  hoursPerWeek: number | null;
  deadlineWeeks: number | null;
}

const clampSlider = (n: number) => Math.min(5, Math.max(1, Math.round(n || 3)));

/**
 * What the intents mean for the setup:
 * - move_role and improve_area → one `text` goal each (originalText = the phrase, outcome = the
 *   statement, skillIds = the bundle's skills);
 * - case → a `case` goal;
 * - current_role → the track and experience (its core skills come from the track), not a goal;
 * - constraint → hours a week or a deadline.
 * Left-out intents and intents without skills make nothing.
 */
export function intentsToGoals(intents: readonly Intent[]): IntentSetup {
  const out: IntentSetup = { goals: [], trackId: null, experienceBand: null, years: null, hoursPerWeek: null, deadlineWeeks: null };
  for (const intent of intents) {
    if (intent.status === "left_out") continue;
    if (intent.type === "current_role") {
      if (!out.trackId && intent.trackId) out.trackId = intent.trackId;
      if (out.years == null && intent.years != null) {
        out.years = intent.years;
        out.experienceBand = bandFromYears(intent.years);
      }
      continue;
    }
    if (intent.type === "constraint") {
      if (out.hoursPerWeek == null && intent.constraint?.hoursPerWeek) out.hoursPerWeek = intent.constraint.hoursPerWeek;
      if (out.deadlineWeeks == null && intent.constraint?.deadlineWeeks) out.deadlineWeeks = intent.constraint.deadlineWeeks;
      continue;
    }
    const skillIds = [...new Set(intent.skillIds)].slice(0, MAX_INTENT_SKILLS);
    if (skillIds.length === 0) continue;
    const originalText = intent.phrase.slice(0, 300);
    const outcome = intent.statement.slice(0, 300);
    if (intent.type === "case" && intent.caseId) {
      out.goals.push({ type: "case", originalText, outcome, skillIds, targetLevel: intent.targetLevel, caseId: intent.caseId, slider: clampSlider(intent.slider), intentId: intent.id });
    } else {
      out.goals.push({ type: "text", originalText, outcome, skillIds, targetLevel: intent.targetLevel, caseId: null, slider: clampSlider(intent.slider), intentId: intent.id });
    }
  }
  return out;
}

/** The next free "iN" id. */
export function nextIntentId(intents: readonly Pick<Intent, "id">[]): string {
  const max = intents.reduce((m, i) => Math.max(m, Number(/^i(\d+)$/.exec(i.id)?.[1] ?? 0)), 0);
  return `i${max + 1}`;
}

/** The admin's answer to an Unsure, as an intent (left out, or mapped to the option's skills). */
export function resolveUnsure(unsure: Unsure, option: UnsureOption, intents: readonly Pick<Intent, "id">[]): Intent {
  const id = nextIntentId(intents);
  if (option.leaveOut) {
    return { id, phrase: unsure.phrase, type: "improve_area", statement: LEAVE_OUT_LABEL, skillIds: [], targetLevel: 3, slider: 0, status: "left_out" };
  }
  const type: IntentType = option.type ?? (option.caseId ? "case" : "improve_area");
  return {
    id,
    phrase: unsure.phrase,
    type,
    statement: option.label,
    skillIds: option.skillIds.slice(0, MAX_INTENT_SKILLS),
    ...(option.bundleId ? { bundleId: option.bundleId } : {}),
    ...(option.caseId ? { caseId: option.caseId } : {}),
    targetLevel: option.targetLevel ?? 3,
    slider: type === "current_role" || type === "constraint" ? 0 : 3,
    status: "mapped",
  };
}

// ---------------------------------------------------------------------------
// Downstream guarantees
// ---------------------------------------------------------------------------

export interface IntentCoverageLine {
  intentId: string;
  phrase: string;
  type: IntentType;
  /** At least one assessment question on one of its skills. */
  inBlueprint: boolean;
  /** At least one path item on one of its skills. */
  inPath: boolean;
  /** Why it has no path item, when that is fine: "Already strong: scored 5/5". */
  reason: string | null;
}

export interface IntentCoverage {
  lines: IntentCoverageLine[];
  /** Intent ids with no assessment question (a broken promise). */
  missingBlueprint: string[];
  /** Intent ids with no path item and no reason (a broken promise). */
  missingPath: string[];
}

/** The intents that carry a promise: not constraints, not left out. */
export function promisedIntents<T extends Pick<Intent, "type" | "status">>(intents: readonly T[]): T[] {
  return intents.filter((i) => i.type !== "constraint" && i.status !== "left_out");
}

/** An intent's skills; current_role stands for the core skills of the role. */
export function intentSkillIds(intent: Pick<Intent, "type" | "skillIds">, coreSkillIds: readonly string[] = []): string[] {
  return intent.type === "current_role" ? [...new Set([...coreSkillIds, ...intent.skillIds])] : [...intent.skillIds];
}

/**
 * Checks the promises: every non-constraint intent has ≥ 1 assessment question on one of its skills,
 * and ≥ 1 path item or a reason ("Already strong: scored 5/5" when every skill it names already
 * meets its level). `mastery` is 0..5 per skill id (missing = not measured).
 */
export function intentCoverage(
  intents: readonly Intent[],
  blueprintSkills: Iterable<string>,
  pathSkills: Iterable<string>,
  mastery: ReadonlyMap<string, number> | Readonly<Record<string, number>>,
  options: { coreSkillIds?: readonly string[] } = {},
): IntentCoverage {
  const asked = new Set(blueprintSkills);
  const onPath = new Set(pathSkills);
  const level = (id: string): number | undefined => (mastery instanceof Map ? mastery.get(id) : (mastery as Record<string, number>)[id]);
  const lines: IntentCoverageLine[] = [];
  for (const intent of promisedIntents(intents)) {
    const ids = intentSkillIds(intent, options.coreSkillIds);
    const inBlueprint = ids.some((id) => asked.has(id));
    const inPath = ids.some((id) => onPath.has(id));
    let reason: string | null = null;
    if (!inPath && ids.length > 0) {
      const scores = ids.map(level);
      const needed = intent.type === "current_role" ? Math.min(intent.targetLevel, 3) : intent.targetLevel;
      if (scores.every((s) => s != null && s >= needed)) reason = `Already strong: scored ${Math.min(...(scores as number[]))}/5`;
    }
    lines.push({ intentId: intent.id, phrase: intent.phrase, type: intent.type, inBlueprint, inPath, reason });
  }
  return {
    lines,
    missingBlueprint: lines.filter((l) => !l.inBlueprint).map((l) => l.intentId),
    missingPath: lines.filter((l) => !l.inPath && !l.reason).map((l) => l.intentId),
  };
}

// ---------------------------------------------------------------------------
// What a save carries
// ---------------------------------------------------------------------------

/** Added to the setup request: the intents read from the description, and anything still open. */
export const intentsFieldsSchema = z.object({
  intents: z.array(intentSchema).max(MAX_INTENTS).optional(),
  unsure: z.array(unsureSchema).max(MAX_INTENTS).optional(),
});

/**
 * The first reason a save must be refused, or null: an open Unsure, or (when intents were sent with
 * the description) a meaningful phrase no intent covers.
 */
export function unresolvedPhrase(input: { description?: string; intents?: readonly Pick<Intent, "phrase" | "status">[]; unsure?: readonly Pick<Unsure, "phrase">[] }): string | null {
  if (input.unsure && input.unsure.length > 0) return input.unsure[0]!.phrase;
  if (input.intents && input.description) {
    const { uncovered } = coverageCheck(input.description, input.intents);
    if (uncovered.length > 0) return uncovered[0]!;
  }
  return null;
}
