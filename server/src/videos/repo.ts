import { and, eq, inArray, like } from "drizzle-orm";

import type { SessionUser } from "../../../shared/auth";
import {
  addPlayedInterval,
  DEFAULT_VIDEO_LOCK_MODE,
  DEFAULT_VIDEO_PREFS,
  isWatched,
  parseDurationLabel,
  requiredSeconds,
  resumePosition,
  SAMPLE_INTERVAL_SEC,
  segmentFor,
  topicVideoStatus,
  VIDEO_LOCK_MODE_KEY,
  VIDEO_LOCK_MODES,
  watchedSeconds,
  type ModuleVideoTotals,
  type Range,
  type TopicVideosResponse,
  type TopicVideoState,
  type VideoLockMode,
  type VideoPrefs,
  type VideoProgressRequest,
  type VideoSegment,
} from "../../../shared/video";
import type { AuthoredModule, AuthoredTopic, AuthoredVideo, ContentStore } from "../content/store";
import { schema, type Db } from "../db";
import { now } from "../lib/ids";
import { getTopicProgress } from "../progress/repo";

// ---------------------------------------------------------------------------
// Settings and preferences
// ---------------------------------------------------------------------------

export function getVideoLockMode(db: Db): VideoLockMode {
  const value = db.select().from(schema.appMeta).where(eq(schema.appMeta.key, VIDEO_LOCK_MODE_KEY)).get()?.value;
  return (VIDEO_LOCK_MODES as readonly string[]).includes(value ?? "") ? (value as VideoLockMode) : DEFAULT_VIDEO_LOCK_MODE;
}

export function setVideoLockMode(db: Db, mode: VideoLockMode): void {
  const timestamp = now();
  db.insert(schema.appMeta)
    .values({ key: VIDEO_LOCK_MODE_KEY, value: mode, updatedAt: timestamp })
    .onConflictDoUpdate({ target: schema.appMeta.key, set: { value: mode, updatedAt: timestamp } })
    .run();
}

export function getVideoPrefs(db: Db, userId: string): VideoPrefs {
  const data = db.select().from(schema.userPrefs).where(eq(schema.userPrefs.userId, userId)).get()?.data ?? {};
  return { autoplayNext: typeof data.autoplayNext === "boolean" ? data.autoplayNext : DEFAULT_VIDEO_PREFS.autoplayNext };
}

/** Merges into the stored blob, so other preferences living there are kept. */
export function setVideoPrefs(db: Db, userId: string, prefs: Partial<VideoPrefs>): VideoPrefs {
  const current = db.select().from(schema.userPrefs).where(eq(schema.userPrefs.userId, userId)).get()?.data ?? {};
  const data = { ...current, ...prefs };
  const timestamp = now();
  db.insert(schema.userPrefs)
    .values({ userId, data, updatedAt: timestamp })
    .onConflictDoUpdate({ target: schema.userPrefs.userId, set: { data, updatedAt: timestamp } })
    .run();
  return getVideoPrefs(db, userId);
}

// ---------------------------------------------------------------------------
// Unplayable videos (owner disabled embedding, or the video is gone)
// ---------------------------------------------------------------------------

const UNPLAYABLE_PREFIX = "videos.unplayable.";

/**
 * Recorded in `app_meta` when a player reports error 100/101/150, so a broken video cannot lock a
 * topic for good. It is global (every learner benefits) and visible to admins for review.
 */
export function markUnplayable(db: Db, videoId: string, code: number, userId: string): void {
  const timestamp = now();
  const value = JSON.stringify({ code, at: timestamp, by: userId });
  db.insert(schema.appMeta)
    .values({ key: UNPLAYABLE_PREFIX + videoId, value, updatedAt: timestamp })
    .onConflictDoNothing()
    .run();
}

export function unplayableIds(db: Db, videoIds: readonly string[]): Set<string> {
  if (videoIds.length === 0) return new Set();
  const keys = videoIds.map((id) => UNPLAYABLE_PREFIX + id);
  return new Set(
    db
      .select({ key: schema.appMeta.key })
      .from(schema.appMeta)
      .where(inArray(schema.appMeta.key, keys))
      .all()
      .map((r) => r.key.slice(UNPLAYABLE_PREFIX.length)),
  );
}

export function listUnplayable(db: Db): { videoId: string; code: number; at: number }[] {
  return db
    .select()
    .from(schema.appMeta)
    .where(like(schema.appMeta.key, `${UNPLAYABLE_PREFIX}%`))
    .all()
    .map((row) => {
      const parsed = safeJson(row.value) as { code?: number; at?: number };
      return { videoId: row.key.slice(UNPLAYABLE_PREFIX.length), code: parsed.code ?? 0, at: parsed.at ?? row.updatedAt };
    });
}

export function clearUnplayable(db: Db, videoId: string): void {
  db.delete(schema.appMeta).where(eq(schema.appMeta.key, UNPLAYABLE_PREFIX + videoId)).run();
}

// ---------------------------------------------------------------------------
// Playlist entries
// ---------------------------------------------------------------------------

/** Every `startSeconds` the curriculum uses per video id, so a chapter knows where it ends. */
const chapterIndexCache = new WeakMap<ContentStore, Map<string, number[]>>();

export function chapterStarts(content: ContentStore): Map<string, number[]> {
  const cached = chapterIndexCache.get(content);
  if (cached) return cached;
  const index = new Map<string, Set<number>>();
  for (const track of content.manifest) {
    for (const meta of track.modules) {
      if (!meta.available) continue;
      const mod = content.getModule(track.id, meta.id);
      for (const topic of mod?.topics ?? []) {
        for (const video of videosOf(topic)) {
          if (!video.videoId) continue;
          const set = index.get(video.videoId) ?? new Set<number>();
          set.add(video.startSeconds && video.startSeconds > 0 ? video.startSeconds : 0);
          index.set(video.videoId, set);
        }
      }
    }
  }
  const result = new Map([...index].map(([id, set]) => [id, [...set].sort((a, b) => a - b)]));
  chapterIndexCache.set(content, result);
  return result;
}

function videosOf(topic: AuthoredTopic): AuthoredVideo[] {
  return [topic.video, ...(topic.alternateVideos ?? [])];
}

export interface PlaylistEntry {
  key: string;
  order: number;
  video: AuthoredVideo;
  segment: VideoSegment;
}

/** A topic's videos in order, without search-URL fallbacks and exact duplicates. */
export function playlistEntries(content: ContentStore, topic: AuthoredTopic): PlaylistEntry[] {
  const starts = chapterStarts(content);
  const seen = new Set<string>();
  const out: PlaylistEntry[] = [];
  for (const video of videosOf(topic)) {
    if (!video.videoId) continue;
    const start = video.startSeconds && video.startSeconds > 0 ? video.startSeconds : 0;
    const key = `${video.videoId}@${start}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ key, order: out.length + 1, video, segment: segmentFor(start, starts.get(video.videoId) ?? []) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Durations
// ---------------------------------------------------------------------------

interface KnownDuration {
  seconds: number;
  source: "data-api" | "player" | "label";
}

/** Data API first, then what a player reported, then the content's label. */
function durationsFor(db: Db, entries: { video: AuthoredVideo }[], progressRows: { videoId: string; durationSeconds: number | null }[]): Map<string, KnownDuration> {
  const ids = [...new Set(entries.map((e) => e.video.videoId))];
  const out = new Map<string, KnownDuration>();
  const meta = ids.length
    ? db.select().from(schema.videoMeta).where(inArray(schema.videoMeta.videoId, ids)).all()
    : [];
  for (const row of meta) out.set(row.videoId, { seconds: row.durationSeconds, source: row.source });
  for (const row of progressRows) {
    if (!out.has(row.videoId) && row.durationSeconds) out.set(row.videoId, { seconds: row.durationSeconds, source: "player" });
  }
  for (const entry of entries) {
    if (out.has(entry.video.videoId)) continue;
    const label = parseDurationLabel(entry.video.durationLabel);
    if (label) out.set(entry.video.videoId, { seconds: label, source: "label" });
  }
  return out;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

type ProgressRow = typeof schema.videoProgress.$inferSelect;

function progressRows(db: Db, userId: string, topicIds: readonly string[]): ProgressRow[] {
  if (topicIds.length === 0) return [];
  return db
    .select()
    .from(schema.videoProgress)
    .where(and(eq(schema.videoProgress.userId, userId), inArray(schema.videoProgress.topicId, [...topicIds])))
    .all();
}

function entryState(
  entry: PlaylistEntry,
  row: ProgressRow | undefined,
  duration: KnownDuration | undefined,
  unplayable: boolean,
): TopicVideoState {
  const durationSeconds = duration?.seconds ?? null;
  const required = requiredSeconds(entry.segment, durationSeconds);
  const end = required === null ? entry.segment.end : entry.segment.start + required;
  const watched = row ? watchedSeconds(row.ranges ?? [], { start: entry.segment.start, end }) : 0;
  const done = isWatched(watched, required);
  const lastPosition = row?.lastPosition ?? 0;
  const status: TopicVideoState["status"] = unplayable
    ? "unavailable"
    : done
      ? "watched"
      : watched > 0 || lastPosition > entry.segment.start + 1
        ? "in-progress"
        : "not-started";
  return {
    key: entry.key,
    order: entry.order,
    videoId: entry.video.videoId,
    title: entry.video.title,
    channel: entry.video.channel,
    segment: entry.segment,
    chapterLabel: entry.video.chapterLabel ?? null,
    durationSeconds,
    durationSource: duration?.source ?? null,
    requiredSeconds: required,
    watchedSeconds: watched,
    progress: required ? Math.min(1, watched / required) : 0,
    lastPosition,
    resumeAt: resumePosition(lastPosition, entry.segment, durationSeconds),
    watched: done,
    status,
  };
}

/** Every entry's state for one topic and one learner. */
export function topicVideoStates(db: Db, content: ContentStore, userId: string, topic: AuthoredTopic): TopicVideoState[] {
  const entries = playlistEntries(content, topic);
  const rows = progressRows(db, userId, [topic.id]);
  const byVideo = new Map(rows.map((r) => [r.videoId, r]));
  const durations = durationsFor(db, entries, rows);
  const broken = unplayableIds(db, entries.map((e) => e.video.videoId));
  return entries.map((e) => entryState(e, byVideo.get(e.video.videoId), durations.get(e.video.videoId), broken.has(e.video.videoId)));
}

/**
 * The gate. The lock never touches a topic the learner already completed (their completion stays,
 * and a retry is allowed), and never applies to staff, who preview topics.
 */
export function topicVideosView(db: Db, content: ContentStore, user: SessionUser, topic: AuthoredTopic): TopicVideosResponse {
  const videos = topicVideoStates(db, content, user.id, topic);
  const status = topicVideoStatus(videos);
  const lockMode = getVideoLockMode(db);
  const exempt: TopicVideosResponse["exempt"] =
    user.role === "superadmin" || user.role === "admin"
      ? "staff"
      : getTopicProgress(db, user.id, topic.id)?.status === "completed"
        ? "completed"
        : null;
  return {
    topicId: topic.id,
    videos,
    watchedCount: status.watched,
    total: status.total,
    lockMode,
    locked: lockMode === "lock" && exempt === null && !status.allWatched,
    exempt,
  };
}

// ---------------------------------------------------------------------------
// Recording
// ---------------------------------------------------------------------------

/**
 * Folds one player sample into the learner's ranges for (topic, video). The last position is kept
 * even when the sample itself did not count (a seek), so resume lands where the learner actually
 * is. `completedAt` is set the first time any entry of this video in the topic becomes watched and
 * is never cleared.
 */
export function recordVideoSample(
  db: Db,
  content: ContentStore,
  userId: string,
  topic: AuthoredTopic,
  videoId: string,
  body: VideoProgressRequest,
): void {
  const timestamp = now();
  const existing = db
    .select()
    .from(schema.videoProgress)
    .where(
      and(eq(schema.videoProgress.userId, userId), eq(schema.videoProgress.topicId, topic.id), eq(schema.videoProgress.videoId, videoId)),
    )
    .get();

  // A player reports 0 until metadata loads; only a real length is useful.
  const reported = body.duration && body.duration > 1 ? body.duration : null;
  const durationSeconds = reported ?? existing?.durationSeconds ?? null;
  if (reported) rememberPlayerDuration(db, videoId, reported);

  const position = durationSeconds ? Math.min(body.position, durationSeconds) : body.position;
  const to = durationSeconds ? Math.min(body.to, durationSeconds) : body.to;
  const { ranges } = addPlayedInterval((existing?.ranges ?? []) as Range[], {
    from: body.from,
    to,
    elapsed: body.elapsed ?? SAMPLE_INTERVAL_SEC,
  });

  // Recompute with the new ranges to stamp completedAt.
  const entries = playlistEntries(content, topic).filter((e) => e.video.videoId === videoId);
  const durations = durationsFor(db, entries, durationSeconds ? [{ videoId, durationSeconds }] : []);
  const anyWatched = entries.some((e) => {
    const required = requiredSeconds(e.segment, durations.get(videoId)?.seconds ?? null);
    const end = required === null ? e.segment.end : e.segment.start + required;
    return isWatched(watchedSeconds(ranges, { start: e.segment.start, end }), required);
  });
  const values = {
    ranges,
    watchedSeconds: watchedSeconds(ranges),
    lastPosition: position,
    durationSeconds,
    completedAt: existing?.completedAt ?? (anyWatched ? timestamp : null),
    updatedAt: timestamp,
  };
  db.insert(schema.videoProgress)
    .values({ userId, topicId: topic.id, videoId, ...values })
    .onConflictDoUpdate({
      target: [schema.videoProgress.userId, schema.videoProgress.topicId, schema.videoProgress.videoId],
      set: values,
    })
    .run();
}

/** Stores what the player says unless the Data API already gave an authoritative length. */
function rememberPlayerDuration(db: Db, videoId: string, seconds: number): void {
  const current = db.select().from(schema.videoMeta).where(eq(schema.videoMeta.videoId, videoId)).get();
  if (current?.source === "data-api") return;
  if (current && Math.abs(current.durationSeconds - seconds) < 1) return;
  const timestamp = now();
  db.insert(schema.videoMeta)
    .values({ videoId, durationSeconds: seconds, source: "player", updatedAt: timestamp })
    .onConflictDoUpdate({ target: schema.videoMeta.videoId, set: { durationSeconds: seconds, source: "player", updatedAt: timestamp } })
    .run();
}

// ---------------------------------------------------------------------------
// Module totals
// ---------------------------------------------------------------------------

/** Total and watched video time for the topics of one module this learner may open. */
export function moduleVideoTotals(
  db: Db,
  content: ContentStore,
  userId: string,
  mod: AuthoredModule,
  allowed: ReadonlySet<string> | null,
): ModuleVideoTotals {
  const topics = mod.topics.filter((t) => allowed === null || allowed.has(t.id));
  const rows = progressRows(db, userId, topics.map((t) => t.id));
  const allEntries = topics.flatMap((t) => playlistEntries(content, t).map((e) => ({ topicId: t.id, ...e })));
  const durations = durationsFor(db, allEntries, rows);
  const broken = unplayableIds(db, allEntries.map((e) => e.video.videoId));
  const rowOf = new Map(rows.map((r) => [`${r.topicId}|${r.videoId}`, r]));

  const totals: ModuleVideoTotals = {
    moduleId: mod.id,
    totalSeconds: 0,
    watchedSeconds: 0,
    videos: 0,
    watchedVideos: 0,
    unknownDurations: 0,
    topics: [],
  };
  for (const topic of topics) {
    const t = { topicId: topic.id, videos: 0, watchedVideos: 0, totalSeconds: 0, watchedSeconds: 0 };
    for (const entry of allEntries.filter((e) => e.topicId === topic.id)) {
      const state = entryState(entry, rowOf.get(`${topic.id}|${entry.video.videoId}`), durations.get(entry.video.videoId), broken.has(entry.video.videoId));
      if (state.status === "unavailable") continue;
      t.videos++;
      if (state.watched) t.watchedVideos++;
      if (state.requiredSeconds === null) totals.unknownDurations++;
      t.totalSeconds += state.requiredSeconds ?? 0;
      t.watchedSeconds += Math.min(state.watchedSeconds, state.requiredSeconds ?? state.watchedSeconds);
    }
    totals.videos += t.videos;
    totals.watchedVideos += t.watchedVideos;
    totals.totalSeconds += t.totalSeconds;
    totals.watchedSeconds += t.watchedSeconds;
    totals.topics.push({ ...t, totalSeconds: Math.round(t.totalSeconds), watchedSeconds: Math.round(t.watchedSeconds) });
  }
  totals.totalSeconds = Math.round(totals.totalSeconds);
  totals.watchedSeconds = Math.round(totals.watchedSeconds);
  return totals;
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}
