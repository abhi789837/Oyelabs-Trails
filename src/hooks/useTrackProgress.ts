import { useMemo } from "react";

import { trackTopics, type ModuleMeta, type TopicMeta, type TrackMeta } from "@/content";
import { completionPct, EMPTY_PROGRESS, useProgressStore, type TopicProgress } from "@/store/progressStore";

export interface ProgressSummary {
  completed: number;
  total: number;
  pct: number;
  isComplete: boolean;
  /** First topic (in trail order) that isn't completed yet. */
  nextTopic?: TopicMeta;
  /** Whether the learner has touched any topic here. */
  started: boolean;
  /** Most recent completion time (epoch ms), once everything is done. */
  completedAt?: number;
}

function summarize(topics: TopicMeta[], progress: Record<string, TopicProgress>): ProgressSummary {
  const done = topics.filter((t) => progress[t.id]?.status === "completed");
  const isComplete = topics.length > 0 && done.length === topics.length;
  return {
    completed: done.length,
    total: topics.length,
    pct: completionPct(
      progress,
      topics.map((t) => t.id),
    ),
    isComplete,
    nextTopic: topics.find((t) => progress[t.id]?.status !== "completed"),
    started: topics.some((t) => (progress[t.id]?.status ?? "not-started") !== "not-started"),
    completedAt: isComplete
      ? done.reduce((latest, t) => Math.max(latest, progress[t.id]?.completedAt ?? 0), 0)
      : undefined,
  };
}

export function summarizeTrack(track: TrackMeta, progress: Record<string, TopicProgress>) {
  return summarize(trackTopics(track), progress);
}

export function summarizeModule(module: ModuleMeta, progress: Record<string, TopicProgress>) {
  return summarize(module.topics, progress);
}

export function useTrackProgress(track: TrackMeta): ProgressSummary {
  const progress = useProgressStore((s) => s.progress);
  return useMemo(() => summarizeTrack(track, progress), [track, progress]);
}

export function useModuleProgress(module: ModuleMeta): ProgressSummary {
  const progress = useProgressStore((s) => s.progress);
  return useMemo(() => summarizeModule(module, progress), [module, progress]);
}

export function useTopicProgress(topicId: string): TopicProgress {
  return useProgressStore((s) => s.progress[topicId]) ?? EMPTY_PROGRESS;
}
