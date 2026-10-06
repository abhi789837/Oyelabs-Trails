import { lazy, Suspense } from "react";

/**
 * Mounted once in V5App, next to the routes. This file is all /learn's first download pays
 * for motivation (a few hundred bytes): the host itself (top bar XP and bell, celebrations, the
 * welcome) is a lazy chunk fetched after the screen. Screens trigger it through
 * `@/v5/motivation/celebrate` (`celebrate`, `refreshMotivation`, `openProgress`).
 */
const HostImpl = lazy(() => import("./HostImpl"));

export function MotivationHost() {
  return (
    <Suspense fallback={null}>
      <HostImpl />
    </Suspense>
  );
}
