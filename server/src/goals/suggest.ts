import { z } from "zod";

import { asOutcome, goalInterpretationSchema, type GoalInput, type GoalInterpretResult, type OnboardSuggestion } from "../../../shared/goals";
import { DEFAULT_HOURS_PER_WEEK, experienceBandSchema, levelFromExperience } from "../../../shared/setup";
import type { AiService } from "../ai/service";
import { getCatalog } from "../catalog/repo";
import type { Db } from "../db";
import { badRequest } from "../lib/errors";
import { listOutcomes } from "./outcomes";
import { CATALOG_MARKER, progressionExtras, rulesInterpret, rulesProfile, type RulesCatalog } from "./rules";

/**
 * Quick onboarding's Suggest and the goal box's free-text reading (v4.3 Phase 1).
 *
 * One Haiku call each. The system prompt is the instructions plus the department's catalog and case
 * library as compact JSON: identical for every call in a department, so the provider caches it and
 * a Suggest pays mostly for the one-line description. Everything the model returns is checked
 * against the catalog; anything unknown is dropped, and an empty or failed answer falls back to
 * the rules. Neither call ever blocks onboarding.
 */

export const SUGGEST_SYSTEM = `You set up a new employee of a software agency on a learning platform, from the
admin's one-line description of them. Use only ids from the catalog below.

Return JSON:
- trackId: the track they should be trained for (where the admin wants them), or null.
- stackIds: the stacks/tools they work with now or will work with (max 8).
- experienceBand: "0", "1-2", "3-5" or "6+" years, or null if not stated.
- level: 1-5 (1 new to the work, 5 could teach it), from their experience, or null.
- hoursPerWeek: only if the description says so, else null.
- goals: 3-7 things they should be able to do, most important first. Each: caseId (a library case
  that fits, else null), skillIds (1-4 catalog skills it needs), outcome (one "Can ..." sentence
  with an observable verb), targetLevel 1-5, slider 1-5 (5 Critical: a stated weakness or the main
  ask; 4 High: what the admin wants next; 3 Medium: useful supporting skill).
Prefer a library case when the description names a concrete task. Never add a goal for something the
description says they are already good at.`;

export const INTERPRET_SYSTEM = `An admin typed one goal for an employee of a software agency ("debug a Laravel
queue in production", "write a CR from a client email"). Read it into: outcome (one "Can ..." sentence
with an observable verb), skillIds (1-4 ids from the catalog below that the goal needs), targetLevel 1-5
(2 basics, 3 does it alone, 4 owns it in production, 5 could teach it) and caseId (the closest library
case if it is a good match, else null). Use only ids from the catalog. Return JSON only.`;

const aiGoalSchema = z.object({
  caseId: z.string().max(80).nullable(),
  skillIds: z.array(z.string().max(80)).max(6),
  outcome: z.string().max(300),
  targetLevel: z.number().int().min(1).max(5),
  slider: z.number().int().min(1).max(5),
});

export const onboardSuggestResponseSchema = z.object({
  trackId: z.string().max(64).nullable(),
  stackIds: z.array(z.string().max(64)).max(8),
  experienceBand: experienceBandSchema.nullable(),
  level: z.number().int().min(1).max(5).nullable(),
  hoursPerWeek: z.number().int().min(1).max(60).nullable(),
  goals: z.array(aiGoalSchema).max(8),
});
export type OnboardSuggestResponse = z.infer<typeof onboardSuggestResponseSchema>;

/** The department's catalog and cases in the compact shape the rules and the prompt share. */
export function rulesCatalog(db: Db, departmentId: string): RulesCatalog {
  const catalog = getCatalog(db, { departmentId });
  if (!catalog.departments.some((d) => d.id === departmentId)) throw badRequest("Pick a department.", { departmentId: "Unknown department" });
  return {
    departmentId,
    tracks: catalog.tracks.filter((t) => t.departmentId === departmentId && !t.archived).map((t) => ({ id: t.id, name: t.name })),
    stacks: catalog.stacks.filter((s) => s.departmentId === departmentId && !s.archived).map((s) => ({ id: s.id, name: s.name, aliases: s.aliases })),
    skills: catalog.skills
      .filter((s) => s.departmentId === departmentId && s.status === "active")
      .map((s) => ({
        id: s.id,
        name: s.name,
        area: s.area,
        aliases: s.aliases,
        defaultSlider: s.defaultSlider,
        prerequisites: s.prerequisites,
        trackIds: s.trackIds,
        stackIds: s.stackIds,
        levelMin: s.levelMin,
      })),
    outcomes: listOutcomes(db, departmentId).map((o) => ({ id: o.id, title: o.title, statement: o.statement, level: o.level, skillIds: o.skillIds, aliases: o.aliases })),
  };
}

/**
 * The catalog block of the system prompt. Stable for a department (catalog order, no timestamps),
 * so it is the cached part of every call. Arrays, not objects, to keep it small.
 */
export function catalogPrompt(cat: RulesCatalog): string {
  const compact = {
    department: cat.departmentId,
    tracks: cat.tracks.map((t) => [t.id, t.name]),
    stacks: cat.stacks.map((s) => [s.id, s.name, s.aliases.slice(0, 4)]),
    skills: cat.skills.map((s) => [s.id, s.name, s.area, s.aliases.slice(0, 5), s.defaultSlider]),
    cases: cat.outcomes.map((o) => [o.id, o.title, o.level, o.skillIds, o.aliases.slice(0, 4)]),
  };
  return `${CATALOG_MARKER}\n${JSON.stringify(compact)}`;
}

/** Keeps only what exists in the department; a goal left with no skill is dropped. */
export function validateAiGoals(cat: RulesCatalog, goals: readonly z.infer<typeof aiGoalSchema>[]): GoalInput[] {
  const skills = new Map(cat.skills.map((s) => [s.id, s]));
  const cases = new Map(cat.outcomes.map((o) => [o.id, o]));
  const out: GoalInput[] = [];
  for (const g of goals) {
    const kase = g.caseId ? (cases.get(g.caseId) ?? null) : null;
    const skillIds = [...new Set(g.skillIds.filter((id) => skills.has(id)))];
    const ids = skillIds.length ? skillIds : (kase?.skillIds ?? []);
    if (ids.length === 0) continue;
    const outcome = g.outcome.trim() ? asOutcome(g.outcome) : kase ? kase.statement : asOutcome(`apply ${skills.get(ids[0])?.name ?? ids[0]} at work`);
    if (kase) out.push({ type: "case", originalText: kase.title.slice(0, 300), outcome: kase.statement, skillIds: kase.skillIds, targetLevel: kase.level, caseId: kase.id, slider: g.slider });
    else if (ids.length === 1) out.push({ type: "skill", originalText: (skills.get(ids[0])?.name ?? ids[0]).slice(0, 300), outcome, skillIds: ids, targetLevel: g.targetLevel, caseId: null, slider: g.slider });
    else out.push({ type: "text", originalText: outcome.slice(0, 300), outcome, skillIds: ids.slice(0, 6), targetLevel: g.targetLevel, caseId: null, slider: g.slider });
  }
  return out;
}

function sortBySlider(goals: readonly GoalInput[]): GoalInput[] {
  return goals.map((g, i) => ({ g, i })).sort((a, b) => b.g.slider - a.g.slider || a.i - b.i).map((x) => x.g);
}

export async function suggestOnboarding(
  deps: { db: Db; ai: AiService },
  input: { departmentId: string; description: string; name?: string },
): Promise<OnboardSuggestion> {
  const cat = rulesCatalog(deps.db, input.departmentId);
  const rules = rulesProfile(cat, input.description);

  let source: OnboardSuggestion["source"] = "rules";
  let ai: OnboardSuggestResponse | null = null;
  if (deps.ai.isConfigured()) {
    try {
      const result = await deps.ai.generateJson({
        purpose: "onboard_suggest",
        task: "onboard_suggest",
        system: `${SUGGEST_SYSTEM}\n\n${catalogPrompt(cat)}`,
        user: JSON.stringify({ description: input.description, name: input.name ?? null }),
        schema: onboardSuggestResponseSchema,
        schemaName: "onboard_suggest",
        meta: {},
      });
      ai = result.data;
    } catch {
      ai = null;
    }
  }

  const trackIds = new Set(cat.tracks.map((t) => t.id));
  const stackIds = new Set(cat.stacks.map((s) => s.id));
  let goals = rules.goals;
  let trackId = rules.trackId;
  let stacks = rules.stackIds;
  let experienceBand = rules.experienceBand;
  let level = rules.level;
  let hours = rules.hoursPerWeek;
  if (ai) {
    const aiGoals = validateAiGoals(cat, ai.goals);
    if (aiGoals.length) {
      source = "ai";
      goals = sortBySlider(aiGoals);
    }
    trackId = ai.trackId && trackIds.has(ai.trackId) ? ai.trackId : trackId;
    const aiStacks = ai.stackIds.filter((id) => stackIds.has(id));
    stacks = aiStacks.length ? [...new Set(aiStacks)] : stacks;
    experienceBand = ai.experienceBand ?? experienceBand;
    level = ai.level ?? level ?? (experienceBand ? levelFromExperience(experienceBand) : null);
    hours = ai.hoursPerWeek ?? hours;
  }

  return {
    departmentId: input.departmentId,
    trackId,
    stackIds: stacks,
    experienceBand,
    level,
    hoursPerWeek: hours ?? DEFAULT_HOURS_PER_WEEK,
    goals,
    extras: progressionExtras(cat, goals, trackId, stacks),
    source,
  };
}

export async function interpretGoal(deps: { db: Db; ai: AiService }, input: { departmentId: string; text: string }, meta: { userId?: string } = {}): Promise<GoalInterpretResult> {
  const cat = rulesCatalog(deps.db, input.departmentId);
  if (deps.ai.isConfigured()) {
    try {
      const result = await deps.ai.generateJson({
        purpose: "goal_interpret",
        task: "goal_interpret",
        system: `${INTERPRET_SYSTEM}\n\n${catalogPrompt(cat)}`,
        user: JSON.stringify({ goal: input.text }),
        schema: goalInterpretationSchema,
        schemaName: "goal_interpret",
        meta: { subjectUserId: meta.userId },
      });
      const valid = new Set(cat.skills.map((s) => s.id));
      const skillIds = [...new Set(result.data.skillIds.filter((id) => valid.has(id)))];
      const kase = result.data.caseId ? cat.outcomes.find((o) => o.id === result.data.caseId) : undefined;
      if (skillIds.length) {
        return {
          interpretation: { outcome: asOutcome(result.data.outcome), skillIds, targetLevel: result.data.targetLevel, caseId: kase?.id ?? null },
          source: "ai",
        };
      }
    } catch {
      // Falls through to the rules.
    }
  }
  const interpretation = rulesInterpret(cat, input.text);
  return interpretation
    ? { interpretation, source: "rules" }
    : { interpretation: null, source: "rules", message: "Could not link that to a catalog skill. Pick the skills it needs." };
}
