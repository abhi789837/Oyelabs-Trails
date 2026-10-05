import { DataTable, type DataTableProps } from "@/components/data-table";
import { cn } from "../cn";

import type { Density } from "../density";

export type V5DataTableProps<TRow> = DataTableProps<TRow> & { density?: Density };

/**
 * The admin table for v5: the existing TanStack Table kit (filters, saved views, CSV, bulk
 * actions, keyboard rows) inside a v5 surface. Inside `[data-ui="v5"]` the kit's semantic colours
 * already resolve to v5 tokens (tokens.css repoints them), so this wrapper only adds the frame
 * and the density attribute. Compact is the admin default.
 */
export function V5DataTable<TRow>({ density = "compact", className, ...props }: V5DataTableProps<TRow>) {
  return (
    <div data-density={density} className={cn("rounded-card text-fg-1", className)}>
      <DataTable {...(props as DataTableProps<TRow>)} />
    </div>
  );
}
