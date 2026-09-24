import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * One card surface, with **two** elevations and no more.
 *
 * The house rule (brief §3) is that identical shadowed cards everywhere is the look of a generic
 * AI app. A card earns its separation from density, its border and a tint — the things that carry
 * meaning — and only borrows a shadow when it genuinely floats above the page. Stacking a third
 * shadow to say "this one matters more" is the failure mode this variant list exists to prevent.
 *
 * `density` is deliberately unset by default: plenty of cards here wrap a button or a link that
 * owns its own padding, and a default padding would double it.
 */
const cardVariants = cva("rounded-lg border bg-surface", {
  variants: {
    elevation: {
      flat: "",
      raised: "shadow-sm shadow-ink/10 dark:shadow-black/40",
    },
    /** Semantic tints only. For a track accent, pass `accentClasses[token].border` + `.soft`. */
    tone: {
      none: "",
      quiet: "border-transparent bg-surface-sunken",
      progress: "border-trailmark/40 bg-trailmark/[0.07]",
      success: "border-summit/40 bg-summit/[0.07]",
      danger: "border-destructive/40 bg-destructive/[0.06]",
    },
    density: {
      compact: "p-3",
      cozy: "p-4",
      roomy: "p-6",
    },
  },
  defaultVariants: {
    elevation: "flat",
    tone: "none",
  },
});

export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  /** Render the child as the card, so a whole card can be one button. */
  asChild?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevation, tone, density, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp ref={ref} className={cn(cardVariants({ elevation, tone, density }), className)} {...props} />
    );
  },
);
Card.displayName = "Card";

export { Card, cardVariants };
