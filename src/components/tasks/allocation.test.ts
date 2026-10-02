import { describe, expect, it } from "vitest";

import { allocationTotals, allocKey, isBlocked, parseHours, setHours } from "./allocation";

const task = {
  people: [
    { id: "a", name: "Ann", capacity: 40, note: "" },
    { id: "b", name: "Bo", capacity: 20, note: "On leave Friday" },
  ],
  projects: [
    { id: "p1", name: "Laravel portal", need: 30 },
    { id: "p2", name: "React app", need: 25 },
  ],
  slack: 0.1,
  blocked: [{ person: "b", project: "p1" }],
};

describe("allocation totals", () => {
  it("sums rows against capacity and columns against need", () => {
    const t = allocationTotals(task, { "a:p1": 30, "a:p2": 5, "b:p2": 20 });
    expect(t.people).toEqual([
      { id: "a", sum: 35, capacity: 40, over: false },
      { id: "b", sum: 20, capacity: 20, over: false },
    ]);
    expect(t.projects.map((p) => p.state)).toEqual(["covered", "covered"]);
  });

  it("flags over-capacity people, short and over-staffed projects", () => {
    const t = allocationTotals(task, { "a:p1": 45, "b:p2": 10 });
    expect(t.people[0].over).toBe(true);
    expect(t.projects[0].state).toBe("over");
    expect(t.projects[1].state).toBe("short");
  });

  it("counts the slack as covered and ignores junk values", () => {
    const t = allocationTotals(task, { "a:p1": 33, "a:p2": Number.NaN, "b:p2": -4 });
    expect(t.projects[0].state).toBe("covered");
    expect(t.projects[1].sum).toBe(0);
  });

  it("an empty plan: every project short, nobody over", () => {
    const t = allocationTotals(task, {});
    expect(t.people.every((p) => !p.over && p.sum === 0)).toBe(true);
    expect(t.projects.every((p) => p.state === "short")).toBe(true);
  });
});

describe("allocation cells", () => {
  it("keys and blocked pairs", () => {
    expect(allocKey("a", "p1")).toBe("a:p1");
    expect(isBlocked(task, "b", "p1")).toBe(true);
    expect(isBlocked(task, "a", "p1")).toBe(false);
  });

  it("parses hours", () => {
    expect(parseHours("12")).toBe(12);
    expect(parseHours("7.5")).toBe(7.5);
    expect(parseHours("7,5")).toBe(7.5);
    expect(parseHours("")).toBeNull();
    expect(parseHours("-3")).toBeUndefined();
    expect(parseHours("abc")).toBeUndefined();
    expect(parseHours("999")).toBe(200);
  });

  it("drops zeros and blanks", () => {
    expect(setHours({ "a:p1": 5 }, "a:p1", 0)).toEqual({});
    expect(setHours({ "a:p1": 5 }, "a:p1", null)).toEqual({});
    expect(setHours({}, "a:p2", 8)).toEqual({ "a:p2": 8 });
  });
});
