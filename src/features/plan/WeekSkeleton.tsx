import { Skeleton } from "@/components/ui/skeleton";

/**
 * While the week is being worked out.
 *
 * Shaped like the page it is standing in for — a header, a row of stats, a bar, one card, then lanes —
 * so the content arrives into the layout rather than pushing it around. The line of copy is there
 * because generating a week can take a few seconds when a model is involved, and a spinner with no
 * words reads as a stall.
 */
export function WeekSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-8" role="status" aria-live="polite">
      <Skeleton className="h-8 w-56" />
      <p className="mt-3 font-mono text-xs text-muted-foreground">Scouting your route…</p>

      <div className="mt-6 space-y-2">
        <Skeleton className="h-4 w-full max-w-prose" />
        <Skeleton className="h-4 w-4/5 max-w-prose" />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-8 w-28 rounded-full" />
        ))}
      </div>

      <Skeleton className="mt-5 h-2 w-full max-w-xl" />
      <Skeleton className="mt-7 h-24 w-full max-w-2xl rounded-lg" />

      <div className="mt-10 space-y-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>

      <span className="sr-only">Working out this week's plan</span>
    </div>
  );
}
