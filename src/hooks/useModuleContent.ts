import { useEffect, useState } from "react";

import type { ServedModule } from "@shared/content";

import { getCachedModule, loadModule } from "@/content";

type State = { status: "loading" } | { status: "ready"; module: ServedModule } | { status: "error"; error: Error };

/**
 * Loads a camp's full content from the server, filtered to this person's plan and stripped of
 * answer keys, and caches it for the session.
 */
export function useModuleContent(trackId: string, moduleId: string): State {
  const [state, setState] = useState<State>(() => {
    const cached = getCachedModule(trackId, moduleId);
    return cached ? { status: "ready", module: cached } : { status: "loading" };
  });

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedModule(trackId, moduleId);
    if (cached) {
      setState({ status: "ready", module: cached });
      return;
    }
    setState({ status: "loading" });
    loadModule(trackId, moduleId).then(
      (module) => !cancelled && setState({ status: "ready", module }),
      (error: Error) => !cancelled && setState({ status: "error", error }),
    );
    return () => {
      cancelled = true;
    };
  }, [trackId, moduleId]);

  return state;
}
