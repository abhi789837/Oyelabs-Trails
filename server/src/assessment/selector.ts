import type { Difficulty } from "../../../shared/assessment";

/**
 * The adaptive selector (brief §9.4). No AI involved: the pool was generated in advance, and
 * during the test the server only chooses from it.
 *
 * The shape of the algorithm is a simple staircase per area. Answer correctly and the next item
 * in that area is a level harder; miss and it is a level easier. Areas are visited round-robin so
 * fatigue is spread rather than concentrated on whichever area happens to be first, and an area
 * stops once it has enough signal — six items, or two reversals between the same adjacent pair,
 * which is the point at which more items stop changing the estimate.
 *
 * Pure functions over explicit state, so the whole thing is unit-testable without a database.
 */

export interface AreaState {
  area: string;
  /** Current difficulty, initialised from the blueprint hypothesis clamped to 2..4. */
  theta: Difficulty;
  /** Ids of items already served in this area. */
  served: string[];
  /** Correct/incorrect per served item, in order. */
  outcomes: boolean[];
  /** Direction changes between adjacent levels. */
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

export function initSelectorState(areas: { name: string; hypothesisLevel: number }[]): SelectorState {
  return {
    areas: areas.map((area) => ({
      area: area.name,
      // Clamped to 2..4: starting at 1 or 5 wastes items proving something the staircase would
      // reach anyway, and the hypothesis is only a guess from the notes.
      theta: clampTheta(area.hypothesisLevel),
      served: [],
      outcomes: [],
      reversals: 0,
      stopped: false,
    })),
    cursor: 0,
    servedCount: 0,
  };
}

export function clampTheta(level: number): Difficulty {
  return Math.min(4, Math.max(2, Math.round(level))) as Difficulty;
}

/**
 * Picks the next item.
 *
 * Walks the areas round-robin from the cursor, skipping stopped ones, and takes an unserved pool
 * item at the area's current difficulty — or the nearest available, because a pool is never
 * perfectly filled at every level.
 */
export function selectNext(
  state: SelectorState,
  pool: PoolItemRef[],
  options: { targetItemCount: number; includeExplain: boolean },
): { item: PoolItemRef; areaIndex: number } | null {
  const servedIds = new Set(state.areas.flatMap((a) => a.served));

  // Written answers are held back until the adaptive part is finished (§9.4).
  const available = pool.filter((item) => !servedIds.has(item.id) && (options.includeExplain ? item.kind === "explain" : item.kind !== "explain"));

  if (options.includeExplain) {
    const next = available[0];
    return next ? { item: next, areaIndex: -1 } : null;
  }

  if (state.servedCount >= options.targetItemCount) return null;

  for (let step = 0; step < state.areas.length; step++) {
    const areaIndex = (state.cursor + step) % state.areas.length;
    const area = state.areas[areaIndex];
    if (area.stopped) continue;

    const candidates = available.filter((item) => item.area === area.area);
    if (candidates.length === 0) continue;

    // Nearest difficulty to theta; ties go to the harder one, so a thin pool errs upward rather
    // than repeatedly asking easy questions of someone who is doing well.
    const best = candidates.reduce((a, b) => {
      const da = Math.abs(a.difficulty - area.theta);
      const db = Math.abs(b.difficulty - area.theta);
      if (da !== db) return da < db ? a : b;
      return a.difficulty >= b.difficulty ? a : b;
    });

    return { item: best, areaIndex };
  }

  return null;
}

/**
 * Folds an answer into the state.
 *
 * `score` is 0..1. A code item counts as correct at 0.5 or more, because passing half the tests
 * shows the approach was right even if an edge case was missed (§9.4).
 */
export function recordOutcome(state: SelectorState, areaIndex: number, itemId: string, score: number): SelectorState {
  if (areaIndex < 0) return { ...state, servedCount: state.servedCount + 1 };

  const areas = state.areas.map((area, index) => {
    if (index !== areaIndex) return area;

    const correct = score >= 0.5;
    const previous = area.outcomes.at(-1);
    const direction = correct ? 1 : -1;
    const previousDirection = previous === undefined ? 0 : previous ? 1 : -1;
    // A reversal is a change of direction: up then down, or down then up.
    const reversals = previousDirection !== 0 && previousDirection !== direction ? area.reversals + 1 : area.reversals;

    const theta = clampStep(area.theta + direction);
    const served = [...area.served, itemId];
    const outcomes = [...area.outcomes, correct];

    return {
      ...area,
      theta,
      served,
      outcomes,
      reversals,
      stopped: served.length >= MAX_ITEMS_PER_AREA || reversals >= MAX_REVERSALS,
    };
  });

  return {
    areas,
    cursor: (areaIndex + 1) % state.areas.length,
    servedCount: state.servedCount + 1,
  };
}

function clampStep(value: number): Difficulty {
  return Math.min(5, Math.max(1, value)) as Difficulty;
}

export function allAreasStopped(state: SelectorState): boolean {
  return state.areas.every((area) => area.stopped);
}

/**
 * The provisional level for an area (§9.4): the highest difficulty answered correctly at least
 * twice, or answered correctly once with a miss one level higher — which is the classic staircase
 * reading of "this is where they topped out".
 *
 * The evaluation job refines this with the AI's reading of the actual answers; this is what the
 * test itself can say.
 */
export function provisionalLevel(area: AreaState, difficulties: Difficulty[]): number {
  const correctAt = new Map<number, number>();
  const missedAt = new Set<number>();

  area.outcomes.forEach((correct, index) => {
    const difficulty = difficulties[index];
    if (difficulty === undefined) return;
    if (correct) correctAt.set(difficulty, (correctAt.get(difficulty) ?? 0) + 1);
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
