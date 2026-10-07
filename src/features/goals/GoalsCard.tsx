import { useEffect, useState } from "react";
import { CircleCheck, Flag } from "lucide-react";
import { Link } from "react-router-dom";

import { TARGET_LEVEL_LABELS, type LearnerGoalView } from "@shared/goals";

import { findTopic, topicPath } from "@/content";
import { cn } from "@/lib/utils";
import { myGoalsApi } from "./api";

/** Where "Do the capstone" goes: the topic itself for a topic capstone, else the capstone page. */
export function capstoneLink(goal: LearnerGoalView): string | null {
  if (!goal.capstone) return null;
  if (goal.capstone.kind === "topic") {
    const found = findTopic(goal.capstone.topicId ?? undefined);
    return found ? topicPath(found.topic) : `/goals/${goal.id}`;
  }
  return `/goals/${goal.id}`;
}

/**
 * v4.3 "Your goals" on the dashboard: what the admin wants this learner to be able to do, which are
 * achieved, and a "Do the capstone" link that proves the next one.
 */
export function GoalsCard() {
  const [goals, setGoals] = useState<LearnerGoalView[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    myGoalsApi
      .list(controller.signal)
      .then((r) => setGoals(r.goals))
      .catch(() => setGoals([]));
    return () => controller.abort();
  }, []);

  if (!goals || goals.length === 0) return null;
  const achieved = goals.filter((g) => g.status === "achieved").length;

  return (
    <section aria-labelledby="your-goals-heading" className="mx-auto max-w-6xl px-4 pt-8 sm:px-8">
      <div className="rounded-lg border bg-card px-5 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="your-goals-heading" className="flex items-center gap-2 font-display text-lg font-semibold">
            <Flag className="size-5 text-trailmark" aria-hidden="true" />
            Your goals
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            {achieved} of {goals.length} achieved
          </span>
        </div>
        <ul className="mt-3 divide-y">
          {goals.slice(0, 8).map((goal) => {
            const done = goal.status === "achieved";
            const link = done ? null : capstoneLink(goal);
            return (
              <li key={goal.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className={cn("flex items-start gap-2 text-sm font-medium", done && "text-summit-strong")}>
                    {done && <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
                    <span>{goal.outcome}</span>
                    {done && <span className="sr-only">(achieved)</span>}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {goal.skillNames.join(", ")} · {TARGET_LEVEL_LABELS[goal.targetLevel]}
                  </p>
                </div>
                {link && (
                  <Link
                    to={link}
                    className="shrink-0 text-sm font-medium underline decoration-primary decoration-2 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
                  >
                    Do the capstone<span className="sr-only">: {goal.capstone?.title}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
