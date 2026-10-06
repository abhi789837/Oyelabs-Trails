import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { HOLDER_NAME_MAX, isCertificateId, type MyCertificatesResponse } from "../../../../shared/certificates";
import { requireActiveUser, requireStaff } from "../../auth/guards";
import { writeAudit } from "../../lib/audit";
import { badRequest, notFound, parseOrThrow } from "../../lib/errors";
import { adminCertificates, certificateRow, holderNameFor, myCertificates, publicView, setHolderName, setRevoked, syncCertificates, toMine } from "./repo";

/**
 * v5 certificates (Phase 5).
 *
 * - `GET /api/v5/certificates`: mine (issues what is newly complete first).
 * - `GET /api/v5/certificates/:id`: one of mine.
 * - `PUT /api/v5/certificates/name {name}`: the name printed on my certificates.
 * - `GET /api/v5/certificates/:id/public`: no session; holder, title, date, valid or revoked.
 * - `GET /api/admin/v5/certificates?userId=`, `POST /api/admin/v5/certificates/:id/revoke|restore` (staff, audited).
 */
export async function registerV5CertificateRoutes(app: FastifyInstance): Promise<void> {
  const idParams = z.object({ id: z.string().min(3).max(40) });

  app.get("/api/v5/certificates", async (request): Promise<MyCertificatesResponse> => {
    const user = requireActiveUser(request);
    const newlyIssued = syncCertificates(app.db, app.content, user);
    return { certificates: myCertificates(app.db, app.content, user.id), holderName: holderNameFor(app.db, user.id), newlyIssued };
  });

  app.put("/api/v5/certificates/name", async (request) => {
    const user = requireActiveUser(request);
    const { name } = parseOrThrow(z.object({ name: z.string().trim().min(2, "Type at least 2 letters.").max(HOLDER_NAME_MAX) }), request.body);
    const holderName = setHolderName(app.db, user.id, name);
    return { holderName, certificates: myCertificates(app.db, app.content, user.id) };
  });

  app.get("/api/v5/certificates/:id", async (request) => {
    const user = requireActiveUser(request);
    const { id } = parseOrThrow(idParams, request.params);
    syncCertificates(app.db, app.content, user);
    const row = certificateRow(app.db, id);
    // Someone else's certificate is a 404 here; its public page is /verify.
    if (!row || row.userId !== user.id) throw notFound("We couldn't find that certificate.");
    return { certificate: toMine(row, app.content) };
  });

  app.get("/api/v5/certificates/:id/public", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, async (request) => {
    const { id } = parseOrThrow(idParams, request.params);
    if (!isCertificateId(id)) throw notFound("We couldn't find a certificate with that code.");
    const row = certificateRow(app.db, id);
    if (!row) throw notFound("We couldn't find a certificate with that code.");
    return { certificate: publicView(row, app.content) };
  });

  // ---- Admin ----
  app.get("/api/admin/v5/certificates", async (request) => {
    requireStaff(request);
    const { userId } = parseOrThrow(z.object({ userId: z.string().max(64).optional() }), request.query);
    return { certificates: adminCertificates(app.db, app.content, userId) };
  });

  for (const action of ["revoke", "restore"] as const) {
    app.post(`/api/admin/v5/certificates/:id/${action}`, async (request) => {
      const staff = requireStaff(request);
      const { id } = parseOrThrow(idParams, request.params);
      const { note } = parseOrThrow(z.object({ note: z.string().trim().max(400).default("") }), request.body ?? {});
      const before = certificateRow(app.db, id);
      if (!before) throw notFound("We couldn't find that certificate.");
      if (action === "restore" && !before.revokedAt) throw badRequest("This certificate is already valid.");
      const row = setRevoked(app.db, id, action === "revoke")!;
      writeAudit(app.db, {
        actorId: staff.id,
        action: action === "revoke" ? "certificate.revoke" : "certificate.restore",
        targetType: "user",
        targetId: row.userId,
        details: { certificateId: id, title: row.title, note: note || undefined },
      });
      return { certificate: { ...toMine(row, app.content), userId: row.userId } };
    });
  }
}
