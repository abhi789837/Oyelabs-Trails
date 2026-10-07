import { describe, expect, test } from "vitest";

import { afterFixWords, connectedLine, failedLine, isBlockingProblem, problemLine, stateOfLine, CONNECTION_PROBLEMS } from "./connection";

describe("v4.5 P0: one plain line per state, never a generic 'not connected'", () => {
  test("every state of the web search has its own words", () => {
    const lines = CONNECTION_PROBLEMS.map((state) => problemLine("search", state));
    expect(lines).toEqual([
      "the web search isn't set up",
      "the web search key was rejected",
      "the web search has used up its quota",
      "our server can't reach the web search",
      "the web search had a temporary error",
    ]);
    expect(new Set(lines).size).toBe(lines.length);
    expect(lines.some((line) => /not connected|isn't connected/.test(line))).toBe(false);
  });

  test("a stored line maps back to its state; old lines read as not set up; other text is a real failure", () => {
    for (const state of CONNECTION_PROBLEMS) expect(stateOfLine(problemLine("search", state))).toBe(state);
    expect(stateOfLine("the AI isn't connected")).toBe("not_set_up");
    expect(stateOfLine("the web search isn't connected")).toBe("not_set_up");
    expect(stateOfLine("Could not plan the course: boom")).toBeNull();
    expect(stateOfLine(null)).toBeNull();
  });

  test("blocking vs retried, and what happens next", () => {
    expect(["not_set_up", "key_rejected", "quota"].every((s) => isBlockingProblem(s as never))).toBe(true);
    expect(isBlockingProblem("unreachable")).toBe(false);
    expect(isBlockingProblem("temporary")).toBe(false);
    expect(afterFixWords("key_rejected")).toBe("after the key is fixed");
    expect(afterFixWords(null)).toBe("after it's set up");
    expect(failedLine("our server can't reach the web search")).toBe("Failed: our server can't reach the web search");
    expect(failedLine(null)).toBe("Failed: something went wrong while making it");
    expect(connectedLine(5)).toBe("Connected ✓ — test search returned 5 results");
    expect(connectedLine(1)).toBe("Connected ✓ — test search returned 1 result");
  });
});
