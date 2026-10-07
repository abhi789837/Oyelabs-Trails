import { describe, expect, test } from "vitest";

import { goalLevelReason, goalPhrase, missingLinkReason, movedUpReason, naturalReason, nextStepReason } from "./pathReasons";

describe("v4.5 P0: goal labels inside a sentence", () => {
  test("lower-cases the first letter of an ordinary word", () => {
    expect(goalPhrase("Build a validated form in React")).toBe("build a validated form in React");
    expect(goalPhrase("Spoken English")).toBe("spoken English");
    expect(goalPhrase("Backend")).toBe("backend");
    expect(goalPhrase("  Write clear status updates.  ")).toBe("write clear status updates");
  });

  test("keeps names and acronyms", () => {
    expect(goalPhrase("React Fundamentals")).toBe("React Fundamentals");
    expect(goalPhrase("AI-driven work for your role")).toBe("AI-driven work for your role");
    expect(goalPhrase("API design")).toBe("API design");
    expect(goalPhrase("GitHub flow")).toBe("GitHub flow");
    expect(goalPhrase("JavaScript fundamentals")).toBe("JavaScript fundamentals");
    expect(goalPhrase("Node.js & Express")).toBe("Node.js & Express");
    expect(goalPhrase("Excel for PMs")).toBe("Excel for PMs");
    expect(goalPhrase("SQL joins")).toBe("SQL joins");
    expect(goalPhrase("iOS release")).toBe("iOS release");
  });
});

describe("v4.5 P0: reasons read naturally", () => {
  test("the templates", () => {
    expect(nextStepReason("Build a validated form in React")).toBe("Next step towards your goal: build a validated form in React.");
    expect(missingLinkReason("Backend", "async JavaScript", "1/5", 3)).toBe("Comes before your goal: backend. It needs async JavaScript, which you're missing (1/5; it needs 3/5).");
    expect(movedUpReason("Forms in React", "React Fundamentals")).toBe("Moved up: React Fundamentals comes first for your goal: forms in React.");
    expect(movedUpReason(null, "Git")).toBe("Moved up: a more urgent goal needs Git first.");
    expect(goalLevelReason("Critical", "Build a validated form in React", "not measured yet", 3)).toBe(
      "Critical goal: build a validated form in React. You're at not measured yet and it needs 3/5.",
    );
  });

  test("reasons stored by older builds are rewritten", () => {
    expect(naturalReason("Next for your Build a validated form in React goal, after React Fundamentals.")).toBe("Next step towards your goal: build a validated form in React.");
    expect(naturalReason("Before Backend because Backend needs Promises & async/await, which you're missing (1/5; it needs 3/5).")).toBe(
      "Comes before your goal: backend. It needs Promises & async/await, which you're missing (1/5; it needs 3/5).",
    );
    expect(naturalReason("Moved up: Forms in React needs React Fundamentals first.")).toBe("Moved up: React Fundamentals comes first for your goal: forms in React.");
    expect(naturalReason("High goal Build a validated form in React: you're at 1/5 and it needs 3/5.")).toBe("High goal: build a validated form in React. You're at 1/5 and it needs 3/5.");
    expect(naturalReason("Next after Git: you've met your Git goal, so this continues it.")).toBe("Next after Git. You've met your goal (Git), so this continues it.");
  });

  test("anything else is left alone", () => {
    for (const reason of [
      "Moved up: the evaluation found AI-driven skills weak (1/5), and they speed up your Backend work.",
      "Moved up: a more urgent goal needs Git first.",
      "Next step towards your goal: build a validated form in React.",
      "Strengthens your current role.",
      "",
    ]) {
      expect(naturalReason(reason)).toBe(reason);
    }
  });
});
