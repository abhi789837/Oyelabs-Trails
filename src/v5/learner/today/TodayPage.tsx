import { m } from "motion/react";
import { lazy, Suspense, useEffect, useState } from "react";

import "@/v5/design/styles";
import { ApiRequestError } from "@/api/client";
import { cn } from "@/v5/design/cn";
import { transitions } from "@/v5/design/motion";
import { useV5Root } from "@/v5/design/useV5Root";
import { V5MotionProvider } from "@/v5/design/V5MotionProvider";

import { useDelayed, useToday } from "./api";
import { PRIMARY_LG, greeting } from "./format";
import { HeroCard } from "./Hero";

/*
 * Budget (docs/v5/DECISIONS.md, Phase 2): only the header, the hero and the loading shapes are in
 * the first download. Everything under the hero, and the design system's state components, are one
 * lazy chunk. Phase 9 performance: it's requested once the hero has painted (its ~25 small files
 * used to compete with the hero's data and fonts on a slow phone connection); the skeleton holds its
 * place until then.
 */
const loadDetails = () => import("./TodayDetails");
const TodayDetails = lazy(loadDetails);
const TodayError = lazy(() => loadDetails().then((mod) => ({ default: mod.TodayError })));

/**
 * `/learn`, Today: answers "what should I do now?" at a glance.
 *
 * One request (`GET /api/v5/today`). The page follows the question: the big Continue first, then
 * notes from the admin, then the week (trail, goal ring, streak), what's next, the daily review
 * and recent wins. One calm entrance for the whole page; the ring and trail fill once, and both
 * follow reduced motion.
 */
export default function TodayPage() {
  useV5Root();
  return (
    <V5MotionProvider>
      <TodayScreen />
    </V5MotionProvider>
  );
}

function TodayScreen() {
  const { data, error, loading, retry } = useToday();
  const showSkeleton = useDelayed(loading && !data);
  const detailsReady = useAfterPaint(Boolean(data));

  return (
    <div className="min-h-full bg-surface-0 text-fg-1">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-(--v5-gap) px-4 py-6 sm:px-6 md:py-10 lg:gap-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-h1 font-semibold text-fg-1">Today</h1>
            <p className="mt-1 min-h-[1.5em] text-body text-fg-2">{data ? `${greeting(new Date().getHours())}${data.firstName ? `, ${data.firstName}` : ""}.` : ""}</p>
          </div>
          {data ? (
            // The all-time total is the top bar's (UX review T4); the header keeps only this week's gain.
            <p className="text-small font-semibold tabular-nums text-fg-2" data-testid="today-xp">
              +{data.xp.thisWeek.toLocaleString("en-US")} XP this week
            </p>
          ) : null}
        </header>

        {error && !data ? (
          <Suspense fallback={<PlainError onRetry={retry} retrying={loading} />}>
            <TodayError onRetry={retry} retrying={loading} details={error instanceof ApiRequestError ? `${error.status} ${error.code}` : undefined} />
          </Suspense>
        ) : data ? (
          // The entrance moves but doesn't fade in: hidden-then-faded text counted as painted only at the
          // end of the fade, 320 ms after it was there (Phase 9 performance).
          <m.div className="flex flex-col gap-(--v5-gap) lg:gap-6" initial={{ y: 8 }} animate={{ y: 0 }} transition={transitions.calm}>
            {data.hero ? <HeroCard hero={data.hero} /> : null}
            {detailsReady ? (
              <Suspense fallback={<DetailsSkeleton />}>
                <TodayDetails data={data} />
              </Suspense>
            ) : (
              <DetailsSkeleton />
            )}
          </m.div>
        ) : showSkeleton ? (
          <TodaySkeleton />
        ) : null}
      </div>
    </div>
  );
}

/** True from the frame after `on` first turned true (the hero has been painted by then); stays true. */
function useAfterPaint(on: boolean): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!on || ready) return;
    let second = 0;
    const first = window.requestAnimationFrame(() => {
      second = window.requestAnimationFrame(() => setReady(true));
    });
    return () => {
      window.cancelAnimationFrame(first);
      window.cancelAnimationFrame(second);
    };
  }, [on, ready]);
  return ready;
}

/** Shown only if the error component itself can't load (fully offline). Same words, fewer parts. */
function PlainError({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-card border border-line-1 bg-surface-1 px-6 py-10 text-center">
      <h2 className="font-display text-h4 font-semibold text-fg-1">We couldn't load Today</h2>
      <p className="mt-1 text-small text-fg-2">It's probably a short network hiccup. Your progress is saved.</p>
      <button type="button" className={cn(PRIMARY_LG, "mt-5")} onClick={onRetry} disabled={retrying} aria-busy={retrying || undefined}>
        Try again
      </button>
    </div>
  );
}

/** The design system's skeleton block (`.v5-skeleton`, shimmer off under reduced motion). */
function Bone({ className }: { className?: string }) {
  return <div className={cn("v5-skeleton rounded-md", className)} aria-hidden="true" />;
}

/** Shaped like the page: hero, week card (trail + ring), then two columns. */
function TodaySkeleton() {
  return (
    <div role="status" aria-label="Loading Today" className="flex flex-col gap-(--v5-gap) lg:gap-6" data-testid="today-skeleton">
      <div className="rounded-card border border-line-1 bg-surface-1 p-5 sm:p-7">
        <Bone className="h-4 w-40" />
        <Bone className="mt-3 h-8 w-3/4" />
        <Bone className="mt-2 h-4 w-1/2" />
        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Bone className="h-6 w-48 rounded-full" />
          <Bone className="h-12 w-full rounded-control md:w-40" />
        </div>
      </div>
      <DetailsBody />
    </div>
  );
}

function DetailsBody() {
  return (
    <>
      <div className="rounded-card border border-line-1 bg-surface-1 p-(--v5-card-pad)">
        <Bone className="h-5 w-32" />
        <Bone className="mt-2 h-4 w-64 max-w-full" />
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <Bone className="h-60 w-full rounded-card" />
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Bone className="size-22 rounded-full" />
              <Bone className="h-10 flex-1" />
            </div>
            <Bone className="h-24 w-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-(--v5-gap) lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-card border border-line-1 bg-surface-1 p-(--v5-card-pad)">
            <Bone className="h-5 w-28" />
            {Array.from({ length: 3 }, (_, j) => (
              <Bone key={j} className="mt-3 h-12 w-full rounded-control" />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

function DetailsSkeleton() {
  return (
    <div role="status" aria-label="Loading the rest of Today" className="flex flex-col gap-(--v5-gap) lg:gap-6">
      <DetailsBody />
    </div>
  );
}
