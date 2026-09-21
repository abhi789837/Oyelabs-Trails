import { Link } from "react-router-dom";

import { Contours } from "@/components/trail/Contours";
import { ElevationProfile } from "@/components/trail/ElevationProfile";
import { StatusDot } from "@/components/trail/StatusDot";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { allTopics, findTopic, modulePath, topicPath, trackMinutes, trackTopics, tracks, type TrackMeta } from "@/content";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { summarizeModule, summarizeTrack } from "@/hooks/useTrackProgress";
import { accentClasses } from "@/lib/accent";
import { levelLabels } from "@/lib/track-meta";
import { cn, formatDate, formatMinutes, formatMinutesCompact } from "@/lib/utils";
import { useProgressStore, type TopicProgress } from "@/store/progressStore";

export default function DashboardPage() {
  useDocumentTitle();
  const progress = useProgressStore((s) => s.progress);
  const resetAll = useProgressStore((s) => s.resetAll);

  const topics = allTopics();
  const completed = topics.filter((t) => progress[t.id]?.status === "completed").length;
  const overallPct = topics.length ? Math.round((completed / topics.length) * 100) : 0;
  const camps = tracks.reduce((n, t) => n + t.modules.length, 0);
  const totalMinutes = tracks.reduce((n, t) => n + trackMinutes(t), 0);

  const handleResetAll = () => {
    if (window.confirm("Reset progress on every trail? Completed topics, scores and attempts will be cleared from this browser.")) {
      resetAll();
    }
  };

  return (
    <div>
      <section className="relative overflow-hidden border-b">
        <Contours className="text-foreground/[0.07]" seed={2} />
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-8 sm:pt-20">
          <h1 className="text-2xl font-bold sm:text-3xl">Oyelabs Trails</h1>
          <p className="mt-3 max-w-prose text-lg text-muted-foreground">
            Four long trails through the stack Oyelabs ships with, deep enough for your first year and your tenth. Watch,
            read, then prove it on interview-level challenges, camp by camp.
          </p>

          <dl className="mt-10 grid max-w-2xl grid-cols-2 border-y sm:grid-cols-4">
            <Stat label="Camps" value={String(camps)} />
            <Stat label="Topics" value={String(topics.length)} className="border-l pl-4 sm:pl-6" />
            <Stat label="Completed" value={String(completed)} className="border-t pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-4" />
            <Stat label="Overall progress" value={`${overallPct}%`} className="border-l border-t pl-4 pt-4 sm:border-t-0 sm:pl-6" />
          </dl>
          <Progress value={overallPct} className="mt-4 h-1 max-w-2xl" indicatorClassName="bg-summit" aria-label={`Overall progress: ${overallPct}%`} />
          <p className="mt-3 font-mono text-xs text-muted-foreground">About {Math.round(totalMinutes / 60)} hours of material in total.</p>
          <ResumeLink progress={progress} />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        {tracks.map((track) => (
          <TrackSection key={track.id} track={track} progress={progress} />
        ))}
      </div>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>Progress is saved in this browser only. Clearing site data or switching devices starts you fresh.</p>
          {Object.keys(progress).length > 0 && (
            <Button variant="link" size="sm" className="h-auto justify-start px-0 text-xs text-muted-foreground" onClick={handleResetAll}>
              Reset all progress
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex flex-col-reverse py-4", className)}>
      <dt className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</dt>
      <dd className="font-display text-xl font-semibold tabular sm:text-2xl">{value}</dd>
    </div>
  );
}

/** Picks up the most recently started, unfinished topic, if there is one. */
function ResumeLink({ progress }: { progress: Record<string, TopicProgress> }) {
  const inProgress = Object.entries(progress).filter(([, p]) => p.status === "in-progress");
  const last = inProgress.at(-1);
  const found = last ? findTopic(last[0]) : undefined;
  if (!found) return null;
  return (
    <p className="mt-6 text-sm">
      <span className="text-muted-foreground">Pick up where you left off: </span>
      <Link to={topicPath(found.topic)} className="font-medium underline decoration-trailmark decoration-2 underline-offset-4">
        {found.topic.title}
      </Link>
      <span className="text-muted-foreground"> in {found.module.name}</span>
    </p>
  );
}

function TrackSection({ track, progress }: { track: TrackMeta; progress: Record<string, TopicProgress> }) {
  const summary = summarizeTrack(track, progress);
  const accent = accentClasses[track.accentToken];
  const topics = trackTopics(track);
  const upNext = topics.filter((t) => progress[t.id]?.status !== "completed").slice(0, 4);
  const nextCamp = track.modules.find((m) => m.available && !summarizeModule(m, progress).isComplete);
  const campsDone = track.modules.filter((m) => m.available && summarizeModule(m, progress).isComplete).length;
  const headingId = `track-${track.id}-heading`;

  const cta = summary.isComplete
    ? { label: "View certificate", to: `/report/${track.id}` }
    : summary.nextTopic
      ? { label: summary.started ? "Continue trail" : "Start trail", to: topicPath(summary.nextTopic) }
      : null;

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
            <dt className="sr-only">Camps</dt>
            <dd>{track.modules.length} camps</dd>
          </div>
          <div>
            <dt className="sr-only">Topics</dt>
            <dd>{topics.length} topics</dd>
          </div>
          <div>
            <dt className="sr-only">Estimated time</dt>
            <dd>{formatMinutes(trackMinutes(track))}</dd>
          </div>
        </dl>

        <div className="mt-6">
          <div className="flex items-baseline justify-between text-sm">
            <span>
              {summary.completed} of {summary.total} topics, {campsDone} of {track.modules.length} camps
            </span>
            <span className="font-mono tabular text-muted-foreground">{summary.pct}%</span>
          </div>
          <Progress value={summary.pct} className="mt-2 h-2" indicatorClassName={accent.bg} aria-label={`${track.name} progress: ${summary.pct}%`} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {cta && (
            <Button asChild className={accent.solid}>
              <Link to={cta.to}>{cta.label}</Link>
            </Button>
          )}
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
            Summit reached{summary.completedAt ? ` on ${formatDate(summary.completedAt)}` : ""}. Every camp on this trail is
            complete, and your certificate is ready.
          </p>
        ) : topics.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">This trail's camps are still being written.</p>
        ) : (
          <>
            {nextCamp && (
              <p className="mt-6 text-sm">
                <span className="text-muted-foreground">Current camp: </span>
                <Link to={modulePath(nextCamp)} className="font-medium hover:underline">
                  {nextCamp.name}
                </Link>
              </p>
            )}
            <h3 className="mt-4 text-sm font-semibold">Up next</h3>
            <ul className="mt-1 divide-y">
              {upNext.map((topic) => (
                <li key={topic.id}>
                  <Link
                    to={topicPath(topic)}
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
