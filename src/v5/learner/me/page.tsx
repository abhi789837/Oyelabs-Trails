import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import "@/v5/design/styles";
import { api } from "@/api/client";
import { cn } from "@/v5/design/cn";
import type { ReducedMotionPref } from "@/v5/design/motion";
import { useV5Root } from "@/v5/design/useV5Root";
import { V5MotionProvider } from "@/v5/design/V5MotionProvider";

/**
 * Shared bits for the P4 learner screens (My plan, Library, Review, Me): the v5 scope and motion
 * provider around each screen, a page frame, and a small fetch hook. Components come from their
 * own files (not the `@/v5/design` barrel) to keep each route's chunk small.
 */

export function V5Screen({ children, reducedMotion }: { children: ReactNode; reducedMotion?: ReducedMotionPref | null }) {
  useV5Root(reducedMotion === undefined ? {} : { reducedMotion });
  return <V5MotionProvider reducedMotion={reducedMotion ?? "system"}>{children}</V5MotionProvider>;
}

export function PageFrame({ title, lead, actions, children, className, wide }: { title: ReactNode; lead?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; wide?: boolean }) {
  return (
    <div className="min-h-full bg-surface-0 text-fg-1">
      <div className={cn("mx-auto flex w-full flex-col gap-(--v5-gap) px-4 py-6 sm:px-6 md:py-10 lg:gap-6", wide ? "max-w-6xl" : "max-w-5xl", className)}>
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-h1 font-semibold text-fg-1">{title}</h1>
            {lead ? <p className="mt-1 max-w-prose text-body text-fg-2">{lead}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
        {children}
      </div>
    </div>
  );
}

export interface ApiData<T> {
  data: T | null;
  error: unknown;
  loading: boolean;
  reload: (quiet?: boolean) => Promise<void>;
  setData: (next: T) => void;
}

/** GET a URL into state, aborting on unmount or when the URL changes. Null URL = do nothing. */
export function useApiData<T>(url: string | null): ApiData<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(url !== null);
  const controller = useRef<AbortController | null>(null);

  const reload = useCallback(
    async (quiet = false) => {
      if (!url) return;
      controller.current?.abort();
      const ac = new AbortController();
      controller.current = ac;
      if (!quiet) {
        setLoading(true);
        setError(null);
      }
      try {
        const next = await api.get<T>(url, ac.signal);
        if (ac.signal.aborted) return;
        setData(next);
        setError(null);
      } catch (e) {
        if (ac.signal.aborted || (e instanceof DOMException && e.name === "AbortError")) return;
        if (!quiet) setError(e);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    },
    [url],
  );

  useEffect(() => {
    void reload();
    return () => controller.current?.abort();
  }, [reload]);

  return { data, error, loading, reload, setData };
}

/** True once `on` has stayed true for `ms` (copy guide: show nothing for the first moment of waiting). */
export function useDelayed(on: boolean, ms = 300): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!on) {
      setShown(false);
      return;
    }
    const id = window.setTimeout(() => setShown(true), ms);
    return () => window.clearTimeout(id);
  }, [on, ms]);
  return shown;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m ? `${h} h ${m} min` : `${h} h`;
}
