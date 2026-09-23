import type { Severity } from "@shared/enums";

/**
 * The vocabulary of the proctoring engine (brief §10.2).
 *
 * Every detector in this folder speaks in `ProctorEvent`s and nothing else, so the transport, the
 * warning UI and the admin's stored history all agree on one set of names. The thresholds below
 * are the brief's numbers, kept here rather than inline so a policy change is a one-line edit and
 * so the values the UI explains to the learner cannot drift from the values the detectors use.
 *
 * The server re-applies the counting rules from its own stored history
 * (`server/src/assessment/integrity.ts`). Nothing in this folder is authoritative.
 */

/** One row — or one half of a combined row — of the §10.2 detector table. */
export type ProctorSignalType =
  /** Tab hidden: `visibilitychange`, immediate. */
  | "tab_hidden"
  /** Window blur lasting longer than 2 s: alt-tab and OS overlays. */
  | "window_blur"
  /** Left fullscreen: `fullscreenchange`, immediate. */
  | "fullscreen_exit"
  /**
   * Copy or cut attempt. One type for both halves of the row, so a Ctrl+C then Ctrl+X pair is a
   * single strike under the server's per-type cooldown rather than two.
   */
  | "copy_cut_attempt"
  /** Paste attempt, prevented. */
  | "paste_attempt"
  /** PrintScreen keyup. */
  | "printscreen"
  /** ObjectDetector saw a phone. */
  | "phone_in_frame"
  /** FaceLandmarker counted two or more faces. */
  | "multiple_faces"
  /** FaceLandmarker counted none. */
  | "no_face"
  /** The track ended or muted, or the frame went black. */
  | "camera_lost"
  /** Server-created when no heartbeat arrives. Listed here so admin views can name it. */
  | "heartbeat_missing"
  /** Head pose outside the cone around the calibration pose. */
  | "looking_away"
  /** ObjectDetector saw a book or a laptop. */
  | "book_or_laptop_in_frame"
  /**
   * Right-click, prevented. Split from the selection half of its row because `selectstart` is far
   * noisier, and the server escalates three *same-type* soft events into a hard one.
   */
  | "context_menu_attempt"
  /** Text-selection attempt, prevented. */
  | "text_selection_attempt"
  /** The pointer left the document for more than 3 s. */
  | "mouse_left_window"
  /** Outer/inner window size delta: a best-effort DevTools guess. */
  | "devtools_suspected"
  /** `screen.isExtended`: a second display is attached. */
  | "extended_display";

export interface ProctorEvent {
  type: ProctorSignalType;
  severity: Severity;
  /**
   * Device clock, in milliseconds. Preserved verbatim through retries, so an event that sat in the
   * queue still says when it happened rather than when it finally got through.
   */
  clientTs: number;
  details?: Record<string, unknown>;
  /** A JPEG still, only for the signals listed in `SNAPSHOT_SIGNALS`. */
  snapshot?: Blob;
}

/** What the status strip, the heartbeat and the warning modal read. */
export interface ProctorState {
  cameraLive: boolean;
  faceCount: number;
  lookingAway: boolean;
  fullscreen: boolean;
  visible: boolean;
  /** Display only. Reconciled with the server's number on every event response. */
  hardWarnings: number;
  softWarnings: number;
}

/**
 * The coarse camera summary the heartbeat body carries (§9.5).
 *
 * Mirrors `heartbeatRequestSchema` in `shared/assessment.ts`, which is the contract the server
 * validates against. Note there is no "looking away" state: that is a soft signal with its own
 * event and does not belong in a 10-second liveness ping.
 */
export type FaceState = "one" | "none" | "multiple" | "unknown";

export interface HeadPose {
  /** Degrees. Positive turns towards the learner's left. */
  yaw: number;
  /** Degrees. Positive tips the chin up. */
  pitch: number;
  /** Degrees. Head tilt: recorded for the admin, never a signal on its own. */
  roll: number;
}

/** The pose recorded during pre-flight. Every later looking-away test is relative to it. */
export interface CalibrationPose extends HeadPose {
  capturedAt: number;
}

// ---------------------------------------------------------------------------
// §10.2 thresholds
// ---------------------------------------------------------------------------

/** Row "Window blur": lasting > 2 s. */
export const WINDOW_BLUR_SUSTAINED_MS = 2_000;
/** Row "Mouse left window": lasting > 3 s. */
export const MOUSE_LEFT_SUSTAINED_MS = 3_000;
/** Row "Multiple faces": count >= 2, sustained >= 3 s. */
export const MULTIPLE_FACES_SUSTAINED_MS = 3_000;
export const MULTIPLE_FACES_MIN_COUNT = 2;
/** Row "No face": count = 0, sustained >= 8 s. */
export const NO_FACE_SUSTAINED_MS = 8_000;
/** Row "Camera lost": a black frame sustained >= 5 s. */
export const CAMERA_LOST_SUSTAINED_MS = 5_000;
/** Row "Camera lost": a mean luma below this counts as a black frame. */
export const BLACK_FRAME_MEAN_LUMA = 12;
/** Row "Looking away": yaw beyond +/-30 deg from the calibration pose. */
export const LOOKING_AWAY_YAW_DEG = 30;
/** Row "Looking away": pitch beyond +/-25 deg from the calibration pose. */
export const LOOKING_AWAY_PITCH_DEG = 25;
/** Row "Looking away": sustained >= 4 s. */
export const LOOKING_AWAY_SUSTAINED_MS = 4_000;
/** Row "Phone in frame": score >= 0.6 in 3 of the last 5 object-detector frames. */
export const PHONE_SCORE_THRESHOLD = 0.6;
/** Rows "Phone in frame" and "Book / laptop in frame": 3 hits inside a 5-frame window. */
export const OBJECT_FRAME_WINDOW = 5;
export const OBJECT_FRAME_HITS = 3;
/** Row "DevTools heuristic": a delta this large is the usual docked-panel signature. */
export const DEVTOOLS_SIZE_DELTA_PX = 160;

// ---------------------------------------------------------------------------
// §10.2 MediaPipe setup and §10.4 transport
// ---------------------------------------------------------------------------

/** FaceLandmarker runs at about 5 fps. */
export const FACE_INTERVAL_MS = 200;
/** ObjectDetector runs at about 1 fps. */
export const OBJECT_INTERVAL_MS = 1_000;
export const FACE_MAX_FACES = 3;
export const OBJECT_SCORE_THRESHOLD = 0.5;
export const OBJECT_CATEGORY_ALLOWLIST = ["cell phone", "book", "laptop"];
/** Self-hosted, never a CDN: a test must not depend on a third party being up (§10.2). */
export const MEDIAPIPE_WASM_PATH = "/mediapipe/wasm";
export const FACE_MODEL_PATH = "/mediapipe/models/face_landmarker.task";
export const OBJECT_MODEL_PATH = "/mediapipe/models/efficientdet_lite0.tflite";

/** §10.4: snapshots are JPEGs taken from the video frame at 320 px wide, quality 0.7. */
export const SNAPSHOT_WIDTH = 320;
export const SNAPSHOT_QUALITY = 0.7;
/** §9.5: the heartbeat goes out every 10 s; the server flags a 30 s silence itself. */
export const HEARTBEAT_INTERVAL_MS = 10_000;
/** §10.2 escalation: the third counted hard warning ends the test. */
export const HARD_LIMIT = 3;
/** §10.2 cooldown, mirrored here only so the displayed count tracks the server's. */
export const HARD_COOLDOWN_MS = 10_000;
/** §10.1 step 2: one centred face held this long before the pose is recorded. */
export const CALIBRATION_HOLD_MS = 3_000;
/** §10.1 step 4: desktop only. */
export const MIN_VIEWPORT_PX = 1024;
/** §10.6: how long snapshots are kept. Stated to the learner during consent. */
export const SNAPSHOT_RETENTION_DAYS = 90;

// ---------------------------------------------------------------------------
// Per-signal metadata
// ---------------------------------------------------------------------------

export const SIGNAL_SEVERITY: Record<ProctorSignalType, Severity> = {
  tab_hidden: "hard",
  window_blur: "hard",
  fullscreen_exit: "hard",
  copy_cut_attempt: "hard",
  paste_attempt: "hard",
  printscreen: "hard",
  phone_in_frame: "hard",
  multiple_faces: "hard",
  no_face: "hard",
  camera_lost: "hard",
  heartbeat_missing: "hard",
  looking_away: "soft",
  book_or_laptop_in_frame: "soft",
  context_menu_attempt: "soft",
  text_selection_attempt: "soft",
  mouse_left_window: "soft",
  devtools_suspected: "soft",
  extended_display: "soft",
};

/** The signals §10.2 marks "+ snapshot". */
export const SNAPSHOT_SIGNALS: ReadonlySet<ProctorSignalType> = new Set<ProctorSignalType>([
  "phone_in_frame",
  "multiple_faces",
  "no_face",
  "looking_away",
  "book_or_laptop_in_frame",
]);

/**
 * The second half of "Warning 2 of 3: ...".
 *
 * Each one states what was observed rather than what the learner did. Every signal here has a
 * false-positive story — lighting, glasses, a housemate walking past — and the copy should not
 * accuse someone of cheating on the strength of a probabilistic detector (§10.7).
 */
export const SIGNAL_REASON: Record<ProctorSignalType, string> = {
  tab_hidden: "this tab was hidden",
  window_blur: "this window lost focus for more than two seconds",
  fullscreen_exit: "you left fullscreen",
  copy_cut_attempt: "copying from the question was blocked",
  paste_attempt: "pasting into an answer was blocked",
  printscreen: "the PrintScreen key was pressed",
  phone_in_frame: "a phone was visible in the camera",
  multiple_faces: "more than one face was visible",
  no_face: "no face was visible for eight seconds",
  camera_lost: "the camera stopped sending video",
  heartbeat_missing: "this tab stopped reporting to the server",
  looking_away: "you looked away from the screen for a while",
  book_or_laptop_in_frame: "a book or a second screen was visible",
  context_menu_attempt: "the right-click menu is disabled here",
  text_selection_attempt: "selecting the question text is disabled here",
  mouse_left_window: "the pointer left the window",
  devtools_suspected: "developer tools may be open",
  extended_display: "a second display is connected",
};

export function severityOf(type: ProctorSignalType): Severity {
  return SIGNAL_SEVERITY[type];
}

export function needsSnapshot(type: ProctorSignalType): boolean {
  return SNAPSHOT_SIGNALS.has(type);
}

/** What the heartbeat reports about the camera (§9.5). */
export function faceStateOf(state: Pick<ProctorState, "cameraLive" | "faceCount">): FaceState {
  if (!state.cameraLive) return "unknown";
  if (state.faceCount === 0) return "none";
  if (state.faceCount >= MULTIPLE_FACES_MIN_COUNT) return "multiple";
  return "one";
}
