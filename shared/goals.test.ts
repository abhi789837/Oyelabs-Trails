import { describe, expect, it } from "vitest";

import { asOutcome } from "./goals";

describe("asOutcome", () => {
  it("turns a plain line into a Can-statement", () => {
    expect(asOutcome("resolve a merge conflict")).toBe("Can resolve a merge conflict.");
    expect(asOutcome("Can ship a container.")).toBe("Can ship a container.");
  });

  it("reads a free-text goal phrased as what they should be able to do", () => {
    expect(asOutcome("should be able to fix production bugs on our Laravel projects without help")).toBe("Can fix production bugs on our Laravel projects without help.");
    expect(asOutcome("They must be able to deploy on their own")).toBe("Can deploy on their own.");
    expect(asOutcome("be able to review PRs")).toBe("Can review PRs.");
    expect(asOutcome("needs to write SQL reports")).toBe("Can write SQL reports.");
    expect(asOutcome("should write tests first")).toBe("Can write tests first.");
  });

  it("leaves a sentence that only starts with similar words alone", () => {
    expect(asOutcome("shouldering on-call alone")).toBe("Can shouldering on-call alone.");
    expect(asOutcome("should be calm in client calls")).toBe("Can be calm in client calls.");
  });
});
