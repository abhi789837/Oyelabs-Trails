import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TopicStatus = "not-started" | "in-progress" | "completed";

export type TopicProgress = {
  status: TopicStatus;
  bestScore?: number;
  completedAt?: string;
  attempts: number;
};

export interface ProgressState {
  progress: Record<string, TopicProgress>;
  markInProgress: (topicId: string) => void;
  recordAttempt: (topicId: string, passed: boolean, score?: number) => void;
  resetTopic: (topicId: string) => void;
  resetAll: () => void;
  getTrackCompletionPct: (topicIds: string[]) => number;
  /** Same calculation scoped to one module; with ~290 topics the module is the unit of "done". */
  getModuleCompletionPct: (moduleId: string, topicIds: string[]) => number;
  isTrackComplete: (topicIds: string[]) => boolean;
}

export const EMPTY_PROGRESS: TopicProgress = { status: "not-started", attempts: 0 };

/** Quizzes pass at 80%; code challenges only pass when every test passes. */
export const QUIZ_PASS_THRESHOLD = 80;

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: {},

      markInProgress: (topicId) => {
        const current = get().progress[topicId];
        if (current && current.status !== "not-started") return;
        set((s) => ({
          progress: { ...s.progress, [topicId]: { ...EMPTY_PROGRESS, ...current, status: "in-progress" } },
        }));
      },

      recordAttempt: (topicId, passed, score) =>
        set((s) => {
          const current = s.progress[topicId] ?? EMPTY_PROGRESS;
          const bestScore =
            score === undefined ? current.bestScore : Math.max(current.bestScore ?? 0, Math.round(score));
          // Once a topic is completed, a later failed retry never takes that away.
          const completed = passed || current.status === "completed";
          return {
            progress: {
              ...s.progress,
              [topicId]: {
                status: completed ? "completed" : "in-progress",
                attempts: current.attempts + 1,
                bestScore,
                completedAt: completed ? (current.completedAt ?? new Date().toISOString()) : undefined,
              },
            },
          };
        }),

      resetTopic: (topicId) =>
        set((s) => {
          const { [topicId]: _removed, ...rest } = s.progress;
          return { progress: rest };
        }),

      resetAll: () => set({ progress: {} }),

      getTrackCompletionPct: (topicIds) => completionPct(get().progress, topicIds),

      // moduleId is part of the brief's signature and keeps call sites self-describing; the
      // percentage itself only depends on the module's topic ids.
      getModuleCompletionPct: (_moduleId, topicIds) => completionPct(get().progress, topicIds),

      isTrackComplete: (topicIds) =>
        topicIds.length > 0 && topicIds.every((id) => get().progress[id]?.status === "completed"),
    }),
    { name: "oyelabs-progress", version: 1 },
  ),
);

export function completionPct(progress: Record<string, TopicProgress>, topicIds: string[]): number {
  if (topicIds.length === 0) return 0;
  const done = topicIds.filter((id) => progress[id]?.status === "completed").length;
  return Math.round((done / topicIds.length) * 100);
}
