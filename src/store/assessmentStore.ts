import { create } from "zustand";

import type { MyAssessment } from "@shared/assessment";

import { api, ApiRequestError } from "@/api/client";

type Status = "idle" | "loading" | "ready" | "error";

interface MyAssessmentState {
  status: Status;
  /** The learner's latest attempt, or null when none has ever been issued. */
  assessment: MyAssessment | null;
  error: string | null;
  /**
   * Fetches `/api/me/assessment`. Safe to call repeatedly: only the first call shows as loading,
   * so a background refresh never blanks a banner that is already on screen.
   */
  load: () => Promise<void>;
  /** Called when the signed-in person changes, so one learner's funnel never shows to the next. */
  reset: () => void;
}

/**
 * The learner's own placement assessment, fetched once for the whole app.
 *
 * It used to be fetched inside `PlanPage`, which is why a pending assessment was invisible to
 * anyone who already had a plan and therefore never opened that page. The shell now loads it
 * (see `AppShell`) and both the banner and `/plan` read it from here — one request, one answer.
 */
export const useMyAssessmentStore = create<MyAssessmentState>()((set, get) => ({
  status: "idle",
  assessment: null,
  error: null,

  load: async () => {
    if (get().status === "loading") return;
    set((s) => ({ status: s.status === "ready" ? "ready" : "loading", error: null }));
    try {
      const result = await api.get<{ assessment: MyAssessment | null }>("/api/me/assessment");
      set({ status: "ready", assessment: result.assessment, error: null });
    } catch (error) {
      // The previous answer is kept: a failed poll is not evidence that the assessment went away.
      set({
        status: "error",
        error: error instanceof ApiRequestError ? error.message : "Could not check for a placement assessment.",
      });
    }
  },

  reset: () => set({ status: "idle", assessment: null, error: null }),
}));
