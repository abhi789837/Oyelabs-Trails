import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import {
  draftFromCourseView,
  oyelabsDraftDataSchema,
  oyelabsSaveProblems,
  putOyelabsDraftRequestSchema,
  saveOyelabsCourseRequestSchema,
  suggestSkillsRequestSchema,
  type SaveOyelabsCourseRequest,
} from "../../../../shared/oyelabsCourses";
import { requireStaff, staffOnly } from "../../auth/guards";
import { schema } from "../../db";
import { badRequest, fieldsFromZod, notFound, parseOrThrow } from "../../lib/errors";
import { createDraft, deleteDraft, draftData, getDraft, putDraft, toDraftView } from "./drafts";
import { readCourseView, unsavedNewDrafts } from "./payload";
import { saveOyelabsCourse } from "./repo";
import { suggestSkills } from "./skills";

/**
 * v4.5 Phase 1 (builder A): the "+ Add Oyelabs course" page's API. Staff only.
 * Contract: shared/oyelabsCourses.ts. Design: docs/v4.5/PLAN.md §4.1.
 */

/** The editor's JSON (a whole course with notes) can exceed the global 64 KB; 1 MB per PLAN §7. */
const EDITOR_BODY_LIMIT = 1024 * 1024;

const draftParams = z.object({ draftId: z.string().min(1).max(64) });
const courseParams = z.object({ courseId: z.string().min(1).max(64) });
const createDraftSchema = z.object({ courseId: z.string().min(1).max(64).nullable().default(null) });

/** A failed save says, in plain words, the first thing to fix; every problem is in `fields`. */
function parseSave(body: unknown): SaveOyelabsCourseRequest {
  const parsed = saveOyelabsCourseRequestSchema.safeParse(body);
  if (parsed.success) return parsed.data;
  const loose = oyelabsDraftDataSchema.safeParse((body as { course?: unknown } | null)?.course);
  const problems = loose.success ? oyelabsSaveProblems(loose.data) : [];
  if (problems.length) throw badRequest(problems[0]!.message, Object.fromEntries(problems.map((p) => [p.path, p.message])));
  const fields = fieldsFromZod(parsed.error);
  const custom = parsed.error.issues.find((i) => !/^(String|Array|Number|Invalid|Expected|Required)/.test(i.message));
  throw badRequest(custom?.message ?? "Something on the page isn't filled in right. Check the highlighted part.", fields);
}

export async function registerOyelabsEditorRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", staffOnly);

  // -------------------------------------------------------------------------
  // Autosave drafts
  // -------------------------------------------------------------------------

  /** Additive (DECISIONS Phase 1 A): this admin's unfinished new courses, so "Add" can offer to continue one. */
  app.get("/api/admin/oyelabs/drafts", async (request) => {
    const actor = requireStaff(request);
    return {
      drafts: unsavedNewDrafts(app.db, actor.id).map((row) => ({ id: row.id, title: draftData(row.data).title, updatedAt: row.updatedAt })),
    };
  });

  app.post("/api/admin/oyelabs/drafts", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, async (request, reply) => {
    const actor = requireStaff(request);
    const { courseId } = parseOrThrow(createDraftSchema, request.body ?? {});
    let data = oyelabsDraftDataSchema.parse({});
    if (courseId) {
      const view = readCourseView(app.db, courseId);
      if (!view) throw notFound("We couldn't find that course.");
      data = draftFromCourseView(view);
    }
    reply.code(201);
    return toDraftView(createDraft(app.db, courseId, data, actor.id));
  });

  app.get("/api/admin/oyelabs/drafts/:draftId", async (request) => {
    const { draftId } = parseOrThrow(draftParams, request.params);
    const row = getDraft(app.db, draftId);
    if (!row) throw notFound("That draft isn't there any more. It may have been saved or thrown away.");
    return toDraftView(row);
  });

  app.put(
    "/api/admin/oyelabs/drafts/:draftId",
    { bodyLimit: EDITOR_BODY_LIMIT, config: { rateLimit: { max: 120, timeWindow: "1 minute" } } },
    async (request) => {
      const actor = requireStaff(request);
      const { draftId } = parseOrThrow(draftParams, request.params);
      const body = parseOrThrow(putOyelabsDraftRequestSchema, request.body, "We couldn't keep that change. Try again.");
      if (body.courseId && !app.db.select({ id: schema.courses.id }).from(schema.courses).where(eq(schema.courses.id, body.courseId)).get()) {
        throw notFound("We couldn't find that course.");
      }
      const row = putDraft(app.db, draftId, body.courseId, body.data, actor.id);
      if (!row) throw notFound("That draft isn't there any more. It may have been saved or thrown away.");
      return toDraftView(row);
    },
  );

  app.delete("/api/admin/oyelabs/drafts/:draftId", async (request) => {
    const { draftId } = parseOrThrow(draftParams, request.params);
    deleteDraft(app.db, draftId);
    return { ok: true };
  });

  // -------------------------------------------------------------------------
  // Save & publish / Save as draft, and the read model
  // -------------------------------------------------------------------------

  app.post("/api/admin/oyelabs/courses", { bodyLimit: EDITOR_BODY_LIMIT, config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (request, reply) => {
    const actor = requireStaff(request);
    const body = parseSave(request.body);
    reply.code(201);
    return saveOyelabsCourse(app.db, null, body, actor.id);
  });

  app.put("/api/admin/oyelabs/courses/:courseId", { bodyLimit: EDITOR_BODY_LIMIT, config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (request) => {
    const actor = requireStaff(request);
    const { courseId } = parseOrThrow(courseParams, request.params);
    const body = parseSave(request.body);
    return saveOyelabsCourse(app.db, courseId, body, actor.id);
  });

  app.get("/api/admin/oyelabs/courses/:courseId", async (request) => {
    const { courseId } = parseOrThrow(courseParams, request.params);
    const view = readCourseView(app.db, courseId);
    if (!view) throw notFound("We couldn't find that course.");
    return view;
  });

  // -------------------------------------------------------------------------
  // Skill suggestions
  // -------------------------------------------------------------------------

  app.post("/api/admin/oyelabs/skills/suggest", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (request) => {
    const body = parseOrThrow(suggestSkillsRequestSchema, request.body);
    return suggestSkills(app.db, app.ai, body);
  });
}
