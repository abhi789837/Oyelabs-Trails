import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A placeholder for content that is on its way.
 *
 * Worth the component rather than a spinner for one reason: a table that swaps a centred spinner
 * for 25 rows jumps the page and throws away the reader's scroll position. Skeleton rows hold the
 * same space the real rows will take, so nothing moves when they arrive.
 *
 * Only use it when the shape is genuinely known in advance. A skeleton that turns out to be the
 * wrong height is a worse jump than no skeleton, and a skeleton for an empty result is a lie.
 *
 * `animate-pulse` is a CSS keyframe animation, so motion's `reducedMotion` setting cannot reach
 * it. The global `prefers-reduced-motion` block in `index.css` flattens it instead.
 */
const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      // Hidden from the accessibility tree: there is nothing here to announce, and the component
      // showing it is expected to own an `aria-busy` region that says "Loading" once.
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-surface-sunken", className)}
      {...props}
    />
  ),
);
Skeleton.displayName = "Skeleton";

export { Skeleton };
