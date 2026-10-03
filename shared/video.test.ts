import { describe, expect, it } from "vitest";

import {
  addPlayedInterval,
  formatClock,
  isWatched,
  mergeRanges,
  OPEN_CHAPTER_CAP_SEC,
  parseDurationLabel,
  parseIsoDuration,
  requiredSeconds,
  resumePosition,
  segmentFor,
  topicVideoStatus,
  watchedSeconds,
  type Range,
} from "./video";

/** Plays [start, end) in 5-second samples at normal speed, the way the client reports it. */
function play(ranges: Range[], start: number, end: number, step = 5): Range[] {
  let current = ranges;
  for (let t = start; t < end; t += step) {
    current = addPlayedInterval(current, { from: t, to: Math.min(end, t + step), elapsed: step }).ranges;
  }
  return current;
}

describe("mergeRanges", () => {
  it("sorts, merges overlaps and touching ranges, drops invalid ones", () => {
    expect(mergeRanges([[10, 20], [0, 5], [4, 8], [20, 25], [30, 30], [40, 35]])).toEqual([
      [0, 8],
      [10, 25],
    ]);
  });
});

describe("addPlayedInterval", () => {
  it("counts continuous playback", () => {
    const ranges = play([], 0, 60);
    expect(watchedSeconds(ranges)).toBe(60);
    expect(ranges).toEqual([[0, 60]]);
  });

  it("does not count skipping ahead (a seek), and the next sample starts a new range", () => {
    let ranges = play([], 0, 30);
    // The learner drags from 30 s to 300 s within one 5-second sample.
    const seek = addPlayedInterval(ranges, { from: 30, to: 300, elapsed: 5 });
    expect(seek.counted).toBe(false);
    ranges = seek.ranges;
    ranges = play(ranges, 300, 330);
    expect(ranges).toEqual([
      [0, 30],
      [300, 330],
    ]);
    expect(watchedSeconds(ranges)).toBe(60);
  });

  it("counts 2x playback but not more", () => {
    expect(addPlayedInterval([], { from: 0, to: 10, elapsed: 5 }).counted).toBe(true);
    expect(addPlayedInterval([], { from: 0, to: 14, elapsed: 5 }).counted).toBe(false);
  });

  it("ignores rewinds, pauses and stale samples", () => {
    expect(addPlayedInterval([], { from: 50, to: 40, elapsed: 5 }).counted).toBe(false);
    expect(addPlayedInterval([], { from: 50, to: 50, elapsed: 5 }).counted).toBe(false);
    expect(addPlayedInterval([], { from: 0, to: 5, elapsed: 600 }).counted).toBe(false);
    expect(addPlayedInterval([], { from: 0, to: 5, elapsed: 0 }).counted).toBe(false);
  });

  it("overlapping replays do not double count", () => {
    let ranges = play([], 0, 100);
    ranges = play(ranges, 50, 120);
    ranges = play(ranges, 0, 100);
    expect(watchedSeconds(ranges)).toBe(120);
  });
});

describe("the 90% rule", () => {
  it("is watched at 90% of the required span and not below", () => {
    expect(isWatched(90, 100)).toBe(true);
    expect(isWatched(89, 100)).toBe(false);
    expect(isWatched(0, null)).toBe(false);
    expect(isWatched(10, 0)).toBe(false);
  });

  it("skipping to the end does not make a video watched", () => {
    let ranges = play([], 0, 20);
    ranges = addPlayedInterval(ranges, { from: 20, to: 590, elapsed: 5 }).ranges;
    ranges = play(ranges, 590, 600);
    expect(isWatched(watchedSeconds(ranges), 600)).toBe(false);
    ranges = play(ranges, 20, 560);
    expect(isWatched(watchedSeconds(ranges), 600)).toBe(true);
  });
});

describe("chapters", () => {
  it("a chapter ends where the next chapter used in the curriculum begins", () => {
    const seg = segmentFor(600, [0, 600, 1500, 3000]);
    expect(seg).toEqual({ start: 600, end: 1500, openChapter: false });
    expect(requiredSeconds(seg, 10_000)).toBe(900);
    // Watching outside the chapter does not count towards it.
    const ranges = play(play([], 0, 600), 1500, 1800);
    expect(watchedSeconds(ranges, seg)).toBe(0);
    expect(watchedSeconds(play(ranges, 600, 1420), seg)).toBe(820);
  });

  it("an open chapter is capped, a whole video is not", () => {
    expect(requiredSeconds(segmentFor(100, [100]), 9 * 3600)).toBe(OPEN_CHAPTER_CAP_SEC);
    expect(requiredSeconds(segmentFor(undefined), 9 * 3600)).toBe(9 * 3600);
    expect(requiredSeconds(segmentFor(undefined), null)).toBeNull();
  });
});

describe("resume position", () => {
  const whole = segmentFor(undefined);
  it("resumes where the learner left off", () => {
    expect(resumePosition(123.7, whole, 600)).toBe(123);
  });
  it("starts at the beginning when nothing was watched or the video was finished", () => {
    expect(resumePosition(0, whole, 600)).toBe(0);
    expect(resumePosition(598, whole, 600)).toBe(0);
  });
  it("respects a chapter's span", () => {
    const seg = segmentFor(600, [600, 1500]);
    expect(resumePosition(50, seg, 3000)).toBe(600);
    expect(resumePosition(900, seg, 3000)).toBe(900);
    expect(resumePosition(1499, seg, 3000)).toBe(600);
  });
});

describe("durations and status", () => {
  it("parses ISO 8601 durations and labels", () => {
    expect(parseIsoDuration("PT15M33S")).toBe(933);
    expect(parseIsoDuration("PT1H2M3S")).toBe(3723);
    expect(parseIsoDuration("P1DT1S")).toBe(86_401);
    expect(parseIsoDuration("PT")).toBeNull();
    expect(parseIsoDuration("garbage")).toBeNull();
    expect(parseDurationLabel("1:32:35")).toBe(5555);
    expect(parseDurationLabel("19:11")).toBe(1151);
    expect(parseDurationLabel("about an hour")).toBeNull();
    expect(formatClock(3723)).toBe("1:02:03");
  });

  it("counts watched entries and leaves unavailable ones out", () => {
    expect(topicVideoStatus([{ status: "watched" }, { status: "in-progress" }, { status: "unavailable" }])).toEqual({
      watched: 1,
      total: 2,
      allWatched: false,
    });
    expect(topicVideoStatus([{ status: "watched" }, { status: "unavailable" }]).allWatched).toBe(true);
  });
});
