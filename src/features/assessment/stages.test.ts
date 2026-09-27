import { describe, expect, it } from "vitest";

import { waitHeading, waitStages } from "./stages";

const states = (status: Parameters<typeof waitStages>[0]) => waitStages(status)?.map((stage) => stage.state);

describe("waitStages", () => {
  it("walks the generation pipeline in the server's own status order", () => {
    expect(states("generating")).toEqual(["current", "pending", "pending"]);
    expect(states("awaiting_approval")).toEqual(["done", "current", "pending"]);
    // `ready` is an arrival, not a step still running.
    expect(states("ready")).toEqual(["done", "done", "done"]);
  });

  it("walks the evaluation pipeline the same way", () => {
    expect(states("submitted")).toEqual(["current", "pending", "pending"]);
    expect(states("evaluating")).toEqual(["done", "current", "pending"]);
    expect(states("completed")).toEqual(["done", "done", "done"]);
  });

  it("reports a failure against generation rather than inventing a later stage", () => {
    expect(states("failed")).toEqual(["failed", "pending", "pending"]);
  });

  it("returns null for the statuses that are not a wait", () => {
    expect(waitStages("in_progress")).toBeNull();
    expect(waitStages("terminated")).toBeNull();
  });

  it("never reports more stages than the pipeline has, so there is nothing to pad progress with", () => {
    for (const status of ["generating", "awaiting_approval", "ready", "submitted", "evaluating", "completed", "failed"] as const) {
      expect(waitStages(status)).toHaveLength(3);
    }
  });

  it("gives each wait a plain heading", () => {
    expect(waitHeading("generating")).toBe("Building your assessment");
    expect(waitHeading("awaiting_approval")).toBe("Almost ready");
    expect(waitHeading("evaluating")).toBe("Evaluating your assessment");
    expect(waitHeading("failed")).toBe("Your assessment could not be built");
  });
});
