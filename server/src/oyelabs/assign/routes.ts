import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { assignCourseRequestSchema, courseSearchQuerySchema, suggestCoursesRequestSchema, type SuggestCoursesResponse } from "../../../../shared/oyelabsCourses";
import { requireStaff, staffOnly } from "../../auth/guards";
import { writeAudit } from "../../lib/audit";
import { parseOrThrow } from "../../lib/errors";
import { activeWeek } from "../../plans/weekly/repo";
import { generateWeek } from "../../plans/weekly/generate";
import { resolveEmbedder } from "./embed";
import { suggestOyelabsCourses } from "./match";
import { assignCourse, courseAssignmentsView, learnerCourses, removeDepartment, removeLearner, searchCourses } from "./repo";

const id = z.string().min(1).max(64);

/** At most this many current weeks are reshaped inside one request; the rest pick it up next week. */
const WEEK_REFRESH_CAP = 50;

/**
 * v4.5 Phase 4 (builder D): manual add and department rules. Contract: shared/oyelabsCourses.ts
 * (section "Phase 4"). Design: PLAN.md §4.4.
 */
export async function registerOyelabsAssignAdminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", staffOnly);

  /**
   * "Most important" and "Required" mean this week, not next: the current week of everyone it
   * reaches is rebuilt from the rules (the same as the admin's "rebuild" button, pins kept).
   */
  const refreshWeeks = async (userIds: readonly string[], actorId: string) => {
    for (const userId of userIds.slice(0, WEEK_REFRESH_CAP)) {
      if (!activeWeek(app.db, userId)) continue;
      try {
        await generateWeek({ db: app.db, content: app.content, ai: app.ai, log: (m) => app.log.info(m) }, { userId, rulesOnly: true, generatedBy: actorId });
      } catch (error) {
        app.log.warn({ err: error, userId }, "week refresh after a course assignment failed");
      }
    }
  };

  app.post("/api/admin/oyelabs/assignments", async (request) => {
    const actor = requireStaff(request);
    const body = parseOrThrow(assignCourseRequestSchema, request.body);
    const result = assignCourse(app.db, actor.id, body);
    writeAudit(app.db, {
      actorId: actor.id,
      action: "course.assigned",
      targetType: "course",
      targetId: body.courseId,
      details: { target: body.target, priority: body.priority, added: result.added, updated: result.updated },
    });
    const urgent = body.priority === "most_important" || (body.target.kind === "department_everyone" && body.target.required);
    if (urgent) await refreshWeeks(result.userIds, actor.id);
    return { added: result.added, updated: result.updated, message: result.message };
  });

  app.get("/api/admin/oyelabs/courses/:courseId/assignments", async (request) => {
    const { courseId } = parseOrThrow(z.object({ courseId: id }), request.params);
    return courseAssignmentsView(app.db, courseId);
  });

  app.delete("/api/admin/oyelabs/courses/:courseId/assignments/learners/:userId", async (request) => {
    const actor = requireStaff(request);
    const { courseId, userId } = parseOrThrow(z.object({ courseId: id, userId: id }), request.params);
    const removed = removeLearner(app.db, courseId, userId);
    writeAudit(app.db, { actorId: actor.id, action: "course.unassigned", targetType: "course", targetId: courseId, details: { userId, removed } });
    return { removed };
  });

  app.delete("/api/admin/oyelabs/courses/:courseId/assignments/departments/:departmentId", async (request) => {
    const actor = requireStaff(request);
    const { courseId, departmentId } = parseOrThrow(z.object({ courseId: id, departmentId: id }), request.params);
    const result = removeDepartment(app.db, courseId, departmentId);
    writeAudit(app.db, { actorId: actor.id, action: "course.unassigned", targetType: "course", targetId: courseId, details: { departmentId, ...result } });
    return result;
  });

  /** What one learner already has, and their department, for the "Add a course" dialog. */
  app.get("/api/admin/oyelabs/learners/:userId", async (request) => {
    const { userId } = parseOrThrow(z.object({ userId: id }), request.params);
    return learnerCourses(app.db, userId);
  });

  app.get("/api/admin/oyelabs/search", async (request) => {
    const query = parseOrThrow(courseSearchQuerySchema, request.query);
    return { courses: searchCourses(app.db, query) };
  });

  app.post("/api/admin/oyelabs/suggest", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, async (request): Promise<SuggestCoursesResponse> => {
    const body = parseOrThrow(suggestCoursesRequestSchema, request.body);
    const matches = await suggestOyelabsCourses(app.db, { description: body.description, departmentId: body.departmentId, skillIds: body.skillIds }, resolveEmbedder(app.db, app.ai));
    return { courses: matches.map((m) => ({ courseId: m.courseId, title: m.title, reason: m.reason, score: m.score })) };
  });
}
