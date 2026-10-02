import { describe, expect, it } from "vitest";

import { bulkDeletePhrase, summariseBulk } from "./bulkSummary";

const names = new Map([
  ["a", "Ana"],
  ["b", "Ben"],
  ["c", "Cleo"],
]);

describe("summariseBulk", () => {
  it("reports a clean run as a success", () => {
    const summary = summariseBulk([{ id: "a", ok: true }, { id: "b", ok: true }], names, "Disabled");
    expect(summary).toEqual({ tone: "success", message: "Disabled 2 people." });
  });

  it("uses the singular for one", () => {
    expect(summariseBulk([{ id: "a", ok: true }], names, "Restored").message).toBe("Restored 1 person.");
  });

  it("lists every skipped person with the server's reason", () => {
    const summary = summariseBulk(
      [
        { id: "a", ok: true },
        { id: "b", ok: false, error: "That is your own account" },
        { id: "c", ok: false, error: "Not allowed" },
      ],
      names,
      "Deleted",
    );
    expect(summary.tone).toBe("info");
    expect(summary.message).toBe("Deleted 1 of 3.");
    expect(summary.description).toBe("Skipped: Ben (That is your own account); Cleo (Not allowed)");
  });

  it("is an error when nothing worked, and falls back to the id for unknown people", () => {
    const summary = summariseBulk([{ id: "zz", ok: false }], names, "Archived");
    expect(summary.tone).toBe("error");
    expect(summary.description).toBe("Skipped: zz (Not changed)");
  });

  it("handles an empty result list", () => {
    expect(summariseBulk([], names, "Archived").tone).toBe("info");
  });
});

describe("bulkDeletePhrase", () => {
  it("matches the server's expected confirmation", () => {
    expect(bulkDeletePhrase(3)).toBe("delete 3");
  });
});
