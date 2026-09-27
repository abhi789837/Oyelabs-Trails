import { useEffect, useState } from "react";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";

import { PAGE_SIZE_OPTIONS, pageRange, type PageMeta } from "@shared/table";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Page controls, and the sentence that says where you are.
 *
 * "Showing 21–40 of 312" is the part that matters. Page numbers alone leave the reader doing
 * arithmetic to answer "have I looked at all of them yet", which is the only question pagination
 * is ever really asked.
 *
 * First and last are here because a table sorted newest-first has its most interesting rows at
 * both ends, and walking to the end one page at a time is not a navigation model.
 */

export interface DataTablePaginationProps {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  /** Number of rows ticked, announced alongside the range. */
  selectedCount?: number;
  /** While true the count says "Loading…" rather than "No results" — see below. */
  loading?: boolean;
  className?: string;
}

export function DataTablePagination({
  meta,
  onPageChange,
  onPageSizeChange,
  selectedCount = 0,
  loading = false,
  className,
}: DataTablePaginationProps) {
  const range = pageRange(meta);
  const [jump, setJump] = useState(String(meta.page));

  useEffect(() => setJump(String(meta.page)), [meta.page]);

  const commitJump = () => {
    const next = Number(jump);
    if (!Number.isFinite(next)) return setJump(String(meta.page));
    onPageChange(Math.min(Math.max(1, Math.trunc(next)), meta.pageCount));
  };

  const first = meta.page <= 1;
  const last = meta.page >= meta.pageCount;

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 text-sm", className)}>
      <div className="flex items-center gap-4">
        {/* The one live region on the table. It announces the result count on every filter change,
            which is the feedback a screen-reader user otherwise has no way to get. */}
        {/* "No results" while a request is still in flight is a claim the table cannot make yet —
            an empty `meta` before the first response is indistinguishable from a genuinely empty
            one, and announcing the wrong one to a screen reader is worse than announcing nothing.
            So an in-flight table says it is loading and corrects itself when the count arrives. */}
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {loading
            ? "Loading…"
            : meta.total === 0
              ? "No results"
              : `${meta.total} result${meta.total === 1 ? "" : "s"}`}
          {!loading && range && meta.pageCount > 1 && (
            <span className="hidden sm:inline">
              {" · "}
              Showing {range.from}–{range.to}
            </span>
          )}
          {selectedCount > 0 && <span className="text-foreground"> · {selectedCount} selected</span>}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <label htmlFor="data-table-page-size" className="text-xs text-muted-foreground">
            Rows
          </label>
          <select
            id="data-table-page-size"
            value={meta.pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-8 rounded-md border border-input bg-surface px-2 text-xs transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <nav aria-label="Pagination" className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(1)}
            disabled={first}
            aria-label="First page"
          >
            <ChevronFirst aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(meta.page - 1)}
            disabled={first}
            aria-label="Previous page"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>

          <div className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
            <label htmlFor="data-table-page" className="sr-only">
              Page number
            </label>
            <input
              id="data-table-page"
              inputMode="numeric"
              value={jump}
              onChange={(event) => setJump(event.target.value.replace(/[^0-9]/g, ""))}
              onBlur={commitJump}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitJump();
                }
              }}
              className="h-8 w-11 rounded-md border border-input bg-surface px-1 text-center font-mono tabular transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
            />
            <span>of {meta.pageCount}</span>
          </div>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(meta.page + 1)}
            disabled={last}
            aria-label="Next page"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(meta.pageCount)}
            disabled={last}
            aria-label="Last page"
          >
            <ChevronLast aria-hidden="true" />
          </Button>
        </nav>
      </div>
    </div>
  );
}
