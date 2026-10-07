import { and, eq, ne } from "drizzle-orm";

import { oyelabsDraftDataSchema, type OyelabsCourseInput, type OyelabsDraftData, type OyelabsDraftView } from "../../../../shared/oyelabsCourses";
import { schema, type Db } from "../../db";
import { newId, now } from "../../lib/ids";

/**
 * The editor's autosave (`course_drafts`). The live course is never touched here: a draft is
 * whatever the page holds, loosely validated, until Save turns it into rows.
 */

type DraftRow = typeof schema.courseDrafts.$inferSelect;

/** Rows written by an older build, or by hand, are read leniently: anything unreadable becomes empty. */
export function draftData(raw: unknown): OyelabsDraftData {
  const parsed = oyelabsDraftDataSchema.safeParse(raw);
  return parsed.success ? parsed.data : oyelabsDraftDataSchema.parse({});
}

export function toDraftView(row: DraftRow): OyelabsDraftView {
  return { id: row.id, courseId: row.courseId, data: draftData(row.data), updatedAt: row.updatedAt };
}

/** A saved course's input (with ids) as draft data, for "open this version as a draft". */
export function inputToDraftData(input: OyelabsCourseInput): OyelabsDraftData {
  return draftData({
    ...input,
    modules: input.modules.map((m) => ({ ...m, key: m.id ?? newId() })),
  });
}

export function getDraft(db: Db, draftId: string): DraftRow | null {
  return db.select().from(schema.courseDrafts).where(eq(schema.courseDrafts.id, draftId)).get() ?? null;
}

/**
 * Starts a draft. An admin has one open draft per course: their older drafts of the same course
 * are replaced, so "You have unsaved changes" always means the latest one.
 */
export function createDraft(db: Db, courseId: string | null, data: OyelabsDraftData, actorId: string): DraftRow {
  const at = now();
  if (courseId) {
    db.delete(schema.courseDrafts)
      .where(and(eq(schema.courseDrafts.courseId, courseId), eq(schema.courseDrafts.createdBy, actorId)))
      .run();
  }
  const row: DraftRow = { id: newId(), courseId, data: data as unknown as Record<string, unknown>, createdBy: actorId, updatedBy: actorId, createdAt: at, updatedAt: at };
  db.insert(schema.courseDrafts).values(row).run();
  return row;
}

export function putDraft(db: Db, draftId: string, courseId: string | null, data: OyelabsDraftData, actorId: string): DraftRow | null {
  const existing = getDraft(db, draftId);
  if (!existing) return null;
  const at = Math.max(now(), existing.updatedAt + 1);
  db.update(schema.courseDrafts)
    .set({ courseId: existing.courseId ?? courseId, data: data as unknown as Record<string, unknown>, updatedBy: actorId, updatedAt: at })
    .where(eq(schema.courseDrafts.id, draftId))
    .run();
  return getDraft(db, draftId);
}

export function deleteDraft(db: Db, draftId: string): boolean {
  return db.delete(schema.courseDrafts).where(eq(schema.courseDrafts.id, draftId)).run().changes > 0;
}

/** After a save: the draft it came from and every other draft of the same course by the same admin. */
export function clearDraftsAfterSave(db: Db, courseId: string, draftId: string | undefined, actorId: string): void {
  if (draftId) deleteDraft(db, draftId);
  db.delete(schema.courseDrafts)
    .where(and(eq(schema.courseDrafts.courseId, courseId), eq(schema.courseDrafts.createdBy, actorId), ne(schema.courseDrafts.id, draftId ?? "")))
    .run();
}
