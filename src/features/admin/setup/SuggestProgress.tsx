import { useEffect, useState } from "react";
import { Check, Circle, LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

import { elapsedLabel, type StepState } from "./suggestSteps";

/**
 * v4.4 Phase 6: what Suggest is doing, as a short list that ticks as each real server step
 * finishes. After 10 seconds the time so far shows, so a slow AI never looks frozen.
 */
export function SuggestProgress({ labels, states, startedAt }: { labels: readonly string[]; states: readonly StepState[]; startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const elapsed = elapsedLabel(now - startedAt);
  return (
    <div role="status" aria-live="polite" className="rounded-lg border bg-surface px-4 py-4 sm:px-5">
      <ul className="space-y-2 text-sm" aria-label="Working on the plan">
        {labels.map((label, i) => {
          const state = states[i] ?? "waiting";
          return (
            <li key={label} className={cn("flex items-center gap-2", state === "waiting" && "text-muted-foreground")}>
              {state === "done" ? (
                <Check className="size-4 text-summit" aria-hidden="true" />
              ) : state === "working" ? (
                <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              ) : (
                <Circle className="size-4 opacity-40" aria-hidden="true" />
              )}
              <span>{label}</span>
              <span className="sr-only">{state === "done" ? "(done)" : state === "working" ? "(working on it)" : ""}</span>
            </li>
          );
        })}
      </ul>
      {elapsed && <p className="mt-3 text-xs text-muted-foreground">{elapsed}</p>}
    </div>
  );
}
