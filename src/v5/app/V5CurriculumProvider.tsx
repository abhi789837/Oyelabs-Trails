import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { useLocation } from "react-router-dom";

import { useCurriculumLoader } from "@/features/curriculum/useCurriculumLoader";

/**
 * The learner shell's `CurriculumProvider`: the same loading rules (`useCurriculumLoader`), with
 * markup that doesn't import the old Button. That Button pulls the full Motion runtime, and this
 * provider is in /learn's first download (DECISIONS, Integration fixes).
 */
/**
 * Screens that don't read the curriculum and must open without it (P8: Review works offline, when
 * the manifest can't be fetched). The loader still runs for them, so the next screen is ready.
 */
const NO_CURRICULUM_NEEDED = ["/learn/review"];

export function V5CurriculumProvider({ children }: { children: ReactNode }) {
  const { status, error, retry } = useCurriculumLoader();
  const { pathname } = useLocation();

  if (NO_CURRICULUM_NEEDED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return <>{children}</>;

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status" aria-live="polite">
        <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Loading your trail</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Your trail couldn't be loaded</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <button
          type="button"
          onClick={retry}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
        >
          Try again
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
