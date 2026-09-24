import { Check, CircleDashed, LoaderCircle, X } from "lucide-react";

import { cn } from "@/lib/utils";

import type { WaitStage } from "./stages";

/**
 * The stages of a server job, for the learner who is waiting on it.
 *
 * Every stage here is one the server publishes on `/api/assessment/:id/status`. There is no
 * percentage, no elapsed time and no sub-step, because there is no honest source for any of them —
 * see `stages.ts` for why that matters more than the screen feeling busy.
 *
 * The admin's `GenerationLog` is the same job with every provider call, token count and dropped
 * item in it. That level of detail belongs to the person who can act on it. The learner gets to
 * know which stage their assessment is in, and that someone will tell them if it goes wrong.
 */
export function JobStages({ stages, className }: { stages: WaitStage[]; className?: string }) {
  return (
    // Polite rather than assertive, and safe to leave on: the list is re-rendered on every poll
    // but only changes text when the job genuinely moves, which is at most twice.
    <ol aria-live="polite" className={cn("w-full max-w-sm space-y-1 text-left", className)}>
      {stages.map((stage) => {
        const Icon =
          stage.state === "done" ? Check : stage.state === "current" ? LoaderCircle : stage.state === "failed" ? X : CircleDashed;
        const verdict =
          stage.state === "done" ? "done" : stage.state === "current" ? "in progress" : stage.state === "failed" ? "failed" : "not started";

        return (
          <li key={stage.id} className="flex items-center gap-3 py-1.5">
            <span
              aria-hidden="true"
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                stage.state === "done" && "bg-summit/15 text-summit-strong",
                stage.state === "current" && "bg-trailmark/15 text-trailmark-strong",
                stage.state === "failed" && "bg-destructive/12 text-destructive",
                stage.state === "pending" && "bg-surface-sunken text-muted-foreground",
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", stage.state === "current" && "animate-spin")} />
            </span>
            <span
              className={cn(
                "text-sm",
                stage.state === "current" && "font-medium text-foreground",
                stage.state === "failed" && "text-destructive",
                (stage.state === "pending" || stage.state === "done") && "text-muted-foreground",
              )}
            >
              {stage.label}
              <span className="sr-only"> — {verdict}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
