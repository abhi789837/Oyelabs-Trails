import { CircleAlert, CircleCheck, Info, LoaderCircle } from "lucide-react";
import { Toaster as SonnerToaster } from "sonner";

import { useUiStore } from "@/store/uiStore";

/**
 * The app's one toast surface, backed by sonner (both designs: v5's `v5Toast` and `lessonToast` render
 * here too, see src/v5/app/overlays.tsx).
 *
 * Every toast is `unstyled`, which drops sonner's own look and leaves only its positioning and
 * stacking. The styling is ours, in brand tokens (rebrand Phase 6): a white card on Cloud (a
 * navy-tinted one on Night) with the theme's border, Night Navy text, Outfit titles, the outcome
 * icon in its semantic colour and actions in Oyelabs Blue. Wins (a finished camp or trail, a
 * certificate, a level-up) are the only toasts that wear amber: see CompletionToast and the
 * motivation celebrations. "Blue leads. Amber celebrates."
 */
export function AppToaster() {
  const theme = useUiStore((s) => s.theme);

  return (
    <SonnerToaster
      theme={theme}
      position="bottom-right"
      duration={5000}
      gap={10}
      visibleToasts={3}
      offset={{ bottom: 20, right: 20 }}
      mobileOffset={{ bottom: 12, left: 12, right: 12 }}
      icons={{
        success: <CircleCheck className="h-4 w-4 text-summit-strong" aria-hidden="true" />,
        error: <CircleAlert className="h-4 w-4 text-destructive" aria-hidden="true" />,
        info: <Info className="h-4 w-4 text-primary" aria-hidden="true" />,
        warning: <CircleAlert className="h-4 w-4 text-warning-strong" aria-hidden="true" />,
        loading: <LoaderCircle className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />,
      }}
      toastOptions={{
        unstyled: true,
        closeButtonAriaLabel: "Dismiss notification",
        classNames: {
          toast:
            "relative flex w-full items-start gap-3 rounded-md border border-border bg-surface px-4 py-3 font-sans text-foreground shadow-lg",
          icon: "mt-0.5 flex shrink-0 items-center",
          content: "min-w-0 flex-1",
          title: "font-display text-sm font-semibold text-foreground",
          description: "mt-0.5 text-sm text-muted-foreground",
          actionButton:
            "ml-3 shrink-0 rounded-sm bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-strong",
          cancelButton: "ml-2 shrink-0 rounded-sm px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground",
          closeButton: "absolute right-2 top-2 rounded-sm p-1 text-muted-foreground hover:bg-surface-sunken hover:text-foreground",
        },
      }}
    />
  );
}
