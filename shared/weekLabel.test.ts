import { describe, expect, test } from "vitest";

import { isoWeekKey, mondayOf } from "./streak";
import { weekOfLabel, weekStartLabel } from "./weekLabel";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

describe("weekStartLabel", () => {
  test("names the Monday the ISO week starts on", () => {
    expect(weekStartLabel("2026-W41")).toBe("5 Oct");
    expect(weekStartLabel("2026-W40")).toBe("28 Sep");
  });
  test("week 1 can start in the previous year", () => {
    expect(weekStartLabel("2026-W01")).toBe("29 Dec");
  });
  test("agrees with the streak's week keys", () => {
    for (const day of [Date.UTC(2025, 0, 1), Date.UTC(2026, 5, 17), Date.UTC(2027, 11, 31)]) {
      const monday = new Date(mondayOf(day));
      const expected = `${monday.getUTCDate()} ${MONTHS[monday.getUTCMonth()]}`;
      expect(weekStartLabel(isoWeekKey(day))).toBe(expected);
    }
  });
  test("leaves anything else alone", () => {
    expect(weekStartLabel("W41")).toBe("W41");
    expect(weekOfLabel("nope")).toBe("nope");
    expect(weekOfLabel("2026-W41")).toBe("Week of 5 Oct");
  });
});
