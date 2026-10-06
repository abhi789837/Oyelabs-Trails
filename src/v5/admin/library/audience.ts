import type { CourseAudience } from "@shared/courses";

/**
 * Who gets a course: the pure parts, shared by the course editor's "Who gets this course" and the
 * People sheet's "Add a course" (v5.0.1).
 */

const people = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;

/** One line that says who sees the course right now, and what's missing if nobody does. */
export function audienceLine(published: boolean, audience: CourseAudience, picked: number): string {
  if (!published) {
    if (audience === "assigned" && picked > 0) return `Draft: nobody sees it yet. Make it live and ${people(picked)} will.`;
    return "Draft: nobody sees it yet.";
  }
  if (audience === "everyone") return "Live for everyone.";
  if (picked === 0) return "Live, but nobody sees it yet: pick some people.";
  return `Live for ${people(picked)}.`;
}

export interface PickablePerson {
  id: string;
  displayName: string;
  username: string;
  department: string | null;
}

/** People whose name, username or department contains every word typed, in any order. */
export function filterPeople<T extends PickablePerson>(list: readonly T[], query: string): T[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...list];
  return list.filter((p) => {
    const hay = `${p.displayName} ${p.username} ${p.department ?? ""}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

/** The assignee list with one more person, keeping everyone already on it. Null if already there. */
export function withAssignee(current: readonly string[], userId: string): string[] | null {
  if (current.includes(userId)) return null;
  return [...current, userId];
}

/** Same set of people, in any order. */
export function samePeople(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}
