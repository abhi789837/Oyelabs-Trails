import type { AssessmentResultsResponse } from "@shared/assessmentResults";

import { api } from "@/api/client";

/** v5 results + review requests. The sitting itself uses `assessmentApi` and `sheetApi` unchanged. */
export const resultsApi = {
  results: (signal?: AbortSignal) => api.get<AssessmentResultsResponse>("/api/v5/assessment/results", signal),
  requestReview: (itemId: string, note: string) =>
    api.post<{ id: string; status: string }>("/api/review-requests", { source: "assessment_item", refId: itemId, note }),
};
