import { deriveSkillPriorities, TARGET_LEVEL_LABELS, type GoalInput, type GoalInterpretation, type LearnerGoal, type OutcomeOption, type SuggestedGoal } from "@shared/goals";
import { DEFAULT_SLIDER, sortPriorities, type PriorityEntry, type Slider } from "@shared/setup";

/**
 * The goal box's rows (v4.3): pure, so the order, the derivation and the dedupe are tested without
 * a React tree. A row is a `GoalInput` plus a client key; the priorities shown in the summary are
 * derived from the rows exactly as the server does (D2).
 */

export interface GoalRow extends GoalInput {
  /** Stable for React and for moves: the saved id, or a client-made key for a new row. */
  key: string;
  /** Display and save order. Ties between equal sliders keep it. */
  position: number;
  /** Saved state, shown on the row; new rows are active. */
  status?: LearnerGoal["status"];
}

let counter = 0;
export function newGoalKey(): string {
  counter += 1;
  return `new-${Date.now().toString(36)}-${counter}`;
}

/** Highest slider first, ties in list order: how the rows are shown and saved. */
export function sortedGoals(rows: readonly GoalRow[]): GoalRow[] {
  return sortPriorities(rows);
}

function append(rows: readonly GoalRow[], goal: Omit<GoalRow, "key" | "position">): GoalRow[] {
  const position = rows.reduce((max, r) => Math.max(max, r.position), -1) + 1;
  return [...rows, { ...goal, key: goal.id ?? newGoalKey(), position }];
}

/** A catalog skill as a goal. The server fills its text from the catalog name. */
export function addSkillGoal(rows: readonly GoalRow[], skillId: string, slider: number = DEFAULT_SLIDER, targetLevel = 3): GoalRow[] {
  if (rows.some((r) => r.type === "skill" && r.skillIds.length === 1 && r.skillIds[0] === skillId)) return [...rows];
  return append(rows, { type: "skill", originalText: skillId, outcome: skillId, skillIds: [skillId], targetLevel, caseId: null, slider });
}

export function addCaseGoal(rows: readonly GoalRow[], outcome: Pick<OutcomeOption, "id" | "title" | "statement" | "skillIds" | "level">, slider: number = DEFAULT_SLIDER): GoalRow[] {
  if (rows.some((r) => r.caseId === outcome.id)) return [...rows];
  return append(rows, { type: "case", originalText: outcome.title, outcome: outcome.statement, skillIds: outcome.skillIds, targetLevel: outcome.level, caseId: outcome.id, slider });
}

export function addTextGoal(rows: readonly GoalRow[], text: string, reading: GoalInterpretation, slider: number = DEFAULT_SLIDER): GoalRow[] {
  return append(rows, { type: "text", originalText: text.trim().slice(0, 300), outcome: reading.outcome, skillIds: reading.skillIds, targetLevel: reading.targetLevel, caseId: reading.caseId, slider });
}

/** A suggestion's + Add: a case when it names one, else a skill or a text goal. */
export function addSuggestedGoal(rows: readonly GoalRow[], goal: SuggestedGoal | Omit<GoalInput, "id">): GoalRow[] {
  if (goal.caseId && rows.some((r) => r.caseId === goal.caseId)) return [...rows];
  if (goal.type === "skill" && goal.skillIds.length === 1) return addSkillGoal(rows, goal.skillIds[0], goal.slider, goal.targetLevel);
  const { type, originalText, outcome, skillIds, targetLevel, caseId, slider, intentId } = goal;
  return append(rows, { type, originalText, outcome, skillIds, targetLevel, caseId, slider, ...(intentId ? { intentId } : {}) });
}

export function updateGoal(rows: readonly GoalRow[], key: string, patch: Partial<Pick<GoalRow, "slider" | "skillIds" | "targetLevel" | "outcome">>): GoalRow[] {
  return rows.map((r) => (r.key === key ? { ...r, ...patch } : r));
}

export function removeGoal(rows: readonly GoalRow[], key: string): GoalRow[] {
  return rows.filter((r) => r.key !== key);
}

/** Swaps list order with the tied neighbour above (-1) or below (+1); unchanged when it can't. */
export function moveGoal(rows: readonly GoalRow[], key: string, delta: -1 | 1): GoalRow[] {
  const sorted = sortedGoals(rows);
  const index = sorted.findIndex((r) => r.key === key);
  const other = sorted[index + delta];
  if (index < 0 || !other || other.slider !== sorted[index].slider) return [...rows];
  const self = sorted[index];
  return rows.map((r) => (r.key === self.key ? { ...r, position: other.position } : r.key === other.key ? { ...r, position: self.position } : r));
}

export function canMoveGoal(rows: readonly GoalRow[], key: string, delta: -1 | 1): boolean {
  const sorted = sortedGoals(rows);
  const index = sorted.findIndex((r) => r.key === key);
  const other = sorted[index + delta];
  return index >= 0 && Boolean(other) && other.slider === sorted[index].slider;
}

/** Skipping a skill takes away the goals that are only that skill; a wider goal keeps it (the server leaves it out). */
export function dropSkillGoals(rows: readonly GoalRow[], skillId: string): GoalRow[] {
  return rows.filter((r) => !(r.skillIds.length === 1 && r.skillIds[0] === skillId));
}

/** The priorities these rows produce, as the server derives them, minus skipped skills. */
export function derivePriorityRows(rows: readonly GoalRow[], skip: readonly string[] = []): { skillId: string; slider: Slider; position: number }[] {
  const skipped = new Set(skip);
  return deriveSkillPriorities(sortedGoals(rows))
    .filter((d) => !skipped.has(d.skillId))
    .map((d, position) => ({ skillId: d.skillId, slider: d.slider as Slider, position }));
}

/** Rows from a saved setup: its goals, or (before any goal was saved) its priorities as skill goals. */
export function rowsFromSaved(goals: readonly LearnerGoal[] | undefined, priorities: readonly PriorityEntry[], level: number | null): GoalRow[] {
  if (goals && goals.length > 0) {
    return goals.map((g, position) => ({
      key: g.id,
      id: g.id,
      type: g.type,
      originalText: g.originalText,
      outcome: g.outcome,
      skillIds: [...g.skillIds],
      targetLevel: g.targetLevel,
      caseId: g.caseId,
      slider: g.slider,
      position,
      status: g.status,
      ...(g.intentId ? { intentId: g.intentId } : {}),
    }));
  }
  const target = level ? Math.min(5, Math.max(2, level + 1)) : 3;
  return sortPriorities(priorities).reduce<GoalRow[]>((rows, p) => addSkillGoal(rows, p.skillId, p.slider, target), []);
}

/** The request's goals, in display order, without client keys. */
export function toGoalInputs(rows: readonly GoalRow[]): GoalInput[] {
  return sortedGoals(rows).map((r) => ({
    ...(r.id ? { id: r.id } : {}),
    type: r.type,
    originalText: r.originalText,
    outcome: r.outcome,
    skillIds: r.skillIds,
    targetLevel: r.targetLevel,
    caseId: r.caseId,
    slider: r.slider,
    ...(r.intentId ? { intentId: r.intentId } : {}),
  }));
}

/** "→ Debugging, Laravel, logs · Intermediate": the interpretation line under a chip. */
export function interpretationLine(skillIds: readonly string[], targetLevel: number, names: ReadonlyMap<string, string>): string {
  return `→ ${skillIds.map((id) => names.get(id) ?? id).join(", ")} · ${TARGET_LEVEL_LABELS[targetLevel] ?? `Level ${targetLevel}`}`;
}

/** The goal box's case search: every word in the title, statement or aliases; title prefix first. */
export function searchCases<T extends Pick<OutcomeOption, "title" | "statement" | "aliases">>(cases: readonly T[], query: string): T[] {
  const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").trim();
  const q = norm(query);
  if (!q) return [...cases];
  const words = q.split(" ");
  return cases
    .map((c, index) => {
      const title = norm(c.title);
      const all = norm([c.title, c.statement, ...c.aliases].join(" "));
      const score = title.startsWith(q) || c.aliases.some((a) => norm(a).startsWith(q)) ? 2 : words.every((w) => all.includes(w)) ? 1 : 0;
      return { c, score, index };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((x) => x.c);
}
