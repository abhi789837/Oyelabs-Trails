import { lazy, Suspense, type ReactNode } from "react";
import { Outlet } from "react-router-dom";

import { lazyPreloaded } from "./preload";
import { ScreenFallback } from "./RouteFallback";
import { ROUTE_MODULES } from "./routePrefetch";

/**
 * V5App's overlays, split so /learn's first download doesn't carry them (docs/v5/DECISIONS.md,
 * "Integration fixes"). The old `OverlayProvider` bundled the toaster with the confirm and form
 * dialogs, whose old Button imports the full Motion runtime: about 30 KB gzipped on every route.
 *
 * - `LazyToaster`: the one toast surface (sonner; `v5Toast` renders here too), mounted at the
 *   root and fetched right after the first screen.
 * - `WithOldDialogs` / `OldDialogsOutlet`: `useConfirm` / `useFormDialog` for the routes that need
 *   them (old pages, admin, assessment, /design).
 */
const AppToaster = lazy(() => import("@/components/overlays/Toaster").then((m) => ({ default: m.AppToaster })));
// Preloaded with the admin inbox at start-up (routePrefetch), so the console doesn't pause on it.
const OldDialogProviders = lazyPreloaded("oldDialogs", ROUTE_MODULES.oldDialogs);

export function LazyToaster() {
  return (
    <Suspense fallback={null}>
      <AppToaster />
    </Suspense>
  );
}

export function WithOldDialogs({ children, fallback = <ScreenFallback /> }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <Suspense fallback={fallback}>
      <OldDialogProviders>{children}</OldDialogProviders>
    </Suspense>
  );
}

/** A layout route giving its child routes the old dialogs. */
export function OldDialogsOutlet() {
  return (
    <WithOldDialogs>
      <Outlet />
    </WithOldDialogs>
  );
}
