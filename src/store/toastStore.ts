import { createElement } from "react";
import { toast } from "sonner";

import { CompletionToast } from "@/components/overlays/CompletionToast";

/**
 * Camp and summit celebrations.
 *
 * This was a zustand store holding a list of toasts, rendered by a hand-written stack. The list and
 * the stack are sonner's job now (U3); what stayed is the thing that matters — the payload shape
 * and the one entry point `CompletionWatcher` calls when a learner finishes a camp or a trail.
 */
export interface CompletionToastPayload {
  title: string;
  body: string;
  action?: { label: string; to: string };
  tone: "camp" | "summit";
}

/** Long enough to read the next-camp line and decide to follow it. */
const COMPLETION_DURATION_MS = 8000;

export function pushCompletionToast(payload: CompletionToastPayload) {
  return toast.custom((id) => createElement(CompletionToast, { toast: payload, id }), {
    duration: COMPLETION_DURATION_MS,
  });
}
