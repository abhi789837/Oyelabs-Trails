import { describe, expect, it } from "vitest";

import { checkTask, gradeTask, gradeTerminal, normaliseCommand, runTerminal, taskSchema, TERMINAL_PASS, TERMINAL_UNKNOWN, toLearnerTask, type TerminalTask } from "./tasks";
import { estimateSeconds } from "./timing";

/** The worked example from docs/v4.3/PLAN.md: a merge conflict after pulling main. */
const conflict = taskSchema.parse({
  kind: "terminal",
  title: "Resolve the cart conflict",
  prompt: "You pulled main and got a conflict in src/cart.js. Resolve it, commit, and push your branch.",
  cwd: "~/shop-api (feature/cart)",
  intro: "CONFLICT (content): Merge conflict in src/cart.js\nAutomatic merge failed; fix conflicts and then commit the result.",
  files: [
    {
      path: "src/cart.js",
      content: "export function total(items) {\n<<<<<<< HEAD\n  return items.reduce((s, i) => s + i.price * i.qty, 0);\n=======\n  return items.reduce((s, i) => s + i.price, 0);\n>>>>>>> main\n}\n",
    },
  ],
  steps: [
    { id: "status", goal: "See which files are in conflict", accept: ["^git status$"], output: "both modified:   src/cart.js" },
    { id: "add", goal: "Mark the file as resolved", accept: ["^git add (src/cart\\.js|\\.|-A)$"], output: "" },
    { id: "commit", goal: "Commit the merge", accept: ["^git commit( -m .+)?$", "^git merge --continue$"], output: "[feature/cart 1a2b3c4] Merge main" },
    { id: "push", goal: "Push your branch", accept: ["^git push( origin feature/cart)?$", "^git push -u origin feature/cart$"], output: "To github.com:oyelabs/shop-api.git" },
  ],
  fileChecks: [{ path: "src/cart.js", mustContain: ["i.price * i.qty"], mustNotContain: ["<<<<<<<", "=======", ">>>>>>>"] }],
  explanation: "Keep the quantity-aware total, remove the markers, add, commit and push.",
}) as TerminalTask;

const resolved = "export function total(items) {\n  return items.reduce((s, i) => s + i.price * i.qty, 0);\n}\n";

describe("terminal task", () => {
  it("is a valid task with no problems", () => {
    expect(checkTask(conflict)).toEqual([]);
  });

  it("collapses whitespace before matching", () => {
    expect(normaliseCommand("  git   commit  -m   'merge'  ")).toBe("git commit -m 'merge'");
    expect(runTerminal(conflict, ["  git    status "]).met).toEqual(["status"]);
  });

  it("passes the merge-conflict example when every step is done and the file is fixed", () => {
    const grade = gradeTerminal(conflict, ["git status", "git add src/cart.js", "git commit -m 'Merge main'", "git push"], { "src/cart.js": resolved });
    expect(grade.score).toBe(1);
  });

  it("meets steps strictly in order", () => {
    // Pushing first does nothing; the push only counts after the commit.
    const run = runTerminal(conflict, ["git push", "git status", "git add .", "git commit", "git push"]);
    expect(run.met).toEqual(["status", "add", "commit", "push"]);
    expect(run.lines[0]).toMatchObject({ stepId: null, output: TERMINAL_UNKNOWN });
    expect(run.nextStepId).toBeNull();
  });

  it("does not count a later step done out of order", () => {
    const run = runTerminal(conflict, ["git commit -m x", "git push"]);
    expect(run.met).toEqual([]);
    expect(run.nextStepId).toBe("status");
  });

  it("costs nothing for wrong commands in between, but lists them", () => {
    const commands = ["git status", "ls", "git stash", "git add -A", "rm -rf /", "git merge --continue", "git push origin feature/cart"];
    const grade = gradeTerminal(conflict, commands, { "src/cart.js": resolved });
    expect(grade.score).toBe(1);
    expect(grade.detail.at(-1)).toBe("3 commands not needed");
  });

  it("fails the file check while conflict markers remain", () => {
    const grade = gradeTerminal(conflict, ["git status", "git add src/cart.js", "git commit -m 'merge'", "git push"]);
    // 4 of 5 units: still exactly at the pass mark, but the file line says so.
    expect(grade.score).toBe(0.8);
    expect(grade.detail).toContain("src/cart.js: not right yet");
    const half = gradeTerminal(conflict, ["git status", "git add src/cart.js"], { "src/cart.js": resolved.replace("}\n", "=======\n}\n") });
    expect(half.score).toBe(0.4);
    expect(half.score!).toBeLessThan(TERMINAL_PASS);
  });

  it("is case-sensitive and whole-pattern only where anchored", () => {
    expect(runTerminal(conflict, ["GIT STATUS"]).met).toEqual([]);
    expect(runTerminal(conflict, ["git status --short"]).met).toEqual([]);
  });

  it("grades through gradeTask and needs the right response kind", () => {
    expect(gradeTask(conflict, { kind: "terminal", commands: ["git status"], files: {} }).score).toBe(0.2);
    expect(gradeTask(conflict, null).score).toBe(0);
  });

  it("flags invalid patterns, unknown file checks and tasks an empty answer passes", () => {
    const broken = { ...conflict, steps: [{ ...conflict.steps[0], accept: ["git (status"] }], fileChecks: [{ path: "nope.js", mustContain: ["x"], mustNotContain: [] }] };
    const problems = checkTask(broken);
    expect(problems.some((p) => p.includes("invalid pattern"))).toBe(true);
    expect(problems.some((p) => p.includes("unknown file nope.js"))).toBe(true);
    const trivial = { ...conflict, fileChecks: [{ path: "src/cart.js", mustContain: ["total"], mustNotContain: [] }, { path: "src/cart.js", mustContain: ["items"], mustNotContain: [] }, { path: "src/cart.js", mustContain: ["reduce"], mustNotContain: [] }, { path: "src/cart.js", mustContain: ["export"], mustNotContain: [] }, { path: "src/cart.js", mustContain: ["price"], mustNotContain: [] }], steps: [conflict.steps[0]] };
    expect(checkTask(trivial)).toContain("terminal: an empty answer already passes");
  });

  it("keeps the steps for the browser but hides what the file checks look for", () => {
    const learner = toLearnerTask(conflict);
    expect(learner.kind).toBe("terminal");
    if (learner.kind !== "terminal") return;
    expect(learner.steps).toHaveLength(4);
    expect(learner.fileChecks).toEqual([{ path: "src/cart.js" }]);
    expect("explanation" in learner).toBe(false);
  });

  it("has a time estimate that grows with the steps", () => {
    const item = { type: "task" as const, prompt: conflict.prompt, coding: null, mcq: null, task: conflict };
    const shorter = { ...item, task: { ...conflict, steps: conflict.steps.slice(0, 1) } };
    expect(estimateSeconds(item as never)).toBeGreaterThan(estimateSeconds(shorter as never));
  });
});
