import type { NextAction, NextActionFacts, NextActionTone } from "@shared/nextAction";

import { api } from "@/api/client";

export { nextAction, staleReason } from "@shared/nextAction";
export type { NextAction, NextActionFacts } from "@shared/nextAction";

/** v4.3 Phase 6: the learner page's next action, computed server-side from DB state. */
export const nextActionApi = {
  get: (userId: string, signal?: AbortSignal) => api.get<{ action: NextAction; facts: NextActionFacts }>(`/api/admin/users/${userId}/next-action`, signal),
};

/** Kinds that change on their own (a background job), so the bar re-reads them. */
export const POLLED_KINDS: readonly NextAction["kind"][] = ["writing", "evaluating", "review-evaluation", "courses-creating", "courses-waiting", "courses-failed"];

/** The bar's accent per tone, in brand tokens: amber to do, green done, muted waiting, red blocked. */
export const TONE_CLASS: Record<NextActionTone, { bar: string; dot: string; label: string }> = {
  todo: { bar: "border-l-trailmark", dot: "bg-trailmark", label: "Next" },
  done: { bar: "border-l-summit", dot: "bg-summit", label: "Done" },
  waiting: { bar: "border-l-basalt", dot: "bg-basalt", label: "Waiting" },
  blocked: { bar: "border-l-destructive", dot: "bg-destructive", label: "Blocked" },
};
