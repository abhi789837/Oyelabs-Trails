import type { Skill } from "@shared/catalog";
import type { Understanding } from "@shared/personalise";
import type { AssessmentMix, LearnerSetup, SaveSetupRequest } from "@shared/setup";

import { api } from "@/api/client";
import type { toUnderstandRequest } from "./helpers";

export interface SetupResponse {
  setup: LearnerSetup;
  /** The skills the setup references, for a reader that has not loaded the catalog. */
  skills: Skill[];
  mix: AssessmentMix;
}

/** What `assign: true` (or Issue) hands back (server/src/assessment/issue.ts `IssueResult`). */
export interface IssuedAssessment {
  assessmentId: string;
  jobId?: string | null;
  /** v4.1: `generating` while the AI writes it in the background (about a minute); `ready` when bank-only. */
  status?: "generating" | "ready";
  /** Why it came from the bank only, e.g. no AI credential. */
  notice?: string;
}

export interface SaveSetupResponse extends SetupResponse {
  /** Present when `assign` was true and the assessment was issued after the save. */
  issued: IssuedAssessment | null;
}

export interface UnderstandResponse {
  understanding: Understanding;
  aiAvailable: boolean;
}

export type UnderstandRequest = ReturnType<typeof toUnderstandRequest> & { force?: boolean; userId?: string };

/** One learner's Setup: read and written as one record (v4 Phase 3). */
export const setupApi = {
  get: (userId: string, signal?: AbortSignal) => api.get<SetupResponse>(`/api/admin/users/${userId}/setup`, signal),
  /** `assign: true` saves first, then issues the assessment from what was just saved. */
  save: (userId: string, body: SaveSetupRequest) => api.put<SaveSetupResponse>(`/api/admin/users/${userId}/setup`, body),
  /** v4.1: "How the AI understood this". Cached server-side by content; `force` regenerates. */
  understand: (body: UnderstandRequest, signal?: AbortSignal) => api.post<UnderstandResponse>("/api/admin/setup/understand", body, signal),
};
