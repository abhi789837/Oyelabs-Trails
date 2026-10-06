import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useCurriculumLoader } from "./useCurriculumLoader";

/**
 * Loads the person's manifest and progress once they are signed in, and clears both when they are
 * not. Both are per-person from v3, so leaving them in memory across a sign-out would briefly
 * show one person's plan to the next.
 *
 * Rendering waits for the manifest: every page below reads `tracks` synchronously, and rendering
 * an empty curriculum first would flash "nothing assigned" on every load.
 */
export function CurriculumProvider({ children }: { children: ReactNode }) {
  const { status, error, retry } = useCurriculumLoader();

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
        <Button className="mt-6" onClick={retry}>
          Try again
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
