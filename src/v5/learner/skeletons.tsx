import type { ReactNode } from "react";

import { Skeleton } from "@/v5/design/components/States";

/**
 * Phase 8: loading shapes for the learner screens, each shaped like the layout that replaces it so
 * nothing jumps when the data lands. Built from the design system's `Skeleton` bone (its shimmer is
 * off under reduced motion). Shown only after ~300 ms of waiting (`useDelayed`), per the copy guide.
 */

function Frame({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div role="status" aria-label={label} className={className}>
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}

const card = "rounded-card border border-line-1 bg-surface-1 p-(--v5-card-pad)";

/** My plan: the summary card (stats, bar, next step), then the week trail card. */
export function PlanSkeleton() {
  return (
    <Frame label="Loading your plan" className="flex flex-col gap-(--v5-gap) lg:gap-6">
      <div className={card}>
        <Skeleton className="h-5 w-2/3" />
        <div className="mt-3 flex flex-wrap gap-6">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="mt-4 h-2.5 w-full rounded-full" />
        <div className="mt-4 flex flex-col gap-3 rounded-control border border-line-1 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="mt-2 h-6 w-3/4" />
            <Skeleton className="mt-2 h-5 w-1/2" />
          </div>
          <Skeleton className="h-12 w-full rounded-control sm:w-32" />
        </div>
      </div>
      <div>
        <Skeleton className="h-7 w-36" />
        <Skeleton className="mt-2 h-4 w-64 max-w-full" />
      </div>
      <div className={card}>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-6 w-24 rounded-full" />
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-6 pl-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-4" style={{ marginLeft: `${(i % 2) * 2.5}rem` }}>
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-48 max-w-full" />
                <Skeleton className="mt-1.5 h-3.5 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

/** Library: the grid of course cards (badges, title, outcomes, meta line). */
export function LibrarySkeleton({ count = 6 }: { count?: number }) {
  return (
    <Frame label="Loading the library" className="grid gap-(--v5-gap) sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`${card} flex flex-col gap-3 shadow-e1`}>
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-6 w-4/5" />
          <div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-3.5 w-full" />
            <Skeleton className="mt-1.5 h-3.5 w-5/6" />
            <Skeleton className="mt-1.5 h-3.5 w-2/3" />
          </div>
          <div className="mt-2 flex gap-3">
            <Skeleton className="h-3.5 w-14" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-12" />
          </div>
        </div>
      ))}
    </Frame>
  );
}

/** Course page: back link, the outcomes card, then the syllabus list. */
export function CourseSkeleton() {
  return (
    <Frame label="Loading the course" className="flex flex-col gap-(--v5-gap) lg:gap-6">
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="h-5 w-full max-w-prose" />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className={card}>
        <Skeleton className="h-6 w-44" />
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="mt-3 h-4 w-full" />
        ))}
        <Skeleton className="mt-5 h-11 w-36 rounded-control" />
      </div>
      <div className={card}>
        <Skeleton className="h-6 w-36" />
        <ul className="mt-3 flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="flex h-(--v5-row-h) items-center gap-3 rounded-control border border-line-1 px-3">
              <Skeleton className="size-5 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-12" />
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}

/** Review: the three ways in (due, mixed, mistakes). */
export function ReviewSkeleton() {
  return (
    <Frame label="Loading your review deck" className="grid gap-(--v5-gap) md:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className={`${card} flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-2 h-(--v5-control-h) w-full rounded-control" />
        </div>
      ))}
    </Frame>
  );
}
