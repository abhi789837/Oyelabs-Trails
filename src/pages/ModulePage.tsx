import { Link, useParams } from "react-router-dom";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ResourceKindTag } from "@/components/trail/ResourceKindTag";
import { StatusDot } from "@/components/trail/StatusDot";
import { TrailMap, type TrailWaypoint } from "@/components/trail/TrailMap";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getModule, getTrack, moduleMinutes, moduleNeighbors, modulePath, topicPath } from "@/content";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { summarizeModule } from "@/hooks/useTrackProgress";
import { accentClasses } from "@/lib/accent";
import { levelLabels, levelRange } from "@/lib/track-meta";
import { cn, formatMinutes, formatMinutesCompact } from "@/lib/utils";
import { useProgressStore } from "@/store/progressStore";
import NotFoundPage from "./NotFoundPage";

export default function ModulePage() {
  const { trackId, moduleId } = useParams();
  const track = getTrack(trackId);
  const module = getModule(trackId, moduleId);
  const progress = useProgressStore((s) => s.progress);
  useDocumentTitle(module ? module.name : "Off trail");

  if (!track || !module) return <NotFoundPage />;

  const accent = accentClasses[track.accentToken];
  const index = track.modules.findIndex((m) => m.id === module.id);
  const summary = summarizeModule(module, progress);
  const { prev, next } = moduleNeighbors(track.id, module.id);
  const milestones = module.topics.filter((t) => t.isMilestone).length;

  if (!module.available) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-8">
        <Breadcrumbs items={[{ label: "Dashboard", to: "/" }, { label: track.name, to: `/track/${track.id}` }, { label: module.name }]} />
        <h1 className="mt-8 text-2xl font-bold sm:text-3xl">{module.name}</h1>
        <p className="mt-3 max-w-prose text-muted-foreground">
          This camp is still being written. Its topics will appear here once they've been researched and checked.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to={`/track/${track.id}`}>Back to the {track.name} trail</Link>
        </Button>
      </div>
    );
  }

  const waypoints: TrailWaypoint[] = module.topics.map((topic, i) => {
    const p = progress[topic.id];
    const status = p?.status ?? "not-started";
    return {
      id: topic.id,
      href: topicPath(topic),
      title: topic.title,
      ariaLabel: `${i + 1}. ${topic.title}, ${status.replace("-", " ")}${topic.isMilestone ? ", milestone" : ""}`,
      status,
      shape: "waypoint",
      large: topic.isMilestone,
      label: i + 1,
      meta: [
        levelLabels[topic.level],
        formatMinutesCompact(topic.estMinutes),
        ...(topic.isMilestone ? [<span className="text-foreground">Milestone</span>] : []),
        ...(status === "completed" && p?.bestScore !== undefined ? [<span className="text-summit-strong">Best {p.bestScore}%</span>] : []),
      ],
      tooltip: (
        <>
          <span className="block font-medium">{topic.title}</span>
          <span className="mt-0.5 block opacity-80">
            {levelLabels[topic.level]}, {formatMinutes(topic.estMinutes)},{" "}
            {topic.challengeType === "quiz" ? `${topic.challengeSize}-question quiz` : `${topic.challengeSize}-test coding challenge`}
          </span>
        </>
      ),
    };
  });

  return (
    <div>
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-4 pb-10 pt-8 sm:px-8">
          <Breadcrumbs items={[{ label: "Dashboard", to: "/" }, { label: track.name, to: `/track/${track.id}` }, { label: module.name }]} />

          <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-prose">
              <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <span aria-hidden="true" className={cn("h-3.5 w-3.5 rounded-[3px]", accent.bg)} />
                Camp {index + 1} of {track.modules.length} on the {track.name} trail
              </p>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{module.name}</h1>
              <p className="mt-3 text-muted-foreground">{module.description}</p>
              <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-muted-foreground">
                <div>
                  <dt className="sr-only">Topics</dt>
                  <dd>{module.topics.length} topics</dd>
                </div>
                <div>
                  <dt className="sr-only">Estimated time</dt>
                  <dd>{formatMinutes(moduleMinutes(module))}</dd>
                </div>
                <div>
                  <dt className="sr-only">Levels</dt>
                  <dd>{levelRange(module.topics.map((t) => t.level))}</dd>
                </div>
                {milestones > 0 && (
                  <div>
                    <dt className="sr-only">Milestones</dt>
                    <dd>{milestones} milestones</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="w-full md:w-72">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-2xl font-semibold tabular">{summary.pct}%</span>
                <span className="text-sm text-muted-foreground">
                  {summary.completed} of {summary.total} topics
                </span>
              </div>
              <Progress value={summary.pct} className="mt-2 h-2" indicatorClassName={accent.bg} aria-label={`${module.name} completion: ${summary.pct}%`} />
              {summary.nextTopic ? (
                <Button asChild className={cn("mt-4", accent.solid)}>
                  <Link to={topicPath(summary.nextTopic)}>{summary.started ? "Continue camp" : "Start camp"}</Link>
                </Button>
              ) : (
                <p className="mt-4 text-sm text-summit-strong">Every topic in this camp is complete.</p>
              )}
            </div>
          </div>

          {module.refs && module.refs.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold">Reading list for this camp</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {module.refs.map((ref) => (
                  <li key={ref.url}>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition-colors hover:border-foreground/30 hover:bg-surface"
                    >
                      <ResourceKindTag kind={ref.kind} compact />
                      {ref.label}
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </header>

      <section aria-label={`${module.name} topics`} className="mx-auto max-w-4xl px-4 pb-10 pt-6 sm:px-8">
        <ul aria-label="Legend" className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-flex">
              <StatusDot status="not-started" />
            </span>
            Not started
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-flex">
              <StatusDot status="in-progress" />
            </span>
            In progress
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-flex">
              <StatusDot status="completed" />
            </span>
            Completed
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="h-4 w-4 rounded-full border-2 border-basalt ring-2 ring-foreground/15 ring-offset-1 ring-offset-background" />
            Milestone (larger marker)
          </li>
        </ul>
        <TrailMap
          mapId={module.id}
          accent={track.accentToken}
          waypoints={waypoints}
          start={{
            title: prev ? "From the last camp" : "Trailhead",
            detail: prev ? prev.name : `${track.name} trail begins here`,
            href: prev ? modulePath(prev) : `/track/${track.id}`,
          }}
          end={{
            title: summary.isComplete ? "Camp complete" : next ? "Next camp" : "Summit",
            detail: next ? next.name : "Track certificate",
            href: next ? modulePath(next) : `/report/${track.id}`,
            complete: summary.isComplete,
          }}
        />
      </section>

      <nav aria-label="Camp navigation" className="mx-auto grid max-w-4xl gap-3 px-4 pb-16 sm:grid-cols-2 sm:px-8">
        {prev ? (
          <Link to={modulePath(prev)} className="rounded-md border px-4 py-3 transition-colors hover:border-foreground/30 hover:bg-surface">
            <span className="block text-xs text-muted-foreground">Previous camp</span>
            <span className="mt-0.5 block font-display font-semibold">{prev.name}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={modulePath(next)} className="rounded-md border px-4 py-3 transition-colors hover:border-foreground/30 hover:bg-surface sm:text-right">
            <span className="block text-xs text-muted-foreground">Next camp</span>
            <span className="mt-0.5 block font-display font-semibold">{next.name}</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
