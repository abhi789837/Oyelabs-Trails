import type { ScoredGap } from "../../../shared/builder";
import { PRIORITY_ORDER, orderedTargets, type LearnerTarget, type TargetPriority } from "../../../shared/targets";
import { normaliseSkill } from "./scoring";

/**
 * The admin's targets are the spine of the path.
 *
 * ## What this replaces, and why
 *
 * The path used to be built from the gaps a model found while reading the assessment, ordered by a
 * score. The admin's list was one input to that score and nothing more — so a learner whose admin
 * had set two High targets got a path of seven things the model noticed instead, and neither target
 * appeared. That was not a ranking problem that could be tuned. The admin had made a decision and
 * the system had treated it as a hint.
 *
 * So the structure is inverted. Targets come first and detected gaps are demoted to two jobs:
 *
 * - **deciding where a target starts** — a learner who scored 5/5 on "Docker deployment" still gets
 *   a Docker course, it just starts at Advanced and skips what they have proven;
 * - **suggesting extras** — anything matching no target goes to the bottom, collapsed, optional.
 *
 * ## The rule that is easy to get wrong
 *
 * **Every High target gets a course, whatever the assessment said.** Not "unless they did well".
 * An admin who writes down that somebody must learn multi-agent development has not asked whether
 * they already can — they have said it is part of the job. The assessment answers *where to start*,
 * never *whether to start*.
 */

export type StartLevel = "beginner" | "intermediate" | "advanced";

/** How much of the weekly budget prerequisite refreshers may take, all together. */
export const PREREQ_TIME_SHARE = 0.2;
/** One refresher. Short enough to clear before the real work starts. */
export const PREREQ_MINUTES = { min: 15, max: 45 } as const;

export interface TargetPlan {
  target: LearnerTarget;
  priority: TargetPriority;
  /** Position in the admin's order, across all priorities. The path's spine, in one number. */
  rank: number;
  /** 0–5 from the assessment, or null when nothing measured it. */
  assessedLevel: number | null;
  /** Where the course should begin. Derived from `assessedLevel`, never from the admin's guess. */
  startLevel: StartLevel;
  /**
   * The detected gap that matched this target, if any.
   *
   * Carries the evidence sentence and the item ids, so the admin's "why" can quote what actually
   * happened rather than repeating the target's own name back at them.
   */
  evidence: ScoredGap | null;
  /** Short refreshers this target depends on, in the order they should be done. */
  prerequisites: ScoredGap[];
}

export interface PriorityPath {
  /** In the admin's order: every High, then every Medium, then every Low. */
  targets: TargetPlan[];
  /**
   * Gaps the assessment found that match no target.
   *
   * Last, collapsed, and marked optional in the UI. Kept rather than dropped because they are real
   * findings and the admin can promote one into a target with a click — but they never rank above
   * something a person decided.
   */
  alsoSuggested: ScoredGap[];
}

export interface BuildSpineInput {
  targets: readonly LearnerTarget[];
  gaps: readonly ScoredGap[];
  /** Skills the admin said not to teach. Never a target, never a prerequisite, never a suggestion. */
  skip: readonly string[];
  /** Per-area levels from the evaluation, for the starting level. */
  areaLevels?: { area: string; level: number }[];
  /**
   * The learner's stack, which widens what counts as groundwork.
   *
   * "Closures" underpins a React target whether or not the target says "JavaScript", because the
   * stack already said so. Without it the same gap would be filed as an optional suggestion.
   */
  stack?: string;
}

/**
 * Does this gap belong to this target?
 *
 * Substring in either direction on normalised text, the same rule `scoring.ts` uses to match an
 * admin's entry against a detected gap — with the shorter side needing three characters so "Go"
 * does not match "Django".
 */
export function matchesTarget(gapSkill: string, targetSkill: string): boolean {
  const gap = normaliseSkill(gapSkill);
  const target = normaliseSkill(targetSkill);
  if (gap === target) return true;
  const shorter = gap.length <= target.length ? gap : target;
  if (shorter.length < 3) return false;
  return gap.includes(target) || target.includes(gap);
}

/**
 * Where a target's course should begin.
 *
 * The only thing the assessment is allowed to decide about a target. Deliberately coarse: three
 * bands, because the difference between "they scored 3.4" and "they scored 3.6" is noise and
 * pretending otherwise would make the same person start in different places on different days.
 */
export function startLevelFor(assessedLevel: number | null): StartLevel {
  if (assessedLevel === null) return "beginner";
  if (assessedLevel >= 4) return "advanced";
  if (assessedLevel >= 2) return "intermediate";
  return "beginner";
}

/** True when the admin's skip list covers this skill. */
function isSkipped(skill: string, skip: readonly string[]): boolean {
  return skip.some((entry) => matchesTarget(skill, entry));
}

/**
 * Foundational subjects, and what each one actually underpins.
 *
 * The domains are the point. An earlier version tested only "is this foundational?", which attached
 * JavaScript closures as groundwork for a Docker deployment course — foundational, yes, and nothing
 * whatsoever to do with the target. A prerequisite is a *dependency claim*, so the claim has to be
 * written down rather than inferred from the word looking basic.
 *
 * A list rather than a model call because this runs for every target on every rebuild, and because
 * an admin should be able to predict what will appear under their target.
 */
const FOUNDATIONS: { word: string; underpins: string[] }[] = [
  { word: "closure", underpins: ["javascript", "typescript", "js", "ts", "react", "node", "vue", "angular", "frontend", "full stack", "agent", "ai"] },
  { word: "async", underpins: ["javascript", "typescript", "node", "api", "agent", "ai", "backend", "full stack"] },
  { word: "promise", underpins: ["javascript", "typescript", "node", "api", "agent", "ai", "frontend", "full stack"] },
  { word: "hoisting", underpins: ["javascript", "typescript", "js", "frontend"] },
  { word: "javascript", underpins: ["react", "vue", "angular", "node", "frontend", "full stack", "agent", "ai"] },
  { word: "typescript", underpins: ["react", "node", "nest", "frontend", "full stack", "agent", "ai"] },
  { word: "command line", underpins: ["docker", "deploy", "devops", "server", "hosting", "cloud", "agent", "cli", "linux", "kubernetes"] },
  { word: "linux", underpins: ["docker", "deploy", "devops", "server", "hosting", "cloud", "agent", "cli", "kubernetes"] },
  { word: "shell", underpins: ["docker", "deploy", "devops", "server", "hosting", "cloud", "agent", "cli", "kubernetes"] },
  { word: "git", underpins: ["deploy", "devops", "ci", "workflow", "agent", "ai", "collaboration"] },
  { word: "http", underpins: ["api", "rest", "graphql", "backend", "full stack", "integration"] },
  { word: "debugging", underpins: ["agent", "ai", "review", "testing", "workflow"] },
  { word: "testing", underpins: ["agent", "ai", "review", "ci", "deploy", "workflow"] },
];

/**
 * A gap worth doing *before* a target, rather than beside it.
 *
 * Three conditions, and each rules out a different wrong answer:
 *
 * - it has to be something they actually got wrong, or a refresher spends the 20% on something they
 *   can already do;
 * - it has to be foundational rather than adjacent — "closures" before an agent-building course is
 *   groundwork, "REST APIs" beside it is a separate subject;
 * - and the target has to be in a domain that foundation **underpins**, or "foundational" degrades
 *   into "basic-sounding", which is how closures ended up under Docker.
 *
 * Failing the third sends it to "Also suggested", where the admin can promote it. That is the safe
 * direction to be wrong in: an extra optional suggestion costs a glance, and groundwork that makes
 * no sense costs trust in the whole page.
 */
function isPrerequisiteOf(gap: ScoredGap, target: LearnerTarget, stack: string): boolean {
  if (gap.severity < 0.4) return false;
  if (matchesTarget(gap.skill, target.skill)) return false;

  const skill = normaliseSkill(gap.skill);
  const context = `${normaliseSkill(target.skill)} ${normaliseSkill(stack)}`;

  return FOUNDATIONS.some(
    (foundation) => skill.includes(foundation.word) && foundation.underpins.some((domain) => context.includes(domain)),
  );
}

export function buildSpine(input: BuildSpineInput): PriorityPath {
  const ordered = orderedTargets(input.targets).filter((target) => !isSkipped(target.skill, input.skip));
  const usable = input.gaps.filter((gap) => !gap.skipped && !isSkipped(gap.skill, input.skip));

  /* Which gaps have been spoken for. A gap is evidence for at most one target and a prerequisite of
     at most one, so the same finding cannot appear three times down the page. */
  const claimed = new Set<string>();

  const targets: TargetPlan[] = ordered.map((target, index) => {
    const evidence = usable.find((gap) => !claimed.has(gap.skill) && matchesTarget(gap.skill, target.skill)) ?? null;
    if (evidence) claimed.add(evidence.skill);

    const assessedLevel = levelFor(target, evidence, input.areaLevels ?? []);

    return {
      target,
      priority: target.priority,
      rank: index,
      assessedLevel,
      startLevel: startLevelFor(assessedLevel),
      evidence,
      prerequisites: [],
    };
  });

  /* Prerequisites, attached after every target has its evidence — so a foundational gap is only
     ever groundwork for something, never groundwork for the first target that happened to ask. */
  for (const plan of targets) {
    for (const gap of usable) {
      if (claimed.has(gap.skill)) continue;
      if (!isPrerequisiteOf(gap, plan.target, input.stack ?? "")) continue;
      plan.prerequisites.push(gap);
      claimed.add(gap.skill);
    }
  }

  return {
    targets,
    alsoSuggested: usable.filter((gap) => !claimed.has(gap.skill)),
  };
}

/**
 * The level the assessment measured for this target.
 *
 * From the matched gap's severity where there is one — a gap is "how badly this is missing", so
 * five minus five times severity is the level it implies — and from a same-named evaluation area
 * otherwise. Null when nothing measured it at all, which is an honest answer and starts them at
 * the beginning.
 */
function levelFor(
  target: LearnerTarget,
  evidence: ScoredGap | null,
  areaLevels: readonly { area: string; level: number }[],
): number | null {
  const area = areaLevels.find((entry) => matchesTarget(entry.area, target.skill));
  if (area) return area.level;
  if (evidence) return Math.max(0, Math.round((1 - evidence.severity) * 5));
  return null;
}

/**
 * Checks the promises this module makes.
 *
 * Run after the fact rather than trusted, and the result is logged and surfaced. The three things
 * worth catching are the three an admin would notice: a target missing, the order changed, or a
 * detected gap sitting above something a person asked for.
 */
export function assertSpine(path: PriorityPath, input: BuildSpineInput): string[] {
  const problems: string[] = [];

  const expected = orderedTargets(input.targets)
    .filter((target) => !isSkipped(target.skill, input.skip))
    .map((target) => target.skill);
  const actual = path.targets.map((plan) => plan.target.skill);

  if (actual.length !== expected.length) {
    problems.push(`${expected.length} targets were set and ${actual.length} are on the path`);
  }
  for (let i = 0; i < Math.min(expected.length, actual.length); i++) {
    if (expected[i] !== actual[i]) {
      problems.push(`target ${i + 1} should be "${expected[i]}" and is "${actual[i]}"`);
      break;
    }
  }

  /* Priorities never interleave: every High comes before every Medium, and so on. `orderedTargets`
     guarantees it, which is precisely why it is worth checking — a guarantee nobody verifies is a
     comment. */
  const ranks = path.targets.map((plan) => PRIORITY_ORDER.indexOf(plan.priority));
  for (let i = 1; i < ranks.length; i++) {
    if (ranks[i] < ranks[i - 1]) {
      problems.push("a lower priority target is ordered above a higher one");
      break;
    }
  }

  for (const plan of path.targets) {
    if (plan.prerequisites.some((gap) => matchesTarget(gap.skill, plan.target.skill))) {
      problems.push(`"${plan.target.skill}" is listed as its own prerequisite`);
    }
  }

  for (const gap of path.alsoSuggested) {
    if (path.targets.some((plan) => matchesTarget(gap.skill, plan.target.skill))) {
      problems.push(`"${gap.skill}" is suggested separately although it matches a target`);
    }
  }

  return problems;
}

/**
 * How many minutes of refreshers a week can carry, and which ones fit.
 *
 * The cap is on the *total*, not per target: three targets each pulling in a 45-minute refresher is
 * over two hours, which on a fifteen-hour week is most of a day spent on groundwork before anything
 * the admin asked for has started.
 */
export function fitPrerequisites(path: PriorityPath, weeklyBudgetMinutes: number, minutesFor: (gap: ScoredGap) => number): ScoredGap[] {
  const ceiling = Math.round(weeklyBudgetMinutes * PREREQ_TIME_SHARE);
  const kept: ScoredGap[] = [];
  let spent = 0;

  // In target order, so the first High target's groundwork is the groundwork that survives.
  for (const plan of path.targets) {
    for (const gap of plan.prerequisites) {
      const minutes = Math.min(PREREQ_MINUTES.max, Math.max(PREREQ_MINUTES.min, minutesFor(gap)));
      if (spent + minutes > ceiling) continue;
      kept.push(gap);
      spent += minutes;
    }
  }

  return kept;
}
