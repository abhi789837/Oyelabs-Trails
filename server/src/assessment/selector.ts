import type { Difficulty } from "../../../shared/assessment";
import { SECTION_ORDER, type AssessmentSection } from "../../../shared/sections";

/**
 * The adaptive selector (brief §9.4). No AI involved: the pool was generated in advance, and during
 * the test the server only chooses from it.
 *
 * A staircase per area, with areas grouped into **sections** that are asked in order. Answer
 * correctly twice and the next item in that area is a level harder; miss one and it is a level
 * easier. Areas inside a section are visited round-robin so fatigue is spread, and an area stops
 * once it has enough signal.
 *
 * ## What changed, and why the old one was "too hard"
 *
 * Three rules, and all three pulled the same way:
 *
 * - **It started in the middle.** `theta` was seeded from the blueprint's *hypothesis*, clamped to
 *   2–4, so a learner whose admin guessed "4" opened with an advanced question about something they
 *   had not been asked about yet. Now every area starts at 1 or 2 and climbs. The hypothesis still
 *   matters — it decides whether you start at easy or medium — but it can no longer put a hard
 *   question first.
 * - **It climbed after a single correct answer.** One lucky guess moved you up a level, and two
 *   moved you two. Now it takes **two correct in a row**, which is the difference between a
 *   staircase that measures and one that races.
 * - **There was no way to say "I don't know".** Every answer was right or wrong, so not knowing
 *   something looked exactly like getting it wrong, and the staircase punished it the same way. An
 *   `unknown` now stops the climb without pushing you down: it is evidence of a gap, which is what
 *   the test is *for*, and not evidence of failure.
 *
 * Pure functions over explicit state, so the whole thing is unit-testable without a database.
 */

/** What one answer was. `unknown` is the "I don't know yet" option, and is not a wrong answer. */
export type Outcome = "correct" | "wrong" | "unknown";

export interface AreaState {
  area: string;
  /** Which part of the test this area belongs to. Sections are asked in `SECTION_ORDER`. */
  section: AssessmentSection;
  /** Current difficulty. Starts at 1 or 2 and climbs; never seeded above `START_CEILING`. */
  theta: Difficulty;
  /** Ids of items already served in this area. */
  served: string[];
  outcomes: Outcome[];
  /** Difficulty of each served item, so the stop rules can count per level. */
  difficulties: Difficulty[];
  /** Direction changes between adjacent levels. Kept for the level estimate. */
  reversals: number;
  /** Set once the area has enough signal. */
  stopped: boolean;
}

export interface SelectorState {
  areas: AreaState[];
  /** Index into `areas` for the round-robin. */
  cursor: number;
  /** Items served across all areas, for the target count. */
  servedCount: number;
  /** Which section is being asked. Sections are finished in order, not interleaved. */
  section?: AssessmentSection;
  /** Items served per section, against the section's own budget. */
  sectionCounts?: Partial<Record<AssessmentSection, number>>;
}

export interface PoolItemRef {
  id: string;
  area: string;
  difficulty: Difficulty;
  kind: string;
}

/** Six items is enough signal from a staircase; beyond that the estimate stops moving. */
export const MAX_ITEMS_PER_AREA = 6;
export const MAX_REVERSALS = 2;

/** Two in a row to climb. One is a coin toss; two is a pattern. */
export const CORRECT_TO_ADVANCE = 2;
/** Three correct at one level, or two wrong at one level, and the level is known. */
export const CORRECT_AT_LEVEL_TO_STOP = 3;
export const WRONG_AT_LEVEL_TO_STOP = 2;

/** Nothing starts above this. The staircase climbs; it is not dropped in at altitude. */
export const START_CEILING: Difficulty = 2;

export interface AreaSeed {
  name: string;
  hypothesisLevel: number;
  /** Older blueprints have no sections; those areas all sit in `track_basics`. */
  section?: AssessmentSection;
}

export function initSelectorState(areas: AreaSeed[]): SelectorState {
  const seeded = areas.map((area) => ({
    area: area.name,
    section: area.section ?? ("track_basics" as AssessmentSection),
    theta: startingTheta(area.hypothesisLevel),
    served: [] as string[],
    outcomes: [] as Outcome[],
    difficulties: [] as Difficulty[],
    reversals: 0,
    stopped: false,
  }));

  return {
    areas: seeded,
    cursor: 0,
    servedCount: 0,
    section: firstSection(seeded),
    sectionCounts: {},
  };
}

/**
 * Where an area's staircase begins: easy, or medium for somebody the admin thinks is strong.
 *
 * The hypothesis is a guess from a colleague's notes, so it is allowed to choose between the two
 * bottom rungs and nothing more. A wrong guess now costs one easy question; it used to cost an
 * opening question two levels above where the person actually was.
 */
export function startingTheta(hypothesisLevel: number): Difficulty {
  return (hypothesisLevel >= 3 ? START_CEILING : 1) as Difficulty;
}

/** Kept for the migration of in-flight assessments, and for callers that still clamp. */
export function clampTheta(level: number): Difficulty {
  return Math.min(START_CEILING, Math.max(1, Math.round(level))) as Difficulty;
}

function firstSection(areas: readonly AreaState[]): AssessmentSection | undefined {
  return SECTION_ORDER.find((section) => areas.some((area) => area.section === section));
}

/**
 * Normalises a state that was stored before this file changed shape.
 *
 * An assessment that is in progress when a deploy lands has a `SelectorState` in its `config` JSON
 * with `outcomes: boolean[]`, no `difficulties` and no `section`. Throwing that away would restart
 * somebody's test; refusing to read it would end it. So it is upgraded in place, and the one thing
 * that cannot be recovered — the difficulty of items already served — is filled with the area's
 * current theta, which is the closest true-ish answer available.
 */
export function normaliseState(state: SelectorState): SelectorState {
  /* The areas are upgraded **first**, and the section is derived from the upgraded list. Reading
     `firstSection(state.areas)` off the raw state looks equivalent and is not: those areas are
     exactly the ones that have no `section` yet, so it always found nothing and the whole state came
     back without a current section. */
  const areas = state.areas.map((area) => {
    const outcomes: Outcome[] = (area.outcomes as unknown[]).map((outcome) =>
      typeof outcome === "boolean" ? (outcome ? "correct" : "wrong") : (outcome as Outcome),
    );
    return {
      ...area,
      section: area.section ?? ("track_basics" as AssessmentSection),
      outcomes,
      difficulties: area.difficulties ?? outcomes.map(() => area.theta),
    };
  });

  return {
    ...state,
    areas,
    sectionCounts: state.sectionCounts ?? {},
    section: state.section ?? firstSection(areas),
  };
}

export interface SelectOptions {
  targetItemCount: number;
  includeExplain: boolean;
  /** Per-section item budgets. Absent means "one budget for the whole test", as before. */
  sectionBudgets?: Partial<Record<AssessmentSection, number>>;
}

/**
 * Picks the next item.
 *
 * Works through the sections in order. Within the current section it walks that section's areas
 * round-robin from the cursor, skipping stopped ones, and takes an unserved pool item at the area's
 * current difficulty — or the nearest available, because a pool is never perfectly filled at every
 * level.
 */
export function selectNext(
  state: SelectorState,
  pool: PoolItemRef[],
  options: SelectOptions,
): { item: PoolItemRef; areaIndex: number; section: AssessmentSection } | null {
  const servedIds = new Set(state.areas.flatMap((a) => a.served));

  // Written answers are held back until the adaptive part is finished (§9.4).
  const available = pool.filter(
    (item) => !servedIds.has(item.id) && (options.includeExplain ? item.kind === "explain" : item.kind !== "explain"),
  );

  if (options.includeExplain) {
    const next = available[0];
    return next ? { item: next, areaIndex: -1, section: "ai_working" } : null;
  }

  if (state.servedCount >= options.targetItemCount) return null;

  /* Sections in order, and a section is finished before the next one starts. Walking them here
     rather than interleaving is what makes "Part 2 of 5" mean anything to the learner. */
  for (const section of SECTION_ORDER) {
    if (!state.areas.some((area) => area.section === section)) continue;

    const budget = options.sectionBudgets?.[section];
    const used = state.sectionCounts?.[section] ?? 0;
    if (budget !== undefined && used >= budget) continue;

    const indices = state.areas
      .map((area, index) => ({ area, index }))
      .filter((entry) => entry.area.section === section && !entry.area.stopped);
    if (indices.length === 0) continue;

    // Round-robin from the cursor, but only within this section.
    const ordered = [...indices].sort(
      (a, b) => ((a.index - state.cursor + state.areas.length) % state.areas.length) - ((b.index - state.cursor + state.areas.length) % state.areas.length),
    );

    for (const { area, index } of ordered) {
      const candidates = available.filter((item) => item.area === area.area);
      if (candidates.length === 0) continue;

      /* Nearest difficulty to theta; ties go to the **easier** one. The old rule broke ties upward
         "so a thin pool errs upward rather than repeatedly asking easy questions" — which is exactly
         the instinct that made this test feel punishing. A thin pool should err towards the question
         somebody can answer. */
      const best = candidates.reduce((a, b) => {
        const da = Math.abs(a.difficulty - area.theta);
        const db = Math.abs(b.difficulty - area.theta);
        if (da !== db) return da < db ? a : b;
        return a.difficulty <= b.difficulty ? a : b;
      });

      return { item: best, areaIndex: index, section };
    }
  }

  return null;
}

/**
 * Folds an answer into the state.
 *
 * `score` is 0..1 and `unknown` is passed separately, because they are different facts: a score of 0
 * means they tried and were wrong, and `unknown` means they said so. A code item counts as correct
 * at 0.5 or more, because passing half the tests shows the approach was right even if an edge case
 * was missed (§9.4).
 */
export function recordOutcome(
  state: SelectorState,
  areaIndex: number,
  itemId: string,
  score: number,
  options: { unknown?: boolean; difficulty?: Difficulty } = {},
): SelectorState {
  const section = state.areas[areaIndex]?.section;
  const sectionCounts = section
    ? { ...(state.sectionCounts ?? {}), [section]: (state.sectionCounts?.[section] ?? 0) + 1 }
    : (state.sectionCounts ?? {});

  if (areaIndex < 0) return { ...state, servedCount: state.servedCount + 1, sectionCounts };

  const areas = state.areas.map((area, index) => {
    if (index !== areaIndex) return area;

    const outcome: Outcome = options.unknown ? "unknown" : score >= 0.5 ? "correct" : "wrong";
    const difficulty = options.difficulty ?? area.theta;

    const outcomes = [...area.outcomes, outcome];
    const difficulties = [...area.difficulties, difficulty];
    const served = [...area.served, itemId];

    /* "I don't know" moves nothing. It is not a wrong answer and it is not a right one — it is the
       learner telling us where the gap is, which is the thing the test exists to find out. Moving
       the staircase down for it would make saying so cost them, and then nobody would. */
    let theta = area.theta;
    let reversals = area.reversals;

    if (outcome === "correct") {
      const streak = trailingStreak(outcomes, "correct");
      if (streak >= CORRECT_TO_ADVANCE) {
        theta = clampStep(area.theta + 1);
        if (lastDirection(outcomes.slice(0, -1)) === "down") reversals += 1;
      }
    } else if (outcome === "wrong") {
      theta = clampStep(area.theta - 1);
      if (lastDirection(outcomes.slice(0, -1)) === "up") reversals += 1;
    }

    return {
      ...area,
      theta,
      served,
      outcomes,
      difficulties,
      reversals,
      stopped: shouldStop(outcomes, difficulties, reversals),
    };
  });

  return {
    areas,
    cursor: (areaIndex + 1) % state.areas.length,
    servedCount: state.servedCount + 1,
    section: state.section,
    sectionCounts,
  };
}

/** How many of the most recent outcomes match, counting back from the end. */
function trailingStreak(outcomes: readonly Outcome[], of: Outcome): number {
  let streak = 0;
  for (let i = outcomes.length - 1; i >= 0 && outcomes[i] === of; i--) streak += 1;
  return streak;
}

/** Which way the staircase last moved, ignoring the answers that do not move it. */
function lastDirection(outcomes: readonly Outcome[]): "up" | "down" | null {
  for (let i = outcomes.length - 1; i >= 0; i--) {
    if (outcomes[i] === "wrong") return "down";
    if (outcomes[i] === "correct" && trailingStreak(outcomes.slice(0, i + 1), "correct") >= CORRECT_TO_ADVANCE) return "up";
  }
  return null;
}

/**
 * Has this area said enough?
 *
 * Three correct at a level, or two wrong at a level, and the answer will not move. Stopping early is
 * the other half of "measure the level, not fail people": once we know, asking more is just making
 * somebody sit through questions that change nothing.
 */
export function shouldStop(outcomes: readonly Outcome[], difficulties: readonly Difficulty[], reversals: number): boolean {
  if (outcomes.length >= MAX_ITEMS_PER_AREA) return true;
  if (reversals >= MAX_REVERSALS) return true;

  const correctAt = new Map<number, number>();
  const wrongAt = new Map<number, number>();
  outcomes.forEach((outcome, index) => {
    const level = difficulties[index];
    if (level === undefined) return;
    if (outcome === "correct") correctAt.set(level, (correctAt.get(level) ?? 0) + 1);
    if (outcome === "wrong") wrongAt.set(level, (wrongAt.get(level) ?? 0) + 1);
  });

  for (const count of correctAt.values()) if (count >= CORRECT_AT_LEVEL_TO_STOP) return true;
  for (const count of wrongAt.values()) if (count >= WRONG_AT_LEVEL_TO_STOP) return true;
  return false;
}

function clampStep(value: number): Difficulty {
  return Math.min(5, Math.max(1, value)) as Difficulty;
}

export function allAreasStopped(state: SelectorState): boolean {
  return state.areas.every((area) => area.stopped);
}

/** Which section the learner is in, for the progress strip. */
export function currentSection(state: SelectorState): AssessmentSection | null {
  const live = SECTION_ORDER.find((section) =>
    state.areas.some((area) => area.section === section && !area.stopped),
  );
  return live ?? null;
}

/**
 * The provisional level for an area (§9.4): the highest difficulty answered correctly at least
 * twice, or answered correctly once with a miss one level higher — the classic staircase reading of
 * "this is where they topped out".
 *
 * `unknown` answers are not counted either way. They say nothing about the ceiling, which is what
 * this function estimates; what they say belongs in the gap map, not here.
 *
 * The evaluation job refines this with the AI's reading of the actual answers; this is what the test
 * itself can say.
 */
export function provisionalLevel(area: AreaState, difficulties?: readonly Difficulty[]): number {
  const levels = difficulties ?? area.difficulties;
  const correctAt = new Map<number, number>();
  const missedAt = new Set<number>();

  area.outcomes.forEach((outcome, index) => {
    const difficulty = levels[index];
    if (difficulty === undefined || outcome === "unknown") return;
    if (outcome === "correct") correctAt.set(difficulty, (correctAt.get(difficulty) ?? 0) + 1);
    else missedAt.add(difficulty);
  });

  let best = 0;
  for (const [difficulty, count] of correctAt) {
    if (count >= 2) best = Math.max(best, difficulty);
    else if (count === 1 && missedAt.has(difficulty + 1)) best = Math.max(best, difficulty);
  }

  // Nothing conclusive: fall back to the lowest level they got right at all, or 1.
  if (best === 0) {
    const anyCorrect = [...correctAt.keys()];
    best = anyCorrect.length > 0 ? Math.min(...anyCorrect) : 1;
  }

  return best;
}

/**
 * How many questions this area was not able to answer, as a share.
 *
 * The number "I don't know" exists to produce. A high share is the strongest evidence the assessment
 * can give the course builder: not "they got this wrong" but "they told us they have not met this".
 */
export function unknownShare(area: AreaState): number {
  if (area.outcomes.length === 0) return 0;
  return area.outcomes.filter((outcome) => outcome === "unknown").length / area.outcomes.length;
}
