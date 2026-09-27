import type { ReactNode } from "react";

import { ConfirmProvider } from "./ConfirmProvider";
import { FormDialogProvider } from "./FormDialogProvider";
import { AppToaster } from "./Toaster";

/**
 * Everything that renders above the app: confirmations, form dialogs and toasts.
 *
 * It sits at the root, above the router's outlets, for two reasons. A confirmation has to outlive
 * the component that asked for it — a row that vanishes when the list reloads must not take its own
 * "are you sure" with it — and the admin console, the learner app and the proctored assessment all
 * need the same one, rather than three copies that stack on top of each other.
 */
export function OverlayProvider({ children }: { children: ReactNode }) {
  return (
    <ConfirmProvider>
      <FormDialogProvider>
        {children}
        <AppToaster />
      </FormDialogProvider>
    </ConfirmProvider>
  );
}
