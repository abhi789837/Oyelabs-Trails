import { describe, expect, it } from "vitest";

import { formatMinFinish, parseMinFinish } from "./assessmentSettings";

describe("parseMinFinish", () => {
  it("treats empty and 0 as off", () => {
    expect(parseMinFinish("")).toEqual({ value: null });
    expect(parseMinFinish("  ")).toEqual({ value: null });
    expect(parseMinFinish("0")).toEqual({ value: null });
  });

  it("accepts whole minutes up to 45", () => {
    expect(parseMinFinish("20")).toEqual({ value: 20 });
    expect(parseMinFinish(" 45 ")).toEqual({ value: 45 });
  });

  it("rejects fractions, negatives, words and anything over 45", () => {
    expect(parseMinFinish("2.5")).toHaveProperty("error");
    expect(parseMinFinish("-3")).toHaveProperty("error");
    expect(parseMinFinish("ten")).toHaveProperty("error");
    expect(parseMinFinish("46")).toHaveProperty("error");
  });
});

describe("formatMinFinish", () => {
  it("shows off as an empty field", () => {
    expect(formatMinFinish(null)).toBe("");
    expect(formatMinFinish(0)).toBe("");
    expect(formatMinFinish(15)).toBe("15");
  });
});
