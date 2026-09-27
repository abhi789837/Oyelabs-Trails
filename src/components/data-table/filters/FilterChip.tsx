import * as React from "react";
import { ChevronDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * The trigger every quick filter wears.
 *
 * Dashed while empty, solid once it is doing something. That is the whole visual language of the
 * toolbar: a glance across the row tells you how many filters are on without reading a word, and
 * an admin who has scrolled past their own filters can still see that the table is not showing
 * everything.
 *
 * The summary is part of the accessible name, not decoration — `aria-label` spells out
 * "Status filter, 2 selected: Active, Disabled" so the button does not read as just "Status".
 */
export interface FilterChipProps extends React.ComponentPropsWithoutRef<"button"> {
  label: string;
  /** What the filter currently says, in one short phrase. Absent means "not filtering". */
  summary?: string;
  /** Shown as a count pill instead of the summary when several values are chosen. */
  count?: number;
  active?: boolean;
}

export const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(
  ({ label, summary, count, active, className, ...props }, ref) => {
    const isActive = active ?? Boolean(summary || count);

    return (
      <button
        ref={ref}
        type="button"
        data-active={isActive || undefined}
        aria-label={isActive ? `${label} filter: ${summary ?? `${count} selected`}. Change` : `Filter by ${label}`}
        className={cn(
          "inline-flex h-8 max-w-full items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors duration-[120ms]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong",
          isActive
            ? "border-primary/40 bg-primary/10 text-primary-strong hover:bg-primary/15"
            : "border-dashed border-input text-muted-foreground hover:border-input hover:bg-accent hover:text-foreground",
          className,
        )}
        {...props}
      >
        <span className="shrink-0">{label}</span>
        {isActive && (
          <>
            <span aria-hidden="true" className="h-4 w-px shrink-0 bg-current opacity-30" />
            {count !== undefined && count > 1 ? (
              <Badge variant="brand" className="border-0 bg-transparent px-0 py-0 text-xs">
                {count} selected
              </Badge>
            ) : (
              <span className="truncate font-normal">{summary}</span>
            )}
          </>
        )}
        <ChevronDown aria-hidden="true" className="size-3.5 shrink-0 opacity-60" />
      </button>
    );
  },
);
FilterChip.displayName = "FilterChip";

/** The footer every filter popover ends with: one button that empties it. */
export function FilterClearRow({ onClear, disabled }: { onClear: () => void; disabled?: boolean }) {
  return (
    <div className="mt-2 border-t pt-2">
      <button
        type="button"
        onClick={onClear}
        disabled={disabled}
        className="w-full rounded-md px-2 py-1.5 text-center text-xs font-medium text-muted-foreground transition-colors duration-[120ms] hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong disabled:pointer-events-none disabled:opacity-40"
      >
        Clear
      </button>
    </div>
  );
}
