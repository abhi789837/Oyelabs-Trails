import { describe, expect, test } from "vitest";

import { chipState, clockView, countStates, formatClock, isTypingTarget, sameResponse, skewMs } from "./clock";

const MIN = 60_000;

describe("the v4 clock", () => {
  test("formats elapsed time", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(28 * MIN + 10_000)).toBe("28:10");
    expect(formatClock(50 * MIN)).toBe("50:00");
    expect(formatClock(-5)).toBe("00:00");
    expect(formatClock(61 * MIN + 5000)).toBe("1:01:05");
  });

  test("counts up from the start and corrects for the server's clock", () => {
    const startedAt = 1_000_000;
    const deadlineAt = startedAt + 50 * MIN;
    // The client clock runs 30 s behind the server.
    const skew = skewMs(startedAt + 10 * MIN, startedAt + 10 * MIN - 30_000);
    expect(skew).toBe(30_000);
    const view = clockView(startedAt + 10 * MIN - 30_000, skew, startedAt, deadlineAt);
    expect(view.elapsedLabel).toBe("10:00");
    expect(view.endsAtLabel).toBe("50:00");
    expect(view.short).toBe(false);
  });

  test("turns short in the last five minutes and over at the deadline", () => {
    const startedAt = 0;
    const deadlineAt = 50 * MIN;
    expect(clockView(45 * MIN - 1000, 0, startedAt, deadlineAt).short).toBe(false);
    expect(clockView(45 * MIN + 1000, 0, startedAt, deadlineAt).short).toBe(true);
    const over = clockView(51 * MIN, 0, startedAt, deadlineAt);
    expect(over.over).toBe(true);
    expect(over.short).toBe(false);
    expect(over.elapsedLabel).toBe("50:00");
  });

  test("an extended deadline moves 'ends at'", () => {
    expect(clockView(0, 0, 0, 51 * MIN + 30_000).endsAtLabel).toBe("51:30");
  });
});

describe("the navigator", () => {
  test("chip states", () => {
    expect(chipState({ state: "submitted" }, { code: "x" })).toBe("submitted");
    expect(chipState({ state: "unanswered" }, null)).toBe("unanswered");
    expect(chipState({ state: "answered" }, { unknown: true })).toBe("unknown");
    expect(chipState({ state: "unanswered" }, { choice: 2 })).toBe("answered");
  });

  test("counts", () => {
    expect(countStates(["answered", "unknown", "unanswered", "submitted", "answered"], [true, false, true, false, false])).toEqual({
      answered: 2,
      unknown: 1,
      unanswered: 1,
      submitted: 1,
      flagged: 2,
    });
  });

  test("shortcuts never fire while typing", () => {
    expect(isTypingTarget({ tagName: "TEXTAREA" })).toBe(true);
    expect(isTypingTarget({ tagName: "INPUT", type: "text" })).toBe(true);
    expect(isTypingTarget({ tagName: "INPUT", type: "radio" })).toBe(false);
    expect(isTypingTarget({ tagName: "DIV", isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: "DIV", closest: (s: string) => (s === ".monaco-editor" ? {} : null) })).toBe(true);
    expect(isTypingTarget({ tagName: "BUTTON", closest: () => null })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });

  test("responses compare by value", () => {
    expect(sameResponse({ code: "a" }, { code: "a" })).toBe(true);
    expect(sameResponse({ code: "a" }, null)).toBe(false);
  });
});
