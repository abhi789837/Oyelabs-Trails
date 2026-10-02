import { describe, expect, it } from "vitest";

import { branchesOf, columnIndex, initials, participantsOf, statusTone } from "./simScreen";

describe("sim screen helpers", () => {
  it("reads status tones", () => {
    expect(statusTone("Passed")).toBe("ok");
    expect(statusTone("Approved")).toBe("ok");
    expect(statusTone("✓")).toBe("ok");
    expect(statusTone("Failed")).toBe("bad");
    expect(statusTone("Changes requested")).toBe("bad");
    expect(statusTone("✗")).toBe("bad");
    expect(statusTone("Pending")).toBe("pending");
    expect(statusTone("Ann")).toBeNull();
    expect(statusTone("")).toBeNull();
  });

  it("finds branches in a PR title", () => {
    expect(branchesOf("Add login (feature/login → main)")).toEqual({ head: "feature/login", base: "main" });
    expect(branchesOf("fix/typo into develop")).toEqual({ head: "fix/typo", base: "develop" });
    expect(branchesOf("Add login")).toBeNull();
  });

  it("participants, initials and columns", () => {
    expect(participantsOf([{ cells: ["Ann", "hi"] }, { cells: ["Bo", "yo"] }, { cells: ["Ann", "again"] }])).toEqual(["Ann", "Bo"]);
    expect(initials("Ann Lee")).toBe("AL");
    expect(initials("bo")).toBe("B");
    expect(columnIndex(["Person", "Time"], /time/i)).toBe(1);
    expect(columnIndex(["Person"], /time/i)).toBe(-1);
  });
});
