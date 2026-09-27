import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import {
  reorderRequestSchema,
  upsertCourseRequestSchema,
  upsertCourseTopicRequestSchema,
  upsertSectionRequestSchema,
  youtubeId,
} from "../../../../shared/courses";
import { requireStaff, staffOnly } from "../../auth/guards";
import { applyOrder, getCourse, listCourses, nextPosition } from "../../courses/repo";
import { schema } from "../../db";
import { writeAudit } from "../../lib/audit";
import { badRequest, notFound, parseOrThrow } from "../../lib/errors";
import { newId, now } from "../../lib/ids";

const courseParams = z.object({ courseId: z.string().min(1).max(64) });
const sectionParams = z.object({ sectionId: z.string().min(1).max(64) });
const topicParams = z.object({ topicId: z.string().min(1).max(64) });

/**
 * Authoring admin-written courses.
 *
 * Open to both staff roles: a course is content about how this company works, which is exactly the
 * kind of thing a department lead writes. Nothing here touches the AI credential or another
 * account, so there is no reason to hold it back to the superadmin.
 *
 * Everything is a small, whole-object write. There is no partial patching and no autosave: a course
 * is a handful of rows edited deliberately, and the failure mode of an autosaving editor — a
 * half-written lesson published because the author tabbed away — is worse than clicking Save.
 */
export async function registerAdminCourseRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", staffOnly);

  app.get("/api/admin/courses", async () => ({ courses: listCourses(app.db) }));

  app.get("/api/admin/courses/:courseId", async (request) => {
    const { courseId } = parseOrThrow(courseParams, request.params);
    const course = getCourse(app.db, courseId);
    if (!course) throw notFound("No such course.");
    return { course };
  });

  app.post("/api/admin/courses", async (request, reply) => {
    const actor = requireStaff(request);
    const body = parseOrThrow(upsertCourseRequestSchema, request.body);
    const id = newId();
    const timestamp = now();

    app.db
      .insert(schema.courses)
      .values({
        id,
        title: body.title,
        summary: body.summary,
        accent: body.accent,
        audience: body.audience,
        published: body.published,
        position: nextPosition(app.db, "courses"),
        createdBy: actor.id,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .run();

    writeAudit(app.db, {
      actorId: actor.id,
      action: "course.created",
      targetType: "course",
      targetId: id,
      details: { title: body.title, audience: body.audience },
    });
    reply.status(201);
    return { course: getCourse(app.db, id) };
  });

  app.put("/api/admin/courses/:courseId", async (request) => {
    const actor = requireStaff(request);
    const { courseId } = parseOrThrow(courseParams, request.params);
    const body = parseOrThrow(upsertCourseRequestSchema, request.body);

    const existing = app.db.select().from(schema.courses).where(eq(schema.courses.id, courseId)).get();
    if (!existing) throw notFound("No such course.");

    /* Publishing an empty course would put a card on every learner's dashboard that opens onto
       nothing. Caught here rather than in the form, because the form is not the only caller. */
    if (body.published) {
      const topics = app.db
        .select({ id: schema.courseTopics.id })
        .from(schema.courseTopics)
        .where(eq(schema.courseTopics.courseId, courseId))
        .all();
      if (topics.length === 0) throw badRequest("Add at least one lesson before publishing this course.");
    }

    app.db
      .update(schema.courses)
      .set({
        title: body.title,
        summary: body.summary,
        accent: body.accent,
        audience: body.audience,
        published: body.published,
        updatedAt: now(),
      })
      .where(eq(schema.courses.id, courseId))
      .run();

    // Publishing is the state change worth a line in the log; renaming is not.
    if (existing.published !== body.published) {
      writeAudit(app.db, {
        actorId: actor.id,
        action: body.published ? "course.published" : "course.unpublished",
        targetType: "course",
        targetId: courseId,
        details: { title: body.title, audience: body.audience },
      });
    }
    return { course: getCourse(app.db, courseId) };
  });

  app.delete("/api/admin/courses/:courseId", async (request) => {
    const actor = requireStaff(request);
    const { courseId } = parseOrThrow(courseParams, request.params);
    const existing = app.db.select().from(schema.courses).where(eq(schema.courses.id, courseId)).get();
    if (!existing) throw notFound("No such course.");

    // Sections, lessons, assignments and everyone's progress go with it — the foreign keys cascade.
    app.db.delete(schema.courses).where(eq(schema.courses.id, courseId)).run();
    writeAudit(app.db, {
      actorId: actor.id,
      action: "course.deleted",
      targetType: "course",
      targetId: courseId,
      details: { title: existing.title },
    });
    return { ok: true };
  });

  // -------------------------------------------------------------------------
  // Sections
  // -------------------------------------------------------------------------

  app.post("/api/admin/courses/:courseId/sections", async (request, reply) => {
    requireStaff(request);
    const { courseId } = parseOrThrow(courseParams, request.params);
    const body = parseOrThrow(upsertSectionRequestSchema, request.body);
    if (!app.db.select({ id: schema.courses.id }).from(schema.courses).where(eq(schema.courses.id, courseId)).get()) {
      throw notFound("No such course.");
    }

    const id = newId();
    app.db
      .insert(schema.courseSections)
      .values({ id, courseId, title: body.title, summary: body.summary, position: nextPosition(app.db, "sections", courseId) })
      .run();
    touch(app, courseId);
    reply.status(201);
    return { course: getCourse(app.db, courseId) };
  });

  app.put("/api/admin/courses/sections/:sectionId", async (request) => {
    requireStaff(request);
    const { sectionId } = parseOrThrow(sectionParams, request.params);
    const body = parseOrThrow(upsertSectionRequestSchema, request.body);
    const section = app.db.select().from(schema.courseSections).where(eq(schema.courseSections.id, sectionId)).get();
    if (!section) throw notFound("No such section.");

    app.db
      .update(schema.courseSections)
      .set({ title: body.title, summary: body.summary })
      .where(eq(schema.courseSections.id, sectionId))
      .run();
    touch(app, section.courseId);
    return { course: getCourse(app.db, section.courseId) };
  });

  app.delete("/api/admin/courses/sections/:sectionId", async (request) => {
    requireStaff(request);
    const { sectionId } = parseOrThrow(sectionParams, request.params);
    const section = app.db.select().from(schema.courseSections).where(eq(schema.courseSections.id, sectionId)).get();
    if (!section) throw notFound("No such section.");

    app.db.delete(schema.courseSections).where(eq(schema.courseSections.id, sectionId)).run();
    touch(app, section.courseId);
    return { course: getCourse(app.db, section.courseId) };
  });

  // -------------------------------------------------------------------------
  // Lessons
  // -------------------------------------------------------------------------

  app.post("/api/admin/courses/sections/:sectionId/topics", async (request, reply) => {
    requireStaff(request);
    const { sectionId } = parseOrThrow(sectionParams, request.params);
    const body = parseOrThrow(upsertCourseTopicRequestSchema, request.body);
    const section = app.db.select().from(schema.courseSections).where(eq(schema.courseSections.id, sectionId)).get();
    if (!section) throw notFound("No such section.");

    const id = newId();
    app.db
      .insert(schema.courseTopics)
      .values({
        id,
        sectionId,
        courseId: section.courseId,
        title: body.title,
        body: body.body,
        ...videoFields(body.video, body.videoTitle),
        links: body.links,
        estMinutes: body.estMinutes,
        position: nextPosition(app.db, "topics", sectionId),
      })
      .run();
    touch(app, section.courseId);
    reply.status(201);
    return { course: getCourse(app.db, section.courseId) };
  });

  app.put("/api/admin/courses/topics/:topicId", async (request) => {
    requireStaff(request);
    const { topicId } = parseOrThrow(topicParams, request.params);
    const body = parseOrThrow(upsertCourseTopicRequestSchema, request.body);
    const topic = app.db.select().from(schema.courseTopics).where(eq(schema.courseTopics.id, topicId)).get();
    if (!topic) throw notFound("No such lesson.");

    app.db
      .update(schema.courseTopics)
      .set({
        title: body.title,
        body: body.body,
        ...videoFields(body.video, body.videoTitle),
        links: body.links,
        estMinutes: body.estMinutes,
      })
      .where(eq(schema.courseTopics.id, topicId))
      .run();
    touch(app, topic.courseId);
    return { course: getCourse(app.db, topic.courseId) };
  });

  app.delete("/api/admin/courses/topics/:topicId", async (request) => {
    requireStaff(request);
    const { topicId } = parseOrThrow(topicParams, request.params);
    const topic = app.db.select().from(schema.courseTopics).where(eq(schema.courseTopics.id, topicId)).get();
    if (!topic) throw notFound("No such lesson.");

    app.db.delete(schema.courseTopics).where(eq(schema.courseTopics.id, topicId)).run();
    touch(app, topic.courseId);
    return { course: getCourse(app.db, topic.courseId) };
  });

  // -------------------------------------------------------------------------
  // Order and assignment
  // -------------------------------------------------------------------------

  app.post("/api/admin/courses/:courseId/sections/order", async (request) => {
    requireStaff(request);
    const { courseId } = parseOrThrow(courseParams, request.params);
    const { ids } = parseOrThrow(reorderRequestSchema, request.body);
    applyOrder(app.db, "sections", courseId, ids);
    touch(app, courseId);
    return { course: getCourse(app.db, courseId) };
  });

  app.post("/api/admin/courses/sections/:sectionId/topics/order", async (request) => {
    requireStaff(request);
    const { sectionId } = parseOrThrow(sectionParams, request.params);
    const { ids } = parseOrThrow(reorderRequestSchema, request.body);
    const section = app.db.select().from(schema.courseSections).where(eq(schema.courseSections.id, sectionId)).get();
    if (!section) throw notFound("No such section.");

    applyOrder(app.db, "topics", sectionId, ids);
    touch(app, section.courseId);
    return { course: getCourse(app.db, section.courseId) };
  });

  /** Who an `assigned` course is for. Ignored while its audience is `everyone`. */
  app.put("/api/admin/courses/:courseId/assignees", async (request) => {
    const actor = requireStaff(request);
    const { courseId } = parseOrThrow(courseParams, request.params);
    const { userIds } = parseOrThrow(z.object({ userIds: z.array(z.string().min(1).max(64)).max(500) }), request.body);

    const course = app.db.select().from(schema.courses).where(eq(schema.courses.id, courseId)).get();
    if (!course) throw notFound("No such course.");

    const learners = new Set(
      app.db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.role, "learner"))
        .all()
        .map((row) => row.id),
    );
    // Silently dropping an unknown id would make "I assigned them and nothing happened" the
    // failure, which is the hardest kind to notice.
    const unknown = userIds.filter((id) => !learners.has(id));
    if (unknown.length > 0) throw badRequest(`${unknown.length} of those are not learners.`);

    app.db.delete(schema.courseAssignments).where(eq(schema.courseAssignments.courseId, courseId)).run();
    const timestamp = now();
    for (const userId of userIds) {
      app.db
        .insert(schema.courseAssignments)
        .values({ courseId, userId, assignedBy: actor.id, assignedAt: timestamp })
        .run();
    }
    touch(app, courseId);
    return { assigned: userIds.length };
  });

  app.get("/api/admin/courses/:courseId/assignees", async (request) => {
    const { courseId } = parseOrThrow(courseParams, request.params);
    return {
      userIds: app.db
        .select({ userId: schema.courseAssignments.userId })
        .from(schema.courseAssignments)
        .where(eq(schema.courseAssignments.courseId, courseId))
        .all()
        .map((row) => row.userId),
    };
  });

  /** How far everyone has got, for the author. Counts, never who ticked what and when. */
  app.get("/api/admin/courses/:courseId/progress", async (request) => {
    const { courseId } = parseOrThrow(courseParams, request.params);
    const topics = app.db
      .select({ id: schema.courseTopics.id })
      .from(schema.courseTopics)
      .where(eq(schema.courseTopics.courseId, courseId))
      .all();

    const rows = app.db
      .select({ userId: schema.courseProgress.userId })
      .from(schema.courseProgress)
      .where(eq(schema.courseProgress.courseId, courseId))
      .all();

    const perLearner = new Map<string, number>();
    for (const row of rows) perLearner.set(row.userId, (perLearner.get(row.userId) ?? 0) + 1);

    const learners = app.db
      .select({ id: schema.users.id, displayName: schema.users.displayName, username: schema.users.username })
      .from(schema.users)
      .where(and(eq(schema.users.role, "learner"), eq(schema.users.status, "active")))
      .all();

    return {
      topicCount: topics.length,
      learners: learners.map((learner) => ({
        id: learner.id,
        displayName: learner.displayName,
        username: learner.username,
        completedCount: perLearner.get(learner.id) ?? 0,
      })),
    };
  });
}

/** Any edit to a course's contents moves its `updatedAt`, which is what the list sorts "recent" by. */
function touch(app: FastifyInstance, courseId: string): void {
  app.db.update(schema.courses).set({ updatedAt: now() }).where(eq(schema.courses.id, courseId)).run();
}

/**
 * Turns whatever the author pasted into the two stored columns.
 *
 * An unreadable value is rejected rather than stored: a lesson whose player points at nothing is a
 * worse outcome than a 400 while editing, and the author is right there to fix it.
 */
function videoFields(video: string | undefined, videoTitle: string | undefined) {
  if (!video || video.trim().length === 0) return { videoId: null, videoTitle: null };
  const id = youtubeId(video);
  if (!id) throw badRequest("That doesn't look like a YouTube link.", { video: "Paste a YouTube link or video id." });
  return { videoId: id, videoTitle: videoTitle?.trim() || null };
}
