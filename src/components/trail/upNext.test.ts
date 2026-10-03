import { describe, expect, it } from "vitest";

import { initialUpNext, nextIndexAfter, UP_NEXT_SECONDS, upNextReducer, type UpNextEvent, type UpNextState } from "./upNext";

const run = (events: UpNextEvent[], start: UpNextState = initialUpNext) => events.reduce(upNextReducer, start);

describe("up next countdown", () => {
  it("counts down from 5 and then advances", () => {
    let state = run([{ type: "ended", nextIndex: 1, autoplay: true }]);
    expect(state).toEqual({ phase: "counting", nextIndex: 1, secondsLeft: UP_NEXT_SECONDS });
    state = run(Array.from({ length: UP_NEXT_SECONDS - 1 }, () => ({ type: "tick" }) as const), state);
    expect(state).toEqual({ phase: "counting", nextIndex: 1, secondsLeft: 1 });
    expect(upNextReducer(state, { type: "tick" })).toEqual({ phase: "advance", nextIndex: 1 });
  });

  it("Play now advances at once; Cancel stops it", () => {
    const counting = run([{ type: "ended", nextIndex: 2, autoplay: true }, { type: "tick" }]);
    expect(upNextReducer(counting, { type: "playNow" })).toEqual({ phase: "advance", nextIndex: 2 });
    expect(upNextReducer(counting, { type: "cancel" })).toEqual({ phase: "idle" });
    // A tick after cancelling does nothing.
    expect(run([{ type: "cancel" }, { type: "tick" }], counting)).toEqual({ phase: "idle" });
  });

  it("with autoplay off it waits for Play now", () => {
    const waiting = run([{ type: "ended", nextIndex: 1, autoplay: false }]);
    expect(waiting).toEqual({ phase: "waiting", nextIndex: 1 });
    expect(upNextReducer(waiting, { type: "tick" })).toBe(waiting);
    expect(upNextReducer(waiting, { type: "playNow" })).toEqual({ phase: "advance", nextIndex: 1 });
  });

  it("shows nothing after the last video", () => {
    expect(run([{ type: "ended", nextIndex: null, autoplay: true }])).toEqual({ phase: "idle" });
  });
});

describe("next video", () => {
  it("prefers the next unwatched video and skips unavailable ones", () => {
    const items = [{ status: "watched" }, { status: "watched" }, { status: "unavailable" }, { status: "not-started" }];
    expect(nextIndexAfter(0, items)).toBe(3);
    expect(nextIndexAfter(3, items)).toBeNull();
    expect(nextIndexAfter(0, [{ status: "in-progress" }, { status: "watched" }])).toBe(1);
  });
});
