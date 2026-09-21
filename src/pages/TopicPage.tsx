import { useEffect } from "react";
import { Navigate, Link, useParams } from "react-router-dom";

import { ChallengeRunner } from "@/components/challenge/ChallengeRunner";
import { ReferenceCard } from "@/components/trail/ReferenceCard";
import { TopicStatusBadge } from "@/components/trail/TopicStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTopicById, getTopicNeighbors, getTrackById } from "@/data/tracks";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useTopicProgress } from "@/hooks/useTrackProgress";
import { accentClasses } from "@/lib/accent";
import { levelLabels } from "@/lib/track-meta";
import { cn, formatMinutes } from "@/lib/utils";
import { QUIZ_PASS_THRESHOLD, useProgressStore } from "@/store/progressStore";
import type { Topic, Track } from "@/types/curriculum-v1";
import NotFoundPage from "./NotFoundPage";

export default function TopicPage() {
  const { trackId, topicId } = useParams();
  const topic = topicId ? getTopicById(topicId) : undefined;
  const track = topic ? getTrackById(topic.trackId) : undefined;
  useDocumentTitle(topic?.title ?? "Off trail");

  if (!topic || !track) return <NotFoundPage />;
  if (topic.trackId !== trackId) return <Navigate to={`/track/${topic.trackId}/topic/${topic.id}`} replace />;

  // Keyed so switching topics remounts cleanly (fresh challenge state, fresh mount effect).
  return <TopicDetail key={topic.id} topic={topic} track={track} />;
}

function TopicDetail({ topic, track }: { topic: Topic; track: Track }) {
  const progress = useTopicProgress(topic.id);
  const markInProgress = useProgressStore((s) => s.markInProgress);
  const resetTopic = useProgressStore((s) => s.resetTopic);
  const { prev, next } = getTopicNeighbors(topic);
  const index = track.topics.findIndex((t) => t.id === topic.id);
  const accent = accentClasses[track.accentToken];

  useEffect(() => {
    markInProgress(topic.id);
  }, [markInProgress, topic.id]);

  const challengeDescription =
    topic.challengeType === "quiz"
      ? `${topic.quiz?.length ?? 0} questions. Score ${QUIZ_PASS_THRESHOLD}% or more to complete this topic.`
      : `${topic.codeChallenge?.testCases.length ?? 0} tests. Every test must pass to complete this topic.`;

  const handleReset = () => {
    if (window.confirm(`Reset your progress on "${topic.title}"? Your attempts and best score will be cleared.`)) {
      resetTopic(topic.id);
    }
  };

  return (
    <article className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-8">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <li>
            <Link to="/" className="hover:text-foreground hover:underline">
              Dashboard
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to={`/track/${track.id}`} className="hover:text-foreground hover:underline">
              {track.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground">
            {topic.title}
          </li>
        </ol>
      </nav>

      <header className="mt-8">
        <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span aria-hidden="true" className={cn("h-3.5 w-1 rounded-[1px]", accent.bg)} />
          Waypoint {index + 1} of {track.topics.length}
          <span className="text-foreground/40">/</span>
          <span>{topic.id}</span>
        </p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{topic.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="outline">{levelLabels[topic.level]}</Badge>
          <Badge variant="outline">{formatMinutes(topic.estMinutes)}</Badge>
          {topic.isMilestone && <Badge variant="default">Milestone</Badge>}
          <TopicStatusBadge progress={progress} />
        </div>
      </header>

      <p className="mt-6 max-w-prose text-lg leading-relaxed">{topic.summary}</p>

      <section aria-labelledby="references-heading" className="mt-8">
        <h2 id="references-heading" className="sr-only">
          References
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ReferenceCard kind="read" resource={topic.webRef} />
          <ReferenceCard kind="watch" resource={topic.videoRef} />
        </div>
      </section>

      <section aria-labelledby="challenge-heading" className="mt-12 border-t pt-8">
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
        <p className="mt-1 text-sm text-muted-foreground">{challengeDescription}</p>
        <div className="mt-6">
          <ChallengeRunner topic={topic} />
        </div>
        {progress.attempts > 0 && (
          <Button variant="link" size="sm" className="mt-4 px-0 text-muted-foreground" onClick={handleReset}>
            Reset progress for this topic
          </Button>
        )}
      </section>

      <nav aria-label="Topic navigation" className="mt-14 grid gap-3 border-t pt-8 sm:grid-cols-2">
        {prev ? (
          <NeighborLink to={`/track/${track.id}/topic/${prev.id}`} direction="Previous topic" title={prev.title} />
        ) : (
          <NeighborLink to={`/track/${track.id}`} direction="Back to" title={`${track.name} trail map`} />
        )}
        {next ? (
          <NeighborLink to={`/track/${track.id}/topic/${next.id}`} direction="Next topic" title={next.title} alignEnd />
        ) : (
          <NeighborLink to={`/report/${track.id}`} direction="End of the trail" title="Summit and certificate" alignEnd />
        )}
      </nav>
    </article>
  );
}

function NeighborLink({
  to,
  direction,
  title,
  alignEnd,
}: {
  to: string;
  direction: string;
  title: string;
  alignEnd?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "rounded-md border px-4 py-3 transition-colors hover:border-foreground/30 hover:bg-surface",
        alignEnd && "sm:text-right",
      )}
    >
      <span className="block text-xs text-muted-foreground">{direction}</span>
      <span className="mt-0.5 block font-display font-semibold">{title}</span>
    </Link>
  );
}
