import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { celebrate, refreshMotivation, subscribeMotivation, type MotivationCommand } from "./celebrate";
import { claimOnce, digestEvents, freezeNotice, goalLabel, readOnce, toPending } from "./logic";

const ev = (kind: string, refId: string, xp: number) => ({ kind, refId, xp, createdAt: 1 });

describe("new XP awards", () => {
  test("adds up the XP and shows one moment, the biggest", () => {
    const seen = new Set<string>();
    const celebrated = new Set<string>();
    const d = digestEvents([ev("step_completed", "t:read", 10), ev("lesson_completed", "t", 30), ev("skill_level_up", "js:3", 75)], seen, celebrated);
    expect(d.gained).toBe(115);
    expect(d.celebration).toMatchObject({ kind: "level_up", title: "Skill level up", detail: "+115 XP", durationMs: 1600 });
    // The same events again count for nothing.
    const again = digestEvents([ev("lesson_completed", "t", 30)], seen, celebrated);
    expect(again).toEqual({ gained: 0, celebration: null });
  });

  test("steps and reviews only bring the XP chip", () => {
    const d = digestEvents([ev("step_completed", "t:watch", 10), ev("review_session", "s1", 20)], new Set(), new Set());
    expect(d).toEqual({ gained: 30, celebration: null });
  });

  test("a win already celebrated by a screen isn't celebrated again", () => {
    const celebrated = new Set(["lesson:topic-1"]);
    const d = digestEvents([ev("lesson_completed", "topic-1", 30)], new Set(), celebrated);
    expect(d.gained).toBe(30);
    expect(d.celebration).toBeNull();
  });

  test("a kind another screen shows itself is skipped, and not shown later either", () => {
    const seen = new Set<string>();
    const celebrated = new Set<string>();
    const d = digestEvents([ev("lesson_completed", "t2", 30)], seen, celebrated, new Set(["lesson"]));
    expect(d).toEqual({ gained: 30, celebration: null });
    expect(celebrated.has("lesson:t2")).toBe(true);
  });

  test("explicit calls get the kind's defaults", () => {
    expect(toPending("certificate", { ref: "C1" }, "x")).toMatchObject({ key: "certificate:C1", title: "Certificate earned", durationMs: 2000, confetti: true });
    expect(toPending("lesson", { title: "Nice", detail: "+30 XP" }, "fallback")).toMatchObject({ key: "fallback", title: "Nice", confetti: false });
  });
});

describe("celebrate() API", () => {
  test("calls made before the host loads wait for it", () => {
    celebrate("lesson", { ref: "a" });
    refreshMotivation();
    const got: MotivationCommand[] = [];
    const stop = subscribeMotivation((c) => got.push(c));
    expect(got.map((c) => c.type)).toEqual(["celebrate", "refresh"]);
    celebrate("certificate", { ref: "c" });
    expect(got).toHaveLength(3);
    stop();
  });
});

describe("once per browser", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", { localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) } });
  });
  afterEach(() => vi.unstubAllGlobals());
  test("a key is claimed once", () => {
    expect(claimOnce("summit:2026-W41")).toBe(true);
    expect(claimOnce("summit:2026-W41")).toBe(false);
    expect(readOnce()).toContain("summit:2026-W41");
  });
  test("without storage it still stops a repeat in this session", () => {
    vi.stubGlobal("window", { localStorage: { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } } });
    expect(claimOnce("summit:2026-W42")).toBe(true);
    expect(claimOnce("summit:2026-W42")).toBe(false);
  });
});

describe("streak words", () => {
  test("a frozen last week says the streak is safe", () => {
    const history = [
      { week: "2026-W39", met: true, frozen: false },
      { week: "2026-W40", met: false, frozen: true },
    ];
    expect(freezeNotice(history, "2026-W41")).toBe("Freeze used — your streak is safe.");
    expect(freezeNotice([...history, { week: "2026-W41", met: true, frozen: false }], "2026-W41")).toBe("Freeze used — your streak is safe.");
    expect(freezeNotice([{ week: "2026-W40", met: true, frozen: false }], "2026-W41")).toBeNull();
    expect(freezeNotice([], "2026-W41")).toBeNull();
  });

  test("goal labels", () => {
    expect(goalLabel(null)).toBe("No hours goal (3 steps a week)");
    expect(goalLabel(1)).toBe("1 hour a week");
    expect(goalLabel(4)).toBe("4 hours a week");
    // Phase 9.2: with no goal of their own, the plan's pace is named, so it agrees with Today's ring.
    expect(goalLabel(null, 900)).toBe("Your plan's pace (15 hours a week)");
    expect(goalLabel(null, 90)).toBe("Your plan's pace (1.5 hours a week)");
    expect(goalLabel(null, 0)).toBe("No hours goal (3 steps a week)");
    expect(goalLabel(3, 900)).toBe("3 hours a week");
  });
});
