import { useState } from "react";

import { cn } from "@/lib/utils";

import { useServiceWorkerUpdate } from "./register";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong";

/**
 * "A new version is ready — Reload". Calm: it waits in a corner, above the phone's bottom nav, and
 * nothing happens until the learner chooses. "Later" hides it for this visit. Uses the classes the
 * shell uses, so it reads right on old pages shown inside the v5 frame as well.
 */
export function UpdatePrompt() {
  const { ready, reload } = useServiceWorkerUpdate();
  const [later, setLater] = useState(false);
  if (!ready || later) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="sw-update"
      className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 flex flex-wrap items-center gap-3 rounded-lg border bg-background px-4 py-3 text-sm text-foreground shadow-lg sm:inset-x-auto sm:right-5 sm:bottom-5 sm:max-w-sm"
    >
      <p className="min-w-0 flex-1">A new version is ready.</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => setLater(true)} className={cn("min-h-9 rounded-md px-3 text-muted-foreground hover:bg-accent hover:text-foreground", focusRing)}>
          Later
        </button>
        <button type="button" onClick={reload} className={cn("min-h-9 rounded-md bg-primary px-3 font-medium text-primary-foreground hover:bg-primary/85", focusRing)}>
          Reload
        </button>
      </div>
    </div>
  );
}
