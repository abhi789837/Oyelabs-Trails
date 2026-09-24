import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { motion, type HTMLMotionProps } from "motion/react";

import { press } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Every variant carries a 1px border, transparent where the fill already draws the edge. That
 * keeps an outline button and a filled button the same size to the pixel, so swapping one for the
 * other in a toolbar does not shift the row.
 *
 * The 120ms transition matches `duration.fast` in `lib/motion.ts`; CSS cannot import it, so this
 * is the one place the number is written twice. Only colour and transform are transitioned.
 */
const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent text-sm font-medium transition-[color,background-color,border-color,opacity,transform] duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/85",
        summit: "bg-summit text-summit-foreground hover:bg-summit/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:outline-destructive",
        outline: "border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-foreground underline decoration-trailmark decoration-2 underline-offset-4 hover:decoration-trailmark-strong",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "children">,
    VariantProps<typeof buttonVariants> {
  /** Render the child as the button, so a `<Link>` can wear the button's clothes. */
  asChild?: boolean;
  /** Swap the label for a spinner without changing the button's width. */
  loading?: boolean;
  /** Narrower than motion's own `children`, which also accepts a `MotionValue`. */
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    /* While loading the button is disabled so it cannot be double-submitted, but it must not fade:
       a 50%-opacity spinner reads as broken rather than busy. twMerge resolves the later
       `opacity-100` over the base `opacity-50` deterministically, which stylesheet order would not. */
    const classes = cn(
      buttonVariants({ variant, size }),
      loading && "disabled:opacity-100 aria-disabled:opacity-100",
      className,
    );

    if (asChild) {
      /* Slot takes exactly one child and forwards its props to it, so there is no element of ours
         to hang `whileTap` on and nowhere to overlay a spinner. Press feedback falls back to CSS,
         which the `prefers-reduced-motion` block in index.css already flattens. */
      return (
        <Slot
          ref={ref}
          className={cn(classes, "active:scale-[0.97]")}
          {...(props as React.ComponentPropsWithoutRef<typeof Slot>)}
        >
          {children}
        </Slot>
      );
    }

    return (
      <motion.button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        whileTap={press}
        {...props}
      >
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <LoaderCircle className="animate-spin" />
          </span>
        )}
        {/* The label keeps its box and only loses opacity, so the button cannot resize mid-save
            and the accessible name does not disappear while the action is running. */}
        <span className={cn("inline-flex items-center gap-2", loading && "opacity-0")}>{children}</span>
      </motion.button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
