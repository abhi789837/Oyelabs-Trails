import { describe, expect, it } from "vitest";

import { describeIssued } from "./issued";

describe("describeIssued", () => {
  it("says the assessment is being written", () => {
    expect(describeIssued({ assessmentId: "a", status: "generating" }).message).toBe("Writing their assessment — ready in about a minute.");
  });

  it("passes the bank-only notice through", () => {
    const out = describeIssued({ assessmentId: "a", status: "ready", notice: "No AI credential is set up." }, "Priya");
    expect(out.message).toBe("Priya is set up and their assessment is ready.");
    expect(out.notice).toBe("No AI credential is set up.");
  });

  it("handles a plain save", () => {
    expect(describeIssued(null)).toEqual({ message: "Setup saved.", notice: null });
  });
});
