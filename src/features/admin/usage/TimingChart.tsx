import { useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";

import type { TimingConstants } from "@shared/timing";
import { formatMinutes } from "@shared/timing";

import { api, ApiRequestError } from "@/api/client";
import { formatCostMicros } from "@/lib/timing";
import { cn } from "@/lib/utils";
import { InfoTip } from "../catalog/InfoTip";
import { timingRows, type TimingRow } from "./helpers";

export interface TimingResponse {
  constants: TimingConstants;
  assessments: TimingRow[];
}

/** The most rows the chart shows; the newest first. */
const MAX_ROWS = 20;

/**
 * "Estimated vs actual time" (v4.1 §1c): one row per finished assessment, a hollow dot for the
 * designed length and a filled one for how long it really took, joined by a line. Rows rather than
 * columns so a learner's name fits and a phone can read it.
 */
export function TimingChart({ days }: { days: number }) {
  const [data, setData] = useState<TimingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<TimingResponse>(`/api/admin/assessments/timing?days=${days}`, controller.signal)
      .then((result) => {
        setData(result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiRequestError ? err.message : "Could not load the timing.");
      });
    return () => controller.abort();
  }, [days]);

  const chart = useMemo(() => (data ? timingRows(data.assessments, MAX_ROWS) : null), [data]);

  return (
    <section className="mt-10" aria-labelledby="usage-timing">
      <div className="flex items-center gap-1.5">
        <h2 id="usage-timing" className="font-display text-lg font-semibold">
          Estimated vs actual time
        </h2>
        {data && (
          <InfoTip label="About the time estimate">
            Each question's time is estimated from what it asks: reading at {data.constants.readWpm} words a minute,{" "}
            {data.constants.codeLineSec} s per line of code read, {data.constants.writeLineSec} s per line written,{" "}
            {data.constants.cellSec} s per spreadsheet cell, writing at {data.constants.writeWpm} words a minute, plus{" "}
            {data.constants.thinkSec} s to think. Recalibrated weekly from real answer times.
          </InfoTip>
        )}
      </div>
      <p className="mt-0.5 text-sm text-muted-foreground">Finished assessments, newest first.</p>

      <div className="mt-3">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : !chart ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Loading…
          </p>
        ) : chart.rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No finished assessments in this period.</p>
        ) : (
          <figure className="rounded-lg border p-3 sm:p-4">
            <figcaption className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full border-2 border-basalt bg-background" aria-hidden="true" />
                Estimated
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-primary" aria-hidden="true" />
                Actual
              </span>
              {chart.medianRatio !== null && (
                <span className="ml-auto">Median: {Math.round(chart.medianRatio * 100)}% of the estimate</span>
              )}
            </figcaption>

            <ul className="space-y-1">
              {chart.rows.map((row) => (
                <li
                  key={row.assessmentId}
                  className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_4.5rem]"
                >
                  <span className="truncate text-xs" title={row.learner}>
                    {row.learner}
                    <span className="block font-mono text-[10px] text-muted-foreground">{row.date}</span>
                  </span>
                  <div
                    className="relative h-6"
                    title={`${row.learner}: ${row.estSeconds > 0 ? `est. ${formatMinutes(row.estSeconds)}` : "no estimate (before v4.1)"}, took ${formatMinutes(row.actualSeconds)}, AI ${formatCostMicros(row.costMicros)}`}
                  >
                    <span className="absolute inset-x-0 top-1/2 border-t border-border/60" aria-hidden="true" />
                    {row.estSeconds > 0 && (
                      <>
                        <span
                          className={cn("absolute top-1/2 h-0.5 -translate-y-1/2", row.over ? "bg-trailmark" : "bg-primary/40")}
                          style={{ left: `${Math.min(row.estPct, row.actualPct)}%`, width: `${Math.abs(row.actualPct - row.estPct)}%` }}
                          aria-hidden="true"
                        />
                        <span
                          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-basalt bg-background"
                          style={{ left: `${row.estPct}%` }}
                          aria-hidden="true"
                        />
                      </>
                    )}
                    <span
                      className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-background"
                      style={{ left: `${row.actualPct}%` }}
                      aria-hidden="true"
                    />
                    <span className="sr-only">
                      {row.estSeconds > 0 ? `Estimated ${formatMinutes(row.estSeconds)}, ` : "No estimate, "}actual {formatMinutes(row.actualSeconds)}.
                    </span>
                  </div>
                  <span className="hidden text-right font-mono text-[11px] text-muted-foreground tabular sm:block">
                    {formatMinutes(row.actualSeconds)}
                  </span>
                </li>
              ))}
            </ul>

            <div
              className="mt-1 grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-2 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_4.5rem]"
              aria-hidden="true"
            >
              <span />
              <div className="flex justify-between border-t pt-1 font-mono text-[10px] text-muted-foreground tabular">
                {chart.ticks.map((tick) => (
                  <span key={tick}>{tick}</span>
                ))}
              </div>
            </div>
            <p className="mt-1 text-center text-xs text-muted-foreground">Minutes (each row is one assessment)</p>
          </figure>
        )}
      </div>
    </section>
  );
}
