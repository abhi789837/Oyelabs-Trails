import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

import { EMPTY_TABLE_QUERY, type TableQuery } from "@shared/table";

import { Button } from "@/components/ui/button";
import { spring, transition } from "@/lib/motion";
import { AdvancedFilter } from "./filters/AdvancedFilter";
import { QuickFilter } from "./filters/QuickFilters";
import type { TableFieldDef } from "./types";

/**
 * The filters, as a sheet from the bottom, on small screens.
 *
 * A bottom sheet rather than the side sheet the rest of the app uses, for one reason: on a phone
 * the controls end up under the thumb instead of at the top of a 700-pixel-tall panel. It is
 * built directly on Radix Dialog rather than on `ui/sheet` because that component only knows
 * about left and right, and widening it for one screen would put a side effect into every other
 * sheet in the app.
 *
 * Filters apply as they are changed, not on a Done button, so the result count at the top of the
 * sheet updates while the sheet is still open. Done just closes it.
 */

export interface FilterDrawerProps<TRow> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: readonly TableFieldDef<TRow>[];
  query: TableQuery;
  onQueryChange: (next: TableQuery) => void;
  /** Rows matching right now, shown live at the foot of the sheet. */
  resultCount: number;
}

export function FilterDrawer<TRow>({
  open,
  onOpenChange,
  fields,
  query,
  onQueryChange,
  resultCount,
}: FilterDrawerProps<TRow>) {
  const quickFields = fields.filter((field) => field.quick && field.type !== "string");

  return (
    <AnimatePresence>
      {open && (
        <DialogPrimitive.Root open onOpenChange={onOpenChange}>
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={transition.fast}
                className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[6px] md:hidden"
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0, transition: spring }}
                exit={{ y: "100%", transition: transition.exit }}
                className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-xl border-t bg-surface shadow-2xl md:hidden"
              >
                {/* A grab handle. Purely a signal that this panel came from the bottom edge — it
                    is not draggable, and pretending otherwise would be worse. */}
                <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />

                <header className="flex items-center justify-between gap-2 px-4 py-3">
                  <DialogPrimitive.Title className="font-brand text-base font-semibold">Filters</DialogPrimitive.Title>
                  <DialogPrimitive.Close asChild>
                    <Button size="icon-sm" variant="ghost" aria-label="Close filters">
                      <X aria-hidden="true" />
                    </Button>
                  </DialogPrimitive.Close>
                </header>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
                  {quickFields.map((field) => (
                    <div key={field.name} className="space-y-1.5">
                      <p className="font-mono text-xs text-muted-foreground">{field.label}</p>
                      <QuickFilter field={field} query={query} onChange={onQueryChange} />
                    </div>
                  ))}

                  <div className="space-y-1.5">
                    <p className="font-mono text-xs text-muted-foreground">Everything else</p>
                    <AdvancedFilter
                      fields={fields}
                      value={query.filters}
                      onChange={(filters) => onQueryChange({ ...query, filters, page: 1 })}
                    />
                  </div>
                </div>

                <footer className="flex items-center gap-2 border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => onQueryChange({ ...EMPTY_TABLE_QUERY, pageSize: query.pageSize })}
                  >
                    Clear all
                  </Button>
                  <Button className="flex-1" onClick={() => onOpenChange(false)}>
                    Show {resultCount} {resultCount === 1 ? "result" : "results"}
                  </Button>
                </footer>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}
    </AnimatePresence>
  );
}
