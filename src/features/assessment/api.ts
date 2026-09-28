import {
  CONSENT_POLICY_VERSION,
  type AnswerRequest,
  type AssessmentStatusResponse,
  type ConsentPermissions,
  type ConsentRequest,
  type ConsentStatus,
  type IntegrityEventResponse,
  type MyAssessment,
  type NextItemResponse,
  type StartRequest,
  type StartResponse,
} from "@shared/assessment";

import { api } from "@/api/client";

/**
 * The learner's side of the assessment API (brief §9.5).
 *
 * Note what is missing: there is no "check my answer" call. The server never tells a learner
 * whether they were right, because knowing would let them search for the level at which they stop
 * being told "wrong".
 */
export const assessmentApi = {
  mine: (signal?: AbortSignal) => api.get<{ assessment: MyAssessment | null }>("/api/me/assessment", signal),

  status: (id: string, signal?: AbortSignal) => api.get<AssessmentStatusResponse>(`/api/assessment/${id}/status`, signal),

  /**
   * Records consent. **Must be awaited before `start`** — `start` reads the record back, and the
   * absence of this call is what broke the whole flow (docs/bugs/assessment-consent.md).
   */
  consent: (id: string, permissions?: ConsentPermissions) =>
    api.post<{ ok: true }>(`/api/assessment/${id}/consent`, {
      agreed: true,
      permissions,
      policyVersion: CONSENT_POLICY_VERSION,
    } satisfies ConsentRequest),

  /** Whether consent is already on file for this attempt, and whether it is still current. */
  consentStatus: (id: string, signal?: AbortSignal) =>
    api.get<ConsentStatus>(`/api/assessment/${id}/consent`, signal),

  /**
   * Starts the clock. The consent payload rides along so that a single call is enough — belt and
   * braces against a caller that skips `consent`, which is exactly how this broke.
   */
  start: (id: string, permissions?: ConsentPermissions) =>
    api.post<StartResponse>(`/api/assessment/${id}/start`, {
      consent: { agreed: true, permissions, policyVersion: CONSENT_POLICY_VERSION },
    } satisfies StartRequest),

  next: (id: string, signal?: AbortSignal) => api.get<NextItemResponse>(`/api/assessment/${id}/next`, signal),

  answer: (id: string, itemId: string, body: AnswerRequest) =>
    api.post<{ accepted: true }>(`/api/assessment/${id}/items/${itemId}`, body),

  submit: (id: string) => api.post<{ ok: true }>(`/api/assessment/${id}/submit`),

  heartbeat: (id: string, body: { visible: boolean; fullscreen: boolean; faceState: string; cameraLive: boolean }) =>
    api.post<{ ok: true }>(`/api/assessment/${id}/heartbeat`, body),
};

/**
 * Posts an integrity event, with a snapshot when one was captured.
 *
 * Multipart when there is an image, plain JSON otherwise — a JSON body is smaller and every
 * browser-only signal (a tab switch, a paste) has nothing to attach.
 */
export async function postIntegrityEvent(
  assessmentId: string,
  event: { type: string; severity: "soft" | "hard"; clientTs: number; details?: Record<string, unknown> },
  snapshot?: Blob,
): Promise<IntegrityEventResponse> {
  const url = `/api/assessment/${assessmentId}/events`;

  if (!snapshot) {
    return api.post<IntegrityEventResponse>(url, event);
  }

  const form = new FormData();
  form.append("event", JSON.stringify(event));
  form.append("snapshot", snapshot, "snapshot.jpg");

  const response = await fetch(url, { method: "POST", credentials: "same-origin", body: form });
  if (!response.ok) throw new Error(`Event upload failed (${response.status})`);
  return (await response.json()) as IntegrityEventResponse;
}
