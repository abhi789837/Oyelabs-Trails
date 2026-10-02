import { describe, expect, it } from "vitest";

import { aboutMinutes, clockOrDash, estMinutes, finishedLine, formatCostMicros } from "./timing";

describe("timing display", () => {
  it("rounds the designed length to whole minutes", () => {
    expect(aboutMinutes(29 * 60 + 20)).toBe("About 29 minutes");
    expect(aboutMinutes(40)).toBe("About 1 minute");
    expect(aboutMinutes(0)).toBeNull();
    expect(aboutMinutes(null)).toBeNull();
    expect(estMinutes(1740)).toBe("est. 29 min");
  });

  it("says how long it took against the estimate", () => {
    expect(finishedLine(31 * 60 + 40, 29 * 60)).toBe("Finished in 31:40 (est. 29:00)");
    expect(finishedLine(65, null)).toBe("Finished in 1:05");
    expect(finishedLine(null, 1740)).toBeNull();
    expect(clockOrDash(undefined)).toBe("—");
    expect(clockOrDash(75)).toBe("1:15");
  });

  it("formats micro-dollars", () => {
    expect(formatCostMicros(31_000)).toBe("$0.03");
    expect(formatCostMicros(4_200)).toBe("$0.0042");
    expect(formatCostMicros(0)).toBe("$0.00");
    expect(formatCostMicros(undefined)).toBe("$0.00");
    expect(formatCostMicros(12_345_678)).toBe("$12.35");
  });
});
