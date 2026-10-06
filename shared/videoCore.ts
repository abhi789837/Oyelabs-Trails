/**
 * v4.3 topic video playlist: the watch-tracking rules shared by the server (which owns them) and
 * the client (which samples the player and shows the result).
 *
 * The model: a learner's watching of one YouTube video is a set of absolute position ranges
 * `[from, to]` in seconds. The client samples the player every few seconds and reports the span it
 * played since the last sample, together with how much wall time passed. A span only counts when the
 * position advanced roughly as fast as the clock did, so dragging the scrubber forward (a seek) adds
 * nothing, and replaying a part you already watched adds nothing either, because ranges are merged.
 *
 * A topic can use a chapter of a long course (`startSeconds`). Such an entry only asks for its
 * chapter: from its start to the next chapter of the same video that the curriculum uses, or to the
 * end of the video. See `segmentFor` and `requiredSeconds`.
 *
 * zod-free on purpose, so the lesson player can import these rules without pulling zod into its
 * first download. The request schemas live in `./video`, which re-exports all of this.
 */

export type Range = [number, number];

/** A video counts as watched once this share of its required span has been played. */
export const WATCHED_RATIO = 0.9;
/** How often the client samples `getCurrentTime()` while playing. */
export const SAMPLE_INTERVAL_SEC = 5;
/** Slack for timer jitter and buffering between the wall clock and the player clock. */
export const SAMPLE_TOLERANCE_SEC = 2;
/** The fastest playback rate the YouTube player offers. Watching at 2× still counts. */
export const MAX_PLAYBACK_RATE = 2;
/** One sample may cover at most this much wall time; a longer gap means the tab slept. */
export const MAX_SAMPLE_ELAPSED_SEC = 30;
/**
 * A chapter entry whose end is unknown (no later chapter of that video is used anywhere) asks for at
 * most this much. Without it, a topic pointing at chapter 3 of a nine-hour course would require
 * eight hours of video before its test unlocks.
 */
export const OPEN_CHAPTER_CAP_SEC = 60 * 60;
/** The admin switch: `lock` blocks the topic test until every video is watched, `warn` only warns. */
export const VIDEO_LOCK_MODES = ["lock", "warn"] as const;
export type VideoLockMode = (typeof VIDEO_LOCK_MODES)[number];
export const DEFAULT_VIDEO_LOCK_MODE: VideoLockMode = "lock";
/** The `app_meta` key holding the lock mode. */
export const VIDEO_LOCK_MODE_KEY = "videos.lock_mode";
/** The error code the attempt endpoint returns (409) while a topic's videos are unwatched. */
export const VIDEOS_UNWATCHED_CODE = "videos_unwatched";

// ---------------------------------------------------------------------------
// Ranges
// ---------------------------------------------------------------------------

/** Sorts and merges overlapping or touching ranges. Drops empty and invalid ones. */
export function mergeRanges(ranges: readonly Range[]): Range[] {
  const valid = ranges
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b > a)
    .map(([a, b]) => [Math.max(0, a), b] as Range)
    .sort((x, y) => x[0] - y[0]);
  const out: Range[] = [];
  for (const [a, b] of valid) {
    const last = out[out.length - 1];
    if (last && a <= last[1] + 0.5) {
      last[1] = Math.max(last[1], b);
    } else {
      out.push([a, b]);
    }
  }
  return out.map(([a, b]) => [round2(a), round2(b)] as Range);
}

export interface PlayedSample {
  /** Player position at the previous sample (or where playback started). */
  from: number;
  /** Player position now. */
  to: number;
  /** Wall-clock seconds between the two readings. */
  elapsed: number;
}

export interface AddResult {
  ranges: Range[];
  /** True when the sample was counted; false for a seek, a rewind, a pause or a stale sample. */
  counted: boolean;
}

/**
 * Folds one sample into the watched ranges.
 *
 * Only continuous playback counts: the position must have moved forward by no more than the wall
 * time allowed at the fastest playback rate, plus a little tolerance. A jump forward (a seek)
 * therefore counts nothing, and the next sample starts a new range at the new position, so the
 * skipped span is never credited. Moving backwards (a rewind) also counts nothing; replaying an
 * already-watched part is merged away, so it cannot be double-counted.
 */
export function addPlayedInterval(
  ranges: readonly Range[],
  sample: PlayedSample,
  toleranceSec = SAMPLE_TOLERANCE_SEC,
): AddResult {
  const { from, to, elapsed } = sample;
  const unchanged = { ranges: mergeRanges(ranges), counted: false };
  if (![from, to, elapsed].every(Number.isFinite)) return unchanged;
  if (from < 0 || to <= from || elapsed <= 0) return unchanged;
  if (elapsed > MAX_SAMPLE_ELAPSED_SEC + toleranceSec) return unchanged;
  const advanced = to - from;
  if (advanced > elapsed * MAX_PLAYBACK_RATE + toleranceSec) return unchanged;
  return { ranges: mergeRanges([...ranges, [from, to]]), counted: true };
}

/** Total seconds covered, optionally clipped to a segment `[start, end]`. */
export function watchedSeconds(ranges: readonly Range[], segment?: { start: number; end: number | null }): number {
  let total = 0;
  for (const [a, b] of mergeRanges(ranges)) {
    const lo = segment ? Math.max(a, segment.start) : a;
    const hi = segment && segment.end !== null ? Math.min(b, segment.end) : b;
    if (hi > lo) total += hi - lo;
  }
  return round2(total);
}

/** The ≥ 90 % rule. Unknown or zero length is never watched. */
export function isWatched(watched: number, required: number | null): boolean {
  if (required === null || !(required > 0)) return false;
  return watched >= required * WATCHED_RATIO - 0.01;
}

// ---------------------------------------------------------------------------
// Segments (chapters of long videos)
// ---------------------------------------------------------------------------

export interface VideoSegment {
  /** Absolute start in the video, seconds. */
  start: number;
  /** Absolute end, or null for "to the end of the video". */
  end: number | null;
  /** True when this is a chapter whose end we do not know (capped by OPEN_CHAPTER_CAP_SEC). */
  openChapter: boolean;
}

/**
 * The part of a video an entry asks for. `knownStarts` is every `startSeconds` the curriculum uses
 * for this video id (0 for an entry with none), so a chapter ends where the next one used begins.
 */
export function segmentFor(start: number | undefined, knownStarts: readonly number[] = []): VideoSegment {
  const s = start && start > 0 ? start : 0;
  if (s === 0) return { start: 0, end: null, openChapter: false };
  const next = [...knownStarts].filter((x) => x > s).sort((a, b) => a - b)[0];
  return next !== undefined ? { start: s, end: next, openChapter: false } : { start: s, end: null, openChapter: true };
}

/** Seconds the learner must cover for this entry, or null while the video's length is unknown. */
export function requiredSeconds(segment: VideoSegment, durationSeconds: number | null): number | null {
  if (segment.end !== null) {
    const end = durationSeconds ? Math.min(segment.end, durationSeconds) : segment.end;
    return Math.max(0, round2(end - segment.start));
  }
  if (!durationSeconds) return null;
  const rest = Math.max(0, durationSeconds - segment.start);
  return round2(segment.openChapter ? Math.min(rest, OPEN_CHAPTER_CAP_SEC) : rest);
}

/** The end of what an entry asks for, absolute, for clipping and resume. */
export function segmentEnd(segment: VideoSegment, durationSeconds: number | null): number | null {
  const required = requiredSeconds(segment, durationSeconds);
  return required === null ? null : segment.start + required;
}

/**
 * Where to resume: the last position when it lies inside the entry's span and not in its final few
 * seconds; otherwise the start of the span (a finished video starts over, as on Udemy).
 */
export function resumePosition(lastPosition: number, segment: VideoSegment, durationSeconds: number | null): number {
  const end = segmentEnd(segment, durationSeconds);
  if (!(lastPosition > segment.start + 1)) return segment.start;
  if (end !== null && lastPosition >= end - 5) return segment.start;
  return Math.floor(lastPosition);
}

// ---------------------------------------------------------------------------
// Durations
// ---------------------------------------------------------------------------

/** "PT1H2M3S" -> 3723. Returns null for anything that is not an ISO 8601 duration. */
export function parseIsoDuration(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(value.trim());
  if (!m || value.trim() === "P" || value.trim() === "PT") return null;
  const [, d, h, min, s] = m;
  const total = Number(d ?? 0) * 86400 + Number(h ?? 0) * 3600 + Number(min ?? 0) * 60 + Number(s ?? 0);
  return Number.isFinite(total) ? total : null;
}

/** "1:32:35" or "19:11" -> seconds. Null for anything else. */
export function parseDurationLabel(label: string | null | undefined): number | null {
  if (!label || !/^\d{1,3}(:\d{1,2}){1,2}$/.test(label.trim())) return null;
  const total = label
    .trim()
    .split(":")
    .map(Number)
    .reduce((acc, part) => acc * 60 + part, 0);
  return total > 0 ? total : null;
}

/** 3723 -> "1:02:03", 95 -> "1:35". */
export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** 5400 -> "1 h 30 min", 300 -> "5 min". For totals. */
export function formatSpan(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

// ---------------------------------------------------------------------------
// Per-topic status
// ---------------------------------------------------------------------------

export type VideoWatchStatus = "not-started" | "in-progress" | "watched" | "unavailable";

export interface TopicVideoStatus {
  watched: number;
  /** Entries that count (unavailable videos are left out). */
  total: number;
  allWatched: boolean;
}

/** Counts a topic's entries. A topic with no countable video is trivially complete. */
export function topicVideoStatus(entries: readonly { status: VideoWatchStatus }[]): TopicVideoStatus {
  const counted = entries.filter((e) => e.status !== "unavailable");
  const watched = counted.filter((e) => e.status === "watched").length;
  return { watched, total: counted.length, allWatched: watched === counted.length };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// Wire types
// ---------------------------------------------------------------------------

export interface TopicVideoState {
  /** Stable within a topic: `${videoId}@${start}`. */
  key: string;
  /** 1-based order in the playlist. */
  order: number;
  videoId: string;
  title: string;
  channel: string;
  segment: VideoSegment;
  chapterLabel: string | null;
  /** The whole video's length, when known. */
  durationSeconds: number | null;
  durationSource: "data-api" | "player" | "label" | null;
  /** What the learner must cover for this entry (the chapter, or the whole video). */
  requiredSeconds: number | null;
  /** Seconds watched inside the entry's span. */
  watchedSeconds: number;
  /** 0..1, for the progress bar. */
  progress: number;
  lastPosition: number;
  /** Where the player should start. */
  resumeAt: number;
  watched: boolean;
  status: VideoWatchStatus;
}

export interface TopicVideosResponse {
  topicId: string;
  videos: TopicVideoState[];
  watchedCount: number;
  total: number;
  lockMode: VideoLockMode;
  /** True when the topic test would be refused right now (lock mode, videos left, not exempt). */
  locked: boolean;
  /** Why the lock does not apply: the topic is already completed, or the caller is an admin. */
  exempt: "completed" | "staff" | null;
}

export interface ModuleVideoTotals {
  moduleId: string;
  totalSeconds: number;
  watchedSeconds: number;
  videos: number;
  watchedVideos: number;
  /** Entries whose length is not known yet (counted in `videos`, not in `totalSeconds`). */
  unknownDurations: number;
  topics: { topicId: string; videos: number; watchedVideos: number; totalSeconds: number; watchedSeconds: number }[];
}

export interface VideoPrefs {
  autoplayNext: boolean;
}
export const DEFAULT_VIDEO_PREFS: VideoPrefs = { autoplayNext: true };

// ---------------------------------------------------------------------------
// Request schemas
// ---------------------------------------------------------------------------



/** A player error the learner cannot get past: 100 not found, 101/150 embedding disabled. */
export const UNPLAYABLE_ERROR_CODES = [100, 101, 150] as const;
