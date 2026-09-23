import { FaceLandmarker, FilesetResolver, ObjectDetector, type Matrix } from "@mediapipe/tasks-vision";

import {
  BLACK_FRAME_MEAN_LUMA,
  CALIBRATION_HOLD_MS,
  CAMERA_LOST_SUSTAINED_MS,
  FACE_INTERVAL_MS,
  FACE_MAX_FACES,
  FACE_MODEL_PATH,
  LOOKING_AWAY_PITCH_DEG,
  LOOKING_AWAY_SUSTAINED_MS,
  LOOKING_AWAY_YAW_DEG,
  MEDIAPIPE_WASM_PATH,
  MULTIPLE_FACES_MIN_COUNT,
  MULTIPLE_FACES_SUSTAINED_MS,
  NO_FACE_SUSTAINED_MS,
  OBJECT_CATEGORY_ALLOWLIST,
  OBJECT_FRAME_HITS,
  OBJECT_FRAME_WINDOW,
  OBJECT_INTERVAL_MS,
  OBJECT_MODEL_PATH,
  OBJECT_SCORE_THRESHOLD,
  PHONE_SCORE_THRESHOLD,
  SIGNAL_SEVERITY,
  SNAPSHOT_QUALITY,
  SNAPSHOT_WIDTH,
  needsSnapshot,
  type CalibrationPose,
  type HeadPose,
  type ProctorEvent,
  type ProctorSignalType,
} from "./types";

/**
 * The camera half of the §10.2 detector table, running entirely on the device.
 *
 * Frames never leave the machine. The only thing that ever goes to the server is a 320 px JPEG
 * still, and only for the handful of signals the brief marks "+ snapshot" — the rest of the video
 * is read, scored and thrown away frame by frame.
 *
 * Every camera signal is debounced by a sustained-duration or N-of-M rule before it becomes an
 * event, because detection is noisy: a blink, a glance at the keyboard, a bad backlight or a pair
 * of glasses will each produce a stray frame, and one stray frame must never cost a learner a
 * warning (§10.7).
 */

// ---------------------------------------------------------------------------
// Head pose
// ---------------------------------------------------------------------------

const RAD_TO_DEG = 180 / Math.PI;

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * Yaw, pitch and roll from the FaceLandmarker's facial transformation matrix.
 *
 * `FaceLandmarkerResult.facialTransformationMatrixes[i]` is a `Matrix`, declared in the package's
 * own `vision.d.ts` as `{ rows: number; columns: number; data: number[] }`. For a face it is the
 * 4x4 rigid transform that maps the canonical face model onto the detected head, so its top-left
 * 3x3 block is a pure rotation and the Euler angles can be read straight out of it — no landmark
 * geometry or PnP solve needed.
 *
 * Layout: MediaPipe packs `data` column-major (the order `THREE.Matrix4.fromArray` expects), so
 * `R[row][col] === data[col * 4 + row]`. The bottom row of a rigid transform is (0, 0, 0, 1),
 * which in column-major order puts the three zeros at indices 3, 7 and 11 and in row-major order
 * at 12, 13 and 14. Checking that costs three comparisons and removes the one mistake that would
 * be invisible in review: a transposed rotation silently swaps yaw and pitch.
 *
 * Angles are the YXZ Tait-Bryan decomposition, R = Ry(yaw) * Rx(pitch) * Rz(roll). Expanding that
 * product gives R[1][2] = -sin(pitch), R[0][2] = sin(yaw)cos(pitch) and R[2][2] =
 * cos(yaw)cos(pitch), hence the three lines below. YXZ is the right order for a head, which turns
 * left and right far more than it tilts, so yaw stays well conditioned until the face is nearly in
 * profile — past which the landmarker has already stopped reporting a face at all.
 */
export function headPoseFromMatrix(matrix: Matrix | undefined): HeadPose | null {
  if (!matrix || matrix.rows !== 4 || matrix.columns !== 4 || matrix.data.length < 16) return null;
  const d = matrix.data;
  const columnMajor = Math.abs(d[3]) < 1e-3 && Math.abs(d[7]) < 1e-3 && Math.abs(d[11]) < 1e-3;
  const at = (row: number, col: number) => (columnMajor ? d[col * 4 + row] : d[row * 4 + col]);

  const pitch = Math.asin(clamp(-at(1, 2), -1, 1));
  const yaw = Math.atan2(at(0, 2), at(2, 2));
  const roll = Math.atan2(at(1, 0), at(1, 1));
  return { yaw: yaw * RAD_TO_DEG, pitch: pitch * RAD_TO_DEG, roll: roll * RAD_TO_DEG };
}

/** Wraps a degree difference into (-180, 180] so a pose either side of +/-180 does not read as huge. */
function angleDelta(a: number, b: number): number {
  let delta = (a - b) % 360;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

// ---------------------------------------------------------------------------
// Debounce primitives
// ---------------------------------------------------------------------------

/** Fires once per continuous episode, the moment the condition has held for `ms`. */
class Sustained {
  private since: number | null = null;
  private fired = false;

  constructor(private readonly ms: number) {}

  update(active: boolean, now: number): boolean {
    if (!active) {
      this.since = null;
      this.fired = false;
      return false;
    }
    if (this.since === null) this.since = now;
    if (!this.fired && now - this.since >= this.ms) {
      this.fired = true;
      return true;
    }
    return false;
  }

  heldMs(now: number): number {
    return this.since === null ? 0 : now - this.since;
  }

  reset(): void {
    this.since = null;
    this.fired = false;
  }
}

/** The "3 of the last 5 frames" rule. Also fires once per episode. */
class FrameWindow {
  private readonly hits: boolean[] = [];
  private fired = false;

  constructor(
    private readonly size: number,
    private readonly needed: number,
  ) {}

  push(hit: boolean): boolean {
    this.hits.push(hit);
    if (this.hits.length > this.size) this.hits.shift();
    const count = this.hits.reduce((total, value) => total + (value ? 1 : 0), 0);
    if (count >= this.needed) {
      if (this.fired) return false;
      this.fired = true;
      return true;
    }
    this.fired = false;
    return false;
  }

  reset(): void {
    this.hits.length = 0;
    this.fired = false;
  }
}

// ---------------------------------------------------------------------------
// Frame helpers
// ---------------------------------------------------------------------------

/** §10.4: a JPEG from the video frame, 320 px wide, quality 0.7. */
export function captureSnapshotFrom(video: HTMLVideoElement): Promise<Blob | null> {
  if (!video.videoWidth || !video.videoHeight) return Promise.resolve(null);
  const width = SNAPSHOT_WIDTH;
  const height = Math.max(1, Math.round((video.videoHeight / video.videoWidth) * width));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return Promise.resolve(null);
  context.drawImage(video, 0, 0, width, height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", SNAPSHOT_QUALITY);
  });
}

/**
 * Mean Rec. 709 luma of a heavily downscaled frame.
 *
 * A covered lens, a privacy shutter or a driver that keeps the track "live" while sending nothing
 * all look the same from JavaScript: the track is fine, the pixels are black. 32x24 is enough to
 * tell a dark room (which still has noise and highlights) from a covered camera.
 */
function meanLuma(video: HTMLVideoElement, canvas: HTMLCanvasElement): number | null {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context || !video.videoWidth) return null;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  let total = 0;
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < data.length; i += 4) {
    total += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  }
  return total / (data.length / 4);
}

/** Normalized bounding box of one face's landmarks, used for the centring check. */
function faceBox(landmarks: { x: number; y: number }[]): { cx: number; cy: number; width: number; height: number } {
  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;
  for (const point of landmarks) {
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.y > maxY) maxY = point.y;
  }
  return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, width: maxX - minX, height: maxY - minY };
}

/** Centred enough to calibrate against: roughly middle of frame, and close enough to read a pose. */
function isCentred(box: { cx: number; cy: number; width: number }): boolean {
  return box.cx > 0.3 && box.cx < 0.7 && box.cy > 0.25 && box.cy < 0.75 && box.width > 0.12;
}

// ---------------------------------------------------------------------------
// Model loading
// ---------------------------------------------------------------------------

let filesetPromise: Promise<Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>> | null = null;

function visionFileset() {
  // The WASM binaries are several megabytes; one fileset is shared by both tasks and by the
  // pre-flight calibration pass, which runs before the detectors and warms this cache.
  filesetPromise ??= FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH);
  return filesetPromise;
}

/** GPU first; the CPU delegate is the fallback on machines with no usable WebGL context (§10.2). */
async function withDelegateFallback<T>(create: (delegate: "GPU" | "CPU") => Promise<T>): Promise<T> {
  try {
    return await create("GPU");
  } catch {
    return create("CPU");
  }
}

export async function createFaceLandmarker(): Promise<FaceLandmarker> {
  const fileset = await visionFileset();
  return withDelegateFallback((delegate) =>
    FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: FACE_MODEL_PATH, delegate },
      runningMode: "VIDEO",
      numFaces: FACE_MAX_FACES,
      outputFacialTransformationMatrixes: true,
    }),
  );
}

async function createObjectDetector(): Promise<ObjectDetector> {
  const fileset = await visionFileset();
  return withDelegateFallback((delegate) =>
    ObjectDetector.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: OBJECT_MODEL_PATH, delegate },
      runningMode: "VIDEO",
      scoreThreshold: OBJECT_SCORE_THRESHOLD,
      categoryAllowlist: [...OBJECT_CATEGORY_ALLOWLIST],
    }),
  );
}

/** `detectForVideo` rejects a timestamp that does not advance, so keep our own monotonic clock. */
function monotonic() {
  let last = 0;
  return () => {
    const now = Math.max(performance.now(), last + 1);
    last = now;
    return now;
  };
}

// ---------------------------------------------------------------------------
// Pre-flight calibration (§10.1 step 2)
// ---------------------------------------------------------------------------

export interface CalibrationSample {
  faceCount: number;
  centred: boolean;
  pose: HeadPose | null;
  /** How long exactly one centred face has been held, in ms. */
  heldMs: number;
  /** True once the hold is long enough and `pose` is the averaged calibration pose. */
  ready: boolean;
}

/**
 * Watches the pre-flight preview until one centred face has been held for 3 s, then reports the
 * averaged pose. Averaging over the hold rather than snapping one frame matters: the calibration
 * is the origin every later looking-away measurement is relative to, so a single noisy frame would
 * bias the whole session.
 */
export function startCalibration(
  video: HTMLVideoElement,
  onSample: (sample: CalibrationSample) => void,
): () => void {
  let stopped = false;
  let frame = 0;
  let landmarker: FaceLandmarker | null = null;
  let lastRun = 0;
  const nextTimestamp = monotonic();
  const held = new Sustained(CALIBRATION_HOLD_MS);
  let samples: HeadPose[] = [];

  const loop = () => {
    if (stopped) return;
    frame = requestAnimationFrame(loop);
    const now = performance.now();
    if (!landmarker || now - lastRun < FACE_INTERVAL_MS) return;
    lastRun = now;
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    const result = landmarker.detectForVideo(video, nextTimestamp());
    const faceCount = result.faceLandmarks.length;
    const first = result.faceLandmarks[0];
    const box = faceCount === 1 && first ? faceBox(first) : null;
    const centred = box ? isCentred(box) : false;
    const pose = faceCount === 1 ? headPoseFromMatrix(result.facialTransformationMatrixes[0]) : null;

    const good = faceCount === 1 && centred && pose !== null;
    if (good && pose) samples.push(pose);
    else samples = [];

    const ready = held.update(good, now);
    onSample({
      faceCount,
      centred,
      pose: ready ? averagePose(samples) : pose,
      heldMs: Math.min(held.heldMs(now), CALIBRATION_HOLD_MS),
      ready,
    });
  };

  void createFaceLandmarker()
    .then((created) => {
      if (stopped) {
        created.close();
        return;
      }
      landmarker = created;
    })
    .catch(() => {
      // The caller sees a hold that never completes; PreFlight surfaces its own timeout copy.
    });

  frame = requestAnimationFrame(loop);

  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
    landmarker?.close();
    landmarker = null;
  };
}

function averagePose(poses: HeadPose[]): HeadPose | null {
  if (poses.length === 0) return null;
  const total = poses.reduce(
    (sum, pose) => ({ yaw: sum.yaw + pose.yaw, pitch: sum.pitch + pose.pitch, roll: sum.roll + pose.roll }),
    { yaw: 0, pitch: 0, roll: 0 },
  );
  return { yaw: total.yaw / poses.length, pitch: total.pitch / poses.length, roll: total.roll / poses.length };
}

// ---------------------------------------------------------------------------
// The detector loop
// ---------------------------------------------------------------------------

export interface CameraState {
  cameraLive: boolean;
  faceCount: number;
  lookingAway: boolean;
  pose: HeadPose | null;
  /** `performance.now()` of the last frame actually scored, or null before the first one. */
  lastFrameAt: number | null;
  /** Set when a detector could not be created; the rest keep running without it. */
  degraded: string | null;
}

export interface CameraDetectorsOptions {
  onEvent: (event: ProctorEvent) => void;
}

/**
 * Both MediaPipe tasks driven from one `requestAnimationFrame` loop, gated to their own rates
 * (~5 fps for faces, ~1 fps for objects) so the detectors cost a fraction of a core rather than a
 * whole one.
 */
export class CameraDetectors {
  private readonly onEvent: (event: ProctorEvent) => void;
  private video: HTMLVideoElement | null = null;
  private calibration: CalibrationPose | null = null;
  private faceLandmarker: FaceLandmarker | null = null;
  private objectDetector: ObjectDetector | null = null;
  private frame = 0;
  private running = false;
  private lastFaceRun = 0;
  private lastObjectRun = 0;
  private lastTickAt = 0;
  private readonly faceTimestamp = monotonic();
  private readonly objectTimestamp = monotonic();
  private readonly lumaCanvas = document.createElement("canvas");
  private trackCleanup: (() => void)[] = [];

  private readonly multipleFaces = new Sustained(MULTIPLE_FACES_SUSTAINED_MS);
  private readonly noFace = new Sustained(NO_FACE_SUSTAINED_MS);
  private readonly blackFrame = new Sustained(CAMERA_LOST_SUSTAINED_MS);
  private readonly lookingAway = new Sustained(LOOKING_AWAY_SUSTAINED_MS);
  private readonly phone = new FrameWindow(OBJECT_FRAME_WINDOW, OBJECT_FRAME_HITS);
  private readonly bookOrLaptop = new FrameWindow(OBJECT_FRAME_WINDOW, OBJECT_FRAME_HITS);

  private state: CameraState = {
    cameraLive: false,
    faceCount: 0,
    lookingAway: false,
    pose: null,
    lastFrameAt: null,
    degraded: null,
  };

  constructor(options: CameraDetectorsOptions) {
    this.onEvent = options.onEvent;
    this.lumaCanvas.width = 32;
    this.lumaCanvas.height = 24;
  }

  getState(): CameraState {
    return this.state;
  }

  /**
   * Loads both models and starts scoring `video`. `calibration` is the pre-flight pose; when it is
   * missing (a reload mid-test, say) the first clean pose becomes the reference instead, which is
   * less accurate but better than measuring yaw against zero.
   */
  async start(video: HTMLVideoElement, calibration: CalibrationPose | null): Promise<void> {
    this.stop();
    this.video = video;
    this.calibration = calibration;
    this.running = true;
    this.watchTracks(video);

    try {
      this.faceLandmarker = await createFaceLandmarker();
    } catch (error) {
      this.running = false;
      throw error instanceof Error ? error : new Error("The face detector could not start.");
    }
    if (!this.running) {
      this.faceLandmarker.close();
      this.faceLandmarker = null;
      return;
    }

    try {
      this.objectDetector = await createObjectDetector();
    } catch {
      // Losing the object detector costs the phone and book rows, not the whole session: face
      // presence and focus are the signals that carry the most weight anyway.
      this.state = { ...this.state, degraded: "The object detector could not start; phone detection is off." };
    }

    this.lastTickAt = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    for (const off of this.trackCleanup.splice(0)) off();
    this.faceLandmarker?.close();
    this.faceLandmarker = null;
    this.objectDetector?.close();
    this.objectDetector = null;
    this.video = null;
    this.resetDebouncers();
  }

  private resetDebouncers(): void {
    this.multipleFaces.reset();
    this.noFace.reset();
    this.blackFrame.reset();
    this.lookingAway.reset();
    this.phone.reset();
    this.bookOrLaptop.reset();
  }

  /** The track's own `ended`/`mute` events are the unambiguous half of the camera-lost row. */
  private watchTracks(video: HTMLVideoElement): void {
    const stream = video.srcObject;
    if (!(stream instanceof MediaStream)) return;
    for (const track of stream.getVideoTracks()) {
      const lost = (cause: string) => {
        this.state = { ...this.state, cameraLive: false, faceCount: 0 };
        this.emit("camera_lost", { cause });
      };
      const onEnded = () => lost("track-ended");
      const onMute = () => lost("track-muted");
      track.addEventListener("ended", onEnded);
      track.addEventListener("mute", onMute);
      this.trackCleanup.push(() => {
        track.removeEventListener("ended", onEnded);
        track.removeEventListener("mute", onMute);
      });
    }
  }

  private emit(type: ProctorSignalType, details?: Record<string, unknown>): void {
    const event: ProctorEvent = {
      type,
      severity: SIGNAL_SEVERITY[type],
      clientTs: Date.now(),
      ...(details ? { details } : {}),
    };
    if (!needsSnapshot(type) || !this.video) {
      this.onEvent(event);
      return;
    }
    // Grabbing the still is async; the event is dispatched once it is attached so the transport
    // sends one multipart request rather than an event and a late upload.
    const video = this.video;
    void captureSnapshotFrom(video)
      .then((snapshot) => this.onEvent(snapshot ? { ...event, snapshot } : event))
      .catch(() => this.onEvent(event));
  }

  private readonly tick = () => {
    if (!this.running) return;
    this.frame = requestAnimationFrame(this.tick);
    const now = performance.now();

    // rAF is paused in a background tab, so a resumed loop can show a gap of minutes. Wall time
    // that was never observed must not count towards a sustained rule — otherwise every tab
    // switch would come back as an eight-second "no face" as well.
    if (now - this.lastTickAt > 1_500) this.resetDebouncers();
    this.lastTickAt = now;

    const video = this.video;
    if (!video) return;
    const ready = video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0;
    if (!ready) return;

    if (now - this.lastFaceRun >= FACE_INTERVAL_MS) {
      this.lastFaceRun = now;
      this.runFaceFrame(video, now);
    }
    if (this.objectDetector && now - this.lastObjectRun >= OBJECT_INTERVAL_MS) {
      this.lastObjectRun = now;
      this.runObjectFrame(video);
    }
  };

  private runFaceFrame(video: HTMLVideoElement, now: number): void {
    const landmarker = this.faceLandmarker;
    if (!landmarker) return;

    let faceCount = 0;
    let pose: HeadPose | null = null;
    try {
      const result = landmarker.detectForVideo(video, this.faceTimestamp());
      faceCount = result.faceLandmarks.length;
      if (faceCount >= 1) pose = headPoseFromMatrix(result.facialTransformationMatrixes[0]);
    } catch {
      // A dropped frame (a GPU context loss, a resize mid-detect) is not a signal by itself.
      return;
    }

    // --- Camera lost: a black frame sustained >= 5 s ------------------------
    const luma = meanLuma(video, this.lumaCanvas);
    const black = luma !== null && luma < BLACK_FRAME_MEAN_LUMA;
    if (this.blackFrame.update(black, now)) {
      this.emit("camera_lost", { cause: "black-frame", meanLuma: Math.round(luma ?? 0) });
    }

    // --- Multiple faces sustained >= 3 s ------------------------------------
    if (this.multipleFaces.update(faceCount >= MULTIPLE_FACES_MIN_COUNT, now)) {
      this.emit("multiple_faces", { faceCount });
    }

    // --- No face sustained >= 8 s -------------------------------------------
    // Suppressed while the frame is black: that is the camera-lost row's story, not this one.
    if (this.noFace.update(faceCount === 0 && !black, now)) {
      this.emit("no_face", { sustainedMs: NO_FACE_SUSTAINED_MS });
    }

    // --- Looking away sustained >= 4 s --------------------------------------
    let away = false;
    if (pose) {
      this.calibration ??= { ...pose, capturedAt: Date.now() };
      const yawDelta = angleDelta(pose.yaw, this.calibration.yaw);
      const pitchDelta = angleDelta(pose.pitch, this.calibration.pitch);
      away = Math.abs(yawDelta) > LOOKING_AWAY_YAW_DEG || Math.abs(pitchDelta) > LOOKING_AWAY_PITCH_DEG;
      if (this.lookingAway.update(away, now)) {
        this.emit("looking_away", {
          yawDelta: Math.round(yawDelta),
          pitchDelta: Math.round(pitchDelta),
          sustainedMs: LOOKING_AWAY_SUSTAINED_MS,
        });
      }
    } else {
      this.lookingAway.update(false, now);
    }

    this.state = {
      cameraLive: !black,
      faceCount,
      lookingAway: away,
      pose,
      lastFrameAt: now,
      degraded: this.state.degraded,
    };
  }

  private runObjectFrame(video: HTMLVideoElement): void {
    const detector = this.objectDetector;
    if (!detector) return;

    let categories: { name: string; score: number }[] = [];
    try {
      const result = detector.detectForVideo(video, this.objectTimestamp());
      categories = result.detections.flatMap((detection) =>
        detection.categories.map((category) => ({
          name: (category.categoryName || category.displayName || "").toLowerCase(),
          score: category.score,
        })),
      );
    } catch {
      return;
    }

    // --- Phone: score >= 0.6 in 3 of the last 5 frames (hard) ---------------
    const phone = categories.find((c) => c.name === "cell phone" && c.score >= PHONE_SCORE_THRESHOLD);
    if (this.phone.push(Boolean(phone))) {
      this.emit("phone_in_frame", { score: Number((phone?.score ?? 0).toFixed(2)) });
    }

    // --- Book or laptop: 3 of 5 frames (soft) -------------------------------
    const other = categories.find((c) => c.name === "book" || c.name === "laptop");
    if (this.bookOrLaptop.push(Boolean(other))) {
      this.emit("book_or_laptop_in_frame", { object: other?.name, score: Number((other?.score ?? 0).toFixed(2)) });
    }
  }
}
