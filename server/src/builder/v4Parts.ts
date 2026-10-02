import type { ScoredGap } from "../../../shared/builder";
import type { Skill } from "../../../shared/catalog";
import type { V4Result } from "../../../shared/assessmentV4";
import type { DetectedGap } from "../../../shared/builder";
import type { PriorityEntry } from "../../../shared/setup";
import type { PriorityPath, StartLevel } from "./priorityPath";

/**
 * The v4 path order (Phase 8; decision D6), for every department:
 *
 * 1. **Part 1 — Strengthen your current role:** every Critical priority, the High priorities in the
 *    learner's own track, then (when there is room) the own-track basics the assessment found weak.
 * 2. **Part 2 — AI-driven work for your role:** the admin's AI-skill priorities, or the department's
 *    AI skill for this track and stack when none was picked.
 * 3. **Part 3 onward:** every remaining priority in slider order, each followed by its refreshers.
 *
 * AI-found gaps never become an item here; they stay in "Also suggested". Pure: the run calls it
 * and `assertV4Order` checks what it produced.
 *
 * **PM (v4.2).** Part 1 is: the diagnostic refresh (when the assessment found gaps); the custom and
 * white-label lifecycle courses where the assessment found them weak or they are Critical; project
 * terminology; client meetings; then the other Critical and High priorities by slider. Part 2 is AI;
 * Part 3 onward is the rest by slider, with the theory course last.
 */

/** v4.2: the PM process courses that open Part 1, in this order. */
export const PM_LIFECYCLE_SKILL_IDS: readonly string[] = ["pm-proc-custom", "pm-proc-whitelabel"];
export const PM_TERMS_SKILL_ID = "pm-proc-terms";
export const PM_MEETINGS_SKILL_ID = "pm-proc-meetings";

/** Weak = the assessment measured the skill at level 3 or below. Unmeasured is not weak. */
export function isWeak(assessedLevel: number | null | undefined): boolean {
  return assessedLevel != null && assessedLevel <= 3;
}

/**
 * Where a PM priority sits inside Part 1 (0 first), or null when it does not belong in Part 1:
 * 0 the lifecycle courses (weak or Critical), 1 terminology, 2 client meetings, 3 every other
 * Critical or High priority.
 */
export function pmPart1Rank(skillId: string | null, slider: number, assessedLevel: number | null | undefined): number | null {
  const weak = isWeak(assessedLevel);
  if (skillId && PM_LIFECYCLE_SKILL_IDS.includes(skillId) && (slider === 5 || weak)) return 0;
  if (skillId === PM_TERMS_SKILL_ID && (slider >= 4 || weak)) return 1;
  if (skillId === PM_MEETINGS_SKILL_ID && (slider >= 4 || weak)) return 2;
  return slider >= 4 ? 3 : null;
}

/** The generic PM theory course goes last on a PM path. */
export function isTheorySkill(skill: Pick<Skill, "id" | "tags"> | null | undefined): boolean {
  return Boolean(skill && (skill.tags.includes("theory") || skill.id === "pm-foundations-theory"));
}

export interface PlannedItem {
  gap: ScoredGap;
  partNumber: number;
  partType: "track" | "ai_dev" | "general";
  startLevel: StartLevel;
  targetSkill: string | null;
  skillId: string | null;
  /** What the assessment measured for this target (0-5), when it did. */
  assessedLevel?: number | null;
}

export interface V4PartsInput {
  spine: PriorityPath;
  priorities: readonly PriorityEntry[];
  skills: ReadonlyMap<string, Skill>;
  trackId: string | null;
  trackName: string;
  departmentName: string;
  stackIds: readonly string[];
  /** Own-track basics the assessment found weak, already scored. */
  ownTrackGaps: readonly ScoredGap[];
  /** The department's AI skill for this learner, used when no AI skill was prioritised. */
  defaultAiSkill: Skill | null;
  /**
   * v4.1: the department's "refresh your existing skills" course (PM: "Improving your existing PM
   * skills"). When the assessment found gaps it opens the path, ahead of every priority.
   */
  refreshSkill?: Skill | null;
  assessmentFoundGaps?: boolean;
  /** v4.2: the department; "pm" applies the PM process order. */
  departmentId?: string;
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

export function orderV4Parts(input: V4PartsInput): PlannedItem[] {
  const bySkillName = new Map(input.priorities.map((p) => [p.skillName.toLowerCase(), p]));
  const entryFor = (name: string) => bySkillName.get(name.toLowerCase()) ?? null;
  const skillFor = (name: string) => {
    const entry = entryFor(name);
    return entry ? (input.skills.get(entry.skillId) ?? null) : null;
  };
  const ownTrack = (skill: Skill | null) => Boolean(skill && input.trackId && skill.trackIds.includes(input.trackId));

  type Plan = PriorityPath["targets"][number];
  const part1: Plan[] = [];
  const part2: Plan[] = [];
  const rest: Plan[] = [];
  const pm = input.departmentId === "pm";
  const pmRank = (plan: Plan) => pmPart1Rank(entryFor(plan.target.skill)?.skillId ?? null, entryFor(plan.target.skill)?.slider ?? 0, plan.assessedLevel);
  for (const plan of input.spine.targets) {
    const entry = entryFor(plan.target.skill);
    const skill = skillFor(plan.target.skill);
    if (skill?.isAiSkill) part2.push(plan);
    else if (pm ? pmRank(plan) !== null : (entry?.slider ?? 0) === 5 || ((entry?.slider ?? 0) === 4 && ownTrack(skill))) part1.push(plan);
    else rest.push(plan);
  }
  if (pm) {
    // Stable sorts: inside a rank (and inside "the rest") the spine's slider order stands.
    part1.sort((a, b) => (pmRank(a) ?? 9) - (pmRank(b) ?? 9));
    const slider = (plan: Plan) => entryFor(plan.target.skill)?.slider ?? 0;
    rest.sort((a, b) => Number(isTheorySkill(skillFor(a.target.skill))) - Number(isTheorySkill(skillFor(b.target.skill))) || slider(b) - slider(a));
  }

  const items: PlannedItem[] = [];
  const push = (plans: Plan[], partNumberFor: (index: number) => number, partType: PlannedItem["partType"]) => {
    plans.forEach((plan, index) => {
      const partNumber = partNumberFor(index);
      items.push({
        gap: plan.evidence ? { ...plan.evidence, skill: plan.target.skill } : synthetic(plan.target.skill, `Your administrator set ${plan.target.skill} as a ${plan.priority} priority.`, 1),
        partNumber,
        partType,
        startLevel: plan.startLevel,
        targetSkill: plan.target.skill,
        skillId: entryFor(plan.target.skill)?.skillId ?? null,
        assessedLevel: plan.assessedLevel,
      });
      for (const prerequisite of plan.prerequisites) {
        items.push({ gap: prerequisite, partNumber, partType, startLevel: "beginner", targetSkill: plan.target.skill, skillId: null });
      }
    });
  };

  // Part 1 opens with the diagnostic refresh when the assessment showed gaps (v4.1, PM first).
  if (input.refreshSkill && input.assessmentFoundGaps && !input.spine.targets.some((t) => entryFor(t.target.skill)?.skillId === input.refreshSkill!.id)) {
    items.push({
      gap: synthetic(
        input.refreshSkill.name,
        "Built from your assessment: short refreshers on the gaps it found in your day-to-day work, before anything new.",
        0.8,
      ),
      partNumber: 1,
      partType: "track",
      startLevel: "beginner",
      targetSkill: null,
      skillId: input.refreshSkill.id,
    });
  }
  // Part 1: the priorities that define the role, then the weak own-track basics.
  push(part1, () => 1, "track");
  const claimed = new Set(items.map((i) => i.gap.skill.toLowerCase()));
  const basics = input.ownTrackGaps.filter((g) => !claimed.has(g.skill.toLowerCase())).slice(0, part1.length ? 1 : 2);
  for (const gap of basics) {
    items.push({ gap, partNumber: 1, partType: "track", startLevel: "beginner", targetSkill: null, skillId: null });
  }
  if (!items.some((i) => i.partNumber === 1)) {
    items.push({
      gap: synthetic(
        `${input.trackName} foundations`,
        `A short course on the parts of your ${input.trackName.toLowerCase()} work worth being solid on before anything new is added on top.`,
        0.7,
      ),
      partNumber: 1,
      partType: "track",
      startLevel: "beginner",
      targetSkill: null,
      skillId: null,
    });
  }

  // Part 2: AI for the role.
  if (part2.length) push(part2, () => 2, "ai_dev");
  else {
    const name = input.defaultAiSkill?.name ?? `AI-driven work for ${input.departmentName}`;
    items.push({
      gap: synthetic(name, `How to use AI well in your ${input.trackName.toLowerCase()} work: giving it the right context, checking what comes back, and knowing when not to use it.`),
      partNumber: 2,
      partType: "ai_dev",
      startLevel: "beginner",
      targetSkill: null,
      skillId: input.defaultAiSkill?.id ?? null,
    });
  }

  // Part 3 onward: every other priority, in slider order.
  push(rest, (index) => 3 + index, "general");
  return items;
}

export interface V4OrderCheck {
  /** "pm" also checks the PM process order. */
  departmentId?: string;
  refreshSkillId?: string | null;
  /** Skills that must come after every other priority (PM: the theory course). */
  theorySkillIds?: readonly string[];
  /** AI skill ids (Part 2), so they are not counted as Critical/High missing from Part 1. */
  aiSkillIds?: readonly string[];
}

/** What `orderV4Parts` promises, checked after the fact and stored where the admin can see it. */
export function assertV4Order(items: readonly PlannedItem[], priorities: readonly PriorityEntry[], check: V4OrderCheck = {}): string[] {
  const problems: string[] = [];
  if (items[0]?.partNumber !== 1) problems.push("The path does not open with Part 1");
  const firstTwo = items.findIndex((i) => i.partNumber === 2);
  if (firstTwo < 0) problems.push("There is no Part 2");
  if (items.some((item, index) => index > 0 && item.partNumber < items[index - 1].partNumber)) problems.push("Parts are out of order");
  for (const entry of priorities.filter((p) => p.slider >= 4)) {
    if (!items.some((i) => i.targetSkill?.toLowerCase() === entry.skillName.toLowerCase())) problems.push(`${entry.skillName} (High/Critical) has no place on the path`);
  }
  const critical = new Set(priorities.filter((p) => p.slider === 5).map((p) => p.skillName.toLowerCase()));
  for (const item of items) {
    if (item.targetSkill && critical.has(item.targetSkill.toLowerCase()) && item.partNumber > 2) problems.push(`Critical ${item.targetSkill} is after Part 2`);
  }
  if (check.departmentId === "pm") problems.push(...assertPmOrder(items, priorities, check));
  return problems;
}

/** The PM order (v4.2): refresh, lifecycle, terminology, meetings, other Critical/High; AI; rest; theory last. */
function assertPmOrder(items: readonly PlannedItem[], priorities: readonly PriorityEntry[], check: V4OrderCheck): string[] {
  const problems: string[] = [];
  const slider = new Map(priorities.map((p) => [p.skillId, p.slider]));
  const refreshAt = check.refreshSkillId ? items.findIndex((i) => i.skillId === check.refreshSkillId && !i.targetSkill) : -1;
  if (refreshAt > 0) problems.push("The diagnostic refresh does not open the PM path");
  const targets = items.filter((i) => i.targetSkill && i.skillId && slider.has(i.skillId) && i.gap.skill === i.targetSkill);
  const part1 = targets.filter((i) => i.partNumber === 1);
  const ranks = part1.map((i) => pmPart1Rank(i.skillId, slider.get(i.skillId!) ?? 0, i.assessedLevel));
  if (ranks.some((r) => r === null)) problems.push("A PM priority below High that the assessment did not find weak is in Part 1");
  if (ranks.some((r, index) => index > 0 && (r ?? 9) < (ranks[index - 1] ?? 9))) problems.push("PM Part 1 is not lifecycle, terminology, meetings, then the other Critical and High priorities");
  const ai = new Set(check.aiSkillIds ?? []);
  for (const item of targets) {
    if (ai.has(item.skillId!)) continue;
    const rank = pmPart1Rank(item.skillId, slider.get(item.skillId!) ?? 0, item.assessedLevel);
    if (rank !== null && item.partNumber !== 1) problems.push(`${item.targetSkill} belongs in Part 1 of a PM path`);
  }
  // Theory is last among the rest (Part 3 onward); an admin who made it High keeps it in Part 1.
  const theory = new Set(check.theorySkillIds ?? []);
  const later = targets.filter((i) => i.partNumber >= 3);
  const lastNonTheory = later.reduce((last, item, index) => (theory.has(item.skillId!) ? last : index), -1);
  if (later.some((item, index) => theory.has(item.skillId!) && index < lastNonTheory)) problems.push("The theory course is not last on the PM path");
  return problems;
}

/** Gaps from a v4 report, with no model call: every skill below level 4, worst first. */
export function gapsFromV4(result: V4Result): DetectedGap[] {
  return result.skills
    .filter((s) => s.score != null && (s.level ?? 0) <= 3)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .map((s) => ({
      skill: s.skillName,
      severity: Math.max(0, Math.min(1, 1 - (s.score ?? 0))),
      roleRelevance: s.group === "focus" ? 1 : s.group === "basics" ? 0.9 : 0.7,
      evidence: {
        summary: `Level ${s.level ?? 0} of 5 on ${s.asked} question${s.asked === 1 ? "" : "s"}${s.unknown ? `, ${s.unknown} answered "I don't know yet"` : ""}.`,
        itemIds: [],
        missed: Math.round(s.asked * (1 - (s.score ?? 0))),
        asked: s.asked,
      },
    }));
}
