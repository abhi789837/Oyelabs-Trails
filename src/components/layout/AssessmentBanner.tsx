import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { describeAssessmentBanner } from "@/features/assessment/funnel";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { useMyAssessmentStore } from "@/store/assessmentStore";

/**
 * The placement assessment, said out loud on every learner page.
 *
 * A learner with an older plan has no reason to visit `/plan`, so until now an approved
 * assessment could sit waiting while they carried on working through a trail that the assessment
 * was about to replace. This sits above the routed content and does not go away.
 *
 * It is a marker on the trail rather than a notification bar: the same waypoint square the trail
 * map uses, the trail amber for something you have to cross, basalt for something merely being
 * prepared.
 */
export function AssessmentBanner() {
  const { user } = useAuth();
  const assessment = useMyAssessmentStore((s) => s.assessment);
  const reduceMotion = useReducedMotion();
  const location = useLocation();
  /** Which status was put away, so a change of state brings the banner straight back. */
  const [dismissedStatus, setDismissedStatus] = useState<string | null>(null);

  const copy = describeAssessmentBanner(assessment, user?.role ?? "learner");

  /*
   * `/plan` owns this message already: when an assessment is pending it replaces the whole page
   * with the same prompt and the same button (the funnel branch in `PlanPage`). Repeating it
   * directly above itself would read as a bug. Every other learner route gets the banner.
   */
  const onPlan = location.pathname === "/plan";
  const visible = copy !== null && !onPlan && dismissedStatus !== copy.status;

  /*
   * The live region is always mounted, and it sits outside the routed content, so it announces
   * once when a pending assessment appears or changes state — and stays silent on navigation,
   * which is what a `role="alert"` here would get wrong.
   */
  return (
    <div aria-live="polite">
      {visible && copy && (
        <motion.section
          key={copy.status}
          aria-label="Placement assessment"
          initial={reduceMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }}
          className={cn(
            "border-b",
            copy.tone === "quiet" ? "bg-surface-sunken/50" : "border-trailmark/45 bg-trailmark/[0.08]",
          )}
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-start gap-x-4 gap-y-3 px-4 py-3.5 sm:px-8">
            <Marker tone={copy.tone} />

            <div className="min-w-0 flex-1 basis-64">
              <p className="font-brand text-base font-semibold">{copy.title}</p>
              <p className="mt-1 max-w-prose text-sm text-muted-foreground">{copy.body}</p>
            </div>

            {copy.action && (
              <div className="flex shrink-0 items-center gap-1">
                <Button asChild variant={copy.tone === "quiet" ? "link" : "default"} size="sm">
                  <Link to={copy.action.to}>{copy.action.label}</Link>
                </Button>

                {copy.dismissible && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => setDismissedStatus(copy.status)}
                  >
                    <X aria-hidden="true" />
                    <span className="sr-only">Hide this update</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.section>
      )}
    </div>
  );
}

/** The trail map's waypoint square, at text size. It pulses only when a clock is running. */
function Marker({ tone }: { tone: "urgent" | "waiting" | "quiet" }) {
  return (
    <span aria-hidden="true" className="relative mt-1 flex h-3.5 w-3.5 shrink-0">
      {tone === "urgent" && (
        <span className="absolute inset-0 animate-waypoint-pulse rounded-[3px] bg-trailmark" />
      )}
      <span
        className={cn(
          "relative h-3.5 w-3.5 rounded-[3px]",
          tone === "quiet" ? "border-[1.5px] border-basalt" : "bg-trailmark",
        )}
      />
    </span>
  );
}
