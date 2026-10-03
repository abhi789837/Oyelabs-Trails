import type { CapstoneSummary, GoalInput, GoalInterpretResult, GoalSuggestion, LearnerGoal, OnboardSuggestion, OutcomeOption } from "@shared/goals";
import type { LearnerSetup } from "@shared/setup";

import { api } from "@/api/client";

/** v4.3 goals: the case library, Suggest, free-text reading, and a learner's goals and suggestions. */
export const goalsApi = {
  outcomes: (departmentId: string, q = "", signal?: AbortSignal) =>
    api.get<{ outcomes: OutcomeOption[] }>(`/api/admin/outcomes?departmentId=${encodeURIComponent(departmentId)}&q=${encodeURIComponent(q)}`, signal),
  suggest: (body: { departmentId: string; description: string; name?: string }, signal?: AbortSignal) =>
    api.post<{ suggestion: OnboardSuggestion; aiAvailable: boolean }>("/api/admin/onboard/suggest", body, signal),
  interpret: (body: { departmentId: string; text: string; userId?: string }, signal?: AbortSignal) =>
    api.post<GoalInterpretResult>("/api/admin/goals/interpret", body, signal),
  list: (userId: string, signal?: AbortSignal) =>
    api.get<{ goals: LearnerGoal[]; suggestions: GoalSuggestion[]; capstones?: Record<string, CapstoneSummary> }>(`/api/admin/users/${userId}/goals`, signal),
  save: (userId: string, goals: GoalInput[]) => api.put<{ goals: LearnerGoal[]; setup: LearnerSetup }>(`/api/admin/users/${userId}/goals`, { goals }),
  achieve: (userId: string, goalId: string) =>
    api.post<{ goals: LearnerGoal[]; suggestions: GoalSuggestion[]; capstones?: Record<string, CapstoneSummary> }>(`/api/admin/users/${userId}/goals/${goalId}/achieve`),
  addSuggestion: (userId: string, id: string) =>
    api.post<{ goal: LearnerGoal; goals: LearnerGoal[]; suggestions: GoalSuggestion[] }>(`/api/admin/users/${userId}/goal-suggestions/${id}/add`),
  dismissSuggestion: (userId: string, id: string) => api.post<{ suggestions: GoalSuggestion[] }>(`/api/admin/users/${userId}/goal-suggestions/${id}/dismiss`),
};
