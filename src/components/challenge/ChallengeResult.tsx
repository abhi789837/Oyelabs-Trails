import { forwardRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { findTopic, modulePath, topicNeighbors, topicPath } from "@/content";
import { summarizeModule, summarizeTrack } from "@/hooks/useTrackProgress";
import { accentClasses } from "@/lib/accent";
import { cn } from "@/lib/utils";
import { QUIZ_PASS_THRESHOLD, useProgressStore } from "@/store/progressStore";
import type { Topic } from "@/types/curriculum";

interface ChallengeResultProps {
  topic: Topic;
  passed: boolean;
  score: number;
  /** One line explaining the score, e.g. "4 of 5 correct". */
  detail: string;
  retryLabel: string;
  onRetry: () => void;
}

const wrap = "h-auto min-h-10 whitespace-normal py-2 text-left";

/** Shared pass/fail panel for quizzes and code challenges. */
export const ChallengeResult = forwardRef<HTMLDivElement, ChallengeResultProps>(function ChallengeResult(
  { topic, passed, score, detail, retryLabel, onRetry },
  ref,
) {
  const reduceMotion = useReducedMotion();
  const progress = useProgressStore((s) => s.progress);
  const found = findTopic(topic.id);
  if (!found) return null;
  const { track, module } = found;
  const trackDone = summarizeTrack(track, progress);
  const moduleDone = summarizeModule(module, progress);
  const { next } = topicNeighbors(topic.id);
  const accent = accentClasses[track.accentToken];
  const requirement =
    topic.challengeType === "quiz" ? `You need ${QUIZ_PASS_THRESHOLD}% to pass.` : "Every test needs to pass.";

  const passMessage = trackDone.isComplete
    ? `That finishes the ${track.name} trail. Your certificate is ready.`
    : moduleDone.isComplete
      ? `That completes the ${module.name.replace(/^The /, "")} camp.`
      : "This topic is marked complete on your trail.";

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
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-trailmark text-trailmark-strong" aria-hidden="true">
          <RotateCcw className="h-5 w-5" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-semibold">
          {passed ? "Waypoint complete" : "Not there yet"}
          <span className="ml-2 font-mono text-sm font-normal tabular text-muted-foreground">{score}%</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {detail}. {passed ? passMessage : `${requirement} Read the explanations, then have another go.`}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {passed ? (
            <>
              {trackDone.isComplete ? (
                <Button asChild className={cn(accent.solid, wrap)}>
                  <Link to={`/report/${track.id}`}>View certificate</Link>
                </Button>
              ) : next ? (
                <Button asChild className={cn(accent.solid, wrap)}>
                  <Link to={topicPath(next)}>Next topic: {next.title}</Link>
                </Button>
              ) : trackDone.nextTopic ? (
                <Button asChild className={cn(accent.solid, wrap)}>
                  <Link to={topicPath(trackDone.nextTopic)}>Go to unfinished topic: {trackDone.nextTopic.title}</Link>
                </Button>
              ) : null}
              <Button asChild variant="outline">
                <Link to={modulePath(module)}>Back to the camp</Link>
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
