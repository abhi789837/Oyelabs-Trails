import { describe, expect, test } from "vitest";

import type { Difficulty } from "../../../shared/assessment";
import type { AssessmentSection } from "../../../shared/sections";
import {
  allAreasStopped,
  CORRECT_AT_LEVEL_TO_STOP,
  CORRECT_TO_ADVANCE,
  currentSection,
  initSelectorState,
  MAX_ITEMS_PER_AREA,
  normaliseState,
  provisionalLevel,
  recordOutcome,
  selectNext,
  startingTheta,
  unknownShare,
  WRONG_AT_LEVEL_TO_STOP,
  type PoolItemRef,
  type SelectorState,
} from "./selector";

/**
 * The staircase, as a specification.
 *
 * The selector is pure, so it is driven directly rather than through the API. These tests are where
 * "the assessment is too hard" was actually fixed, so each one names the rule it is holding down —
 * start low, climb slowly, never punish "I don't know", and stop as soon as the answer is known.
 */

const areas = [
  { name: "Fundamentals", hypothesisLevel: 2, section: "track_basics" as AssessmentSection },
  { name: "Async", hypothesisLevel: 3, section: "track_basics" as AssessmentSection },
  { name: "Data", hypothesisLevel: 4, section: "high_targets" as AssessmentSection },
];

/** A full pool: three items at every difficulty in every area, plus two written answers. */
function fullPool(): PoolItemRef[] {
  const pool: PoolItemRef[] = [];
  for (const area of areas) {
    for (let difficulty = 1; difficulty <= 5; difficulty++) {
      for (let n = 0; n < 3; n++) {
        pool.push({
          id: `${area.name}-${difficulty}-${n}`,
          area: area.name,
          difficulty: difficulty as Difficulty,
          kind: "mcq",
        });
      }
    }
  }
  pool.push({ id: "explain-1", area: "Written answers", difficulty: 4, kind: "explain" });
  pool.push({ id: "explain-2", area: "Written answers", difficulty: 4, kind: "explain" });
  return pool;
}

const options = { targetItemCount: 30, includeExplain: false };

/** Answers the current item in whichever area it came from. */
function answer(state: SelectorState, pool: PoolItemRef[], outcome: "correct" | "wrong" | "unknown"): SelectorState {
  const chosen = selectNext(state, pool, options);
  if (!chosen) return state;
  return recordOutcome(state, chosen.areaIndex, chosen.item.id, outcome === "correct" ? 1 : 0, {
    unknown: outcome === "unknown",
    difficulty: chosen.item.difficulty,
  });
}

/** Drives one area in isolation, so a staircase can be read without the round-robin in the way. */
function soloState(hypothesis = 2): SelectorState {
  return initSelectorState([{ name: "Solo", hypothesisLevel: hypothesis, section: "track_basics" }]);
}
function soloPool(): PoolItemRef[] {
  const pool: PoolItemRef[] = [];
  for (let difficulty = 1; difficulty <= 5; difficulty++) {
    for (let n = 0; n < 4; n++) {
      pool.push({ id: `s-${difficulty}-${n}`, area: "Solo", difficulty: difficulty as Difficulty, kind: "mcq" });
    }
  }
  return pool;
}

describe("it starts easy", () => {
  test("nothing begins above medium, whatever the admin guessed", () => {
    /* The single biggest reason the old test felt punishing: `theta` was seeded from the blueprint's
       hypothesis clamped to 2–4, so a learner whose admin guessed "4" opened with an advanced
       question about something nobody had asked them about yet. */
    expect(startingTheta(1)).toBe(1);
    expect(startingTheta(2)).toBe(1);
    expect(startingTheta(3)).toBe(2);
    expect(startingTheta(5)).toBe(2);
  });

  test("the first item of every area is easy or medium", () => {
    const state = initSelectorState(areas);
    expect(state.areas.map((a) => a.theta)).toEqual([1, 2, 2]);

    const chosen = selectNext(state, fullPool(), options);
    expect(chosen?.item.difficulty).toBeLessThanOrEqual(2);
  });

  test("a thin pool errs towards the easier question, not the harder one", () => {
    /* The old rule broke ties upward "so a thin pool errs upward rather than repeatedly asking easy
       questions". That instinct is what this redesign is about. */
    const state = soloState(3);
    const pool: PoolItemRef[] = [
      { id: "easy", area: "Solo", difficulty: 1, kind: "mcq" },
      { id: "hard", area: "Solo", difficulty: 3, kind: "mcq" },
    ];
    expect(selectNext(state, pool, options)?.item.id).toBe("easy");
  });
});

describe("it climbs slowly", () => {
  test("one correct answer does not move it", () => {
    const pool = soloPool();
    const after = answer(soloState(), pool, "correct");
    expect(after.areas[0].theta).toBe(1);
  });

  test(`${CORRECT_TO_ADVANCE} correct in a row moves it up one`, () => {
    const pool = soloPool();
    let state = soloState();
    state = answer(state, pool, "correct");
    state = answer(state, pool, "correct");
    expect(state.areas[0].theta).toBe(2);
  });

  test("a wrong answer in between resets the climb", () => {
    const pool = soloPool();
    let state = soloState();
    state = answer(state, pool, "correct");
    state = answer(state, pool, "wrong");
    state = answer(state, pool, "correct");
    // One correct since the miss: not two, so no climb.
    expect(state.areas[0].theta).toBe(1);
  });

  test("one wrong answer moves it down immediately", () => {
    const pool = soloPool();
    let state = soloState(3); // starts at 2
    state = answer(state, pool, "wrong");
    expect(state.areas[0].theta).toBe(1);
  });

  test("a code item counts as correct at half marks, per §9.4", () => {
    const state = soloState();
    const pool = soloPool();
    const first = selectNext(state, pool, options)!;
    const afterFirst = recordOutcome(state, first.areaIndex, first.item.id, 0.5, { difficulty: first.item.difficulty });
    const second = selectNext(afterFirst, pool, options)!;
    const afterSecond = recordOutcome(afterFirst, second.areaIndex, second.item.id, 0.5, {
      difficulty: second.item.difficulty,
    });
    expect(afterSecond.areas[0].theta).toBe(2);
  });

  test("never steps outside 1..5", () => {
    const pool = soloPool();
    let state = soloState();
    for (let i = 0; i < 12; i++) state = answer(state, pool, "wrong");
    expect(state.areas[0].theta).toBeGreaterThanOrEqual(1);

    let up = soloState(3);
    for (let i = 0; i < 12; i++) up = answer(up, pool, "correct");
    expect(up.areas[0].theta).toBeLessThanOrEqual(5);
  });
});

describe('"I don\'t know yet"', () => {
  test("does not push the staircase down", () => {
    /* The whole point of the option. If not knowing something cost you a level, saying so would cost
       you, and nobody would — and the test would lose the clearest signal it can get. */
    const pool = soloPool();
    let state = soloState(3); // starts at 2
    state = answer(state, pool, "unknown");
    expect(state.areas[0].theta).toBe(2);
  });

  test("does not count towards the two-wrong stop", () => {
    const pool = soloPool();
    let state = soloState();
    state = answer(state, pool, "unknown");
    state = answer(state, pool, "unknown");
    expect(state.areas[0].stopped).toBe(false);
  });

  test("does not break a run of correct answers", () => {
    // It is not a wrong answer, but it is not a right one either: the streak pauses, it does not reset.
    const pool = soloPool();
    let state = soloState();
    state = answer(state, pool, "correct");
    state = answer(state, pool, "unknown");
    state = answer(state, pool, "correct");
    // One correct, then unknown, then one correct — no two in a row, so no climb.
    expect(state.areas[0].theta).toBe(1);
  });

  test("is still recorded, and is reportable as a share", () => {
    const pool = soloPool();
    let state = soloState();
    state = answer(state, pool, "unknown");
    state = answer(state, pool, "correct");
    expect(state.areas[0].outcomes).toEqual(["unknown", "correct"]);
    expect(unknownShare(state.areas[0])).toBe(0.5);
  });

  test("is not counted in the level estimate either way", () => {
    const area = {
      area: "Solo",
      section: "track_basics" as AssessmentSection,
      theta: 3 as Difficulty,
      served: ["a", "b", "c"],
      outcomes: ["correct", "correct", "unknown"] as const,
      difficulties: [3, 3, 5] as Difficulty[],
      reversals: 0,
      stopped: true,
    };
    // Two correct at 3, and an "I don't know" at 5 that says nothing about the ceiling.
    expect(provisionalLevel({ ...area, outcomes: [...area.outcomes] })).toBe(3);
  });
});

describe("it stops as soon as the level is known", () => {
  test(`${CORRECT_AT_LEVEL_TO_STOP} correct at one level is enough`, () => {
    const pool: PoolItemRef[] = Array.from({ length: 6 }, (_, i) => ({
      id: `flat-${i}`,
      area: "Solo",
      difficulty: 1,
      kind: "mcq",
    }));
    let state = soloState();
    state = answer(state, pool, "correct");
    state = answer(state, pool, "correct");
    expect(state.areas[0].stopped).toBe(false);
    state = answer(state, pool, "correct");
    expect(state.areas[0].stopped).toBe(true);
  });

  test(`${WRONG_AT_LEVEL_TO_STOP} wrong at one level is enough`, () => {
    const pool: PoolItemRef[] = Array.from({ length: 6 }, (_, i) => ({
      id: `flat-${i}`,
      area: "Solo",
      difficulty: 1,
      kind: "mcq",
    }));
    let state = soloState();
    state = answer(state, pool, "wrong");
    expect(state.areas[0].stopped).toBe(false);
    state = answer(state, pool, "wrong");
    expect(state.areas[0].stopped).toBe(true);
  });

  test(`an area stops after ${MAX_ITEMS_PER_AREA} items regardless`, () => {
    const pool = soloPool();
    let state = soloState();
    // Alternating never reaches three-at-a-level, so the hard cap is what ends it.
    for (let i = 0; i < MAX_ITEMS_PER_AREA; i++) state = answer(state, pool, i % 2 === 0 ? "correct" : "unknown");
    expect(state.areas[0].served.length).toBeLessThanOrEqual(MAX_ITEMS_PER_AREA);
    expect(state.areas[0].stopped).toBe(true);
  });

  test("a stopped area is skipped, and selection ends when all are stopped", () => {
    const pool = fullPool();
    let state = initSelectorState(areas);
    for (let i = 0; i < 40 && !allAreasStopped(state); i++) state = answer(state, pool, i % 3 === 0 ? "wrong" : "correct");

    expect(allAreasStopped(state)).toBe(true);
    expect(selectNext(state, pool, options)).toBeNull();
  });

  test("selection ends when the item target is reached, even if areas are still open", () => {
    const pool = fullPool();
    let state = initSelectorState(areas);
    for (let i = 0; i < 4; i++) state = answer(state, pool, "unknown");
    expect(selectNext(state, pool, { targetItemCount: 4, includeExplain: false })).toBeNull();
  });
});

describe("sections", () => {
  test("are finished in order, not interleaved", () => {
    /* "Part 2 of 5" only means something if part 1 is actually over. The old selector round-robined
       every area at once, so there was no part to be on. */
    const pool = fullPool();
    let state = initSelectorState(areas);
    const seen: AssessmentSection[] = [];

    for (let i = 0; i < 20; i++) {
      const chosen = selectNext(state, pool, options);
      if (!chosen) break;
      seen.push(chosen.section);
      state = recordOutcome(state, chosen.areaIndex, chosen.item.id, 1, { difficulty: chosen.item.difficulty });
    }

    const firstHigh = seen.indexOf("high_targets");
    const lastBasics = seen.lastIndexOf("track_basics");
    expect(firstHigh).toBeGreaterThan(-1);
    expect(lastBasics).toBeLessThan(firstHigh);
  });

  test("round-robin still spreads fatigue within a section", () => {
    const pool = fullPool();
    let state = initSelectorState(areas);
    const order: string[] = [];
    for (let i = 0; i < 2; i++) {
      const chosen = selectNext(state, pool, options)!;
      order.push(chosen.item.area);
      state = recordOutcome(state, chosen.areaIndex, chosen.item.id, 1, { difficulty: chosen.item.difficulty });
    }
    expect(order).toEqual(["Fundamentals", "Async"]);
  });

  test("a section budget stops that section and moves on", () => {
    const pool = fullPool();
    let state = initSelectorState(areas);
    const budgets = { track_basics: 2 };

    for (let i = 0; i < 2; i++) {
      const chosen = selectNext(state, pool, { ...options, sectionBudgets: budgets })!;
      expect(chosen.section).toBe("track_basics");
      state = recordOutcome(state, chosen.areaIndex, chosen.item.id, 1, { difficulty: chosen.item.difficulty });
    }

    expect(selectNext(state, pool, { ...options, sectionBudgets: budgets })?.section).toBe("high_targets");
  });

  test("currentSection names the part still open", () => {
    const state = initSelectorState(areas);
    expect(currentSection(state)).toBe("track_basics");
  });
});

describe("written answers", () => {
  test("are held back from the adaptive section and served after it", () => {
    const pool = fullPool();
    let state = initSelectorState(areas);
    for (let i = 0; i < 30 && selectNext(state, pool, options); i++) state = answer(state, pool, "correct");

    expect(selectNext(state, pool, options)).toBeNull();
    const written = selectNext(state, pool, { ...options, includeExplain: true });
    expect(written?.item.kind).toBe("explain");
  });
});

describe("an assessment that was in flight when this shipped", () => {
  test("is upgraded rather than restarted", () => {
    /* A `SelectorState` stored before this file changed shape: boolean outcomes, no difficulties, no
       section. Throwing it away would restart somebody's test; refusing to read it would end it. */
    const legacy = {
      areas: [
        {
          area: "Fundamentals",
          theta: 3 as Difficulty,
          served: ["a", "b"],
          outcomes: [true, false] as unknown as never,
          reversals: 1,
          stopped: false,
        },
      ],
      cursor: 0,
      servedCount: 2,
    } as unknown as SelectorState;

    const upgraded = normaliseState(legacy);
    expect(upgraded.areas[0].outcomes).toEqual(["correct", "wrong"]);
    expect(upgraded.areas[0].section).toBe("track_basics");
    expect(upgraded.areas[0].difficulties).toHaveLength(2);
    expect(upgraded.section).toBe("track_basics");

    // And it is usable: the next call picks an item rather than throwing.
    const pool: PoolItemRef[] = [{ id: "next", area: "Fundamentals", difficulty: 3, kind: "mcq" }];
    expect(selectNext(upgraded, pool, options)?.item.id).toBe("next");
  });
});

describe("provisional level", () => {
  function area(outcomes: ("correct" | "wrong")[], difficulties: Difficulty[]) {
    return {
      area: "A",
      section: "track_basics" as AssessmentSection,
      theta: 3 as Difficulty,
      served: outcomes.map((_, i) => `i${i}`),
      outcomes,
      difficulties,
      reversals: 0,
      stopped: true,
    };
  }

  test("is the highest difficulty answered correctly twice", () => {
    expect(provisionalLevel(area(["correct", "correct"], [3, 3]))).toBe(3);
  });

  test("accepts one correct plus a miss one level higher", () => {
    expect(provisionalLevel(area(["correct", "wrong"], [3, 4]))).toBe(3);
  });

  test("falls back to the lowest correct level when nothing is conclusive", () => {
    expect(provisionalLevel(area(["correct", "correct"], [2, 4]))).toBe(2);
  });

  test("is 1 when nothing was answered correctly", () => {
    expect(provisionalLevel(area(["wrong", "wrong"], [2, 1]))).toBe(1);
  });
});
