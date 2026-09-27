import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

/**
 * A non-modal panel anchored to its trigger: a filter, a small form, a menu of controls.
 *
 * It is not a dialog. The page behind it keeps scrolling and stays reachable, which is right for
 * a filter you open, adjust and leave open while reading the table underneath. Anything that must
 * be answered before continuing belongs in `useConfirm` or `useFormDialog` instead.
 *
 * `--radix-popover-content-available-height` is the room Radix measured between the trigger and
 * the viewport edge. Capping the panel to it is what stops a long faceted list from running off
 * the bottom of a laptop screen with its footer unreachable.
 */
const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverAnchor = PopoverPrimitive.Anchor;
const PopoverClose = PopoverPrimitive.Close;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
/* Defaults match the registry's (`align="center"`, a 4px offset) so a call site that passes
   neither sits where its author expected. The table filters pass `align="start"` explicitly,
   because a filter panel reads as belonging to the button on its left edge, not centred under it. */
>(({ className, align = "center", sideOffset = 4, collisionPadding = 12, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      className={cn(
        "z-50 max-h-[var(--radix-popover-content-available-height)] w-72 overflow-y-auto overscroll-contain rounded-lg border bg-surface p-3 text-foreground shadow-lg shadow-ink/10 dark:shadow-black/50",
        "origin-[var(--radix-popover-content-transform-origin)] animate-in fade-in-0 zoom-in-95 duration-[120ms]",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverClose };
