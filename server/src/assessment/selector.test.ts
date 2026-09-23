import { describe, expect, test } from "vitest";

import type { Difficulty } from "../../../shared/assessment";
import {
  allAreasStopped,
  clampTheta,
  initSelectorState,
  MAX_ITEMS_PER_AREA,
  provisionalLevel,
  recordOutcome,
  selectNext,
  type PoolItemRef,
} from "./selector";

/**
 * The selector is pure, so it can be driven directly rather than through the API. These tests are
 * the specification of the staircase in brief §9.4.
 */

const areas = [
  { name: "Fundamentals", hypothesisLevel: 2 },
  { name: "Async", hypothesisLevel: 3 },
  { name: "Data", hypothesisLevel: 4 },
];

/** A full pool: three items at every difficulty in every area, plus two written answers. */
function fullPool(): PoolItemRef[] {
  const pool: PoolItemRef[] = [];
  for (const area of areas) {
    for (let difficulty = 1; difficulty <= 5; difficulty++) {
      for (let n = 0; n < 3; n++) {
        pool.push({ id: `${area.name}-${difficulty}-${n}`, area: area.name, difficulty: difficulty as Difficulty, kind: "mcq" });
      }
    }
  }
  pool.push({ id: "explain-1", area: "Written answers", difficulty: 4, kind: "explain" });
  pool.push({ id: "explain-2", area: "Written answers", difficulty: 4, kind: "explain" });
  return pool;
}

const options = { targetItemCount: 30, includeExplain: false };

describe("starting point", () => {
  test("clamps the blueprint hypothesis to 2..4", () => {
    expect(clampTheta(1)).toBe(2);
    expect(clampTheta(3)).toBe(3);
    expect(clampTheta(5)).toBe(4);
  });

  test("starts each area at its own hypothesis", () => {
    const state = initSelectorState(areas);
    expect(state.areas.map((a) => a.theta)).toEqual([2, 3, 4]);
  });

  test("serves the first item at the area's hypothesis level", () => {
    const chosen = selectNext(initSelectorState(areas), fullPool(), options);
    expect(chosen?.item.area).toBe("Fundamentals");
    expect(chosen?.item.difficulty).toBe(2);
  });
});

describe("the staircase", () => {
  test("a correct answer makes the next item in that area harder", () => {
    let state = initSelectorState(areas);
    const first = selectNext(state, fullPool(), options)!;
    state = recordOutcome(state, first.areaIndex, first.item.id, 1);
    expect(state.areas[0].theta).toBe(3);
  });

  test("a wrong answer makes it easier", () => {
    let state = initSelectorState(areas);
    const first = selectNext(state, fullPool(), options)!;
    state = recordOutcome(state, first.areaIndex, first.item.id, 0);
    expect(state.areas[0].theta).toBe(1);
  });

  test("a code item counts as correct at half marks, per §9.4", () => {
    let state = initSelectorState(areas);
    state = recordOutcome(state, 1, "x", 0.5);
    expect(state.areas[1].theta).toBe(4);

    let other = initSelectorState(areas);
    other = recordOutcome(other, 1, "x", 0.49);
    expect(other.areas[1].theta).toBe(2);
  });

  test("never steps outside 1..5", () => {
    let state = initSelectorState(areas);
    for (let i = 0; i < 10; i++) state = recordOutcome(state, 0, `up-${i}`, 1);
    expect(state.areas[0].theta).toBe(5);

    let down = initSelectorState(areas);
    for (let i = 0; i < 10; i++) down = recordOutcome(down, 2, `down-${i}`, 0);
    expect(down.areas[2].theta).toBe(1);
  });

  test("visits areas round-robin, so fatigue is spread", () => {
    let state = initSelectorState(areas);
    const pool = fullPool();
    const seen: string[] = [];

    for (let i = 0; i < 6; i++) {
      const chosen = selectNext(state, pool, options)!;
      seen.push(chosen.item.area);
      state = recordOutcome(state, chosen.areaIndex, chosen.item.id, 1);
    }

    expect(seen).toEqual(["Fundamentals", "Async", "Data", "Fundamentals", "Async", "Data"]);
  });

  test("never serves the same item twice over a full run", () => {
    let state = initSelectorState(areas);
    const pool = fullPool();
    const served = new Set<string>();

    // All-correct, so every area runs to its item cap rather than stopping early on reversals.
    for (let i = 0; i < 30; i++) {
      const chosen = selectNext(state, pool, options);
      if (!chosen) break;
      expect(served.has(chosen.item.id), `${chosen.item.id} was served twice`).toBe(false);
      served.add(chosen.item.id);
      state = recordOutcome(state, chosen.areaIndex, chosen.item.id, 1);
    }

    expect(served.size).toBe(areas.length * MAX_ITEMS_PER_AREA);
  });

  test("alternating right and wrong stops each area after three items, on two reversals", () => {
    let state = initSelectorState(areas);
    const pool = fullPool();
    let count = 0;

    for (let i = 0; i < 30; i++) {
      const chosen = selectNext(state, pool, options);
      if (!chosen) break;
      count += 1;
      state = recordOutcome(state, chosen.areaIndex, chosen.item.id, i % 2 === 0 ? 1 : 0);
    }

    // Three areas × three items: up, reversal, reversal. This is the rule doing its job — someone
    // oscillating around a level is not told anything more by a fourth item.
    expect(count).toBe(9);
    expect(allAreasStopped(state)).toBe(true);
  });

  test("falls back to the nearest difficulty when the exact level is exhausted", () => {
    // A pool with nothing at level 2 in Fundamentals.
    const pool = fullPool().filter((i) => !(i.area === "Fundamentals" && i.difficulty === 2));
    const chosen = selectNext(initSelectorState(areas), pool, options)!;
    expect(chosen.item.area).toBe("Fundamentals");
    expect([1, 3]).toContain(chosen.item.difficulty);
    // Ties go upward, so a thin pool errs toward asking something harder.
    expect(chosen.item.difficulty).toBe(3);
  });
});

describe("stopping", () => {
  test(`an area stops after ${MAX_ITEMS_PER_AREA} items`, () => {
    let state = initSelectorState(areas);
    for (let i = 0; i < MAX_ITEMS_PER_AREA; i++) state = recordOutcome(state, 0, `item-${i}`, 1);
    expect(state.areas[0].stopped).toBe(true);
    expect(state.areas[1].stopped).toBe(false);
  });

  test("an area stops after two reversals", () => {
    let state = initSelectorState(areas);
    state = recordOutcome(state, 0, "a", 1); // up
    state = recordOutcome(state, 0, "b", 0); // reversal 1
    state = recordOutcome(state, 0, "c", 1); // reversal 2
    expect(state.areas[0].reversals).toBe(2);
    expect(state.areas[0].stopped).toBe(true);
  });

  test("a stopped area is skipped, and selection ends when all are stopped", () => {
    let state = initSelectorState(areas);
    const pool = fullPool();

    for (let round = 0; round < MAX_ITEMS_PER_AREA; round++) {
      for (let area = 0; area < areas.length; area++) {
        state = recordOutcome(state, area, `${area}-${round}`, 1);
      }
    }

    expect(allAreasStopped(state)).toBe(true);
    expect(selectNext(state, pool, options)).toBeNull();
  });

  test("selection ends when the item target is reached, even if areas are still open", () => {
    let state = initSelectorState(areas);
    for (let i = 0; i < 8; i++) state = recordOutcome(state, -1, `x-${i}`, 1);
    expect(selectNext(state, fullPool(), { targetItemCount: 8, includeExplain: false })).toBeNull();
  });
});

describe("written answers", () => {
  test("are held back from the adaptive section and served after it", () => {
    const state = initSelectorState(areas);
    const pool = fullPool();

    const adaptive = selectNext(state, pool, { targetItemCount: 30, includeExplain: false })!;
    expect(adaptive.item.kind).not.toBe("explain");

    const written = selectNext(state, pool, { targetItemCount: 30, includeExplain: true })!;
    expect(written.item.kind).toBe("explain");
    expect(written.areaIndex).toBe(-1);
  });
});

describe("provisional level", () => {
  test("is the highest difficulty answered correctly twice", () => {
    const area = { area: "a", theta: 3 as Difficulty, served: [], outcomes: [true, true, false], reversals: 0, stopped: true };
    expect(provisionalLevel(area, [3, 3, 4])).toBe(3);
  });

  test("accepts one correct plus a miss one level higher", () => {
    const area = { area: "a", theta: 3 as Difficulty, served: [], outcomes: [true, false], reversals: 0, stopped: true };
    expect(provisionalLevel(area, [3, 4])).toBe(3);
  });

  test("falls back to the lowest correct level when nothing is conclusive", () => {
    const area = { area: "a", theta: 2 as Difficulty, served: [], outcomes: [true, false], reversals: 0, stopped: true };
    expect(provisionalLevel(area, [2, 5])).toBe(2);
  });

  test("is 1 when nothing was answered correctly", () => {
    const area = { area: "a", theta: 1 as Difficulty, served: [], outcomes: [false, false], reversals: 0, stopped: true };
    expect(provisionalLevel(area, [2, 1])).toBe(1);
  });
});
