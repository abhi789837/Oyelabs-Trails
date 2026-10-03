import type { LearnerGoalView } from "@shared/goals";
import type { LearnerTask, Task, TaskResponse } from "@shared/tasks";

import { api } from "@/api/client";

export type CapstoneView =
  | { goal: LearnerGoalView; capstone: { kind: "task"; title: string; task: LearnerTask } }
  | { goal: LearnerGoalView; capstone: { kind: "topic"; title: string; topicId: string } };

export interface CapstoneAttemptResult {
  score: number | null;
  passed: boolean;
  achieved: boolean;
  detail: string[];
  feedback: string | null;
  message: string | null;
  review: Task | null;
}

/** v4.3: the learner's goals and their capstones. */
export const myGoalsApi = {
  list: (signal?: AbortSignal) => api.get<{ goals: LearnerGoalView[] }>("/api/me/goals", signal),
  capstone: (goalId: string, signal?: AbortSignal) => api.get<CapstoneView>(`/api/me/goals/${encodeURIComponent(goalId)}/capstone`, signal),
  attempt: (goalId: string, response: TaskResponse) => api.post<CapstoneAttemptResult>(`/api/me/goals/${encodeURIComponent(goalId)}/capstone/attempt`, { response }),
};
