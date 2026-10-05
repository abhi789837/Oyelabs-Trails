import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { bundleInputSchema } from "../../../../shared/bundles";
import { requireStaff, staffOnly } from "../../auth/guards";
import { createBundle, deleteBundle, listBundles, updateBundle } from "../../goals/bundles";
import { writeAudit } from "../../lib/audit";
import { parseOrThrow } from "../../lib/errors";

const idParams = z.object({ id: z.string().min(1).max(80) });

/**
 * v4.4: skill groups ("bundles" in code). What a broad phrase in a description stands for: "full
 * stack" for a frontend developer, "soft skills" for anyone. Staff can edit them; every save checks
 * that each skill exists and can be used in the group's department.
 */
export async function registerAdminBundleRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", staffOnly);

  app.get("/api/admin/bundles", async (request) => {
    requireStaff(request);
    return { bundles: listBundles(app.db) };
  });

  app.post("/api/admin/bundles", async (request) => {
    const actor = requireStaff(request);
    const body = parseOrThrow(bundleInputSchema, request.body);
    const bundle = createBundle(app.db, body, actor.id);
    writeAudit(app.db, { actorId: actor.id, action: "bundle.created", targetType: "bundle", targetId: bundle.id, details: { name: bundle.name, skills: bundle.skillIds.length } });
    return { bundle, bundles: listBundles(app.db) };
  });

  app.put("/api/admin/bundles/:id", async (request) => {
    const actor = requireStaff(request);
    const { id } = parseOrThrow(idParams, request.params);
    const body = parseOrThrow(bundleInputSchema, request.body);
    const bundle = updateBundle(app.db, id, body, actor.id);
    writeAudit(app.db, { actorId: actor.id, action: "bundle.updated", targetType: "bundle", targetId: id, details: { name: bundle.name, skills: bundle.skillIds.length, active: bundle.active } });
    return { bundle, bundles: listBundles(app.db) };
  });

  app.delete("/api/admin/bundles/:id", async (request) => {
    const actor = requireStaff(request);
    const { id } = parseOrThrow(idParams, request.params);
    deleteBundle(app.db, id);
    writeAudit(app.db, { actorId: actor.id, action: "bundle.deleted", targetType: "bundle", targetId: id, details: {} });
    return { bundles: listBundles(app.db) };
  });
}
