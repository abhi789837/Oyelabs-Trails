import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/api/client";
import type { TodayResponse } from "@shared/today";

/**
 * Today's data: one call (`GET /api/v5/today`). Stale-while-revalidate: when the tab comes back
 * into view the page refreshes quietly and keeps showing what it had, so coming back from a
 * lesson shows the moved trail without a skeleton flash.
 */
export function useToday() {
  const [data, setData] = useState<TodayResponse | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const controller = useRef<AbortController | null>(null);

  const load = useCallback(async (quiet = false) => {
    controller.current?.abort();
    const ac = new AbortController();
    controller.current = ac;
    if (!quiet) {
      setLoading(true);
      setError(null);
    }
    try {
      const next = await api.get<TodayResponse>("/api/v5/today", ac.signal);
      if (ac.signal.aborted) return;
      setData(next);
      setError(null);
    } catch (e) {
      if (ac.signal.aborted || (e instanceof DOMException && e.name === "AbortError")) return;
      // A quiet refresh that fails keeps the page as it was.
      if (!quiet) setError(e);
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const onVisible = () => {
      if (document.visibilityState === "visible") void load(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      controller.current?.abort();
    };
  }, [load]);

  return { data, error, loading, retry: () => load() };
}

/** True once `active` has been true for `ms`: the skeleton waits ~300 ms so fast loads show nothing. */
export function useDelayed(active: boolean, ms = 300): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!active) {
      setShown(false);
      return;
    }
    const id = window.setTimeout(() => setShown(true), ms);
    return () => window.clearTimeout(id);
  }, [active, ms]);
  return shown;
}
