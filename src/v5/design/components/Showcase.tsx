import { Mountain, X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useCallback, useEffect, useRef, type ReactNode } from "react";

import { Logo as BrandLogo } from "@/components/brand/Logo";
import { Mark } from "@/components/brand/Mark";

import { cn } from "../cn";

import { usePrefersReducedMotion } from "../hooks";
import { clampCelebrationMs, springs, transitions } from "../motion";

// ---------------------------------------------------------------------------
// Logo
// ---------------------------------------------------------------------------

/**
 * The Oyelearn logo, sized by `className` (e.g. `h-7`): the brand kit v1.0 files through
 * src/components/brand. `horizontal` is the primary lockup, `stacked` the endorsed one. Both theme
 * files render and CSS shows the one for the nearest theme, so /design's side-by-side previews work.
 */
export function Logo({ variant = "horizontal", className }: { variant?: "horizontal" | "mark" | "stacked"; className?: string }) {
  if (variant === "mark") {
    return (
      <span className={cn("inline-flex", className)}>
        <Mark />
      </span>
    );
  }
  return <BrandLogo variant={variant === "stacked" ? "endorsed" : "primary"} className={className} />;
}

// ---------------------------------------------------------------------------
// CertificatePreview
// ---------------------------------------------------------------------------

/** The sample the server drew (scripts/brand/certificate-sample.ts): 1754 × 1240, like the verify page's preview. */
export const CERTIFICATE_SAMPLE_SRC = "/brand/certificate/certificate-sample.png?v=1";

export interface CertificatePreviewProps {
  /** A certificate picture from the server (`/api/v5/certificates/:id/preview.png` or `file.png`). Defaults to the sample. */
  src?: string;
  alt?: string;
  className?: string;
}

/**
 * The certificate as learners get it: the server's own drawing of the brand kit's A4 template
 * (server/src/v5/certificates), never a re-creation in HTML. Always on white, like the PDF.
 */
export function CertificatePreview({ src = CERTIFICATE_SAMPLE_SRC, alt = "Sample certificate: Rahul Mehta has completed the path Backend foundations, 5 October 2026, issued by Oyelabs.", className }: CertificatePreviewProps) {
  return (
    <figure className={cn("overflow-hidden rounded-control border border-line-1 bg-white shadow-e2", className)}>
      <img src={src} alt={alt} width={1754} height={1240} loading="lazy" decoding="async" className="block h-auto w-full" />
    </figure>
  );
}

// ---------------------------------------------------------------------------
// Celebration
// ---------------------------------------------------------------------------

export interface CelebrationProps {
  open: boolean;
  onDone: () => void;
  title: string;
  detail?: ReactNode;
  icon?: ReactNode;
  /** Replaces the round icon badge entirely (the weekly summit's animated ring). */
  badge?: ReactNode;
  /** Capped at 2000 ms. */
  durationMs?: number;
  confetti?: boolean;
}

/**
 * A short moment for a real win (a lesson, a level, a certificate). At most 2 s, skippable with
 * the button, Escape or a click, and static under reduced motion (no confetti, no movement).
 * canvas-confetti loads only when a celebration actually runs.
 */
export function Celebration({ open, onDone, title, detail, icon, badge, durationMs = 1800, confetti = true }: CelebrationProps) {
  const reduce = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const done = useCallback(() => onDone(), [onDone]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(done, clampCelebrationMs(durationMs));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") done();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, durationMs, done]);

  useEffect(() => {
    if (!open || reduce || !confetti) return;
    let cancelled = false;
    let reset: (() => void) | undefined;
    void import("canvas-confetti").then(({ default: confettiLib }) => {
      if (cancelled || !canvasRef.current) return;
      const fire = confettiLib.create(canvasRef.current, { resize: true, useWorker: true, disableForReducedMotion: true });
      reset = () => fire.reset();
      const colors = ["#2067D3", "#5F93E3", "#F59E0B", "#FBBF24", "#FFFFFF"]; // Blue leads, amber celebrates (brand kit p6).
      void fire({ particleCount: 80, spread: 70, startVelocity: 38, origin: { y: 0.6 }, ticks: 160, colors, scalar: 0.9 });
    });
    return () => {
      cancelled = true;
      reset?.();
    };
  }, [open, reduce, confetti]);

  return (
    <AnimatePresence>
      {open ? (
        <m.div
          className="fixed inset-0 z-[60] grid place-items-center bg-scrim/30 p-4"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: transitions.exit }}
          onClick={done}
          role="status"
          aria-live="polite"
        >
          {!reduce && confetti ? <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 size-full" aria-hidden="true" /> : null}
          <m.div
            className="relative flex max-w-sm flex-col items-center rounded-sheet border border-line-1 bg-surface-3 px-8 py-7 text-center shadow-e3"
            initial={reduce ? false : { scale: 0.85, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={springs.gentle}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Amber celebrates (brand kit p6): a win's badge is on the amber tint. */}
            {badge ? (
              <div className="mb-3" aria-hidden="true">
                {badge}
              </div>
            ) : (
              <div className="mb-3 grid size-14 place-items-center rounded-full bg-progress-soft text-progress-fg [&_svg]:size-7" aria-hidden="true">
                {icon ?? <Mountain />}
              </div>
            )}
            <p className="font-display text-h3 font-semibold text-fg-1">{title}</p>
            {detail ? <p className="mt-1 text-small text-fg-2">{detail}</p> : null}
            <button type="button" onClick={done} className="mt-4 inline-flex min-h-8 items-center gap-1 rounded-control px-3 text-small font-medium text-fg-2 hover:bg-sunken hover:text-fg-1">
              <X className="size-3.5" aria-hidden="true" /> Skip
            </button>
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
