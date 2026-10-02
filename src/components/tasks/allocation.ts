import type { LearnerTask } from "@shared/tasks";

type Allocate = Extract<LearnerTask, { kind: "allocate" }>;

/** The response key for one person on one project: "personId:projectId". */
export function allocKey(personId: string, projectId: string): string {
  return `${personId}:${projectId}`;
}

export function isBlocked(task: Pick<Allocate, "blocked">, personId: string, projectId: string): boolean {
  return task.blocked.some((b) => b.person === personId && b.project === projectId);
}

export interface PersonTotal {
  id: string;
  sum: number;
  capacity: number;
  over: boolean;
}

export type ProjectState = "short" | "covered" | "over";

export interface ProjectTotal {
  id: string;
  sum: number;
  need: number;
  state: ProjectState;
}

const hoursAt = (hours: Record<string, number>, key: string) => {
  const v = Number(hours[key] ?? 0);
  return Number.isFinite(v) && v > 0 ? v : 0;
};

const tidy = (n: number) => Math.round(n * 100) / 100;

/**
 * Row and column totals as the grader sees them: a person is over when past capacity; a project
 * is short below its need, covered up to `slack` over, and over beyond that. Blocked cells count
 * whatever they hold — the grader does too — though the grid keeps them at zero.
 */
export function allocationTotals(
  task: Pick<Allocate, "people" | "projects" | "slack">,
  hours: Record<string, number>,
): { people: PersonTotal[]; projects: ProjectTotal[] } {
  const people = task.people.map((person) => {
    const sum = tidy(task.projects.reduce((s, p) => s + hoursAt(hours, allocKey(person.id, p.id)), 0));
    return { id: person.id, sum, capacity: person.capacity, over: sum > person.capacity + 1e-9 };
  });
  const projects = task.projects.map((project) => {
    const sum = tidy(task.people.reduce((s, p) => s + hoursAt(hours, allocKey(p.id, project.id)), 0));
    const state: ProjectState =
      sum < project.need - 1e-9 ? "short" : sum > project.need * (1 + task.slack) + 1e-9 ? "over" : "covered";
    return { id: project.id, sum, need: project.need, state };
  });
  return { people, projects };
}

/** "12.5" → 12.5, "" → null (cleared), anything else (negative, text) → undefined (ignored). Capped at 200. */
export function parseHours(raw: string): number | null | undefined {
  const t = raw.trim().replace(",", ".");
  if (t === "") return null;
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(t)) return undefined;
  return Math.min(200, Number(t));
}

/** Sets one cell, dropping zeros and blanks so the response holds only real allocations. */
export function setHours(hours: Record<string, number>, key: string, value: number | null): Record<string, number> {
  const next = { ...hours };
  if (value === null || value <= 0) delete next[key];
  else next[key] = value;
  return next;
}
