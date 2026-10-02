import { and, desc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { learnerPrioritiesSchema } from "../../../../shared/builder";
import { targetsRequestSchema } from "../../../../shared/targets";
import { requireStaff, requireSuperadmin, staffOnly } from "../../auth/guards";
import { coursesWithDeadLinks } from "../../jobs/handlers/checkLinks";
import { currentPath, getPriorities, listGaps, setPriorities } from "../../builder/repo";
import { getResearchSettings, updateResearchSettings } from "../../builder/settings";
import { activeWeek } from "../../plans/weekly/repo";
import { getFocus, setFocus, setTargets } from "../../targets/repo";
import { schema } from "../../db";
import { enqueue } from "../../jobs/queue";
import { writeAudit } from "../../lib/audit";
import { badRequest, notFound, parseOrThrow } from "../../lib/errors";
import { now } from "../../lib/ids";

const userParams = z.object({ userId: z.string().min(1).max(64) });
const courseParams = z.object({ courseId: z.string().min(1).max(64) });

/**
 * The admin side of the course builder.
 *
 * Mostly staff-open, because everything here is about one learner. The exception is the research
 * keys: those are shared by the whole deployment and reach outside it, so they sit with the
 * superadmin beside the AI credential for exactly the same reason.
 */
export async function registerAdminBuilderRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", staffOnly);

  // -------------------------------------------------------------------------
  // Priorities and the gap map
  // -------------------------------------------------------------------------

  app.get("/api/admin/users/:userId/priorities", async (request) => {
    const { userId } = parseOrThrow(userParams, request.params);
    return { priorities: getPriorities(app.db, userId) };
  });

  app.put("/api/admin/users/:userId/priorities", async (request) => {
    const actor = requireStaff(request);
    const { userId } = parseOrThrow(userParams, request.params);
    const priorities = parseOrThrow(learnerPrioritiesSchema, request.body);

    const user = app.db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, userId)).get();
    if (!user) throw notFound("No such person.");

    /* Read before the write, so the comparison is against what was actually there. The week is built
       from exactly these fields, so a change to any of them makes the current week out of date — and
       that is worth *saying*, rather than silently rebuilding somebody's week under them mid-Tuesday. */
    const previous = getPriorities(app.db, userId);
    setPriorities(app.db, userId, priorities, actor.id);

    writeAudit(app.db, {
      actorId: actor.id,
      action: "priorities.updated",
      targetType: "user",
      targetId: userId,
      // Counts and the role, never the notes: the audit log is not a second copy of the profile.
      details: {
        targetRole: priorities.targetRole,
        mustHave: priorities.mustHave.length,
        cap: priorities.courseCap,
        hoursPerWeek: priorities.hoursPerWeek,
      },
    });

    const changesTheWeek =
      previous.hoursPerWeek !== priorities.hoursPerWeek ||
      previous.daysPerWeek !== priorities.daysPerWeek ||
      previous.weekStartsMonday !== priorities.weekStartsMonday ||
      JSON.stringify(previous.mustHave) !== JSON.stringify(priorities.mustHave) ||
      JSON.stringify(previous.skip) !== JSON.stringify(priorities.skip);

    return {
      priorities,
      /** True when their current week no longer reflects these priorities. The UI offers a rebuild. */
      weekNeedsRegeneration: changesTheWeek && activeWeek(app.db, userId) !== null,
    };
  });

  // -------------------------------------------------------------------------
  // Targets: the track, the stack and the prioritised list
  // -------------------------------------------------------------------------

  /**
   * What this person is being trained for.
   *
   * Separate from `/priorities`, which it is replacing: that endpoint still serves the course
   * builder's own settings (the cap, auto-publish, the weekly budget), and splitting them means the
   * onboarding form and the builder settings stop overwriting each other's fields.
   */
  app.get("/api/admin/users/:userId/targets", async (request) => {
    const { userId } = parseOrThrow(userParams, request.params);
    return { focus: getFocus(app.db, userId) };
  });

  app.put("/api/admin/users/:userId/targets", async (request) => {
    const actor = requireStaff(request);
    const { userId } = parseOrThrow(userParams, request.params);
    const body = parseOrThrow(targetsRequestSchema, request.body);

    const user = app.db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, userId)).get();
    if (!user) throw notFound("No such person.");

    setFocus(app.db, userId, {
      track: body.track,
      stack: body.stack,
      yearsExperience: body.yearsExperience,
      selfLevel: body.selfLevel,
    }, actor.id);
    const targets = setTargets(app.db, userId, body.targets);

    /* The skip list and the weekly budget still live on `learner_priorities`, so the form's copies of
       them are written through. One form, two tables, and the admin should not have to know that. */
    const priorities = getPriorities(app.db, userId);
    setPriorities(app.db, userId, { ...priorities, skip: body.skip, hoursPerWeek: body.hoursPerWeek }, actor.id);

    writeAudit(app.db, {
      actorId: actor.id,
      action: "targets.updated",
      targetType: "user",
      targetId: userId,
      // The shape, never the skills themselves: the audit log is not a second copy of the profile.
      details: {
        track: body.track,
        targets: targets.length,
        high: targets.filter((target) => target.priority === "high").length,
        hoursPerWeek: body.hoursPerWeek,
      },
    });

    return { focus: getFocus(app.db, userId), weekNeedsRegeneration: activeWeek(app.db, userId) !== null };
  });

  app.get("/api/admin/users/:userId/gaps", async (request) => {
    const { userId } = parseOrThrow(userParams, request.params);
    return { gaps: listGaps(app.db, userId), path: currentPath(app.db, userId) };
  });

  /** Runs the builder now, rather than waiting for the next evaluation. */
  app.post("/api/admin/users/:userId/path", async (request, reply) => {
    const actor = requireStaff(request);
    const { userId } = parseOrThrow(userParams, request.params);

    const user = app.db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
    if (!user) throw notFound("No such person.");
    if (user.role !== "learner") throw badRequest("Only learners have a learning path.");

    /* One run at a time. Two concurrent runs would both call `makeCurrent` and the learner would
       end up on whichever finished last, with the other's courses orphaned on a superseded path. */
    const running = app.db
      .select({ id: schema.jobs.id })
      .from(schema.jobs)
      .where(and(eq(schema.jobs.type, "path.build"), eq(schema.jobs.status, "running")))
      .all();
    if (running.length > 0) throw badRequest("A path is already being built. Wait for it to finish.");

    const jobId = enqueue(app.db, { type: "path.build", payload: { userId } });
    writeAudit(app.db, { actorId: actor.id, action: "path.requested", targetType: "user", targetId: userId });
    reply.status(202);
    return { jobId };
  });

  // -------------------------------------------------------------------------
  // Generated courses
  // -------------------------------------------------------------------------

  app.get("/api/admin/generated-courses", async () => {
    const rows = app.db
      .select()
      .from(schema.generatedCourses)
      .orderBy(desc(schema.generatedCourses.createdAt))
      .all();
    if (rows.length === 0) return { courses: [] };

    const dead = coursesWithDeadLinks(app.db);

    return {
      courses: rows.map((row) => {
        const course = app.db.select().from(schema.courses).where(eq(schema.courses.id, row.courseId)).get();
        const learner = row.userId
          ? app.db
              .select({ displayName: schema.users.displayName })
              .from(schema.users)
              .where(eq(schema.users.id, row.userId))
              .get()
          : undefined;
        const topics = app.db
          .select({ id: schema.courseTopics.id })
          .from(schema.courseTopics)
          .where(eq(schema.courseTopics.courseId, row.courseId))
          .all();

        return {
          courseId: row.courseId,
          title: course?.title ?? "(deleted)",
          summary: course?.summary ?? "",
          departmentId: course?.departmentId ?? null,
          skill: row.skill,
          scope: row.scope,
          status: row.status,
          reviewScore: row.reviewScore,
          promptVersion: row.promptVersion,
          learnerName: learner?.displayName ?? null,
          topicCount: topics.length,
          deadLinks: dead.get(row.courseId) ?? 0,
          published: course?.published ?? false,
          createdAt: row.createdAt,
        };
      }),
    };
  });

  app.get("/api/admin/generated-courses/:courseId", async (request) => {
    const { courseId } = parseOrThrow(courseParams, request.params);
    const row = app.db.select().from(schema.generatedCourses).where(eq(schema.generatedCourses.courseId, courseId)).get();
    if (!row) throw notFound("That course was not generated.");

    const sources = app.db.select().from(schema.courseSources).where(eq(schema.courseSources.courseId, courseId)).all();
    const audit = app.db
      .select()
      .from(schema.aiAuditLog)
      .where(eq(schema.aiAuditLog.courseId, courseId))
      .orderBy(desc(schema.aiAuditLog.createdAt))
      .all();

    return { generated: row, sources, audit };
  });

  /**
   * Approve or reject.
   *
   * Approving publishes; rejecting unpublishes rather than deleting. A rejected course is evidence
   * about the generator that the next person tuning a prompt will want, and deleting it throws that
   * away to save a few kilobytes.
   */
  app.post("/api/admin/generated-courses/:courseId/decision", async (request) => {
    const actor = requireStaff(request);
    const { courseId } = parseOrThrow(courseParams, request.params);
    const { decision } = parseOrThrow(z.object({ decision: z.enum(["approve", "reject"]) }), request.body);

    const row = app.db.select().from(schema.generatedCourses).where(eq(schema.generatedCourses.courseId, courseId)).get();
    if (!row) throw notFound("That course was not generated.");

    const approved = decision === "approve";
    app.db
      .update(schema.generatedCourses)
      .set({
        status: approved ? "published" : "rejected",
        approvedBy: actor.id,
        approvedAt: now(),
      })
      .where(eq(schema.generatedCourses.courseId, courseId))
      .run();
    app.db.update(schema.courses).set({ published: approved }).where(eq(schema.courses.id, courseId)).run();

    writeAudit(app.db, {
      actorId: actor.id,
      action: approved ? "course.approved" : "course.rejected",
      targetType: "course",
      targetId: courseId,
      details: { skill: row.skill, reviewScore: row.reviewScore },
    });
    return { ok: true };
  });

  /**
   * Promotes a generated course into the catalogue.
   *
   * Two changes, and both matter: the scope becomes global so the matcher may offer it to anyone,
   * and the audience becomes `everyone` so it is visible without an assignment row. Promoting
   * without the second would put a course in the catalogue that nobody could open.
   */
  app.post("/api/admin/generated-courses/:courseId/promote", async (request) => {
    const actor = requireStaff(request);
    const { courseId } = parseOrThrow(courseParams, request.params);

    const row = app.db.select().from(schema.generatedCourses).where(eq(schema.generatedCourses.courseId, courseId)).get();
    if (!row) throw notFound("That course was not generated.");
    if (row.status !== "published") throw badRequest("Approve the course before promoting it.");

    app.db
      .update(schema.generatedCourses)
      .set({ scope: "global", userId: null })
      .where(eq(schema.generatedCourses.courseId, courseId))
      .run();
    app.db.update(schema.courses).set({ audience: "everyone" }).where(eq(schema.courses.id, courseId)).run();

    writeAudit(app.db, {
      actorId: actor.id,
      action: "course.promoted",
      targetType: "course",
      targetId: courseId,
      details: { skill: row.skill },
    });
    return { ok: true };
  });

  // -------------------------------------------------------------------------
  // Research settings — superadmin only
  // -------------------------------------------------------------------------

  app.get("/api/admin/research", async (request) => {
    requireSuperadmin(request);
    return { settings: getResearchSettings(app.db) };
  });

  app.put("/api/admin/research", async (request) => {
    const actor = requireSuperadmin(request);
    const body = parseOrThrow(
      z.object({
        provider: z.enum(["tavily", "brave", "serper"]).nullable().optional(),
        searchKey: z.string().max(200).optional(),
        youtubeKey: z.string().max(200).optional(),
        budgetTokens: z.number().int().min(10_000).max(5_000_000).optional(),
        budgetSearches: z.number().int().min(5).max(500).optional(),
      }),
      request.body,
    );

    const settings = updateResearchSettings(app.db, app.env, { ...body, updatedBy: actor.id });
    writeAudit(app.db, {
      actorId: actor.id,
      action: "research.settings_updated",
      targetType: "research",
      targetId: "singleton",
      // Which provider and whether keys are now present — never the keys, not even a hint.
      details: { provider: settings.provider, hasSearchKey: Boolean(settings.searchHint), hasYoutubeKey: Boolean(settings.youtubeHint) },
    });
    return { settings };
  });

  /** Queues the weekly link re-check by hand, for an admin who wants it now. */
  app.post("/api/admin/research/check-links", async (request, reply) => {
    const actor = requireStaff(request);
    const jobId = enqueue(app.db, { type: "links.check", payload: {} });
    writeAudit(app.db, { actorId: actor.id, action: "links.check_requested", targetType: "research", targetId: "singleton" });
    reply.status(202);
    return { jobId };
  });
}
