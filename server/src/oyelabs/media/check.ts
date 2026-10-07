import fs from "node:fs";

import { and, eq, inArray, isNotNull, isNull, lt, or } from "drizzle-orm";

import { isBrokenStatus, LINK_RECHECK_AFTER_MS, type LinkStatus } from "../../../../shared/videoSources";
import { schema, type Db } from "../../db";
import type { Env } from "../../env";
import { now } from "../../lib/ids";
import { ensureDataApiDurations } from "../../videos/youtube";
import { moduleMinutes } from "../editor/minutes";
import { resolveDocLink, resolveVideoLink, type ResolveDeps } from "./resolve";
import { uploadPath } from "./storage";

/**
 * v4.5 Phase 2: the saved-link checks. `oyelabs.link.check` (on save, "Check again", and the daily
 * sweep) re-resolves one saved video or doc link and stores what it found. A link that stops
 * working gets `broken_since`, which puts it in the admin inbox; one that works again clears it.
 *
 * "We couldn't reach this link" (a network blip) only counts as broken on the second check in a
 * row, so one bad minute never sends an admin to the inbox.
 */

/** YouTube length via the Data API (when a key is set), read back from `video_meta`. */
export function youtubeDurationFrom(db: Db): (id: string) => Promise<number | null> {
  return async (id) => {
    await ensureDataApiDurations(db, [id]);
    return db.select().from(schema.videoMeta).where(eq(schema.videoMeta.videoId, id)).get()?.durationSeconds ?? null;
  };
}

function brokenSince(previous: { status: LinkStatus; brokenSince: number | null }, status: LinkStatus, at: number): number | null {
  if (!isBrokenStatus(status)) return null;
  if (status === "unreachable" && previous.status !== "unreachable") return previous.brokenSince;
  return previous.brokenSince ?? at;
}

/** Re-checks one saved module video. Returns false when there is no such row. */
export async function checkVideo(db: Db, videoId: string, deps: ResolveDeps = {}): Promise<boolean> {
  const row = db.select().from(schema.courseVideos).where(eq(schema.courseVideos.id, videoId)).get();
  if (!row) return false;
  const at = (deps.now ?? now)();
  if (row.kind === "upload" || !row.inputUrl) {
    db.update(schema.courseVideos).set({ status: "ok", problem: null, brokenSince: null, lastCheckedAt: at }).where(eq(schema.courseVideos.id, videoId)).run();
    return true;
  }
  const resolved = await resolveVideoLink(row.inputUrl, { youtubeDuration: youtubeDurationFrom(db), ...deps });
  // An admin-typed length wins over anything found, except a provider's own (exact) length.
  const keepAdmin = row.durationSource === "admin" && row.durationSeconds;
  const duration = keepAdmin ? row.durationSeconds : (resolved.durationSeconds ?? row.durationSeconds);
  const durationSource = keepAdmin ? row.durationSource : resolved.durationSeconds ? resolved.durationSource : row.durationSource;
  db.update(schema.courseVideos)
    .set({
      kind: resolved.kind,
      providerId: resolved.providerId,
      playerKind: resolved.playerKind,
      embedUrl: resolved.embedUrl,
      playbackUrl: resolved.playbackUrl,
      tracking: resolved.tracking,
      ...(row.titleLocked || !resolved.title ? {} : { title: resolved.title }),
      thumbnailUrl: resolved.thumbnailUrl ?? row.thumbnailUrl,
      durationSeconds: duration,
      durationSource,
      status: resolved.status,
      problem: resolved.problem,
      lastCheckedAt: at,
      brokenSince: brokenSince(row, resolved.status, at),
      updatedAt: at,
    })
    .where(eq(schema.courseVideos.id, videoId))
    .run();
  if (duration !== row.durationSeconds) moduleMinutes(db, row.topicId);
  return true;
}

/** Re-checks one saved module doc link. Uploaded docs need no check. */
export async function checkDoc(db: Db, docId: string, deps: ResolveDeps = {}): Promise<boolean> {
  const row = db.select().from(schema.courseDocs).where(eq(schema.courseDocs.id, docId)).get();
  if (!row) return false;
  const at = (deps.now ?? now)();
  if (row.source === "upload" || !row.url) {
    db.update(schema.courseDocs).set({ status: "ok", problem: null, brokenSince: null, lastCheckedAt: at }).where(eq(schema.courseDocs.id, docId)).run();
    return true;
  }
  const resolved = await resolveDocLink(row.url, deps);
  db.update(schema.courseDocs)
    .set({
      linkKind: resolved.kind,
      fetchUrl: resolved.fetchUrl,
      ...(row.titleLocked || !resolved.title || row.title ? {} : { title: resolved.title }),
      status: resolved.status,
      problem: resolved.problem,
      lastCheckedAt: at,
      brokenSince: brokenSince(row, resolved.status, at),
      updatedAt: at,
    })
    .where(eq(schema.courseDocs.id, docId))
    .run();
  return true;
}

/** Saved links not checked in the last 20 hours, for the daily sweep. */
export function linksDueForCheck(db: Db, at = now()): { videoIds: string[]; docIds: string[] } {
  const before = at - LINK_RECHECK_AFTER_MS;
  const videoIds = db
    .select({ id: schema.courseVideos.id })
    .from(schema.courseVideos)
    .where(and(isNotNull(schema.courseVideos.inputUrl), or(isNull(schema.courseVideos.lastCheckedAt), lt(schema.courseVideos.lastCheckedAt, before))))
    .all()
    .map((r) => r.id);
  const docIds = db
    .select({ id: schema.courseDocs.id })
    .from(schema.courseDocs)
    .where(and(eq(schema.courseDocs.source, "link"), or(isNull(schema.courseDocs.lastCheckedAt), lt(schema.courseDocs.lastCheckedAt, before))))
    .all()
    .map((r) => r.id);
  return { videoIds, docIds };
}

/** Uploads nothing has referenced for this long are deleted by the daily sweep. */
export const ORPHAN_UPLOAD_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Deletes uploads that no module video or doc uses, no autosave draft mentions and no saved version
 * mentions (so restoring a version never finds its file gone), once they are a week old. The row is
 * kept with `deleted_at`, so a sha256 match never points at a missing file. Returns how many.
 */
export function sweepOrphanUploads(db: Db, env: Pick<Env, "dataDir">, at = now()): number {
  const candidates = db
    .select()
    .from(schema.mediaUploads)
    .where(and(isNull(schema.mediaUploads.deletedAt), lt(schema.mediaUploads.createdAt, at - ORPHAN_UPLOAD_AFTER_MS)))
    .all();
  if (candidates.length === 0) return 0;
  const ids = candidates.map((c) => c.id);
  const used = new Set<string>([
    ...db.select({ id: schema.courseVideos.uploadId }).from(schema.courseVideos).where(inArray(schema.courseVideos.uploadId, ids)).all().map((r) => r.id ?? ""),
    ...db.select({ id: schema.courseDocs.uploadId }).from(schema.courseDocs).where(inArray(schema.courseDocs.uploadId, ids)).all().map((r) => r.id ?? ""),
  ]);
  const mentioned = [
    ...db.select({ data: schema.courseDrafts.data }).from(schema.courseDrafts).all().map((r) => JSON.stringify(r.data)),
    ...db.select({ data: schema.contentVersions.data }).from(schema.contentVersions).where(eq(schema.contentVersions.entityType, "course")).all().map((r) => JSON.stringify(r.data)),
  ].join("\n");
  let removed = 0;
  for (const row of candidates) {
    if (used.has(row.id) || mentioned.includes(row.id)) continue;
    for (const rel of [row.relPath, row.playbackRelPath]) {
      if (!rel) continue;
      try {
        fs.rmSync(uploadPath(env, rel), { force: true });
      } catch {
        // A path that escapes the folder is never touched.
      }
    }
    db.update(schema.mediaUploads).set({ deletedAt: at }).where(eq(schema.mediaUploads.id, row.id)).run();
    removed++;
  }
  return removed;
}
