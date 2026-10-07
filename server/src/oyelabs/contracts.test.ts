import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { citationLabel, moduleTestSummaryLine } from "../../../shared/moduleTests";
import { oyelabsCourseInputSchema, oyelabsDraftDataSchema } from "../../../shared/oyelabsCourses";
import { TRACKING_FOR_KIND, VIDEO_SOURCE_KINDS } from "../../../shared/videoSources";
import { schema } from "../db";
import { newId, now } from "../lib/ids";
import { activeLearner, adminSession, as, createTestApp, type Session, type TestContext } from "../test/harness";
import { isCourseVisible, learnerVisibilityFacts, type LearnerVisibilityFacts } from "./visibility";

/**
 * v4.5 architecture contracts (docs/v4.5/PLAN.md). Builders extend their own test files; this one
 * pins what all four rely on: migration 0026 applies, the shared helpers, and the visibility rule.
 */

describe("shared contracts", () => {
  test("every video source has a tracking mode", () => {
    for (const kind of VIDEO_SOURCE_KINDS) expect(["exact", "estimated"]).toContain(TRACKING_FOR_KIND[kind]);
    expect(TRACKING_FOR_KIND.gdrive).toBe("estimated");
    expect(TRACKING_FOR_KIND.dropbox).toBe("exact");
  });

  test("summary line and citation labels read plainly", () => {
    expect(moduleTestSummaryLine(8, { docs: 3, videos: 2, notes: false })).toBe("8 questions created from 3 docs and 2 videos");
    expect(moduleTestSummaryLine(1, { docs: 1, videos: 0, notes: true })).toBe("1 question created from 1 doc and your notes");
    expect(moduleTestSummaryLine(6, { docs: 0, videos: 0, notes: false })).toBe("6 questions created from the course description");
    expect(citationLabel({ sourceTitle: "Onboarding.pdf", locator: { page: 3 } })).toBe("Onboarding.pdf, page 3");
    expect(citationLabel({ sourceTitle: "Kick-off call", locator: { startSec: 760 } })).toBe("Kick-off call, 12:40");
    expect(citationLabel({ sourceTitle: "Notes", locator: {} })).toBe("Notes");
  });

  test("a save needs a module and a link or upload per video; a draft does not", () => {
    const base = { title: "White-label projects", description: "", level: "beginner", departmentIds: [], skillIds: [] };
    expect(oyelabsCourseInputSchema.safeParse({ ...base, modules: [] }).success).toBe(false);
    expect(oyelabsCourseInputSchema.safeParse({ ...base, modules: [{ title: "Kick-off", videos: [{}], docs: [], notes: null }] }).success).toBe(false);
    expect(oyelabsCourseInputSchema.safeParse({ ...base, modules: [{ title: "Kick-off", videos: [{ url: "https://youtu.be/abc" }], docs: [], notes: null }] }).success).toBe(true);
    expect(oyelabsDraftDataSchema.parse({ modules: [{ title: "" }] }).modules[0]?.videos).toEqual([]);
  });
});

describe("visibility rule", () => {
  const facts = (over: Partial<LearnerVisibilityFacts> = {}): LearnerVisibilityFacts => ({
    departmentId: "engineering",
    assignedCourseIds: new Set(),
    ruleCourseIds: new Set(),
    courseDepartments: new Map(),
    ...over,
  });
  const course = { id: "c1", published: true, audience: "everyone" as const, departmentId: null };

  test("drafts are never visible; everyone-courses follow their departments", () => {
    expect(isCourseVisible({ ...course, published: false }, facts({ assignedCourseIds: new Set(["c1"]) }))).toBe(false);
    expect(isCourseVisible(course, facts())).toBe(true);
    expect(isCourseVisible(course, facts({ courseDepartments: new Map([["c1", new Set(["pm"])]]) }))).toBe(false);
    expect(isCourseVisible(course, facts({ courseDepartments: new Map([["c1", new Set(["pm", "engineering"])]]) }))).toBe(true);
    expect(isCourseVisible({ ...course, departmentId: "pm" }, facts())).toBe(false);
  });

  test("an assignment or a department rule wins over the audience", () => {
    const assigned = { ...course, audience: "assigned" as const };
    expect(isCourseVisible(assigned, facts())).toBe(false);
    expect(isCourseVisible(assigned, facts({ assignedCourseIds: new Set(["c1"]) }))).toBe(true);
    expect(isCourseVisible(assigned, facts({ ruleCourseIds: new Set(["c1"]) }))).toBe(true);
  });
});

describe("migration 0026 and the stubs", () => {
  let ctx: TestContext;
  let admin: Session;
  beforeEach(async () => {
    ctx = await createTestApp();
    admin = await adminSession(ctx);
  });
  afterEach(async () => {
    await ctx.close();
  });

  test("an Oyelabs course with a module, a video, a doc and a module test can be stored", async () => {
    const learner = await activeLearner(ctx, admin);
    const at = now();
    const courseId = newId();
    const sectionId = newId();
    const topicId = newId();
    const uploadId = newId();
    ctx.db.insert(schema.courses).values({ id: courseId, title: "White-label projects", oyelabs: true, published: true, createdAt: at, updatedAt: at }).run();
    ctx.db.insert(schema.courseDepartments).values({ courseId, departmentId: "engineering" }).run();
    ctx.db.insert(schema.courseDepartmentRules).values({ courseId, departmentId: "engineering", priority: "most_important", required: true, createdAt: at }).run();
    ctx.db.insert(schema.courseSections).values({ id: sectionId, courseId, title: "Kick-off", notes: { type: "doc", content: [] } }).run();
    ctx.db.insert(schema.courseTopics).values({ id: topicId, sectionId, courseId, title: "Kick-off", kind: "module" }).run();
    ctx.db.insert(schema.mediaUploads).values({ id: uploadId, kind: "doc", relPath: "2026/10/x.pdf", originalName: "Process.pdf", mime: "application/pdf", bytes: 10, sha256: "ab", createdAt: at }).run();
    ctx.db
      .insert(schema.courseVideos)
      .values({ id: newId(), courseId, sectionId, topicId, kind: "gdrive", playerKind: "iframe", tracking: "estimated", inputUrl: "https://drive.google.com/file/d/abc/view", createdAt: at, updatedAt: at })
      .run();
    ctx.db.insert(schema.courseDocs).values({ id: newId(), courseId, sectionId, source: "upload", uploadId, createdAt: at, updatedAt: at }).run();
    ctx.db.insert(schema.courseModuleTests).values({ sectionId, courseId, topicId, updatedAt: at }).run();
    ctx.db.insert(schema.videoProgress).values({ userId: learner.id, topicId, videoId: "v1", ranges: [], tracking: "estimated", activeSeconds: 42, updatedAt: at }).run();

    const facts = learnerVisibilityFacts(ctx.db, learner.id);
    expect(facts.ruleCourseIds.has(courseId)).toBe(true);
    expect(facts.courseDepartments.get(courseId)?.has("engineering")).toBe(true);
    const test = ctx.db.select().from(schema.courseModuleTests).all()[0];
    expect(test?.status).toBe("empty");
  });

  test("the Oyelabs routes are guarded", async () => {
    // Phase 1 (A) built the editor routes: an unknown course is a plain 404 now, not a 501 stub.
    const res = await ctx.app.inject({ method: "GET", url: "/api/admin/oyelabs/courses/x", ...as(admin) });
    expect(res.statusCode).toBe(404);
    const anon = await ctx.app.inject({ method: "GET", url: "/api/v5/oyelabs/lessons/x/playlist" });
    expect(anon.statusCode).toBe(401);
  });
});
