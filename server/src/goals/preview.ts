import { trackBasics, type Catalog } from "../../../shared/catalog";
import { deriveSkillPriorities, type LearnerGoal } from "../../../shared/goals";
import { firstStepsFrom, testChecksFrom, type OnboardPreview, type PreviewSkill, type PreviewStep } from "../../../shared/onboardPreview";
import { enforceBlueprint, withOutcomeSlots } from "../../../shared/personalise";
import { planBlueprintMix, sortPriorities, type LearnerSetup, type SetupInput, type Slider } from "../../../shared/setup";
import { softWrittenKindFor } from "../../../shared/softSkills";
import { blueprintInputs } from "../assessment/personalise/blueprint";
import { allowsRoleplay } from "../assessment/personalise/grounding";
import { softSubtypeAllowed, subtypeDefaults } from "../assessment/personalise/understand";
import { difficultyOrder } from "../bank/assemble";
import { goalPathContextFor, planGoalPath } from "../builder/goalPath";
import { courseKey, libraryCourseFor } from "../builder/autoCourse";
import { getCatalog } from "../catalog/repo";
import type { ContentStore } from "../content/store";
import type { Db } from "../db";

/**
 * v4.4 Phase 6: the onboarding preview. Everything here is the real planning code, run on a setup
 * that is not saved yet and with no test result: the 25-question mix (`planBlueprintMix` through
 * `blueprintInputs`), the question kinds and time (`enforceBlueprint` with the rules' defaults, no
 * AI), the path order (`planGoalPath`), and the course library (curriculum modules, then courses
 * saved to the library). No AI call, no writes.
 */

/** The unsaved setup the preview plans for, as `saveSetup` would store it. */
export function previewSetup(catalog: Catalog, input: SetupInput): LearnerSetup {
  const names = new Map(catalog.skills.map((s) => [s.id, s.name]));
  const goals: LearnerGoal[] = (input.goals ?? []).map((g, position) => ({ ...g, id: `preview-${position}`, position, status: "active", achievedAt: null, source: "admin" }));
  const skip = new Set(input.skip);
  const raw = input.goals ? deriveSkillPriorities(goals) : input.priorities;
  const priorities = sortPriorities(
    raw.filter((p) => names.has(p.skillId) && !skip.has(p.skillId)).map((p, position) => ({ skillId: p.skillId, skillName: names.get(p.skillId)!, slider: p.slider as Slider, position })),
  );
  return {
    departmentId: input.departmentId,
    trackId: input.trackId,
    stackIds: input.stackIds,
    experienceBand: input.experienceBand,
    level: input.level,
    priorities,
    skip: input.skip.filter((id) => names.has(id)).map((id) => ({ skillId: id, skillName: names.get(id)! })),
    hoursPerWeek: input.hoursPerWeek,
    advanced: input.advanced,
    description: input.description ?? "",
    goals,
    intents: (input.intents ?? []).filter((i) => i.status !== "left_out"),
  };
}

/**
 * Skill ids with no course yet: no curriculum module in this deployment and nothing equivalent
 * published in the library (Phase 5's duplicate check, `libraryCourseFor`, so the card names exactly
 * the courses the path builder would ask for).
 */
export function uncoveredSkills(db: Db, content: ContentStore | null, catalog: Catalog, skillIds: readonly string[]): string[] {
  const skills = new Map(catalog.skills.map((s) => [s.id, s]));
  const available = new Set(content ? content.manifest.flatMap((t) => t.modules.filter((m) => m.available).map((m) => m.id)) : []);
  return [...new Set(skillIds)].filter((id) => {
    const skill = skills.get(id);
    if (!skill) return false;
    if (skill.contentModules.some((m) => available.has(m))) return false;
    return libraryCourseFor(db, courseKey({ skillId: id, skill: skill.name }), skill.name)?.state !== "published";
  });
}

export function onboardPreview(db: Db, content: ContentStore | null, input: SetupInput, step?: PreviewStep): OnboardPreview {
  const catalog = getCatalog(db, { departmentId: input.departmentId, includeArchived: true, withAreas: true });
  const setup = previewSetup(catalog, input);
  const skills = new Map<string, PreviewSkill>(catalog.skills.map((s) => [s.id, { name: s.name, area: s.area, trackIds: s.trackIds }]));
  const core = trackBasics(catalog, setup.departmentId, setup.trackId, setup.stackIds).map((s) => s.id);
  const trackName = catalog.tracks.find((t) => t.id === setup.trackId)?.name ?? null;
  const out: OnboardPreview = { testChecks: [], firstSteps: [], newCourses: [] };

  if (step === undefined || step === "checks" || step === "test") {
    const blueprint = blueprintInputs(db, catalog, setup);
    const mix = planBlueprintMix(setup.priorities, blueprint.core, blueprint.probes, blueprint.intents);
    if (step === "checks") {
      // Which skills the questions are on; their kinds come in the next step.
      const questions = mix.lines.flatMap((l) => Array.from({ length: l.count }, () => ({ skillId: l.skillId })));
      out.testChecks = testChecksFrom({ questions, skills, intents: setup.intents, coreSkillIds: core, trackName });
    } else {
      const format = catalog.departments.find((d) => d.id === setup.departmentId)?.assessmentFormat ?? "coding";
      const defaults = subtypeDefaults(catalog, format);
      const slots = withOutcomeSlots(
        enforceBlueprint({
          proposed: [],
          mix,
          skip: setup.skip.map((s) => s.skillId),
          skillNames: new Map(catalog.skills.map((s) => [s.id, s.name])),
          format,
          difficultyOrder: difficultyOrder(setup.level, setup.experienceBand),
          defaultHandsOn: defaults.handsOn,
          defaultMcq: defaults.mcq,
          allowSubtype: (skillId, subtype) => subtype !== "terminal" && (subtype !== "roleplay" || allowsRoleplay(skillId)) && softSubtypeAllowed(skillId, subtype),
          afterSpeakCap: softWrittenKindFor,
        }),
        blueprint.cases,
      );
      out.testChecks = testChecksFrom({ questions: slots.map((s) => ({ skillId: s.skillId, subtype: s.subtype })), skills, intents: setup.intents, coreSkillIds: core, trackName });
      const perSkill = new Map<string, { skillId: string; skillName: string; count: number; spoken: number }>();
      for (const slot of slots) {
        const row = perSkill.get(slot.skillId) ?? { skillId: slot.skillId, skillName: slot.skillName, count: 0, spoken: 0 };
        row.count += 1;
        if (slot.subtype === "speak") row.spoken += 1;
        perSkill.set(slot.skillId, row);
      }
      out.questions = [...perSkill.values()];
      out.minutes = Math.max(1, Math.round(slots.reduce((sum, s) => sum + s.targetSec, 0) / 60));
    }
  }

  if (step === undefined || step === "path") {
    const ctx = goalPathContextFor(db, setup, null);
    const plan = planGoalPath(ctx, { gaps: [], refreshSkill: null, assessmentFoundGaps: false });
    const pathSkillIds = plan.items.map((i) => i.skillId).filter((id): id is string => id != null);
    out.firstSteps = firstStepsFrom({ pathSkillIds, skills, intents: setup.intents, coreSkillIds: core, trackId: setup.trackId, trackName });
    out.newCourses = uncoveredSkills(db, content, catalog, pathSkillIds).map((id) => skills.get(id)!.name);
  }
  return out;
}
