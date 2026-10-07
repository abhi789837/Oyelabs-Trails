import { useCallback, useEffect, useId, useRef, useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";

import type { Understanding } from "@shared/personalise";

import { ApiRequestError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InfoTip } from "../catalog/InfoTip";
import { setupApi, type UnderstandRequest } from "./api";

/** How long the form must sit still before the panel asks again. */
export const UNDERSTAND_DEBOUNCE_MS = 1500;

export interface UnderstandingState {
  understanding: Understanding | null;
  aiAvailable: boolean;
  loading: boolean;
  error: string | null;
  /** True when the form changed since the shown understanding was made. */
  stale: boolean;
  regenerate: () => void;
}

/**
 * Reads the form as it stands, ~1.5 s after it stops changing, while it is complete enough
 * (`ready`). The server caches by content, so asking again about an unchanged form is free;
 * `regenerate` passes `force` for a fresh read.
 */
export function useUnderstanding(request: UnderstandRequest, key: string, ready: boolean): UnderstandingState {
  const [understanding, setUnderstanding] = useState<Understanding | null>(null);
  const [aiAvailable, setAiAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shownKey, setShownKey] = useState<string | null>(null);
  const requestRef = useRef(request);
  requestRef.current = request;
  const controllerRef = useRef<AbortController | null>(null);

  const fetchNow = useCallback(async (forKey: string, force: boolean) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const result = await setupApi.understand({ ...requestRef.current, ...(force ? { force: true } : {}) }, controller.signal);
      if (controller.signal.aborted) return;
      setUnderstanding(result.understanding);
      setAiAvailable(result.aiAvailable);
      setShownKey(forKey);
    } catch (err) {
      if (controller.signal.aborted || (err instanceof DOMException && err.name === "AbortError")) return;
      setError(err instanceof ApiRequestError ? err.message : "Could not read the setup just now.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => void fetchNow(key, false), UNDERSTAND_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [key, ready, fetchNow]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  return {
    understanding: ready ? understanding : null,
    aiAvailable,
    loading: ready && loading,
    error: ready ? error : null,
    stale: ready && understanding !== null && shownKey !== key,
    regenerate: () => void fetchNow(key, true),
  };
}

/** "4 hands-on, 1 multiple choice". */
export function splitLabel(line: { handsOn: number; mcq: number }, handsOnNoun = "hands-on"): string {
  const parts: string[] = [];
  if (line.handsOn > 0) parts.push(`${line.handsOn} ${handsOnNoun}`);
  if (line.mcq > 0) parts.push(`${line.mcq} MCQ`);
  return parts.join(", ") || "none";
}

/**
 * "How the AI understood this": what it took from the description (3–5 bullets) and the split it
 * plans per skill. Compact, because it sits beside the summary card.
 */
export function UnderstandingPanel({
  state,
  ready,
  className,
}: {
  state: UnderstandingState;
  ready: boolean;
  className?: string;
}) {
  const { understanding, loading, error, stale } = state;
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} aria-busy={loading} className={cn("rounded-lg border bg-surface p-4", className)}>
      <div className="flex items-center gap-1">
        <h2 id={headingId} className="font-display text-sm font-semibold">
          How the AI understood this
        </h2>
        <InfoTip label="About this reading">
          The AI reads the description and your picks, then plans the 25 questions. Your sliders decide the split per
          skill; it chooses the kind of question and the scenario. Saving reuses this reading, so it costs nothing more.
        </InfoTip>
        {loading && <LoaderCircle className="ml-auto size-3.5 animate-spin text-muted-foreground" aria-label="Reading" />}
      </div>

      {!ready ? (
        <p className="mt-2 text-sm text-muted-foreground">Pick a track or a priority and it reads the setup.</p>
      ) : error ? (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      ) : !understanding ? (
        <p className="mt-2 text-sm text-muted-foreground">{loading ? "Reading the setup…" : "Reads the setup when you pause."}</p>
      ) : (
        <div className={cn("mt-2 space-y-3 transition-opacity", (stale || loading) && "opacity-60")}>
          <ul className="list-disc space-y-1 pl-4 text-sm leading-snug marker:text-muted-foreground">
            {understanding.intent.slice(0, 5).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {understanding.split.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Planned split</p>
              <ul className="mt-1 space-y-0.5 text-sm">
                {understanding.split.map((line) => (
                  <li key={line.skillName} className="flex gap-2">
                    <span className="min-w-0 flex-1 break-words">
                      {line.skillName}
                    </span>
                    <span className="shrink-0 font-mono text-xs leading-5 text-muted-foreground tabular">{splitLabel(line)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {understanding.source === "rules" && (
            <p className="text-xs text-warning-strong">Rules only — add an AI key for a smarter plan.</p>
          )}
        </div>
      )}

      {ready && (
        <Button type="button" variant="ghost" size="sm" className="mt-2 -ml-2" disabled={loading} onClick={state.regenerate}>
          <RefreshCw aria-hidden="true" />
          Regenerate understanding
        </Button>
      )}
    </section>
  );
}
