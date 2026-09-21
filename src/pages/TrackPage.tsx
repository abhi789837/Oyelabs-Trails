import { Award } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Contours } from "@/components/trail/Contours";
import { StatusDot } from "@/components/trail/StatusDot";
import { TrailMap, type TrailWaypoint } from "@/components/trail/TrailMap";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getTrack, moduleMinutes, modulePath, topicPath, trackMinutes, trackTopics } from "@/content";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { summarizeModule, summarizeTrack } from "@/hooks/useTrackProgress";
import { accentClasses } from "@/lib/accent";
import { levelRange } from "@/lib/track-meta";
import { cn, formatMinutes, formatMinutesCompact } from "@/lib/utils";
import { useProgressStore } from "@/store/progressStore";
import NotFoundPage from "./NotFoundPage";

export default function TrackPage() {
  const { trackId } = useParams();
  const track = getTrack(trackId);
  const progress = useProgressStore((s) => s.progress);
  useDocumentTitle(track ? `${track.name} trail` : "Off trail");

  if (!track) return <NotFoundPage />;

  const summary = summarizeTrack(track, progress);
  const accent = accentClasses[track.accentToken];
  const available = track.modules.filter((m) => m.available);
  const remaining = summary.total - summary.completed;
  const topicCount = trackTopics(track).length;

  const camps: TrailWaypoint[] = track.modules.map((module, i) => {
    const s = summarizeModule(module, progress);
    const status = !module.available ? "locked" : s.isComplete ? "completed" : s.started ? "in-progress" : "not-started";
    const statusText =
      status === "locked" ? "being written" : status === "completed" ? "complete" : `${s.completed} of ${s.total} topics done`;
    return {
      id: module.id,
      href: module.available ? modulePath(module) : undefined,
      title: module.name,
      ariaLabel: `Camp ${i + 1}: ${module.name}, ${statusText}`,
      status,
      shape: "camp",
      label: i + 1,
      meta: module.available
        ? [`${module.topics.length} topics`, formatMinutesCompact(moduleMinutes(module)), levelRange(module.topics.map((t) => t.level))]
        : ["Coming soon"],
      extra: module.available ? (
        <div className="flex w-40 items-center gap-2">
          <Progress value={s.pct} className="h-1" indicatorClassName={accent.bg} aria-hidden="true" />
          <span className="font-mono text-[11px] tabular text-muted-foreground">
            {s.completed}/{s.total}
          </span>
        </div>
      ) : undefined,
      tooltip: (
        <>
          <span className="block font-medium">{module.name}</span>
          {module.description && <span className="mt-0.5 block max-w-64 opacity-80">{module.description}</span>}
        </>
      ),
    };
  });

  return (
    <div>
      <header className="relative overflow-hidden border-b">
        <Contours className="text-foreground/[0.06]" seed={track.modules.length} />
        <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-8 sm:px-8">
          <Breadcrumbs items={[{ label: "Dashboard", to: "/" }, { label: track.name }]} />

          <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className={cn("h-8 w-2 rounded-[2px]", accent.bg)} />
                <h1 className="text-2xl font-bold sm:text-3xl">{track.name}</h1>
              </div>
              <p className="mt-3 max-w-prose text-muted-foreground">{track.tagline}</p>
              <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-muted-foreground">
                <div>
                  <dt className="sr-only">Camps</dt>
                  <dd>{track.modules.length} camps</dd>
                </div>
                <div>
                  <dt className="sr-only">Topics</dt>
                  <dd>{topicCount} topics</dd>
                </div>
                <div>
                  <dt className="sr-only">Estimated time</dt>
                  <dd>{formatMinutes(trackMinutes(track))}</dd>
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
              <Progress value={summary.pct} className="mt-2 h-2" indicatorClassName={accent.bg} aria-label={`${track.name} completion: ${summary.pct}%`} />
              <div className="mt-4 flex flex-wrap gap-2">
                {summary.nextTopic && (
                  <Button asChild className={accent.solid}>
                    <Link to={topicPath(summary.nextTopic)}>{summary.started ? "Continue trail" : "Start trail"}</Link>
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
                  {topicCount === 0
                    ? "This trail's camps are still being written."
                    : `Complete ${remaining} more ${remaining === 1 ? "topic" : "topics"} to unlock the certificate.`}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <section aria-label={`${track.name} trail map`} className="mx-auto max-w-4xl px-4 pb-16 pt-6 sm:px-8">
        <ul aria-label="Legend" className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="h-4 w-4 rounded-[4px] border-2 border-basalt" /> Camp not started
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="h-4 w-4 rounded-[4px] bg-trailmark" /> In progress
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-flex">
              <StatusDot status="completed" className="rounded-[4px]" />
            </span>
            Camp complete
          </li>
          <li>Each camp opens its own trail of topics.</li>
        </ul>
        <TrailMap
          mapId={track.id}
          accent={track.accentToken}
          waypoints={camps}
          start={{
            title: "Trailhead",
            detail: `${track.modules.length} camps, ${topicCount} topics`,
            href: available[0] ? modulePath(available[0]) : `/track/${track.id}`,
          }}
          end={{
            title: summary.isComplete ? "Summit reached" : "Summit",
            detail: summary.isComplete ? "Your certificate is ready" : "Certificate unlocks after every camp",
            href: `/report/${track.id}`,
            complete: summary.isComplete,
          }}
        />
      </section>
    </div>
  );
}
