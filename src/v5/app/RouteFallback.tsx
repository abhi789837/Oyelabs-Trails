import { LoaderCircle } from "lucide-react";

/**
 * Shown while a lazy route chunk loads. The same markup as the old auth `Pending`, so the old
 * design looks exactly as it did before it became a lazy chunk.
 */
export function RouteFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status" aria-live="polite">
      <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

/** A smaller fallback for a screen inside a shell, so the shell stays put while the screen loads. */
export function ScreenFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite">
      <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
