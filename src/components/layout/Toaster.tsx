import { useEffect } from "react";
import { Mountain, Tent, X } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useToastStore, type Toast } from "@/store/toastStore";

const AUTO_DISMISS_MS = 8000;

/** Small, polite notifications for camp (module) and summit (track) completions. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-3 bottom-3 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastCard({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  useEffect(() => {
    const id = window.setTimeout(() => dismiss(toast.id), AUTO_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [dismiss, toast.id]);
  const Icon = toast.tone === "summit" ? Mountain : Tent;

  return (
    <div
      role="status"
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border bg-popover px-4 py-3 text-popover-foreground shadow-lg animate-in fade-in-0 slide-in-from-bottom-2 sm:w-96"
    >
      <span
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
          toast.tone === "summit" ? "bg-trailmark text-trailmark-foreground" : "bg-summit text-summit-foreground",
        )}
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display font-semibold">{toast.title}</p>
        <p className="mt-0.5 text-sm opacity-80">{toast.body}</p>
        {toast.action && (
          <Link
            to={toast.action.to}
            onClick={() => dismiss(toast.id)}
            className="mt-2 inline-block text-sm font-medium underline decoration-trailmark decoration-2 underline-offset-4"
          >
            {toast.action.label}
          </Link>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        className="rounded-sm p-1 opacity-70 hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
