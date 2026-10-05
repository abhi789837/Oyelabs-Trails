import { and, eq } from "drizzle-orm";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";

import { ERROR_CODES } from "../../../shared/api";
import { requireActiveUser, requireStaff, requireSuperadmin } from "../auth/guards";
import { schema } from "../db";
import { enqueue } from "../jobs/queue";
import { badRequest, conflict, HttpError, notFound, parseOrThrow } from "../lib/errors";
import { AUDIO_RETENTION_MAX_DAYS, getAudioRetentionDays, setAudioRetentionDays } from "../maintenance/retention";
import {
  baseMime,
  getRecording,
  isAllowedMime,
  looksLike,
  MAX_AUDIO_BYTES,
  readRecordingAudio,
  saveRecording,
  type AudioRecording,
} from "../speech/store";

/**
 * v4.4 Speak recordings (docs/v4.4/PLAN.md "Speak").
 *
 * Learners upload; only staff can hear. A learner's own replay before submitting happens from
 * the Blob still in their browser, so there is deliberately no learner route that returns audio.
 */

const idParams = z.object({ id: z.string().min(1).max(64) });

const uploadFields = z
  .object({
    assessmentId: z.string().min(1).max(64).optional(),
    itemId: z.string().min(1).max(64).optional(),
    topicId: z.string().min(1).max(200).optional(),
    durationSec: z.coerce.number().min(0).max(600).optional(),
  })
  .refine((v) => (v.assessmentId ? !!v.itemId && !v.topicId : !!v.topicId && !v.itemId), {
    message: "Send either assessmentId with itemId, or topicId.",
  });

const retentionBody = z.object({ days: z.number().int().min(1).max(AUDIO_RETENTION_MAX_DAYS) });

/** The multipart envelope around a 6 MB file and a few short fields. */
const UPLOAD_BODY_LIMIT = MAX_AUDIO_BYTES + 64 * 1024;

const unsupportedMedia = (message: string) => new HttpError(415, ERROR_CODES.BAD_REQUEST, message);
const tooLarge = () => new HttpError(413, ERROR_CODES.BAD_REQUEST, "That recording is too large. Keep answers under 90 seconds.");
const gone = () =>
  new HttpError(410, ERROR_CODES.NOT_FOUND, "This recording was deleted under the audio retention setting. The transcript is still kept.");

export async function registerSpeechRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/api/recordings",
    {
      bodyLimit: UPLOAD_BODY_LIMIT,
      config: {
        rateLimit: {
          max: 20,
          timeWindow: "1 minute",
          keyGenerator: (request: FastifyRequest) => request.currentUser?.id ?? request.ip,
        },
      },
    },
    async (request, reply) => {
      const user = requireActiveUser(request);
      if (!request.isMultipart()) throw badRequest("Send the recording as multipart form data, in a field named audio.");

      const fields: Record<string, string> = { ...(request.query as Record<string, string>) };
      let audio: Buffer | null = null;
      let mime = "";
      try {
        for await (const part of request.parts({ limits: { fileSize: MAX_AUDIO_BYTES, files: 1, fields: 8, fieldSize: 1024 } })) {
          if (part.type === "file") {
            const buffer = await part.toBuffer();
            if (part.fieldname !== "audio") continue;
            mime = baseMime(part.mimetype);
            audio = buffer;
          } else if (typeof part.value === "string") {
            fields[part.fieldname] = part.value;
          }
        }
      } catch (error) {
        if (error instanceof HttpError) throw error;
        const raw = error as { code?: string; statusCode?: number };
        if (raw.code === "FST_REQ_FILE_TOO_LARGE" || raw.statusCode === 413) throw tooLarge();
        throw error;
      }

      if (!audio || audio.length === 0) throw badRequest("No recording was attached. Send it in a field named audio.");
      if (!isAllowedMime(mime)) throw unsupportedMedia("That audio format is not supported. Use WebM, Ogg, MP4, MP3 or WAV.");
      if (!looksLike(mime, audio)) throw unsupportedMedia("That file does not look like the audio format it claims to be.");

      const target = parseOrThrow(uploadFields, fields);

      if (target.assessmentId) {
        const assessment = app.db.select().from(schema.assessments).where(eq(schema.assessments.id, target.assessmentId)).get();
        // Someone else's assessment is "not found", not "forbidden": no confirming that an id exists.
        if (!assessment || assessment.userId !== user.id) throw notFound("No such assessment.");
        if (assessment.status !== "in_progress") throw conflict("This assessment is not in progress, so a recording cannot be added.");
        const item = app.db
          .select({ id: schema.assessmentItems.id })
          .from(schema.assessmentItems)
          .where(and(eq(schema.assessmentItems.id, target.itemId!), eq(schema.assessmentItems.assessmentId, assessment.id)))
          .get();
        if (!item) throw notFound("No such question in this assessment.");
      } else if (!app.content.hasTopic(target.topicId!)) {
        throw notFound("No such topic.");
      }

      const recording = await saveRecording(app.db, app.env, {
        userId: user.id,
        assessmentId: target.assessmentId ?? null,
        itemId: target.itemId ?? null,
        topicId: target.topicId ?? null,
        mime,
        audio,
        durationSec: target.durationSec ?? null,
      });
      enqueue(app.db, { type: "speech.transcribe", payload: { recordingId: recording.id } });

      return reply.status(201).send({ recordingId: recording.id });
    },
  );

  /** The owner's view: only whether transcription has finished. The transcript is for staff. */
  app.get("/api/recordings/:id/status", async (request) => {
    const user = requireActiveUser(request);
    const { id } = parseOrThrow(idParams, request.params);
    const recording = getRecording(app.db, id);
    if (!recording || recording.userId !== user.id) throw notFound("No such recording.");
    return { recordingId: recording.id, sttStatus: recording.sttStatus };
  });

  app.get("/api/admin/recordings/:id", async (request) => {
    requireStaff(request);
    const { id } = parseOrThrow(idParams, request.params);
    const recording = getRecording(app.db, id);
    if (!recording) throw notFound("No such recording.");
    return { recording: adminView(recording) };
  });

  app.get("/api/admin/recordings/:id/audio", async (request, reply) => {
    requireStaff(request);
    const { id } = parseOrThrow(idParams, request.params);
    const recording = getRecording(app.db, id);
    if (!recording) throw notFound("No such recording.");
    if (recording.audioDeletedAt) throw gone();
    const audio = await readRecordingAudio(app.env, recording);
    if (!audio) throw gone();
    return reply.type(recording.mime).header("cache-control", "private, no-store").send(audio);
  });

  app.get("/api/admin/settings/audio-retention", async (request) => {
    requireSuperadmin(request);
    return retentionView(getAudioRetentionDays(app.db));
  });

  app.put("/api/admin/settings/audio-retention", async (request) => {
    requireSuperadmin(request);
    const { days } = parseOrThrow(retentionBody, request.body);
    setAudioRetentionDays(app.db, days);
    return retentionView(days);
  });
}

function retentionView(days: number) {
  return {
    days,
    summary: `Voice recordings are deleted ${days} ${days === 1 ? "day" : "days"} after they are made. The written transcript is kept.`,
  };
}

function adminView(r: AudioRecording) {
  return {
    id: r.id,
    userId: r.userId,
    assessmentId: r.assessmentId,
    itemId: r.itemId,
    topicId: r.topicId,
    mime: r.mime,
    bytes: r.bytes,
    durationSec: r.durationSec,
    sttStatus: r.sttStatus,
    sttError: r.sttError,
    transcript: r.transcript,
    words: r.words,
    metrics: r.metrics,
    createdAt: r.createdAt,
    audioDeletedAt: r.audioDeletedAt,
    audioAvailable: r.audioDeletedAt == null,
  };
}
