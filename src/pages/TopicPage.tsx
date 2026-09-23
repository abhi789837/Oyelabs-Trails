import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";

import { ChallengeRunner } from "@/components/challenge/ChallengeRunner";
import { RichText } from "@/components/content/RichText";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ReferenceList } from "@/components/trail/ReferenceList";
import { TopicStatusBadge } from "@/components/trail/TopicStatusBadge";
import { VideoPlayer } from "@/components/trail/VideoPlayer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { findTopic, modulePath, topicNeighbors, topicPath, type ModuleMeta, type TopicMeta, type TrackMeta } from "@/content";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useModuleContent } from "@/hooks/useModuleContent";
import { useTopicProgress } from "@/hooks/useTrackProgress";
import { accentClasses } from "@/lib/accent";
import { levelLabels } from "@/lib/track-meta";
import { cn, formatMinutes } from "@/lib/utils";
import { QUIZ_PASS_THRESHOLD, useProgressStore } from "@/store/progressStore";
import type { ServedTopic } from "@shared/content";
import NotFoundPage from "./NotFoundPage";

export default function TopicPage() {
  const { trackId, moduleId, topicId } = useParams();
  const found = findTopic(topicId);
  useDocumentTitle(found?.topic.title ?? "Off trail");

  if (!found) return <NotFoundPage />;
  if (found.track.id !== trackId || found.module.id !== moduleId) return <Navigate to={topicPath(found.topic)} replace />;

  // Keyed so switching topics remounts cleanly (fresh challenge state, fresh mount effect).
  return <TopicScreen key={found.topic.id} track={found.track} module={found.module} meta={found.topic} />;
}

/** Old v1 URLs (/track/:trackId/topic/:topicId) redirect to the module-scoped route. */
export function LegacyTopicRedirect() {
  const { topicId } = useParams();
  const found = findTopic(topicId);
  return found ? <Navigate to={topicPath(found.topic)} replace /> : <NotFoundPage />;
}

function TopicScreen({ track, module, meta }: { track: TrackMeta; module: ModuleMeta; meta: TopicMeta }) {
  const content = useModuleContent(track.id, module.id);
  const progress = useTopicProgress(meta.id);
  const markInProgress = useProgressStore((s) => s.markInProgress);
  const { prev, next } = topicNeighbors(meta.id);
  const index = module.topics.findIndex((t) => t.id === meta.id);
  const accent = accentClasses[track.accentToken];

  useEffect(() => {
    markInProgress(meta.id);
  }, [markInProgress, meta.id]);

  const topic = content.status === "ready" ? content.module.topics.find((t) => t.id === meta.id) : undefined;


  return (
    <article className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-8">
      <Breadcrumbs
        items={[
          { label: "Dashboard", to: "/" },
          { label: track.name, to: `/track/${track.id}` },
          { label: module.name, to: modulePath(module) },
          { label: meta.title },
        ]}
      />

      <header className="mt-8 max-w-3xl">
        <p className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
          <span aria-hidden="true" className={cn("h-3.5 w-1 rounded-[1px]", accent.bg)} />
          Waypoint {index + 1} of {module.topics.length} in {module.name}
          <span className="text-foreground/40">/</span>
          <span>{meta.id}</span>
        </p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{meta.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="outline">{levelLabels[meta.level]}</Badge>
          <Badge variant="outline">{formatMinutes(meta.estMinutes)}</Badge>
          {meta.isMilestone && <Badge variant="default">Milestone</Badge>}
          <TopicStatusBadge progress={progress} />
        </div>
      </header>

      {content.status === "loading" && (
        <div className="mt-10 flex items-center gap-3 text-sm text-muted-foreground" role="status">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading this topic…
        </div>
      )}
      {content.status === "error" && (
        <div className="mt-10 rounded-md border border-destructive/40 px-4 py-4 text-sm">
          <p className="font-medium">This topic couldn't be loaded.</p>
          <p className="mt-1 text-muted-foreground">Check your connection, then reload the page.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
            Reload the page
          </Button>
        </div>
      )}

      {topic && <TopicBody topic={topic} />}

      {topic && (
        <section aria-labelledby="challenge-heading" className="mt-14 max-w-3xl border-t pt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="challenge-heading" className="text-xl font-semibold">
              {topic.challengeType === "quiz" ? "Checkpoint quiz" : "Coding challenge"}
            </h2>
            {progress.attempts > 0 && (
              <span className="font-mono text-xs text-muted-foreground">
                {progress.attempts} {progress.attempts === 1 ? "attempt" : "attempts"}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {topic.challengeType === "quiz"
              ? `${topic.quiz?.length ?? 0} questions. Score ${QUIZ_PASS_THRESHOLD}% or more to complete this topic.`
              : `${(topic.codeChallenge?.visibleTests.length ?? 0) + (topic.codeChallenge?.hiddenTestCount ?? 0)} tests, including hidden ones. Every test must pass to complete this topic.`}
          </p>
          <div className="mt-6">
            <ChallengeRunner topic={topic} />
          </div>
        </section>
      )}

      <nav aria-label="Topic navigation" className="mt-14 grid max-w-3xl gap-3 border-t pt-8 sm:grid-cols-2">
        {prev ? (
          <NeighborLink
            to={topicPath(prev)}
            direction={prev.moduleId === module.id ? "Previous topic" : "Previous topic, in the last camp"}
            title={prev.title}
          />
        ) : (
          <NeighborLink to={`/track/${track.id}`} direction="Back to" title={`${track.name} trail map`} />
        )}
        {next ? (
          <NeighborLink
            to={topicPath(next)}
            direction={next.moduleId === module.id ? "Next topic" : "Next camp begins with"}
            title={next.title}
            alignEnd
          />
        ) : (
          <NeighborLink to={`/report/${track.id}`} direction="End of the trail" title="Summit and certificate" alignEnd />
        )}
      </nav>
    </article>
  );
}

function TopicBody({ topic }: { topic: ServedTopic }) {
  return (
    <>
      <section aria-label="Video" className="mt-8">
        <VideoPlayer video={topic.video} alternates={topic.alternateVideos} />
      </section>

      <section aria-labelledby="summary-heading" className="mt-10 max-w-3xl">
        <h2 id="summary-heading" className="sr-only">
          Summary
        </h2>
        <RichText text={topic.summary} size="base" className="max-w-prose text-[1.0625rem] leading-[1.75]" />
      </section>

      <section aria-labelledby="references-heading" className="mt-10 max-w-3xl">
        <h2 id="references-heading" className="text-sm font-semibold">
          Read
        </h2>
        <div className="mt-2">
          <ReferenceList refs={topic.webRefs} />
        </div>
      </section>
    </>
  );
}

function NeighborLink({ to, direction, title, alignEnd }: { to: string; direction: string; title: string; alignEnd?: boolean }) {
  return (
    <Link
      to={to}
      className={cn("rounded-md border px-4 py-3 transition-colors hover:border-foreground/30 hover:bg-surface", alignEnd && "sm:text-right")}
    >
      <span className="block text-xs text-muted-foreground">{direction}</span>
      <span className="mt-0.5 block font-display font-semibold">{title}</span>
    </Link>
  );
}
