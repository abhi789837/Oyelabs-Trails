import { Mountain, Tent, X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import type { CompletionToastPayload } from "@/store/toastStore";

/**
 * Finishing a camp or a whole trail is the app's one moment of celebration, and it is deliberately
 * a quiet one: the same card it has always been, now rendered by sonner instead of a bespoke stack.
 * Summit wears `trailmark` (the gold of a finished trail), a camp wears `summit` green.
 */
export function CompletionToast({
  toast: payload,
  id,
}: {
  toast: CompletionToastPayload;
  id: string | number;
}) {
  const Icon = payload.tone === "summit" ? Mountain : Tent;

  return (
    <div
      role="status"
      className="flex w-full items-start gap-3 rounded-md border border-transparent bg-popover px-4 py-3 font-sans text-popover-foreground shadow-lg"
    >
      <span
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
          payload.tone === "summit"
            ? "bg-trailmark text-trailmark-foreground"
            : "bg-summit text-summit-foreground",
        )}
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-semibold">{payload.title}</p>
        <p className="mt-0.5 text-sm opacity-80">{payload.body}</p>
        {payload.action && (
          <Link
            to={payload.action.to}
            onClick={() => toast.dismiss(id)}
            className="mt-2 inline-block text-sm font-medium underline decoration-trailmark decoration-2 underline-offset-4"
          >
            {payload.action.label}
          </Link>
        )}
      </div>

      <button
        type="button"
        onClick={() => toast.dismiss(id)}
        className="rounded-sm p-1 opacity-70 hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
