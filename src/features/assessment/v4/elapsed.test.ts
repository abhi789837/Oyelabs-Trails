import { describe, expect, it } from "vitest";

import { ElapsedClock, MAX_ELAPSED_PER_SAVE } from "./elapsed";

describe("ElapsedClock", () => {
  it("counts only while an item is focused", () => {
    const clock = new ElapsedClock();
    clock.focus("a", 1_000);
    clock.focus(null, 6_000); // tab hidden
    clock.focus("a", 20_000); // back
    expect(clock.take("a", 23_000)).toBe(8_000);
    expect(clock.take("a", 23_000)).toBe(0);
  });

  it("keeps items apart when the learner moves between them", () => {
    const clock = new ElapsedClock();
    clock.focus("a", 0);
    clock.focus("b", 4_000);
    clock.focus("a", 10_000);
    expect(clock.take("b", 12_000)).toBe(6_000);
    expect(clock.take("a", 12_000)).toBe(6_000);
  });

  it("keeps running after a take on the visible item", () => {
    const clock = new ElapsedClock();
    clock.focus("a", 0);
    expect(clock.take("a", 5_000)).toBe(5_000);
    expect(clock.take("a", 7_500)).toBe(2_500);
  });

  it("caps one save and banks the rest for the next", () => {
    const clock = new ElapsedClock();
    clock.focus("a", 0);
    clock.focus(null, 300_000);
    expect(clock.take("a", 300_000)).toBe(MAX_ELAPSED_PER_SAVE);
    expect(clock.take("a", 300_000)).toBe(MAX_ELAPSED_PER_SAVE);
    expect(clock.take("a", 300_000)).toBe(60_000);
  });

  it("gives time back after a failed save", () => {
    const clock = new ElapsedClock();
    clock.focus("a", 0);
    const ms = clock.take("a", 3_000);
    clock.give("a", ms);
    expect(clock.peek("a", 3_000)).toBe(3_000);
    expect(clock.pending(3_000)).toEqual(["a"]);
  });

  it("ignores a clock going backwards", () => {
    const clock = new ElapsedClock();
    clock.focus("a", 10_000);
    expect(clock.take("a", 5_000)).toBe(0);
  });
});
