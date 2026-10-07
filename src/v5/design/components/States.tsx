import { CloudOff, RotateCw } from "lucide-react";
import type { ReactNode } from "react";

import { RingDevice } from "@/components/brand/RingDevice";
import { cn } from "../cn";

import { Button } from "./Button";

// ---------------------------------------------------------------------------
// ContourBackground — now the brand's ring device
// ---------------------------------------------------------------------------

/** Where the device sits, by seed: always large and partly off the edge, never rotated. */
const DEVICE_SPOTS = [
  "-right-[18%] -top-[30%] w-[70%]",
  "-bottom-[35%] -left-[15%] w-[65%]",
  "-right-[12%] -bottom-[40%] w-[60%]",
] as const;

/**
 * The large, faint ring device behind a hero or an empty state (rebrand Phase 4; it replaced the
 * trail's topographic contours, and keeps their name so callers didn't change). The mark's own
 * rings in Oyelabs Blue (Sky in dark) at 8% opacity; a caller's opacity class fades it further.
 * Decorative; `seed` picks one of a few placements.
 */
export function ContourBackground({ seed = 3, className }: { seed?: number; className?: string }) {
  return (
    <span className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true" data-testid="ring-device-bg">
      <RingDevice className={cn("absolute aspect-square max-w-[28rem] text-brand opacity-[0.08]", DEVICE_SPOTS[Math.abs(Math.round(seed)) % DEVICE_SPOTS.length])} />
    </span>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  /** What this place is for and how to fill it. One or two short sentences. */
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** The title's heading level. 3 by default (inside a section); 2 when it sits straight under the page's h1. */
  headingLevel?: 2 | 3;
}

export function EmptyState({ icon, title, body, action, className, headingLevel = 3 }: EmptyStateProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className={cn("relative isolate flex flex-col items-center overflow-hidden rounded-card border border-dashed border-line-1 px-6 py-12 text-center", className)}>
      <ContourBackground className="-z-10" />
      {icon ? <div className="mb-3 grid size-12 place-items-center rounded-full bg-brand-soft text-brand-fg [&_svg]:size-6" aria-hidden="true">{icon}</div> : null}
      <Heading className="font-display text-h4 font-semibold text-fg-1">{title}</Heading>
      {body ? <p className="mt-1 max-w-[46ch] text-small text-fg-2">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ErrorState
// ---------------------------------------------------------------------------

export interface ErrorStateProps {
  title?: string;
  /** Plain words. What happened, and that their work is safe if it is. */
  body?: ReactNode;
  onRetry?: () => void;
  retrying?: boolean;
  /** Raw detail for staff (an error code), behind "Show details". */
  details?: string;
  className?: string;
  /** The title's heading level, as on EmptyState. */
  headingLevel?: 2 | 3;
}

/** A friendly failure with one way forward. Never blames the reader; never shows a code up front. */
export function ErrorState({
  title = "We couldn't load this",
  body = "It's probably a short network hiccup. Your progress is saved.",
  onRetry,
  retrying,
  details,
  className,
  headingLevel = 3,
}: ErrorStateProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <div role="alert" className={cn("flex flex-col items-center rounded-card border border-line-1 bg-surface-1 px-6 py-10 text-center", className)}>
      <div className="mb-3 grid size-12 place-items-center rounded-full bg-danger-soft text-danger-fg" aria-hidden="true">
        <CloudOff className="size-6" />
      </div>
      <Heading className="font-display text-h4 font-semibold text-fg-1">{title}</Heading>
      <p className="mt-1 max-w-[46ch] text-small text-fg-2">{body}</p>
      {onRetry ? (
        <Button className="mt-5" variant="primary" onClick={onRetry} loading={retrying}>
          {retrying ? null : <RotateCw aria-hidden="true" />}
          Try again
        </Button>
      ) : null}
      {details ? (
        <details className="mt-4 text-left text-caption text-fg-2">
          <summary className="cursor-pointer select-none">Show details</summary>
          <pre className="mt-2 whitespace-pre-wrap font-mono">{details}</pre>
        </details>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("v5-skeleton rounded-md", className)} aria-hidden="true" />;
}

export type SkeletonVariant = "card" | "list" | "lesson" | "table" | "stat-row" | "article";

/**
 * Loading placeholders shaped like the layout that replaces them, so nothing jumps.
 * Show only after ~300 ms of waiting; under that, show nothing (copy guide: waiting).
 */
export function SkeletonLayout({ variant, rows = 4, label = "Loading", className }: { variant: SkeletonVariant; rows?: number; label?: string; className?: string }) {
  return (
    <div role="status" aria-label={label} className={cn("w-full", className)}>
      {variant === "card" ? (
        <div className="rounded-card border border-line-1 bg-surface-1 p-(--v5-card-pad)">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-4/5" />
          <Skeleton className="mt-5 h-(--v5-control-h) w-32" />
        </div>
      ) : null}
      {variant === "stat-row" ? (
        <div className="grid grid-cols-2 gap-(--v5-gap) md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="rounded-card border border-line-1 bg-surface-1 p-(--v5-card-pad)">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-2 h-8 w-16" />
            </div>
          ))}
        </div>
      ) : null}
      {variant === "list" ? (
        <ul className="flex flex-col gap-2">
          {Array.from({ length: rows }, (_, i) => (
            <li key={i} className="flex h-(--v5-row-h) items-center gap-3 rounded-control border border-line-1 bg-surface-1 px-3">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-14" />
            </li>
          ))}
        </ul>
      ) : null}
      {variant === "table" ? (
        <div className="overflow-hidden rounded-card border border-line-1 bg-surface-1">
          <div className="flex h-10 items-center gap-4 border-b border-line-1 bg-sunken px-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-3 flex-1" />
            ))}
          </div>
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex h-(--v5-row-h) items-center gap-4 border-b border-line-1 px-3 last:border-0">
              {Array.from({ length: 4 }, (_, j) => (
                <Skeleton key={j} className="h-3.5 flex-1" />
              ))}
            </div>
          ))}
        </div>
      ) : null}
      {variant === "lesson" ? (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-9 flex-1 rounded-full" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <Skeleton className="aspect-video w-full rounded-card" />
            <div className="hidden flex-col gap-2 lg:flex">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-control" />
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {variant === "article" ? (
        <div className="max-w-article">
          <Skeleton className="h-8 w-2/3" />
          {Array.from({ length: rows }, (_, i) => (
            <Skeleton key={i} className={cn("mt-3 h-4", i % 3 === 2 ? "w-3/5" : "w-full")} />
          ))}
        </div>
      ) : null}
      <span className="sr-only">{label}</span>
    </div>
  );
}
