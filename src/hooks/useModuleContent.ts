import { useEffect, useState } from "react";

import { getCachedModule, loadModule } from "@/content";
import type { Module } from "@/types/curriculum";

type State = { status: "loading" } | { status: "ready"; module: Module } | { status: "error"; error: Error };

/** Loads a module's full content (code-split per module) and caches it for the session. */
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
