import { SLIDER_LABELS, type Slider } from "./setup";
import { ancestorsClosure, descendantsClosure, findCycle, prerequisiteChain, topologicalOrder, type SkillEdge } from "./skillGraph";

/**
 * v4.3: the order a learner's path takes. Pure (no DB), deterministic, tested.
 *
 * ## Inputs
 * - **targets**: skills the goals ask for, each with the goal's slider (1–5), the goal's admin order
 *   and the level the goal needs (1–5). `expandGoalToSkills` turns one goal into targets.
 * - **mastery**: skill → level 0–5 from the evaluation. An unmeasured skill counts as 0 (a gap) by
 *   default, so an un-diagnosed prerequisite is pulled in rather than assumed (RESEARCH §2, "goal
 *   closure over requires"); `options.unmeasured = "met"` flips that.
 * - **edges**: the skill graph. Only `prerequisite` edges order anything; `recommended` edges are used
 *   only for the no-gap continuation.
 * - **criticallyWeak**: skills the evaluation found critically weak *and* important (say AI skills for
 *   a team moving to AI-driven work). Measured **core** skills at or below `criticalWeakLevel` (1)
 *   join them automatically.
 *
 * ## Rules
 * 1. **Targets.** A target is needed when mastery < its goal level. Otherwise it is **skipped**
 *    (returned in `skipped`, flagged `optionalAdvanced` while mastery < 5).
 * 2. **Must-haves.**
 *    - *Missing links.* The full prerequisite chain of every needed target and must-have is walked
 *      (every hop, not one). A prerequisite is a missing link when its mastery is below its
 *      **needed level = min(the dependent goal's level, `prerequisiteLevel`)** (default 3: you need
 *      a working grasp of async JS for Backend, not mastery). The walk stops at a prerequisite
 *      that is already good enough, since everything behind it is implied.
 *    - *Critically weak & important* skills that are below their needed level.
 *    - **Label.** A must-have is **Critical** if it blocks (is a prerequisite, at any depth, of) a
 *      needed Critical or High goal target, or is itself flagged on a Critical/High target.
 *      Otherwise it is **High**.
 *    - **Only the earliest weak link is boosted.** When several skills on one prerequisite chain
 *      are flagged, only those with no flagged, needed prerequisite get the boost. Boosting the
 *      fundamentals is what unblocks the rest. The advanced skill keeps its goal's own priority, so
 *      "AI fundamentals" moves up while "advanced AI workflows" stays Medium.
 * 3. **Order.** Kahn's algorithm with a priority queue (RESEARCH §2). A skill is ready once every
 *    skill in the plan that it needs, at any depth, is scheduled. Never before. Among ready skills
 *    the next is picked by, in order:
 *    a. **Scheduling rank**, highest first. Rank = max(its own priority, the priority of everything
 *       in the plan it unblocks). A prerequisite therefore inherits the urgency of what it unblocks,
 *       so a High goal's chain is never starved behind Medium work. A missing link has no priority of
 *       its own for scheduling: it is ranked exactly as high as what it unblocks. Its *label* says
 *       Critical, which means "not optional", not "jump ahead of other High work". It is still
 *       done just in time, right before the goal that needs it.
 *    b. **Boosted must-haves first** (critically weak & important), at equal rank. They speed up
 *       everything after them, so they go as soon as they are ready within their band.
 *    c. **Admin order** (the earliest goal it serves).
 *    d. **Unblocks the most** other plan targets and must-haves.
 *    e. **Skill id**, so the order is reproducible.
 * 4. **Reasons.** Every step carries one sentence saying why it is where it is.
 * 5. **No gap.** If nothing is needed (no target below its level, no missing link, no weak
 *    must-have), the path continues the progression. It takes the skills that build on each goal's
 *    skills (prerequisite edges first, then recommended), up to `continuationDepth` hops. It takes
 *    only skills whose other prerequisites are met, so it is the KST outer fringe. These come back
 *    as `continuation` steps.
 *
 * ## The worked example (pathOrder.test.ts)
 * A frontend developer has goals Git (Critical), Backend (High) and AI-driven development (Medium).
 * The evaluation found Git basics 2/5, AI skills 1/5 (critically weak) and async JS 1/5. The order:
 * Git basics → Git branching & PRs (Critical, rank 5) → AI fundamentals (boosted to must-have, High
 * because it blocks nothing Critical/High; rank 4, boost wins the tie b) → async JS (missing link,
 * labelled Critical because it blocks the High Backend goal, ranked 4 by inheritance) → Node/Express
 * → databases → auth → deployment (High) → advanced AI workflows (Medium, rank 3).
 */

export type PathPriority = (typeof SLIDER_LABELS)[Slider];
export type PathStepKind = "target" | "missing-link" | "must-have" | "continuation";

export interface PathTarget {
  skillId: string;
  /** The goal's slider, 1–5 (Optional … Critical). */
  slider: number;
  /** The goal's position in the admin's list. Lower is earlier. */
  adminOrder: number;
  /** The mastery level (1–5) the goal needs. */
  goalLevel: number;
  /** What the goal is called in reasons ("Backend"). Defaults to the skill's name. */
  goalLabel?: string;
}

export interface CriticallyWeakFlag {
  skillId: string;
  /** How reasons name it ("AI-driven skills"). Defaults to the skill's name. */
  label?: string;
  /** Why it matters, finishing "…weak, and ___" ("they speed up your Backend work"). */
  why?: string;
}

export interface PathOrderOptions {
  /** The highest level a prerequisite is ever required at. Default 3. */
  prerequisiteLevel?: number;
  /** A measured core skill at or below this is critically weak. Default 1. */
  criticalWeakLevel?: number;
  /** How to treat a skill the evaluation did not measure. Default "gap" (level 0). */
  unmeasured?: "gap" | "met";
  /** How many hops the no-gap continuation walks. Default 2. */
  continuationDepth?: number;
}

export interface PathOrderInput {
  targets: readonly PathTarget[];
  mastery: Readonly<Record<string, number>>;
  edges: readonly SkillEdge[];
  coreSkillIds?: readonly string[];
  criticallyWeak?: readonly (string | CriticallyWeakFlag)[];
  /** Skill names for reasons. Ids are used when missing. */
  names?: Readonly<Record<string, string>>;
  options?: PathOrderOptions;
}

export interface PathStep {
  skillId: string;
  priority: PathPriority;
  kind: PathStepKind;
  reason: string;
  /** The plan skills this one waited for (its nearest prerequisites in the plan). */
  blockedBy: string[];
  /** The level this step is for. */
  neededLevel: number;
  /** From the evaluation, or null when not measured. */
  mastery: number | null;
}

export interface SkippedSkill {
  skillId: string;
  mastery: number;
  neededLevel: number;
  /** Mastered for the goal but not at 5/5: an advanced course is still on offer. */
  optionalAdvanced: boolean;
  reason: string;
}

export interface MissingLink {
  skillId: string;
  mastery: number | null;
  neededLevel: number;
  /** The plan targets and must-haves it blocks. */
  blocks: string[];
}

export interface PathOrderResult {
  steps: PathStep[];
  skipped: SkippedSkill[];
  missingLinks: MissingLink[];
  /** Only when the graph had a cycle (which validation should have prevented). */
  warnings: string[];
}

const DEFAULTS: Required<PathOrderOptions> = { prerequisiteLevel: 3, criticalWeakLevel: 1, unmeasured: "gap", continuationDepth: 2 };

const clampSlider = (slider: number): Slider => Math.min(5, Math.max(1, Math.round(slider))) as Slider;
const label = (slider: number): PathPriority => SLIDER_LABELS[clampSlider(slider)];
const CRITICAL = 5;
const HIGH = 4;

interface PlanNode {
  id: string;
  kind: "target" | "missing-link" | "must-have";
  /** Own priority as a slider value; 0 for a missing link (it only inherits). */
  own: number;
  /** The goal's slider when this is a target, else 0. Labels are decided on this. */
  slider: number;
  /** Displayed priority as a slider value. */
  labelValue: number;
  needed: number;
  adminOrder: number;
  goalLabel: string | null;
  boost: boolean;
  isTarget: boolean;
  flag: CriticallyWeakFlag | null;
}

export function orderPath(input: PathOrderInput): PathOrderResult {
  const opts = { ...DEFAULTS, ...input.options };
  const edges = input.edges.filter((e) => e.type === "prerequisite");
  const name = (id: string) => input.names?.[id] ?? id;
  const measured = (id: string) => Object.prototype.hasOwnProperty.call(input.mastery, id);
  const level = (id: string) => (measured(id) ? input.mastery[id] : opts.unmeasured === "met" ? 5 : 0);
  const masteryOrNull = (id: string) => (measured(id) ? input.mastery[id] : null);
  const warnings: string[] = [];
  const cycle = findCycle(edges);
  if (cycle) warnings.push(`The skill graph has a loop (${cycle.join(" → ")}); those skills are ordered by priority only.`);

  // -- 1. Targets, merged by skill (highest slider and level, earliest goal) --------------------
  const targets = new Map<string, PathTarget>();
  for (const t of input.targets) {
    const prev = targets.get(t.skillId);
    if (!prev) targets.set(t.skillId, { ...t });
    else
      targets.set(t.skillId, {
        skillId: t.skillId,
        slider: Math.max(prev.slider, t.slider),
        goalLevel: Math.max(prev.goalLevel, t.goalLevel),
        adminOrder: Math.min(prev.adminOrder, t.adminOrder),
        goalLabel: (t.slider > prev.slider ? t.goalLabel : prev.goalLabel) ?? prev.goalLabel ?? t.goalLabel,
      });
  }

  const skipped: SkippedSkill[] = [];
  const plan = new Map<string, PlanNode>();
  for (const t of [...targets.values()].sort((a, b) => a.adminOrder - b.adminOrder || a.skillId.localeCompare(b.skillId))) {
    const m = level(t.skillId);
    if (m >= t.goalLevel) {
      skipped.push({
        skillId: t.skillId,
        mastery: m,
        neededLevel: t.goalLevel,
        optionalAdvanced: m < 5,
        reason: `Skipped: you're already at ${m}/5 and the goal needs ${t.goalLevel}/5.${m < 5 ? " An advanced course is optional." : ""}`,
      });
      continue;
    }
    plan.set(t.skillId, {
      id: t.skillId,
      kind: "target",
      own: clampSlider(t.slider),
      slider: clampSlider(t.slider),
      labelValue: clampSlider(t.slider),
      needed: t.goalLevel,
      adminOrder: t.adminOrder,
      goalLabel: t.goalLabel ?? null,
      boost: false,
      isTarget: true,
      flag: null,
    });
  }

  // -- 2a. Critically weak & important skills --------------------------------------------------
  const flags = new Map<string, CriticallyWeakFlag>();
  for (const f of input.criticallyWeak ?? []) {
    const flag = typeof f === "string" ? { skillId: f } : f;
    flags.set(flag.skillId, { ...flags.get(flag.skillId), ...flag });
  }
  for (const id of input.coreSkillIds ?? []) {
    if (measured(id) && level(id) <= opts.criticalWeakLevel && !flags.has(id)) flags.set(id, { skillId: id });
  }
  const weak = new Set<string>();
  for (const [id] of flags) {
    const target = targets.get(id);
    const needed = target ? target.goalLevel : opts.prerequisiteLevel;
    if (level(id) < needed) weak.add(id);
  }
  for (const id of weak) {
    const flag = flags.get(id)!;
    const existing = plan.get(id);
    const ancestors = ancestorsClosure(edges, [id]);
    const boost = ![...weak].some((other) => other !== id && ancestors.has(other));
    // A flagged target behind another flagged skill keeps its goal's own priority (rule 2).
    if (existing && !boost) continue;
    if (existing) {
      existing.kind = "must-have";
      existing.flag = flag;
      existing.boost = boost;
    } else {
      plan.set(id, {
        id,
        kind: "must-have",
        own: HIGH,
        slider: 0,
        labelValue: HIGH,
        needed: opts.prerequisiteLevel,
        adminOrder: Number.POSITIVE_INFINITY,
        goalLabel: null,
        boost,
        isTarget: false,
        flag,
      });
    }
  }

  // -- 2b. Missing links: walk the whole prerequisite chain of every needed skill ---------------
  const parents = new Map<string, string[]>();
  for (const e of edges) parents.set(e.to, [...(parents.get(e.to) ?? []), e.from]);
  const linkNeed = new Map<string, number>();
  for (const root of [...plan.values()]) {
    const carried = Math.min(root.needed, opts.prerequisiteLevel);
    const stack = [...(parents.get(root.id) ?? [])];
    const seen = new Set<string>();
    while (stack.length > 0) {
      const q = stack.pop()!;
      if (seen.has(q) || q === root.id) continue;
      seen.add(q);
      if (level(q) >= carried) continue; // good enough: everything behind it is implied
      if (!plan.has(q) || plan.get(q)!.kind === "missing-link") linkNeed.set(q, Math.max(linkNeed.get(q) ?? 0, carried));
      stack.push(...(parents.get(q) ?? []));
    }
  }
  for (const [id, needed] of linkNeed) {
    if (plan.has(id)) continue;
    plan.set(id, { id, kind: "missing-link", own: 0, slider: 0, labelValue: HIGH, needed, adminOrder: Number.POSITIVE_INFINITY, goalLabel: null, boost: false, isTarget: false, flag: null });
  }

  // -- Plan-relative closures (through the full graph, so a mastered skill in between still orders)
  const ids = [...plan.keys()].sort();
  const planAnc = new Map<string, string[]>();
  const planDesc = new Map<string, string[]>();
  for (const id of ids) {
    planAnc.set(id, [...ancestorsClosure(edges, [id])].filter((a) => plan.has(a) && a !== id));
    planDesc.set(id, [...descendantsClosure(edges, [id])].filter((d) => plan.has(d) && d !== id));
  }
  const isGoal = (n: PlanNode) => n.kind !== "missing-link";

  // -- Labels: must-haves are Critical when they block a Critical/High goal --------------------
  for (const id of ids) {
    const node = plan.get(id)!;
    if (node.kind === "target") continue;
    const blocksUrgent = planDesc.get(id)!.some((d) => plan.get(d)!.slider >= HIGH);
    const flaggedOnUrgentTarget = node.kind === "must-have" && node.slider >= HIGH;
    node.labelValue = blocksUrgent || flaggedOnUrgentTarget ? CRITICAL : HIGH;
    // A boosted must-have schedules at its label; a target keeps its own slider as its own rank.
    if (node.kind === "must-have") node.own = node.isTarget ? Math.max(node.own, node.labelValue) : node.labelValue;
  }

  // -- Scheduling keys -------------------------------------------------------------------------
  const rank = new Map<string, number>();
  const order = new Map<string, number>();
  const unblocks = new Map<string, number>();
  for (const id of ids) {
    const node = plan.get(id)!;
    const desc = planDesc.get(id)!.map((d) => plan.get(d)!);
    rank.set(id, Math.max(node.own, ...desc.map((d) => d.own)));
    order.set(id, Math.min(node.adminOrder, ...desc.filter((d) => d.isTarget).map((d) => d.adminOrder)));
    unblocks.set(id, desc.filter(isGoal).length);
  }
  const better = (a: string, b: string): number =>
    rank.get(b)! - rank.get(a)! ||
    Number(plan.get(b)!.boost) - Number(plan.get(a)!.boost) ||
    order.get(a)! - order.get(b)! ||
    unblocks.get(b)! - unblocks.get(a)! ||
    a.localeCompare(b);

  // -- 3. Kahn's algorithm with a priority queue ------------------------------------------------
  const scheduled: string[] = [];
  const done = new Set<string>();
  const remaining = new Set(ids);
  while (remaining.size > 0) {
    const ready = [...remaining].filter((id) => planAnc.get(id)!.every((a) => done.has(a)));
    const pool = ready.length > 0 ? ready : [...remaining]; // only on a cycle; warned above
    const next = pool.sort(better)[0];
    scheduled.push(next);
    done.add(next);
    remaining.delete(next);
  }

  // -- 4. Steps and reasons --------------------------------------------------------------------
  const goalName = (id: string) => plan.get(id)?.goalLabel ?? targets.get(id)?.goalLabel ?? name(id);
  const nearest = (id: string): string[] => {
    const anc = planAnc.get(id)!;
    return anc.filter((a) => !anc.some((b) => b !== a && planAnc.get(b)!.includes(a))).sort((a, b) => scheduled.indexOf(a) - scheduled.indexOf(b));
  };
  /** The goal a prerequisite is mainly for: the most urgent thing it unblocks, earliest goal first. */
  const mainDependent = (id: string): string | null =>
    planDesc
      .get(id)!
      .filter((d) => plan.get(d)!.isTarget || plan.get(d)!.kind === "must-have")
      .sort((a, b) => plan.get(b)!.own - plan.get(a)!.own || order.get(a)! - order.get(b)! || a.localeCompare(b))[0] ?? null;

  const steps: PathStep[] = scheduled.map((id) => {
    const node = plan.get(id)!;
    const m = masteryOrNull(id);
    const at = m == null ? "not measured yet" : `${m}/5`;
    const blockedBy = nearest(id);
    let reason: string;
    if (node.kind === "missing-link") {
      const dep = mainDependent(id);
      const goal = dep ? goalName(dep) : "your goals";
      reason = `Before ${goal} because ${goal} needs ${name(id)}, which you're missing (${at}; it needs ${node.needed}/5).`;
    } else if (node.kind === "must-have") {
      const what = node.flag?.label ?? name(id);
      reason = `Moved up: the evaluation found ${what} weak (${at}), and ${node.flag?.why ?? "it matters for this role"}.`;
    } else if (rank.get(id)! > node.own) {
      const dep = mainDependent(id);
      reason = `Moved up: ${dep ? goalName(dep) : "a more urgent goal"} needs ${name(id)} first.`;
    } else if (blockedBy.length > 0) {
      reason = `Next for your ${goalName(id)} goal, after ${blockedBy.map(name).join(" and ")}.`;
    } else {
      reason = `${label(node.own)} goal ${goalName(id)}: you're at ${at} and it needs ${node.needed}/5.`;
    }
    return { skillId: id, priority: label(node.labelValue), kind: node.kind, reason, blockedBy, neededLevel: node.needed, mastery: m };
  });

  const missingLinks: MissingLink[] = scheduled
    .filter((id) => plan.get(id)!.kind === "missing-link")
    .map((id) => ({ skillId: id, mastery: masteryOrNull(id), neededLevel: plan.get(id)!.needed, blocks: planDesc
        .get(id)!
        .filter((d) => isGoal(plan.get(d)!))
        .sort((a, b) => scheduled.indexOf(a) - scheduled.indexOf(b)),
    }));

  // -- 5. No gap: continue each goal's progression ----------------------------------------------
  if (steps.length === 0 && targets.size > 0) steps.push(...continuation(input, [...targets.values()], level, name, opts));

  // A target met for its own goal can still be a missing link for a goal that needs it higher.
  return { steps, skipped: skipped.filter((s) => !plan.has(s.skillId)), missingLinks, warnings };
}

function continuation(
  input: PathOrderInput,
  targets: PathTarget[],
  level: (id: string) => number,
  name: (id: string) => string,
  opts: Required<PathOrderOptions>,
): PathStep[] {
  const steps: PathStep[] = [];
  const chosen = new Set<string>();
  const targetIds = new Set(targets.map((t) => t.skillId));
  const met = (id: string) => targetIds.has(id) || chosen.has(id) || level(id) >= opts.prerequisiteLevel;
  const out = (id: string) => [
    ...input.edges.filter((e) => e.from === id && e.type === "prerequisite").map((e) => e.to).sort(),
    ...input.edges.filter((e) => e.from === id && e.type === "recommended").map((e) => e.to).sort(),
  ];
  for (const t of [...targets].sort((a, b) => a.adminOrder - b.adminOrder || a.skillId.localeCompare(b.skillId))) {
    let frontier: { id: string; via: string }[] = [{ id: t.skillId, via: t.skillId }];
    for (let depth = 0; depth < opts.continuationDepth && frontier.length > 0; depth += 1) {
      const next: { id: string; via: string }[] = [];
      for (const { id: from } of frontier) {
        for (const id of out(from)) {
          if (targetIds.has(id) || chosen.has(id)) continue;
          const needs = input.edges.filter((e) => e.to === id && e.type === "prerequisite").map((e) => e.from);
          if (!needs.every(met)) continue; // not ready yet: outside the outer fringe
          if (level(id) >= t.goalLevel) {
            next.push({ id, via: from }); // already there: walk through it
            continue;
          }
          chosen.add(id);
          next.push({ id, via: from });
          steps.push({
            skillId: id,
            priority: label(t.slider),
            kind: "continuation",
            reason: `Next after ${name(from)}: you've met your ${t.goalLabel ?? name(t.skillId)} goal, so this continues it.`,
            blockedBy: needs.filter((n) => chosen.has(n)),
            neededLevel: t.goalLevel,
            mastery: Object.prototype.hasOwnProperty.call(input.mastery, id) ? input.mastery[id] : null,
          });
        }
      }
      frontier = next;
    }
  }
  return steps;
}

/**
 * One goal as path targets. A goal names one or more skills. This adds every skill that lies
 * between two of them on a prerequisite chain, so "Node/Express … deployment" becomes the whole
 * Node → databases → auth → deployment chain, and returns them in learning order.
 */
export interface GoalForPath {
  skillIds: readonly string[];
  slider: number;
  adminOrder: number;
  goalLevel: number;
  label?: string;
}

export function expandGoalToSkills(goal: GoalForPath, edges: readonly SkillEdge[]): PathTarget[] {
  const prereq = edges.filter((e) => e.type === "prerequisite");
  const own = new Set(goal.skillIds);
  const between = new Set<string>();
  for (const id of goal.skillIds) {
    const below = descendantsClosure(prereq, [id]);
    for (const other of goal.skillIds) {
      if (other === id || !below.has(other)) continue;
      for (const mid of prerequisiteChain(prereq, other)) if (below.has(mid)) between.add(mid);
    }
  }
  const all = [...goal.skillIds, ...[...between].filter((id) => !own.has(id)).sort()];
  return topologicalOrder(all, prereq).map((skillId) => ({
    skillId,
    slider: goal.slider,
    adminOrder: goal.adminOrder,
    goalLevel: goal.goalLevel,
    ...(goal.label ? { goalLabel: goal.label } : {}),
  }));
}
