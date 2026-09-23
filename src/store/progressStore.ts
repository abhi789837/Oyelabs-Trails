import { create } from "zustand";

import type { AttemptResult, ProgressResponse, TopicProgressValue } from "@shared/content";
import { QUIZ_PASS_THRESHOLD } from "@shared/content";

import { api, ApiRequestError } from "@/api/client";

export type TopicStatus = TopicProgressValue["status"];
export type TopicProgress = TopicProgressValue;

export { QUIZ_PASS_THRESHOLD };

export interface ProgressState {
  progress: Record<string, TopicProgress>;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;

  load: () => Promise<void>;
  reset: () => void;

  markInProgress: (topicId: string) => void;
  /** Applies a graded result from the server. Grading itself never happens in the browser. */
  applyAttempt: (topicId: string, result: AttemptResult) => void;

  getTrackCompletionPct: (topicIds: string[]) => number;
  /** Same calculation scoped to one module; the module is the meaningful unit of "done". */
  getModuleCompletionPct: (moduleId: string, topicIds: string[]) => number;
  isTrackComplete: (topicIds: string[]) => boolean;
}

export const EMPTY_PROGRESS: TopicProgress = { status: "not-started", bestScore: null, attempts: 0, completedAt: null };

/**
 * Progress lives on the server from v3 (brief §7.6), so it follows a person rather than a
 * browser, and the "a later failed retry never un-completes a topic" rule is enforced where it
 * cannot be edited.
 *
 * The store keeps the action surface it had in v2 — components call `markInProgress` and read
 * `progress[topicId]` exactly as before — and swaps `persist` for API calls. Writes are applied
 * optimistically so the UI stays responsive, then reconciled with what the server returns.
 */
export const useProgressStore = create<ProgressState>()((set, get) => ({
  progress: {},
  status: "idle",
  error: null,

  load: async () => {
    if (get().status === "loading") return;
    set({ status: "loading", error: null });
    try {
      const result = await api.get<ProgressResponse>("/api/me/progress");
      set({ progress: result.progress, status: "ready", error: null });
    } catch (error) {
      set({ status: "error", error: error instanceof ApiRequestError ? error.message : "Could not load your progress." });
    }
  },

  reset: () => set({ progress: {}, status: "idle", error: null }),

  markInProgress: (topicId) => {
    const current = get().progress[topicId];
    if (current && current.status !== "not-started") return;

    set((s) => ({ progress: { ...s.progress, [topicId]: { ...EMPTY_PROGRESS, ...current, status: "in-progress" } } }));

    // Fire and forget: the next load reconciles, and failing to record "started" is not worth
    // interrupting someone who is about to read a topic.
    void api.post("/api/me/progress/start", { topicId }).catch(() => undefined);
  },

  applyAttempt: (topicId, result) =>
    set((s) => {
      const current = s.progress[topicId] ?? EMPTY_PROGRESS;
      const completed = result.passed || current.status === "completed";
      return {
        progress: {
          ...s.progress,
          [topicId]: {
            status: completed ? "completed" : "in-progress",
            bestScore: Math.max(current.bestScore ?? 0, Math.round(result.score)),
            attempts: current.attempts + 1,
            completedAt: completed ? (current.completedAt ?? Date.now()) : null,
          },
        },
      };
    }),

  getTrackCompletionPct: (topicIds) => completionPct(get().progress, topicIds),

  // moduleId keeps call sites self-describing; the percentage only depends on the topic ids.
  getModuleCompletionPct: (_moduleId, topicIds) => completionPct(get().progress, topicIds),

  isTrackComplete: (topicIds) =>
    topicIds.length > 0 && topicIds.every((id) => get().progress[id]?.status === "completed"),
}));

export function completionPct(progress: Record<string, TopicProgress>, topicIds: string[]): number {
  if (topicIds.length === 0) return 0;
  const done = topicIds.filter((id) => progress[id]?.status === "completed").length;
  return Math.round((done / topicIds.length) * 100);
}
