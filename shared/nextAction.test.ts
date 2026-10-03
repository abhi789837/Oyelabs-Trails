import { describe, expect, test } from "vitest";

import { nextAction, staleReason, type NextActionFacts } from "./nextAction";

const base: NextActionFacts = {
  role: "learner",
  status: "active",
  mustChangePassword: false,
  hasGoals: true,
  assessment: { status: "completed" },
  evaluationAt: 100,
  path: { status: "ready", createdAt: 200, needsReview: 0 },
  setupChangedAt: 50,
  graphChangedAt: null,
  openSuggestions: 0,
  week: { weekNumber: 2, endDate: "2026-10-10" },
  today: "2026-10-03",
};

const at = (patch: Partial<NextActionFacts>) => nextAction({ ...base, ...patch });

describe("nextAction", () => {
  test("staff accounts get nothing", () => {
    expect(at({ role: "admin" })).toMatchObject({ kind: "staff", button: null });
  });

  test("a disabled or archived account comes first, whatever else is pending", () => {
    expect(at({ status: "disabled", assessment: null })).toMatchObject({ kind: "enable", button: { action: "enable", label: "Enable account" } });
    expect(at({ status: "archived" }).button).toMatchObject({ label: "Restore account" });
  });

  test("no goals opens Setup", () => {
    expect(at({ hasGoals: false, assessment: null })).toMatchObject({ kind: "set-goals", button: { action: "open", tab: "setup" } });
  });

  test("no assessment: assign it", () => {
    expect(at({ assessment: null })).toMatchObject({ kind: "assign", title: "Assessment ready to send.", button: { action: "assign" } });
  });

  test("the assessment lifecycle", () => {
    expect(at({ assessment: { status: "generating" } })).toMatchObject({ kind: "writing", button: null });
    expect(at({ assessment: { status: "awaiting_approval" } })).toMatchObject({ kind: "approve", button: { tab: "assessment" } });
    expect(at({ assessment: { status: "failed" } })).toMatchObject({ kind: "reassign", button: { action: "assign" } });
    expect(at({ assessment: { status: "terminated" } })).toMatchObject({ kind: "reassign" });
    expect(at({ assessment: { status: "in_progress" } })).toMatchObject({ kind: "taking", button: null });
    expect(at({ assessment: { status: "submitted" } })).toMatchObject({ kind: "evaluating", button: null });
    expect(at({ assessment: { status: "evaluating" } })).toMatchObject({ kind: "evaluating" });
  });

  test("a released assessment: a new invite before first sign-in, otherwise wait", () => {
    expect(at({ assessment: { status: "ready" }, mustChangePassword: true })).toMatchObject({ kind: "invite", title: "Awaiting first sign-in.", button: { action: "invite" } });
    expect(at({ assessment: { status: "ready" } })).toMatchObject({ kind: "waiting", button: null });
  });

  test("evaluated: build when there is no path, review while it builds, rebuild after a failure", () => {
    expect(at({ path: null })).toMatchObject({ kind: "build", button: { action: "build", label: "Build path" } });
    expect(at({ path: { status: "writing", createdAt: 200, needsReview: 0 } })).toMatchObject({ kind: "review-evaluation", button: { tab: "assessment" } });
    expect(at({ path: { status: "failed", createdAt: 200, needsReview: 0 } })).toMatchObject({ kind: "build-failed", button: { action: "build" } });
    expect(at({ path: { status: "budget_reached", createdAt: 200, needsReview: 0 } }).title).toContain("budget");
  });

  test("suggestions come before a rebuild, because adding one changes the path", () => {
    const result = at({ openSuggestions: 2, setupChangedAt: 300 });
    expect(result).toMatchObject({ kind: "suggestions", title: "Review 2 suggested goals.", button: { tab: "setup", anchor: "suggested-next-heading" } });
    expect(at({ openSuggestions: 1 }).title).toBe("Review 1 suggested goal.");
  });

  test("a path older than the goals, the graph or the evaluation needs a rebuild", () => {
    expect(at({ setupChangedAt: 300 })).toMatchObject({ kind: "rebuild", button: { action: "build", label: "Rebuild path" } });
    expect(at({ graphChangedAt: 300 }).title).toContain("skill graph");
    expect(at({ evaluationAt: 300 }).title).toContain("newer evaluation");
    // Equal timestamps are not stale.
    expect(at({ setupChangedAt: 200 }).kind).not.toBe("rebuild");
  });

  test("draft courses, then the week", () => {
    expect(at({ path: { status: "ready", createdAt: 200, needsReview: 1 } })).toMatchObject({ kind: "review-courses", button: { tab: "path" } });
    expect(at({ week: null })).toMatchObject({ kind: "publish-week", button: { action: "week", label: "Publish week" } });
    expect(at({ week: { weekNumber: 3, endDate: "2026-10-01" } })).toMatchObject({ kind: "next-week", button: { action: "advance-week" } });
  });

  test("nothing to do", () => {
    expect(at({})).toMatchObject({ kind: "on-track", tone: "done", button: null, title: "On track. Week 2 in progress." });
  });

  test("every action that has a button names it, and no state has more than one", () => {
    const states: Partial<NextActionFacts>[] = [{ assessment: null }, { status: "disabled" }, { path: null }, { week: null }, { openSuggestions: 3 }];
    for (const s of states) {
      const a = at(s);
      expect(a.button?.label.length).toBeGreaterThan(0);
      expect(a.title.length).toBeLessThanOrEqual(90);
    }
  });
});

describe("staleReason", () => {
  test("no path is never stale", () => {
    expect(staleReason({ path: null, setupChangedAt: 999, graphChangedAt: 999, evaluationAt: 999 })).toBeNull();
  });
});
