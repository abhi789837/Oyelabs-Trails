import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

/*
 * Its own file (Phase 9): in Primitives.tsx it put the Radix tooltip and popper code (about 13 KB
 * gzipped) into every route that used a Badge or Tabs, which pushed learner routes over budget.
 */

export const TooltipProvider = TooltipPrimitive.Provider;

/**
 * A short label on hover and focus. Never the only place information lives: touch users never see
 * it. `content` is a few words; anything longer belongs on the page.
 */
export function Tooltip({ content, children, side = "top" }: { content: ReactNode; children: ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
  // Its own provider (Radix allows nesting), so v5 screens need no app-wide TooltipProvider and the
  // Radix tooltip code stays out of every route's first download (DECISIONS, Integration fixes).
  return (
    <TooltipPrimitive.Provider delayDuration={300}>
      <TooltipPrimitive.Root delayDuration={300}>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            className="z-50 max-w-64 rounded-md bg-fg-1 px-2.5 py-1.5 text-caption font-medium text-surface-1 shadow-e2"
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
