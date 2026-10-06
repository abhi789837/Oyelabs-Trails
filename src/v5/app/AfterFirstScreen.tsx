import { useEffect, useState, type ReactNode } from "react";

import { afterLoadIdle } from "./afterLoad";

/**
 * Renders its children once the page has loaded and the browser is idle (Phase 9 performance).
 *
 * For what no screen needs to show its content: the motivation host (top-bar XP, bell,
 * celebrations) and the toaster. Their ~30 small files used to start downloading while the first
 * screen was still being built, and competed with it on a slow phone connection. Celebrations
 * asked for before then wait for the host (`celebrate.ts` queues them).
 */
export function AfterFirstScreen({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => afterLoadIdle(() => setReady(true)), []);
  return ready ? <>{children}</> : null;
}
