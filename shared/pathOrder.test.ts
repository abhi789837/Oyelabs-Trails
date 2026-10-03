import { describe, expect, it } from "vitest";

import { expandGoalToSkills, orderPath, type PathOrderInput, type PathTarget } from "./pathOrder";
import type { SkillEdge } from "./skillGraph";

const p = (from: string, to: string): SkillEdge => ({ from, to, type: "prerequisite" });
const r = (from: string, to: string): SkillEdge => ({ from, to, type: "recommended" });

describe("worked example: frontend developer with Git, Backend and AI goals", () => {
  const edges: SkillEdge[] = [
    p("git-basics", "git-branching-prs"),
    p("async-js", "node-express"),
    p("node-express", "databases"),
    p("databases", "auth"),
    p("auth", "deployment"),
    p("git-basics", "deployment"),
    p("ai-dev-fundamentals", "ai-dev-advanced"),
  ];
  const names = {
    "git-basics": "Git basics",
    "git-branching-prs": "Git branching and PRs",
    "ai-dev-fundamentals": "AI-driven development fundamentals",
    "ai-dev-advanced": "advanced AI-driven workflows",
    "async-js": "async JavaScript",
    "node-express": "Node/Express",
    databases: "databases",
    auth: "auth",
    deployment: "deployment",
  };
  const targets: PathTarget[] = [
    ...expandGoalToSkills({ skillIds: ["git-basics", "git-branching-prs"], slider: 5, adminOrder: 0, goalLevel: 3, label: "Git" }, edges),
    ...expandGoalToSkills({ skillIds: ["node-express", "deployment"], slider: 4, adminOrder: 1, goalLevel: 3, label: "Backend" }, edges),
    ...expandGoalToSkills({ skillIds: ["ai-dev-fundamentals", "ai-dev-advanced"], slider: 3, adminOrder: 2, goalLevel: 3, label: "AI-driven development" }, edges),
  ];
  const input: PathOrderInput = {
    targets,
    mastery: { "git-basics": 2, "ai-dev-fundamentals": 1, "ai-dev-advanced": 1, "async-js": 1, react: 4 },
    edges,
    coreSkillIds: ["react"],
    criticallyWeak: [
      { skillId: "ai-dev-fundamentals", label: "AI-driven skills", why: "they speed up your Backend work" },
      { skillId: "ai-dev-advanced", label: "AI-driven skills" },
    ],
    names,
  };

  it("expands Backend to the whole Node → databases → auth → deployment chain", () => {
    expect(targets.filter((t) => t.goalLabel === "Backend").map((t) => t.skillId)).toEqual(["node-express", "databases", "auth", "deployment"]);
  });

  it("orders the path exactly as the brief says", () => {
    const result = orderPath(input);
    expect(result.steps.map((s) => s.skillId)).toEqual([
      "git-basics",
      "git-branching-prs",
      "ai-dev-fundamentals",
      "async-js",
      "node-express",
      "databases",
      "auth",
      "deployment",
      "ai-dev-advanced",
    ]);
    expect(result.warnings).toEqual([]);
  });

  it("labels and explains each step", () => {
    const { steps, missingLinks } = orderPath(input);
    const step = (id: string) => steps.find((s) => s.skillId === id)!;
    expect(step("git-basics")).toMatchObject({ kind: "target", priority: "Critical" });
    expect(step("ai-dev-fundamentals")).toMatchObject({ kind: "must-have", priority: "High" });
    expect(step("ai-dev-fundamentals").reason).toBe("Moved up: the evaluation found AI-driven skills weak (1/5), and they speed up your Backend work.");
    expect(step("async-js")).toMatchObject({ kind: "missing-link", priority: "Critical", neededLevel: 3 });
    expect(step("async-js").reason).toBe("Before Backend because Backend needs async JavaScript, which you're missing (1/5; it needs 3/5).");
    expect(step("node-express")).toMatchObject({ kind: "target", priority: "High", blockedBy: ["async-js"] });
    expect(step("ai-dev-advanced")).toMatchObject({ kind: "target", priority: "Medium", blockedBy: ["ai-dev-fundamentals"] });
    expect(missingLinks).toEqual([{ skillId: "async-js", mastery: 1, neededLevel: 3, blocks: ["node-express", "databases", "auth", "deployment"] }]);
  });
});

describe("rules", () => {
  it("walks the whole prerequisite chain, not one hop, and stops at a good-enough skill", () => {
    const edges = [p("a", "b"), p("b", "c"), p("c", "goal"), p("z", "a")];
    const result = orderPath({ targets: [{ skillId: "goal", slider: 4, adminOrder: 0, goalLevel: 4 }], mastery: { c: 1, b: 0, a: 1, z: 3 }, edges });
    expect(result.steps.map((s) => s.skillId)).toEqual(["a", "b", "c", "goal"]);
    expect(result.missingLinks.map((m) => m.neededLevel)).toEqual([3, 3, 3]);
  });

  it("needs a prerequisite only up to min(goal level, 3)", () => {
    const edges = [p("pre", "goal")];
    const low = orderPath({ targets: [{ skillId: "goal", slider: 3, adminOrder: 0, goalLevel: 2 }], mastery: { pre: 2 }, edges });
    expect(low.missingLinks).toEqual([]);
    const high = orderPath({ targets: [{ skillId: "goal", slider: 3, adminOrder: 0, goalLevel: 5 }], mastery: { pre: 3 }, edges });
    expect(high.missingLinks).toEqual([]);
    const gap = orderPath({ targets: [{ skillId: "goal", slider: 3, adminOrder: 0, goalLevel: 5 }], mastery: { pre: 2 }, edges });
    expect(gap.missingLinks.map((m) => m.skillId)).toEqual(["pre"]);
  });

  it("labels a missing link Critical when it blocks a High goal and High when it blocks only lower ones", () => {
    const edges = [p("x", "hi"), p("y", "lo")];
    const { steps } = orderPath({
      targets: [
        { skillId: "hi", slider: 4, adminOrder: 0, goalLevel: 3 },
        { skillId: "lo", slider: 2, adminOrder: 1, goalLevel: 3 },
      ],
      mastery: {},
      edges,
    });
    expect(steps.find((s) => s.skillId === "x")!.priority).toBe("Critical");
    expect(steps.find((s) => s.skillId === "y")!.priority).toBe("High");
    // …but each is done just in time, ranked with the goal it serves.
    expect(steps.map((s) => s.skillId)).toEqual(["x", "hi", "y", "lo"]);
  });

  it("lets a prerequisite inherit the priority of what it unblocks, so a High chain is not starved", () => {
    const edges = [p("med-goal", "high-goal")];
    const { steps } = orderPath({
      targets: [
        { skillId: "other-med", slider: 3, adminOrder: 0, goalLevel: 3 },
        { skillId: "med-goal", slider: 3, adminOrder: 1, goalLevel: 3 },
        { skillId: "high-goal", slider: 4, adminOrder: 2, goalLevel: 3 },
      ],
      mastery: {},
      edges,
    });
    expect(steps.map((s) => s.skillId)).toEqual(["med-goal", "high-goal", "other-med"]);
    expect(steps[0].reason).toMatch(/^Moved up: /);
  });

  it("adds a critically weak core skill as a must-have even with no goal for it", () => {
    const { steps } = orderPath({
      targets: [{ skillId: "goal", slider: 3, adminOrder: 0, goalLevel: 3 }],
      mastery: { core: 1, strong: 4 },
      edges: [],
      coreSkillIds: ["core", "strong"],
    });
    expect(steps.map((s) => [s.skillId, s.kind, s.priority])).toEqual([
      ["core", "must-have", "High"],
      ["goal", "target", "Medium"],
    ]);
  });

  it("skips mastered targets and offers an optional advanced course below 5/5", () => {
    const { steps, skipped } = orderPath({
      targets: [
        { skillId: "done", slider: 5, adminOrder: 0, goalLevel: 3 },
        { skillId: "perfect", slider: 5, adminOrder: 1, goalLevel: 3 },
        { skillId: "todo", slider: 3, adminOrder: 2, goalLevel: 3 },
      ],
      mastery: { done: 4, perfect: 5, todo: 1 },
      edges: [p("done", "todo")],
    });
    expect(steps.map((s) => s.skillId)).toEqual(["todo"]);
    expect(skipped.map((s) => [s.skillId, s.optionalAdvanced])).toEqual([
      ["done", true],
      ["perfect", false],
    ]);
  });

  it("continues the progression when there is no gap", () => {
    const edges = [p("git", "git-adv"), p("git-adv", "ci"), r("git", "code-review"), p("docker", "ci")];
    const { steps } = orderPath({
      targets: [{ skillId: "git", slider: 5, adminOrder: 0, goalLevel: 3, goalLabel: "Git" }],
      mastery: { git: 4, docker: 3 },
      edges,
      names: { git: "Git", "git-adv": "advanced Git workflows", ci: "CI basics" },
    });
    expect(steps.map((s) => [s.skillId, s.kind])).toEqual([
      ["git-adv", "continuation"],
      ["code-review", "continuation"],
      ["ci", "continuation"],
    ]);
    expect(steps[0].reason).toBe("Next after Git: you've met your Git goal, so this continues it.");
  });

  it("does not continue into a skill whose other prerequisites are missing", () => {
    const { steps } = orderPath({
      targets: [{ skillId: "git", slider: 5, adminOrder: 0, goalLevel: 3 }],
      mastery: { git: 4, docker: 0 },
      edges: [p("git", "ci"), p("docker", "ci")],
    });
    expect(steps).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Property tests over random DAGs (seeded, so a failure reproduces)
// ---------------------------------------------------------------------------

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function randomCase(seed: number): PathOrderInput {
  const rand = rng(seed);
  const n = 6 + Math.floor(rand() * 14);
  const ids = Array.from({ length: n }, (_, i) => `s${String(i).padStart(2, "0")}`);
  const edges: SkillEdge[] = [];
  for (let i = 0; i < n; i += 1)
    for (let j = i + 1; j < n; j += 1) if (rand() < 0.18) edges.push({ from: ids[i], to: ids[j], type: rand() < 0.85 ? "prerequisite" : "recommended" });
  const mastery: Record<string, number> = {};
  for (const id of ids) if (rand() < 0.8) mastery[id] = Math.floor(rand() * 6);
  const targets: PathTarget[] = ids.filter(() => rand() < 0.35).map((skillId, i) => ({ skillId, slider: 1 + Math.floor(rand() * 5), adminOrder: i, goalLevel: 1 + Math.floor(rand() * 5) }));
  const criticallyWeak = ids.filter(() => rand() < 0.1);
  return { targets, mastery, edges, criticallyWeak };
}

describe("properties over random DAGs", () => {
  const cases = Array.from({ length: 300 }, (_, i) => randomCase(i + 1));

  it("never schedules a skill before a prerequisite that is also in the path", () => {
    for (const c of cases) {
      const order = orderPath(c).steps.map((s) => s.skillId);
      const at = new Map(order.map((id, i) => [id, i]));
      // Transitively too: walk every prerequisite path between two scheduled skills.
      const prereq = c.edges.filter((e) => e.type === "prerequisite");
      const reach = (from: string): Set<string> => {
        const seen = new Set<string>();
        const stack = [from];
        while (stack.length) for (const e of prereq.filter((x) => x.from === stack.pop())) if (!seen.has(e.to)) (seen.add(e.to), stack.push(e.to));
        return seen;
      };
      for (const a of order) for (const b of reach(a)) if (at.has(b)) expect(at.get(a)!).toBeLessThan(at.get(b)!);
    }
  });

  it("puts every needed target or weak skill in the path exactly once, and nothing mastered", () => {
    for (const c of cases) {
      const { steps, skipped } = orderPath(c);
      const ids = steps.map((s) => s.skillId);
      expect(new Set(ids).size).toBe(ids.length);
      if (steps.some((s) => s.kind === "continuation")) continue;
      for (const t of c.targets) {
        const m = c.mastery[t.skillId] ?? 0;
        if (m >= t.goalLevel) {
          // Met for its own goal: skipped, unless another goal needs it higher as a prerequisite.
          const step = steps.find((s) => s.skillId === t.skillId);
          if (step) expect(step.kind).toBe("missing-link");
          else expect(skipped.map((s) => s.skillId)).toContain(t.skillId);
        } else expect(ids).toContain(t.skillId);
      }
    }
  });

  it("boosts critically weak skills to at least High", () => {
    for (const c of cases) {
      const { steps } = orderPath(c);
      for (const s of steps.filter((x) => x.kind === "must-have")) expect(["High", "Critical"]).toContain(s.priority);
      for (const id of (c.criticallyWeak ?? []) as string[]) {
        const t = c.targets.find((x) => x.skillId === id);
        const needed = t ? t.goalLevel : 3;
        if ((c.mastery[id] ?? 0) < needed && !steps.some((s) => s.kind === "continuation")) expect(steps.map((s) => s.skillId)).toContain(id);
      }
    }
  });

  it("breaks ties by admin order, then id, when nothing else differs", () => {
    const targets: PathTarget[] = [
      { skillId: "b", slider: 3, adminOrder: 1, goalLevel: 3 },
      { skillId: "a", slider: 3, adminOrder: 1, goalLevel: 3 },
      { skillId: "c", slider: 3, adminOrder: 0, goalLevel: 3 },
    ];
    expect(orderPath({ targets, mastery: {}, edges: [] }).steps.map((s) => s.skillId)).toEqual(["c", "a", "b"]);
  });

  it("breaks a remaining tie by the skill that unblocks the most", () => {
    const targets: PathTarget[] = ["a", "b", "x", "y", "z"].map((skillId) => ({ skillId, slider: 3, adminOrder: 0, goalLevel: 3 }));
    const edges = [p("b", "x"), p("b", "y"), p("a", "z")];
    expect(orderPath({ targets, mastery: {}, edges }).steps.map((s) => s.skillId).slice(0, 2)).toEqual(["b", "a"]);
  });

  it("continues the progression whenever there is no gap and somewhere to go", () => {
    let checked = 0;
    for (const c of cases) {
      const met = Object.fromEntries(Object.keys(c.mastery).map((id) => [id, 5]));
      const targets = c.targets.map((t) => ({ ...t }));
      for (const t of targets) met[t.skillId] = 5;
      const mastery = { ...met };
      // Every measured skill and every target is mastered; unmeasured dependents are where to go next.
      const result = orderPath({ ...c, targets, mastery, criticallyWeak: [] });
      expect(result.steps.every((s) => s.kind === "continuation")).toBe(true);
      for (const s of result.steps) expect(targets.map((t) => t.skillId)).not.toContain(s.skillId);
      checked += result.steps.length;
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("is deterministic", () => {
    for (const c of cases.slice(0, 50)) expect(orderPath(c)).toEqual(orderPath(c));
  });
});
