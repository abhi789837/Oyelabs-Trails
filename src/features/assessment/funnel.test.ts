import { describe, expect, it } from "vitest";

import type { AssessmentStatus } from "@shared/enums";

import {
  describeAssessmentBanner,
  isPendingAssessment,
  isTransientAssessment,
  PENDING_ASSESSMENT_STATUSES,
} from "./funnel";

/**
 * The banner is the fix for a live report: an approved assessment was invisible to a learner who
 * already had a plan, because only `/plan` knew about the funnel. What it says, and — more
 * importantly — when it refuses to go away, is decided here.
 */

const at = (status: AssessmentStatus, timeLimitMinutes = 60) => ({ status, timeLimitMinutes });

describe("isPendingAssessment", () => {
  it("covers every status where a learner is mid-funnel", () => {
    expect([...PENDING_ASSESSMENT_STATUSES].sort()).toEqual(
      ["awaiting_approval", "evaluating", "generating", "in_progress", "ready", "submitted"].sort(),
    );
  });

  it("is false once the funnel has ended, whichever way it ended", () => {
    for (const status of ["completed", "terminated", "failed"] as AssessmentStatus[]) {
      expect(isPendingAssessment(at(status))).toBe(false);
    }
  });

  it("is false when nothing was ever issued", () => {
    expect(isPendingAssessment(null)).toBe(false);
    expect(isPendingAssessment(undefined)).toBe(false);
  });
});

describe("isTransientAssessment", () => {
  it("only polls states the server moves on its own", () => {
    expect(isTransientAssessment(at("generating"))).toBe(true);
    expect(isTransientAssessment(at("awaiting_approval"))).toBe(true);
    expect(isTransientAssessment(at("submitted"))).toBe(true);
    expect(isTransientAssessment(at("evaluating"))).toBe(true);
  });

  it("does not poll states that only the learner can change", () => {
    expect(isTransientAssessment(at("ready"))).toBe(false);
    expect(isTransientAssessment(at("in_progress"))).toBe(false);
  });
});

describe("describeAssessmentBanner", () => {
  it("says nothing when no assessment was ever issued", () => {
    expect(describeAssessmentBanner(null, "learner")).toBeNull();
  });

  it("says nothing once the assessment is finished with", () => {
    for (const status of ["completed", "terminated", "failed"] as AssessmentStatus[]) {
      expect(describeAssessmentBanner(at(status), "learner")).toBeNull();
    }
  });

  it("says nothing to a superadmin, who is not in the funnel", () => {
    expect(describeAssessmentBanner(at("ready"), "superadmin")).toBeNull();
    expect(describeAssessmentBanner(at("in_progress"), "superadmin")).toBeNull();
  });

  it("speaks for every pending status", () => {
    for (const status of PENDING_ASSESSMENT_STATUSES) {
      const copy = describeAssessmentBanner(at(status), "learner");
      expect(copy, status).not.toBeNull();
      expect(copy?.title.length, status).toBeGreaterThan(0);
      expect(copy?.body.length, status).toBeGreaterThan(0);
    }
  });

  it("refuses to be dismissed while it is a gate", () => {
    // The whole point: `ready` and `in_progress` are the two the learner must act on, so they
    // cannot be put away. Anything else is information and may be.
    for (const status of PENDING_ASSESSMENT_STATUSES) {
      const copy = describeAssessmentBanner(at(status), "learner");
      expect(copy?.dismissible, status).toBe(status !== "ready" && status !== "in_progress");
    }
  });

  it("sends ready and in_progress to the assessment itself", () => {
    expect(describeAssessmentBanner(at("ready"), "learner")?.action).toEqual({
      label: "Start the assessment",
      to: "/assessment",
    });
    expect(describeAssessmentBanner(at("in_progress"), "learner")?.action).toEqual({
      label: "Resume the assessment",
      to: "/assessment",
    });
  });

  it("treats a running clock as the most urgent state", () => {
    expect(describeAssessmentBanner(at("in_progress"), "learner")?.tone).toBe("urgent");
    expect(describeAssessmentBanner(at("ready"), "learner")?.tone).toBe("waiting");
    expect(describeAssessmentBanner(at("generating"), "learner")?.tone).toBe("quiet");
  });

  it("warns that a ready assessment is timed, monitored and unpausable", () => {
    const ready = describeAssessmentBanner(at("ready", 45), "learner");
    // The real limit, not "about an hour": a 45-minute assessment described as an hour is a lie
    // the learner only finds out about once the clock is already running.
    expect(ready?.body).toContain("45 minutes");
    expect(ready?.body).toMatch(/monitored/);
    expect(ready?.body).toMatch(/cannot be paused/);
  });

  it("does not tell the learner whether a human is still reading it", () => {
    // Whether it is being written or waiting on an admin is not their business, and the
    // assessment page already collapses the two into one waiting screen.
    const generating = describeAssessmentBanner(at("generating"), "learner");
    const awaiting = describeAssessmentBanner(at("awaiting_approval"), "learner");
    expect(awaiting?.title).toBe(generating?.title);
    expect(awaiting?.body).toBe(generating?.body);
    expect(awaiting?.body).not.toMatch(/approv/i);
  });
});
