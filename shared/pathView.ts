import type { PathItemView } from "./builder";
import { goalPhrase } from "./pathReasons";

/**
 * v4.5 Phase 0: how a learner's path is shown (old UI, v5 My plan and the admin views alike).
 * Pure; the screens only lay it out.
 */

/** How many path steps show before the rest fold under "Later (N more)": roughly the first weeks. */
export const FIRST_STEPS = 8;

/** "Needs: React Fundamentals (earlier in your path)", or null when it builds on nothing earlier. */
export function needsLine(item: Pick<PathItemView, "needs">): string | null {
  const titles = (item.needs ?? []).map((need) => need.title);
  if (titles.length === 0) return null;
  return `Needs: ${titles.join(", ")} (earlier in your path)`;
}

export interface LaterGroup {
  /** The goal these steps serve, as written for the admin ("Forms in React"), or null for general steps. */
  goal: string | null;
  items: PathItemView[];
}

export interface SplitPath {
  first: PathItemView[];
  later: LaterGroup[];
  laterCount: number;
}

/**
 * The first steps in order, then the rest grouped by goal (in the order each goal first appears).
 * `firstCount` is at least FIRST_STEPS and is raised by the caller to keep the current step in view.
 * The weekly plan is unaffected: it still pulls from the path in order.
 */
export function splitPath(items: readonly PathItemView[], firstCount = FIRST_STEPS): SplitPath {
  const count = Math.max(FIRST_STEPS, firstCount);
  const first = items.slice(0, count);
  const rest = items.slice(count);
  const groups = new Map<string, LaterGroup>();
  for (const item of rest) {
    const key = item.targetSkill ?? "";
    const group = groups.get(key) ?? { goal: item.targetSkill, items: [] };
    group.items.push(item);
    groups.set(key, group);
  }
  return { first, later: [...groups.values()], laterCount: rest.length };
}

/** "Later (40 more)". */
export const laterLabel = (count: number): string => `Later (${count} more)`;

/** A later group's heading: "For your goal: forms in React" or "Other steps". */
export const laterGroupLabel = (goal: string | null): string => (goal ? `For your goal: ${goalPhrase(goal)}` : "Other steps");

/** v4.5: what the test found for one goal or priority, for the path screens. */
export interface PathCoverage {
  /** When the latest test was planned (its goals were read then), or null with no test yet. */
  assessedAt: number | null;
  /** Skill id → level 0–5 the test measured (null when it was asked but is still being marked). */
  levels: Record<string, number | null>;
  /** Skills only on goals added after the test was planned. */
  addedAfterTest: string[];
}

const START_WORDS = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" } as const;

export type CoverageView =
  | { kind: "level"; level: number }
  | { kind: "added"; text: string }
  | { kind: "unmeasured"; text: string };

/**
 * Never "not assessed": goals are covered by the test (the v4.4 coverage rule), so a goal with no
 * level was either added after the test ("Added after the test · starts at Beginner") or is still
 * being marked.
 */
export function coverageView(
  skillId: string,
  coverage: PathCoverage | null | undefined,
  startLevel: "beginner" | "intermediate" | "advanced" | null | undefined,
  fallbackLevel: number | null = null,
): CoverageView {
  const level = coverage?.levels[skillId];
  if (typeof level === "number") return { kind: "level", level };
  if (fallbackLevel !== null) return { kind: "level", level: fallbackLevel };
  const start = START_WORDS[startLevel ?? "beginner"];
  if (!coverage?.assessedAt) return { kind: "unmeasured", text: `No test yet · starts at ${start}` };
  if (coverage.addedAfterTest.includes(skillId)) return { kind: "added", text: `Added after the test · starts at ${start}` };
  return { kind: "unmeasured", text: `Still being marked · starts at ${start}` };
}
