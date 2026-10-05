import type { MasteryView, MetGoalView, MissingLinkView, V4Result } from "../../../shared/assessmentV4";
import type { ScoredGap } from "../../../shared/builder";
import { trackBasics, type Catalog, type Skill } from "../../../shared/catalog";
import { asOutcome, type LearnerGoal, type PracticalOutcome } from "../../../shared/goals";
import { intentCoverage, intentSkillIds, type IntentCoverage } from "../../../shared/intents";
import {
  estimateMastery,
  goalsToTargets,
  orderPath,
  type CriticallyWeakFlag,
  type GoalForPath,
  type PathOrderInput,
  type PathOrderResult,
  type PathStep,
  type PathTarget,
} from "../../../shared/pathOrder";
import type { LearnerSetup } from "../../../shared/setup";
import { ancestorsClosure, type SkillEdge } from "../../../shared/skillGraph";
import { getSkillEdges } from "../catalog/graph";
import { getCatalog } from "../catalog/repo";
import type { Db } from "../db";
import { capstoneOutcome, defaultTargetLevel, type SuggestionCandidate } from "../goals/repo";
import { listUsableOutcomes } from "../goals/outcomes";
import { getSetup } from "../setup/repo";
import { startLevelFor } from "./priorityPath";
import { PM_LIFECYCLE_SKILL_IDS, isWeak, pmPart1Rank, type PlannedItem } from "./v4Parts";

/**
 * v4.3 Phase 2c: the learner's goals, the evaluation and the skill graph, turned into the input of
 * `shared/pathOrder.ts`, and its answer turned into path items.
 *
 * ## Definitions (documented in docs/v4.3/DECISIONS.md, D7)
 * - **Core skills** of the learner's current role: the track basics (`trackBasics`: the beginner,
 *   non-AI skills of their department and track, stack-specific ones first, three of them). The
 *   assessment always asks about them; a measured core skill at 1/5 or below is critically weak.
 * - **Critically weak and important** (boosted to a must-have, D4 rule 2):
 *   1. AI skills (`isAiSkill`) measured at 1/5 or below, when the team is moving to AI-driven
 *      delivery: the learner has a goal with an AI skill, or their department pre-selects an AI
 *      skill at Medium or above (`defaultSlider >= 3`).
 *   2. PM lifecycle courses (custom and white-label) the evaluation found weak (3/5 or below): the
 *      v4.2 rule that a weak lifecycle course opens the PM path, kept.
 *   3. Core skills at 1/5 or below that are not goals themselves (added by `orderPath` itself).
 * - **Admin order** is the goal order. A PM path orders the process goals as v4.2 did (lifecycle,
 *   terminology, meetings, then the rest), then by goal order.
 */

export const CRITICAL_WEAK_LEVEL = 1;

export interface GoalPathContext {
  setup: LearnerSetup;
  catalog: Catalog;
  edges: SkillEdge[];
  skillsById: Map<string, Skill>;
  /** Active goals in path admin order, each with what the path needs of it. */
  goals: (GoalForPath & { goal: LearnerGoal | null; label: string })[];
  targets: PathTarget[];
  input: PathOrderInput;
  outcomes: PracticalOutcome[];
}

/** The learner's core skills (see the module doc). */
export function coreSkillIds(catalog: Pick<Catalog, "skills">, setup: Pick<LearnerSetup, "departmentId" | "trackId" | "stackIds">): string[] {
  return trackBasics(catalog, setup.departmentId, setup.trackId, setup.stackIds).map((s) => s.id);
}

/** True when the learner's team is moving to AI-driven delivery (see the module doc). */
export function aiFocus(catalog: Pick<Catalog, "skills">, departmentId: string, goalSkillIds: readonly string[]): boolean {
  const byId = new Map(catalog.skills.map((s) => [s.id, s]));
  if (goalSkillIds.some((id) => byId.get(id)?.isAiSkill)) return true;
  return catalog.skills.some((s) => s.departmentId === departmentId && s.isAiSkill && s.status === "active" && (s.defaultSlider ?? 0) >= 3);
}

function goalLabel(goal: LearnerGoal, names: ReadonlyMap<string, string>, outcomes: readonly PracticalOutcome[]): string {
  const clip = (text: string) => (text.length > 60 ? `${text.slice(0, 57).trimEnd()}…` : text);
  if (goal.type === "skill") return names.get(goal.skillIds[0]) ?? goal.originalText;
  if (goal.caseId) {
    const own = outcomes.find((o) => o.id === goal.caseId);
    if (own) return clip(own.title);
  }
  return clip(goal.originalText.replace(/\.$/, ""));
}

/**
 * Everything `orderPath` needs, read from the database. `result` is the evaluation (or null before
 * one exists, when every skill is unmeasured).
 */
export function goalPathContext(db: Db, userId: string, result: Pick<V4Result, "skills"> | null): GoalPathContext {
  const setup = getSetup(db, userId);
  const catalog = getCatalog(db, { departmentId: setup.departmentId, includeArchived: true, withAreas: true });
  const skillsById = new Map(catalog.skills.map((s) => [s.id, s]));
  const names = new Map(catalog.skills.map((s) => [s.id, s.name]));
  const edges = getSkillEdges(db);
  const outcomes = listUsableOutcomes(db, setup.departmentId);
  const skipped = new Set(setup.skip.map((s) => s.skillId));
  const measured = new Map((result?.skills ?? []).filter((s) => s.level != null).map((s) => [s.skillId, s.level!]));

  // Goals (D2); a learner without any keeps the v4.2 behaviour: each priority is a skill goal. With
  // every goal achieved, the achieved ones are the starting point the progression continues from.
  const open = setup.goals.filter((g) => g.status === "active");
  const active = open.length > 0 ? open : setup.goals;
  type Draft = { goal: LearnerGoal | null; skillIds: string[]; slider: number; goalLevel: number; label: string; position: number };
  const drafts: Draft[] = (
    active.length > 0 || setup.goals.length > 0
      ? active.map((goal, position) => ({ goal, skillIds: goal.skillIds, slider: goal.slider, goalLevel: goal.targetLevel, label: goalLabel(goal, names, outcomes), position }))
      : setup.priorities.map((p, position) => ({ goal: null, skillIds: [p.skillId], slider: p.slider, goalLevel: defaultTargetLevel(setup.level), label: p.skillName, position }))
  )
    .map((d) => ({ ...d, skillIds: d.skillIds.filter((id) => !skipped.has(id) && skillsById.has(id)) }))
    .filter((d) => d.skillIds.length > 0);

  // A PM path keeps v4.2's process order among the goals: lifecycle, terminology, meetings, the rest.
  if (setup.departmentId === "pm") {
    const pmRank = (d: Draft) => Math.min(...d.skillIds.map((id) => pmPart1Rank(id, d.slider, measured.get(id)) ?? 4));
    drafts.sort((a, b) => pmRank(a) - pmRank(b) || a.position - b.position);
  }
  const goals = drafts.map((d, adminOrder) => ({ skillIds: d.skillIds, slider: d.slider, adminOrder, goalLevel: d.goalLevel, label: d.label, goal: d.goal }));
  const targets = goalsToTargets(goals, edges).filter((t) => !skipped.has(t.skillId));

  const { levels } = estimateMastery(result?.skills ?? [], edges);
  const goalSkills = goals.flatMap((g) => g.skillIds);
  const flags: CriticallyWeakFlag[] = [];
  const focus = aiFocus(catalog, setup.departmentId, goalSkills);
  for (const [skillId, level] of measured) {
    const skill = skillsById.get(skillId);
    if (!skill || skipped.has(skillId)) continue;
    if (focus && skill.isAiSkill && level <= CRITICAL_WEAK_LEVEL) flags.push({ skillId, label: "AI-driven skills", why: "they speed up the rest of your path" });
    else if (PM_LIFECYCLE_SKILL_IDS.includes(skillId) && isWeak(level)) flags.push({ skillId, why: "the lifecycle is how every Oyelabs project runs" });
  }

  const input: PathOrderInput = {
    targets,
    mastery: levels,
    edges,
    // A core skill that is already a goal has the admin's priority; the automatic boost is for the
    // core skills nobody asked for (D7).
    coreSkillIds: coreSkillIds(catalog, setup).filter((id) => !skipped.has(id) && !targets.some((t) => t.skillId === id)),
    criticallyWeak: flags,
    names: Object.fromEntries(names),
    options: { criticalWeakLevel: CRITICAL_WEAK_LEVEL },
  };
  return { setup, catalog, edges, skillsById, goals, targets, input, outcomes };
}

// ---------------------------------------------------------------------------
// After an evaluation: mastery, missing links, met goals (Phase 2b output)
// ---------------------------------------------------------------------------

export interface EvaluationAnalysis {
  mastery: MasteryView[];
  missingLinks: MissingLinkView[];
  metGoals: MetGoalView[];
  order: PathOrderResult;
  /** No missing link and no goal skill below its level: the path continues the progression (2d). */
  noGap: boolean;
}

export function analyseEvaluation(db: Db, userId: string, result: Pick<V4Result, "skills">): EvaluationAnalysis {
  const ctx = goalPathContext(db, userId, result);
  const name = (id: string) => ctx.skillsById.get(id)?.name ?? id;
  const order = orderPath(ctx.input);
  const { estimates } = estimateMastery(result.skills, ctx.edges);
  const goalFor = (skillId: string) => ctx.goals.find((g) => ctx.targets.some((t) => t.skillId === skillId && Math.floor(t.adminOrder) === g.adminOrder));
  const sliderOf = (skillId: string) => Math.max(0, ...ctx.targets.filter((t) => t.skillId === skillId).map((t) => t.slider));
  const missingLinks: MissingLinkView[] = order.missingLinks.map((link) => {
    // The goal it is mainly for: the most urgent goal skill it blocks, the earliest goal first.
    const main = [...link.blocks].filter((id) => goalFor(id)).sort((a, b) => sliderOf(b) - sliderOf(a) || goalFor(a)!.adminOrder - goalFor(b)!.adminOrder)[0];
    return {
      skillId: link.skillId,
      skillName: name(link.skillId),
      mastery: link.mastery,
      neededLevel: link.neededLevel,
      forGoal: main ? goalFor(main)!.label : "your goals",
      blocks: link.blocks.map(name),
    };
  });
  return {
    mastery: estimates.map((e) => ({ ...e, skillName: name(e.skillId) })),
    missingLinks,
    metGoals: order.skipped.map((s) => ({ skillId: s.skillId, skillName: name(s.skillId), mastery: s.mastery, neededLevel: s.neededLevel, optionalAdvanced: s.optionalAdvanced })),
    order,
    noGap: ctx.targets.length > 0 && order.steps.every((s) => s.kind === "continuation"),
  };
}

// ---------------------------------------------------------------------------
// Path items (Phase 2c)
// ---------------------------------------------------------------------------

/** Parts are priority bands along the path: 1 Critical/High, 2 Medium, 3 Low and Optional. */
export function partForRank(rank: number): number {
  return rank >= 4 ? 1 : rank === 3 ? 2 : 3;
}

function synthetic(skill: string, summary: string, severity = 0.6): ScoredGap {
  return {
    skill,
    severity,
    roleRelevance: 1,
    weight: 1,
    source: "admin_priority",
    priorityScore: severity,
    evidence: { summary, itemIds: [], missed: 0, asked: 0 },
    skipped: false,
  };
}

export interface GoalPathPlan {
  items: PlannedItem[];
  order: PathOrderResult;
  /**
   * v4.4: every intent of the description on the path, or the reason it is not ("Already strong:
   * scored 5/5"). Stored with the order in the path's audit, next to the per-step reasons.
   */
  intents: IntentCoverage;
}

/**
 * The ordered path items: the diagnostic refresh (when the department has one and the assessment
 * found gaps), every step of `orderPath` in its order, and each case goal's capstone right after the
 * last step of that goal.
 */
export function planGoalPath(
  ctx: GoalPathContext,
  options: { gaps: readonly ScoredGap[]; refreshSkill: Skill | null; assessmentFoundGaps: boolean },
): GoalPathPlan {
  const order = orderPath(ctx.input);
  const name = (id: string) => ctx.skillsById.get(id)?.name ?? id;
  const ownTrack = (skill: Skill | undefined) => Boolean(skill && ctx.setup.trackId && skill.trackIds.includes(ctx.setup.trackId));
  const gapFor = (skillName: string) => options.gaps.find((g) => g.skill.toLowerCase() === skillName.toLowerCase()) ?? null;
  const items: PlannedItem[] = [];

  if (options.refreshSkill && options.assessmentFoundGaps && !order.steps.some((s) => s.skillId === options.refreshSkill!.id)) {
    items.push({
      gap: synthetic(options.refreshSkill.name, "Built from your assessment: short refreshers on the gaps it found in your day-to-day work, before anything new.", 0.8),
      partNumber: 1,
      partType: "track",
      startLevel: "beginner",
      targetSkill: null,
      skillId: options.refreshSkill.id,
      kind: "refresh",
      reasonText: "First: short refreshers on the gaps your assessment found in your day-to-day work.",
    });
  }

  // The skill a missing link is mainly for: its nearest dependent on the path, the most urgent first.
  const prereq = ctx.edges.filter((e) => e.type === "prerequisite");
  const stepIds = order.steps.map((s) => s.skillId);
  const dependentOf = (step: PathStep): string | null => {
    const later = stepIds.slice(stepIds.indexOf(step.skillId) + 1).filter((id) => ancestorsClosure(prereq, [id]).has(step.skillId));
    const goalSteps = later.filter((id) => order.steps.find((s) => s.skillId === id)!.kind !== "missing-link");
    return goalSteps[0] ?? later[0] ?? null;
  };

  for (const step of order.steps) {
    const skill = ctx.skillsById.get(step.skillId);
    const skillName = name(step.skillId);
    const dependent = step.kind === "missing-link" ? dependentOf(step) : null;
    const evidence = gapFor(skillName);
    items.push({
      gap: evidence ? { ...evidence, skill: skillName } : synthetic(skillName, step.reason, 1),
      partNumber: partForRank(step.rank),
      partType: step.kind === "missing-link" ? "prerequisite" : skill?.isAiSkill ? "ai_dev" : ownTrack(skill) ? "track" : "general",
      startLevel: startLevelFor(step.mastery),
      targetSkill: dependent ? name(dependent) : skillName,
      skillId: step.skillId,
      assessedLevel: step.mastery,
      kind: step.kind,
      reasonText: step.reason,
    });
  }

  // v4.4 guarantee: every intent of the description has a path item, or a reason it needs none.
  // An intent left without either gets its weakest skill as a step at the end of the path (never
  // before its prerequisites, which are earlier when they are on the path at all).
  const intents = ctx.setup.intents ?? [];
  const core = coreSkillIds(ctx.catalog, ctx.setup);
  const skipped = new Set(ctx.setup.skip.map((s) => s.skillId));
  const pathSkills = () => items.map((i) => i.skillId).filter((id): id is string => id != null);
  for (const id of intentCoverage(intents, [], pathSkills(), ctx.input.mastery, { coreSkillIds: core }).missingPath) {
    const intent = intents.find((i) => i.id === id)!;
    const level = (skillId: string) => ctx.input.mastery[skillId] ?? 0;
    const pick = intentSkillIds(intent, core)
      .filter((skillId) => ctx.skillsById.has(skillId) && !skipped.has(skillId))
      .map((skillId, index) => ({ skillId, index }))
      .sort((a, b) => level(a.skillId) - level(b.skillId) || a.index - b.index)[0]?.skillId;
    if (!pick) continue;
    const skill = ctx.skillsById.get(pick);
    const skillName = name(pick);
    const measured = ctx.input.mastery[pick] ?? null;
    const reasonText = `From the description, "${intent.phrase}": ${intent.statement.replace(/\.$/, "")}.`.slice(0, 300);
    items.push({
      gap: gapFor(skillName) ?? synthetic(skillName, reasonText, 1),
      partNumber: Math.max(items.at(-1)?.partNumber ?? 1, partForRank(intent.slider || 3)),
      partType: skill?.isAiSkill ? "ai_dev" : ownTrack(skill) ? "track" : "general",
      startLevel: startLevelFor(measured),
      targetSkill: skillName,
      skillId: pick,
      assessedLevel: measured,
      kind: "target",
      reasonText,
    });
  }

  // Capstones: a case goal (or a text goal read as a case) ends with its practice, which proves it.
  for (const g of ctx.goals) {
    const goal = g.goal;
    if (!goal || goal.status !== "active" || !goal.caseId) continue;
    const outcome = capstoneOutcome(goal, ctx.outcomes);
    if (!outcome) continue;
    const goalSkills = new Set(ctx.targets.filter((t) => Math.floor(t.adminOrder) === g.adminOrder).map((t) => t.skillId));
    const last = items.reduce((at, item, index) => (item.skillId && goalSkills.has(item.skillId) && item.kind !== "capstone" ? index : at), -1);
    const band = partForRank(g.slider);
    const at = last >= 0 ? last + 1 : items.length;
    const partNumber = last >= 0 ? items[last].partNumber : Math.max(band, items.at(-1)?.partNumber ?? 1);
    const title = outcome.capstone.title;
    items.splice(at, 0, {
      gap: synthetic(`Capstone: ${title}`, `Proves "${goal.outcome.replace(/\.$/, "")}".`, 1),
      partNumber,
      partType: "capstone",
      startLevel: "beginner",
      targetSkill: last >= 0 ? items[last].targetSkill : g.label,
      skillId: null,
      kind: "capstone",
      reasonText: `Capstone for ${g.label}: passing it marks the goal achieved.`,
      capstone: { goalId: goal.id, title, topicId: outcome.capstone.kind === "topic" ? outcome.capstone.topicId : null },
    });
  }

  return { items, order, intents: intentCoverage(intents, [], pathSkills(), ctx.input.mastery, { coreSkillIds: core }) };
}

/**
 * What the goal path promises, checked after the fact and stored where the admin can see it:
 * parts never go backwards, no skill comes before a prerequisite that is also on the path, and every
 * Critical or High goal skill the learner still needs has a place.
 */
export function assertPathOrder(items: readonly PlannedItem[], edges: readonly SkillEdge[], order?: PathOrderResult): string[] {
  const problems: string[] = [];
  if (items.some((item, index) => index > 0 && item.partNumber < items[index - 1].partNumber)) problems.push("Parts are out of order");
  const prereq = edges.filter((e) => e.type === "prerequisite");
  const firstAt = new Map<string, number>();
  items.forEach((item, index) => {
    if (item.skillId && !firstAt.has(item.skillId)) firstAt.set(item.skillId, index);
  });
  for (const [skillId, at] of firstAt) {
    for (const before of ancestorsClosure(prereq, [skillId])) {
      const p = firstAt.get(before);
      if (p !== undefined && p > at) problems.push(`${skillId} is scheduled before its prerequisite ${before}`);
    }
  }
  for (const step of order?.steps ?? []) {
    if ((step.priority === "Critical" || step.priority === "High") && step.kind === "target" && !firstAt.has(step.skillId)) problems.push(`${step.skillId} (High/Critical) has no place on the path`);
  }
  return problems;
}

// ---------------------------------------------------------------------------
// No gap (Phase 2d): the progression continues, and the admin is offered the next goals
// ---------------------------------------------------------------------------

/** At most this many "next step" suggestions after a no-gap evaluation. */
export const PROGRESSION_SUGGESTIONS = 3;

/** "Suggested next" goals (kind `progression`) from the continuation steps of a no-gap evaluation. */
export function progressionCandidates(analysis: EvaluationAnalysis, names: ReadonlyMap<string, string>): SuggestionCandidate[] {
  if (!analysis.noGap) return [];
  return analysis.order.steps
    .filter((s) => s.kind === "continuation")
    .slice(0, PROGRESSION_SUGGESTIONS)
    .map((s) => {
      const name = names.get(s.skillId) ?? s.skillId;
      return {
        kind: "progression" as const,
        title: name.slice(0, 120),
        outcome: asOutcome(`apply ${name} at work`),
        skillIds: [s.skillId],
        targetLevel: Math.min(5, Math.max(1, s.neededLevel)),
        caseId: null,
        reason: s.reason.slice(0, 300),
      };
    });
}
