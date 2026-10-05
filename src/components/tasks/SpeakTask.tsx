import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CircleCheck, Keyboard, Mic, RotateCcw, Square, Users } from "lucide-react";
import { useReducedMotion } from "motion/react";

import type { LearnerTask, TaskResponse } from "@shared/tasks";

import { ApiRequestError } from "@/api/client";
import { RichText } from "@/components/content/RichText";
import { Button } from "@/components/ui/button";
import { editorScopeProps } from "@/features/proctor/editorScope";
import { cn } from "@/lib/utils";

import { clock, levelOf, micErrorMessage, pickRecordingMime, recordingAnnouncement, uploadRecording, type RecordingTarget } from "./speakRecorder";
import type { TaskComponentProps } from "./types";

type SpeakResponse = Extract<TaskResponse, { kind: "speak" }>;
type SpeakLearnerTask = Extract<LearnerTask, { kind: "speak" }>;

export const AUDIENCE_LABELS: Record<SpeakLearnerTask["audience"], string> = {
  team: "Your team",
  client: "A client",
  manager: "Your manager",
  interview: "An interviewer",
};

export interface SpeakTaskProps extends TaskComponentProps<"speak"> {
  /** Inside an assessment: the recording belongs to this item. */
  assessment?: { assessmentId: string; itemId: string };
}

/** A Speak item inside an assessment (or the admin preview, which has no upload target). */
export function SpeakTask({ task, value, onChange, readOnly, answer, idPrefix, assessment }: SpeakTaskProps) {
  return (
    <div className="space-y-5">
      <SpeakRecorder task={task} value={value} onChange={onChange} readOnly={readOnly} idPrefix={idPrefix} target={assessment ?? null} />
      {answer && (
        <div className="rounded-md border border-summit/40 bg-summit/[0.05] px-4 py-3 text-sm">
          <p className="font-semibold">What a strong answer does</p>
          <RichText text={answer.explanation} className="mt-1.5" />
        </div>
      )}
    </div>
  );
}

type Phase = "idle" | "prep" | "recording" | "review" | "uploading" | "saved" | "typing";

export interface SpeakRecorderProps {
  task: SpeakLearnerTask;
  value: SpeakResponse | null;
  onChange: (value: SpeakResponse) => void;
  readOnly?: boolean;
  idPrefix: string;
  /** Where the recording is uploaded. Null (an admin preview): the recorder works, nothing is sent. */
  target: RecordingTarget | null;
  /** Called after a recording is saved or a typed answer is confirmed (topic practice asks for feedback then). */
  onSubmitted?: (value: SpeakResponse) => void;
  /** Topic practice: the typed answer needs a confirm button, since nothing autosaves it. */
  confirmTyped?: boolean;
}

/**
 * The recorder: the prompt and who it is for, 20 s to prepare (skippable with "I'm ready"), then up
 * to `maxSec` of recording with a visible timer and a level meter. The learner can stop early, listen
 * back, and re-record once. "Type your answer instead" is always there, so nobody is stuck without a
 * microphone. The audio never comes back from the server: listening back uses the browser's copy.
 */
export function SpeakRecorder({ task, value, onChange, readOnly, idPrefix, target, onSubmitted, confirmTyped }: SpeakRecorderProps) {
  const reduceMotion = useReducedMotion();
  const liveId = useId();
  const typedSaved = Boolean(value?.usedFallback);
  const [phase, setPhase] = useState<Phase>(value?.usedFallback ? "typing" : value?.recordingId ? "saved" : "idle");
  const [prepLeft, setPrepLeft] = useState<number>(task.prepSec);
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [takes, setTakes] = useState(value?.reRecorded ? 2 : value?.recordingId ? 1 : 0);
  const [typed, setTyped] = useState(value?.fallbackText ?? "");

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const durationRef = useRef(0);

  const canReRecord = takes < 2;

  const cleanup = useCallback(() => {
    if (timerRef.current != null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);
  useEffect(() => () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
  }, [blobUrl]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    if (timerRef.current != null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError(micErrorMessage({ name: "NoMediaDevices" }));
      setPhase("idle");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (err) {
      setError(micErrorMessage(err));
      setPhase("idle");
      return;
    }
    streamRef.current = stream;
    const mimeType = pickRecordingMime(MediaRecorder.isTypeSupported?.bind(MediaRecorder));
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch (err) {
      cleanup();
      setError(micErrorMessage(err));
      setPhase("idle");
      return;
    }
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => {
      durationRef.current = (performance.now() - startedAtRef.current) / 1000;
      cleanup();
      const recorded = new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" });
      setBlob(recorded);
      setBlobUrl(URL.createObjectURL(recorded));
      setLevel(0);
      setPhase("review");
      setAnnounce("Recording stopped. Listen back, then use it or record again.");
    };
    recorder.onerror = () => {
      cleanup();
      setError("The recording stopped unexpectedly. Try again, or type your answer instead.");
      setPhase("idle");
    };
    recorderRef.current = recorder;

    // The level meter: a quiet bar is the first sign of a muted or wrong microphone.
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        audioCtxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const data = new Uint8Array(analyser.fftSize);
        const tick = () => {
          analyser.getByteTimeDomainData(data);
          setLevel(levelOf(data));
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      }
    } catch {
      // No meter is fine; the recording still works.
    }

    startedAtRef.current = performance.now();
    recorder.start(1000);
    setElapsed(0);
    setTakes((n) => n + 1);
    setPhase("recording");
    setAnnounce(`Recording. You have up to ${task.maxSec} seconds. Press Stop when you're done.`);
    timerRef.current = window.setInterval(() => {
      const secs = (performance.now() - startedAtRef.current) / 1000;
      setElapsed(secs);
      const said = recordingAnnouncement(secs, task.maxSec);
      if (said) setAnnounce(said);
      if (secs >= task.maxSec) stopRecording();
    }, 250);
  }, [cleanup, stopRecording, task.maxSec]);

  // The preparation countdown.
  useEffect(() => {
    if (phase !== "prep") return;
    const started = performance.now();
    setPrepLeft(task.prepSec);
    setAnnounce(`${task.prepSec} seconds to get ready. Recording starts when the time is up, or press I'm ready.`);
    const id = window.setInterval(() => {
      const left = Math.max(0, task.prepSec - Math.floor((performance.now() - started) / 1000));
      setPrepLeft(left);
      if (left === 5) setAnnounce("Five seconds.");
      if (left <= 0) {
        window.clearInterval(id);
        void startRecording();
      }
    }, 250);
    timerRef.current = id;
    return () => window.clearInterval(id);
  }, [phase, startRecording, task.prepSec]);

  const saveTake = async () => {
    if (!blob) return;
    const durationSec = Math.min(task.maxSec + 5, Math.round(durationRef.current * 10) / 10);
    const reRecorded = takes > 1;
    if (!target) {
      // Admin preview: nothing is uploaded.
      setPhase("saved");
      return;
    }
    setPhase("uploading");
    setError(null);
    try {
      const recordingId = await uploadRecording(blob, target, durationSec);
      const next: SpeakResponse = { kind: "speak", recordingId, durationSec, usedFallback: false, reRecorded };
      onChange(next);
      setPhase("saved");
      setAnnounce("Your recording is saved.");
      onSubmitted?.(next);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "The recording didn't upload. Try again. Your recording is kept.");
      setPhase("review");
    }
  };

  const reRecord = () => {
    if (!canReRecord) return;
    setBlob(null);
    setBlobUrl(null);
    setPhase("prep");
  };

  const switchToTyping = () => {
    cleanup();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    setPhase("typing");
    setError(null);
    onChange({ kind: "speak", usedFallback: true, fallbackText: typed, reRecorded: false });
  };

  const backToSpeaking = () => {
    setPhase(value?.recordingId && !value.usedFallback ? "saved" : "idle");
    onChange({ kind: "speak", usedFallback: false, reRecorded: takes > 1, ...(value?.recordingId ? { recordingId: value.recordingId, durationSec: value.durationSec } : {}) });
  };

  const remaining = Math.max(0, task.maxSec - elapsed);
  const meterWidth = `${Math.round(level * 100)}%`;

  return (
    <div className="space-y-5">
      <div className="rounded-md border px-4 py-3">
        <p className="font-medium">{task.title}</p>
        <p className="mt-1 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <Users className="size-3.5" aria-hidden="true" />
          Speaking to: {AUDIENCE_LABELS[task.audience]} · up to {task.maxSec} seconds
        </p>
        <RichText text={task.prompt} className="mt-2" />
        <p className="mt-3 text-sm font-medium">A good answer covers</p>
        <ul className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
          {task.lookFor.map((line) => (
            <li key={line} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-summit-strong" aria-hidden="true" />
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">We listen for whether you get the job done and are easy to follow. Your accent is never marked.</p>
      </div>

      <p id={liveId} aria-live="polite" className="sr-only">
        {announce}
      </p>

      {error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/6 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {readOnly ? (
        <ReadOnlySummary value={value} />
      ) : phase === "typing" ? (
        <div {...editorScopeProps()} className="space-y-2">
          <p className="rounded-md border border-primary/30 bg-primary/[0.06] px-3 py-2 text-sm">
            <Keyboard className="mr-1.5 inline size-4 align-text-bottom text-primary-strong" aria-hidden="true" />
            {task.writtenFallback}
          </p>
          <label htmlFor={`${idPrefix}-typed`} className="text-sm font-medium">
            Your answer, typed
          </label>
          <textarea
            id={`${idPrefix}-typed`}
            value={typed}
            rows={7}
            onChange={(event) => {
              setTyped(event.target.value);
              onChange({ kind: "speak", usedFallback: true, fallbackText: event.target.value, reRecorded: false });
            }}
            className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm leading-relaxed"
          />
          <div className="flex flex-wrap gap-2">
            {confirmTyped && (
              <Button disabled={!typed.trim()} onClick={() => onSubmitted?.({ kind: "speak", usedFallback: true, fallbackText: typed, reRecorded: false })}>
                Get feedback
              </Button>
            )}
            <Button variant="ghost" onClick={backToSpeaking}>
              <Mic aria-hidden="true" />
              Record instead
            </Button>
          </div>
          {typedSaved && !confirmTyped && <p className="text-xs text-muted-foreground">Your typed answer is saved as you write.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {phase === "idle" && (
            <Button onClick={() => setPhase("prep")}>
              <Mic aria-hidden="true" />
              Start: {task.prepSec} seconds to get ready
            </Button>
          )}

          {phase === "prep" && (
            <div className="flex flex-wrap items-center gap-3 rounded-md border border-trailmark/50 bg-trailmark/[0.06] px-4 py-3">
              <p className="text-sm">
                Get ready. Recording starts in <span className="font-mono tabular font-semibold" aria-hidden="true">{prepLeft}</span>
                <span className="sr-only">{prepLeft} seconds</span>
              </p>
              <Button size="sm" onClick={() => void startRecording()}>
                I'm ready
              </Button>
            </div>
          )}

          {phase === "recording" && (
            <div className="space-y-2 rounded-md border border-destructive/40 px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className={cn("size-2.5 rounded-full bg-destructive", !reduceMotion && "animate-pulse")} aria-hidden="true" />
                <p className="text-sm font-medium">Recording</p>
                <p className="font-mono text-sm tabular" aria-label={`${Math.round(elapsed)} seconds recorded, ${Math.round(remaining)} left`}>
                  {clock(elapsed)} / {clock(task.maxSec)}
                </p>
                <Button size="sm" variant="outline" className="ml-auto" onClick={stopRecording}>
                  <Square aria-hidden="true" />
                  Stop
                </Button>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-sunken" role="meter" aria-label="Microphone level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level * 100)}>
                <div className={cn("h-full bg-summit", !reduceMotion && "transition-[width] duration-100")} style={{ width: meterWidth }} />
              </div>
            </div>
          )}

          {(phase === "review" || phase === "uploading") && (
            <div className="space-y-3 rounded-md border px-4 py-3">
              <p className="text-sm font-medium">Listen back{durationRef.current ? ` (${clock(durationRef.current)})` : ""}</p>
              {blobUrl && <audio controls src={blobUrl} className="w-full" />}
              <div className="flex flex-wrap gap-2">
                <Button loading={phase === "uploading"} onClick={() => void saveTake()}>
                  Use this recording
                </Button>
                {canReRecord ? (
                  <Button variant="outline" disabled={phase === "uploading"} onClick={reRecord}>
                    <RotateCcw aria-hidden="true" />
                    Record again (once)
                  </Button>
                ) : (
                  <span className="self-center text-xs text-muted-foreground">You've used your one re-record.</span>
                )}
              </div>
            </div>
          )}

          {phase === "saved" && (
            <div className="space-y-2 rounded-md border border-summit/50 bg-summit/[0.06] px-4 py-3 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <CircleCheck className="size-4 text-summit-strong" aria-hidden="true" />
                Your recording is saved{value?.durationSec ? ` (${clock(value.durationSec)})` : ""}.
              </p>
              {blobUrl && <audio controls src={blobUrl} className="w-full" />}
              {canReRecord && (
                <Button size="sm" variant="outline" onClick={reRecord}>
                  <RotateCcw aria-hidden="true" />
                  Record again (once)
                </Button>
              )}
            </div>
          )}

          {phase !== "recording" && phase !== "uploading" && (
            <button type="button" onClick={switchToTyping} className="text-sm text-primary-strong underline underline-offset-2">
              Type your answer instead
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ReadOnlySummary({ value }: { value: SpeakResponse | null }) {
  if (!value || (!value.recordingId && !value.usedFallback)) return <p className="text-sm text-muted-foreground">No answer.</p>;
  if (value.usedFallback) return <p className="whitespace-pre-wrap rounded-md border bg-surface-sunken/30 px-3 py-2 text-sm">{value.fallbackText || "(empty)"}</p>;
  return <p className="text-sm text-muted-foreground">Recording saved{value.durationSec ? ` (${clock(value.durationSec)})` : ""}.</p>;
}
