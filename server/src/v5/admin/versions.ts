import { and, desc, eq } from "drizzle-orm";

import type { Course } from "../../../../shared/courses";
import type { OyelabsCourseInput } from "../../../../shared/oyelabsCourses";
import { getCourse } from "../../courses/repo";
import { schema, type Db } from "../../db";
import { newId, now } from "../../lib/ids";
import { createDraft, inputToDraftData } from "../../oyelabs/editor/drafts";
import { oyelabsPayload } from "../../oyelabs/editor/payload";

/**
 * v5 Phase 7: course version history (`content_versions`, entity_type "course").
 *
 * A version is the whole course as `getCourse` reads it (the shape the editor saves through), so a
 * restore can put back every section and lesson exactly. The editor asks for a snapshot after
 * every save; a snapshot identical to the latest one is not stored again, so pressing Save twice
 * doesn't fill the history with copies.
 *
 * Restoring is itself undoable: the current state is snapshotted first, and the restored state
 * becomes a new version on top. Nothing in the history is ever rewritten.
 */

export interface VersionMeta {
  version: number;
  createdAt: number;
  createdBy: string | null;
  createdByName: string | null;
  note: string | null;
  lessons: number;
}

interface StoredVersion {
  course: Course;
  note?: string | null;
  /**
   * v4.5: an Oyelabs course also stores its editor input with every id (videos, docs, notes,
   * departments, skills). Restoring one opens this as a draft in the Oyelabs editor.
   */
  oyelabs?: OyelabsCourseInput;
}

/**
 * The parts of a course a version compares on (not timestamps, which change on every save).
 * An Oyelabs course compares on what the admin wrote, not on values the link checker fills in
 * later (a video's length moves the lesson's minutes), so an unchanged Save adds no version.
 */
function comparable(course: Course, oyelabs?: OyelabsCourseInput | null): string {
  if (oyelabs) return JSON.stringify({ oyelabs, published: course.published });
  const { updatedAt: _u, createdAt: _c, ...rest } = course;
  return JSON.stringify(rest);
}

function latestRow(db: Db, courseId: string) {
  return db
    .select()
    .from(schema.contentVersions)
    .where(and(eq(schema.contentVersions.entityType, "course"), eq(schema.contentVersions.entityId, courseId)))
    .orderBy(desc(schema.contentVersions.version))
    .get();
}

function lessonCount(course: Course): number {
  return course.sections.reduce((n, s) => n + s.topics.length, 0);
}

/** Stores the course as it is now. Returns the new version, or the latest one when nothing changed. */
export function snapshotCourse(db: Db, courseId: string, actorId: string | null, note: string | null = null): { version: number; created: boolean } | null {
  const course = getCourse(db, courseId);
  if (!course) return null;
  const oyelabs = course.oyelabs ? oyelabsPayload(db, courseId) : null;
  const latest = latestRow(db, courseId);
  if (latest) {
    const stored = latest.data as unknown as StoredVersion;
    if (stored?.course && comparable(stored.course, stored.oyelabs) === comparable(course, oyelabs)) return { version: latest.version, created: false };
  }
  const version = (latest?.version ?? 0) + 1;
  const data: StoredVersion = oyelabs ? { course, note, oyelabs } : { course, note };
  db.insert(schema.contentVersions)
    .values({ id: newId(), entityType: "course", entityId: courseId, version, data: data as unknown as Record<string, unknown>, createdBy: actorId, createdAt: now() })
    .run();
  return { version, created: true };
}

export function listVersions(db: Db, courseId: string): VersionMeta[] {
  const rows = db
    .select()
    .from(schema.contentVersions)
    .where(and(eq(schema.contentVersions.entityType, "course"), eq(schema.contentVersions.entityId, courseId)))
    .orderBy(desc(schema.contentVersions.version))
    .limit(200)
    .all();
  const names = new Map(db.select({ id: schema.users.id, n: schema.users.displayName }).from(schema.users).all().map((u) => [u.id, u.n]));
  return rows.map((r) => {
    const stored = r.data as unknown as StoredVersion;
    return {
      version: r.version,
      createdAt: r.createdAt,
      createdBy: r.createdBy,
      createdByName: r.createdBy ? (names.get(r.createdBy) ?? null) : null,
      note: stored?.note ?? null,
      lessons: stored?.course ? lessonCount(stored.course) : 0,
    };
  });
}

function versionRow(db: Db, courseId: string, version: number) {
  return db
    .select()
    .from(schema.contentVersions)
    .where(and(eq(schema.contentVersions.entityType, "course"), eq(schema.contentVersions.entityId, courseId), eq(schema.contentVersions.version, version)))
    .get();
}

export function getVersion(db: Db, courseId: string, version: number): Course | null {
  const row = versionRow(db, courseId, version);
  return row ? ((row.data as unknown as StoredVersion).course ?? null) : null;
}

/** v4.5: the Oyelabs editor input stored with a version (null for ordinary courses and old versions). */
export function getOyelabsVersion(db: Db, courseId: string, version: number): OyelabsCourseInput | null {
  const row = versionRow(db, courseId, version);
  return row ? ((row.data as unknown as StoredVersion).oyelabs ?? null) : null;
}

/**
 * Puts a stored version back. Sections and lessons are matched by id: those in both are updated in
 * place (so learners keep their progress on them), missing ones are recreated with their old ids,
 * and ones added since are removed. Practice tasks and tests on a lesson are not part of a version
 * and are left as they are.
 */
export function restoreVersion(db: Db, courseId: string, version: number, actorId: string): { version: number; removedLessons: number; draftId?: string } | null {
  const target = getVersion(db, courseId, version);
  const current = getCourse(db, courseId);
  if (!target || !current) return null;

  // v4.5: an Oyelabs version is not written back into the rows. It opens as a draft in the
  // Oyelabs editor, and the admin saves it from there (videos, docs and tests follow the save).
  if (current.oyelabs) {
    const payload = getOyelabsVersion(db, courseId, version);
    if (!payload) return null;
    const draft = createDraft(db, courseId, inputToDraftData(payload), actorId);
    return { version: latestRow(db, courseId)?.version ?? version, removedLessons: 0, draftId: draft.id };
  }

  snapshotCourse(db, courseId, actorId, "Before restoring");

  let removedLessons = 0;
  db.transaction((tx) => {
    const at = now();
    tx.update(schema.courses)
      .set({
        title: target.title,
        summary: target.summary,
        accent: target.accent,
        audience: target.audience,
        published: target.published,
        level: target.level ?? null,
        departmentId: target.departmentId ?? null,
        updatedAt: at,
      })
      .where(eq(schema.courses.id, courseId))
      .run();

    const keepSections = new Set(target.sections.map((s) => s.id));
    const keepTopics = new Set(target.sections.flatMap((s) => s.topics.map((t) => t.id)));
    const existingTopics = tx.select({ id: schema.courseTopics.id }).from(schema.courseTopics).where(eq(schema.courseTopics.courseId, courseId)).all();
    for (const t of existingTopics) {
      if (keepTopics.has(t.id)) continue;
      tx.delete(schema.courseTopics).where(eq(schema.courseTopics.id, t.id)).run();
      removedLessons += 1;
    }
    for (const s of tx.select({ id: schema.courseSections.id }).from(schema.courseSections).where(eq(schema.courseSections.courseId, courseId)).all()) {
      if (!keepSections.has(s.id)) tx.delete(schema.courseSections).where(eq(schema.courseSections.id, s.id)).run();
    }

    for (const section of target.sections) {
      const found = tx.select({ id: schema.courseSections.id, courseId: schema.courseSections.courseId }).from(schema.courseSections).where(eq(schema.courseSections.id, section.id)).get();
      if (found && found.courseId !== courseId) continue; // an id now used by another course: never touch it
      if (found) {
        tx.update(schema.courseSections).set({ title: section.title, summary: section.summary, position: section.position }).where(eq(schema.courseSections.id, section.id)).run();
      } else {
        tx.insert(schema.courseSections).values({ id: section.id, courseId, title: section.title, summary: section.summary, position: section.position }).run();
      }
      for (const topic of section.topics) {
        const fields = {
          sectionId: section.id,
          title: topic.title,
          body: topic.body,
          videoId: topic.videoId,
          videoTitle: topic.videoTitle,
          links: topic.links,
          estMinutes: topic.estMinutes,
          position: topic.position,
        };
        const existing = tx.select({ courseId: schema.courseTopics.courseId }).from(schema.courseTopics).where(eq(schema.courseTopics.id, topic.id)).get();
        if (existing && existing.courseId !== courseId) continue;
        if (existing) tx.update(schema.courseTopics).set(fields).where(eq(schema.courseTopics.id, topic.id)).run();
        else tx.insert(schema.courseTopics).values({ id: topic.id, courseId, ...fields }).run();
      }
    }
  });

  const after = snapshotCourse(db, courseId, actorId, `Restored version ${version}`);
  return { version: after?.version ?? version, removedLessons };
}
