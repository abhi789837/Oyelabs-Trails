import { and, asc, eq, inArray } from "drizzle-orm";

import type { SessionUser } from "../../../../shared/auth";
import { isStaffRole } from "../../../../shared/uiFlag";
import {
  addPlayedInterval,
  isWatched,
  resumePosition,
  SAMPLE_INTERVAL_SEC,
  watchedSeconds,
  WATCHED_RATIO,
  type Range,
  type VideoProgressRequest,
} from "../../../../shared/video";
import { ERROR_CODES } from "../../../../shared/api";
import {
  creditedActiveSeconds,
  estimatedProgress,
  isBrokenStatus,
  type ActiveTimeSample,
  type ModuleDocEntry,
  type ModulePlaylistEntry,
  type ModulePlaylistResponse,
} from "../../../../shared/videoSources";
import { mayOpenCourse } from "../../courses/repo";
import { schema, type Db } from "../../db";
import { conflict, HttpError, notFound } from "../../lib/errors";
import { now } from "../../lib/ids";
import { getVideoLockMode } from "../../videos/repo";
import { moduleMinutes } from "../editor/minutes";
import { isCourseVisible, learnerVisibilityFacts } from "../visibility";
import { uploadPlayable } from "./storage";

/**
 * v4.5 Phase 2: watching a module's playlist.
 *
 * - **Exact** entries (YouTube, Vimeo, our HTML5 player for Dropbox/direct/uploads) record played
 *   ranges exactly like v4.3 (`addPlayedInterval`: seeks and replays never count), and are watched
 *   at 90% of the video (`WATCHED_RATIO`).
 * - **Estimated** entries (Drive, OneDrive, Box, Loom, other pages) record active time only: the
 *   client counts while the page is visible, focused and not idle, and the server caps each sample
 *   by the wall clock since the previous one. Watched = active time ≥ 80% of the length **and** the
 *   learner's "I've watched this" click.
 * - **The lock** is v4.3's (`videos.lock_mode`): the module test waits until every available video
 *   is watched. Broken links don't block. Staff and learners who already finished the module are
 *   exempt. Builder C's attempt route calls `assertModuleVideosWatched`.
 */

type VideoRow = typeof schema.courseVideos.$inferSelect;
type ProgressRow = typeof schema.videoProgress.$inferSelect;

export interface ModuleLesson {
  topicId: string;
  courseId: string;
  sectionId: string;
}

/** The module's managed lesson, or null when `topicId` isn't one. */
export function findModuleLesson(db: Db, topicId: string): ModuleLesson | null {
  const row = db
    .select({ id: schema.courseTopics.id, courseId: schema.courseTopics.courseId, sectionId: schema.courseTopics.sectionId, kind: schema.courseTopics.kind })
    .from(schema.courseTopics)
    .where(eq(schema.courseTopics.id, topicId))
    .get();
  return row && row.kind === "module" ? { topicId: row.id, courseId: row.courseId, sectionId: row.sectionId } : null;
}

/**
 * Whether this person may open this course's lessons and files: staff always (they preview drafts);
 * learners when the course is open to them under the one visibility rule (assigned, a department
 * rule, or an everyone-course for their department).
 */
export function mayOpenOyelabsCourse(db: Db, user: SessionUser, courseId: string): boolean {
  if (isStaffRole(user.role)) return true;
  if (!mayOpenCourse(db, user.id, courseId)) return false;
  const course = db
    .select({ id: schema.courses.id, published: schema.courses.published, audience: schema.courses.audience, departmentId: schema.courses.departmentId })
    .from(schema.courses)
    .where(eq(schema.courses.id, courseId))
    .get();
  return Boolean(course && isCourseVisible(course, learnerVisibilityFacts(db, user.id)));
}

/** The module lesson, when this person may open it; otherwise 404 (never confirm an id exists). */
export function moduleLessonFor(db: Db, user: SessionUser, topicId: string): ModuleLesson {
  const lesson = findModuleLesson(db, topicId);
  if (!lesson || !mayOpenOyelabsCourse(db, user, lesson.courseId)) throw notFound("No such lesson.");
  return lesson;
}

export function moduleVideos(db: Db, topicId: string): VideoRow[] {
  return db.select().from(schema.courseVideos).where(eq(schema.courseVideos.topicId, topicId)).orderBy(asc(schema.courseVideos.position)).all();
}

/** Kinds where "private" can mean "shared with Oyelabs only": signed-in learners can still play them. */
const ORG_SHAREABLE = new Set(["gdrive", "onedrive", "box"]);

function unavailableReason(video: VideoRow, uploads: Map<string, typeof schema.mediaUploads.$inferSelect>): string | null {
  if (video.kind === "upload") {
    const playable = uploadPlayable(video.uploadId ? uploads.get(video.uploadId) : undefined);
    return playable.ok ? null : playable.reason;
  }
  if (!isBrokenStatus(video.status)) return null;
  if (video.status === "private" && ORG_SHAREABLE.has(video.kind)) return null;
  return video.problem?.message ?? "This video can't play right now.";
}

function uploadsFor(db: Db, videos: readonly VideoRow[]): Map<string, typeof schema.mediaUploads.$inferSelect> {
  const ids = videos.map((v) => v.uploadId).filter((id): id is string => Boolean(id));
  if (ids.length === 0) return new Map();
  return new Map(db.select().from(schema.mediaUploads).where(inArray(schema.mediaUploads.id, ids)).all().map((u) => [u.id, u]));
}

/** The URL our HTML5 player streams an upload from. */
export function uploadStreamUrl(uploadId: string): string {
  return `/api/v5/oyelabs/media/${encodeURIComponent(uploadId)}`;
}

function entryFor(video: VideoRow, order: number, row: ProgressRow | undefined, unavailable: string | null): ModulePlaylistEntry {
  const duration = video.durationSeconds ?? row?.durationSeconds ?? null;
  const common = {
    videoId: video.id,
    order,
    kind: video.kind,
    playerKind: video.playerKind,
    tracking: video.tracking,
    title: video.title || "Video",
    thumbnailUrl: video.thumbnailUrl,
    embedUrl: video.embedUrl,
    playbackUrl: video.kind === "upload" && video.uploadId ? uploadStreamUrl(video.uploadId) : video.playbackUrl,
    durationSeconds: duration,
  };
  if (video.tracking === "estimated") {
    const active = row?.activeSeconds ?? 0;
    const confirmed = Boolean(row?.confirmedAt);
    const est = estimatedProgress(active, duration, confirmed);
    return {
      ...common,
      watchedSeconds: Math.round(active * 100) / 100,
      requiredSeconds: est.requiredSeconds,
      progress: est.progress,
      resumeAt: 0,
      confirmed,
      canConfirm: est.canConfirm && !confirmed,
      watched: est.watched,
      status: unavailable ? "unavailable" : est.watched ? "watched" : active > 0 ? "in-progress" : "not-started",
      ...(unavailable ? { unavailableReason: unavailable } : {}),
    };
  }
  const segment = { start: 0, end: null, openChapter: false };
  const watched = row ? watchedSeconds((row.ranges ?? []) as Range[], duration ? { start: 0, end: duration } : undefined) : 0;
  const done = isWatched(watched, duration);
  const lastPosition = row?.lastPosition ?? 0;
  return {
    ...common,
    watchedSeconds: watched,
    requiredSeconds: duration ? Math.round(duration * WATCHED_RATIO * 100) / 100 : null,
    progress: duration ? Math.min(1, watched / (duration * WATCHED_RATIO)) : 0,
    resumeAt: resumePosition(lastPosition, segment, duration),
    confirmed: false,
    canConfirm: false,
    watched: done,
    status: unavailable ? "unavailable" : done ? "watched" : watched > 0 || lastPosition > 1 ? "in-progress" : "not-started",
    ...(unavailable ? { unavailableReason: unavailable } : {}),
  };
}

function progressRows(db: Db, userId: string, topicId: string): Map<string, ProgressRow> {
  return new Map(
    db
      .select()
      .from(schema.videoProgress)
      .where(and(eq(schema.videoProgress.userId, userId), eq(schema.videoProgress.topicId, topicId)))
      .all()
      .map((r) => [r.videoId, r]),
  );
}

function moduleCompleted(db: Db, userId: string, topicId: string): boolean {
  return (
    db
      .select({ t: schema.courseProgress.topicId })
      .from(schema.courseProgress)
      .where(and(eq(schema.courseProgress.userId, userId), eq(schema.courseProgress.topicId, topicId)))
      .get() !== undefined
  );
}

/** The learner's playlist for one module, with the lock. */
export function modulePlaylist(db: Db, user: SessionUser, lesson: ModuleLesson): ModulePlaylistResponse {
  const videos = moduleVideos(db, lesson.topicId);
  const uploads = uploadsFor(db, videos);
  const rows = progressRows(db, user.id, lesson.topicId);
  const entries = videos.map((v, i) => entryFor(v, i + 1, rows.get(v.id), unavailableReason(v, uploads)));
  const counted = entries.filter((e) => e.status !== "unavailable");
  const watchedCount = counted.filter((e) => e.watched).length;
  const lockMode = getVideoLockMode(db);
  const exempt: ModulePlaylistResponse["exempt"] = isStaffRole(user.role) ? "staff" : moduleCompleted(db, user.id, lesson.topicId) ? "completed" : null;
  return {
    topicId: lesson.topicId,
    courseId: lesson.courseId,
    sectionId: lesson.sectionId,
    entries,
    watchedCount,
    total: counted.length,
    locked: lockMode === "lock" && exempt === null && watchedCount < counted.length,
    exempt,
    lockMode,
  };
}

/**
 * For builder C's module-test attempt route: 409 `videos_unwatched` (the v4.3 code and wording)
 * while the lock applies. `warn` mode, staff and learners who already passed are never blocked.
 */
export function assertModuleVideosWatched(db: Db, user: SessionUser, topicId: string): void {
  const lesson = findModuleLesson(db, topicId);
  if (!lesson) return;
  const view = modulePlaylist(db, user, lesson);
  if (!view.locked) return;
  const left = view.total - view.watchedCount;
  throw new HttpError(
    409,
    ERROR_CODES.VIDEOS_UNWATCHED,
    `Watch the ${left === 1 ? "last video" : `${left} remaining videos`} of this module first (${view.watchedCount} of ${view.total} watched).`,
  );
}

/** The module's docs for the learner: uploads through our download route, links as they are. */
export function moduleDocs(db: Db, lesson: ModuleLesson): ModuleDocEntry[] {
  const docs = db.select().from(schema.courseDocs).where(eq(schema.courseDocs.sectionId, lesson.sectionId)).orderBy(asc(schema.courseDocs.position)).all();
  const uploadIds = docs.map((d) => d.uploadId).filter((id): id is string => Boolean(id));
  const uploads = uploadIds.length ? new Map(db.select().from(schema.mediaUploads).where(inArray(schema.mediaUploads.id, uploadIds)).all().map((u) => [u.id, u])) : new Map();
  const out: ModuleDocEntry[] = [];
  for (const d of docs) {
    if (d.source === "upload") {
      const up = d.uploadId ? uploads.get(d.uploadId) : undefined;
      if (!up || up.deletedAt) continue;
      out.push({
        docId: d.id,
        title: d.title || up.originalName,
        source: "upload",
        href: `/api/v5/oyelabs/lessons/${encodeURIComponent(lesson.topicId)}/docs/${encodeURIComponent(d.id)}`,
        kind: null,
        mime: up.mime,
        bytes: up.bytes,
      });
    } else if (d.url) {
      out.push({ docId: d.id, title: d.title || d.url, source: "link", href: d.url, kind: d.linkKind ?? null, mime: null, bytes: null });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Recording
// ---------------------------------------------------------------------------

function existingRow(db: Db, userId: string, topicId: string, videoId: string): ProgressRow | undefined {
  return db
    .select()
    .from(schema.videoProgress)
    .where(and(eq(schema.videoProgress.userId, userId), eq(schema.videoProgress.topicId, topicId), eq(schema.videoProgress.videoId, videoId)))
    .get();
}

function upsert(db: Db, userId: string, topicId: string, videoId: string, values: Omit<typeof schema.videoProgress.$inferInsert, "userId" | "topicId" | "videoId">): void {
  db.insert(schema.videoProgress)
    .values({ userId, topicId, videoId, ...values })
    .onConflictDoUpdate({ target: [schema.videoProgress.userId, schema.videoProgress.topicId, schema.videoProgress.videoId], set: values })
    .run();
}

/**
 * One exact sample (HTML5 / Vimeo / YouTube in a module): the v4.3 rule. A real length the player
 * reports is kept, and fills in the module video's length when nothing better was known.
 */
export function recordExactSample(db: Db, userId: string, lesson: ModuleLesson, video: VideoRow, body: VideoProgressRequest): void {
  const at = now();
  const existing = existingRow(db, userId, lesson.topicId, video.id);
  const reported = body.duration && body.duration > 1 ? body.duration : null;
  if (reported && !video.durationSeconds) {
    db.update(schema.courseVideos).set({ durationSeconds: reported, durationSource: "player", updatedAt: at }).where(eq(schema.courseVideos.id, video.id)).run();
    moduleMinutes(db, lesson.topicId);
  }
  const duration = video.durationSeconds ?? reported ?? existing?.durationSeconds ?? null;
  const position = duration ? Math.min(body.position, duration) : body.position;
  const to = duration ? Math.min(body.to, duration) : body.to;
  const { ranges } = addPlayedInterval((existing?.ranges ?? []) as Range[], { from: body.from, to, elapsed: body.elapsed ?? SAMPLE_INTERVAL_SEC });
  const watched = watchedSeconds(ranges, duration ? { start: 0, end: duration } : undefined);
  upsert(db, userId, lesson.topicId, video.id, {
    ranges,
    watchedSeconds: watched,
    lastPosition: position,
    durationSeconds: duration,
    tracking: "exact",
    completedAt: existing?.completedAt ?? (isWatched(watched, duration) ? at : null),
    updatedAt: at,
  });
}

/**
 * One estimated sample. Hidden or unfocused samples add nothing; the rest are capped by the wall
 * clock since the previous sample (`creditedActiveSeconds`). The clock restarts on every sample, so
 * time spent away is never banked. Returns the seconds credited.
 */
export function recordActiveSample(db: Db, userId: string, lesson: ModuleLesson, video: VideoRow, sample: ActiveTimeSample, at = now()): number {
  const existing = existingRow(db, userId, lesson.topicId, video.id);
  const wallSince = existing ? Math.max(0, (at - existing.updatedAt) / 1000) : null;
  const credited = creditedActiveSeconds(sample, wallSince);
  const active = Math.round(((existing?.activeSeconds ?? 0) + credited) * 100) / 100;
  const est = estimatedProgress(active, video.durationSeconds, Boolean(existing?.confirmedAt));
  upsert(db, userId, lesson.topicId, video.id, {
    ranges: existing?.ranges ?? [],
    watchedSeconds: existing?.watchedSeconds ?? 0,
    lastPosition: existing?.lastPosition ?? 0,
    durationSeconds: video.durationSeconds,
    tracking: "estimated",
    activeSeconds: active,
    confirmedAt: existing?.confirmedAt ?? null,
    completedAt: existing?.completedAt ?? (est.watched ? at : null),
    updatedAt: at,
  });
  return credited;
}

/** "I've watched this": allowed once active time reaches 80% of the length. */
export function confirmWatched(db: Db, userId: string, lesson: ModuleLesson, video: VideoRow, at = now()): void {
  if (video.tracking !== "estimated") throw conflict("This video counts by itself as you watch it.");
  const existing = existingRow(db, userId, lesson.topicId, video.id);
  const active = existing?.activeSeconds ?? 0;
  const est = estimatedProgress(active, video.durationSeconds, true);
  if (est.requiredSeconds === null) throw conflict("We don't know how long this video is yet. Ask your admin to add the video's length.");
  if (!est.canConfirm) {
    const minutes = Math.max(1, Math.ceil((est.requiredSeconds - active) / 60));
    throw conflict(`Keep watching: you can confirm in about ${minutes} more minute${minutes === 1 ? "" : "s"}.`);
  }
  upsert(db, userId, lesson.topicId, video.id, {
    ranges: existing?.ranges ?? [],
    watchedSeconds: existing?.watchedSeconds ?? 0,
    lastPosition: existing?.lastPosition ?? 0,
    durationSeconds: video.durationSeconds,
    tracking: "estimated",
    activeSeconds: active,
    confirmedAt: existing?.confirmedAt ?? at,
    completedAt: existing?.completedAt ?? at,
    updatedAt: existing?.updatedAt ?? at,
  });
}
