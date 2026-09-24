import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { spring, transition } from "@/lib/motion";
import type { BulkAction } from "./types";

/**
 * The bar that rises from the bottom once rows are ticked.
 *
 * It is fixed to the viewport rather than pinned under the table, because the selection survives
 * scrolling and an action bar that has scrolled out of sight is an action bar that gets hunted
 * for. It also stays out of the table's own layout, so nothing reflows when it appears.
 *
 * Every action runs against the rows that were selected **at the moment it was clicked**, and the
 * selection is only cleared once the action resolves. A failed bulk disable leaves the twelve
 * learners still ticked, ready to retry, instead of making the admin find them again.
 */

export interface BulkActionBarProps<TRow> {
  rows: TRow[];
  actions: readonly BulkAction<TRow>[];
  onClear: () => void;
  /** What one row is called: "learner", "event". Pluralised with an "s". */
  noun?: string;
}

export function BulkActionBar<TRow>({ rows, actions, onClear, noun = "row" }: BulkActionBarProps<TRow>) {
  const [running, setRunning] = useState<string | null>(null);
  const count = rows.length;

  const run = async (action: BulkAction<TRow>) => {
    setRunning(action.id);
    try {
      await action.run(rows);
      onClear();
    } catch {
      // The action reports its own failure — a toast, or an error on the page. The selection is
      // deliberately kept so the same rows can be tried again.
    } finally {
      setRunning(null);
    }
  };

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: spring }}
          exit={{ opacity: 0, y: 12, transition: transition.exit }}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-4"
        >
          <div
            role="region"
            aria-label={`${count} ${noun}${count === 1 ? "" : "s"} selected`}
            className="pointer-events-auto flex max-w-full flex-wrap items-center gap-2 rounded-lg border bg-surface px-3 py-2 shadow-lg shadow-ink/15 dark:shadow-black/60"
          >
            <p aria-live="polite" className="px-1 text-sm font-medium">
              {count} {noun}
              {count === 1 ? "" : "s"} selected
            </p>

            <span aria-hidden="true" className="h-5 w-px bg-border" />

            {actions.map((action) => (
              <Button
                key={action.id}
                size="sm"
                variant={action.tone === "destructive" ? "destructive" : "outline"}
                loading={running === action.id}
                disabled={running !== null && running !== action.id}
                onClick={() => void run(action)}
                className="gap-1.5"
              >
                {action.icon}
                {action.label}
              </Button>
            ))}

            <Button size="icon-sm" variant="ghost" onClick={onClear} aria-label="Clear selection">
              <X aria-hidden="true" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
