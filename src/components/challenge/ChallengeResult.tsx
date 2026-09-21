import { forwardRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { getTopicNeighbors, getTrackById } from "@/data/tracks";
import { useTrackProgress } from "@/hooks/useTrackProgress";
import { accentClasses } from "@/lib/accent";
import { cn } from "@/lib/utils";
import { QUIZ_PASS_THRESHOLD } from "@/store/progressStore";
import type { Topic } from "@/types/curriculum-v1";

interface ChallengeResultProps {
  topic: Topic;
  passed: boolean;
  score: number;
  /** One line explaining the score, e.g. "4 of 5 correct". */
  detail: string;
  retryLabel: string;
  onRetry: () => void;
}

/** Shared pass/fail panel for quizzes and code challenges. */
export const ChallengeResult = forwardRef<HTMLDivElement, ChallengeResultProps>(function ChallengeResult(
  { topic, passed, score, detail, retryLabel, onRetry },
  ref,
) {
  const reduceMotion = useReducedMotion();
  const track = getTrackById(topic.trackId)!;
  const trackProgress = useTrackProgress(track);
  const { next } = getTopicNeighbors(topic);
  const accent = accentClasses[track.accentToken];
  const requirement =
    topic.challengeType === "quiz" ? `You need ${QUIZ_PASS_THRESHOLD}% to pass.` : "Every test needs to pass.";

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col gap-5 rounded-md border px-5 py-5 outline-none sm:flex-row sm:items-start",
        passed ? "border-summit/40 bg-summit/[0.07]" : "border-trailmark/50 bg-trailmark/[0.07]",
      )}
    >
      {passed ? (
        // The single success moment: one checkmark scaling in. No confetti.
        <motion.span
          initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-summit text-summit-foreground"
          aria-hidden="true"
        >
          <Check className="h-6 w-6" strokeWidth={3} />
        </motion.span>
      ) : (
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-trailmark text-trailmark-strong"
          aria-hidden="true"
        >
          <RotateCcw className="h-5 w-5" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-semibold">
          {passed ? "Waypoint complete" : "Not there yet"}
          <span className="ml-2 font-mono text-sm font-normal tabular text-muted-foreground">{score}%</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {detail}.{" "}
          {passed
            ? trackProgress.isComplete
              ? `That finishes the ${track.name} trail. Your certificate is ready.`
              : "This topic is marked complete on your trail."
            : `${requirement} Every attempt counts toward practice, so have another go.`}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {passed ? (
            <>
              {trackProgress.isComplete ? (
                <Button asChild className={cn(accent.solid, "h-auto min-h-10 whitespace-normal py-2 text-left")}>
                  <Link to={`/report/${track.id}`}>View certificate</Link>
                </Button>
              ) : next ? (
                <Button asChild className={cn(accent.solid, "h-auto min-h-10 whitespace-normal py-2 text-left")}>
                  <Link to={`/track/${track.id}/topic/${next.id}`}>Next topic: {next.title}</Link>
                </Button>
              ) : trackProgress.nextTopic ? (
                <Button asChild className={cn(accent.solid, "h-auto min-h-10 whitespace-normal py-2 text-left")}>
                  <Link to={`/track/${track.id}/topic/${trackProgress.nextTopic.id}`}>
                    Go to unfinished topic: {trackProgress.nextTopic.title}
                  </Link>
                </Button>
              ) : null}
              <Button asChild variant="outline">
                <Link to={`/track/${track.id}`}>Back to trail map</Link>
              </Button>
            </>
          ) : (
            <Button onClick={onRetry}>{retryLabel}</Button>
          )}
        </div>
      </div>
    </div>
  );
});
