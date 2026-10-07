import fs from "node:fs";

import { and, eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { ERROR_CODES } from "../../../../shared/api";
import { UPLOAD_KINDS, VIDEO_UPLOAD_MAX_BYTES, type UploadKind, type UploadView } from "../../../../shared/oyelabsCourses";
import { videoProgressRequestSchema } from "../../../../shared/video";
import { activeTimeSampleSchema, resolveLinkRequestSchema, type ModuleLessonResponse, type ModulePlaylistResponse, type ResolvedDocLink, type ResolvedVideo } from "../../../../shared/videoSources";
import { requireActiveUser, requireStaff, staffOnly } from "../../auth/guards";
import { schema } from "../../db";
import { enqueue } from "../../jobs/queue";
import { badRequest, conflict, HttpError, notFound, parseOrThrow } from "../../lib/errors";
import { checkDoc, checkVideo, youtubeDurationFrom } from "./check";
import { resolveDocLink, resolveVideoLink } from "./resolve";
import { maxBytesFor, playbackFile, safeDisplayName, saveUpload, UploadRejected, uploadPath, uploadPlayable, uploadView } from "./storage";
import { confirmWatched, modulePlaylist, moduleDocs, moduleLessonFor, mayOpenOyelabsCourse, recordActiveSample, recordExactSample } from "./tracking";

/**
 * v4.5 Phase 2 (builder B): link resolver, uploads, playback and tracking.
 * Contract: shared/videoSources.ts, shared/oyelabsCourses.ts (uploads). Design: PLAN.md §4.2.
 */

const id = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, "Unknown id.");
const uploadParams = z.object({ uploadId: id });
const lessonParams = z.object({ topicId: id });
const videoParams = lessonParams.extend({ videoId: id });
const docParams = lessonParams.extend({ docId: id });
const uploadKindQuery = z.object({ kind: z.enum(UPLOAD_KINDS).optional() });

/** A few more bytes than the largest file, for the multipart envelope. */
const UPLOAD_BODY_LIMIT = VIDEO_UPLOAD_MAX_BYTES + 1024 * 1024;

export async function registerOyelabsMediaAdminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", staffOnly);

  /** The editor's preview card for a pasted video link (8 s budget). */
  app.post("/api/admin/oyelabs/links/resolve", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, async (request): Promise<ResolvedVideo> => {
    const { url } = parseOrThrow(resolveLinkRequestSchema, request.body);
    return resolveVideoLink(url, { youtubeDuration: youtubeDurationFrom(app.db) });
  });

  app.post("/api/admin/oyelabs/docs/resolve", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, async (request): Promise<ResolvedDocLink> => {
    const { url } = parseOrThrow(resolveLinkRequestSchema, request.body);
    return resolveDocLink(url);
  });

  /**
   * Multipart: the file in a field named `file`; `kind` (doc|video) as a query parameter or a field
   * sent before the file. Streamed to disk (never buffered), checked by extension and first bytes,
   * deduplicated by sha256. Videos are then probed and converted if needed (`oyelabs.upload.transcode`).
   */
  app.post(
    "/api/admin/oyelabs/uploads",
    { bodyLimit: UPLOAD_BODY_LIMIT, config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (request, reply): Promise<UploadView> => {
      const actor = requireStaff(request);
      if (!request.isMultipart()) throw badRequest("Send the file as multipart form data, in a field named file.");
      const fromQuery = parseOrThrow(uploadKindQuery, request.query ?? {}).kind;
      // The largest limit until the kind is known; `saveUpload` enforces the kind's own.
      const data = await request.file({ limits: { fileSize: fromQuery ? maxBytesFor(fromQuery) : VIDEO_UPLOAD_MAX_BYTES, files: 1, fields: 4, fieldSize: 1024 } });
      if (!data) throw badRequest("No file was attached. Send it in a field named file.");
      const field = data.fields.kind as { value?: unknown } | undefined;
      const kind = (fromQuery ?? (typeof field?.value === "string" ? field.value : undefined)) as UploadKind | undefined;
      if (!kind || !(UPLOAD_KINDS as readonly string[]).includes(kind)) {
        data.file.resume();
        throw badRequest("Say whether this is a doc or a video.");
      }
      try {
        const { upload, reused } = await saveUpload(app.env, app.db, { kind, filename: data.filename, stream: data.file, userId: actor.id });
        if (upload.kind === "video" && !reused) enqueue(app.db, { type: "oyelabs.upload.transcode", payload: { uploadId: upload.id } });
        reply.status(reused ? 200 : 201);
        return uploadView(upload);
      } catch (error) {
        if (error instanceof UploadRejected) throw new HttpError(error.statusCode, ERROR_CODES.BAD_REQUEST, error.message);
        const raw = error as { code?: string; statusCode?: number };
        if (raw.code === "FST_REQ_FILE_TOO_LARGE" || raw.statusCode === 413) throw new HttpError(413, ERROR_CODES.BAD_REQUEST, "That file is too large.");
        throw error;
      }
    },
  );

  /** Upload state, for the card's "Converting…" line. */
  app.get("/api/admin/oyelabs/uploads/:uploadId", async (request): Promise<UploadView> => {
    const { uploadId } = parseOrThrow(uploadParams, request.params, "Unknown upload.");
    const row = app.db.select().from(schema.mediaUploads).where(eq(schema.mediaUploads.id, uploadId)).get();
    if (!row || row.deletedAt) throw notFound("That upload doesn't exist.");
    return uploadView(row);
  });

  /** "Check again" on a saved video: runs the check now and returns the card's new state. */
  app.post("/api/admin/oyelabs/videos/:videoId/check", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, async (request) => {
    const { videoId } = parseOrThrow(z.object({ videoId: id }), request.params, "Unknown video.");
    if (!(await checkVideo(app.db, videoId))) throw notFound("That video isn't in a course.");
    const row = app.db.select().from(schema.courseVideos).where(eq(schema.courseVideos.id, videoId)).get()!;
    return { id: row.id, kind: row.kind, playerKind: row.playerKind, tracking: row.tracking, title: row.title, thumbnailUrl: row.thumbnailUrl, durationSeconds: row.durationSeconds, status: row.status, problem: row.problem ?? null, lastCheckedAt: row.lastCheckedAt };
  });

  app.post("/api/admin/oyelabs/docs/:docId/check", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, async (request) => {
    const { docId } = parseOrThrow(z.object({ docId: id }), request.params, "Unknown document.");
    if (!(await checkDoc(app.db, docId))) throw notFound("That document isn't in a course.");
    const row = app.db.select().from(schema.courseDocs).where(eq(schema.courseDocs.id, docId)).get()!;
    return { id: row.id, linkKind: row.linkKind, title: row.title, status: row.status, problem: row.problem ?? null, lastCheckedAt: row.lastCheckedAt };
  });
}

/** Parses `Range: bytes=a-b` for a file of `size` bytes. Null = no (usable) range; "invalid" = 416. */
export function parseRange(header: string | undefined, size: number): { start: number; end: number } | null | "invalid" {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (!m[1] && !m[2])) return null;
  let start: number;
  let end: number;
  if (!m[1]) {
    const suffix = Number(m[2]);
    if (suffix === 0) return "invalid";
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  }
  if (start >= size || start > end) return "invalid";
  return { start, end };
}

function sendFile(request: FastifyRequest, reply: FastifyReply, file: string, mime: string, download?: string) {
  let size: number;
  try {
    size = fs.statSync(file).size;
  } catch {
    throw notFound("That file is missing.");
  }
  reply.header("accept-ranges", "bytes");
  reply.header("cache-control", "private, max-age=3600");
  reply.header("x-content-type-options", "nosniff");
  reply.type(mime);
  if (download) reply.header("content-disposition", `attachment; filename="${download.replace(/[^\w .()-]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(download)}`);
  const range = parseRange(request.headers.range, size);
  if (range === "invalid") {
    reply.header("content-range", `bytes */${size}`);
    return reply.status(416).send();
  }
  if (range) {
    reply.status(206);
    reply.header("content-range", `bytes ${range.start}-${range.end}/${size}`);
    reply.header("content-length", String(range.end - range.start + 1));
    return reply.send(fs.createReadStream(file, { start: range.start, end: range.end }));
  }
  reply.header("content-length", String(size));
  return reply.send(fs.createReadStream(file));
}

export async function registerOyelabsMediaLearnerRoutes(app: FastifyInstance): Promise<void> {
  /** The module playlist, its docs, and the lock. Same access rule as the course. */
  app.get("/api/v5/oyelabs/lessons/:topicId/playlist", async (request): Promise<ModuleLessonResponse> => {
    const user = requireActiveUser(request);
    const { topicId } = parseOrThrow(lessonParams, request.params, "Unknown lesson.");
    const lesson = moduleLessonFor(app.db, user, topicId);
    const section = app.db.select({ notes: schema.courseSections.notes }).from(schema.courseSections).where(eq(schema.courseSections.id, lesson.sectionId)).get();
    const notes = section?.notes && typeof section.notes === "object" && Array.isArray((section.notes as { content?: unknown }).content) ? (section.notes as ModuleLessonResponse["notes"]) : null;
    return { ...modulePlaylist(app.db, user, lesson), docs: moduleDocs(app.db, lesson), notes };
  });

  /** Exact entries send a v4.3 player sample; estimated entries send an active-time sample. */
  app.post(
    "/api/v5/oyelabs/lessons/:topicId/videos/:videoId/progress",
    { config: { rateLimit: { max: 120, timeWindow: "1 minute" } } },
    async (request): Promise<ModulePlaylistResponse> => {
      const user = requireActiveUser(request);
      const { topicId, videoId } = parseOrThrow(videoParams, request.params, "Unknown video.");
      const lesson = moduleLessonFor(app.db, user, topicId);
      const video = app.db.select().from(schema.courseVideos).where(and(eq(schema.courseVideos.id, videoId), eq(schema.courseVideos.topicId, topicId))).get();
      if (!video) throw notFound("That video isn't part of this module.");
      if (video.tracking === "estimated") recordActiveSample(app.db, user.id, lesson, video, parseOrThrow(activeTimeSampleSchema, request.body));
      else recordExactSample(app.db, user.id, lesson, video, parseOrThrow(videoProgressRequestSchema, request.body));
      return modulePlaylist(app.db, user, lesson);
    },
  );

  /** "I've watched this" (estimated only; refused before 80% active time). */
  app.post("/api/v5/oyelabs/lessons/:topicId/videos/:videoId/watched", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (request): Promise<ModulePlaylistResponse> => {
    const user = requireActiveUser(request);
    const { topicId, videoId } = parseOrThrow(videoParams, request.params, "Unknown video.");
    const lesson = moduleLessonFor(app.db, user, topicId);
    const video = app.db.select().from(schema.courseVideos).where(and(eq(schema.courseVideos.id, videoId), eq(schema.courseVideos.topicId, topicId))).get();
    if (!video) throw notFound("That video isn't part of this module.");
    confirmWatched(app.db, user.id, lesson, video);
    return modulePlaylist(app.db, user, lesson);
  });

  /** An uploaded doc, for someone who may open the course. */
  app.get("/api/v5/oyelabs/lessons/:topicId/docs/:docId", async (request, reply) => {
    const user = requireActiveUser(request);
    const { topicId, docId } = parseOrThrow(docParams, request.params, "Unknown document.");
    const lesson = moduleLessonFor(app.db, user, topicId);
    const doc = app.db.select().from(schema.courseDocs).where(and(eq(schema.courseDocs.id, docId), eq(schema.courseDocs.sectionId, lesson.sectionId))).get();
    if (!doc || doc.source !== "upload" || !doc.uploadId) throw notFound("That document isn't part of this module.");
    const up = app.db.select().from(schema.mediaUploads).where(eq(schema.mediaUploads.id, doc.uploadId)).get();
    if (!up || up.deletedAt) throw notFound("That document was removed.");
    return sendFile(request, reply, uploadPath(app.env, up.relPath), up.mime, safeDisplayName(up.originalName));
  });

  /**
   * Streams an uploaded video with HTTP Range. Staff always; a learner only when a module video of a
   * course they may open uses this upload. Anything else is 404, so ids are never confirmed.
   */
  app.get("/api/v5/oyelabs/media/:uploadId", async (request, reply) => {
    const user = requireActiveUser(request);
    const { uploadId } = parseOrThrow(uploadParams, request.params, "Unknown video.");
    const up = app.db.select().from(schema.mediaUploads).where(eq(schema.mediaUploads.id, uploadId)).get();
    if (!up || up.deletedAt || up.kind !== "video") throw notFound("No such video.");
    if (user.role !== "superadmin" && user.role !== "admin") {
      const courses = app.db.select({ courseId: schema.courseVideos.courseId }).from(schema.courseVideos).where(eq(schema.courseVideos.uploadId, uploadId)).all();
      if (!courses.some((c) => mayOpenOyelabsCourse(app.db, user, c.courseId))) throw notFound("No such video.");
    }
    const playable = uploadPlayable(up);
    if (!playable.ok) throw conflict(playable.reason);
    const { file, mime } = playbackFile(app.env, up);
    return sendFile(request, reply, file, mime);
  });
}
