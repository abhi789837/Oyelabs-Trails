import type { ReactNode } from "react";
import { motion } from "motion/react";
import { FilterX, Inbox, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";
import { fadeUp } from "@/lib/motion";
import type { EmptyStateCopy } from "./types";

/**
 * The three things a table shows when it is not showing rows.
 *
 * The distinction that matters is between the two empty states. "Nothing here yet" and "nothing
 * matches" are completely different situations with completely different ways out — one needs a
 * button that creates the first record, the other needs a button that undoes the filter — and a
 * single "No results" message serves neither. A new admin who sees "No results" on an empty
 * People table and cannot find the onboard button has been failed by one shared string.
 */

/** Rows of grey boxes at the real row height, so nothing moves when the data lands. */
export function SkeletonRows({ rows, columns }: { rows: number; columns: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, row) => (
        <TableRow key={row} aria-hidden="true">
          {Array.from({ length: columns }, (_, column) => (
            <TableCell key={column}>
              {/* Uneven widths: a column of identical bars reads as a loading *pattern* rather
                  than as rows of text that are on their way. */}
              <Skeleton className="h-4" style={{ width: `${[85, 60, 72, 45, 90, 55][(row + column) % 6]}%` }} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function EmptyState({ copy, icon }: { copy: EmptyStateCopy; icon?: ReactNode }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center px-6 py-14 text-center"
    >
      <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-surface-sunken text-muted-foreground [&_svg]:size-5">
        {icon ?? <Inbox aria-hidden="true" />}
      </span>
      <h3 className="font-brand text-base font-semibold">{copy.title}</h3>
      <p className="mt-1 max-w-sm text-balance text-sm text-muted-foreground">{copy.body}</p>
      {copy.action && <div className="mt-4">{copy.action}</div>}
    </motion.div>
  );
}

/** Nothing matched the filters — so the way out is to remove them, not to create a record. */
export function NoMatchesState({ onClear, searched }: { onClear: () => void; searched: string }) {
  return (
    <EmptyState
      icon={<FilterX aria-hidden="true" />}
      copy={{
        title: "Nothing matches these filters",
        body: searched
          ? `No rows contain “${searched}”. Try a shorter search, or clear the filters to see everything again.`
          : "Every row has been filtered out. Clear the filters to see everything again.",
        action: (
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear filters
          </Button>
        ),
      }}
    />
  );
}

/**
 * A failed load.
 *
 * It says what failed and offers the retry, and it never shows the raw error — a stack trace or a
 * SQL fragment on an admin screen is both useless to read and a way to learn about the inside of
 * the server. The message here comes from the API's `message` field, which is written to be read.
 */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      role="alert"
      className="flex flex-col items-center px-6 py-14 text-center"
    >
      <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive [&_svg]:size-5">
        <TriangleAlert aria-hidden="true" />
      </span>
      <h3 className="font-brand text-base font-semibold">Could not load this table</h3>
      <p className="mt-1 max-w-sm text-balance text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
          Try again
        </Button>
      )}
    </motion.div>
  );
}
