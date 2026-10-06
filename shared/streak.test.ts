import { describe, expect, test } from "vitest";

import { addWeeks, computeStreak, isWeekKey, isWeekMet, isoWeekKey, monthOfWeek, weekKeyToMonday, weeksBetween } from "./streak";

const at = (iso: string) => Date.parse(`${iso}T12:00:00.000Z`);
const metSet = (weeks: string[]) => {
  const set = new Set(weeks);
  return (w: string) => set.has(w);
};

describe("ISO week keys", () => {
  test("known dates", () => {
    expect(isoWeekKey(at("2026-10-06"))).toBe("2026-W41");
    expect(isoWeekKey(at("2026-01-01"))).toBe("2026-W01");
    // 29 Dec 2025 is a Monday whose Thursday is 1 Jan 2026.
    expect(isoWeekKey(at("2025-12-29"))).toBe("2026-W01");
    // 1 Jan 2021 is a Friday: it belongs to 2020-W53.
    expect(isoWeekKey(at("2021-01-01"))).toBe("2020-W53");
    // Sunday is the last day of the ISO week.
    expect(isoWeekKey(at("2026-10-11"))).toBe("2026-W41");
    expect(isoWeekKey(at("2026-10-12"))).toBe("2026-W42");
  });

  test("round trip, arithmetic and validation", () => {
    expect(new Date(weekKeyToMonday("2026-W41")).toISOString().slice(0, 10)).toBe("2026-10-05");
    expect(addWeeks("2020-W52", 1)).toBe("2020-W53");
    expect(addWeeks("2020-W53", 1)).toBe("2021-W01");
    expect(weeksBetween("2026-W01", "2026-W41")).toBe(40);
    expect(isWeekKey("2026-W41")).toBe(true);
    expect(isWeekKey("2026-W53")).toBe(true); // 2026 starts on a Thursday, so it has 53 weeks
    expect(isWeekKey("2025-W53")).toBe(false);
    expect(isWeekKey("2026-41")).toBe(false);
  });

  test("a week's month is its Thursday's month", () => {
    // 2026-W40 runs Mon 28 Sep to Sun 4 Oct; its Thursday is 1 Oct.
    expect(monthOfWeek("2026-W40")).toBe("2026-10");
    expect(monthOfWeek("2026-W39")).toBe("2026-09");
  });
});

describe("the met rule", () => {
  test("hours against the goal", () => {
    expect(isWeekMet({ minutes: 600, steps: 0 }, 600)).toBe(true);
    expect(isWeekMet({ minutes: 599, steps: 99 }, 600)).toBe(false);
  });
  test("no goal: 3 steps", () => {
    expect(isWeekMet({ minutes: 0, steps: 3 }, null)).toBe(true);
    expect(isWeekMet({ minutes: 999, steps: 2 }, null)).toBe(false);
    expect(isWeekMet({ minutes: 0, steps: 3 }, 0)).toBe(true);
  });
});

describe("computeStreak", () => {
  test("a new user has nothing yet, and the running week isn't a miss", () => {
    const s = computeStreak({ firstWeek: "2026-W41", currentWeek: "2026-W41", isMet: () => false });
    expect(s).toMatchObject({ current: 0, best: 0, lastMetWeek: null, freezesLeft: 1, freezeMonth: "2026-10", metThisWeek: false });
    expect(s.history).toEqual([]);
  });

  test("met weeks in a row count, the running week counts once met", () => {
    const s = computeStreak({ firstWeek: "2026-W38", currentWeek: "2026-W41", isMet: metSet(["2026-W38", "2026-W39", "2026-W40", "2026-W41"]) });
    expect(s.current).toBe(4);
    expect(s.best).toBe(4);
    expect(s.metThisWeek).toBe(true);
    expect(s.lastMetWeek).toBe("2026-W41");
  });

  test("an unmet running week keeps last week's streak", () => {
    const s = computeStreak({ firstWeek: "2026-W39", currentWeek: "2026-W41", isMet: metSet(["2026-W39", "2026-W40"]) });
    expect(s.current).toBe(2);
    expect(s.history.map((h) => h.week)).toEqual(["2026-W39", "2026-W40"]);
  });

  test("one missed week uses the month's freeze and keeps the streak", () => {
    // W41, W42 met; W43 missed (October's freeze); W44 met.
    const s = computeStreak({ firstWeek: "2026-W41", currentWeek: "2026-W44", isMet: metSet(["2026-W41", "2026-W42", "2026-W44"]) });
    expect(s.history.find((h) => h.week === "2026-W43")).toEqual({ week: "2026-W43", met: false, frozen: true });
    expect(s.current).toBe(3);
    expect(s.freezesLeft).toBe(0);
    expect(s.freezeMonth).toBe("2026-10");
  });

  test("a second miss in the same month breaks the streak", () => {
    const s = computeStreak({ firstWeek: "2026-W40", currentWeek: "2026-W44", isMet: metSet(["2026-W40", "2026-W41"]) });
    // W42 frozen, W43 missed with no freeze left.
    expect(s.history.slice(-2)).toEqual([
      { week: "2026-W42", met: false, frozen: true },
      { week: "2026-W43", met: false, frozen: false },
    ]);
    expect(s.current).toBe(0);
    expect(s.best).toBe(2);
  });

  test("a new month brings a new freeze (month rollover)", () => {
    // W43 (Oct) missed -> October's freeze. W45 (Nov, Thursday 5 Nov) missed -> November's freeze.
    const s = computeStreak({
      firstWeek: "2026-W41",
      currentWeek: "2026-W47",
      isMet: metSet(["2026-W41", "2026-W42", "2026-W44", "2026-W46"]),
    });
    expect(monthOfWeek("2026-W45")).toBe("2026-11");
    expect(s.history.filter((h) => h.frozen).map((h) => h.week)).toEqual(["2026-W43", "2026-W45"]);
    expect(s.current).toBe(4);
    expect(s.freezeMonth).toBe("2026-11");
    expect(s.freezesLeft).toBe(0);
  });

  test("freezes don't pile up, and none is spent on a streak of 0", () => {
    const s = computeStreak({ firstWeek: "2026-W30", currentWeek: "2026-W41", isMet: metSet(["2026-W40"]) });
    expect(s.history.some((h) => h.frozen)).toBe(false);
    expect(s.freezesLeft).toBe(1);
    expect(s.current).toBe(1);
  });

  test("best survives a broken streak", () => {
    const s = computeStreak({ firstWeek: "2026-W30", currentWeek: "2026-W41", isMet: metSet(["2026-W30", "2026-W31", "2026-W32", "2026-W40"]) });
    expect(s.best).toBe(3);
    expect(s.current).toBe(1);
  });

  test("a first week after the current week is clamped, and very old history is capped", () => {
    expect(computeStreak({ firstWeek: "2027-W01", currentWeek: "2026-W41", isMet: () => true }).current).toBe(1);
    const long = computeStreak({ firstWeek: "2000-W01", currentWeek: "2026-W41", isMet: () => true });
    expect(long.current).toBe(261);
    expect(long.history.length).toBe(26);
  });
});
