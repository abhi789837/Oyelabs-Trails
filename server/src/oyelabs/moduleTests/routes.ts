import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { moduleTestAttemptSchema, moduleTestItemInputSchema, type GradedModuleTest, type ModuleTestItemView, type ModuleTestView, type ServedModuleTest } from "../../../../shared/moduleTests";
import { requireActiveUser, staffOnly } from "../../auth/guards";
import { enqueue } from "../../jobs/queue";
import { parseOrThrow } from "../../lib/errors";
import { moduleLessonFor } from "../media/tracking";
import { setTestRow, ensureTestRow } from "./generate";
import { addAdminItem, adminContext, editAdminItem, gradeModuleTest, moduleTestView, removeAdminItem, servedTest } from "./repo";
import { jobWaiting, queueStaleSources } from "./sources";

/**
 * v4.5 Phase 3 (builder C): module tests. Contract: shared/moduleTests.ts. Design: PLAN.md §4.3.
 */

const sectionParams = z.object({ sectionId: z.string().min(1).max(64) });
const itemParams = sectionParams.extend({ itemId: z.string().min(1).max(64) });
const topicParams = z.object({ topicId: z.string().min(1).max(64) });

export async function registerModuleTestAdminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", staffOnly);

  app.get("/api/admin/oyelabs/modules/:sectionId/test", async (request): Promise<ModuleTestView> => {
    const { sectionId } = parseOrThrow(sectionParams, request.params);
    return moduleTestView(app.db, adminContext(app.db, sectionId));
  });

  /** This module only. Linked docs are read again (they may have changed where they live). */
  app.post("/api/admin/oyelabs/modules/:sectionId/test/regenerate", async (request): Promise<ModuleTestView> => {
    const { sectionId } = parseOrThrow(sectionParams, request.params);
    const ctx = adminContext(app.db, sectionId);
    ensureTestRow(app.db, ctx);
    queueStaleSources(app.db, ctx, { forceLinks: true });
    if (!jobWaiting(app.db, "oyelabs.module_test.generate", "sectionId", sectionId)) {
      enqueue(app.db, { type: "oyelabs.module_test.generate", payload: { sectionId, reason: "admin" }, delayMs: 500 });
    }
    setTestRow(app.db, sectionId, { status: "gathering", error: null });
    return moduleTestView(app.db, ctx);
  });

  app.post("/api/admin/oyelabs/modules/:sectionId/test/items", async (request): Promise<{ item: ModuleTestItemView; test: ModuleTestView }> => {
    const { sectionId } = parseOrThrow(sectionParams, request.params);
    const input = parseOrThrow(moduleTestItemInputSchema, request.body);
    const ctx = adminContext(app.db, sectionId);
    const item = addAdminItem(app.db, ctx, input);
    return { item, test: moduleTestView(app.db, ctx) };
  });

  app.put("/api/admin/oyelabs/modules/:sectionId/test/items/:itemId", async (request): Promise<{ item: ModuleTestItemView; test: ModuleTestView }> => {
    const { sectionId, itemId } = parseOrThrow(itemParams, request.params);
    const input = parseOrThrow(moduleTestItemInputSchema, request.body);
    const ctx = adminContext(app.db, sectionId);
    const item = editAdminItem(app.db, ctx, itemId, input);
    return { item, test: moduleTestView(app.db, ctx) };
  });

  app.delete("/api/admin/oyelabs/modules/:sectionId/test/items/:itemId", async (request): Promise<{ test: ModuleTestView }> => {
    const { sectionId, itemId } = parseOrThrow(itemParams, request.params);
    const ctx = adminContext(app.db, sectionId);
    removeAdminItem(app.db, ctx, itemId);
    return { test: moduleTestView(app.db, ctx) };
  });
}

export async function registerModuleTestLearnerRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/v5/oyelabs/lessons/:topicId/test", async (request): Promise<ServedModuleTest> => {
    const user = requireActiveUser(request);
    const { topicId } = parseOrThrow(topicParams, request.params);
    return servedTest(app.db, user, moduleLessonFor(app.db, user, topicId));
  });

  app.post("/api/v5/oyelabs/lessons/:topicId/test/attempt", async (request): Promise<GradedModuleTest> => {
    const user = requireActiveUser(request);
    const { topicId } = parseOrThrow(topicParams, request.params);
    const { answers } = parseOrThrow(moduleTestAttemptSchema, request.body);
    return gradeModuleTest(app.db, app.content, user, moduleLessonFor(app.db, user, topicId), answers);
  });
}
