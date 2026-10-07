/**
 * v4.5 Phase 2: videos and documents from any drive. The zod-free half of `./videoSources`.
 *
 * Names, wire types, constants and the small pure rules the server (which owns them) and the module
 * lesson player share. Kept free of zod, like `./videoCore`, so the learner's lesson chunk does not
 * pull the schema library in. `./videoSources` re-exports everything here and adds the request
 * schemas, so server code keeps importing from `shared/videoSources`.
 *
 * Copy here is admin/learner copy: plain words (docs/v4.4/COPY_GUIDE.md).
 */

// ---------------------------------------------------------------------------
// Video sources
// ---------------------------------------------------------------------------

/**
 * Where a module video comes from. Decided from the pasted link by the resolver, never typed by
 * the admin. `upload` = a file stored on the Oyelearn server; `embed` = any other page that allows
 * framing (generic iframe).
 */
export const VIDEO_SOURCE_KINDS = ["youtube", "vimeo", "loom", "gdrive", "onedrive", "dropbox", "box", "direct", "upload", "embed"] as const;
export type VideoSourceKind = (typeof VIDEO_SOURCE_KINDS)[number];

/** Human names for the provider icon and copy ("This Drive video is private"). */
export const VIDEO_SOURCE_LABELS: Record<VideoSourceKind, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  loom: "Loom",
  gdrive: "Google Drive",
  onedrive: "OneDrive",
  dropbox: "Dropbox",
  box: "Box",
  direct: "Video file",
  upload: "Uploaded to Oyelearn",
  embed: "Web page",
};

/**
 * `exact`: we can read the playhead (YouTube/Vimeo APIs, our HTML5 player), so watch ranges are
 * recorded exactly like v4.3. `estimated`: an iframe we cannot read; only active time counts
 * (visible + focused + not idle), and "watched" needs 80% of the duration plus the learner's
 * "I've watched this" click.
 */
export const TRACKING_MODES = ["exact", "estimated"] as const;
export type TrackingMode = (typeof TRACKING_MODES)[number];

/** The tracking each source gets. Fixed per kind; the brief's Phase 2 table. */
export const TRACKING_FOR_KIND: Record<VideoSourceKind, TrackingMode> = {
  youtube: "exact",
  vimeo: "exact",
  loom: "estimated",
  gdrive: "estimated",
  onedrive: "estimated",
  dropbox: "exact",
  box: "estimated",
  direct: "exact",
  upload: "exact",
  embed: "estimated",
};

/** Which player component renders an entry. `hls` = HTML5 with hls.js (lazy) for `.m3u8`. */
export const PLAYER_KINDS = ["youtube", "vimeo", "html5", "hls", "iframe"] as const;
export type PlayerKind = (typeof PLAYER_KINDS)[number];

/**
 * The outcome of the last sharing check (server fetch with no cookies/credentials).
 * `pending` = not checked yet; `ok` = plays for anyone with the link.
 */
export const LINK_STATUSES = ["pending", "ok", "private", "not_found", "not_embeddable", "unsupported", "unreachable"] as const;
export type LinkStatus = (typeof LINK_STATUSES)[number];

/** A status that means "this link does not work right now" (the inbox and the lock read it). */
export function isBrokenStatus(status: LinkStatus): boolean {
  return status !== "pending" && status !== "ok";
}

/** Where a known duration came from. `admin` = typed in the editor for an embed we cannot measure. */
export const DURATION_SOURCES = ["provider", "probe", "admin", "player"] as const;
export type DurationSource = (typeof DURATION_SOURCES)[number];

/** Why a link cannot play, in plain words, with the fix ("Share → General access → …"). */
export interface LinkProblem {
  code: LinkStatus;
  /** "This Drive video is private." */
  message: string;
  /** "In Google Drive: Share → General access → 'Anyone with the link' → Viewer. Then press Check again." */
  fix: string;
}

/** What the resolver returns for one pasted video link (and what a preview card shows). */
export interface ResolvedVideo {
  kind: VideoSourceKind;
  /** The provider's own id (YouTube/Vimeo/Loom id, Drive file id, …); null for direct/embed. */
  providerId: string | null;
  /** Exactly what was pasted, trimmed. */
  input: string;
  playerKind: PlayerKind;
  /** iframe `src` for youtube/vimeo/iframe players (no autoplay params; the player adds them). */
  embedUrl: string | null;
  /** HTML5 `src` for html5/hls players (Dropbox raw link, direct file, our upload stream URL). */
  playbackUrl: string | null;
  tracking: TrackingMode;
  title: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  durationSource: DurationSource | null;
  status: LinkStatus;
  /** Null when `status` is ok or pending. */
  problem: LinkProblem | null;
  checkedAt: number | null;
}

// ---------------------------------------------------------------------------
// Document links
// ---------------------------------------------------------------------------

/** A linked (not uploaded) document. Google kinds have export endpoints (`/export?format=txt|csv|pdf`). */
export const DOC_LINK_KINDS = ["gdoc", "gsheet", "gslides", "gdrive", "onedrive", "sharepoint", "dropbox", "notion", "confluence", "web"] as const;
export type DocLinkKind = (typeof DOC_LINK_KINDS)[number];

export const DOC_LINK_LABELS: Record<DocLinkKind, string> = {
  gdoc: "Google Docs",
  gsheet: "Google Sheets",
  gslides: "Google Slides",
  gdrive: "Google Drive",
  onedrive: "OneDrive",
  sharepoint: "SharePoint",
  dropbox: "Dropbox",
  notion: "Notion",
  confluence: "Confluence",
  web: "Web page",
};

export interface ResolvedDocLink {
  kind: DocLinkKind;
  input: string;
  /** Where the text gatherer fetches from (a Google export URL, a Dropbox `raw=1` URL, the page). */
  fetchUrl: string;
  title: string | null;
  status: LinkStatus;
  problem: LinkProblem | null;
  checkedAt: number | null;
}

// ---------------------------------------------------------------------------
// Watching: estimated tracking and the module playlist
// ---------------------------------------------------------------------------

/** Estimated entries: share of the duration that must be active time before "I've watched this" counts. */
export const ESTIMATED_WATCHED_RATIO = 0.8;
/** No pointer/keyboard/media activity for this long = idle; active time stops counting. */
export const ESTIMATED_IDLE_AFTER_SEC = 120;
/** The client sends one active-time sample at most this often. */
export const ESTIMATED_SAMPLE_INTERVAL_SEC = 15;
/** One sample can add at most this many seconds (a sleeping laptop must not add an hour). */
export const ESTIMATED_MAX_SAMPLE_SEC = 30;
/** Slack between the client's timer and the server's wall clock, in seconds. */
export const ESTIMATED_SAMPLE_TOLERANCE_SEC = 2;

/** One active-time sample for an estimated entry. The server re-caps it (wall clock since the last). */
export interface ActiveTimeSample {
  activeSeconds: number;
  /** The page was visible and focused for the whole sample (the client drops samples otherwise). */
  visible: boolean;
  focused: boolean;
}

/**
 * Seconds one client tick adds to active time: nothing while the tab is hidden, the window is not
 * focused, or the learner has been idle for `ESTIMATED_IDLE_AFTER_SEC`. A tick longer than the
 * sample cap (the laptop slept) adds nothing either.
 */
export function activeIncrement(tick: { dtSec: number; visible: boolean; focused: boolean; idleSec: number }): number {
  if (!tick.visible || !tick.focused) return 0;
  if (!(tick.dtSec > 0) || tick.dtSec > ESTIMATED_MAX_SAMPLE_SEC) return 0;
  if (tick.idleSec >= ESTIMATED_IDLE_AFTER_SEC) return 0;
  return tick.dtSec;
}

/**
 * What the server credits for one sample. Hidden or unfocused samples count nothing. A sample can
 * never add more than the wall-clock time since the previous one (plus a little slack), nor more
 * than `ESTIMATED_MAX_SAMPLE_SEC`. With no previous sample, one sampling interval is the most.
 */
export function creditedActiveSeconds(sample: ActiveTimeSample, wallSinceLastSec: number | null): number {
  if (!sample.visible || !sample.focused) return 0;
  if (!Number.isFinite(sample.activeSeconds) || sample.activeSeconds <= 0) return 0;
  const wallCap = wallSinceLastSec === null ? ESTIMATED_SAMPLE_INTERVAL_SEC : Math.max(0, wallSinceLastSec);
  const cap = Math.min(ESTIMATED_MAX_SAMPLE_SEC, wallCap + ESTIMATED_SAMPLE_TOLERANCE_SEC);
  return Math.round(Math.min(sample.activeSeconds, cap) * 100) / 100;
}

export interface EstimatedProgress {
  /** Active seconds needed before "I've watched this" may be pressed. Null = unknown duration. */
  requiredSeconds: number | null;
  canConfirm: boolean;
  /** 80% active time **and** the click. */
  watched: boolean;
  progress: number;
}

/** The estimated-tracking rule: watched = active time ≥ 80% of the duration and the learner's click. */
export function estimatedProgress(activeSeconds: number, durationSeconds: number | null, confirmed: boolean): EstimatedProgress {
  if (!durationSeconds || !(durationSeconds > 0)) return { requiredSeconds: null, canConfirm: false, watched: false, progress: 0 };
  const required = Math.round(durationSeconds * ESTIMATED_WATCHED_RATIO * 100) / 100;
  const canConfirm = activeSeconds >= required - 0.01;
  return { requiredSeconds: required, canConfirm, watched: canConfirm && confirmed, progress: Math.min(1, activeSeconds / required) };
}

/** One entry of a module's playlist, as the learner's player sees it. */
export interface ModulePlaylistEntry {
  /** `course_videos.id`. Also the `video_progress.video_id` for this entry. */
  videoId: string;
  order: number;
  kind: VideoSourceKind;
  playerKind: PlayerKind;
  tracking: TrackingMode;
  title: string;
  thumbnailUrl: string | null;
  embedUrl: string | null;
  playbackUrl: string | null;
  durationSeconds: number | null;
  /** Exact: seconds watched inside the video. Estimated: active seconds. */
  watchedSeconds: number;
  /** Seconds needed for "watched" (90% exact per v4.3 WATCHED_RATIO; 80% estimated). Null = unknown duration. */
  requiredSeconds: number | null;
  progress: number;
  resumeAt: number;
  /** Estimated only: the learner pressed "I've watched this". */
  confirmed: boolean;
  /** Estimated only: whether the "I've watched this" button may be pressed yet. */
  canConfirm: boolean;
  watched: boolean;
  /** `unavailable` when the last check found the link broken; it then doesn't block the lock. */
  status: "not-started" | "in-progress" | "watched" | "unavailable";
  /** Why an unavailable entry can't play, in plain words. */
  unavailableReason?: string;
}

export interface ModulePlaylistResponse {
  /** The module's managed lesson (`course_topics.id`, kind `module`). */
  topicId: string;
  courseId: string;
  sectionId: string;
  entries: ModulePlaylistEntry[];
  watchedCount: number;
  total: number;
  /** Same lock rule as v4.3 topics (`videos.lock_mode`): the module test waits for the videos. */
  locked: boolean;
  exempt: "completed" | "staff" | null;
  /** `lock` or `warn` (v4.3 `videos.lock_mode`). Additive. */
  lockMode?: "lock" | "warn";
}

/** A module's document, as the learner sees it (download an upload, open a link). Additive. */
export interface ModuleDocEntry {
  docId: string;
  title: string;
  source: "upload" | "link";
  /** Uploads: our download route. Links: the original link. */
  href: string;
  kind: DocLinkKind | null;
  mime: string | null;
  bytes: number | null;
}

/**
 * `GET /api/v5/oyelabs/lessons/:topicId/playlist`: the playlist plus the module's documents and
 * notes (Tiptap JSON, rendered read-only), so the module lesson loads with one request.
 */
export interface ModuleLessonResponse extends ModulePlaylistResponse {
  docs: ModuleDocEntry[];
  notes: { type: "doc"; content: unknown[] } | null;
}

/** Fixed note shown next to every link field in the editor (the brief's wording). */
export const CONFIDENTIALITY_NOTE = "For internal-only videos, upload them here or use Drive shared with 'Oyelabs' only.";

/** How often the daily re-check walks every Oyelabs video and document link. */
export const LINK_RECHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
/** The daily sweep re-checks links last checked longer ago than this. */
export const LINK_RECHECK_AFTER_MS = 20 * 60 * 60 * 1000;
