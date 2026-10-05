import type { ReactNode } from "react";

/**
 * A v5 Phase 0 stand-in for a screen another phase builds. It renders a real `h1` so every v5 route
 * is reachable and testable before its screen exists. Delete the import when the screen lands.
 */
export function ScreenPlaceholder({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">This screen is being rebuilt for the new design.</p>
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}
