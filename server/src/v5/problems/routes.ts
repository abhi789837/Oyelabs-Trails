import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { problemCreateSchema, type LessonStepId, type ProblemListResponse, type ProblemReportView } from "../../../../shared/lesson";
import { requireActiveUser, requireStaff, staffOnly } from "../../auth/guards";
import { schema, type Db } from "../../db";
import { writeAudit } from "../../lib/audit";
import { newId, now } from "../../lib/ids";
import { notFound, parseOrThrow } from "../../lib/errors";
import { notify, staffIds } from "../../lib/notify";
import type { ContentStore } from "../../content/store";
import { lessonTopic } from "../lesson/routes";

/**
 * "Report a problem with this step" (`problem_reports`). A learner's report goes to every staff
 * member as a notification and waits in the admin inbox until someone marks it fixed.
 */

const topicParams = z.object({ topicId: z.string().min(1).max(120) });
const idParams = z.object({ id: z.string().min(1).max(64) });
const listQuery = z.object({ status: z.enum(["open", "resolved", "all"]).default("open"), limit: z.coerce.number().int().min(1).max(200).default(100) });

const STEP_WORDS: Record<LessonStepId, string> = { watch: "Watch", read: "Read", do: "Do", check: "Check" };

type Row = typeof schema.problemReports.$inferSelect;

function views(db: Db, content: ContentStore, rows: Row[]): ProblemReportView[] {
  const ids = [...new Set(rows.map((r) => r.userId))];
  const names = new Map(
    ids.length
      ? db
          .select({ id: schema.users.id, name: schema.users.displayName })
          .from(schema.users)
          .where(inArray(schema.users.id, ids))
          .all()
          .map((u) => [u.id, u.name] as const)
      : [],
  );
  return rows.map((r) => ({
    id: r.id,
    topicId: r.topicId,
    topicTitle: content.getTopic(r.topicId)?.topic.title ?? r.topicId,
    step: (r.step as LessonStepId | null) ?? null,
    message: r.message,
    status: r.status,
    createdAt: r.createdAt,
    reporter: { id: r.userId, displayName: names.get(r.userId) ?? "Someone" },
    resolvedBy: r.resolvedBy,
    resolvedAt: r.resolvedAt,
  }));
}

export function openProblemCount(db: Db): number {
  return Number(
    db
      .select({ n: sql<number>`count(*)` })
      .from(schema.problemReports)
      .where(eq(schema.problemReports.status, "open"))
      .get()?.n ?? 0,
  );
}

export async function registerProblemRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/api/v5/lessons/:topicId/problems",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request): Promise<{ id: string }> => {
      const user = requireActiveUser(request);
      const { topicId } = parseOrThrow(topicParams, request.params, "Unknown lesson.");
      const body = parseOrThrow(problemCreateSchema, request.body);
      const topic = lessonTopic(app, user, topicId);
      const id = newId();
      app.db
        .insert(schema.problemReports)
        .values({ id, userId: user.id, topicId, step: body.step ?? null, message: body.message, status: "open", createdAt: now() })
        .run();
      const where = body.step ? ` (${STEP_WORDS[body.step]} step)` : "";
      const excerpt = body.message.length > 160 ? `${body.message.slice(0, 157)}…` : body.message;
      for (const staffId of staffIds(app.db)) {
        if (staffId === user.id) continue;
        notify(app.db, {
          recipientId: staffId,
          kind: "lesson.problem_reported",
          title: `${user.displayName} reported a problem in "${topic.title}"${where}`,
          body: excerpt,
          link: "/admin",
        });
      }
      return { id };
    },
  );
}

/** Staff only: the problem list and "mark as fixed". Registered as a plugin so the guard is scoped. */
export async function registerAdminProblemRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", staffOnly);

  app.get("/api/admin/v5/problems", async (request): Promise<ProblemListResponse> => {
    requireStaff(request);
    const { status, limit } = parseOrThrow(listQuery, request.query ?? {});
    const rows = app.db
      .select()
      .from(schema.problemReports)
      .where(status === "all" ? undefined : eq(schema.problemReports.status, status))
      .orderBy(desc(schema.problemReports.createdAt))
      .limit(limit)
      .all();
    return { problems: views(app.db, app.content, rows), openCount: openProblemCount(app.db) };
  });

  app.post("/api/admin/v5/problems/:id/resolve", async (request): Promise<{ problem: ProblemReportView }> => {
    const actor = requireStaff(request);
    const { id } = parseOrThrow(idParams, request.params, "Unknown report.");
    const row = app.db.select().from(schema.problemReports).where(eq(schema.problemReports.id, id)).get();
    if (!row) throw notFound("That report doesn't exist.");
    if (row.status !== "resolved") {
      app.db
        .update(schema.problemReports)
        .set({ status: "resolved", resolvedBy: actor.id, resolvedAt: now() })
        .where(and(eq(schema.problemReports.id, id), eq(schema.problemReports.status, "open")))
        .run();
      writeAudit(app.db, { actorId: actor.id, action: "lesson.problem_resolved", targetType: "problem_report", targetId: id, details: { topicId: row.topicId } });
    }
    const fresh = app.db.select().from(schema.problemReports).where(eq(schema.problemReports.id, id)).get()!;
    return { problem: views(app.db, app.content, [fresh])[0] };
  });
}
