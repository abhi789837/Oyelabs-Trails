/**
 * `v5Toast` without its weight: the design system's Overlays module (Radix Dialog, cmdk, sonner,
 * about 24 KB gzipped) loads on the first toast instead of with the lesson. The toaster itself is
 * mounted by V5App, so the toast shows the same either way.
 */
type Kind = "success" | "info" | "error";

function show(kind: Kind) {
  return (message: string, description?: string): void => {
    void import("@/v5/design/components/Overlays").then(({ v5Toast }) => v5Toast[kind](message, description)).catch(() => undefined);
  };
}

export const lessonToast = { success: show("success"), info: show("info"), error: show("error") };
