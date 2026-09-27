import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Semantic table chrome. No behaviour — `components/data-table` supplies that.
 *
 * Two things here are worth knowing before using it directly:
 *
 * **Density is a CSS variable, not a prop threaded through every cell.** `Table` sets
 * `--row-py` and every cell reads it, so the density toggle changes one value on one element
 * instead of re-rendering a class name onto 400 cells.
 *
 * **The sticky header needs a scrolling ancestor.** `TableScroller` is that ancestor. Put the
 * table inside it or `position: sticky` has nothing to stick to and silently does nothing.
 */

const DENSITY_VARS = {
  comfortable: "[--row-py:0.75rem]",
  compact: "[--row-py:0.375rem]",
} as const;

export type TableDensity = keyof typeof DENSITY_VARS;

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  density?: TableDensity;
  /**
   * Honour per-column widths. Required for column resizing — an `auto` layout ignores the width
   * you hand it the moment the content is wider.
   */
  fixed?: boolean;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, density = "comfortable", fixed = false, ...props }, ref) => (
    <table
      ref={ref}
      data-density={density}
      className={cn("w-full caption-bottom border-separate border-spacing-0 text-sm", DENSITY_VARS[density], fixed && "table-fixed", className)}
      {...props}
    />
  ),
);
Table.displayName = "Table";

/**
 * The scroll container. `overflow-auto` plus a height is what makes the sticky header work, and
 * `overscroll-contain` stops a flick at the end of the table scrolling the page behind it.
 */
const TableScroller = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("relative w-full overflow-auto overscroll-contain", className)} {...props} />
  ),
);
TableScroller.displayName = "TableScroller";

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  sticky?: boolean;
}

/**
 * `border-separate` on the table plus a bottom border on each `th` — not `border-b` on the row —
 * because a sticky header drawn with a collapsed border loses that border as it detaches.
 */
const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, sticky = false, ...props }, ref) => (
    <thead ref={ref} className={cn(sticky && "sticky top-0 z-20", className)} {...props} />
  ),
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <tbody ref={ref} className={className} {...props} />,
);
TableBody.displayName = "TableBody";

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
  /** Adds the pointer and hover tint. Set it when the row genuinely opens something. */
  interactive?: boolean;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, selected, interactive, ...props }, ref) => (
    <tr
      ref={ref}
      data-state={selected ? "selected" : undefined}
      className={cn(
        "transition-colors duration-[120ms]",
        interactive && "cursor-pointer hover:bg-surface-sunken/70",
        selected && "bg-primary/[0.07]",
        // The ring sits inside, so a focused row does not widen the table by two pixels.
        "focus-visible:outline-none focus-visible:[&>td]:bg-primary/[0.06] focus-visible:[&>td:first-child]:shadow-[inset_2px_0_0_0_rgb(var(--ring))]",
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "relative border-b bg-surface px-3 py-2 text-left align-middle font-mono text-xs font-medium tracking-wide text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn("border-b px-3 py-[var(--row-py,0.75rem)] align-middle transition-colors duration-[120ms]", className)}
      {...props}
    />
  ),
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-3 text-sm text-muted-foreground", className)} {...props} />
  ),
);
TableCaption.displayName = "TableCaption";

export { Table, TableScroller, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption };
