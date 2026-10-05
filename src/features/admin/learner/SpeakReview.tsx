import { useEffect, useState } from "react";
import { Keyboard, Volume2 } from "lucide-react";

import type { TaskResponse } from "@shared/tasks";

import { api, ApiRequestError } from "@/api/client";
import { Badge } from "@/components/ui/badge";

import { parseSpeakFeedback } from "./v4Helpers";

interface RecordingView {
  id: string;
  sttStatus: "pending" | "done" | "failed" | "unavailable";
  transcript: string | null;
  metrics: { wpm: number; pauses: number; longestPauseSec: number; fillers: number } | null;
  durationSec: number | null;
  audioAvailable: boolean;
}

/**
 * v4.4: a Speak answer for the admin: the recording (while it is kept), what was said, the English
 * level, and the fluency numbers marked approximate. A typed answer is flagged as such.
 */
export function SpeakReview({ response, feedback }: { response: Extract<TaskResponse, { kind: "speak" }>; feedback: string | null }) {
  const graded = parseSpeakFeedback(feedback);
  const [recording, setRecording] = useState<RecordingView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recordingId = response.usedFallback ? null : (response.recordingId ?? null);

  useEffect(() => {
    if (!recordingId) return;
    const controller = new AbortController();
    api
      .get<{ recording: RecordingView }>(`/api/admin/recordings/${recordingId}`, controller.signal)
      .then(({ recording: found }) => setRecording(found))
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(err instanceof ApiRequestError ? err.message : "The recording couldn't be loaded.");
      });
    return () => controller.abort();
  }, [recordingId]);

  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        {response.usedFallback && (
          <Badge variant="outline" className="border-trailmark/60 text-trailmark-strong">
            <Keyboard className="mr-1 size-3.5" aria-hidden="true" />
            Typed instead of spoken
          </Badge>
        )}
        {graded?.englishLevel && <Badge variant="outline">English level {graded.englishLevel}</Badge>}
        {graded?.met !== undefined && <Badge variant="outline">{graded.met ? "Does the job" : "Not yet"}</Badge>}
        {graded?.needsListen && (
          <Badge variant="outline" className="border-destructive/50 text-destructive">
            Needs a listen
          </Badge>
        )}
        {response.reRecorded && <span className="font-mono text-[11px] text-muted-foreground">re-recorded once</span>}
      </div>

      {response.usedFallback ? (
        <p className="whitespace-pre-wrap rounded-md border bg-surface-sunken/30 px-3 py-2 leading-relaxed">{response.fallbackText?.trim() || "(empty)"}</p>
      ) : recordingId ? (
        <>
          {error && <p className="text-destructive">{error}</p>}
          {recording &&
            (recording.audioAvailable ? (
              <div>
                <p className="mb-1 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                  <Volume2 className="size-3.5" aria-hidden="true" />
                  Recording{recording.durationSec ? `, ${Math.round(recording.durationSec)} s` : ""}
                </p>
                <audio controls preload="none" src={`/api/admin/recordings/${recording.id}/audio`} className="w-full" />
              </div>
            ) : (
              <p className="text-muted-foreground">Recording deleted after 30 days. The text below is kept.</p>
            ))}
          {recording && (
            <div>
              <p className="font-mono text-[11px] text-muted-foreground">What they said</p>
              {recording.transcript ? (
                <p className="mt-1 whitespace-pre-wrap rounded-md border bg-surface-sunken/30 px-3 py-2 leading-relaxed">{recording.transcript}</p>
              ) : (
                <p className="mt-1 text-muted-foreground">
                  {recording.sttStatus === "pending" ? "Still being turned into text." : "We couldn't turn this recording into text. Play it to mark it."}
                </p>
              )}
            </div>
          )}
          {recording?.metrics && (
            <p className="font-mono text-xs text-muted-foreground">
              Approximate: {recording.metrics.wpm} words a minute · {recording.metrics.pauses} pauses of a second or more (longest {recording.metrics.longestPauseSec} s) · {recording.metrics.fillers} filler words. Advice only, never part of the mark.
            </p>
          )}
        </>
      ) : (
        <p className="text-muted-foreground">Nothing was recorded.</p>
      )}
    </div>
  );
}
