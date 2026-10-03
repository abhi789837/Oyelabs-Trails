import { and, asc, desc, eq, inArray } from "drizzle-orm";

import type { V4Result } from "../../../shared/assessmentV4";
import {
  asOutcome,
  deriveSkillPriorities,
  goalKey,
  type CapstoneSummary,
  type GoalInput,
  type GoalSuggestion,
  type LearnerGoal,
  type LearnerGoalView,
  type PracticalOutcome,
} from "../../../shared/goals";
import { sortPriorities, type PriorityEntry, type Slider } from "../../../shared/setup";
import { getCatalog } from "../catalog/repo";
import type { Db } from "../db";
import * as schema from "../db/schema";
import { badRequest, notFound } from "../lib/errors";
import { newId, now } from "../lib/ids";
import { departmentOf, listSkip, replacePriorities } from "../setup/repo";
import { getOutcome, listOutcomes } from "./outcomes";

/**
 * v4.3 goals: what the admin edits ("What should they be able to do?"), and the one place the skill
 * priorities are derived from (D2). Everything downstream — the assessment mix, the AI
 * understanding, the path, the weekly plan — still reads `learner_skill_priorities`, so a learner
 * whose goals are plain skills behaves exactly as in v4.2.
 */

type GoalRow = typeof schema.learnerGoals.$inferSelect;

function toGoal(row: GoalRow): LearnerGoal {
  return {
    id: row.id,
    type: row.type,
    originalText: row.originalText,
    outcome: row.outcome,
    skillIds: row.skillIds,
    targetLevel: row.targetLevel,
    caseId: row.caseId,
    slider: row.slider,
    position: row.position,
    status: row.status,
    achievedAt: row.achievedAt,
    source: row.source,
  };
}

export function listGoals(db: Db, userId: string): LearnerGoal[] {
  return db.select().from(schema.learnerGoals).where(eq(schema.learnerGoals.userId, userId)).orderBy(asc(schema.learnerGoals.position)).all().map(toGoal);
}

export function getGoal(db: Db, userId: string, goalId: string): LearnerGoal | null {
  const row = db
    .select()
    .from(schema.learnerGoals)
    .where(and(eq(schema.learnerGoals.userId, userId), eq(schema.learnerGoals.id, goalId)))
    .get();
  return row ? toGoal(row) : null;
}

/** A skill goal's target when nobody chose one: a step above the learner's level, else Intermediate. */
export function defaultTargetLevel(level: number | null | undefined): number {
  return level ? Math.min(5, Math.max(2, level + 1)) : 3;
}

/** A plain catalog skill as a goal. */
export function skillGoal(skill: { id: string; name: string }, slider: number, targetLevel: number): Omit<GoalInput, "id"> {
  return {
    type: "skill",
    originalText: skill.name.slice(0, 300),
    outcome: asOutcome(`apply ${skill.name} at work`),
    skillIds: [skill.id],
    targetLevel,
    caseId: null,
    slider,
  };
}

/**
 * Writes the derived priorities: each linked skill at the highest slider of any goal linking it,
 * in goal order then skill order. The skip list is kept (skipping still wins, as in v4.2).
 */
export function writeDerivedPriorities(db: Db, userId: string, goals: readonly Pick<GoalInput, "skillIds" | "slider">[], skip?: readonly { skillId: string; skillName: string }[]): PriorityEntry[] {
  const derived = deriveSkillPriorities(goals);
  const names = new Map(getCatalog(db, { includeArchived: true }).skills.map((s) => [s.id, s.name]));
  replacePriorities(
    db,
    userId,
    derived.map((d) => ({ skillId: d.skillId, skillName: names.get(d.skillId) ?? d.skillId, slider: d.slider as Slider })),
    skip ?? listSkip(db, userId),
  );
  return sortPriorities(derived.map((d, position) => ({ skillId: d.skillId, skillName: names.get(d.skillId) ?? d.skillId, slider: d.slider as Slider, position })));
}

/**
 * Validates goals against the learner's department (skills in its catalog, cases in its library),
 * drops exact duplicates, and fails loudly on anything else so a stale client cannot attach a PM
 * skill to an engineer.
 */
export function validateGoals(db: Db, departmentId: string, goals: readonly GoalInput[]): GoalInput[] {
  const skills = new Map(getCatalog(db, { departmentId, includeArchived: true }).skills.map((s) => [s.id, s]));
  const out: GoalInput[] = [];
  const seen = new Set<string>();
  goals.forEach((goal, index) => {
    const wrong = goal.skillIds.find((id) => skills.get(id)?.departmentId !== departmentId);
    if (wrong) throw badRequest("A goal links a skill that is not in this department's catalog.", { [`goals.${index}.skillIds`]: `Unknown skill ${wrong}` });
    if (goal.caseId) {
      const outcome = getOutcome(db, goal.caseId);
      if (!outcome || outcome.departmentId !== departmentId) throw badRequest("A goal links a case that is not in this department's library.", { [`goals.${index}.caseId`]: `Unknown case ${goal.caseId}` });
    }
    const key = `${goal.type}:${goal.caseId ?? ""}:${goalKey(goal.skillIds, goal.targetLevel)}:${goal.outcome.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    // A skill goal says what the catalog says; its text from the client is only a placeholder.
    const named = goal.type === "skill" && goal.skillIds.length === 1 ? skills.get(goal.skillIds[0]) : undefined;
    out.push({ ...goal, ...(named ? skillGoal(named, goal.slider, goal.targetLevel) : {}), skillIds: [...new Set(goal.skillIds)] });
  });
  return out;
}

/**
 * Replaces the learner's goals with `inputs`, in order, then derives the priorities from them.
 *
 * A goal sent back with its id keeps its status, source and creation time; if its skills or target
 * level changed it is active again (it no longer says what was achieved). Goals left out are removed.
 */
export function saveGoals(
  db: Db,
  userId: string,
  inputs: readonly GoalInput[],
  options: { departmentId?: string; source?: LearnerGoal["source"]; skip?: readonly { skillId: string; skillName: string }[] } = {},
): LearnerGoal[] {
  const departmentId = options.departmentId ?? departmentOf(db, userId);
  const goals = validateGoals(db, departmentId, inputs);
  const at = now();
  const existing = new Map(listGoals(db, userId).map((g) => [g.id, g]));
  db.transaction((tx) => {
    tx.delete(schema.learnerGoals).where(eq(schema.learnerGoals.userId, userId)).run();
    goals.forEach((goal, position) => {
      const before = goal.id ? existing.get(goal.id) : undefined;
      const same = before && goalKey(before.skillIds, before.targetLevel) === goalKey(goal.skillIds, goal.targetLevel);
      tx.insert(schema.learnerGoals)
        .values({
          id: before?.id ?? newId(),
          userId,
          type: goal.type,
          originalText: goal.originalText,
          outcome: goal.outcome,
          skillIds: goal.skillIds,
          targetLevel: goal.targetLevel,
          caseId: goal.caseId ?? null,
          slider: goal.slider,
          position,
          status: same ? before.status : "active",
          achievedAt: same ? before.achievedAt : null,
          source: before?.source ?? options.source ?? "admin",
          createdAt: at,
          updatedAt: at,
        })
        .run();
    });
  });
  writeDerivedPriorities(db, userId, goals, options.skip);
  return listGoals(db, userId);
}

/**
 * A v4.2 client saved plain priorities: they become the skill goals. Case and text goals stay; a
 * priority already covered by one of them is not doubled up as a skill goal. The priorities are
 * left exactly as sent.
 */
export function syncSkillGoalsFromPriorities(db: Db, userId: string, priorities: readonly PriorityEntry[], level: number | null): void {
  const current = listGoals(db, userId);
  const others = current.filter((g) => g.type !== "skill");
  const covered = new Set(others.flatMap((g) => g.skillIds));
  const bySkill = new Map(current.filter((g) => g.type === "skill" && g.skillIds.length === 1).map((g) => [g.skillIds[0], g]));
  const at = now();
  const skillGoals = sortPriorities(priorities).filter((p) => !covered.has(p.skillId));
  db.transaction((tx) => {
    tx.delete(schema.learnerGoals).where(and(eq(schema.learnerGoals.userId, userId), eq(schema.learnerGoals.type, "skill"))).run();
    skillGoals.forEach((p, i) => {
      const before = bySkill.get(p.skillId);
      const base = skillGoal({ id: p.skillId, name: p.skillName }, p.slider, before?.targetLevel ?? defaultTargetLevel(level));
      tx.insert(schema.learnerGoals)
        .values({
          id: before?.id ?? newId(),
          userId,
          ...base,
          position: i,
          status: before?.status ?? "active",
          achievedAt: before?.achievedAt ?? null,
          source: before?.source ?? "admin",
          createdAt: at,
          updatedAt: at,
        })
        .run();
    });
    others.forEach((g, i) => {
      tx.update(schema.learnerGoals).set({ position: skillGoals.length + i, updatedAt: at }).where(eq(schema.learnerGoals.id, g.id)).run();
    });
  });
}

// ---------------------------------------------------------------------------
// One-time migration
// ---------------------------------------------------------------------------

const MIGRATION_KEY = "v4.3.goals_migrated";

/**
 * D2, once per database: every existing priority becomes a `skill` goal, in its current order, so
 * the goal box shows what the admin set before v4.3. The priorities themselves are not touched
 * (deriving them back from these goals gives the same rows).
 */
export function migrateV43Goals(db: Db): number {
  if (db.select().from(schema.appMeta).where(eq(schema.appMeta.key, MIGRATION_KEY)).get()) return 0;
  const rows = db.select().from(schema.learnerSkillPriorities).all();
  const users = [...new Set(rows.map((r) => r.userId))];
  const withGoals = new Set(db.select({ userId: schema.learnerGoals.userId }).from(schema.learnerGoals).all().map((r) => r.userId));
  const levels = new Map(db.select({ userId: schema.learnerProfiles.userId, level: schema.learnerProfiles.selfLevel }).from(schema.learnerProfiles).all().map((r) => [r.userId, r.level]));
  const at = now();
  let migrated = 0;
  db.transaction((tx) => {
    for (const userId of users) {
      if (withGoals.has(userId)) continue;
      const mine = sortPriorities(rows.filter((r) => r.userId === userId).map((r) => ({ ...r, slider: r.slider as Slider })));
      mine.forEach((p, position) => {
        tx.insert(schema.learnerGoals)
          .values({
            id: newId(),
            userId,
            ...skillGoal({ id: p.skillId, name: p.skillName }, p.slider, defaultTargetLevel(levels.get(userId))),
            position,
            status: "active",
            achievedAt: null,
            source: "admin",
            createdAt: at,
            updatedAt: at,
          })
          .run();
      });
      migrated += 1;
    }
    tx.insert(schema.appMeta).values({ key: MIGRATION_KEY, value: String(migrated), updatedAt: at }).onConflictDoNothing().run();
  });
  return migrated;
}

// ---------------------------------------------------------------------------
// Capstones
// ---------------------------------------------------------------------------

/**
 * The library case that proves a goal: its own case, or for a skill or text goal the best match in
 * the library — most shared skills, then the level nearest the target, then library order.
 */
export function capstoneOutcome(goal: Pick<LearnerGoal, "caseId" | "skillIds" | "targetLevel">, outcomes: readonly PracticalOutcome[], db?: Db): PracticalOutcome | null {
  if (goal.caseId) {
    const own = outcomes.find((o) => o.id === goal.caseId) ?? (db ? getOutcome(db, goal.caseId) : null);
    if (own) return own;
  }
  let best: { outcome: PracticalOutcome; overlap: number; distance: number } | null = null;
  for (const outcome of outcomes) {
    const overlap = outcome.skillIds.filter((id) => goal.skillIds.includes(id)).length;
    if (overlap === 0) continue;
    const distance = Math.abs(outcome.level - goal.targetLevel);
    if (!best || overlap > best.overlap || (overlap === best.overlap && distance < best.distance)) best = { outcome, overlap, distance };
  }
  return best?.outcome ?? null;
}

export function learnerGoalViews(db: Db, userId: string): LearnerGoalView[] {
  const goals = listGoals(db, userId);
  if (goals.length === 0) return [];
  const outcomes = listOutcomes(db, departmentOf(db, userId));
  const names = new Map(getCatalog(db, { includeArchived: true }).skills.map((s) => [s.id, s.name]));
  return goals.map((goal) => {
    const outcome = capstoneOutcome(goal, outcomes, db);
    return {
      id: goal.id,
      outcome: goal.outcome,
      skillIds: goal.skillIds,
      skillNames: goal.skillIds.map((id) => names.get(id) ?? id),
      targetLevel: goal.targetLevel,
      status: goal.status,
      achievedAt: goal.achievedAt,
      capstone: outcome
        ? { kind: outcome.capstone.kind, title: outcome.capstone.title, topicId: outcome.capstone.kind === "topic" ? outcome.capstone.topicId : null }
        : null,
    };
  });
}

/**
 * v4.3: each goal's capstone for the admin: what it is and whether code can grade it. A role-play,
 * a written answer or a form needs a person (or an AI rubric that may be unavailable), so the admin
 * marks those goals achieved by hand.
 */
export function capstoneSummaries(db: Db, userId: string): Record<string, CapstoneSummary> {
  const goals = listGoals(db, userId);
  if (goals.length === 0) return {};
  const outcomes = listOutcomes(db, departmentOf(db, userId));
  const out: Record<string, CapstoneSummary> = {};
  for (const goal of goals) {
    const outcome = capstoneOutcome(goal, outcomes, db);
    if (!outcome) continue;
    const taskKind = outcome.capstone.kind === "task" ? String(outcome.capstone.task.kind ?? "") : null;
    out[goal.id] = { title: outcome.capstone.title, kind: outcome.capstone.kind, taskKind, manual: taskKind !== null && MANUAL_CAPSTONE_KINDS.includes(taskKind) };
  }
  return out;
}

/** Capstone task kinds code cannot grade on its own. */
export const MANUAL_CAPSTONE_KINDS: readonly string[] = ["roleplay", "write", "form"];

/** Marks a goal achieved (once) and suggests what comes next. Returns false when it already was. */
export function achieveGoal(db: Db, userId: string, goalId: string): boolean {
  const goal = getGoal(db, userId, goalId);
  if (!goal) throw notFound("No such goal.");
  if (goal.status === "achieved") return false;
  const at = now();
  db.update(schema.learnerGoals).set({ status: "achieved", achievedAt: at, updatedAt: at }).where(eq(schema.learnerGoals.id, goalId)).run();
  createSuggestions(db, userId, nextLevelCandidates(db, userId, { ...goal, status: "achieved", achievedAt: at }));
  return true;
}

/** A passed topic attempt: every active goal whose capstone is that topic is achieved. */
export function achieveGoalsForTopic(db: Db, userId: string, topicId: string): string[] {
  const goals = listGoals(db, userId).filter((g) => g.status === "active");
  if (goals.length === 0) return [];
  const outcomes = listOutcomes(db, departmentOf(db, userId));
  const achieved: string[] = [];
  for (const goal of goals) {
    const outcome = capstoneOutcome(goal, outcomes, db);
    if (outcome?.capstone.kind === "topic" && outcome.capstone.topicId === topicId && achieveGoal(db, userId, goal.id)) achieved.push(goal.id);
  }
  return achieved;
}

// ---------------------------------------------------------------------------
// Suggestions
// ---------------------------------------------------------------------------

export type SuggestionCandidate = Omit<GoalSuggestion, "id" | "status" | "createdAt">;

type SuggestionRow = typeof schema.goalSuggestions.$inferSelect;
const toSuggestion = (row: SuggestionRow): GoalSuggestion => ({
  id: row.id,
  kind: row.kind,
  title: row.title,
  outcome: row.outcome,
  skillIds: row.skillIds,
  targetLevel: row.targetLevel,
  caseId: row.caseId,
  reason: row.reason,
  status: row.status,
  createdAt: row.createdAt,
});

export function listSuggestions(db: Db, userId: string, status: GoalSuggestion["status"] | "all" = "open"): GoalSuggestion[] {
  const where = status === "all" ? eq(schema.goalSuggestions.userId, userId) : and(eq(schema.goalSuggestions.userId, userId), eq(schema.goalSuggestions.status, status));
  return db.select().from(schema.goalSuggestions).where(where).orderBy(desc(schema.goalSuggestions.createdAt)).all().map(toSuggestion);
}

/** Whether a goal already asks for this: the same case, or every one of its skills at that level or above. */
function coveredByGoals(candidate: Pick<SuggestionCandidate, "skillIds" | "targetLevel" | "caseId">, goals: readonly LearnerGoal[]): boolean {
  return goals.some(
    (g) => (candidate.caseId !== null && g.caseId === candidate.caseId) || (candidate.skillIds.every((id) => g.skillIds.includes(id)) && g.targetLevel >= candidate.targetLevel),
  );
}

/**
 * Stores new suggestions, skipping any that duplicate an open or dismissed one (same case, or the
 * same skills at the same level) or that a goal already covers. With auto-add on, each is added at
 * once. Returns the suggestions created.
 */
export function createSuggestions(db: Db, userId: string, candidates: readonly SuggestionCandidate[]): GoalSuggestion[] {
  if (candidates.length === 0) return [];
  const goals = listGoals(db, userId);
  const previous = listSuggestions(db, userId, "all").filter((s) => s.status !== "added" || coveredByGoals(s, goals));
  const keys = new Set(previous.map((s) => goalKey(s.skillIds, s.targetLevel)));
  const cases = new Set(previous.map((s) => s.caseId).filter(Boolean));
  const created: GoalSuggestion[] = [];
  const at = now();
  for (const c of candidates) {
    const key = goalKey(c.skillIds, c.targetLevel);
    if (keys.has(key) || (c.caseId && cases.has(c.caseId)) || coveredByGoals(c, goals)) continue;
    keys.add(key);
    if (c.caseId) cases.add(c.caseId);
    const row = { id: newId(), userId, ...c, caseId: c.caseId ?? null, status: "open" as const, createdAt: at, decidedAt: null };
    db.insert(schema.goalSuggestions).values(row).run();
    created.push(toSuggestion(row));
  }
  const settings = db.select({ auto: schema.learnerPriorities.autoAddSuggestions }).from(schema.learnerPriorities).where(eq(schema.learnerPriorities.userId, userId)).get();
  if (settings?.auto) for (const s of created) addSuggestion(db, userId, s.id, "auto");
  return created;
}

/** Turns a suggestion into a goal at the end of the list (slider Medium) and re-derives the priorities. */
export function addSuggestion(db: Db, userId: string, suggestionId: string, source: "suggested" | "auto" = "suggested"): LearnerGoal {
  const row = db
    .select()
    .from(schema.goalSuggestions)
    .where(and(eq(schema.goalSuggestions.userId, userId), eq(schema.goalSuggestions.id, suggestionId)))
    .get();
  if (!row) throw notFound("No such suggestion.");
  if (row.status !== "open") throw badRequest("That suggestion was already handled.");
  const goals = listGoals(db, userId);
  const input: GoalInput = {
    type: row.caseId ? "case" : row.skillIds.length === 1 ? "skill" : "text",
    originalText: row.title.slice(0, 300),
    outcome: row.outcome,
    skillIds: row.skillIds,
    targetLevel: row.targetLevel,
    caseId: row.caseId,
    slider: 3,
  };
  const saved = saveGoals(db, userId, [...goals.map(goalAsInput), input], { source });
  db.update(schema.goalSuggestions).set({ status: "added", decidedAt: now() }).where(eq(schema.goalSuggestions.id, suggestionId)).run();
  return saved[saved.length - 1];
}

export function dismissSuggestion(db: Db, userId: string, suggestionId: string): void {
  const row = db
    .select({ status: schema.goalSuggestions.status })
    .from(schema.goalSuggestions)
    .where(and(eq(schema.goalSuggestions.userId, userId), eq(schema.goalSuggestions.id, suggestionId)))
    .get();
  if (!row) throw notFound("No such suggestion.");
  db.update(schema.goalSuggestions).set({ status: "dismissed", decidedAt: now() }).where(eq(schema.goalSuggestions.id, suggestionId)).run();
}

/** Undo of a dismiss: a dismissed suggestion goes back to open. Anything else is left as it is. */
export function restoreSuggestion(db: Db, userId: string, suggestionId: string): void {
  const row = db
    .select({ status: schema.goalSuggestions.status })
    .from(schema.goalSuggestions)
    .where(and(eq(schema.goalSuggestions.userId, userId), eq(schema.goalSuggestions.id, suggestionId)))
    .get();
  if (!row) throw notFound("No such suggestion.");
  if (row.status !== "dismissed") return;
  db.update(schema.goalSuggestions).set({ status: "open", decidedAt: null }).where(eq(schema.goalSuggestions.id, suggestionId)).run();
}

export function goalAsInput(goal: LearnerGoal): GoalInput {
  return {
    id: goal.id,
    type: goal.type,
    originalText: goal.originalText,
    outcome: goal.outcome,
    skillIds: goal.skillIds,
    targetLevel: goal.targetLevel,
    caseId: goal.caseId,
    slider: goal.slider,
  };
}

/**
 * What comes after an achieved goal: the next library case on the same skills (the lowest level
 * above it, most shared skills first), or the same skills one level up.
 */
export function nextLevelCandidates(db: Db, userId: string, goal: LearnerGoal): SuggestionCandidate[] {
  const outcomes = listOutcomes(db, departmentOf(db, userId));
  const higher = outcomes
    .filter((o) => o.id !== goal.caseId && o.level > goal.targetLevel && o.skillIds.some((id) => goal.skillIds.includes(id)))
    .map((o) => ({ o, overlap: o.skillIds.filter((id) => goal.skillIds.includes(id)).length }))
    .sort((a, b) => a.o.level - b.o.level || b.overlap - a.overlap || a.o.position - b.o.position)[0]?.o;
  const reason = `Next after "${goal.outcome.replace(/\.$/, "")}"`.slice(0, 300);
  if (higher) {
    return [{ kind: "next-level", title: higher.title, outcome: higher.statement, skillIds: higher.skillIds, targetLevel: higher.level, caseId: higher.id, reason }];
  }
  if (goal.targetLevel >= 5) return [];
  const names = new Map(getCatalog(db, { includeArchived: true }).skills.map((s) => [s.id, s.name]));
  const title = goal.skillIds.map((id) => names.get(id) ?? id).join(", ").slice(0, 120);
  return [{ kind: "next-level", title, outcome: goal.outcome, skillIds: goal.skillIds, targetLevel: goal.targetLevel + 1, caseId: null, reason }];
}

/**
 * Newly found gaps: skills the assessment put at level 2 or below (asked, graded, not skipped),
 * highest slider first, at most three. Each becomes the library case for that skill nearest
 * Intermediate, or the skill itself at Intermediate.
 */
export function gapCandidates(db: Db, userId: string, result: Pick<V4Result, "skills">): SuggestionCandidate[] {
  const skipped = new Set(listSkip(db, userId).map((s) => s.skillId));
  const outcomes = listOutcomes(db, departmentOf(db, userId));
  const goals = listGoals(db, userId);
  // A weak skill a goal already aims above is the admin's plan already, not a new gap.
  const planned = (skillId: string, level: number) => goals.some((g) => g.skillIds.includes(skillId) && g.targetLevel > level + 1);
  const weak = result.skills
    .filter((s) => s.level !== null && s.level <= 2 && s.asked > 0 && !skipped.has(s.skillId) && !planned(s.skillId, s.level))
    .sort((a, b) => (b.slider ?? 0) - (a.slider ?? 0) || (a.level ?? 0) - (b.level ?? 0))
    .slice(0, 3);
  return weak.map((s) => {
    const target = Math.min(5, Math.max(3, (s.level ?? 0) + 1));
    const reason = `The assessment put ${s.skillName} at level ${s.level} of 5`;
    const outcome = outcomes
      .filter((o) => o.skillIds.includes(s.skillId) && o.level <= target)
      .sort((a, b) => Math.abs(a.level - target) - Math.abs(b.level - target) || a.position - b.position)[0];
    return outcome
      ? { kind: "gap" as const, title: outcome.title, outcome: outcome.statement, skillIds: outcome.skillIds, targetLevel: outcome.level, caseId: outcome.id, reason }
      : { kind: "gap" as const, title: s.skillName.slice(0, 120), outcome: asOutcome(`use ${s.skillName} confidently at work`), skillIds: [s.skillId], targetLevel: target, caseId: null, reason };
  });
}

/** The learner's latest v4 result, if any. */
export function latestV4Result(db: Db, userId: string): V4Result | null {
  const assessments = db.select({ id: schema.assessments.id }).from(schema.assessments).where(eq(schema.assessments.userId, userId)).all().map((a) => a.id);
  if (assessments.length === 0) return null;
  const rows = db.select().from(schema.evaluations).where(inArray(schema.evaluations.assessmentId, assessments)).orderBy(desc(schema.evaluations.createdAt)).all();
  const found = rows.find((r) => (r.result as { format?: string } | null)?.format === "v4");
  return found ? (found.result as V4Result) : null;
}

/**
 * The "Suggested next" refresh: after an assessment and once a week. Next-level outcomes for every
 * achieved goal, plus the gaps from the latest assessment. Pure rules, no model call.
 */
export function refreshSuggestions(db: Db, userId: string, result?: Pick<V4Result, "skills"> | null): GoalSuggestion[] {
  const goals = listGoals(db, userId);
  const latest = result ?? latestV4Result(db, userId);
  const candidates = [...goals.filter((g) => g.status === "achieved").flatMap((g) => nextLevelCandidates(db, userId, g)), ...(latest ? gapCandidates(db, userId, latest) : [])];
  return createSuggestions(db, userId, candidates);
}
