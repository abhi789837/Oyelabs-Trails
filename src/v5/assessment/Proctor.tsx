import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Check, Maximize, Monitor, Video, VideoOff, X } from "lucide-react";
import { useEffect } from "react";

import { playSoftChime, playWarningTone } from "@/features/proctor/warnings";
import type { HardWarning, ProctorController, SoftWarning } from "@/features/proctor/useProctor";
import { Button } from "@/v5/design/components/Button";
import { cn } from "@/v5/design/cn";

import { proctorWords, uniqueNotices, warningConsequence, warningsLine } from "./navigator";

/**
 * Proctoring, the calm way. The same `useProctor` controller as the older design; only the words
 * and the look are new: "Camera on", "Stay on this tab", "Full screen on". Nothing here says
 * "detected", "violation" or "suspicious": every signal is a guess, and a person reviews it.
 */

const ICONS = { camera: Video, tab: Monitor, fullscreen: Maximize } as const;

export function ProctorBar({ proctor, className }: { proctor: ProctorController; className?: string }) {
  const words = proctorWords(proctor.state);
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      {/* The camera preview must stay mounted: the face check reads frames from this element. */}
      <video
        ref={proctor.videoRef}
        muted
        playsInline
        autoPlay
        aria-label="Your camera preview"
        className="h-9 w-12 shrink-0 scale-x-[-1] rounded-md bg-sunken object-cover"
      />
      <ul className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-caption" aria-label="Test status">
        {words.map((word) => {
          const Icon = word.id === "camera" && !word.ok ? VideoOff : ICONS[word.id];
          return (
            <li key={word.id} className={cn("inline-flex items-center gap-1", word.ok ? "text-fg-2" : "font-medium text-warning-fg")}>
              <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              {word.text}
            </li>
          );
        })}
        <li className="inline-flex items-center gap-1 text-fg-2">
          <Check className="size-3.5 shrink-0" aria-hidden="true" />
          {warningsLine(proctor.state.hardWarnings, proctor.hardLimit)}
        </li>
      </ul>
    </div>
  );
}

/**
 * A hard warning. It interrupts, and it has one way out (no Escape, no outside click), but it reads
 * as a pause, not a telling-off. The clock is paused while it is open (the server agrees).
 */
export function CalmWarning({ warning, limit, needsFullscreen, onAcknowledge, onReenterFullscreen }: { warning: HardWarning; limit: number; needsFullscreen: boolean; onAcknowledge: () => void; onReenterFullscreen: () => void }) {
  useEffect(() => {
    playWarningTone();
  }, [warning.id]);
  const reason = warning.reason.charAt(0).toUpperCase() + warning.reason.slice(1);
  return (
    <AlertDialog.Root open>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="v5-scrim fixed inset-0 z-50 bg-scrim/50" />
        <AlertDialog.Content
          className="v5-dialog fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-sheet border border-line-1 bg-surface-3 p-6 text-fg-1 shadow-e3"
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <AlertDialog.Title className="font-display text-h3 font-semibold">{warning.terminal ? "The test has ended" : "Let's pause for a moment"}</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-body text-fg-1">
            {reason}. {warningConsequence(warning.count, limit, warning.terminal)}
          </AlertDialog.Description>
          <p className="mt-3 text-small text-fg-2">
            {warning.terminal ? null : "Your time is paused while this is open. "}A person looks at every warning before it counts. If it was a mistake, like a reflection or someone walking past, say so when you get your results.
          </p>
          <div className="mt-6 flex justify-end">
            {needsFullscreen ? (
              <Button
                variant="primary"
                autoFocus
                onClick={() => {
                  onReenterFullscreen();
                  onAcknowledge();
                }}
              >
                <Maximize aria-hidden="true" />
                Go back to full screen
              </Button>
            ) : (
              <Button variant="primary" autoFocus onClick={onAcknowledge}>
                {warning.terminal ? "OK" : "I understand, carry on"}
              </Button>
            )}
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

/** Soft notices: a quiet chime and a small note in the corner. They don't count towards anything. */
export function SoftNotices({ warnings, onDismiss }: { warnings: SoftWarning[]; onDismiss: (id: number) => void }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-3 bottom-3 z-40 flex flex-col items-end gap-2 sm:inset-x-auto sm:bottom-5 sm:right-5">
      {uniqueNotices(warnings).map(({ warning, ids }) => (
        <SoftNotice key={warning.id} warning={warning} onDismiss={() => ids.forEach(onDismiss)} />
      ))}
    </div>
  );
}

function SoftNotice({ warning, onDismiss }: { warning: SoftWarning; onDismiss: () => void }) {
  useEffect(() => {
    playSoftChime();
  }, [warning.id]);
  return (
    <div role="status" className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border border-line-1 bg-surface-3 px-4 py-3 text-small text-fg-1 shadow-e2 sm:w-96">
      <p className="min-w-0 flex-1">
        Just so you know: {warning.reason}. This doesn't count as a warning.
      </p>
      <button type="button" onClick={onDismiss} className="grid size-6 shrink-0 place-items-center rounded-control text-fg-2 hover:bg-sunken hover:text-fg-1" aria-label="Close this note">
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
