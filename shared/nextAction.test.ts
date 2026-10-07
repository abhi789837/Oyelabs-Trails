import { describe, expect, test } from "vitest";

import { nextAction, staleReason, testStatusLabel, type NextActionFacts } from "./nextAction";

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
    expect(at({ assessment: null })).toMatchObject({ kind: "assign", title: "Plan ready · send the test", button: { action: "assign" } });
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
    expect(at({ assessment: { status: "ready" }, mustChangePassword: true })).toMatchObject({ kind: "invite", title: "Test sent · waiting for them to sign in", button: { action: "invite" } });
    expect(at({ assessment: { status: "ready" } })).toMatchObject({ kind: "waiting", button: null });
  });

  test("evaluated: build when there is no path, review while it builds, rebuild after a failure", () => {
    expect(at({ path: null })).toMatchObject({ kind: "build", button: { action: "build", label: "Build the path" } });
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
    expect(at({ setupChangedAt: 300 })).toMatchObject({ kind: "rebuild", button: { action: "build", label: "Rebuild the path" } });
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

describe("v4.4 P6: plain status lines and the new kinds", () => {
  test("names the learner while the test waits", () => {
    expect(at({ assessment: { status: "ready" }, name: "Rahul Verma" }).title).toBe("Test sent · waiting for Rahul");
    expect(at({ assessment: { status: "ready" } }).title).toBe("Test sent · waiting for them");
    expect(at({ path: null }).title).toBe("Test done · plan ready");
  });

  test("a spoken answer that needs a listen comes before the path, even while marking", () => {
    expect(at({ speakToListen: 1 })).toMatchObject({ kind: "listen", title: "Needs a listen: 1 spoken answer", button: { action: "open", tab: "assessment", anchor: "needs-listen" } });
    expect(at({ assessment: { status: "evaluating" }, speakToListen: 2 }).title).toBe("Needs a listen: 2 spoken answers");
    expect(at({ path: null, speakToListen: 1 }).kind).toBe("listen");
  });

  test("open review requests come next", () => {
    expect(at({ openReviews: 2, name: "Rahul" })).toMatchObject({ kind: "reviews", title: "Rahul asked us to check 2 answers again", button: { anchor: "review-requests" } });
  });

  test("new courses being created, or waiting for setup with a Set it up button (v4.5: says Test done)", () => {
    expect(at({ courses: { creating: 2, waitingSetup: 0, problem: null } })).toMatchObject({ kind: "courses-creating", title: "Test done · 2 courses being created (about 6 min)", tone: "waiting", button: null });
    expect(at({ courses: { creating: 1, waitingSetup: 1, problem: "the web search isn't set up" } })).toMatchObject({
      kind: "courses-waiting",
      tone: "blocked",
      title: "Test done · 1 new course blocked: the web search isn't set up. We'll finish it on our own after it's set up.",
      button: { action: "link", label: "Set it up", to: "/admin/ai" },
    });
    expect(at({ courses: { creating: 0, waitingSetup: 0, problem: null } }).kind).toBe("on-track");
  });

  test("v4.5: each connection problem has its own line, and a failed course points at Retry", () => {
    const waiting = (problem: string) => at({ courses: { creating: 0, waitingSetup: 2, problem } });
    expect(waiting("the web search key was rejected").title).toBe("Test done · 2 new courses blocked: the web search key was rejected. We'll finish them on our own after the key is fixed.");
    expect(waiting("the web search key was rejected").button).toMatchObject({ label: "Check the connection" });
    expect(waiting("the web search has used up its quota").title).toBe("Test done · 2 new courses blocked: the web search has used up its quota. We'll finish them on our own when the quota resets or is raised.");
    // An old stored line still reads as "not set up".
    expect(waiting("the web search isn't connected").title).toContain("after it's set up");
    expect(at({ courses: { creating: 0, waitingSetup: 0, problem: null, failed: 1, failedProblem: "our server can't reach the web search" } })).toMatchObject({
      kind: "courses-failed",
      tone: "blocked",
      title: "Test done · 1 new course couldn't be made. Failed: our server can't reach the web search.",
      button: { action: "open", tab: "path" },
    });
  });

  test("v4.5: the header never says Completed while a course is blocked or being made", () => {
    expect(testStatusLabel("completed", { creating: 1, waitingSetup: 0, problem: null })).toBe("Test done · 1 course being created");
    expect(testStatusLabel("completed", { creating: 0, waitingSetup: 1, problem: "x" })).toBe("Test done · 1 course blocked");
    expect(testStatusLabel("completed", { creating: 0, waitingSetup: 0, problem: null, failed: 2 })).toBe("Test done · 2 courses failed");
    expect(testStatusLabel("completed", { creating: 0, waitingSetup: 0, problem: null })).toBe("Test done");
    expect(testStatusLabel("in_progress", null)).toBeNull();
  });
});
