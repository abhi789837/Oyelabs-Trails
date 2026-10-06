import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { announcementInputSchema, announcementPatchSchema, type AdminAnnouncementView, type AnnouncementView } from "../../../../shared/today";
import { requireActiveUser, requireStaff } from "../../auth/guards";
import { writeAudit } from "../../lib/audit";
import { notFound, parseOrThrow } from "../../lib/errors";
import { adminView, createAnnouncement, deleteAnnouncement, getAnnouncement, listForAdmin, listForLearner, updateAnnouncement } from "./repo";

const idParams = z.object({ id: z.string().min(1).max(64) });

/**
 * Learners read what's live for them; staff manage them. The admin screens (P7) build on the admin
 * routes. Every change is in the audit log as `announcement.create|update|delete`.
 */
export async function registerV5AnnouncementRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/v5/announcements", async (request): Promise<{ announcements: AnnouncementView[] }> => {
    const user = requireActiveUser(request);
    return { announcements: listForLearner(app.db, user.id) };
  });

  app.get("/api/admin/announcements", async (request): Promise<{ announcements: AdminAnnouncementView[] }> => {
    requireStaff(request);
    return { announcements: listForAdmin(app.db) };
  });

  app.post("/api/admin/announcements", async (request, reply): Promise<{ announcement: AdminAnnouncementView }> => {
    const actor = requireStaff(request);
    const input = parseOrThrow(announcementInputSchema, request.body ?? {});
    const row = createAnnouncement(app.db, actor.id, input);
    writeAudit(app.db, { actorId: actor.id, action: "announcement.create", targetType: "announcement", targetId: row.id, details: { title: row.title, audience: row.audience } });
    reply.status(201);
    return { announcement: adminView(app.db, row) };
  });

  app.put("/api/admin/announcements/:id", async (request): Promise<{ announcement: AdminAnnouncementView }> => {
    const actor = requireStaff(request);
    const { id } = parseOrThrow(idParams, request.params);
    const patch = parseOrThrow(announcementPatchSchema, request.body ?? {});
    const row = updateAnnouncement(app.db, id, patch);
    if (!row) throw notFound("That announcement doesn't exist any more.");
    writeAudit(app.db, { actorId: actor.id, action: "announcement.update", targetType: "announcement", targetId: id, details: { fields: Object.keys(patch) } });
    return { announcement: adminView(app.db, row) };
  });

  app.delete("/api/admin/announcements/:id", async (request): Promise<{ ok: true }> => {
    const actor = requireStaff(request);
    const { id } = parseOrThrow(idParams, request.params);
    const existing = getAnnouncement(app.db, id);
    if (!existing || !deleteAnnouncement(app.db, id)) throw notFound("That announcement doesn't exist any more.");
    writeAudit(app.db, { actorId: actor.id, action: "announcement.delete", targetType: "announcement", targetId: id, details: { title: existing.title } });
    return { ok: true };
  });
}
