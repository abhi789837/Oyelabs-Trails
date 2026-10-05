import { useEffect, useState } from "react";
import { CircleCheck, LoaderCircle, RotateCcw } from "lucide-react";

import type { SpeakPractice } from "@shared/softSkills";
import type { TaskResponse } from "@shared/tasks";

import { api, ApiRequestError } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { SpeakRecorder } from "./SpeakTask";

type SpeakResponse = Extract<TaskResponse, { kind: "speak" }>;
type Feedback =
  | { status: "pending" }
  | { status: "unavailable"; message: string }
  | {
      status: "done";
      feedback: {
        met: boolean;
        englishLevel: string;
        reason: string;
        tip: string;
        mode: "spoken" | "typed";
        metrics: { wpm: number; pauses: number; longestPauseSec: number; fillers: number } | null;
      };
    };

const POLL_MS = 2000;
const POLL_LIMIT = 60;

/**
 * v4.4: speaking practice on a soft-skills topic: record (or type), then advice with an English
 * level, one reason and one tip. Advice only: it never decides whether the topic is complete.
 */
export function SpeakPracticeSection({ topicId, practice }: { topicId: string; practice: SpeakPractice }) {
  const [value, setValue] = useState<SpeakResponse | null>(null);
  const [submitted, setSubmitted] = useState<SpeakResponse | null>(null);
  const [result, setResult] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (!submitted) return;
    const controller = new AbortController();
    let polls = 0;
    const body = submitted.usedFallback ? { fallbackText: submitted.fallbackText } : { recordingId: submitted.recordingId };
    const ask = async (): Promise<void> => {
      try {
        const next = await api.post<Feedback>(`/api/topics/${topicId}/speak-feedback`, body, controller.signal);
        if (controller.signal.aborted) return;
        if (next.status === "pending" && polls < POLL_LIMIT) {
          polls += 1;
          setResult(next);
          window.setTimeout(() => void ask(), POLL_MS);
          return;
        }
        setResult(next.status === "pending" ? { status: "unavailable", message: "This is taking longer than usual. Try again in a minute." } : next);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiRequestError ? err.message : "Feedback couldn't be loaded. Try again.");
      }
    };
    setResult({ status: "pending" });
    void ask();
    return () => controller.abort();
  }, [submitted, topicId]);

  const reset = () => {
    setValue(null);
    setSubmitted(null);
    setResult(null);
    setError(null);
    setRound((n) => n + 1);
  };

  return (
    <div className="space-y-5">
      <Badge variant="outline">Speak</Badge>
      <SpeakRecorder
        key={round}
        task={practice}
        value={value}
        onChange={setValue}
        readOnly={Boolean(submitted)}
        idPrefix={`speak-practice-${topicId}`}
        target={{ topicId }}
        confirmTyped
        onSubmitted={(next) => setSubmitted(next)}
      />

      <div aria-live="polite">
        {result?.status === "pending" && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            {submitted?.usedFallback ? "Checking your answer…" : "Turning your speech into text, then checking it (about 10–20 seconds)…"}
          </p>
        )}
        {result?.status === "unavailable" && <p className="rounded-md border px-3 py-2 text-sm text-muted-foreground">{result.message}</p>}
        {error && <p className="rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive">{error}</p>}
        {result?.status === "done" && (
          <div className={result.feedback.met ? "rounded-md border border-summit/50 bg-summit/[0.06] px-4 py-3 text-sm" : "rounded-md border px-4 py-3 text-sm"}>
            <p className="flex flex-wrap items-center gap-2 font-medium">
              {result.feedback.met && <CircleCheck className="size-4 text-summit-strong" aria-hidden="true" />}
              {result.feedback.met ? "This does the job." : "Not yet."}
              <Badge variant="outline">English level {result.feedback.englishLevel}</Badge>
            </p>
            <p className="mt-2">{result.feedback.reason}</p>
            <p className="mt-1 text-muted-foreground">Tip: {result.feedback.tip}</p>
            {result.feedback.metrics && (
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                Approximate: {result.feedback.metrics.wpm} words a minute (100–170 is comfortable) · {result.feedback.metrics.pauses} long pauses · {result.feedback.metrics.fillers} filler words
              </p>
            )}
          </div>
        )}
      </div>

      {(result?.status === "done" || result?.status === "unavailable" || error) && (
        <Button variant="outline" onClick={reset}>
          <RotateCcw aria-hidden="true" />
          Try it again
        </Button>
      )}
      <p className="text-xs text-muted-foreground">Practice only: this doesn't affect completing the topic. Recordings are kept for up to 30 days and only admins can listen.</p>
    </div>
  );
}
