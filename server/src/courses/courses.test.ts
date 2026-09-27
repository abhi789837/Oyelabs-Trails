import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";

import { youtubeId } from "../../../shared/courses";
import { schema } from "../db";
import { activeLearner, adminSession, as, createTestApp, type Session, type TestContext } from "../test/harness";

let ctx: TestContext;
let admin: Session;
let learner: { id: string; username: string; session: Session };
let other: { id: string; username: string; session: Session };

/**
 * Admin-authored courses.
 *
 * The thing these tests are really about is visibility. A course is the one kind of content that is
 * not gated by a learning plan, so the rules about who sees what are written here rather than
 * inherited from the plan machinery — and a draft that leaks, or a company-wide course that somehow
 * needs backfilling for each new hire, are both failures nobody would notice from the UI.
 */
beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  learner = await activeLearner(ctx, admin, "priya.sharma");
  other = await activeLearner(ctx, admin, "arjun.mehta");
});

async function makeCourse(overrides: Record<string, unknown> = {}) {
  const res = await ctx.app.inject({
    method: "POST",
    url: "/api/admin/courses",
    ...as(admin),
    payload: { title: "Incident response", summary: "How we handle an outage", ...overrides },
  });
  expect(res.statusCode).toBe(201);
  return res.json().course as { id: string };
}

async function addLesson(courseId: string, payload: Record<string, unknown> = {}) {
  const section = await ctx.app.inject({
    method: "POST",
    url: `/api/admin/courses/${courseId}/sections`,
    ...as(admin),
    payload: { title: "Getting started" },
  });
  const sectionId = section.json().course.sections.at(-1).id;
  const res = await ctx.app.inject({
    method: "POST",
    url: `/api/admin/courses/sections/${sectionId}/topics`,
    ...as(admin),
    payload: { title: "Who to call", body: "Ring the on-call engineer.", ...payload },
  });
  expect(res.statusCode).toBe(201);
  return { sectionId, course: res.json().course };
}

function publish(courseId: string, extra: Record<string, unknown> = {}) {
  return ctx.app.inject({
    method: "PUT",
    url: `/api/admin/courses/${courseId}`,
    ...as(admin),
    payload: { title: "Incident response", summary: "How we handle an outage", published: true, ...extra },
  });
}

describe("authoring", () => {
  test("a course starts unpublished and invisible to learners", async () => {
    const course = await makeCourse();
    await addLesson(course.id);

    const mine = await ctx.app.inject({ method: "GET", url: "/api/me/courses", ...as(learner.session) });
    expect(mine.json().courses).toEqual([]);

    // Not a 403 — whether a draft exists is not something a learner should be able to probe for.
    const direct = await ctx.app.inject({ method: "GET", url: `/api/me/courses/${course.id}`, ...as(learner.session) });
    expect(direct.statusCode).toBe(404);
  });

  test("an empty course cannot be published", async () => {
    const course = await makeCourse();
    const res = await publish(course.id);
    expect(res.statusCode).toBe(400);
    expect(res.json().error.message).toMatch(/at least one lesson/i);
    expect(ctx.db.select().from(schema.courses).where(eq(schema.courses.id, course.id)).get()!.published).toBe(false);
  });

  test("a video is stored as an id, whatever shape the link was pasted in", async () => {
    const course = await makeCourse();
    const { course: withLesson } = await addLesson(course.id, {
      video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s",
    });
    expect(withLesson.sections[0].topics[0].videoId).toBe("dQw4w9WgXcQ");
  });

  test("an unreadable video is refused rather than stored", async () => {
    const course = await makeCourse();
    const section = await ctx.app.inject({
      method: "POST",
      url: `/api/admin/courses/${course.id}/sections`,
      ...as(admin),
      payload: { title: "Section" },
    });
    const sectionId = section.json().course.sections[0].id;

    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/admin/courses/sections/${sectionId}/topics`,
      ...as(admin),
      payload: { title: "Lesson", video: "https://vimeo.com/12345" },
    });
    expect(res.statusCode).toBe(400);
    // A lesson whose player points at nothing is worse than a 400 while the author is right there.
    expect(ctx.db.select().from(schema.courseTopics).all()).toHaveLength(0);
  });

  test("deleting a course takes its lessons and everyone's progress with it", async () => {
    const course = await makeCourse();
    const { course: withLesson } = await addLesson(course.id);
    await publish(course.id);
    const topicId = withLesson.sections[0].topics[0].id;
    await ctx.app.inject({
      method: "POST",
      url: `/api/me/courses/topics/${topicId}/complete`,
      ...as(learner.session),
      payload: { done: true },
    });
    expect(ctx.db.select().from(schema.courseProgress).all()).toHaveLength(1);

    await ctx.app.inject({ method: "DELETE", url: `/api/admin/courses/${course.id}`, ...as(admin) });
    expect(ctx.db.select().from(schema.courseTopics).all()).toHaveLength(0);
    expect(ctx.db.select().from(schema.courseProgress).all()).toHaveLength(0);
  });
});

describe("who sees a course", () => {
  test("an `everyone` course reaches a learner onboarded after it was published", async () => {
    /* The reason `everyone` has no assignment rows: a per-learner row would have to be backfilled
       on every onboarding, and the first person hired afterwards would quietly not have it. */
    const course = await makeCourse({ audience: "everyone" });
    await addLesson(course.id);
    await publish(course.id, { audience: "everyone" });

    const latecomer = await activeLearner(ctx, admin, "sofia.reyes");
    const mine = await ctx.app.inject({ method: "GET", url: "/api/me/courses", ...as(latecomer.session) });
    expect(mine.json().courses.map((c: { id: string }) => c.id)).toContain(course.id);
  });

  test("an `assigned` course reaches only the people on it", async () => {
    const course = await makeCourse({ audience: "assigned" });
    await addLesson(course.id);
    await publish(course.id, { audience: "assigned" });
    await ctx.app.inject({
      method: "PUT",
      url: `/api/admin/courses/${course.id}/assignees`,
      ...as(admin),
      payload: { userIds: [learner.id] },
    });

    const mine = await ctx.app.inject({ method: "GET", url: "/api/me/courses", ...as(learner.session) });
    expect(mine.json().courses.map((c: { id: string }) => c.id)).toContain(course.id);

    const theirs = await ctx.app.inject({ method: "GET", url: "/api/me/courses", ...as(other.session) });
    expect(theirs.json().courses).toEqual([]);
    expect(
      (await ctx.app.inject({ method: "GET", url: `/api/me/courses/${course.id}`, ...as(other.session) })).statusCode,
    ).toBe(404);
  });

  test("assigning someone who is not a learner is refused, not silently dropped", async () => {
    const course = await makeCourse({ audience: "assigned" });
    const res = await ctx.app.inject({
      method: "PUT",
      url: `/api/admin/courses/${course.id}/assignees`,
      ...as(admin),
      payload: { userIds: [admin.user.id] },
    });
    expect(res.statusCode).toBe(400);
    expect(ctx.db.select().from(schema.courseAssignments).all()).toHaveLength(0);
  });
});

describe("progress", () => {
  test("ticking a lesson is idempotent, and un-ticking removes it", async () => {
    const course = await makeCourse();
    const { course: withLesson } = await addLesson(course.id);
    await publish(course.id);
    const topicId = withLesson.sections[0].topics[0].id;
    const url = `/api/me/courses/topics/${topicId}/complete`;

    await ctx.app.inject({ method: "POST", url, ...as(learner.session), payload: { done: true } });
    const twice = await ctx.app.inject({ method: "POST", url, ...as(learner.session), payload: { done: true } });
    expect(twice.statusCode).toBe(200);
    expect(twice.json().completedTopicIds).toEqual([topicId]);

    const undone = await ctx.app.inject({ method: "POST", url, ...as(learner.session), payload: { done: false } });
    expect(undone.json().completedTopicIds).toEqual([]);
  });

  test("one learner's progress is their own", async () => {
    const course = await makeCourse();
    const { course: withLesson } = await addLesson(course.id);
    await publish(course.id);
    const topicId = withLesson.sections[0].topics[0].id;

    await ctx.app.inject({
      method: "POST",
      url: `/api/me/courses/topics/${topicId}/complete`,
      ...as(learner.session),
      payload: { done: true },
    });

    const theirs = await ctx.app.inject({ method: "GET", url: "/api/me/courses", ...as(other.session) });
    expect(theirs.json().courses[0].completedCount).toBe(0);
  });

  test("a learner cannot tick a lesson in a course they cannot open", async () => {
    const course = await makeCourse({ audience: "assigned" });
    const { course: withLesson } = await addLesson(course.id);
    await publish(course.id, { audience: "assigned" });
    const topicId = withLesson.sections[0].topics[0].id;

    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/me/courses/topics/${topicId}/complete`,
      ...as(other.session),
      payload: { done: true },
    });
    expect(res.statusCode).toBe(404);
    expect(ctx.db.select().from(schema.courseProgress).all()).toHaveLength(0);
  });
});

describe("youtubeId", () => {
  test.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ?start=30", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ])("reads %s", (input, expected) => {
    expect(youtubeId(input)).toBe(expected);
  });

  test.each([["https://vimeo.com/12345"], ["not a url"], [""], ["https://www.youtube.com/watch?v=short"]])(
    "refuses %s",
    (input) => {
      expect(youtubeId(input)).toBeNull();
    },
  );
});
