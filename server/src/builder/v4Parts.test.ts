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
      stackIds: [], ownTrackGaps: [], defaultAiSkill: pmSkills.get("ai")!, refreshSkill: pmSkills.get("refresh")!, assessmentFoundGaps: true,
    });
    const order = items.map((i) => i.targetSkill ?? i.gap.skill);
    expect(order[0]).toBe("Improving your existing PM skills");
    expect(order.slice(1, 4)).toEqual(["Client management", "Client update meetings & presenting", "Email etiquette & professional writing"]);
    expect(order.indexOf("Excel for PMs")).toBeLessThan(order.indexOf("PM foundations and advanced theory"));
    expect(order.at(-1)).toBe("PM foundations and advanced theory");
    expect(assertV4Order(items, sortPriorities(entries))).toEqual([]);
  });
});
