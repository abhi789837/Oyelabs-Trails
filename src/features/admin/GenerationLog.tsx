import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, Radio } from "lucide-react";

import type { GenerationLogLine, GenerationLogResponse } from "@shared/assessment";

import { api, ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { cn, preferredScrollBehavior } from "@/lib/utils";

/**
 * What the generator is doing, live (brief §13).
 *
 * Generation is several minutes and a dozen or more provider calls, and until now the admin saw
 * `generating` and then `ready` or `failed` with nothing in between. This is that gap, filled in:
 * a stage as it starts, a count as it finishes, every dropped item and why, and a retry while it
 * is happening rather than four minutes later.
 *
 * Lines arrive on the admin SSE feed the live board already holds open, and the route is polled
 * alongside it while the run is live, so a dropped stream degrades to "a few seconds late" rather
 * than "silently stopped". The log is read back the same way once the run is over, which is the
 * point of storing it: the reason an assessment came out thin outlives the page that watched it.
 *
 * Nothing here is an answer key. The server decides that — see server/src/assessment/generationLog.ts.
 */
export function GenerationLog({
  assessmentId,
  onFinished,
}: {
  assessmentId: string;
  /** Called once when a run that was live finishes, so the surrounding page can refresh. */
  onFinished?: () => void;
}) {
  const [lines, setLines] = useState<GenerationLogLine[] | null>(null);
  const [status, setStatus] = useState<GenerationLogResponse["status"] | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const scroller = useRef<HTMLDivElement | null>(null);
  const pinnedToBottom = useRef(true);
  const finishedFired = useRef(false);

  const live = status === "generating";

  const load = useCallback(async () => {
    try {
      const result = await api.get<GenerationLogResponse>(`/api/admin/assessments/${assessmentId}/generation-log`);
      // Merged rather than replaced: a line that arrived over the feed a moment ago must not
      // vanish because this response was built before it landed.
      setLines((current) => merge(current ?? [], result.lines));
      setTruncated(result.truncated);
      setStatus(result.status);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not load the generation log.");
    }
  }, [assessmentId]);

  useEffect(() => {
    setLines(null);
    setStatus(null);
    finishedFired.current = false;
    void load();
  }, [load]);

  useEffect(() => {
    if (!live) return;
    const poll = setInterval(() => void load(), 5_000);
    return () => clearInterval(poll);
  }, [live, load]);

  useEffect(() => {
    if (!live) return;

    const source = new EventSource("/api/admin/live/stream");
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.addEventListener("generation", (event) => {
      const line = JSON.parse((event as MessageEvent).data) as GenerationLogLine;
      if (line.assessmentId !== assessmentId) return;
      setLines((current) => merge(current ?? [], [line]));
      // A `finish` line is the run ending; ask the page around us to refresh its status with it.
      if (line.stage === "finish") void load();
    });

    return () => {
      source.close();
      setConnected(false);
    };
  }, [live, assessmentId, load]);

  // Fires once, on the transition out of `generating`, so the caller refreshes exactly then.
  useEffect(() => {
    if (!status || status === "generating" || finishedFired.current) return;
    finishedFired.current = true;
    onFinished?.();
  }, [status, onFinished]);

  // Auto-scroll, but only while the admin has not scrolled up to read something.
  useEffect(() => {
    const el = scroller.current;
    if (!el || !live || !pinnedToBottom.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: preferredScrollBehavior() });
  }, [lines, live]);

  if (error) return <FormAlert>{error}</FormAlert>;

  if (!lines) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading the generation log…
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-sm font-semibold">Generation log</h3>
        <span className="font-mono text-xs text-muted-foreground tabular">
          {lines.length} line{lines.length === 1 ? "" : "s"}
        </span>
        {live && (
          <span
            className={cn(
              "flex items-center gap-1.5 font-mono text-xs",
              connected ? "text-summit-strong" : "text-muted-foreground",
            )}
          >
            <Radio className="h-3.5 w-3.5" aria-hidden="true" />
            {connected ? "live" : "reconnecting…"}
          </span>
        )}
      </div>

      {lines.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {live ? "The job has not written anything yet." : "This assessment was generated before the log existed."}
        </p>
      ) : (
        <>
          {truncated && (
            <p className="mt-2 text-xs text-muted-foreground">
              This run wrote more lines than are kept. The oldest were dropped.
            </p>
          )}
          <div
            ref={scroller}
            onScroll={(e) => {
              const el = e.currentTarget;
              pinnedToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
            }}
            role="log"
            aria-live={live ? "polite" : "off"}
            aria-label="Generation log"
            tabIndex={0}
            className="mt-3 max-h-96 overflow-auto rounded-md border bg-editor px-3 py-2.5 font-mono text-xs leading-relaxed text-editor-foreground"
          >
            <ol>
              {lines.map((line) => (
                <li key={line.seq} className="flex gap-2 whitespace-pre-wrap py-0.5">
                  <span className="shrink-0 opacity-50 tabular">{clockOf(line.at)}</span>
                  <span className={cn("w-18 shrink-0 opacity-70", levelClass(line.level))}>{line.stage}</span>
                  <span className={cn("min-w-0", levelClass(line.level))}>
                    {line.message}
                    {line.inputTokens !== null && (
                      <span className="opacity-50">
                        {"  "}
                        {formatTokens(line.inputTokens)} in / {formatTokens(line.outputTokens ?? 0)} out
                        {line.elapsedMs !== null ? `, ${(line.elapsedMs / 1000).toFixed(1)}s` : ""}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </div>
  );
}

/** Keeps one line per `seq`, in order. The feed and the poll overlap by design. */
function merge(current: GenerationLogLine[], incoming: GenerationLogLine[]): GenerationLogLine[] {
  const bySeq = new Map(current.map((line) => [line.seq, line]));
  for (const line of incoming) bySeq.set(line.seq, line);
  return [...bySeq.values()].sort((a, b) => a.seq - b.seq);
}

function levelClass(level: GenerationLogLine["level"]): string {
  if (level === "error") return "text-destructive";
  if (level === "warn") return "text-trailmark";
  return "";
}

function clockOf(epochMs: number): string {
  const at = new Date(epochMs);
  return [at.getHours(), at.getMinutes(), at.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");
}

function formatTokens(count: number): string {
  return count.toLocaleString();
}
