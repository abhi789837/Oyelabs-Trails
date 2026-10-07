import { CircleCheck, Flag, Mountain } from "lucide-react";
import { Link } from "react-router-dom";

import type { LearnerGoalView } from "@shared/goals";

import { trackTopics, useTracks } from "@/content";
import { useProgressStore } from "@/store/progressStore";
import { Card, CardHeader } from "@/v5/design/components/Card";
import { Badge } from "@/v5/design/components/Primitives";

import { useApiData } from "./page";

/**
 * Two things the previous design showed that v5 had no place for (docs/v5/PARITY.md):
 * - the learner's goals, each with a link to its capstone (the hands-on task that proves it);
 * - trail certificates (`/report/:trackId`), earned by finishing every topic on a trail.
 */

const linkClass = "font-medium text-brand-fg underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/** Where "Do the capstone" goes: the lesson for a topic capstone, else the capstone page. */
export function capstoneHref(goal: LearnerGoalView): string | null {
  if (!goal.capstone) return null;
  if (goal.capstone.kind === "topic" && goal.capstone.topicId) return `/learn/lesson/${encodeURIComponent(goal.capstone.topicId)}`;
  return `/goals/${encodeURIComponent(goal.id)}`;
}

export function GoalsCard() {
  const goals = useApiData<{ goals: LearnerGoalView[] }>("/api/me/goals");
  const list = goals.data?.goals ?? [];
  if (!list.length) return null;
  const achieved = list.filter((g) => g.status === "achieved").length;
  return (
    <Card className="lg:col-span-2" data-testid="me-goals">
      <CardHeader title="Your goals" description={`What your team wants you to be able to do. ${achieved} of ${list.length} done.`} />
      <ul className="flex flex-col divide-y divide-line-1">
        {list.map((goal) => {
          const done = goal.status === "achieved";
          const href = done ? null : capstoneHref(goal);
          return (
            <li key={goal.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-2">
                {done ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-success-fg" aria-hidden="true" /> : <Flag className="mt-0.5 size-4 shrink-0 text-progress-fg" aria-hidden="true" />}
                <div className="min-w-0">
                  <p className="text-body font-medium text-fg-1">{goal.outcome}</p>
                  {goal.skillNames.length ? <p className="text-small text-fg-2">{goal.skillNames.join(", ")}</p> : null}
                </div>
              </div>
              {done ? (
                <Badge tone="success" className="self-start sm:self-center">
                  Done
                </Badge>
              ) : href ? (
                <Link to={href} className={`${linkClass} shrink-0 text-small`}>
                  Do the capstone<span className="sr-only">: {goal.capstone?.title ?? goal.outcome}</span>
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/** Trails where every topic is finished: each has a certificate page from the previous design. */
export function TrailCertificates() {
  const tracks = useTracks();
  const progress = useProgressStore((s) => s.progress);
  const finished = tracks.filter((t) => {
    const topics = trackTopics(t);
    return topics.length > 0 && topics.every((topic) => progress[topic.id]?.status === "completed");
  });
  if (!finished.length) return null;
  return (
    <div className="mt-4 border-t border-line-1 pt-3" data-testid="me-trail-certificates">
      <p className="text-small font-medium text-fg-1">Trail certificates</p>
      <ul className="mt-2 flex flex-col gap-2">
        {finished.map((t) => (
          <li key={t.id} className="flex items-center gap-2 text-small">
            <Mountain className="size-4 shrink-0 text-brand-fg" aria-hidden="true" />
            <Link to={`/report/${encodeURIComponent(t.id)}`} className={linkClass}>
              {t.name} trail certificate
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
