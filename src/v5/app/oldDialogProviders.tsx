import type { ReactNode } from "react";

import { ConfirmProvider } from "@/components/overlays/ConfirmProvider";
import { FormDialogProvider } from "@/components/overlays/FormDialogProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * The old design's providers (`useConfirm`, `useFormDialog`, and the Radix `TooltipProvider` the
 * old tooltips need), for the screens that use them inside V5App: old pages shown in the v5
 * shells, the admin console, the assessment and /design. A lazy chunk (see `./overlays`), because
 * they bring the old Button, the full Motion runtime and Radix tooltip/floating-ui, which no v5
 * learner screen needs on first paint.
 */
export default function OldDialogProviders({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={150}>
      <ConfirmProvider>
        <FormDialogProvider>{children}</FormDialogProvider>
      </ConfirmProvider>
    </TooltipProvider>
  );
}
