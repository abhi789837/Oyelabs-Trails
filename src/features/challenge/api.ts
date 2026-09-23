import type { AttemptRequest, AttemptResult } from "@shared/content";

import { api } from "@/api/client";

/**
 * Submits an attempt for grading.
 *
 * Grading is server-side from v3 (brief §7.4, §7.5): the browser has no answer key and no hidden
 * tests, so this is the only thing that can decide whether a topic is complete.
 */
export function submitAttempt(topicId: string, body: AttemptRequest): Promise<AttemptResult> {
  return api.post<AttemptResult>(`/api/topics/${encodeURIComponent(topicId)}/attempt`, body);
}
