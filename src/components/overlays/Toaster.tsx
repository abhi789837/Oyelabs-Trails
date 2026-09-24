import { CircleAlert, CircleCheck, Info, LoaderCircle } from "lucide-react";
import { Toaster as SonnerToaster } from "sonner";

import { useUiStore } from "@/store/uiStore";

/**
 * The app's one toast surface, backed by sonner.
 *
 * Every toast is `unstyled`, which drops sonner's own look and leaves only its positioning and
 * stacking. The styling below is ours: the inverted `popover` pair, the same dark-card-on-light
 * (and light-on-dark) treatment the camp and summit celebrations have always used, so a
 * "saved" and a "camp complete" read as the same family.
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
        warning: <CircleAlert className="h-4 w-4 text-trailmark-strong" aria-hidden="true" />,
        loading: <LoaderCircle className="h-4 w-4 animate-spin opacity-70" aria-hidden="true" />,
      }}
      toastOptions={{
        unstyled: true,
        closeButtonAriaLabel: "Dismiss notification",
        classNames: {
          toast:
            "relative flex w-full items-start gap-3 rounded-md border border-transparent bg-popover px-4 py-3 font-sans text-popover-foreground shadow-lg",
          icon: "mt-0.5 flex shrink-0 items-center",
          content: "min-w-0 flex-1",
          title: "font-display text-sm font-semibold",
          description: "mt-0.5 text-sm opacity-80",
          actionButton:
            "ml-3 shrink-0 rounded-sm bg-popover-foreground/15 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-popover-foreground/25",
          cancelButton: "ml-2 shrink-0 rounded-sm px-2.5 py-1 text-xs font-medium opacity-70 hover:opacity-100",
          closeButton: "absolute right-2 top-2 rounded-sm p-1 opacity-70 hover:opacity-100",
        },
      }}
    />
  );
}
