import { eq } from "drizzle-orm";

import { schema, type Db } from "../db";
import type { Env } from "../env";
import type { Job } from "../jobs/queue";
import type { JobHandler } from "../jobs/worker";
import { computeMetrics } from "./metrics";
import { getRecording, readRecordingAudio } from "./store";
import { createSttClient, SttError, type SttClient } from "./stt";

export interface TranscribeDeps {
  db: Db;
  env: Env;
  /** Defaults to the client STT_BASE_URL selects (mock in dev/test when unset). */
  stt?: SttClient;
  log?: (message: string) => void;
}

/**
 * Job `speech.transcribe` { recordingId }.
 *
 * One at a time: the job worker already runs a single job at a time, and whisper.cpp on a small
 * VPS is CPU-bound, so concurrency would only make every learner wait longer. A failure that may
 * pass on a retry (timeout, 5xx) is rethrown so the worker backs off and retries; the row only
 * becomes "failed" on the last attempt or for an error a retry cannot fix.
 */
export function transcribeHandler(deps: TranscribeDeps): JobHandler {
  const stt = deps.stt ?? createSttClient(deps.env);

  return async (job: Job) => {
    const recordingId = (job.payload as { recordingId?: unknown } | null)?.recordingId;
    if (typeof recordingId !== "string") return;
    const recording = getRecording(deps.db, recordingId);
    if (!recording || recording.sttStatus === "done") return;

    const mark = (set: Partial<typeof schema.audioRecordings.$inferInsert>) =>
      deps.db.update(schema.audioRecordings).set(set).where(eq(schema.audioRecordings.id, recordingId)).run();

    const audio = await readRecordingAudio(deps.env, recording);
    if (!audio) {
      mark({ sttStatus: "failed", sttError: "The audio file is no longer available." });
      return;
    }

    try {
      const result = await stt.transcribe(audio, recording.mime);
      if (result.status === "unavailable") {
        mark({ sttStatus: "unavailable", sttError: result.reason });
        return;
      }
      mark({
        sttStatus: "done",
        sttError: null,
        transcript: result.transcript,
        words: result.words,
        metrics: computeMetrics(result.words, result.transcript),
        ...(recording.durationSec == null && result.durationSec != null ? { durationSec: result.durationSec } : {}),
      });
      deps.log?.(`transcribed recording ${recordingId}: ${result.words.length} words`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const retryable = error instanceof SttError ? error.retryable : true;
      if (retryable && job.attempts < job.maxAttempts) throw error;
      mark({ sttStatus: "failed", sttError: message.slice(0, 1000) });
      deps.log?.(`transcription failed for ${recordingId}: ${message}`);
    }
  };
}
