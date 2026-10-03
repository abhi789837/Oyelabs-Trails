import { describe, expect, test } from "vitest";

import type { OnboardSuggestion } from "@shared/goals";

import { applyResults, credentialsCsv, readyRows, rowErrors, rowsFromText, toBulkRequest, withSuggestion } from "./bulkRows";

const DEPTS = [
  { id: "engineering", name: "Engineering" },
  { id: "pm", name: "Project Management" },
];

const SUGGESTION: OnboardSuggestion = {
  departmentId: "engineering",
  trackId: "backend",
  stackIds: ["stack-react"],
  experienceBand: "1-2",
  level: 2,
  hoursPerWeek: 15,
  goals: [{ type: "skill", originalText: "Git", outcome: "Can use Git.", skillIds: ["eng-git"], targetLevel: 3, caseId: null, slider: 5 }],
  extras: [],
  source: "ai",
};

const TEXT = "Priya Sharma, Engineering, Frontend dev, weak on Git\nRavi Kumar, taken, PM, New PM\nAnna, , Marketing, does SEO";

describe("bulk rows", () => {
  test("from text: parsed, usernames made, nothing suggested yet", () => {
    const rows = rowsFromText(TEXT, DEPTS, "engineering", new Set(["priya.sharma"]));
    expect(rows.map((r) => r.username)).toEqual(["priya.sharma.2", "taken", "anna"]);
    expect(rows.every((r) => r.state === null && r.status === "new")).toBe(true);
  });

  test("errors, readiness and the request", () => {
    let rows = rowsFromText(TEXT, DEPTS, "engineering", new Set(["taken"]));
    rows = rows.map((r) => withSuggestion(r, { suggestion: SUGGESTION }));
    const errors = rowErrors(rows, new Set(["taken"]));
    expect(errors[0]).toEqual({});
    expect(errors[1]!.username).toMatch(/taken/);
    expect(errors[2]!.department).toMatch(/Marketing/);

    const ready = readyRows(rows, errors);
    expect(ready.map((r) => r.name)).toEqual(["Priya Sharma"]);
    const request = toBulkRequest(ready);
    expect(request.rows[0]).toMatchObject({ username: "priya.sharma", displayName: "Priya Sharma", setup: { departmentId: "engineering", trackId: "backend", description: "Frontend dev, weak on Git" } });
    expect(request.rows[0]!.setup.goals).toHaveLength(1);
    expect("assign" in request.rows[0]!.setup).toBe(false);
  });

  test("a failed Suggest keeps the row out of the request", () => {
    const [row] = rowsFromText("Priya, eng, Frontend dev", DEPTS, "engineering", new Set());
    const failed = withSuggestion(row!, { error: "Pick a department." });
    expect(failed).toMatchObject({ status: "suggest-failed", message: "Pick a department." });
    expect(readyRows([failed], [{}])).toEqual([]);
  });

  test("results: created rows keep their password once; failures land on their field", () => {
    let rows = rowsFromText("A One, a.one, eng, Dev\nB Two, b.two, eng, Dev", DEPTS, "engineering", new Set()).map((r) => withSuggestion(r, { suggestion: SUGGESTION }));
    rows = applyResults(rows, rows, [
      { index: 0, ok: true, username: "a.one", displayName: "A One", userId: "u1", temporaryPassword: "pw-1", issued: null },
      { index: 1, ok: false, username: "b.two", displayName: "B Two", error: "That username is already taken.", field: "username" },
    ]);
    expect(rows[0]).toMatchObject({ status: "created", password: "pw-1" });
    expect(rows[1]).toMatchObject({ status: "failed", errorField: "username" });
    expect(rowErrors(rows, new Set())[1]!.username).toMatch(/taken/);
    expect(rowErrors(rows, new Set())[0]).toEqual({});
    // A created row is never sent again.
    expect(readyRows(rows, rowErrors(rows, new Set()))).toEqual([]);

    expect(credentialsCsv(rows, "https://learn.example.com/")).toBe("Name,Username,Temporary password,Sign in\nA One,a.one,pw-1,https://learn.example.com/login");
  });
});
