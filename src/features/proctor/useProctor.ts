import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ApiRequestError } from "@/api/client";
import { ERROR_CODES } from "@shared/api";
import type { HeartbeatRequest, IntegrityEventRequest, IntegrityEventResponse } from "@shared/assessment";

import { startBrowserSignals } from "./browserSignals";
import { CameraDetectors } from "./cameraDetectors";
import {
  HARD_COOLDOWN_MS,
  HARD_LIMIT,
  HEARTBEAT_INTERVAL_MS,
  SIGNAL_REASON,
  SIGNAL_SEVERITY,
  faceStateOf,
  type CalibrationPose,
  type ProctorEvent,
  type ProctorSignalType,
  type ProctorState,
} from "./types";

/**
 * One hook that owns the whole proctoring engine for a test page: both signal sources, the
 * transport, the retry queue, the heartbeat and the warning queue the UI renders.
 *
 * It composes rather than decides. The counts it exposes are for display: the server applies the
 * cooldown, the soft-to-hard escalation and the termination threshold from its own stored history
 * (`server/src/assessment/integrity.ts`), because the browser whose count would matter is exactly
 * the browser that might be tampered with. Every response carries the server's `hardWarnings`, and
 * that number overwrites the local one the moment it arrives.
 */

const SOFT_TOAST_MS = 6_000;
/** Failed events wait here rather than being dropped; enough room for a long offline stretch. */
const MAX_QUEUED_EVENTS = 50;
const RETRY_INTERVAL_MS = 5_000;

/**
 * Multipart when there is a snapshot, JSON otherwise.
 *
 * `api.post` always sends JSON, so the snapshot path uses `fetch` directly and rebuilds the same
 * `ApiRequestError` the rest of the app catches. The field names (`event` for the JSON part,
 * `snapshot` for the file) are what the route reads.
 */
export async function postProctorEvent(
  assessmentId: string,
  event: ProctorEvent,
): Promise<IntegrityEventResponse> {
  const path = `/api/assessment/${assessmentId}/events`;
  const body: IntegrityEventRequest = {
    type: event.type,
    severity: event.severity,
    clientTs: event.clientTs,
    ...(event.details ? { details: event.details } : {}),
  };

  let response: Response;
  try {
    if (event.snapshot) {
      const form = new FormData();
      form.append("event", JSON.stringify(body));
      form.append("snapshot", event.snapshot, `${event.type}-${event.clientTs}.jpg`);
      response = await fetch(path, { method: "POST", credentials: "same-origin", body: form });
    } else {
      response = await fetch(path, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    }
  } catch {
    throw new ApiRequestError(0, ERROR_CODES.INTERNAL, "Could not reach the server.");
  }

  const text = await response.text();
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : undefined;
  } catch {
    payload = undefined;
  }

  if (!response.ok) {
    throw new ApiRequestError(response.status, ERROR_CODES.INTERNAL, `Integrity event rejected (${response.status}).`);
  }
  const result = payload as Partial<IntegrityEventResponse> | undefined;
  return {
    counted: result?.counted ?? false,
    escalated: result?.escalated ?? false,
    hardWarnings: result?.hardWarnings ?? 0,
    hardLimit: result?.hardLimit ?? HARD_LIMIT,
    terminated: result?.terminated ?? false,
    pauseMs: result?.pauseMs ?? 0,
  };
}

export interface HardWarning {
  id: number;
  type: ProctorSignalType;
  reason: string;
  /** The warning's number, e.g. 2 in "Warning 2 of 3". Display only until the server replies. */
  count: number;
  /** True when this one reached the limit and the test is over. */
  terminal: boolean;
}

export interface SoftWarning {
  id: number;
  type: ProctorSignalType;
  reason: string;
}

export interface UseProctorOptions {
  assessmentId: string;
  /** The camera handed over by pre-flight. The hook never calls `getUserMedia` itself. */
  stream: MediaStream | null;
  /** Hold this in state, not in a render-time literal: a new object restarts the detectors. */
  calibration: CalibrationPose | null;
  /** False until the learner has actually started the test. */
  enabled?: boolean;
  onTerminated?: () => void;
}

export interface ProctorController {
  /** Attach to the status-strip thumbnail. The detectors read frames from this element. */
  videoRef: React.RefObject<HTMLVideoElement>;
  state: ProctorState;
  hardWarning: HardWarning | null;
  acknowledgeHardWarning: () => void;
  softWarnings: SoftWarning[];
  dismissSoftWarning: (id: number) => void;
  /** How many counted warnings end the test. From the server's response, `HARD_LIMIT` until then. */
  hardLimit: number;
  terminated: boolean;
  /** True while a hard warning is on screen: pause the item timer (§10.3). */
  paused: boolean;
  /** Questions stay blocked until fullscreen is back (§10.2, the "Left fullscreen" row). */
  needsFullscreen: boolean;
  requestFullscreen: () => Promise<void>;
  /** Set when the camera detectors could not start at all. */
  cameraError: string | null;
  /** For a signal only the item UI can see. Severity comes from the table, not the caller. */
  report: (type: ProctorSignalType, details?: Record<string, unknown>) => void;
}

let nextWarningId = 1;

export function useProctor({
  assessmentId,
  stream,
  calibration,
  enabled = true,
  onTerminated,
}: UseProctorOptions): ProctorController {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fallbackVideoRef = useRef<HTMLVideoElement | null>(null);
  const detectorsRef = useRef<CameraDetectors | null>(null);
  const queueRef = useRef<ProctorEvent[]>([]);
  const flushingRef = useRef(false);
  const lastHardAtRef = useRef(new Map<ProctorSignalType, number>());
  const hardCountRef = useRef(0);
  const hardLimitRef = useRef(HARD_LIMIT);
  const terminatedRef = useRef(false);
  const onTerminatedRef = useRef(onTerminated);
  onTerminatedRef.current = onTerminated;

  const [state, setState] = useState<ProctorState>(() => ({
    cameraLive: false,
    faceCount: 0,
    lookingAway: false,
    fullscreen: Boolean(document.fullscreenElement),
    visible: document.visibilityState === "visible",
    hardWarnings: 0,
    softWarnings: 0,
  }));
  const [hardQueue, setHardQueue] = useState<HardWarning[]>([]);
  const [softWarnings, setSoftWarnings] = useState<SoftWarning[]>([]);
  const [terminated, setTerminated] = useState(false);
  const [hardLimit, setHardLimit] = useState(HARD_LIMIT);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const markTerminated = useCallback(() => {
    if (terminatedRef.current) return;
    terminatedRef.current = true;
    setTerminated(true);
    onTerminatedRef.current?.();
  }, []);

  // --- Transport ------------------------------------------------------------

  const flush = useCallback(async () => {
    if (flushingRef.current) return;
    flushingRef.current = true;
    try {
      while (queueRef.current.length > 0) {
        const next = queueRef.current[0];
        if (!next) break;
        try {
          const result = await postProctorEvent(assessmentId, next);
          queueRef.current.shift();
          // The server's number wins over the optimistic one, always.
          hardCountRef.current = Math.max(hardCountRef.current, result.hardWarnings);
          hardLimitRef.current = result.hardLimit;
          setState((current) => ({ ...current, hardWarnings: result.hardWarnings }));
          setHardLimit(result.hardLimit);
          if (result.terminated) markTerminated();
        } catch {
          // Leave it at the head of the queue, keeping its original clientTs, and try again later.
          break;
        }
      }
    } finally {
      flushingRef.current = false;
    }
  }, [assessmentId, markTerminated]);

  const enqueue = useCallback(
    (event: ProctorEvent) => {
      queueRef.current.push(event);
      if (queueRef.current.length > MAX_QUEUED_EVENTS) {
        // Keep the newest: an old event whose snapshot is still held in memory is the least
        // useful thing to hang on to, and the server sees the gap in the heartbeat anyway.
        queueRef.current.splice(0, queueRef.current.length - MAX_QUEUED_EVENTS);
      }
      void flush();
    },
    [flush],
  );

  // --- Event handling -------------------------------------------------------

  const handleEvent = useCallback(
    (event: ProctorEvent) => {
      if (terminatedRef.current) return;

      if (event.severity === "hard") {
        // A local mirror of the server's per-type cooldown, so the modal's "Warning 2 of 3" does
        // not race ahead of the real count on a signal that fires twice in a second.
        const last = lastHardAtRef.current.get(event.type) ?? 0;
        const counted = event.clientTs - last >= HARD_COOLDOWN_MS;
        if (counted) {
          lastHardAtRef.current.set(event.type, event.clientTs);
          hardCountRef.current += 1;
          const count = hardCountRef.current;
          setState((current) => ({ ...current, hardWarnings: count }));
          setHardQueue((queue) => [
            ...queue,
            {
              id: nextWarningId++,
              type: event.type,
              reason: SIGNAL_REASON[event.type],
              count,
              terminal: count >= hardLimitRef.current,
            },
          ]);
        }
      } else {
        setState((current) => ({ ...current, softWarnings: current.softWarnings + 1 }));
        const warning: SoftWarning = {
          id: nextWarningId++,
          type: event.type,
          reason: SIGNAL_REASON[event.type],
        };
        setSoftWarnings((current) => [...current.slice(-2), warning]);
        window.setTimeout(() => setSoftWarnings((current) => current.filter((w) => w.id !== warning.id)), SOFT_TOAST_MS);
      }

      enqueue(event);
    },
    [enqueue],
  );

  const report = useCallback(
    (type: ProctorSignalType, details?: Record<string, unknown>) => {
      handleEvent({
        type,
        severity: SIGNAL_SEVERITY[type],
        clientTs: Date.now(),
        ...(details ? { details } : {}),
      });
    },
    [handleEvent],
  );

  // --- Sources --------------------------------------------------------------

  useEffect(() => {
    if (!enabled) return;
    return startBrowserSignals(handleEvent);
  }, [enabled, handleEvent]);

  useEffect(() => {
    if (!enabled || !stream) return;

    // The status strip's thumbnail is the frame source. If it is not mounted for some reason, an
    // off-screen element stands in: a detached element is not guaranteed to decode frames, so it
    // goes into the document rather than being left floating.
    let video = videoRef.current;
    if (!video) {
      const spare = document.createElement("video");
      spare.style.cssText = "position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0";
      document.body.append(spare);
      fallbackVideoRef.current = spare;
      video = spare;
    }
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    void video.play().catch(() => undefined);

    const detectors = new CameraDetectors({ onEvent: handleEvent });
    detectorsRef.current = detectors;
    let cancelled = false;

    void detectors
      .start(video, calibration)
      .then(() => {
        if (!cancelled) setCameraError(detectors.getState().degraded);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setCameraError(
          error instanceof Error ? error.message : "The camera detectors could not start on this device.",
        );
      });

    return () => {
      cancelled = true;
      detectors.stop();
      detectorsRef.current = null;
      fallbackVideoRef.current?.remove();
      fallbackVideoRef.current = null;
    };
  }, [enabled, stream, calibration, handleEvent]);

  // --- Camera state mirror --------------------------------------------------

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      const camera = detectorsRef.current?.getState();
      if (!camera) return;
      setState((current) =>
        current.cameraLive === camera.cameraLive &&
        current.faceCount === camera.faceCount &&
        current.lookingAway === camera.lookingAway
          ? current
          : {
              ...current,
              cameraLive: camera.cameraLive,
              faceCount: camera.faceCount,
              lookingAway: camera.lookingAway,
            },
      );
    }, 500);
    return () => window.clearInterval(id);
  }, [enabled]);

  // Separate from the detector listeners above: these two drive the UI (the fullscreen gate, the
  // heartbeat body) rather than producing events, and must stay correct even when `enabled` flips.
  useEffect(() => {
    const sync = () =>
      setState((current) => ({
        ...current,
        fullscreen: Boolean(document.fullscreenElement),
        visible: document.visibilityState === "visible",
      }));
    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  // --- Heartbeat and retries ------------------------------------------------

  useEffect(() => {
    if (!enabled || terminated) return;
    const beat = () => {
      const camera = detectorsRef.current?.getState();
      const body: HeartbeatRequest = {
        visible: document.visibilityState === "visible",
        fullscreen: Boolean(document.fullscreenElement),
        faceState: faceStateOf({
          cameraLive: camera?.cameraLive ?? false,
          faceCount: camera?.faceCount ?? 0,
        }),
        cameraLive: camera?.cameraLive ?? false,
      };
      // A missed heartbeat is itself a server-side signal (§10.2), so a failure here is not
      // something to retry or surface: the silence is the message.
      void fetch(`/api/assessment/${assessmentId}/heartbeat`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }).catch(() => undefined);
    };
    beat();
    const id = window.setInterval(beat, HEARTBEAT_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [assessmentId, enabled, terminated]);

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => void flush(), RETRY_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [enabled, flush]);

  // --- Warning queue --------------------------------------------------------

  const acknowledgeHardWarning = useCallback(() => {
    setHardQueue((queue) => queue.slice(1));
  }, []);

  const dismissSoftWarning = useCallback((id: number) => {
    setSoftWarnings((current) => current.filter((warning) => warning.id !== id));
  }, []);

  const requestFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Denied or already there; the gate stays up until `fullscreenchange` says otherwise.
    }
  }, []);

  const hardWarning = hardQueue[0] ?? null;

  return useMemo(
    () => ({
      videoRef,
      state,
      hardWarning,
      acknowledgeHardWarning,
      softWarnings,
      dismissSoftWarning,
      hardLimit,
      terminated,
      paused: hardWarning !== null,
      needsFullscreen: enabled && !state.fullscreen,
      requestFullscreen,
      cameraError,
      report,
    }),
    [
      state,
      hardWarning,
      acknowledgeHardWarning,
      softWarnings,
      dismissSoftWarning,
      hardLimit,
      terminated,
      enabled,
      requestFullscreen,
      cameraError,
      report,
    ],
  );
}
