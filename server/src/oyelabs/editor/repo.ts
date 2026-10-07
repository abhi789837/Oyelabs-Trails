import { and, eq, inArray, notInArray } from "drizzle-orm";

import type { JobType } from "../../../../shared/enums";
import type { ModuleSourceKind } from "../../../../shared/moduleTests";
import type { NotesDoc, OyelabsCourseInput, SaveOyelabsCourseRequest, SaveOyelabsCourseResponse } from "../../../../shared/oyelabsCourses";
import { schema, type Db } from "../../db";
import { enqueue } from "../../jobs/queue";
import { writeAudit } from "../../lib/audit";
import { badRequest, notFound } from "../../lib/errors";
import { newId, now } from "../../lib/ids";
import { getOyelabsVersion, snapshotCourse } from "../../v5/admin/versions";
import { clearDraftsAfterSave } from "./drafts";
import { moduleMinutes } from "./minutes";
import { provisionalDocLink, provisionalForLink, provisionalForUpload } from "./provisional";

/**
 * Save & publish / Save as draft for an Oyelabs course (PLAN.md §4.1).
 *
 * One transaction writes the course, its departments and skills, one section + one managed lesson
 * per module, and the module's videos and docs in order. Ids the editor sends back are reused, so
 * an edit never touches `course_progress`, `video_progress` or test attempts. Then a version is
 * stored (an identical save stores none), the draft is removed and the jobs of §3.3 are queued.
 */

/** Plain text of Tiptap notes, for `notes_text` (the module test reads it, search may too). */
export function notesToText(doc: NotesDoc | null): string {
  if (!doc) return "";
  const blocks: string[] = [];
  const walk = (node: unknown, out: string[]): void => {
    if (!node || typeof node !== "object") return;
    const n = node as { type?: string; text?: string; content?: unknown[] };
    if (n.type === "text" && typeof n.text === "string") out.push(n.text);
    if (n.type === "hardBreak") out.push("\n");
    for (const child of n.content ?? []) walk(child, out);
  };
  for (const block of doc.content) {
    const out: string[] = [];
    walk(block, out);
    const text = out.join("").trim();
    if (text) blocks.push(text);
  }
  return blocks.join("\n\n").slice(0, 200_000);
}

interface QueuedJob {
  type: JobType;
  payload: Record<string, unknown>;
}

interface Before {
  videos: Map<string, { url: string | null; uploadId: string | null }>;
  docs: Map<string, { url: string | null; uploadId: string | null }>;
}

function sameSource(a: { url?: string | null; uploadId?: string | null } | undefined, b: { url?: string | undefined; uploadId?: string | undefined }): boolean {
  if (!a) return false;
  return (a.url ?? null) === (b.url ?? null) && (a.uploadId ?? null) === (b.uploadId ?? null);
}

function checkReferences(db: Db, input: OyelabsCourseInput): void {
  if (input.departmentIds.length) {
    const known = new Set(db.select({ id: schema.departments.id }).from(schema.departments).where(inArray(schema.departments.id, input.departmentIds)).all().map((d) => d.id));
    if (input.departmentIds.some((d) => !known.has(d))) throw badRequest("One of the departments isn't there any more. Refresh the page and pick again.", { departmentIds: "Unknown department" });
  }
  if (input.skillIds.length) {
    const known = new Set(
      db
        .select({ id: schema.skills.id })
        .from(schema.skills)
        .where(and(inArray(schema.skills.id, input.skillIds), notInArray(schema.skills.status, ["archived"])))
        .all()
        .map((s) => s.id),
    );
    if (input.skillIds.some((s) => !known.has(s))) throw badRequest("One of the skills isn't in the list any more. Remove it and pick another.", { skillIds: "Unknown skill" });
  }
  const uploadIds = input.modules.flatMap((m) => [...m.videos, ...m.docs].map((x) => x.uploadId).filter((u): u is string => Boolean(u)));
  if (uploadIds.length) {
    const rows = new Map(
      db
        .select({ id: schema.mediaUploads.id, kind: schema.mediaUploads.kind, deletedAt: schema.mediaUploads.deletedAt })
        .from(schema.mediaUploads)
        .where(inArray(schema.mediaUploads.id, uploadIds))
        .all()
        .map((u) => [u.id, u]),
    );
    input.modules.forEach((m, i) => {
      for (const [list, kind, noun] of [
        [m.videos, "video", "video"],
        [m.docs, "doc", "document"],
      ] as const) {
        for (const x of list) {
          if (!x.uploadId) continue;
          const up = rows.get(x.uploadId);
          if (!up || up.deletedAt != null || up.kind !== kind) {
            throw badRequest(`Module ${i + 1}: an uploaded ${noun} isn't on the server any more. Upload it again.`, { [`modules.${i}`]: "Missing upload" });
          }
        }
      }
    });
  }
}

/** Saves the course. `courseId` null = a brand-new course. */
export function saveOyelabsCourse(db: Db, courseId: string | null, request: SaveOyelabsCourseRequest, actorId: string): SaveOyelabsCourseResponse {
  const input = request.course;
  const publish = request.action === "publish";
  const existing = courseId ? db.select().from(schema.courses).where(eq(schema.courses.id, courseId)).get() : undefined;
  if (courseId && (!existing || !existing.oyelabs)) throw notFound("We couldn't find that course.");
  checkReferences(db, input);

  const id = existing?.id ?? newId();
  const at = now();
  const before: Before = { videos: new Map(), docs: new Map() };
  if (existing) {
    for (const v of db.select().from(schema.courseVideos).where(eq(schema.courseVideos.courseId, id)).all()) before.videos.set(v.id, { url: v.inputUrl, uploadId: v.uploadId });
    for (const d of db.select().from(schema.courseDocs).where(eq(schema.courseDocs.courseId, id)).all()) before.docs.set(d.id, { url: d.url, uploadId: d.uploadId });
  }
  // What learners saw last: publish compares against it, so changes made in draft saves count too.
  const published = existing?.publishedVersion ? getOyelabsVersion(db, id, existing.publishedVersion) : null;

  const uploads = new Map(
    db
      .select({ id: schema.mediaUploads.id, name: schema.mediaUploads.originalName, duration: schema.mediaUploads.durationSeconds })
      .from(schema.mediaUploads)
      .where(inArray(schema.mediaUploads.id, input.modules.flatMap((m) => [...m.videos, ...m.docs].map((x) => x.uploadId ?? "")).filter(Boolean)))
      .all()
      .map((u) => [u.id, u]),
  );

  const linkChecks: QueuedJob[] = [];
  const saved: { sectionId: string; topicId: string; module: OyelabsCourseInput["modules"][number]; videoIds: string[]; docIds: string[] }[] = [];

  db.transaction((tx) => {
    // 1. The course row. Oyelabs courses use course_departments, never the legacy department_id.
    const fields = {
      title: input.title,
      summary: input.description,
      level: input.level,
      audience: "everyone" as const,
      departmentId: null,
      oyelabs: true,
      published: publish,
      updatedAt: at,
    };
    if (existing) tx.update(schema.courses).set(fields).where(eq(schema.courses.id, id)).run();
    else tx.insert(schema.courses).values({ id, ...fields, accent: "glacier", origin: "manual", position: tx.select({ id: schema.courses.id }).from(schema.courses).all().length, createdBy: actorId, createdAt: at }).run();

    // 2. Departments and skills are replaced as a set.
    tx.delete(schema.courseDepartments).where(eq(schema.courseDepartments.courseId, id)).run();
    for (const departmentId of new Set(input.departmentIds)) tx.insert(schema.courseDepartments).values({ courseId: id, departmentId }).run();
    tx.delete(schema.courseSkills).where(eq(schema.courseSkills.courseId, id)).run();
    for (const skillId of new Set(input.skillIds)) tx.insert(schema.courseSkills).values({ courseId: id, skillId }).run();

    // An id from the editor is reused when it is this course's, recreated when it no longer exists
    // anywhere (a restored version), and replaced when another course owns it.
    const ownSections = new Set(tx.select({ id: schema.courseSections.id }).from(schema.courseSections).where(eq(schema.courseSections.courseId, id)).all().map((s) => s.id));
    const usedIds = new Set<string>();
    const pick = (wanted: string | undefined, own: (x: string) => boolean, exists: (x: string) => boolean): { id: string; isNew: boolean } => {
      if (wanted && !usedIds.has(wanted)) {
        if (own(wanted)) {
          usedIds.add(wanted);
          return { id: wanted, isNew: false };
        }
        if (!exists(wanted)) {
          usedIds.add(wanted);
          return { id: wanted, isNew: true };
        }
      }
      const fresh = newId();
      usedIds.add(fresh);
      return { id: fresh, isNew: true };
    };

    const keepSections: string[] = [];
    const keepVideos: string[] = [];
    const keepDocs: string[] = [];

    input.modules.forEach((module, position) => {
      // 3. The section, and exactly one managed lesson in it.
      const section = pick(module.id, (x) => ownSections.has(x), (x) => tx.select({ id: schema.courseSections.id }).from(schema.courseSections).where(eq(schema.courseSections.id, x)).get() !== undefined);
      const notesText = notesToText(module.notes);
      if (section.isNew) tx.insert(schema.courseSections).values({ id: section.id, courseId: id, title: module.title, position, notes: module.notes, notesText }).run();
      else tx.update(schema.courseSections).set({ title: module.title, position, notes: module.notes, notesText }).where(eq(schema.courseSections.id, section.id)).run();
      keepSections.push(section.id);

      const topics = tx.select({ id: schema.courseTopics.id, kind: schema.courseTopics.kind }).from(schema.courseTopics).where(eq(schema.courseTopics.sectionId, section.id)).all();
      const managed = topics.find((t) => t.kind === "module");
      const topicId = managed?.id ?? newId();
      for (const t of topics) if (t.id !== topicId) tx.delete(schema.courseTopics).where(eq(schema.courseTopics.id, t.id)).run();
      if (managed) tx.update(schema.courseTopics).set({ title: module.title, position: 0 }).where(eq(schema.courseTopics.id, topicId)).run();
      else tx.insert(schema.courseTopics).values({ id: topicId, sectionId: section.id, courseId: id, title: module.title, kind: "module", position: 0, estMinutes: 10 }).run();

      // 4. Videos, in order.
      const videoIds: string[] = [];
      module.videos.forEach((video, vpos) => {
        const row = pick(video.id, (x) => before.videos.has(x), (x) => tx.select({ id: schema.courseVideos.id }).from(schema.courseVideos).where(eq(schema.courseVideos.id, x)).get() !== undefined);
        const prev = row.isNew ? undefined : before.videos.get(row.id);
        const changed = !sameSource(prev, video);
        const upload = video.uploadId ? uploads.get(video.uploadId) : undefined;
        const durationSeconds = video.durationSeconds ?? (upload?.duration ?? null);
        const common = {
          courseId: id,
          sectionId: section.id,
          topicId,
          position: vpos,
          ...(video.title ? { title: video.title, titleLocked: true } : { titleLocked: false }),
          ...(video.durationSeconds != null ? { durationSeconds: video.durationSeconds, durationSource: "admin" as const } : {}),
          updatedAt: at,
        };
        if (changed) {
          const provisional = video.uploadId ? provisionalForUpload(video.uploadId) : provisionalForLink(video.url!);
          const fresh = {
            ...common,
            ...provisional,
            inputUrl: video.url ?? null,
            uploadId: video.uploadId ?? null,
            title: video.title ?? upload?.name ?? "",
            durationSeconds,
            durationSource: video.durationSeconds != null ? ("admin" as const) : upload?.duration != null ? ("probe" as const) : null,
            status: video.uploadId ? ("ok" as const) : ("pending" as const),
            problem: null,
            lastCheckedAt: null,
            brokenSince: null,
            transcriptStatus: "pending" as const,
          };
          if (row.isNew) tx.insert(schema.courseVideos).values({ id: row.id, ...fresh, createdAt: at }).run();
          else tx.update(schema.courseVideos).set(fresh).where(eq(schema.courseVideos.id, row.id)).run();
          if (video.url) linkChecks.push({ type: "oyelabs.link.check", payload: { videoId: row.id } });
        } else {
          tx.update(schema.courseVideos).set(common).where(eq(schema.courseVideos.id, row.id)).run();
        }
        keepVideos.push(row.id);
        videoIds.push(row.id);
      });

      // 4b. Documents, in order.
      const docIds: string[] = [];
      module.docs.forEach((doc, dpos) => {
        const row = pick(doc.id, (x) => before.docs.has(x), (x) => tx.select({ id: schema.courseDocs.id }).from(schema.courseDocs).where(eq(schema.courseDocs.id, x)).get() !== undefined);
        const prev = row.isNew ? undefined : before.docs.get(row.id);
        const changed = !sameSource(prev, doc);
        const upload = doc.uploadId ? uploads.get(doc.uploadId) : undefined;
        const common = {
          courseId: id,
          sectionId: section.id,
          position: dpos,
          ...(doc.title ? { title: doc.title, titleLocked: true } : { titleLocked: false }),
          updatedAt: at,
        };
        if (changed) {
          const fresh = {
            ...common,
            source: doc.uploadId ? ("upload" as const) : ("link" as const),
            uploadId: doc.uploadId ?? null,
            url: doc.url ?? null,
            ...(doc.url ? provisionalDocLink(doc.url) : { linkKind: null, fetchUrl: null }),
            title: doc.title ?? upload?.name ?? "",
            status: doc.uploadId ? ("ok" as const) : ("pending" as const),
            problem: null,
            lastCheckedAt: null,
            brokenSince: null,
            textStatus: "pending" as const,
          };
          if (row.isNew) tx.insert(schema.courseDocs).values({ id: row.id, ...fresh, createdAt: at }).run();
          else tx.update(schema.courseDocs).set(fresh).where(eq(schema.courseDocs.id, row.id)).run();
          if (doc.url) linkChecks.push({ type: "oyelabs.link.check", payload: { docId: row.id } });
        } else {
          tx.update(schema.courseDocs).set(common).where(eq(schema.courseDocs.id, row.id)).run();
        }
        keepDocs.push(row.id);
        docIds.push(row.id);
      });

      saved.push({ sectionId: section.id, topicId, module, videoIds, docIds });
    });

    // 5. Whatever the editor no longer sends is removed (a module's lesson and progress go with it).
    tx.delete(schema.courseVideos).where(and(eq(schema.courseVideos.courseId, id), keepVideos.length ? notInArray(schema.courseVideos.id, keepVideos) : undefined)).run();
    tx.delete(schema.courseDocs).where(and(eq(schema.courseDocs.courseId, id), keepDocs.length ? notInArray(schema.courseDocs.id, keepDocs) : undefined)).run();
    tx.delete(schema.courseSections).where(and(eq(schema.courseSections.courseId, id), notInArray(schema.courseSections.id, keepSections))).run();
  });

  for (const s of saved) moduleMinutes(db, s.topicId);

  // 6. The version, what learners see, the draft, and the jobs.
  const snap = snapshotCourse(db, id, actorId, request.note ?? null);
  const version = snap?.version ?? 0;
  if (publish) db.update(schema.courses).set({ publishedVersion: version }).where(eq(schema.courses.id, id)).run();
  clearDraftsAfterSave(db, id, request.draftId, actorId);

  const jobs: QueuedJob[] = [...linkChecks];
  const regenerating: string[] = [];
  if (publish) {
    const prevModules = new Map((published?.modules ?? []).map((m) => [m.id, m]));
    const descriptionChanged = !published || published.description !== input.description;
    for (const s of saved) {
      const prev = prevModules.get(s.sectionId);
      const prevVideos = new Map((prev?.videos ?? []).map((v) => [v.id, v]));
      const prevDocs = new Map((prev?.docs ?? []).map((d) => [d.id, d]));
      let changed = !prev || descriptionChanged;
      s.module.videos.forEach((v, i) => {
        const was = prevVideos.get(s.videoIds[i]);
        if (!was || (was.url ?? null) !== (v.url ?? null) || (was.uploadId ?? null) !== (v.uploadId ?? null)) {
          jobs.push({ type: "oyelabs.transcribe", payload: { videoId: s.videoIds[i] } });
          changed = true;
        }
      });
      s.module.docs.forEach((d, i) => {
        const was = prevDocs.get(s.docIds[i]);
        if (!was || (was.url ?? null) !== (d.url ?? null) || (was.uploadId ?? null) !== (d.uploadId ?? null)) {
          const sourceKind: ModuleSourceKind = d.uploadId ? "doc" : "doc_link";
          jobs.push({ type: "oyelabs.text.extract", payload: { sectionId: s.sectionId, sourceKind, sourceId: s.docIds[i] } });
          changed = true;
        }
      });
      if (prev && (prev.videos.length !== s.videoIds.length || prev.docs.length !== s.docIds.length || prev.videos.some((v) => !s.videoIds.includes(v.id ?? "")) || prev.docs.some((d) => !s.docIds.includes(d.id ?? "")))) changed = true;
      if (!prev || JSON.stringify(prev.notes ?? null) !== JSON.stringify(s.module.notes ?? null)) {
        jobs.push({ type: "oyelabs.text.extract", payload: { sectionId: s.sectionId, sourceKind: "note" satisfies ModuleSourceKind, sourceId: s.sectionId } });
        changed = true;
      }
      if (descriptionChanged) jobs.push({ type: "oyelabs.text.extract", payload: { sectionId: s.sectionId, sourceKind: "description" satisfies ModuleSourceKind, sourceId: s.sectionId } });
      if (changed) regenerating.push(s.sectionId);
    }
    // C's generator is idempotent (content hash), so every module is queued and it decides.
    for (const s of saved) jobs.push({ type: "oyelabs.module_test.generate", payload: { sectionId: s.sectionId, reason: "publish" } });
    jobs.push({ type: "oyelabs.course.embed", payload: { courseId: id } });
  }
  for (const job of jobs) enqueue(db, { type: job.type, payload: job.payload });

  writeAudit(db, {
    actorId,
    action: publish ? "oyelabs.course_published" : "oyelabs.course_saved_draft",
    targetType: "course",
    targetId: id,
    details: { version, modules: saved.length, created: !existing },
  });

  return { courseId: id, version, published: publish, regenerating };
}
