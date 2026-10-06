import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { ApiRequestError } from "@/api/client";
import { cn } from "@/v5/design/cn";

/** Plain words for a failed request. The server's own message is already written for people. */
export function plainMessage(error: unknown, fallback = "Something went wrong. Try again."): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 0) return "We couldn't reach Oyelearn. Check your connection and try again.";
    if (error.status === 404) return "That isn't there any more. Refresh the page to see the latest.";
    return error.message || fallback;
  }
  return fallback;
}

/** True when a feature built by another group isn't on this server yet. */
export function isMissing(error: unknown): boolean {
  return error instanceof ApiRequestError && error.status === 404;
}

export interface Loaded<T> {
  data: T | null;
  error: unknown;
  loading: boolean;
  reload: () => void;
  setData: (fn: (current: T | null) => T | null) => void;
}

/** Fetch on mount (and when `key` changes), abort on unmount, keep the last data while reloading. */
export function useLoad<T>(load: (signal: AbortSignal) => Promise<T>, key: unknown = null): Loaded<T> {
  const [data, setDataState] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    loadRef
      .current(controller.signal)
      .then((value) => {
        if (controller.signal.aborted) return;
        setDataState(value);
        setError(null);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === "AbortError")) return;
        setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [key, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((fn: (current: T | null) => T | null) => setDataState((cur) => fn(cur)), []);
  return { data, error, loading, reload, setData };
}

/** True after `ms` of loading, so short waits show nothing (copy guide: waiting). */
export function useSlow(loading: boolean, ms = 300): boolean {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!loading) {
      setSlow(false);
      return;
    }
    const id = setTimeout(() => setSlow(true), ms);
    return () => clearTimeout(id);
  }, [loading, ms]);
  return slow;
}

/** The page title row: one h1, an optional one-line description, actions on the right. */
export function PageHeader({ title, description, actions, className }: { title: string; description?: ReactNode; actions?: ReactNode; className?: string }) {
  useEffect(() => {
    const before = document.title;
    document.title = `${title} · Oyelearn admin`;
    return () => {
      document.title = before;
    };
  }, [title]);
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-3 pb-4", className)}>
      <div className="min-w-0">
        <h1 className="font-display text-h2 font-semibold text-fg-1">{title}</h1>
        {description ? <p className="mt-1 max-w-[70ch] text-small text-fg-2">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/** The page frame: compact padding, a readable max width. */
export function Page({ children, wide = false, className }: { children: ReactNode; wide?: boolean; className?: string }) {
  return <div className={cn("mx-auto w-full px-4 py-5 md:px-6", wide ? "max-w-[1400px]" : "max-w-5xl", className)}>{children}</div>;
}

/** Saves a text file in the browser (CSV export). */
export function downloadText(filename: string, text: string, type = "text/csv;charset=utf-8"): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "oyelearn-report-2026-10-06.csv" */
export function csvName(stem: string, at = Date.now()): string {
  const d = new Date(at);
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `oyelearn-${stem}-${day}.csv`;
}

export function formatDate(ts: number | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(ts: number | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

/**
 * A row of toggle buttons for "show this or that" (a filter, one person or several). Buttons with
 * `aria-pressed`, not tabs: there are no tab panels, and a tab without its panel is invalid ARIA.
 */
export function Segmented<T extends string>({ label, options, value, onChange, className }: { label: string; options: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void; className?: string }) {
  return (
    <div role="group" aria-label={label} className={cn("inline-flex flex-wrap gap-1 rounded-control border border-line-1 bg-surface-1 p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn("h-8 rounded-[6px] px-3 text-small font-medium", value === o.value ? "bg-brand text-on-brand" : "text-fg-2 hover:bg-sunken hover:text-fg-1")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
