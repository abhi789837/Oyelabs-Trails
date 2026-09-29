import type { LearnerPriorities, LearningPathView, SkillGapView } from "@shared/builder";

import type { LearnerTarget, LearnerTrack, TargetsRequest } from "@shared/targets";

import { api } from "@/api/client";

/** What `GET /targets` returns: the profile half and the list, in one read. */
export interface LearnerFocusView {
  track: LearnerTrack | null;
  stack: string | null;
  yearsExperience: number | null;
  selfLevel: number | null;
  targets: LearnerTarget[];
}

/** One row of the generated-courses list. */
export interface GeneratedCourseRow {
  courseId: string;
  title: string;
  summary: string;
  skill: string;
  scope: "learner" | "global";
  status: "draft" | "pending_review" | "published" | "rejected" | "needs_review";
  reviewScore: number | null;
  promptVersion: string;
  learnerName: string | null;
  topicCount: number;
  /** How many of its cited links stopped resolving. Set by the weekly check. */
  deadLinks: number;
  published: boolean;
  createdAt: number;
}

export interface ResearchSettings {
  provider: "tavily" | "brave" | "serper" | null;
  searchHint: string | null;
  youtubeHint: string | null;
  budgetTokens: number;
  budgetSearches: number;
  configured: boolean;
  updatedAt: number | null;
}

/** The AI course builder, from the admin console. */
export const builderApi = {
  getPriorities: (userId: string, signal?: AbortSignal) =>
    api.get<{ priorities: LearnerPriorities }>(`/api/admin/users/${userId}/priorities`, signal),
  /**
   * Saves the priorities, and says whether their current week no longer matches them.
   *
   * Saving does not rebuild the week on its own: quietly reshaping somebody's Tuesday because an admin
   * adjusted a weight is a surprise, and the admin may be halfway through a larger edit. The prompt
   * puts the decision where it belongs.
   */
  setPriorities: (userId: string, priorities: LearnerPriorities) =>
    api.put<{ priorities: LearnerPriorities; weekNeedsRegeneration: boolean }>(
      `/api/admin/users/${userId}/priorities`,
      priorities,
    ),

  /**
   * The track, the stack and the ordered targets.
   *
   * Separate from `setPriorities`, which it is taking over from: that one still owns the builder's
   * own settings (the cap, auto-publish), and splitting them stops the onboarding form and the
   * builder settings overwriting each other's fields.
   */
  getTargets: (userId: string, signal?: AbortSignal) =>
    api.get<{ focus: LearnerFocusView }>(`/api/admin/users/${userId}/targets`, signal),

  setTargets: (userId: string, body: TargetsRequest) =>
    api.put<{ focus: LearnerFocusView; weekNeedsRegeneration: boolean }>(`/api/admin/users/${userId}/targets`, body),

  gaps: (userId: string, signal?: AbortSignal) =>
    api.get<{ gaps: SkillGapView[]; path: LearningPathView | null }>(`/api/admin/users/${userId}/gaps`, signal),

  /** Runs the builder now rather than waiting for the next evaluation. */
  buildPath: (userId: string) => api.post<{ jobId: string }>(`/api/admin/users/${userId}/path`, {}),

  generated: (signal?: AbortSignal) =>
    api.get<{ courses: GeneratedCourseRow[] }>("/api/admin/generated-courses", signal),
  decide: (courseId: string, decision: "approve" | "reject") =>
    api.post<{ ok: true }>(`/api/admin/generated-courses/${courseId}/decision`, { decision }),
  promote: (courseId: string) => api.post<{ ok: true }>(`/api/admin/generated-courses/${courseId}/promote`),

  research: (signal?: AbortSignal) => api.get<{ settings: ResearchSettings }>("/api/admin/research", signal),
  saveResearch: (body: {
    provider?: "tavily" | "brave" | "serper" | null;
    searchKey?: string;
    youtubeKey?: string;
    budgetTokens?: number;
    budgetSearches?: number;
  }) => api.put<{ settings: ResearchSettings }>("/api/admin/research", body),
  checkLinks: () => api.post<{ jobId: string }>("/api/admin/research/check-links"),
};
