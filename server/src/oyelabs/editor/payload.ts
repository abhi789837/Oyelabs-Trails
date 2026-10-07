import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";

import type { OyelabsCourseInput, OyelabsCourseView, OyelabsDocView, OyelabsLevel, OyelabsModuleView, OyelabsVideoView } from "../../../../shared/oyelabsCourses";
import { schema, type Db } from "../../db";

/**
 * Reading an Oyelabs course back out of its rows: as the editor's input shape with ids (what a
 * version stores, and what Save compares against), and as the editor's read model.
 *
 * Only reads. Kept apart from `repo.ts` so `v5/admin/versions.ts` can import it without a cycle.
 */

function sortedSections(db: Db, courseId: string) {
  return db.select().from(schema.courseSections).where(eq(schema.courseSections.courseId, courseId)).orderBy(asc(schema.courseSections.position)).all();
}

function moduleTopics(db: Db, courseId: string): Map<string, string> {
  const rows = db
    .select({ id: schema.courseTopics.id, sectionId: schema.courseTopics.sectionId })
    .from(schema.courseTopics)
    .where(and(eq(schema.courseTopics.courseId, courseId), eq(schema.courseTopics.kind, "module")))
    .all();
  return new Map(rows.map((r) => [r.sectionId, r.id]));
}

function videosBySection(db: Db, courseId: string) {
  const rows = db.select().from(schema.courseVideos).where(eq(schema.courseVideos.courseId, courseId)).orderBy(asc(schema.courseVideos.position)).all();
  const map = new Map<string, typeof rows>();
  for (const r of rows) map.set(r.sectionId, [...(map.get(r.sectionId) ?? []), r]);
  return map;
}

function docsBySection(db: Db, courseId: string) {
  const rows = db.select().from(schema.courseDocs).where(eq(schema.courseDocs.courseId, courseId)).orderBy(asc(schema.courseDocs.position)).all();
  const map = new Map<string, typeof rows>();
  for (const r of rows) map.set(r.sectionId, [...(map.get(r.sectionId) ?? []), r]);
  return map;
}

export function courseDepartmentIds(db: Db, courseId: string): string[] {
  return db
    .select({ d: schema.courseDepartments.departmentId })
    .from(schema.courseDepartments)
    .where(eq(schema.courseDepartments.courseId, courseId))
    .all()
    .map((r) => r.d)
    .sort();
}

export function courseSkillIds(db: Db, courseId: string): string[] {
  return db
    .select({ s: schema.courseSkills.skillId })
    .from(schema.courseSkills)
    .where(eq(schema.courseSkills.courseId, courseId))
    .all()
    .map((r) => r.s)
    .sort();
}

/**
 * The course as the editor would send it, with every id. This is what a version stores next to the
 * course (`content_versions.data.oyelabs`), and what a restore turns back into a draft.
 */
export function oyelabsPayload(db: Db, courseId: string): OyelabsCourseInput | null {
  const course = db.select().from(schema.courses).where(eq(schema.courses.id, courseId)).get();
  if (!course || !course.oyelabs) return null;
  const videos = videosBySection(db, courseId);
  const docs = docsBySection(db, courseId);
  return {
    title: course.title,
    description: course.summary,
    level: (course.level ?? "beginner") as OyelabsLevel,
    departmentIds: courseDepartmentIds(db, courseId),
    skillIds: courseSkillIds(db, courseId),
    modules: sortedSections(db, courseId).map((s) => ({
      id: s.id,
      title: s.title,
      videos: (videos.get(s.id) ?? []).map((v) => ({
        id: v.id,
        ...(v.uploadId ? { uploadId: v.uploadId } : { url: v.inputUrl ?? "" }),
        ...(v.titleLocked && v.title ? { title: v.title } : {}),
        ...(v.durationSource === "admin" && v.durationSeconds != null ? { durationSeconds: Math.round(v.durationSeconds) } : {}),
      })),
      docs: (docs.get(s.id) ?? []).map((d) => ({
        id: d.id,
        ...(d.source === "upload" && d.uploadId ? { uploadId: d.uploadId } : { url: d.url ?? "" }),
        ...(d.titleLocked && d.title ? { title: d.title } : {}),
      })),
      notes: s.notes ?? null,
    })),
  };
}

export function latestVersion(db: Db, courseId: string): number {
  return (
    db
      .select({ v: schema.contentVersions.version })
      .from(schema.contentVersions)
      .where(and(eq(schema.contentVersions.entityType, "course"), eq(schema.contentVersions.entityId, courseId)))
      .orderBy(desc(schema.contentVersions.version))
      .get()?.v ?? 0
  );
}

/** The newest autosave draft for a saved course, when it is newer than the course itself. */
export function newerDraft(db: Db, courseId: string, courseUpdatedAt: number): { id: string; updatedAt: number } | null {
  const row = db
    .select({ id: schema.courseDrafts.id, updatedAt: schema.courseDrafts.updatedAt })
    .from(schema.courseDrafts)
    .where(eq(schema.courseDrafts.courseId, courseId))
    .orderBy(desc(schema.courseDrafts.updatedAt))
    .get();
  return row && row.updatedAt > courseUpdatedAt ? row : null;
}

/** Drafts of brand-new courses (never saved) started by this admin, newest first. */
export function unsavedNewDrafts(db: Db, userId: string) {
  return db
    .select()
    .from(schema.courseDrafts)
    .where(and(isNull(schema.courseDrafts.courseId), eq(schema.courseDrafts.createdBy, userId)))
    .orderBy(desc(schema.courseDrafts.updatedAt))
    .limit(10)
    .all();
}

/** The editor's read model (`GET /api/admin/oyelabs/courses/:courseId`). */
export function readCourseView(db: Db, courseId: string): OyelabsCourseView | null {
  const course = db.select().from(schema.courses).where(eq(schema.courses.id, courseId)).get();
  if (!course || !course.oyelabs) return null;
  const topics = moduleTopics(db, courseId);
  const videos = videosBySection(db, courseId);
  const docs = docsBySection(db, courseId);
  const uploadIds = [...docs.values()].flat().map((d) => d.uploadId).filter((u): u is string => Boolean(u));
  const uploads = new Map(
    uploadIds.length
      ? db
          .select({ id: schema.mediaUploads.id, mime: schema.mediaUploads.mime, bytes: schema.mediaUploads.bytes })
          .from(schema.mediaUploads)
          .where(inArray(schema.mediaUploads.id, uploadIds))
          .all()
          .map((u) => [u.id, u])
      : [],
  );
  const tests = new Map(db.select().from(schema.courseModuleTests).where(eq(schema.courseModuleTests.courseId, courseId)).all().map((t) => [t.sectionId, t]));

  const modules: OyelabsModuleView[] = sortedSections(db, courseId).map((s, index) => {
    const test = tests.get(s.id);
    return {
      id: s.id,
      topicId: topics.get(s.id) ?? "",
      position: index,
      title: s.title,
      notes: s.notes ?? null,
      videos: (videos.get(s.id) ?? []).map<OyelabsVideoView>((v, i) => ({
        id: v.id,
        position: i,
        input: v.inputUrl,
        uploadId: v.uploadId,
        kind: v.kind,
        playerKind: v.playerKind,
        tracking: v.tracking,
        title: v.title,
        titleLocked: v.titleLocked,
        thumbnailUrl: v.thumbnailUrl,
        durationSeconds: v.durationSeconds,
        durationSource: v.durationSource ?? null,
        status: v.status,
        problem: v.problem ?? null,
        lastCheckedAt: v.lastCheckedAt,
      })),
      docs: (docs.get(s.id) ?? []).map<OyelabsDocView>((d, i) => {
        const up = d.uploadId ? uploads.get(d.uploadId) : undefined;
        return {
          id: d.id,
          position: i,
          source: d.source,
          uploadId: d.uploadId,
          url: d.url,
          linkKind: d.linkKind ?? null,
          title: d.title,
          titleLocked: d.titleLocked,
          mime: up?.mime ?? null,
          bytes: up?.bytes ?? null,
          status: d.status,
          problem: d.problem ?? null,
          textStatus: d.textStatus,
        };
      }),
      test: test
        ? { status: test.status, summary: test.summary, items: test.itemCount, stale: test.contentHash != null && test.contentHash !== test.generatedHash }
        : { status: "empty", summary: "", items: 0, stale: false },
    };
  });

  return {
    id: course.id,
    title: course.title,
    description: course.summary,
    level: (course.level ?? "beginner") as OyelabsLevel,
    departmentIds: courseDepartmentIds(db, courseId),
    skillIds: courseSkillIds(db, courseId),
    published: course.published,
    version: latestVersion(db, courseId),
    modules,
    draft: newerDraft(db, courseId, course.updatedAt),
    updatedAt: course.updatedAt,
  };
}
