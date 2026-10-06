import { describe, expect, test } from "vitest";

import { announcementInputSchema, announcementVisibleTo, lessonHref, whyChip } from "./today";
import { WIN_KINDS, XP_KINDS, XP_LABELS, XP_TABLE, isXpKind, levelUpRef, stepRef, xpFor } from "./xp";

describe("XP table (docs/v5/PLAN.md)", () => {
  test("amounts match the plan", () => {
    expect(XP_TABLE).toEqual({
      step_completed: 10,
      quick_check_passed: 15,
      lesson_completed: 30,
      topic_test_passed: 50,
      review_session: 20,
      case_passed: 150,
      skill_level_up: 75,
      certificate: 200,
    });
    expect(xpFor("certificate")).toBe(200);
  });

  test("every kind has a plain label; wins are a subset", () => {
    for (const kind of XP_KINDS) expect(XP_LABELS[kind].length).toBeGreaterThan(3);
    for (const kind of WIN_KINDS) expect(XP_KINDS).toContain(kind);
    expect(isXpKind("certificate")).toBe(true);
    expect(isXpKind("login")).toBe(false);
  });

  test("ref ids have one shape", () => {
    expect(stepRef("js-closures", "watch")).toBe("js-closures:watch");
    expect(levelUpRef("eng-sql", 3.4)).toBe("eng-sql:3");
  });
});

describe("Today helpers", () => {
  test("why chips are short and plain", () => {
    expect(whyChip("must_know", "Backend")).toBe("Must know for Backend");
    expect(whyChip("do_now", null)).toBe("Do it now");
    expect(whyChip("low", "Frontend")).toBe("Extra for Frontend");
  });

  test("lesson links carry the step and the second", () => {
    expect(lessonHref("js-closures")).toBe("/learn/lesson/js-closures");
    expect(lessonHref("js-closures", { step: "watch", t: 125.7 })).toBe("/learn/lesson/js-closures?step=watch&t=125");
    expect(lessonHref("js-closures", { step: "do", t: 0 })).toBe("/learn/lesson/js-closures?step=do");
  });

  test("announcement audience and expiry", () => {
    const viewer = { userId: "u1", departmentId: "eng" };
    expect(announcementVisibleTo({ audience: { all: true }, expiresAt: null }, viewer, 10)).toBe(true);
    expect(announcementVisibleTo({ audience: { all: true }, expiresAt: 10 }, viewer, 10)).toBe(false);
    expect(announcementVisibleTo({ audience: { departmentIds: ["eng"] }, expiresAt: null }, viewer, 10)).toBe(true);
    expect(announcementVisibleTo({ audience: { departmentIds: ["pm"] }, expiresAt: null }, viewer, 10)).toBe(false);
    expect(announcementVisibleTo({ audience: { departmentIds: ["eng"] }, expiresAt: null }, { userId: "u1", departmentId: null }, 10)).toBe(false);
    expect(announcementVisibleTo({ audience: { userIds: ["u1"] }, expiresAt: 11 }, viewer, 10)).toBe(true);
  });

  test("an announcement needs an audience", () => {
    expect(announcementInputSchema.safeParse({ title: "Hi", body: "There", audience: {} }).success).toBe(false);
    expect(announcementInputSchema.safeParse({ title: "Hi", body: "There", audience: { departmentIds: [] } }).success).toBe(false);
    const ok = announcementInputSchema.parse({ title: " Hi ", body: "There", audience: { all: true } });
    expect(ok).toMatchObject({ title: "Hi", pinned: true, expiresAt: null });
  });
});
