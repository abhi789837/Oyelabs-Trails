import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";

import { certificateFileName, HOLDER_NAME_MAX, isCertificateId, SIGNATURE_NAME_MAX, SIGNATURE_TITLE_MAX, type MyCertificatesResponse } from "../../../../shared/certificates";
import { requireActiveUser, requireStaff } from "../../auth/guards";
import { writeAudit } from "../../lib/audit";
import { ERROR_CODES } from "../../../../shared/apiCodes";
import { schema } from "../../db";
import { badRequest, HttpError, notFound, parseOrThrow } from "../../lib/errors";
import { certificatesDir, ensureCertificateFile, generateCertificateFiles, getSignature, removeStale, setSignature, type CertificateFileKind, type CertificateFilesConfig } from "./files";
import { adminCertificates, certificateRow, holderNameFor, myCertificates, onCertificateChanged, publicView, setHolderName, setRevoked, statusOf, syncCertificates, titleFor, toMine } from "./repo";
import { certificatesReportPdf } from "./reportPdf";

/**
 * v5 certificates (v5 Phase 5; files and admin in rebrand Phase 5).
 *
 * Learner:
 * - `GET /api/v5/certificates`: mine (issues what is newly complete first).
 * - `GET /api/v5/certificates/:id`: one of mine.
 * - `PUT /api/v5/certificates/name {name}`: the name printed on my certificates (redraws them).
 * - `GET /api/v5/certificates/:id/file.pdf|file.png[?download=1]`: mine, as the PDF or the 2× PNG.
 *
 * Public (no session, rate limited, minimal data):
 * - `GET /api/v5/certificates/:id/public`: holder, title, date, valid or revoked.
 * - `GET /api/v5/certificates/:id/preview.png`: the 1× PNG, for /verify and link previews. Only
 *   while the certificate is valid: a revoked one has no public picture.
 *
 * Staff (audited where it changes something):
 * - `GET /api/admin/v5/certificates?userId=`, `POST .../:id/revoke|restore|regenerate`,
 *   `GET .../:id/file.pdf|file.png`, `GET|PUT /api/admin/v5/certificates/signature`,
 *   `GET /api/admin/v5/certificates/report.pdf`.
 */
export async function registerV5CertificateRoutes(app: FastifyInstance): Promise<void> {
  const idParams = z.object({ id: z.string().min(3).max(40) });
  const fileParams = z.object({ id: z.string().min(3).max(40), file: z.enum(["file.pdf", "file.png"]) });
  const config: CertificateFilesConfig = { dataDir: app.env.dataDir, publicOrigin: app.env.publicOrigin };
  const origin = app.env.publicOrigin;

  // Draw the files as soon as a certificate is issued or its name corrected, off the request.
  // Not in unit tests: their data directory is gone by the time a deferred draw would finish.
  if (!app.env.isTest) {
    onCertificateChanged((id) => {
      setImmediate(() => {
        const row = certificateRow(app.db, id);
        if (row && !row.revokedAt) void generateCertificateFiles(config, row, titleFor(row, app.content), getSignature(app.db));
      });
    });
  }

  const sendFile = async (reply: FastifyReply, row: NonNullable<ReturnType<typeof certificateRow>>, kind: CertificateFileKind, opts: { download: boolean; cache: string }) => {
    let bytes: Buffer;
    try {
      bytes = await ensureCertificateFile(config, row, titleFor(row, app.content), getSignature(app.db), kind);
    } catch (error) {
      app.log.error({ err: error, certificateId: row.id }, "certificate: drawing the file failed");
      throw new HttpError(503, ERROR_CODES.INTERNAL, "The certificate file couldn't be made just now. Try again in a minute.");
    }
    const ext = kind === "pdf" ? "pdf" : "png";
    reply.header("content-type", kind === "pdf" ? "application/pdf" : "image/png");
    reply.header("cache-control", opts.cache);
    reply.header("x-content-type-options", "nosniff");
    reply.header("content-disposition", `${opts.download ? "attachment" : "inline"}; filename="${certificateFileName(row.id, ext)}"`);
    return reply.send(bytes);
  };

  app.get("/api/v5/certificates", async (request): Promise<MyCertificatesResponse> => {
    const user = requireActiveUser(request);
    const newlyIssued = syncCertificates(app.db, app.content, user);
    return { certificates: myCertificates(app.db, app.content, user.id, origin), holderName: holderNameFor(app.db, user.id), newlyIssued };
  });

  app.put("/api/v5/certificates/name", async (request) => {
    const user = requireActiveUser(request);
    const { name } = parseOrThrow(z.object({ name: z.string().trim().min(2, "Type at least 2 letters.").max(HOLDER_NAME_MAX) }), request.body);
    const holderName = setHolderName(app.db, user.id, name);
    return { holderName, certificates: myCertificates(app.db, app.content, user.id, origin) };
  });

  app.get("/api/v5/certificates/:id", async (request) => {
    const user = requireActiveUser(request);
    const { id } = parseOrThrow(idParams, request.params);
    syncCertificates(app.db, app.content, user);
    const row = certificateRow(app.db, id);
    // Someone else's certificate is a 404 here; its public page is /verify.
    if (!row || row.userId !== user.id) throw notFound("We couldn't find that certificate.");
    return { certificate: toMine(row, app.content, origin) };
  });

  app.get("/api/v5/certificates/:id/:file", async (request, reply) => {
    const user = requireActiveUser(request);
    const { id, file } = parseOrThrow(fileParams, request.params);
    const { download } = parseOrThrow(z.object({ download: z.enum(["0", "1"]).optional() }), request.query);
    const row = isCertificateId(id) ? certificateRow(app.db, id) : undefined;
    if (!row || row.userId !== user.id) throw notFound("We couldn't find that certificate.");
    if (row.revokedAt) throw new HttpError(410, ERROR_CODES.NOT_FOUND, "This certificate was revoked, so it can't be downloaded.");
    return sendFile(reply, row, file === "file.pdf" ? "pdf" : "png", { download: download === "1", cache: "private, no-cache" });
  });

  // ---- Public ----
  app.get("/api/v5/certificates/:id/public", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, async (request) => {
    const { id } = parseOrThrow(idParams, request.params);
    if (!isCertificateId(id)) throw notFound("We couldn't find a certificate with that code.");
    const row = certificateRow(app.db, id);
    if (!row) throw notFound("We couldn't find a certificate with that code.");
    return { certificate: publicView(row, app.content) };
  });

  app.get("/api/v5/certificates/:id/preview.png", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, async (request, reply) => {
    const { id } = parseOrThrow(idParams, request.params);
    const row = isCertificateId(id) ? certificateRow(app.db, id) : undefined;
    if (!row) throw notFound("We couldn't find a certificate with that code.");
    if (statusOf(row) !== "valid") throw new HttpError(410, ERROR_CODES.NOT_FOUND, "This certificate isn't valid, so it has no public image.");
    // Short public cache: a revoke or a name fix shows within minutes, and repeat views skip the server.
    return sendFile(reply, row, "preview", { download: false, cache: "public, max-age=300" });
  });

  // ---- Admin ----
  app.get("/api/admin/v5/certificates", async (request) => {
    requireStaff(request);
    const { userId } = parseOrThrow(z.object({ userId: z.string().max(64).optional() }), request.query);
    return { certificates: adminCertificates(app.db, app.content, origin, userId), signature: getSignature(app.db) };
  });

  app.get("/api/admin/v5/certificates/signature", async (request) => {
    requireStaff(request);
    return { signature: getSignature(app.db) };
  });

  app.put("/api/admin/v5/certificates/signature", async (request) => {
    const staff = requireStaff(request);
    const body = parseOrThrow(z.object({ name: z.string().trim().max(SIGNATURE_NAME_MAX).default(""), title: z.string().trim().max(SIGNATURE_TITLE_MAX).default("") }), request.body ?? {});
    const signature = setSignature(app.db, body.name ? body : null);
    writeAudit(app.db, { actorId: staff.id, action: "certificate.signature", targetType: "setting", targetId: "certificate.signature", details: { name: signature?.name ?? null, title: signature?.title ?? null } });
    return { signature };
  });

  app.get("/api/admin/v5/certificates/report.pdf", async (request, reply) => {
    requireStaff(request);
    const rows = adminCertificates(app.db, app.content, origin);
    const names = new Map(app.db.select({ id: schema.users.id, name: schema.users.displayName }).from(schema.users).all().map((u) => [u.id, u.name]));
    const pdf = await certificatesReportPdf(rows.map((c) => ({ ...c, accountName: names.get(c.userId) ?? "" })));
    reply.header("content-type", "application/pdf");
    reply.header("cache-control", "private, no-store");
    reply.header("content-disposition", `attachment; filename="oyelearn-certificates-${new Date().toISOString().slice(0, 10)}.pdf"`);
    return reply.send(pdf);
  });

  app.get("/api/admin/v5/certificates/:id/:file", async (request, reply) => {
    requireStaff(request);
    const { id, file } = parseOrThrow(fileParams, request.params);
    const row = isCertificateId(id) ? certificateRow(app.db, id) : undefined;
    if (!row) throw notFound("We couldn't find that certificate.");
    return sendFile(reply, row, file === "file.pdf" ? "pdf" : "png", { download: false, cache: "private, no-cache" });
  });

  app.post("/api/admin/v5/certificates/:id/regenerate", async (request) => {
    const staff = requireStaff(request);
    const { id } = parseOrThrow(idParams, request.params);
    const row = isCertificateId(id) ? certificateRow(app.db, id) : undefined;
    if (!row) throw notFound("We couldn't find that certificate.");
    removeStale(certificatesDir(app.env.dataDir), row.id, null);
    const ok = await generateCertificateFiles(config, row, titleFor(row, app.content), getSignature(app.db));
    if (!ok) throw new HttpError(503, ERROR_CODES.INTERNAL, "The certificate couldn't be drawn just now. Try again in a minute.");
    writeAudit(app.db, { actorId: staff.id, action: "certificate.regenerate", targetType: "user", targetId: row.userId, details: { certificateId: id, title: row.title } });
    return { certificate: { ...toMine(row, app.content, origin), userId: row.userId } };
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
      return { certificate: { ...toMine(row, app.content, origin), userId: row.userId } };
    });
  }
}
