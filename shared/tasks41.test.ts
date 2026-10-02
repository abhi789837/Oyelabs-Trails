import { describe, expect, test } from "vitest";

import { checkTask, gradeTask, taskSchema, type AllocateTask, type ExcelTask, type SimTask } from "./tasks";

const excel = taskSchema.parse({
  kind: "excel",
  prompt: "Fill D2 with billable hours for Ann using SUMIF, and E2 with a RAG status: Red over 40 h.",
  grid: [
    ["Name", "Hours", "Billable", "Ann billable", "Status"],
    ["Ann", "30", "Y", "", ""],
    ["Bo", "12", "N", "", ""],
    ["Ann", "15", "Y", "", ""],
  ],
  editable: ["D2", "E2"],
  checks: [
    { cell: "D2", expected: 45, requireFormula: true, functions: ["SUMIF"] },
    { cell: "E2", expected: "Red", requireFormula: true },
  ],
  solution: { D2: '=SUMIF(A2:A4,"Ann",B2:B4)', E2: '=IF(D2>40,"Red","Green")' },
}) as ExcelTask;

describe("Excel task", () => {
  test("validates against its own solution", () => expect(checkTask(excel)).toEqual([]));
  test("full marks for the formula, partial for a typed number, none for nothing", () => {
    expect(gradeTask(excel, { kind: "excel", cells: { D2: '=SUMIF(A2:A4,"Ann",B2:B4)', E2: '=IF(D2>40,"Red","Green")' } }).score).toBe(1);
    expect(gradeTask(excel, { kind: "excel", cells: { D2: "45", E2: '=IF(D2>40,"Red","Green")' } }).score).toBe(0.5);
    expect(gradeTask(excel, { kind: "excel", cells: {} }).score).toBe(0);
  });
  test("only editable cells count: a learner cannot overwrite the data", () => {
    expect(gradeTask(excel, { kind: "excel", cells: { B2: "100", D2: '=SUMIF(A2:A4,"Ann",B2:B4)', E2: '=IF(D2>40,"Red","Green")' } }).score).toBe(1);
  });
  test("a broken solution is caught", () => {
    expect(checkTask({ ...excel, solution: { D2: "=SUM(B2:B4)", E2: "Red" } }).join()).toMatch(/fails its own checks/);
  });
});

const allocate = taskSchema.parse({
  kind: "allocate",
  prompt: "Staff both projects this week.",
  people: [{ id: "a", name: "Ann", capacity: 40 }, { id: "b", name: "Bo", capacity: 20 }],
  projects: [{ id: "p1", name: "Laravel portal", need: 30 }, { id: "p2", name: "React app", need: 25 }],
  blocked: [{ person: "b", project: "p1" }],
}) as AllocateTask;

describe("Allocate task", () => {
  test("a feasible plan scores 1", () => {
    expect(checkTask(allocate)).toEqual([]);
    expect(gradeTask(allocate, { kind: "allocate", hours: { "a:p1": 30, "a:p2": 5, "b:p2": 20 } }).score).toBe(1);
  });
  test("over-allocation and blocked pairs cost marks", () => {
    const g = gradeTask(allocate, { kind: "allocate", hours: { "a:p1": 45, "b:p1": 5, "b:p2": 25 } });
    expect(g.score).toBeLessThan(0.5);
    expect(g.detail.join()).toMatch(/over-allocated|cannot work/);
  });
});

const sim = taskSchema.parse({
  kind: "sim",
  app: "keka-timesheets",
  prompt: "Approve this week's timesheets. Flag the ones you should not approve.",
  title: "Pending approvals — week 41",
  columns: ["Person", "Project", "Hours", "Note"],
  rows: [
    { id: "r1", cells: ["Ann", "Laravel portal", "40", ""], issue: null },
    { id: "r2", cells: ["Bo", "Laravel portal", "62", ""], issue: "62 h is over the weekly limit" },
    { id: "r3", cells: ["Cy", "Bench", "40", "billable"], issue: "Bench time logged as billable" },
    { id: "r4", cells: ["Dee", "React app", "32", "1 day leave"], issue: null },
  ],
  questions: [{ id: "q1", question: "What do you do about Bo's 62 hours?", options: ["Approve", "Send back and ask", "Delete it"], correctIndex: 1 }],
}) as SimTask;

describe("Screen (sim) task", () => {
  test("flags plus answers", () => {
    expect(checkTask(sim)).toEqual([]);
    expect(gradeTask(sim, { kind: "sim", flagged: ["r2", "r3"], answers: { q1: 1 } }).score).toBe(1);
    expect(gradeTask(sim, { kind: "sim", flagged: ["r1", "r2", "r3", "r4"], answers: { q1: 0 } }).score).toBeLessThan(0.5);
  });
});
