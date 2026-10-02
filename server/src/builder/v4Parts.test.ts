import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import type { Skill } from "../../../shared/catalog";
import type { PriorityEntry } from "../../../shared/setup";
import { schema } from "../db";
import { activeLearner, adminSession, as, createTestApp } from "../test/harness";
import { buildSpine } from "./priorityPath";
import { targetsFromPriorities } from "../setup/repo";
import { sortPriorities } from "../../../shared/setup";
import { assertV4Order, orderV4Parts } from "./v4Parts";

const skill = (id: string, name: string, extra: Partial<Skill> = {}): Skill => ({
  id, departmentId: "engineering", name, area: "x", aliases: [], tags: [], levelMin: "beginner", levelMax: "expert",
  trackIds: [], prerequisites: [], stackIds: [], language: null, contentModules: [], isAiSkill: false, defaultSlider: null, status: "active", requestedBy: null, position: 0, ...extra,
});

const skills = new Map<string, Skill>([
  ["react", skill("react", "React hooks", { trackIds: ["frontend"] })],
  ["aws", skill("aws", "AWS core")],
  ["sql", skill("sql", "SQL joins")],
  ["docker", skill("docker", "Docker")],
  ["ai-react", skill("ai-react", "AI-driven development in React", { isAiSkill: true })],
]);

function order(priorities: PriorityEntry[]) {
  const spine = buildSpine({ targets: targetsFromPriorities(priorities), gaps: [], skip: [] });
  return orderV4Parts({ spine, priorities, skills, trackId: "frontend", trackName: "Frontend", departmentName: "Engineering", stackIds: [], ownTrackGaps: [], defaultAiSkill: skills.get("ai-react")! });
}

const p = (skillId: string, slider: PriorityEntry["slider"], position: number): PriorityEntry => ({ skillId, skillName: skills.get(skillId)!.name, slider, position });

describe("v4 path parts", () => {
  test("Part 1 holds Critical priorities and own-track High ones; Part 2 is AI for the role; the rest follow", () => {
    const priorities = [p("aws", 5, 0), p("react", 4, 1), p("sql", 4, 2), p("docker", 2, 3)];
    const items = order(priorities);
    expect(items.map((i) => [i.partNumber, i.targetSkill ?? i.gap.skill])).toEqual([
      [1, "AWS core"],
      [1, "React hooks"],
      [2, "AI-driven development in React"],
      [3, "SQL joins"],
      [4, "Docker"],
    ]);
    expect(assertV4Order(items, priorities)).toEqual([]);
  });

  test("an AI skill the admin picked is Part 2 instead of the default", () => {
    const items = order([p("ai-react", 3, 0), p("aws", 4, 1)]);
    expect(items.filter((i) => i.partNumber === 2).map((i) => i.targetSkill)).toEqual(["AI-driven development in React"]);
  });

  test("with no priorities the path still opens with Parts 1 and 2", () => {
    const items = order([]);
    expect(items.map((i) => i.partType)).toEqual(["track", "ai_dev"]);
  });
});

describe("v4 path, end to end", () => {
  test("after a v4 assessment the path attaches catalog modules with no model call, Parts 1 and 2 first", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const learner = await activeLearner(ctx, admin);
    const setup = {
      departmentId: "engineering", trackId: "frontend", stackIds: ["stack-react"], experienceBand: "1-2", level: 2,
      priorities: [{ skillId: "eng-react-hooks", slider: 5 }, { skillId: "eng-typescript", slider: 4 }, { skillId: "eng-docker", slider: 3 }],
      skip: [], hoursPerWeek: 15, advanced: { weekStartsMonday: false, deadlineWeeks: null, courseCap: 5, autoPublish: false }, assign: true,
    };
    const saved = await ctx.app.inject({ method: "PUT", url: `/api/admin/users/${learner.id}/setup`, ...as(admin), payload: setup });
    const id = saved.json().issued.assessmentId as string;
    await ctx.drainJobs();
    await ctx.app.inject({ method: "POST", url: `/api/assessment/${id}/consent`, ...as(learner.session), payload: { agreed: true } });
    await ctx.app.inject({ method: "POST", url: `/api/assessment/${id}/start`, ...as(learner.session), payload: {} });
    await ctx.app.inject({ method: "POST", url: `/api/assessment/${id}/submit`, ...as(learner.session), payload: {} });
    await ctx.drainJobs();

    const path = (await ctx.app.inject({ method: "GET", url: `/api/admin/users/${learner.id}/gaps`, ...as(admin) })).json().path;
    expect(path.status).toBe("ready");
    const items = path.items as { partNumber: number; targetSkill: string | null; moduleId: string | null; source: string }[];
    expect(items[0].partNumber).toBe(1);
    expect(items.find((i) => i.targetSkill === "React hooks")?.moduleId).toBeTruthy();
    expect(items.some((i) => i.partNumber === 2)).toBe(true);
    const firstPart3 = items.findIndex((i) => i.partNumber >= 3);
    expect(items.slice(0, firstPart3 < 0 ? items.length : firstPart3).every((i) => i.partNumber <= 2)).toBe(true);
    // Nothing on this path needed a model: the gaps came from the v4 report and the courses from the catalog.
    const calls = ctx.db.select().from(schema.aiCalls).all().filter((c) => c.purpose === "gap_analysis");
    expect(calls).toHaveLength(0);
    const plan = ctx.db.select().from(schema.learningPlans).where(eq(schema.learningPlans.userId, learner.id)).all();
    expect(plan.length).toBeGreaterThan(0);
    await ctx.close();
  }, 120_000);
});

describe("PM path order (v4.1)", () => {
  test("diagnostic refresh first, then client management and meetings, then Excel, theory last", () => {
    const pm = (id: string, name: string, extra: Partial<Skill> = {}) => skill(id, name, { departmentId: "pm", trackIds: ["pm-agile"], ...extra });
    const pmSkills = new Map<string, Skill>([
      ["refresh", pm("refresh", "Improving your existing PM skills", { tags: ["refresh"] })],
      ["client", pm("client", "Client management")],
      ["meetings", pm("meetings", "Client update meetings & presenting")],
      ["email", pm("email", "Email etiquette & professional writing")],
      ["excel", pm("excel", "Excel for PMs")],
      ["theory", pm("theory", "PM foundations and advanced theory", { trackIds: [] })],
      ["ai", pm("ai", "AI for PMs", { isAiSkill: true })],
    ]);
    const entries: PriorityEntry[] = [
      { skillId: "theory", skillName: "PM foundations and advanced theory", slider: 2, position: 0 },
      { skillId: "excel", skillName: "Excel for PMs", slider: 4, position: 1 },
      { skillId: "client", skillName: "Client management", slider: 5, position: 2 },
      { skillId: "meetings", skillName: "Client update meetings & presenting", slider: 5, position: 3 },
      { skillId: "email", skillName: "Email etiquette & professional writing", slider: 5, position: 4 },
    ];
    const spine = buildSpine({ targets: targetsFromPriorities(sortPriorities(entries)), gaps: [], skip: [] });
    const items = orderV4Parts({
      spine, priorities: sortPriorities(entries), skills: pmSkills, trackId: "pm-agile", trackName: "Agile Delivery PM", departmentName: "Project Management",
      stackIds: [], ownTrackGaps: [], defaultAiSkill: pmSkills.get("ai")!, refreshSkill: pmSkills.get("refresh")!, assessmentFoundGaps: true, departmentId: "pm",
    });
    const order = items.map((i) => i.targetSkill ?? i.gap.skill);
    expect(order[0]).toBe("Improving your existing PM skills");
    expect(order.slice(1, 4)).toEqual(["Client management", "Client update meetings & presenting", "Email etiquette & professional writing"]);
    expect(order.indexOf("Excel for PMs")).toBeLessThan(order.indexOf("PM foundations and advanced theory"));
    expect(order.at(-1)).toBe("PM foundations and advanced theory");
    expect(assertV4Order(items, sortPriorities(entries), { departmentId: "pm", refreshSkillId: "refresh", theorySkillIds: ["theory"], aiSkillIds: ["ai"] })).toEqual([]);
  });
});

describe("PM path order (v4.2)", () => {
  const pm = (id: string, name: string, extra: Partial<Skill> = {}) => skill(id, name, { departmentId: "pm", trackIds: ["pm-agile"], ...extra });
  const pmSkills = new Map<string, Skill>([
    ["pm-agency-refresh", pm("pm-agency-refresh", "Improving your existing PM skills", { tags: ["refresh"] })],
    ["pm-proc-custom", pm("pm-proc-custom", "Custom project lifecycle", { tags: ["process"] })],
    ["pm-proc-whitelabel", pm("pm-proc-whitelabel", "White-label project lifecycle", { tags: ["process"] })],
    ["pm-proc-terms", pm("pm-proc-terms", "Project terminology mastery", { tags: ["process"] })],
    ["pm-proc-meetings", pm("pm-proc-meetings", "Handling every client meeting", { tags: ["process"] })],
    ["pm-proc-templates", pm("pm-proc-templates", "Process templates in practice", { tags: ["process"] })],
    ["pm-client-management", pm("pm-client-management", "Client management")],
    ["pm-excel-for-pms", pm("pm-excel-for-pms", "Excel for PMs")],
    ["pm-keka", pm("pm-keka", "Keka for PMs")],
    ["pm-client-meetings", pm("pm-client-meetings", "Client update meetings & presenting")],
    ["pm-foundations-theory", pm("pm-foundations-theory", "PM foundations and advanced theory", { tags: ["theory"] })],
    ["pm-ai-for-pms", pm("pm-ai-for-pms", "AI for PMs (Copilot & Claude)", { isAiSkill: true })],
  ]);
  const entry = (skillId: string, slider: PriorityEntry["slider"], position: number): PriorityEntry => ({ skillId, skillName: pmSkills.get(skillId)!.name, slider, position });
  const check = { departmentId: "pm", refreshSkillId: "pm-agency-refresh", theorySkillIds: ["pm-foundations-theory"], aiSkillIds: ["pm-ai-for-pms"] };

  function pmOrder(entries: PriorityEntry[], areaLevels: { area: string; level: number }[] = [], foundGaps = true) {
    const priorities = sortPriorities(entries);
    const spine = buildSpine({ targets: targetsFromPriorities(priorities), gaps: [], skip: [], areaLevels });
    const items = orderV4Parts({
      spine, priorities, skills: pmSkills, trackId: "pm-agile", trackName: "Agile Delivery PM", departmentName: "Project Management", stackIds: [], ownTrackGaps: [],
      defaultAiSkill: pmSkills.get("pm-ai-for-pms")!, refreshSkill: pmSkills.get("pm-agency-refresh")!, assessmentFoundGaps: foundGaps, departmentId: "pm",
    });
    return { items, priorities, names: items.map((i) => [i.partNumber, i.targetSkill ?? i.gap.skill] as const) };
  }

  // The v4.2 defaults, listed out of order on purpose: the slider decides, not the list.
  const defaults = [
    entry("pm-foundations-theory", 2, 0),
    entry("pm-excel-for-pms", 4, 1),
    entry("pm-proc-meetings", 5, 2),
    entry("pm-client-management", 4, 3),
    entry("pm-proc-templates", 4, 4),
    entry("pm-proc-terms", 5, 5),
    entry("pm-keka", 3, 6),
    entry("pm-proc-whitelabel", 5, 7),
    entry("pm-client-meetings", 3, 8),
    entry("pm-proc-custom", 5, 9),
    entry("pm-ai-for-pms", 3, 10),
  ];

  test("Part 1: refresh, lifecycle courses, terminology, meetings, then the other Critical and High; Part 2 AI; the rest, theory last", () => {
    const { items, priorities, names } = pmOrder(defaults);
    expect(names).toEqual([
      [1, "Improving your existing PM skills"],
      [1, "White-label project lifecycle"],
      [1, "Custom project lifecycle"],
      [1, "Project terminology mastery"],
      [1, "Handling every client meeting"],
      [1, "Excel for PMs"],
      [1, "Client management"],
      [1, "Process templates in practice"],
      [2, "AI for PMs (Copilot & Claude)"],
      [3, "Keka for PMs"],
      [4, "Client update meetings & presenting"],
      [5, "PM foundations and advanced theory"],
    ]);
    expect(assertV4Order(items, priorities, check)).toEqual([]);
  });

  test("a lifecycle course that is only High opens Part 1 when the assessment found it weak, and waits its turn when it did not", () => {
    const entries = defaults.map((e) => (e.skillId === "pm-proc-whitelabel" ? { ...e, slider: 4 as const } : e));
    const weak = pmOrder(entries, [{ area: "White-label project lifecycle", level: 2 }]);
    expect(weak.names.slice(0, 4).map(([, n]) => n)).toEqual(["Improving your existing PM skills", "Custom project lifecycle", "White-label project lifecycle", "Project terminology mastery"]);
    expect(assertV4Order(weak.items, weak.priorities, check)).toEqual([]);

    const strong = pmOrder(entries, [{ area: "White-label project lifecycle", level: 5 }]);
    const part1 = strong.names.filter(([part]) => part === 1).map(([, n]) => n);
    expect(part1.indexOf("White-label project lifecycle")).toBeGreaterThan(part1.indexOf("Handling every client meeting"));
    expect(assertV4Order(strong.items, strong.priorities, check)).toEqual([]);
  });

  test("a weak Medium lifecycle course still opens Part 1; with no gaps there is no refresh", () => {
    const entries = defaults.map((e) => (e.skillId === "pm-proc-custom" ? { ...e, slider: 3 as const } : e));
    const { items, priorities, names } = pmOrder(entries, [{ area: "Custom project lifecycle", level: 1 }], false);
    expect(names[0]).toEqual([1, "White-label project lifecycle"]);
    expect(names[1]).toEqual([1, "Custom project lifecycle"]);
    expect(assertV4Order(items, priorities, check)).toEqual([]);
  });

  test("assertV4Order catches a PM path in the wrong order", () => {
    const { items, priorities } = pmOrder(defaults);
    const swapped = [...items];
    const terms = swapped.findIndex((i) => i.skillId === "pm-proc-terms");
    const custom = swapped.findIndex((i) => i.skillId === "pm-proc-custom");
    [swapped[terms], swapped[custom]] = [swapped[custom], swapped[terms]];
    expect(assertV4Order(swapped, priorities, check)).toContain("PM Part 1 is not lifecycle, terminology, meetings, then the other Critical and High priorities");

    const t = items.findIndex((i) => i.skillId === "pm-foundations-theory");
    const keka = items.findIndex((i) => i.skillId === "pm-keka");
    const theoryFirst = [...items];
    theoryFirst[keka] = { ...items[t], partNumber: items[keka].partNumber };
    theoryFirst[t] = { ...items[keka], partNumber: items[t].partNumber };
    expect(assertV4Order(theoryFirst, priorities, check)).toContain("The theory course is not last on the PM path");

    const refreshLate = [...items.slice(1, 3), items[0], ...items.slice(3)];
    expect(assertV4Order(refreshLate, priorities, check)).toContain("The diagnostic refresh does not open the PM path");

    const demoted = items.map((i) => (i.skillId === "pm-proc-meetings" ? { ...i, partNumber: 3 } : i));
    expect(assertV4Order(demoted, priorities, check).join(" ")).toMatch(/Handling every client meeting belongs in Part 1/);
  });
});
