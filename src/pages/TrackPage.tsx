import { Award } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { Contours } from "@/components/trail/Contours";
import { StatusDot } from "@/components/trail/StatusDot";
import { TrailMap } from "@/components/trail/TrailMap";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getTrackById, getTrackTotalMinutes } from "@/data/tracks";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { summarizeTrack } from "@/hooks/useTrackProgress";
import { accentClasses } from "@/lib/accent";
import { cn, formatMinutes } from "@/lib/utils";
import { useProgressStore } from "@/store/progressStore";
import NotFoundPage from "./NotFoundPage";

export default function TrackPage() {
  const { trackId } = useParams();
  const track = getTrackById(trackId);
  const progress = useProgressStore((s) => s.progress);
  useDocumentTitle(track ? `${track.name} trail` : "Off trail");

  if (!track) return <NotFoundPage />;

  const summary = summarizeTrack(track, progress);
  const accent = accentClasses[track.accentToken];
  const totalMinutes = getTrackTotalMinutes(track);
  const milestones = track.topics.filter((t) => t.isMilestone).length;
  const remaining = summary.total - summary.completed;

  return (
    <div>
      <header className="relative overflow-hidden border-b">
        <Contours className="text-foreground/[0.06]" seed={track.topics.length} />
        <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-8 sm:px-8">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-foreground hover:underline">
                  Dashboard
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-foreground">
                {track.name}
              </li>
            </ol>
          </nav>

          <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className={cn("h-8 w-2 rounded-[2px]", accent.bg)} />
                <h1 className="text-2xl font-bold sm:text-3xl">{track.name}</h1>
              </div>
              <p className="mt-3 max-w-prose text-muted-foreground">{track.tagline}</p>
              <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-muted-foreground">
                <div>
                  <dt className="sr-only">Topics</dt>
                  <dd>{track.topics.length} topics</dd>
                </div>
                <div>
                  <dt className="sr-only">Estimated time</dt>
                  <dd>{formatMinutes(totalMinutes)}</dd>
                </div>
                <div>
                  <dt className="sr-only">Milestones</dt>
                  <dd>{milestones} milestones</dd>
                </div>
              </dl>
            </div>

            <div className="w-full md:w-80">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-2xl font-semibold tabular">{summary.pct}%</span>
                <span className="text-sm text-muted-foreground">
                  {summary.completed} of {summary.total} topics complete
                </span>
              </div>
              <Progress
                value={summary.pct}
                className="mt-2 h-2"
                indicatorClassName={accent.bg}
                aria-label={`${track.name} completion: ${summary.pct}%`}
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {summary.nextTopic && (
                  <Button asChild className={accent.solid}>
                    <Link to={`/track/${track.id}/topic/${summary.nextTopic.id}`}>
                      {summary.started ? "Continue trail" : "Start trail"}
                    </Link>
                  </Button>
                )}
                {summary.isComplete ? (
                  <Button asChild className={accent.solid}>
                    <Link to={`/report/${track.id}`}>
                      <Award />
                      View certificate
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" disabled aria-describedby="certificate-lock-note">
                    <Award />
                    View certificate
                  </Button>
                )}
              </div>
              {!summary.isComplete && (
                <p id="certificate-lock-note" className="mt-2 text-xs text-muted-foreground">
                  Complete {remaining} more {remaining === 1 ? "topic" : "topics"} to unlock the certificate.
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <section aria-label={`${track.name} trail map`} className="mx-auto max-w-4xl px-4 pb-16 pt-6 sm:px-8">
        <ul aria-label="Legend" className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-flex">
              <StatusDot status="not-started" />
            </span> Not started
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-flex">
              <StatusDot status="in-progress" />
            </span> In progress
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-flex">
              <StatusDot status="completed" />
            </span> Completed
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="h-4 w-4 rounded-full border-2 border-basalt ring-2 ring-foreground/15 ring-offset-1 ring-offset-background" />
            Milestone (larger marker)
          </li>
        </ul>
        <TrailMap track={track} progress={progress} totalMinutes={totalMinutes} isComplete={summary.isComplete} />
      </section>
    </div>
  );
}
