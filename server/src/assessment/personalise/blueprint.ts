import { skillUsableBy, trackBasics, type Catalog } from "../../../../shared/catalog";
import type { GoalInput } from "../../../../shared/goals";
import { intentSkillIds, promisedIntents, type Intent } from "../../../../shared/intents";
import { OUTCOME_SLOT_SEC, outcomeTaskVariant, SLOT_SUBTYPES, type OutcomeCase, type SlotSubtype } from "../../../../shared/personalise";
import { planBlueprintMix, MAX_PROBES, type AssessmentMix, type IntentSlotGroup, type LearnerSetup, type MixSkill } from "../../../../shared/setup";
import { immediatePrerequisites } from "../../../../shared/skillGraph";
import { estimateSeconds } from "../../../../shared/timing";
import { getSkillEdges } from "../../catalog/graph";
import type { Db } from "../../db";
import { getOutcome } from "../../goals/outcomes";

/**
 * v4.3 Phase 2b: what the goal blueprint adds to the assessment's 25 slots.
 *
 * - **Goals**: the Critical/High goals' skills are the focus group, as the derived priorities
 *   already make them (D2).
 * - **Prerequisite probes** ("missing-link probes"): the immediate prerequisites (graph
 *   `prerequisite` edges, one hop) of every Critical or High goal skill that is not itself a goal,
 *   at most three. The path needs their level to know whether a prerequisite is missing (D4).
 * - **Core skills** of the learner's current role: the track basics (`trackBasics`), asked at the
 *   learner's stated level (the difficulty band comes from that level, as for every slot).
 * - **Outcome slots**: each Critical/High practical-case goal (at most two) gets one hands-on slot
 *   that tests the outcome as a task, modelled on the case's capstone (`withOutcomeSlots`).
 *
 * - **Intents** (v4.4): every intent of the admin's description (except constraints) gets at
 *   least one question on one of its skills; a current role stands for its core skills
 *   (`ensureIntentSlots`).
 *
 * The 25 items, the 18/7 split, the time window and bank reuse are unchanged; probes and core
 * skills share the basics group (`planBlueprintMix`).
 */

export type BlueprintSetup = Pick<LearnerSetup, "departmentId" | "trackId" | "stackIds" | "priorities" | "skip"> & {
  goals?: readonly (Pick<GoalInput, "type" | "skillIds" | "caseId" | "slider"> & { status?: "active" | "achieved" })[];
  /** v4.4: the description's intents; each must reach the test. */
  intents?: readonly Intent[];
};

export interface BlueprintInputs {
  core: MixSkill[];
  probes: MixSkill[];
  cases: OutcomeCase[];
  /** v4.4: per intent, the skills that can carry its question (see `ensureIntentSlots`). */
  intents: IntentSlotGroup[];
}

export function blueprintInputs(db: Db, catalog: Catalog, setup: BlueprintSetup): BlueprintInputs {
  const skills = new Map(catalog.skills.map((s) => [s.id, s]));
  const skipped = new Set(setup.skip.map((s) => s.skillId));
  const prioritised = new Set(setup.priorities.map((p) => p.skillId));
  const core = trackBasics(catalog, setup.departmentId, setup.trackId, setup.stackIds).map((s) => ({ skillId: s.id, skillName: s.name, slider: 0 }));

  const edges = getSkillEdges(db);
  const probes: MixSkill[] = [];
  for (const priority of setup.priorities.filter((p) => p.slider >= 4)) {
    for (const id of immediatePrerequisites(edges, priority.skillId).sort()) {
      const skill = skills.get(id);
      if (!skill || skill.status !== "active" || skipped.has(id) || prioritised.has(id) || probes.some((p) => p.skillId === id)) continue;
      // v4.4: soft skills (an area department) are usable by every department.
      if (!skillUsableBy(skill, setup.departmentId, catalog.departments)) continue;
      probes.push({ skillId: id, skillName: skill.name, slider: 0 });
    }
  }

  const cases: OutcomeCase[] = [];
  const urgent = [...(setup.goals ?? [])]
    .map((goal, position) => ({ goal, position }))
    .filter(({ goal }) => goal.caseId && goal.slider >= 4 && goal.status !== "achieved")
    .sort((a, b) => b.goal.slider - a.goal.slider || a.position - b.position);
  for (const { goal } of urgent) {
    const outcome = getOutcome(db, goal.caseId!);
    if (!outcome || outcome.capstone.kind !== "task") continue;
    const kind = String(outcome.capstone.task.kind) as SlotSubtype;
    if (!SLOT_SUBTYPES.includes(kind) || kind === "roleplay") continue;
    // Only a task a short slot can hold: the compact variant must fit the outcome slot's time.
    const variant = outcomeTaskVariant(outcome.capstone.task);
    const seconds = estimateSeconds({ type: "task", prompt: String(variant.prompt ?? ""), coding: null, mcq: null, task: variant as never });
    if (seconds > OUTCOME_SLOT_SEC * 1.15) continue;
    const skillIds = outcome.skillIds.filter((id) => skills.has(id) && !skipped.has(id));
    if (skillIds.length === 0) continue;
    cases.push({ caseId: outcome.id, title: outcome.title, skillIds, skillNames: Object.fromEntries(skillIds.map((id) => [id, skills.get(id)!.name])), kind });
  }

  // v4.4: each intent's candidate skills, in its own order, known, active, usable and not skipped.
  const coreIds = core.map((c) => c.skillId);
  const intents: IntentSlotGroup[] = promisedIntents(setup.intents ?? []).map((intent) => ({
    intentId: intent.id,
    group: intent.type === "current_role" ? "basics" : intent.slider >= 4 ? "focus" : "other",
    skills: intentSkillIds(intent, coreIds)
      .map((id) => skills.get(id))
      .filter((s): s is NonNullable<typeof s> => s != null && s.status === "active" && !skipped.has(s.id) && skillUsableBy(s, setup.departmentId, catalog.departments))
      .map((s) => ({ skillId: s.id, skillName: s.name, slider: intent.slider })),
  }));

  return { core, probes: probes.slice(0, MAX_PROBES), cases, intents };
}

/** The 25-slot mix for a setup: goals, prerequisite probes, core skills, and one question per intent. */
export function blueprintMix(db: Db, catalog: Catalog, setup: BlueprintSetup): AssessmentMix {
  const { core, probes, intents } = blueprintInputs(db, catalog, setup);
  return planBlueprintMix(setup.priorities, core, probes, intents);
}
