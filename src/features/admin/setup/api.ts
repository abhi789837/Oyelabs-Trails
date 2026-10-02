import type { Skill } from "@shared/catalog";
import type { AssessmentMix, LearnerSetup, SaveSetupRequest } from "@shared/setup";

import { api } from "@/api/client";

export interface SetupResponse {
  setup: LearnerSetup;
  /** The skills the setup references, for a reader that has not loaded the catalog. */
  skills: Skill[];
  mix: AssessmentMix;
}

export interface SaveSetupResponse extends SetupResponse {
  /** Present when `assign` was true and the assessment was issued after the save. */
  issued: { assessmentId: string } | null;
}

/** One learner's Setup: read and written as one record (v4 Phase 3). */
export const setupApi = {
  get: (userId: string, signal?: AbortSignal) => api.get<SetupResponse>(`/api/admin/users/${userId}/setup`, signal),
  /** `assign: true` saves first, then issues the assessment from what was just saved. */
  save: (userId: string, body: SaveSetupRequest) => api.put<SaveSetupResponse>(`/api/admin/users/${userId}/setup`, body),
};
