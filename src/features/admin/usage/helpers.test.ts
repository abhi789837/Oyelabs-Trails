import { describe, expect, it } from "vitest";

import { budgetTone, fillDays, formatUsd, taskLabel } from "./helpers";

describe("formatUsd", () => {
  it("uses four decimals under a cent and two otherwise", () => {
    expect(formatUsd(0.0042)).toBe("$0.0042");
    expect(formatUsd(0.00001)).toBe("$0.0000");
    expect(formatUsd(0.01)).toBe("$0.01");
    expect(formatUsd(12.345)).toBe("$12.35");
    expect(formatUsd(1234.5)).toBe("$1,234.50");
  });

  it("shows zero and junk as $0.00", () => {
    expect(formatUsd(0)).toBe("$0.00");
    expect(formatUsd(Number.NaN)).toBe("$0.00");
  });
});

describe("budgetTone", () => {
  it("is amber from 80% and red from 100%", () => {
    expect(budgetTone(null)).toBe("none");
    expect(budgetTone(0.79)).toBe("ok");
    expect(budgetTone(0.8)).toBe("warn");
    expect(budgetTone(1)).toBe("over");
    expect(budgetTone(1.4)).toBe("over");
  });
});

describe("fillDays", () => {
  it("fills every day in the window, oldest first", () => {
    const today = new Date(2026, 9, 2);
    const result = fillDays([{ day: "2026-10-01", usd: 1.5, calls: 3 }], 3, today);
    expect(result.map((d) => d.day)).toEqual(["2026-09-30", "2026-10-01", "2026-10-02"]);
    expect(result.map((d) => d.usd)).toEqual([0, 1.5, 0]);
  });
});

describe("taskLabel", () => {
  it("labels known tasks and falls back for purposes", () => {
    expect(taskLabel("bank_fill")).toBe("Filling gaps in the question bank");
    expect(taskLabel("gap_analysis")).toBe("gap analysis");
  });
});
