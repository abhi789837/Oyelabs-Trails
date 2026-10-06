import { describe, expect, test } from "vitest";

import { LANE_META } from "@/features/plan/laneMeta";
import { buttonVariants } from "@/v5/design/components/Button";
import { whyChip } from "@shared/today";

import { HERO_LANE, PRIMARY_LG, clockLabel, greeting, hoursLabel, minutesLabel, stepLine, trailWindow, weekRange } from "./format";

const stop = (id: string, done: boolean) => ({ id, title: id, lane: "must_know" as const, minutes: 10, done, href: `/learn/lesson/${id}` });

describe("Today format helpers", () => {
  test("durations", () => {
    expect(minutesLabel(0)).toBe("0 min");
    expect(minutesLabel(45)).toBe("45 min");
    expect(minutesLabel(60)).toBe("1 h");
    expect(minutesLabel(125)).toBe("2 h 5 min");
    expect(hoursLabel(0)).toBe("0");
    expect(hoursLabel(150)).toBe("2.5");
    expect(hoursLabel(900)).toBe("15");
    expect(clockLabel(307)).toBe("5:07");
    expect(clockLabel(3723)).toBe("1:02:03");
  });

  test("step line", () => {
    expect(stepLine("watch", 307)).toBe("Watch, from 5:07");
    expect(stepLine("watch", 2)).toBe("Watch");
    expect(stepLine("do", 307)).toBe("Do");
    expect(stepLine(null, null)).toBeNull();
  });

  test("greeting by hour", () => {
    expect(greeting(8)).toBe("Good morning");
    expect(greeting(14)).toBe("Good afternoon");
    expect(greeting(20)).toBe("Good evening");
  });

  test("trail window keeps 'you are here' on screen", () => {
    const stops = [stop("a", true), stop("b", true), stop("c", true), stop("d", false), stop("e", false), stop("f", false), stop("g", false), stop("h", false)];
    const w = trailWindow(stops);
    expect(w.stops.map((s) => s.id)).toEqual(["b", "c", "d", "e", "f", "g"]);
    expect(w).toMatchObject({ hiddenBefore: 1, hiddenAfter: 1 });
    expect(trailWindow([stop("a", true), stop("b", true)]).stops.map((s) => s.id)).toEqual(["a", "b"]);
    expect(trailWindow([]).stops).toEqual([]);
  });

  test("week range", () => {
    expect(weekRange("2026-10-05", "2026-10-11")).toBe("5 Oct – 11 Oct");
  });
});

test("the hero's lane labels match the design system's and Up next's why chips (T5, P3)", () => {
  for (const lane of ["do_now", "must_know", "medium", "low"] as const) {
    expect(HERO_LANE[lane].label).toBe(LANE_META[lane].label);
    expect(whyChip(lane, null)).toBe(LANE_META[lane].label);
  }
});

test("the hero's Continue looks exactly like the primary large button", () => {
  const norm = (s: string) => s.split(/\s+/).filter(Boolean).sort().join(" ");
  expect(norm(PRIMARY_LG)).toBe(norm(buttonVariants({ variant: "primary", size: "lg" })));
});
