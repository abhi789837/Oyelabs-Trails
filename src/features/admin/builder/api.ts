import type { LearnerPriorities, LearningPathView, SkillGapView } from "@shared/builder";
import type { IntentCoverageLine } from "@shared/intents";

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
  /** v4. Null = shown to every department. */
  departmentId: string | null;
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
  /** v4.4: in the shared library (visible to everyone). */
  library?: boolean;
  /** v4.4: one plain line saying why it failed its quality check. */
  reviewReason?: string | null;
  /** v4.4: how many times "Fix automatically" has run on it (at most `MAX_FIX_ATTEMPTS`). */
  fixAttempts?: number;
  /** v4.4: "Fix automatically" is working on it now. */
  fixing?: boolean;
}

/** v4.4: new courses waiting for the AI or web search to be connected. */
export interface WaitingSetup {
  count: number;
  problem: string;
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
    api.get<{ gaps: SkillGapView[]; path: LearningPathView | null; intents?: IntentCoverageLine[] }>(`/api/admin/users/${userId}/gaps`, signal),

  /** Runs the builder now rather than waiting for the next evaluation. */
  buildPath: (userId: string) => api.post<{ jobId: string }>(`/api/admin/users/${userId}/path`, {}),

  generated: (signal?: AbortSignal) =>
    api.get<{ courses: GeneratedCourseRow[]; waitingSetup?: WaitingSetup | null }>("/api/admin/generated-courses", signal),
  /** v4.4: rewrites the parts that failed the quality check, checks again, publishes on a pass. */
  fix: (courseId: string) =>
    api.post<{ jobId: string; waitingSetup: string | null }>(`/api/admin/generated-courses/${courseId}/fix`),
  /** v4.4: the global "publish new courses that pass the quality check" setting. */
  builderSettings: (signal?: AbortSignal) => api.get<{ autoPublish: boolean }>("/api/admin/builder/settings", signal),
  saveBuilderSettings: (body: { autoPublish: boolean }) => api.put<{ autoPublish: boolean }>("/api/admin/builder/settings", body),
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
