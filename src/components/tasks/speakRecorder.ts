import { ApiRequestError } from "@/api/client";
import { ERROR_CODES } from "@shared/api";

/**
 * v4.4 Speak: the browser side of a spoken answer, kept free of React so it can be tested.
 *
 * MediaRecorder support differs by browser: Chrome and Edge record WebM/Opus, Firefox Ogg/Opus,
 * older Safari MP4/AAC (docs/v4.4/research/p3-p4-p6-speech-scoring-copy.md §A). The first type the
 * browser says it can record wins; with none, the browser picks.
 */
export const RECORDING_MIME_ORDER = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"] as const;

export function pickRecordingMime(isTypeSupported: ((mime: string) => boolean) | undefined): string | undefined {
  if (!isTypeSupported) return undefined;
  return RECORDING_MIME_ORDER.find((mime) => {
    try {
      return isTypeSupported(mime);
    } catch {
      return false;
    }
  });
}

/** A plain-language message for a microphone error, by the DOMException's name. Never blames the learner. */
export function micErrorMessage(error: unknown): string {
  const name = error instanceof Error || (typeof error === "object" && error !== null && "name" in error) ? String((error as { name?: unknown }).name) : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Your browser blocked the microphone. Click the lock icon next to the address, allow Microphone, then try again.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "We can't find a microphone. Plug one in and try again.";
    case "NotReadableError":
    case "AbortError":
      return "Another app is using your microphone. Close it and try again.";
    case "NoMediaDevices":
      return "Recording only works on a secure (https) page. You can type your answer instead.";
    default:
      return "The microphone didn't start. Try again, or type your answer instead.";
  }
}

/** "1:05" for 65 seconds. */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** What the screen reader hears while recording: the start, ten seconds left, and the end. */
export function recordingAnnouncement(elapsedSec: number, maxSec: number): string | null {
  const left = Math.ceil(maxSec - elapsedSec);
  if (left === 10) return "Ten seconds left.";
  if (left <= 0) return "Time is up. Your recording stopped.";
  return null;
}

/** Root-mean-square level of a time-domain sample (bytes centred on 128), 0..1. */
export function levelOf(samples: ArrayLike<number>): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const v = (samples[i]! - 128) / 128;
    sum += v * v;
  }
  return Math.min(1, Math.sqrt(sum / samples.length) * 3);
}

export type RecordingTarget = { assessmentId: string; itemId: string } | { topicId: string };

/** Uploads one recording to `POST /api/recordings`. Returns its id. */
export async function uploadRecording(blob: Blob, target: RecordingTarget, durationSec: number): Promise<string> {
  const form = new FormData();
  if ("topicId" in target) form.append("topicId", target.topicId);
  else {
    form.append("assessmentId", target.assessmentId);
    form.append("itemId", target.itemId);
  }
  form.append("durationSec", String(Math.round(durationSec * 10) / 10));
  const extension = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "m4a" : "webm";
  form.append("audio", blob, `answer.${extension}`);
  let response: Response;
  try {
    response = await fetch("/api/recordings", { method: "POST", credentials: "same-origin", body: form });
  } catch {
    throw new ApiRequestError(0, ERROR_CODES.INTERNAL, "Could not reach the server. Check your connection, then try again. Your recording is kept.");
  }
  const payload = (await response.json().catch(() => null)) as { recordingId?: string; error?: { message?: string } } | null;
  if (!response.ok || !payload?.recordingId) {
    throw new ApiRequestError(response.status, ERROR_CODES.INTERNAL, payload?.error?.message ?? "The recording didn't upload. Try again. Your recording is kept.");
  }
  return payload.recordingId;
}
