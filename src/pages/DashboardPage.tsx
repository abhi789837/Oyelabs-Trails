import { Link } from "react-router-dom";

import { Contours } from "@/components/trail/Contours";
import { ElevationProfile } from "@/components/trail/ElevationProfile";
import { StatusDot } from "@/components/trail/StatusDot";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { allTracks, getTrackTotalMinutes } from "@/data/tracks";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { summarizeTrack } from "@/hooks/useTrackProgress";
import { accentClasses } from "@/lib/accent";
import { levelLabels } from "@/lib/track-meta";
import { cn, formatDate, formatMinutes, formatMinutesCompact } from "@/lib/utils";
import { useProgressStore, type TopicProgress } from "@/store/progressStore";
import type { Track } from "@/types/curriculum";

export default function DashboardPage() {
  useDocumentTitle();
  const progress = useProgressStore((s) => s.progress);

  const allTopics = allTracks.flatMap((t) => t.topics);
  const completed = allTopics.filter((t) => progress[t.id]?.status === "completed").length;
  const overallPct = allTopics.length ? Math.round((completed / allTopics.length) * 100) : 0;

  return (
    <div>
      <section className="relative overflow-hidden border-b">
        <Contours className="text-foreground/[0.07]" seed={2} />
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-8 sm:pt-20">
          <h1 className="text-2xl font-bold sm:text-3xl">Oyelabs Trails</h1>
          <p className="mt-3 max-w-prose text-lg text-muted-foreground">
            Four trails through the stack Oyelabs ships with. Read the docs, watch the video, pass the challenge, and
            climb toward each summit.
          </p>

          <dl className="mt-10 grid max-w-xl grid-cols-3 border-y">
            <Stat label="Topics" value={String(allTopics.length)} />
            <Stat label="Completed" value={String(completed)} className="border-l pl-4 sm:pl-6" />
            <Stat label="Overall progress" value={`${overallPct}%`} className="border-l pl-4 sm:pl-6" />
          </dl>
          <Progress
            value={overallPct}
            className="mt-4 h-1 max-w-xl"
            indicatorClassName="bg-summit"
            aria-label={`Overall progress: ${overallPct}%`}
          />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        {allTracks.map((track) => (
          <TrackSection key={track.id} track={track} progress={progress} />
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex flex-col-reverse py-4", className)}>
      <dt className="mt-1 text-xs text-muted-foreground sm:text-sm">
        {label}
      </dt>
      <dd className="font-display text-xl font-semibold tabular sm:text-2xl">{value}</dd>
    </div>
  );
}

function TrackSection({ track, progress }: { track: Track; progress: Record<string, TopicProgress> }) {
  const summary = summarizeTrack(track, progress);
  const accent = accentClasses[track.accentToken];
  const milestones = track.topics.filter((t) => t.isMilestone).length;
  const upNext = track.topics.filter((t) => progress[t.id]?.status !== "completed").slice(0, 4);
  const headingId = `track-${track.id}-heading`;

  const cta = summary.isComplete
    ? { label: "View certificate", to: `/report/${track.id}` }
    : summary.started
      ? { label: "Continue trail", to: `/track/${track.id}/topic/${summary.nextTopic!.id}` }
      : { label: "Start trail", to: `/track/${track.id}/topic/${track.topics[0].id}` };

  return (
    <section aria-labelledby={headingId} className="grid gap-8 border-b py-10 last:border-b-0 md:grid-cols-12 md:gap-10 md:py-12">
      <div className="md:col-span-5">
        <div className="flex items-center gap-3">
          {/* A trail blaze: the painted mark that tells hikers which trail they're on. */}
          <span aria-hidden="true" className={cn("h-7 w-2 rounded-[2px]", accent.bg)} />
          <h2 id={headingId} className="text-xl font-semibold">
            {track.name}
          </h2>
        </div>
        <p className="mt-2 max-w-prose text-muted-foreground">{track.tagline}</p>
        <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-muted-foreground">
          <div>
            <dt className="sr-only">Topics</dt>
            <dd>{track.topics.length} topics</dd>
          </div>
          <div>
            <dt className="sr-only">Estimated time</dt>
            <dd>{formatMinutes(getTrackTotalMinutes(track))}</dd>
          </div>
          <div>
            <dt className="sr-only">Milestones</dt>
            <dd>{milestones} milestones</dd>
          </div>
        </dl>

        <div className="mt-6">
          <div className="flex items-baseline justify-between text-sm">
            <span>
              {summary.completed} of {summary.total} complete
            </span>
            <span className="font-mono tabular text-muted-foreground">{summary.pct}%</span>
          </div>
          <Progress
            value={summary.pct}
            className="mt-2 h-2"
            indicatorClassName={accent.bg}
            aria-label={`${track.name} progress: ${summary.pct}%`}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className={accent.solid}>
            <Link to={cta.to}>{cta.label}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={`/track/${track.id}`}>Open trail map</Link>
          </Button>
        </div>
      </div>

      <div className="md:col-span-7">
        <ElevationProfile track={track} progress={progress} />
        <div className="mt-1 flex justify-between font-mono text-xs text-muted-foreground">
          <span>Trailhead</span>
          <span>Summit</span>
        </div>

        {summary.isComplete ? (
          <p className="mt-6 rounded-md border border-summit/40 bg-summit/10 px-4 py-3 text-sm">
            Summit reached{summary.completedAt ? ` on ${formatDate(summary.completedAt)}` : ""}. Every topic on this trail
            is complete, and your certificate is ready.
          </p>
        ) : (
          <>
            <h3 className="mt-6 text-sm font-semibold">Up next</h3>
            <ul className="mt-1 divide-y">
              {upNext.map((topic) => (
                <li key={topic.id}>
                  <Link
                    to={`/track/${track.id}/topic/${topic.id}`}
                    className="-mx-2 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-accent"
                  >
                    <StatusDot status={progress[topic.id]?.status ?? "not-started"} />
                    <span className="text-sm font-medium">{topic.title}</span>
                    <span className="flex gap-4 font-mono text-xs text-muted-foreground">
                      <span className="hidden sm:inline">{levelLabels[topic.level]}</span>
                      <span className="w-14 whitespace-nowrap text-right">{formatMinutesCompact(topic.estMinutes)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
