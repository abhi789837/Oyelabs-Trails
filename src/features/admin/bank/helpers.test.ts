import { describe, expect, it } from "vitest";

import type { BankItemRow } from "@shared/bank";

import { coverageRows, formatMeanScore, isThin, parseItemJson, toEditableItem, typesForFormat } from "./helpers";

const skill = (id: string, name: string, departmentId = "eng", status: "active" | "archived" = "active") => ({
  id,
  name,
  area: "core",
  departmentId,
  status,
});

const mcqRow: BankItemRow = {
  id: "mcq-closures-1",
  departmentId: "eng",
  skillId: "js",
  trackId: null,
  stackId: null,
  type: "mcq",
  difficulty: 2,
  estMinutes: 1,
  prompt: "What does it log?",
  coding: null,
  mcq: { options: ["0", "1", "2"], correctIndex: 1, explanation: "Because.", snippet: null, snippetLanguage: null },
  task: null,
  status: "active",
  source: "seed",
  timesUsed: 12,
  meanScore: 0.5,
  discrimination: 0.31,
  retiredReason: null,
  validatedAt: 1,
  updatedAt: 1,
};

describe("isThin", () => {
  it("is thin strictly below the floor", () => {
    expect(isThin("coding", 5)).toBe(true);
    expect(isThin("coding", 6)).toBe(false);
    expect(isThin("mcq", 2)).toBe(true);
    expect(isThin("mcq", 3)).toBe(false);
  });
});

describe("typesForFormat", () => {
  it("gives coding departments coding+mcq and task departments task+mcq", () => {
    expect(typesForFormat("coding")).toEqual(["coding", "mcq"]);
    expect(typesForFormat("tasks")).toEqual(["task", "mcq"]);
  });
});

describe("coverageRows", () => {
  it("includes skills with no items, ignores other departments and archived skills, and sorts gaps first", () => {
    const rows = coverageRows(
      [skill("a", "Arrays"), skill("b", "Booleans"), skill("x", "Other", "pm"), skill("z", "Old", "eng", "archived")],
      { b: { coding: 6, mcq: 3 } },
      "eng",
      "coding",
    );
    expect(rows.map((r) => r.skillId)).toEqual(["a", "b"]);
    expect(rows[0].thin).toEqual(["coding", "mcq"]);
    expect(rows[0].counts).toEqual({ coding: 0, mcq: 0, task: 0 });
    expect(rows[1].thin).toEqual([]);
  });

  it("does not call a coding department thin on tasks", () => {
    const [row] = coverageRows([skill("a", "Arrays")], { a: { coding: 9, mcq: 9, task: 0 } }, "eng", "coding");
    expect(row.thin).toEqual([]);
  });
});

describe("formatMeanScore", () => {
  it("rounds to a percentage and dashes a null", () => {
    expect(formatMeanScore(0.456)).toBe("46%");
    expect(formatMeanScore(null)).toBe("—");
  });
});

describe("parseItemJson", () => {
  const editable = JSON.stringify(toEditableItem(mcqRow));

  it("strips row-only fields when making the editable copy", () => {
    expect(Object.keys(toEditableItem(mcqRow))).not.toContain("timesUsed");
    expect(Object.keys(toEditableItem(mcqRow))).not.toContain("status");
  });

  it("accepts a valid item and pins the id", () => {
    const result = parseItemJson(editable.replace("mcq-closures-1", "something-else"), "mcq-closures-1");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.item.id).toBe("mcq-closures-1");
  });

  it("reports bad JSON", () => {
    const result = parseItemJson("{ nope", "mcq-closures-1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/Not valid JSON/);
  });

  it("reports schema problems with their path", () => {
    const broken = { ...toEditableItem(mcqRow), mcq: { ...mcqRow.mcq!, correctIndex: 7 } };
    const result = parseItemJson(JSON.stringify(broken), "mcq-closures-1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/correctIndex out of range/);
  });
});
