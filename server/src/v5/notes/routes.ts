import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { noteCreateSchema, noteUpdateSchema, sortNotes, type LessonNote } from "../../../../shared/lesson";
import { requireActiveUser } from "../../auth/guards";
import { schema, type Db } from "../../db";
import { newId, now } from "../../lib/ids";
import { badRequest, notFound, parseOrThrow } from "../../lib/errors";
import { lessonTopic } from "../lesson/routes";

/**
 * A learner's own notes on a lesson (`lesson_notes`), optionally pinned to a moment in one of its
 * videos. Only the owner can read or change a note; someone else's note id is a plain 404.
 */

const topicParams = z.object({ topicId: z.string().min(1).max(120) });
const noteParams = z.object({ noteId: z.string().min(1).max(64) });

/** A learner can keep this many notes on one lesson. */
export const NOTES_PER_LESSON_MAX = 200;

type Row = typeof schema.lessonNotes.$inferSelect;

export function toNote(row: Row): LessonNote {
  return { id: row.id, topicId: row.topicId, videoId: row.videoId, atSec: row.atSec, body: row.body, createdAt: row.createdAt, updatedAt: row.updatedAt };
}

export function notesFor(db: Db, userId: string, topicId: string): LessonNote[] {
  const rows = db
    .select()
    .from(schema.lessonNotes)
    .where(and(eq(schema.lessonNotes.userId, userId), eq(schema.lessonNotes.topicId, topicId)))
    .all();
  return sortNotes(rows.map(toNote));
}

function ownNote(db: Db, userId: string, noteId: string): Row {
  const row = db
    .select()
    .from(schema.lessonNotes)
    .where(and(eq(schema.lessonNotes.id, noteId), eq(schema.lessonNotes.userId, userId)))
    .get();
  if (!row) throw notFound("That note doesn't exist.");
  return row;
}

export async function registerNoteRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/v5/lessons/:topicId/notes", async (request): Promise<{ notes: LessonNote[] }> => {
    const user = requireActiveUser(request);
    const { topicId } = parseOrThrow(topicParams, request.params, "Unknown lesson.");
    lessonTopic(app, user, topicId);
    return { notes: notesFor(app.db, user.id, topicId) };
  });

  app.post(
    "/api/v5/lessons/:topicId/notes",
    { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    async (request): Promise<{ note: LessonNote }> => {
      const user = requireActiveUser(request);
      const { topicId } = parseOrThrow(topicParams, request.params, "Unknown lesson.");
      const body = parseOrThrow(noteCreateSchema, request.body);
      lessonTopic(app, user, topicId);
      if (notesFor(app.db, user.id, topicId).length >= NOTES_PER_LESSON_MAX) {
        throw badRequest(`You can keep up to ${NOTES_PER_LESSON_MAX} notes on one lesson. Delete a few to add more.`);
      }
      const at = now();
      const row: Row = {
        id: newId(),
        userId: user.id,
        topicId,
        videoId: body.videoId ?? null,
        atSec: body.atSec ?? null,
        body: body.body,
        createdAt: at,
        updatedAt: at,
      };
      app.db.insert(schema.lessonNotes).values(row).run();
      return { note: toNote(row) };
    },
  );

  app.patch("/api/v5/notes/:noteId", async (request): Promise<{ note: LessonNote }> => {
    const user = requireActiveUser(request);
    const { noteId } = parseOrThrow(noteParams, request.params, "Unknown note.");
    const { body } = parseOrThrow(noteUpdateSchema, request.body);
    ownNote(app.db, user.id, noteId);
    app.db.update(schema.lessonNotes).set({ body, updatedAt: now() }).where(eq(schema.lessonNotes.id, noteId)).run();
    return { note: toNote(ownNote(app.db, user.id, noteId)) };
  });

  app.delete("/api/v5/notes/:noteId", async (request): Promise<{ ok: true }> => {
    const user = requireActiveUser(request);
    const { noteId } = parseOrThrow(noteParams, request.params, "Unknown note.");
    ownNote(app.db, user.id, noteId);
    app.db.delete(schema.lessonNotes).where(eq(schema.lessonNotes.id, noteId)).run();
    return { ok: true };
  });
}
