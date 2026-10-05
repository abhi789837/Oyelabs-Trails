import { describe, expect, it } from "vitest";

import { computeMetrics, countFillers, longestPause, normaliseWord, pauseGaps, wordsPerMinute, type TimedWord } from "./metrics";

/** Words spaced `step` seconds apart, each `len` long. */
function evenly(text: string, step = 0.4, len = 0.3, offset = 0): TimedWord[] {
  return text.split(" ").map((w, i) => ({ w, start: offset + i * step, end: offset + i * step + len }));
}

describe("speech metrics", () => {
  it("measures wpm from the first word to the last, not the whole recording", () => {
    // 10 words, first starts at 5 s, last ends at 5 + 9*0.4 + 0.3 = 8.9 s → 3.9 s span.
    const words = evenly("one two three four five six seven eight nine ten", 0.4, 0.3, 5);
    expect(wordsPerMinute(words)).toBe(Math.round((10 / 3.9) * 60));
  });

  it("returns 0 wpm for fewer than two words or a zero span", () => {
    expect(wordsPerMinute([])).toBe(0);
    expect(wordsPerMinute([{ w: "hi", start: 1, end: 1.2 }])).toBe(0);
    expect(wordsPerMinute([{ w: "a", start: 1, end: 1 }, { w: "b", start: 1, end: 1 }])).toBe(0);
  });

  it("counts gaps of one second or more as pauses, and finds the longest", () => {
    const words: TimedWord[] = [
      { w: "So", start: 0, end: 0.3 },
      { w: "first", start: 0.5, end: 0.9 },
      { w: "we", start: 1.9, end: 2.0 }, // 1.0 s gap: counts
      { w: "ship", start: 2.1, end: 2.4 },
      { w: "it.", start: 5.0, end: 5.3 }, // 2.6 s gap
    ];
    expect(pauseGaps(words)).toEqual([1, 2.6]);
    expect(longestPause(words)).toBe(2.6);
  });

  it("ignores malformed and empty words and unsorted input", () => {
    const words: TimedWord[] = [
      { w: "later", start: 3, end: 3.2 },
      { w: "", start: 1, end: 1.1 },
      { w: "...", start: 1.2, end: 1.3 },
      { w: "bad", start: 2, end: 1 },
      { w: "now", start: 0, end: 0.2 },
    ];
    expect(pauseGaps(words)).toEqual([2.8]);
  });

  it("counts fillers approximately, including 'you know', ignoring case and punctuation", () => {
    expect(countFillers("Um, so, like, we basically, uh, you know, ship it. Actually, er, yes.")).toBe(7);
    expect(countFillers("You know the answer.")).toBe(1);
    expect(countFillers("")).toBe(0);
    expect(countFillers("I know you")).toBe(0);
  });

  it("normalises words", () => {
    expect(normaliseWord(" Um,")).toBe("um");
    expect(normaliseWord("don't")).toBe("don't");
    expect(normaliseWord("'quoted'")).toBe("quoted");
  });

  it("combines everything, falling back to the transcript for fillers when there are no words", () => {
    const words = evenly("um we will ship on friday", 0.4, 0.3);
    expect(computeMetrics(words)).toEqual({ wpm: Math.round((6 / 2.3) * 60), pauses: 0, longestPauseSec: 0.1, fillers: 1 });
    expect(computeMetrics([], "uh like this")).toEqual({ wpm: 0, pauses: 0, longestPauseSec: 0, fillers: 2 });
  });
});

describe("pause rounding", () => {
  it("never reports a longest pause of 1.0 s with zero pauses", () => {
    const words: TimedWord[] = [
      { w: "a", start: 0, end: 0.5 },
      { w: "b", start: 1.46, end: 1.8 }, // 0.96 s gap, shown as 1.0
    ];
    expect(longestPause(words)).toBe(1);
    expect(pauseGaps(words)).toEqual([1]);
  });
});
