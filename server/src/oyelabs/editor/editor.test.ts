import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import type { OyelabsCourseInput, OyelabsCourseView, OyelabsDraftView, SaveOyelabsCourseResponse } from "../../../../shared/oyelabsCourses";
import { schema } from "../../db";
import { newId, now } from "../../lib/ids";
import { activeLearner, adminSession, as, createTestApp, type Session, type TestContext } from "../../test/harness";
import { estimateModuleMinutes } from "./minutes";
import { notesToText } from "./repo";
import { suggestByWords } from "./skills";

/** v4.5 Phase 1 (A): the Oyelabs editor API (PLAN.md §4.1, tests §8 A). */

const notes = (text: string) => ({ type: "doc" as const, content: [{ type: "paragraph", content: [{ type: "text", text }] }] });

function twoModules(uploadId: string, over: Partial<OyelabsCourseInput> = {}): OyelabsCourseInput {
  return {
    title: "White-label delivery",
    description: "How we deliver white-label projects for agency partners.",
    level: "intermediate",
    departmentIds: ["pm"],
    skillIds: [],
    modules: [
      { title: "Kick-off", videos: [{ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }, { url: "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view" }], docs: [{ uploadId }], notes: notes("Agree the scope first.") },
      { title: "Handover", videos: [{ url: "https://vimeo.com/123456" }], docs: [{ url: "https://docs.google.com/document/d/xyz1234567/edit" }], notes: null },
    ],
    ...over,
  };
}

function queued(ctx: TestContext): { type: string; payload: Record<string, unknown> }[] {
  return ctx.db
    .select({ type: schema.jobs.type, payload: schema.jobs.payload })
    .from(schema.jobs)
    .all()
    .filter((j) => j.type.startsWith("oyelabs."))
    .map((j) => ({ type: j.type, payload: j.payload as Record<string, unknown> }));
}

describe("pure helpers", () => {
  test("module minutes: real lengths, unknown videos, docs and the test", () => {
    expect(estimateModuleMinutes([600, null], 2)).toBe(10 + 5 + 10 + 10);
    expect(estimateModuleMinutes([], 0)).toBe(10);
  });

  test("notes text keeps paragraphs and drops formatting", () => {
    const doc = { type: "doc" as const, content: [{ type: "paragraph", content: [{ type: "text", text: "One " }, { type: "text", text: "bold", marks: [{ type: "bold" }] }] }, { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Two" }] }] }] }] };
    expect(notesToText(doc)).toBe("One bold\n\nTwo");
    expect(notesToText(null)).toBe("");
  });

  test("skill words fallback matches names and aliases", () => {
    const out = suggestByWords({ title: "Sprint planning for agency projects", description: "", moduleTitles: ["Jira boards"], departmentIds: [] }, [
      { id: "a", name: "Sprint planning", area: "Delivery", aliases: [] },
      { id: "b", name: "Kubernetes", area: "Ops", aliases: ["k8s"] },
      { id: "c", name: "Issue tracking", area: "Tools", aliases: ["jira"] },
    ]);
    expect(out.skills.map((s) => s.skillId).sort()).toEqual(["a", "c"]);
  });
});

describe("Oyelabs editor API", () => {
  let ctx: TestContext;
  let admin: Session;
  let uploadId: string;

  beforeEach(async () => {
    ctx = await createTestApp();
    admin = await adminSession(ctx);
    uploadId = newId();
    ctx.db.insert(schema.mediaUploads).values({ id: uploadId, kind: "doc", relPath: "2026/10/p.pdf", originalName: "Process.pdf", mime: "application/pdf", bytes: 1200, sha256: "ab", createdAt: now() }).run();
  });
  afterEach(async () => {
    await ctx.close();
  });

  const save = async (body: object, courseId?: string) =>
    ctx.app.inject({ method: courseId ? "PUT" : "POST", url: courseId ? `/api/admin/oyelabs/courses/${courseId}` : "/api/admin/oyelabs/courses", ...as(admin), payload: body });
  const view = async (courseId: string): Promise<OyelabsCourseView> => (await ctx.app.inject({ method: "GET", url: `/api/admin/oyelabs/courses/${courseId}`, ...as(admin) })).json();
  const publish = async (course: OyelabsCourseInput, courseId?: string): Promise<SaveOyelabsCourseResponse> => {
    const res = await save({ course, action: "publish" }, courseId);
    expect(res.statusCode, res.body).toBe(courseId ? 200 : 201);
    return res.json();
  };
  /** The view back as editor input, ids included: what the page sends on the next Save. */
  const asInput = (v: OyelabsCourseView): OyelabsCourseInput => ({
    title: v.title,
    description: v.description,
    level: v.level,
    departmentIds: v.departmentIds,
    skillIds: v.skillIds,
    modules: v.modules.map((m) => ({
      id: m.id,
      title: m.title,
      videos: m.videos.map((x) => ({ id: x.id, ...(x.uploadId ? { uploadId: x.uploadId } : { url: x.input! }) })),
      docs: m.docs.map((x) => ({ id: x.id, ...(x.uploadId ? { uploadId: x.uploadId } : { url: x.url! }) })),
      notes: m.notes,
    })),
  });

  test("autosave: a half-typed draft round-trips and is validated loosely", async () => {
    const created = await ctx.app.inject({ method: "POST", url: "/api/admin/oyelabs/drafts", ...as(admin), payload: { courseId: null } });
    expect(created.statusCode).toBe(201);
    const draft = created.json<OyelabsDraftView>();
    expect(draft.data.modules).toEqual([]);

    const data = { title: "Wh", description: "", level: null, departmentIds: ["pm"], skillIds: [], modules: [{ key: "k1", title: "", videos: [{ url: "https://youtu.be/dQw4w9WgXcQ" }], docs: [], notes: null }] };
    const put = await ctx.app.inject({ method: "PUT", url: `/api/admin/oyelabs/drafts/${draft.id}`, ...as(admin), payload: { courseId: null, data } });
    expect(put.statusCode, put.body).toBe(200);
    const back = (await ctx.app.inject({ method: "GET", url: `/api/admin/oyelabs/drafts/${draft.id}`, ...as(admin) })).json<OyelabsDraftView>();
    expect(back.data.title).toBe("Wh");
    expect(back.data.modules[0]?.key).toBe("k1");
    expect(back.data.modules[0]?.videos[0]?.url).toBe("https://youtu.be/dQw4w9WgXcQ");

    const mine = (await ctx.app.inject({ method: "GET", url: "/api/admin/oyelabs/drafts", ...as(admin) })).json<{ drafts: { id: string; title: string }[] }>();
    expect(mine.drafts.map((d) => d.id)).toEqual([draft.id]);

    const bad = await ctx.app.inject({ method: "PUT", url: `/api/admin/oyelabs/drafts/${draft.id}`, ...as(admin), payload: { courseId: null, data: { ...data, level: "wizard" } } });
    expect(bad.statusCode).toBe(400);
    expect((await ctx.app.inject({ method: "DELETE", url: `/api/admin/oyelabs/drafts/${draft.id}`, ...as(admin) })).statusCode).toBe(200);
    expect((await ctx.app.inject({ method: "GET", url: `/api/admin/oyelabs/drafts/${draft.id}`, ...as(admin) })).statusCode).toBe(404);
  });

  test("publish creates the course, sections, one managed lesson per module, videos and docs in order", async () => {
    const r = await publish(twoModules(uploadId));
    expect(r.published).toBe(true);
    expect(r.version).toBe(1);
    const course = ctx.db.select().from(schema.courses).where(eq(schema.courses.id, r.courseId)).get()!;
    expect(course).toMatchObject({ oyelabs: true, published: true, publishedVersion: 1, audience: "everyone", departmentId: null, level: "intermediate" });
    expect(ctx.db.select().from(schema.courseDepartments).where(eq(schema.courseDepartments.courseId, r.courseId)).all().map((d) => d.departmentId)).toEqual(["pm"]);

    const v = await view(r.courseId);
    expect(v.modules.map((m) => m.title)).toEqual(["Kick-off", "Handover"]);
    for (const m of v.modules) {
      const topics = ctx.db.select().from(schema.courseTopics).where(eq(schema.courseTopics.sectionId, m.id)).all();
      expect(topics).toHaveLength(1);
      expect(topics[0]).toMatchObject({ id: m.topicId, kind: "module", title: m.title });
    }
    expect(v.modules[0]!.videos.map((x) => [x.position, x.kind, x.status])).toEqual([
      [0, "youtube", "pending"],
      [1, "gdrive", "pending"],
    ]);
    expect(v.modules[0]!.docs[0]).toMatchObject({ position: 0, source: "upload", title: "Process.pdf", mime: "application/pdf" });
    expect(v.modules[1]!.docs[0]).toMatchObject({ source: "link", url: "https://docs.google.com/document/d/xyz1234567/edit", linkKind: "gdoc" });
    const section = ctx.db.select().from(schema.courseSections).where(eq(schema.courseSections.id, v.modules[0]!.id)).get()!;
    expect(section.notesText).toBe("Agree the scope first.");
    // 2 unknown videos (5 + 5) + 1 doc (5) + the test (10).
    expect(ctx.db.select().from(schema.courseTopics).where(eq(schema.courseTopics.id, v.modules[0]!.topicId)).get()!.estMinutes).toBe(25);
    expect(r.regenerating.sort()).toEqual(v.modules.map((m) => m.id).sort());
  });

  test("validation messages are plain", async () => {
    const noTitle = await save({ course: twoModules(uploadId, { modules: [{ title: "", videos: [], docs: [], notes: null }] }), action: "publish" });
    expect(noTitle.statusCode).toBe(400);
    expect(noTitle.json().error.message).toBe("Module 1 needs a title of at least 2 letters.");

    const noLink = await save({ course: twoModules(uploadId, { modules: [{ title: "Kick-off", videos: [{}], docs: [], notes: null }] }), action: "publish" });
    expect(noLink.statusCode).toBe(400);
    expect(noLink.json().error.message).toBe("Module 1, video 1: paste a link or upload a file.");

    const noModules = await save({ course: twoModules(uploadId, { modules: [] }), action: "draft" });
    expect(noModules.json().error.message).toBe("Add at least one module.");

    const lostUpload = await save({ course: twoModules("gone"), action: "publish" });
    expect(lostUpload.statusCode).toBe(400);
    expect(lostUpload.json().error.message).toBe("Module 1: an uploaded document isn't on the server any more. Upload it again.");
  });

  test("editing keeps lesson, video and doc ids and learners' progress; versions only when something changed", async () => {
    const learner = await activeLearner(ctx, admin);
    const r = await publish(twoModules(uploadId));
    const v1 = await view(r.courseId);
    const m1 = v1.modules[0]!;
    ctx.db.insert(schema.courseProgress).values({ userId: learner.id, topicId: m1.topicId, courseId: r.courseId, completedAt: now() }).run();
    ctx.db.insert(schema.videoProgress).values({ userId: learner.id, topicId: m1.topicId, videoId: m1.videos[0]!.id, ranges: [[0, 30]], updatedAt: now() }).run();

    // The same content again: no new version.
    const same = await publish(asInput(v1), r.courseId);
    expect(same.version).toBe(1);

    const edited = asInput(v1);
    edited.title = "White-label delivery, 2026";
    edited.modules[1]!.docs[0] = { id: edited.modules[1]!.docs[0]!.id, url: "https://docs.google.com/document/d/new1234567/edit" };
    const r2 = await publish(edited, r.courseId);
    expect(r2.version).toBe(2);
    const v2 = await view(r.courseId);
    expect(v2.modules.map((m) => [m.id, m.topicId])).toEqual(v1.modules.map((m) => [m.id, m.topicId]));
    expect(v2.modules[0]!.videos.map((x) => x.id)).toEqual(m1.videos.map((x) => x.id));
    expect(v2.modules[1]!.docs[0]!.id).toBe(v1.modules[1]!.docs[0]!.id);
    expect(ctx.db.select().from(schema.courseProgress).where(eq(schema.courseProgress.userId, learner.id)).all()).toHaveLength(1);
    expect(ctx.db.select().from(schema.videoProgress).where(eq(schema.videoProgress.userId, learner.id)).all()).toHaveLength(1);
    // The description is unchanged, so only module 2 (its doc changed) is regenerating.
    expect(r2.regenerating).toEqual([v1.modules[1]!.id]);
    expect(ctx.db.select().from(schema.courses).where(eq(schema.courses.id, r.courseId)).get()!.publishedVersion).toBe(2);
  });

  test("removing a module removes only its lesson", async () => {
    const learner = await activeLearner(ctx, admin);
    const r = await publish(twoModules(uploadId));
    const v1 = await view(r.courseId);
    for (const m of v1.modules) ctx.db.insert(schema.courseProgress).values({ userId: learner.id, topicId: m.topicId, courseId: r.courseId, completedAt: now() }).run();
    const input = asInput(v1);
    input.modules = [input.modules[0]!];
    await publish(input, r.courseId);
    const topics = ctx.db.select().from(schema.courseTopics).where(eq(schema.courseTopics.courseId, r.courseId)).all();
    expect(topics.map((t) => t.id)).toEqual([v1.modules[0]!.topicId]);
    expect(ctx.db.select().from(schema.courseProgress).where(eq(schema.courseProgress.userId, learner.id)).all().map((p) => p.topicId)).toEqual([v1.modules[0]!.topicId]);
    expect(ctx.db.select().from(schema.courseVideos).where(eq(schema.courseVideos.courseId, r.courseId)).all()).toHaveLength(2);
  });

  test("departments decide visibility; drafts are invisible; mayOpenCourse respects departments", async () => {
    const pmLearner = await activeLearner(ctx, admin, "pm.learner");
    const engLearner = await activeLearner(ctx, admin, "eng.learner");
    ctx.db.update(schema.learnerProfiles).set({ departmentId: "pm" }).where(eq(schema.learnerProfiles.userId, pmLearner.id)).run();
    ctx.db.update(schema.learnerProfiles).set({ departmentId: "engineering" }).where(eq(schema.learnerProfiles.userId, engLearner.id)).run();

    const library = async (s: Session) => (await ctx.app.inject({ method: "GET", url: "/api/v5/me/library", ...as(s) })).json<{ items: { id: string; oyelabs?: true }[] }>();
    const opens = async (s: { session: Session }, courseId: string) => (await ctx.app.inject({ method: "GET", url: `/api/me/courses/${courseId}`, ...as(s.session) })).statusCode;

    const r = await publish(twoModules(uploadId));
    expect((await library(pmLearner.session)).items.find((i) => i.id === r.courseId)?.oyelabs).toBe(true);
    expect((await library(engLearner.session)).items.some((i) => i.id === r.courseId)).toBe(false);
    expect(await opens(pmLearner, r.courseId)).toBe(200);
    expect(await opens(engLearner, r.courseId)).toBe(404);
    const detail = await ctx.app.inject({ method: "GET", url: `/api/v5/me/library/${r.courseId}`, ...as(pmLearner.session) });
    expect(detail.json().course.oyelabs).toBe(true);
    expect(detail.json().course.syllabus[0].lessons[0].hasVideo).toBe(true);

    // "All departments": everyone sees it.
    const all = asInput(await view(r.courseId));
    all.departmentIds = [];
    await publish(all, r.courseId);
    expect(await opens(engLearner, r.courseId)).toBe(200);

    // Save as draft hides it again.
    const res = await save({ course: all, action: "draft" }, r.courseId);
    expect(res.json().published).toBe(false);
    expect(await opens(pmLearner, r.courseId)).toBe(404);
    expect((await library(pmLearner.session)).items.some((i) => i.id === r.courseId)).toBe(false);
  });

  test("jobs: a draft queues only link checks; publish queues tests, text, transcripts and the embedding", async () => {
    const draft = await save({ course: twoModules(uploadId), action: "draft" });
    expect(draft.statusCode).toBe(201);
    const afterDraft = queued(ctx);
    expect(new Set(afterDraft.map((j) => j.type))).toEqual(new Set(["oyelabs.link.check"]));
    // 3 video links + 1 doc link; the uploaded doc needs no check.
    expect(afterDraft).toHaveLength(4);

    const courseId = draft.json<SaveOyelabsCourseResponse>().courseId;
    ctx.db.delete(schema.jobs).run();
    await publish(asInput(await view(courseId)), courseId);
    const jobs = queued(ctx);
    const count = (type: string) => jobs.filter((j) => j.type === type).length;
    expect(count("oyelabs.link.check")).toBe(0); // nothing changed since the draft's checks
    expect(count("oyelabs.module_test.generate")).toBe(2);
    expect(count("oyelabs.transcribe")).toBe(3);
    expect(count("oyelabs.course.embed")).toBe(1);
    // 2 docs + notes for both modules + the description for both modules.
    expect(count("oyelabs.text.extract")).toBe(2 + 2 + 2);
    expect(jobs.find((j) => j.type === "oyelabs.module_test.generate")?.payload.reason).toBe("publish");
  });

  test("skill suggest returns real catalog skills (mock AI), and words when no AI is connected", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: "/api/admin/oyelabs/skills/suggest",
      ...as(admin),
      payload: { title: "Sprint planning for white-label projects", description: "Running sprints with the client.", moduleTitles: ["Kick-off"], departmentIds: ["pm"] },
    });
    expect(res.statusCode, res.body).toBe(200);
    const skills = res.json<{ skills: { skillId: string; name: string }[] }>().skills;
    const known = new Set(ctx.db.select({ id: schema.skills.id }).from(schema.skills).all().map((s) => s.id));
    for (const s of skills) expect(known.has(s.skillId)).toBe(true);
    expect(ctx.db.select().from(schema.aiCalls).all().some((c) => c.task === "course_skill_suggest")).toBe(true);

    const offline = await createTestApp({}, { noAi: true });
    try {
      const offAdmin = await adminSession(offline);
      const out = await offline.app.inject({
        method: "POST",
        url: "/api/admin/oyelabs/skills/suggest",
        ...as(offAdmin),
        payload: { title: "Sprint planning", description: "", moduleTitles: [], departmentIds: ["pm"] },
      });
      expect(out.statusCode).toBe(200);
      expect(out.json().skills.length).toBeGreaterThan(0);
    } finally {
      await offline.close();
    }
  });

  test("the admin library flags Oyelabs courses; restoring a version opens a draft", async () => {
    const r = await publish(twoModules(uploadId));
    const lib = (await ctx.app.inject({ method: "GET", url: "/api/admin/v5/library", ...as(admin) })).json<{ courses: { id: string; oyelabs: boolean; departmentIds: string[] }[] }>();
    expect(lib.courses.find((c) => c.id === r.courseId)).toMatchObject({ oyelabs: true, departmentIds: ["pm"] });

    const edited = asInput(await view(r.courseId));
    edited.title = "Renamed";
    await publish(edited, r.courseId);
    const restored = await ctx.app.inject({ method: "POST", url: `/api/admin/v5/courses/${r.courseId}/versions/1/restore`, ...as(admin), payload: {} });
    expect(restored.statusCode, restored.body).toBe(200);
    const draftId = restored.json<{ draftId: string }>().draftId;
    const draft = (await ctx.app.inject({ method: "GET", url: `/api/admin/oyelabs/drafts/${draftId}`, ...as(admin) })).json<OyelabsDraftView>();
    expect(draft.data.title).toBe("White-label delivery");
    // The live course is untouched until the draft is saved; the editor sees the newer draft.
    expect((await view(r.courseId)).title).toBe("Renamed");
    expect((await view(r.courseId)).draft?.id).toBe(draftId);
    expect(ctx.db.select().from(schema.courseDrafts).where(and(eq(schema.courseDrafts.id, draftId), eq(schema.courseDrafts.courseId, r.courseId))).get()).toBeTruthy();
  });

  test("learners can't use the editor API", async () => {
    const learner = await activeLearner(ctx, admin);
    const res = await ctx.app.inject({ method: "POST", url: "/api/admin/oyelabs/drafts", ...as(learner.session), payload: { courseId: null } });
    expect(res.statusCode).toBe(403);
  });
});
