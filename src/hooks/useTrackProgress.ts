import { useMemo } from "react";

import { completionPct, EMPTY_PROGRESS, useProgressStore, type TopicProgress } from "@/store/progressStore";
import type { Topic, Track } from "@/types/curriculum-v1";

export interface TrackProgressSummary {
  completed: number;
  total: number;
  pct: number;
  isComplete: boolean;
  /** First topic (in trail order) that isn't completed yet. */
  nextTopic?: Topic;
  /** Whether the learner has touched any topic in this track. */
  started: boolean;
  /** Most recent completion date across the track, once every topic is done. */
  completedAt?: string;
}

export function summarizeTrack(track: Track, progress: Record<string, TopicProgress>): TrackProgressSummary {
  const ids = track.topics.map((t) => t.id);
  const completedTopics = track.topics.filter((t) => progress[t.id]?.status === "completed");
  const isComplete = completedTopics.length === track.topics.length && track.topics.length > 0;
  const completedAt = isComplete
    ? completedTopics
        .map((t) => progress[t.id]?.completedAt ?? "")
        .sort()
        .at(-1)
    : undefined;

  return {
    completed: completedTopics.length,
    total: track.topics.length,
    pct: completionPct(progress, ids),
    isComplete,
    nextTopic: track.topics.find((t) => progress[t.id]?.status !== "completed"),
    started: track.topics.some((t) => (progress[t.id]?.status ?? "not-started") !== "not-started"),
    completedAt,
  };
}

export function useTrackProgress(track: Track): TrackProgressSummary {
  const progress = useProgressStore((s) => s.progress);
  return useMemo(() => summarizeTrack(track, progress), [track, progress]);
}

export function useTopicProgress(topicId: string): TopicProgress {
  return useProgressStore((s) => s.progress[topicId]) ?? EMPTY_PROGRESS;
}
