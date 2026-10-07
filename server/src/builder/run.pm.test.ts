import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import type { SkillResult, V4Result } from "../../../shared/assessmentV4";
import type { TrackMeta } from "../../../shared/content";
import type { ContentStore } from "../content/store";
import { schema } from "../db";
import { allowedTopicIdsFor, latestPublishedPlan, publishPlan } from "../plans/repo";
import { activeLearner, adminSession, as, createTestApp, type TestContext } from "../test/harness";
import { runBuilder } from "./run";

/**
 * v4.2 Phase 5, end to end through `runBuilder`: a PM path in the process order, the Advanced
 * unlock attaching only the advanced and expert topics of the process camps, and a BD learner
 * getting PM-trail camps through the optional BD process courses.
 *
 * The process camps are still being written, so the run gets a small stand-in curriculum with the
 * academy's real shape: one topic per level band in each camp.
 */

const LEVELS = ["beginner", "intermediate", "advanced", "expert"] as const;

function camp(id: string, levels: (typeof LEVELS)[number][]) {
  return {
    id,
    trackId: "pm",
    name: id,
    description: id,
    available: true,
    topics: levels.map((level) => ({ id: `${id}-${level}`, moduleId: id, trackId: "pm", title: `${id} ${level}`, level, estMinutes: 20, challengeType: "quiz", challengeSize: 5 })),
  };
}

function stubContent(): ContentStore {
  const modules = [
    camp("pmp-a00", ["beginner", "intermediate"]),
    camp("pmp-a01", ["intermediate", "advanced", "expert"]),
    camp("pmp-a02", ["intermediate", "advanced", "expert"]),
    camp("pmp-c01", ["beginner", "intermediate", "advanced"]),
    camp("pmp-c02", ["intermediate", "advanced"]),
  ];
  const manifest = [{ id: "pm", name: "Project management", tagline: "", accentToken: "summit", modules }] as unknown as TrackMeta[];
  const order = modules.flatMap((m) => m.topics.map((t) => t.id));
  return {
    manifest,
    orderTopicIds: (ids: string[]) => order.filter((id) => ids.includes(id)),
    hasTopic: (id: string) => order.includes(id),
  } as unknown as ContentStore;
}

const result = (skillId: string, skillName: string, level: number): SkillResult => ({
  skillId, skillName, group: "focus", slider: 5, priority: "critical" as SkillResult["priority"], asked: 3, unknown: 0, score: level / 5, level,
});

async function learnerWith(ctx: TestContext, department: "pm" | "bd", trackId: string, priorities: { skillId: string; slider: number }[]) {
  const admin = await adminSession(ctx);
  const learner = await activeLearner(ctx, admin, `${department}.learner`);
  const res = await ctx.app.inject({
    method: "PUT",
    url: `/api/admin/users/${learner.id}/setup`,
    ...as(admin),
    payload: {
      departmentId: department, trackId, stackIds: [], experienceBand: "6+", level: 4,
      priorities, skip: [], hoursPerWeek: 15,
      advanced: { weekStartsMonday: false, deadlineWeeks: null, courseCap: 5, autoPublish: false },
      assign: false,
    },
  });
  expect(res.statusCode).toBe(200);
  return { admin, learner };
}

const pathItems = (ctx: TestContext, pathId: string) =>
  ctx.db.select().from(schema.pathItems).where(eq(schema.pathItems.pathId, pathId)).all().sort((a, b) => a.position - b.position);

describe("PM paths after an assessment (v4.2)", () => {
  test("an experienced PM starts a process course at Advanced: beginner camps and topics are skipped, the order holds", async () => {
    const ctx = await createTestApp();
    const { learner } = await learnerWith(ctx, "pm", "pm-agile", [
      { skillId: "pm-proc-custom", slider: 5 },
      { skillId: "pm-proc-terms", slider: 5 },
      { skillId: "pm-ai-for-pms", slider: 3 },
    ]);
    const evaluation: V4Result = {
      format: "v4",
      skills: [result("pm-proc-custom", "Custom project lifecycle", 4), result("pm-proc-terms", "Project terminology mastery", 2)],
      strengths: ["Custom project lifecycle"], focusFirst: [], rawScore: 60, pendingWritten: 0, answered: 6, total: 6,
    };
    const outcome = await runBuilder({ userId: learner.id, assessmentId: null, evaluation, adminNotes: "" }, { db: ctx.db, env: ctx.env, ai: ctx.ai, content: stubContent() });

    const items = pathItems(ctx, outcome.pathId);
    const custom = items.filter((i) => i.skillId === "pm-proc-custom");
    expect(custom.map((i) => i.moduleId)).toEqual(["pmp-a01", "pmp-a02"]);
    expect(custom.every((i) => i.startLevel === "advanced" && i.partNumber === 1)).toBe(true);
    // Terminology was weak (level 2): it starts at Intermediate and keeps every camp with an intermediate-or-above topic.
    const terms = items.filter((i) => i.skillId === "pm-proc-terms");
    expect(terms.map((i) => i.moduleId)).toEqual(["pmp-c01", "pmp-c02"]);
    expect(terms.every((i) => i.startLevel === "intermediate")).toBe(true);
    // Lifecycle before terminology. (AI has no camp in the stand-in curriculum, so a course is made for it;
    // v4.5.1: with an AI credential that never waits for a search service.)
    expect(items.findIndex((i) => i.skillId === "pm-proc-custom")).toBeLessThan(items.findIndex((i) => i.skillId === "pm-proc-terms"));
    expect(outcome.creating).toBeGreaterThanOrEqual(1);
    expect(outcome.waitingForResearch ?? 0).toBe(0);

    const plan = latestPublishedPlan(ctx.db, learner.id)!.topicIds;
    expect(plan).toEqual(expect.arrayContaining(["pmp-a01-advanced", "pmp-a01-expert", "pmp-a02-advanced", "pmp-a02-expert", "pmp-c01-intermediate", "pmp-c01-advanced"]));
    for (const skipped of ["pmp-a00-beginner", "pmp-a00-intermediate", "pmp-a01-intermediate", "pmp-c01-beginner"]) expect(plan).not.toContain(skipped);

    // The run checked its own order and found nothing to say.
    const audit = ctx.db.select().from(schema.aiAuditLog).where(eq(schema.aiAuditLog.pathId, outcome.pathId)).all();
    expect(audit.filter((a) => a.step === "parts")).toEqual([]);
    await ctx.close();
  }, 120_000);
});

describe("BD optional process courses (v4.2)", () => {
  test("a BD learner with the terminology course gets the PM-trail camps in their plan, and PM-trail content opens for them", async () => {
    const ctx = await createTestApp();
    const { learner } = await learnerWith(ctx, "bd", "bd-agency", [{ skillId: "bd-proc-terms", slider: 4 }]);

    const evaluation: V4Result = { format: "v4", skills: [], strengths: [], focusFirst: [], rawScore: 0, pendingWritten: 0, answered: 0, total: 0 };
    const outcome = await runBuilder({ userId: learner.id, assessmentId: null, evaluation, adminNotes: "" }, { db: ctx.db, env: ctx.env, ai: ctx.ai, content: stubContent() });
    const terms = pathItems(ctx, outcome.pathId).filter((i) => i.skillId === "bd-proc-terms");
    expect(terms.map((i) => i.moduleId)).toEqual(["pmp-c01", "pmp-c02"]);
    const allowed = allowedTopicIdsFor(ctx.db, { id: learner.id, role: "learner" } as never)!;
    expect(allowed.has("pmp-c01-beginner")).toBe(true);

    // Gating is by topic, not by department: a PM-trail camp in a BD plan is served like any other.
    const pmCamp = ctx.content.manifest.find((t) => t.id === "pm")!.modules.find((m) => m.available && m.topics.length > 0)!;
    publishPlan(ctx.db, ctx.content, { userId: learner.id, topicIds: pmCamp.topics.map((t) => t.id), source: "admin", publishedBy: null });
    const manifest = await ctx.app.inject({ method: "GET", url: "/api/me/manifest", ...as(learner.session) });
    expect((manifest.json().tracks as { id: string }[]).map((t) => t.id)).toContain("pm");
    const served = await ctx.app.inject({ method: "GET", url: `/api/content/modules/pm/${pmCamp.id}`, ...as(learner.session) });
    expect(served.statusCode).toBe(200);
    await ctx.close();
  }, 120_000);
});
