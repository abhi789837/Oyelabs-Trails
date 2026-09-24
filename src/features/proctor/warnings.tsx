import { useEffect, useMemo, useState, type RefObject } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, useReducedMotion } from "motion/react";
import { Maximize, ShieldAlert, TriangleAlert, Video, VideoOff, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { HARD_LIMIT, type ProctorState } from "./types";
import type { HardWarning, SoftWarning } from "./useProctor";

/**
 * Everything the learner sees from the proctor (§10.3).
 *
 * The tone throughout is "here is what was observed", not "you cheated". Every signal behind these
 * components is probabilistic or circumstantial, a human reviews the result, and copy that implies
 * otherwise would be both unfair and untrue (§10.7).
 *
 * The warning tone is generated with the Web Audio API rather than shipped as an audio file, so
 * there is no asset to fetch, cache or fail at the worst possible moment.
 */

// ---------------------------------------------------------------------------
// Tones
// ---------------------------------------------------------------------------

let sharedContext: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  sharedContext ??= new Ctor();
  // Autoplay policy suspends a context created before any gesture; the pre-flight sound check is
  // a click, so the first resume lands there and every later warning can just play.
  if (sharedContext.state === "suspended") void sharedContext.resume();
  return sharedContext;
}

function beep(context: AudioContext, frequency: number, startAt: number, seconds: number): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startAt);
  // Ramped rather than gated: a square-edged envelope clicks, which sounds like a fault.
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.22, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + seconds);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + seconds + 0.05);
}

/** §10.3: two beeps, 880 Hz then 660 Hz, a quarter-second each. */
export function playWarningTone(): void {
  const context = audio();
  if (!context) return;
  const start = context.currentTime + 0.02;
  beep(context, 880, start, 0.25);
  beep(context, 660, start + 0.25, 0.25);
}

/** The soft warning's "short chime": one note, quieter and out of the way. */
export function playSoftChime(): void {
  const context = audio();
  if (!context) return;
  beep(context, 990, context.currentTime + 0.02, 0.12);
}

// ---------------------------------------------------------------------------
// Hard warning
// ---------------------------------------------------------------------------

interface HardWarningModalProps {
  warning: HardWarning;
  /** The server's limit once it has replied; `HARD_LIMIT` before that. */
  limit?: number;
  /** Blocks the questions until fullscreen is back (§10.2). */
  needsFullscreen?: boolean;
  onAcknowledge: () => void;
  onReenterFullscreen?: () => void;
}

export function HardWarningModal({
  warning,
  limit = HARD_LIMIT,
  needsFullscreen = false,
  onAcknowledge,
  onReenterFullscreen,
}: HardWarningModalProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    playWarningTone();
  }, [warning.id]);

  const remaining = Math.max(0, limit - warning.count);
  const consequence = warning.terminal
    ? "That was the last warning, so the assessment has ended. Everything you answered has been saved and will still be evaluated."
    : remaining === 1
      ? "One more warning ends the assessment."
      : `${remaining} more warnings end the assessment.`;

  return (
    <Dialog.Root open modal>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-70 bg-ink/70 backdrop-blur-xs" />
        <Dialog.Content
          className="fixed inset-0 z-70 flex items-center justify-center p-4 outline-hidden"
          // A warning you can dismiss with Escape or a stray click is not a warning.
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={transition.base}
            className="w-full max-w-lg rounded-lg border border-destructive/40 bg-background p-6 shadow-2xl sm:p-8"
          >
            <span
              className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-destructive/12 text-destructive"
              aria-hidden="true"
            >
              <ShieldAlert className="h-5 w-5" />
            </span>
            <Dialog.Title className="font-display text-xl font-semibold">
              {warning.terminal ? "Assessment ended" : `Warning ${warning.count} of ${limit}`}
            </Dialog.Title>
            <Dialog.Description className="mt-2 max-w-prose text-base text-foreground">
              {capitalise(warning.reason)}. {consequence}
            </Dialog.Description>
            <p className="mt-4 max-w-prose text-sm text-muted-foreground">
              A person reviews every warning before it affects anything. If this was a mistake — a
              reflection, someone walking past, a flaky camera — say so when you get your result.
            </p>

            <div className="mt-7 flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
              {needsFullscreen && onReenterFullscreen ? (
                <Button
                  autoFocus
                  onClick={() => {
                    onReenterFullscreen();
                    onAcknowledge();
                  }}
                >
                  <Maximize aria-hidden="true" />
                  Return to fullscreen
                </Button>
              ) : (
                <Button autoFocus onClick={onAcknowledge}>
                  I understand
                </Button>
              )}
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ---------------------------------------------------------------------------
// Soft warnings
// ---------------------------------------------------------------------------

interface SoftWarningToastsProps {
  warnings: SoftWarning[];
  onDismiss: (id: number) => void;
}

/** Corner toasts with a short chime and no count, because soft warnings do not count (§10.3). */
export function SoftWarningToasts({ warnings, onDismiss }: SoftWarningToastsProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-3 bottom-3 z-60 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5"
    >
      {warnings.map((warning) => (
        <SoftWarningToast key={warning.id} warning={warning} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function SoftWarningToast({ warning, onDismiss }: { warning: SoftWarning; onDismiss: (id: number) => void }) {
  useEffect(() => {
    playSoftChime();
  }, [warning.id]);

  return (
    <div
      role="status"
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border border-trailmark/40 bg-popover px-4 py-3 text-popover-foreground shadow-lg animate-in fade-in-0 slide-in-from-bottom-2 sm:w-96"
    >
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-trailmark text-trailmark-foreground"
        aria-hidden="true"
      >
        <TriangleAlert className="h-4 w-4" />
      </span>
      <p className="min-w-0 flex-1 text-sm">{capitalise(warning.reason)}.</p>
      <button
        type="button"
        onClick={() => onDismiss(warning.id)}
        className="rounded-sm p-1 opacity-70 hover:opacity-100"
        aria-label="Dismiss this notice"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status strip
// ---------------------------------------------------------------------------

interface StatusStripProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  state: ProctorState;
  limit?: number;
  className?: string;
}

/**
 * The persistent strip: the mirrored thumbnail, "Monitoring on", and the hard-warning count.
 *
 * Mirrored because an un-mirrored preview reads as someone else's camera — people expect to see
 * themselves the way a mirror shows them, and a preview that moves the wrong way is distracting
 * for an hour-long test.
 */
export function StatusStrip({ videoRef, state, limit = HARD_LIMIT, className }: StatusStripProps) {
  const reduceMotion = useReducedMotion();
  const live = state.cameraLive;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md border bg-surface px-3 py-2",
        !live && "border-destructive/50",
        className,
      )}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        aria-label="Your camera preview"
        className="h-12 w-16 shrink-0 scale-x-[-1] rounded-sm bg-editor object-cover"
      />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <span
            className={cn(
              "inline-block h-2 w-2 rounded-full",
              live ? "bg-summit" : "bg-destructive",
              live && !reduceMotion && "animate-pulse",
            )}
            aria-hidden="true"
          />
          {live ? "Monitoring on" : "Camera not visible"}
        </p>
        <p className="mt-0.5 flex items-center gap-1 font-mono text-xs text-muted-foreground">
          {live ? <Video className="h-3 w-3" aria-hidden="true" /> : <VideoOff className="h-3 w-3" aria-hidden="true" />}
          <span className="tabular">
            {state.hardWarnings} of {limit} warnings
          </span>
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Watermark
// ---------------------------------------------------------------------------

interface WatermarkProps {
  name: string;
  username: string;
  assessmentId: string;
  className?: string;
}

/**
 * A faint repeating diagonal stamp over the question area (§10.3).
 *
 * It cannot stop a photograph, and nothing here pretends it can. What it does is make any photo
 * that leaves this room traceable to one person and one attempt, which is the actual deterrent.
 * Built from real text rather than a background image so it picks up the theme's colour and
 * shrinks with the page instead of tiling at a fixed size.
 */
export function Watermark({ name, username, assessmentId, className }: WatermarkProps) {
  const [minute, setMinute] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setMinute(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const label = useMemo(() => {
    const time = new Date(minute).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
    return `${name} @${username} — ${assessmentId} — ${time}`;
  }, [name, username, assessmentId, minute]);

  const rows = useMemo(() => Array.from({ length: 16 }, (_, index) => index), []);

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 select-none overflow-hidden", className)}
    >
      <div className="absolute left-1/2 top-1/2 w-[190%] -translate-x-1/2 -translate-y-1/2 rotate-[-24deg] space-y-10">
        {rows.map((row) => (
          <p
            key={row}
            className="whitespace-nowrap font-mono text-[11px] tracking-wide text-foreground/5.5"
          >
            {`${label} `.repeat(6)}
          </p>
        ))}
      </div>
    </div>
  );
}
