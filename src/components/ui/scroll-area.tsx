import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A scrolling region with a thin, themed scrollbar.
 *
 * Deliberately the native overflow rather than an overlay-scrollbar library: the two places this
 * is used (the notification list and the command palette's results) are keyboard-driven, and a
 * virtual scroller breaks `scrollIntoView` on the active item, which is how keyboard navigation
 * stays visible. Native scrolling also keeps the browser's own touch and trackpad behaviour.
 *
 * `overscroll-contain` stops a flick at the end of the list from scrolling the page behind it.
 */
export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Anything Tailwind can express as a height or max-height, applied via `className`. */
  children?: React.ReactNode;
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "overflow-y-auto overscroll-contain",
        "[scrollbar-color:rgb(var(--basalt)/0.45)_transparent] [scrollbar-width:thin]",
        "[&::-webkit-scrollbar]:w-1.5",
        "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-basalt/40",
        "[&::-webkit-scrollbar-track]:bg-transparent",
        className,
      )}
      {...props}
    />
  ),
);
ScrollArea.displayName = "ScrollArea";
