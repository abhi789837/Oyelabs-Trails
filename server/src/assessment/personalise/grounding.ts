import { z } from "zod";

import type { Skill } from "../../../../shared/catalog";
import { classify, type DecisionAnswers } from "../../../../shared/decision";
import type { HandbookKind } from "../../../../shared/handbook";
import { findPersona, findScenario, ROLEPLAY_SCENARIOS } from "../../../../shared/roleplay";
import type { Task } from "../../../../shared/tasks";
import type { Db } from "../../db";
import { rowsOf } from "../../handbook/repo";

/**
 * v4.2 Phase 5: personalised items grounded in the Oyelabs Process Handbook.
 *
 * A process skill (`pm-proc-*`, or any skill tagged `process`) is about how Oyelabs runs projects,
 * and a model left to its own memory writes the industry's version of that, or worse, its own. So
 * the generation call is handed the relevant handbook entries as ground truth, every process item
 * must cite the entries it depends on (`handbookRefs`, `kind:id`), and code rejects an item whose
 * citations are missing, unknown or archived. Classification items go one step further: the model
 * states the facts of each request and code recomputes the keyed answer with the decision tool.
 */

/** About this many handbook entries go into one generation call. */
export const HANDBOOK_ENTRIES_PER_CALL = 12;
/** And at most this many are suggested for one slot. */
const ENTRIES_PER_SLOT = 8;

/** Skills whose hands-on slots may be a short client role-play in an assessment. */
export const ROLEPLAY_SKILL_IDS: ReadonlySet<string> = new Set(["pm-proc-meetings", "pm-client-management"]);
/** A role-play inside a 25-question assessment is short. */
export const ASSESSMENT_ROLEPLAY_TURNS = { min: 2, max: 3 } as const;

export function isProcessSkill(skill: Pick<Skill, "id" | "tags"> | undefined | null): boolean {
  if (!skill) return false;
  return skill.id.startsWith("pm-proc-") || skill.tags.includes("process");
}

export function allowsRoleplay(skillId: string): boolean {
  return ROLEPLAY_SKILL_IDS.has(skillId);
}

// ---------------------------------------------------------------------------
// The handbook as the generator sees it
// ---------------------------------------------------------------------------

export interface HandbookIndexEntry {
  kind: HandbookKind;
  id: string;
  version: number;
  archived: boolean;
  data: Record<string, unknown>;
}

/** `kind:id` → entry, archived ones included (so a citation of one can be named as archived). */
export type HandbookIndex = ReadonlyMap<string, HandbookIndexEntry>;

export function loadHandbookIndex(db: Db): HandbookIndex {
  const out = new Map<string, HandbookIndexEntry>();
  for (const row of rowsOf(db)) {
    out.set(`${row.kind}:${row.id}`, { kind: row.kind, id: row.id, version: row.version, archived: row.archived, data: row.data as Record<string, unknown> });
  }
  return out;
}

/** `kind:id` → current version, for storing an item's citations. */
export function versionsOf(index: HandbookIndex): Map<string, number> {
  return new Map([...index].map(([ref, e]) => [ref, e.version]));
}

const clip = (value: unknown, max: number): string => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

/** One entry, compact: ids, names, definitions, Oyelabs meanings, statuses and rule statements. */
export function compactEntry(entry: HandbookIndexEntry): Record<string, unknown> {
  const d = entry.data;
  const ref = `${entry.kind}:${entry.id}`;
  const status = d.status ?? "to-confirm";
  switch (entry.kind) {
    case "term":
      return { ref, name: d.name, aka: ((d.aka as string[] | undefined) ?? []).slice(0, 3), definition: clip(d.definition, 260), oyelabsMeaning: clip(d.oyelabsMeaning, 200), status };
    case "rule":
      return { ref, name: d.name, statement: clip(d.statement, 320), status };
    case "stage":
      return { ref, name: d.name, purpose: clip(d.purpose, 220), status };
    default:
      return { ref, name: d.name, purpose: clip(d.purpose, 180), status };
  }
}

const words = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w.length >= 3);

const norm = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** The decision tool's terms and billing rules: what every classify-the-request item rests on. */
const DECISION_REFS = ["term:bug", "term:enhancement", "term:change-request", "term:new-feature", "term:clarification", "term:warranty", "rule:billing-change-request", "rule:billing-enhancement", "rule:billing-bug-warranty"];

export interface PickInput {
  skill: Pick<Skill, "id" | "name" | "aliases" | "tags" | "contentModules">;
  hint?: string;
  subtype?: string;
  /** Term ids of the role-play scenario involved, which always make the list. */
  scenarioTermIds?: readonly string[];
}

/**
 * The handbook entries most relevant to one slot, best first: the role-play scenario's terms, then
 * entries named by the skill's aliases and tags or by the slot hint, then the stages the skill's
 * camps teach. Archived entries are never offered.
 */
export function pickEntries(index: HandbookIndex, input: PickInput, limit = ENTRIES_PER_SLOT): string[] {
  const phrases = [input.skill.name, ...input.skill.aliases, ...input.skill.tags].map(norm).filter((p) => p.length >= 3);
  const hintWords = new Set(words(input.hint ?? ""));
  const scenario = new Set(input.scenarioTermIds ?? []);
  const modules = new Set(input.skill.contentModules);
  const whitelabel = input.skill.tags.includes("whitelabel") || /white.?label/i.test(input.skill.name);
  const scored: { ref: string; score: number }[] = [];
  for (const [ref, entry] of index) {
    if (entry.archived) continue;
    const d = entry.data;
    let score = 0;
    if (entry.kind === "term" && scenario.has(entry.id)) score += 100;
    const names = [String(d.name ?? ""), entry.id.replace(/-/g, " "), ...((d.aka as string[] | undefined) ?? [])].map(norm).filter(Boolean);
    for (const phrase of phrases) {
      if (names.some((n) => n === phrase || (n.length >= 4 && phrase.includes(n)) || (phrase.length >= 4 && n.includes(phrase)))) score += 5;
    }
    for (const n of names) for (const w of words(n)) if (hintWords.has(w)) score += 2;
    if (entry.kind === "stage" && d.moduleId && modules.has(String(d.moduleId))) score += 4;
    if (whitelabel && (d.category === "whitelabel" || d.projectType === "whitelabel")) score += 2;
    if (input.subtype === "categorize" && DECISION_REFS.includes(ref)) score += 6;
    if (score > 0) scored.push({ ref, score });
  }
  scored.sort((a, b) => b.score - a.score || a.ref.localeCompare(b.ref));
  return scored.slice(0, limit).map((s) => s.ref);
}

/** Merges per-slot picks into one call's list, round-robin so every slot gets its best entries in. */
export function mergePicks(perSlot: readonly (readonly string[])[], limit = HANDBOOK_ENTRIES_PER_CALL): string[] {
  const out: string[] = [];
  const longest = Math.max(0, ...perSlot.map((p) => p.length));
  for (let i = 0; i < longest && out.length < limit; i += 1) {
    for (const picks of perSlot) {
      const ref = picks[i];
      if (ref && !out.includes(ref)) out.push(ref);
      if (out.length >= limit) break;
    }
  }
  return out;
}

/** A scenario for a role-play slot: the one the hint names, otherwise one by slot index. */
export function roleplayScenarioFor(slotIndex: number, hint = ""): { scenarioId: string; personaId: string; termIds: string[] } {
  const hintWords = new Set(words(hint));
  const named = ROLEPLAY_SCENARIOS.find((s) => words(`${s.title} ${s.summary}`).filter((w) => w.length >= 5).some((w) => hintWords.has(w)));
  const scenario = named ?? ROLEPLAY_SCENARIOS[slotIndex % ROLEPLAY_SCENARIOS.length];
  return { scenarioId: scenario.id, personaId: scenario.defaultPersonaId, termIds: scenario.termIds };
}

// ---------------------------------------------------------------------------
// Checking what came back
// ---------------------------------------------------------------------------

const answer = <T extends string>(...values: [T, ...T[]]) => z.enum(values).nullable().optional();
/** The facts of one client request, as the decision tool's answers. */
export const decisionAnswersSchema = z.object({
  worksAsSpecified: answer("yes", "no"),
  inScope: answer("yes", "no"),
  warranty: answer("not-live", "yes", "no"),
  changeKind: answer("change", "improve", "neither"),
  brandNew: answer("yes", "no"),
});

/** Drops nulls, so `classify` reads an absent answer as "not asked". */
export function toDecisionAnswers(raw: z.infer<typeof decisionAnswersSchema>): DecisionAnswers {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) if (v) out[k] = v;
  return out as DecisionAnswers;
}

export interface GroundingInput {
  skillId: string;
  processSkill: boolean;
  refs: readonly string[];
  index: HandbookIndex;
  task: Task | null;
  /** Classify-request items only: item id → the facts of that request. */
  facts: Record<string, z.infer<typeof decisionAnswersSchema>> | null;
}

/** Why a generated item fails the handbook rules. Empty = it passes. */
export function groundingProblems(input: GroundingInput): string[] {
  const problems: string[] = [];
  if (input.processSkill && input.refs.length === 0) problems.push("a process item must cite handbook entries (handbookRefs)");
  for (const ref of input.refs) {
    const entry = input.index.get(ref);
    if (!entry) problems.push(`cites unknown handbook entry ${ref}`);
    else if (entry.archived) problems.push(`cites archived handbook entry ${ref}`);
  }

  const task = input.task;
  if (task?.kind === "categorize" && task.mode === "classify-request") {
    for (const item of task.items) {
      const facts = input.facts?.[item.id];
      if (!facts) {
        problems.push(`classify: no facts for ${item.id}`);
        continue;
      }
      const outcome = classify(toDecisionAnswers(facts));
      if (!outcome) problems.push(`classify: the facts for ${item.id} do not decide a classification`);
      else if (outcome.classification !== task.answer[item.id]) problems.push(`classify: ${item.id} is keyed ${task.answer[item.id]} but its facts give ${outcome.classification}`);
    }
  }

  if (task?.kind === "roleplay") {
    if (!allowsRoleplay(input.skillId)) problems.push(`roleplay is not used for ${input.skillId}`);
    if (!findScenario(task.scenarioId)) problems.push(`roleplay: unknown scenario ${task.scenarioId}`);
    if (!findPersona(task.personaId)) problems.push(`roleplay: unknown persona ${task.personaId}`);
    if (task.maxTurns < ASSESSMENT_ROLEPLAY_TURNS.min || task.maxTurns > ASSESSMENT_ROLEPLAY_TURNS.max) problems.push(`roleplay: ${task.maxTurns} turns (an assessment allows ${ASSESSMENT_ROLEPLAY_TURNS.min}-${ASSESSMENT_ROLEPLAY_TURNS.max})`);
    if (task.followUp) problems.push("roleplay: no follow-up email inside an assessment");
  }
  return problems;
}
