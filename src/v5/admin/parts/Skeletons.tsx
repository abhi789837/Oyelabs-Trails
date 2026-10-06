import type { ReactNode } from "react";

import { cn } from "@/v5/design/cn";
import { Skeleton } from "@/v5/design/components/States";

/**
 * Loading placeholders shaped like each admin screen, so nothing jumps when the data lands
 * (Phase 8.3). Each one is a single `role="status"` with a plain label; the shapes are hidden from
 * screen readers. Pages show them only after ~300 ms of waiting (`useSlow`).
 */

function Frame({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div role="status" aria-label={label} className={cn("w-full", className)}>
      <div aria-hidden="true">{children}</div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Inbox: two groups, each a heading with a count and rows of "text + button". */
export function InboxSkeleton() {
  return (
    <Frame label="Loading the inbox" className="flex flex-col gap-6">
      {[3, 2].map((rows, g) => (
        <div key={g} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded-full" />
            <Skeleton className="h-5 w-56 max-w-[60%]" />
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>
          <div className="flex flex-col divide-y divide-line-1 overflow-hidden rounded-card border border-line-1 bg-surface-1">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3.5 w-1/2" />
                </div>
                <Skeleton className="h-8 w-28 rounded-control" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </Frame>
  );
}

function Tiles({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-(--v5-gap) sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-card border border-line-1 bg-surface-1 p-(--v5-card-pad)">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-2 h-8 w-16" />
          <Skeleton className="mt-2 h-3.5 w-32" />
        </div>
      ))}
    </div>
  );
}

function ChartCard() {
  return (
    <div className="rounded-card border border-line-1 bg-surface-1 p-(--v5-card-pad)">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="mt-2 h-3.5 w-64 max-w-full" />
      <Skeleton className="mt-4 h-[220px] w-full" />
    </div>
  );
}

/** Overview: four tiles, then the cohort chart beside the departments table. */
export function OverviewSkeleton() {
  return (
    <Frame label="Loading the overview" className="flex flex-col gap-(--v5-gap)">
      <Tiles />
      <div className="grid gap-(--v5-gap) lg:grid-cols-2">
        <ChartCard />
        <div className="rounded-card border border-line-1 bg-surface-1 p-(--v5-card-pad)">
          <Skeleton className="h-5 w-48" />
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="mt-3 flex gap-3">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

/** Reports: four tiles and the detail cards in two columns. */
export function ReportsSkeleton() {
  return (
    <Frame label="Loading the report" className="flex flex-col gap-(--v5-gap)">
      <Tiles />
      <div className="grid gap-(--v5-gap) lg:grid-cols-2">
        <ChartCard />
        <ChartCard />
      </div>
    </Frame>
  );
}

/** Library: the course card grid. */
export function LibrarySkeleton() {
  return (
    <Frame label="Loading the library">
      <div className="grid grid-cols-1 gap-(--v5-gap) md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-card border border-line-1 bg-surface-1 p-(--v5-card-pad)">
            <div className="flex items-start gap-2">
              <Skeleton className="h-5 flex-1" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
            <div className="mt-2 flex gap-2">
              <Skeleton className="h-8 w-20 rounded-control" />
              <Skeleton className="h-8 w-36 rounded-control" />
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/** The course editor: the lesson list beside the title row, toolbar and document. */
export function EditorSkeleton() {
  return (
    <Frame label="Loading the course">
      <Skeleton className="h-8 w-64 max-w-full" />
      <Skeleton className="mt-2 h-4 w-48" />
      <div className="mt-5 grid gap-(--v5-gap) lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-20" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-control" />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Skeleton className="h-9 flex-1 rounded-control" />
            <Skeleton className="h-9 w-28 rounded-control" />
          </div>
          <Skeleton className="h-10 w-full rounded-control" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      </div>
    </Frame>
  );
}

/** A list of cards (announcements, problem reports). */
export function CardListSkeleton({ rows = 3, label }: { rows?: number; label: string }) {
  return (
    <Frame label={label} className="flex flex-col gap-2">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-card border border-line-1 bg-surface-1 p-(--v5-card-pad) sm:flex-row sm:items-start">
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-24 rounded-control" />
        </div>
      ))}
    </Frame>
  );
}
