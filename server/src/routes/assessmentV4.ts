import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { runRequestSchema, saveDraftRequestSchema, submitItemRequestSchema } from "../../../shared/assessmentV4";
import { buildSheet, finishV4, isV4, runItem, runnerDeps, saveDraft, submitItem, toSheetItem } from "../assessment/v4";
import { schema } from "../db";
import { conflict, notFound, parseOrThrow } from "../lib/errors";
import { expired, load } from "./assessment";

const itemParams = z.object({ id: z.string().min(1).max(64), itemId: z.string().min(1).max(64) });

/**
 * The v4 sheet (Phase 4): read it, autosave answers, Run code (three times, counted here), submit a
 * question. Start and Finish live in `assessment.ts`. Every write checks the server clock: once the
 * deadline has passed the sitting is submitted and the write is refused.
 */
export async function registerAssessmentV4Routes(app: FastifyInstance): Promise<void> {
  const loadOpen = (request: Parameters<typeof load>[1]) => {
    const { assessment, user } = load(app, request, "in_progress");
    if (!isV4(assessment)) throw conflict("This assessment uses the older format.");
    if (expired(assessment)) {
      finishV4(app.db, assessment, "deadline");
      throw conflict("Time is up. Your answers have been submitted.");
    }
    const { itemId } = parseOrThrow(itemParams, request.params);
    const item = app.db
      .select()
      .from(schema.assessmentItems)
      .where(and(eq(schema.assessmentItems.id, itemId), eq(schema.assessmentItems.assessmentId, assessment.id)))
      .get();
    if (!item) throw notFound("No such question.");
    return { assessment, user, item };
  };

  app.get("/api/assessment/:id/sheet", async (request) => {
    const { assessment } = load(app, request, "any");
    if (!isV4(assessment)) throw conflict("This assessment uses the older format.");
    if (assessment.status === "in_progress" && expired(assessment)) finishV4(app.db, assessment, "deadline");
    const fresh = app.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessment.id)).get()!;
    const sheet = buildSheet(app.db, fresh);
    // Nobody reads the questions before the clock starts.
    if (fresh.status === "ready") return { ...sheet, items: [] };
    return sheet;
  });

  app.put("/api/assessment/:id/items/:itemId/draft", { config: { rateLimit: { max: 240, timeWindow: "1 minute" } } }, async (request) => {
    const { item } = loadOpen(request);
    const body = parseOrThrow(saveDraftRequestSchema, request.body);
    saveDraft(app.db, item, body);
    return { ok: true };
  });

  app.post("/api/assessment/:id/items/:itemId/run", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (request) => {
    const { item } = loadOpen(request);
    const { code } = parseOrThrow(runRequestSchema, request.body);
    return runItem(runnerDeps(app), item, code);
  });

  app.post("/api/assessment/:id/items/:itemId/submit", async (request) => {
    const { item } = loadOpen(request);
    const { response } = parseOrThrow(submitItemRequestSchema, request.body);
    if (item.lockedAt) throw conflict("This question has already been submitted.");
    await submitItem(runnerDeps(app), item, response);
    const fresh = app.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, item.id)).get()!;
    return { item: toSheetItem(fresh) };
  });
}
