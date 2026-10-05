import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "../cn";

export const buttonVariants = cva(
  [
    "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium",
    "transition-[background-color,color,box-shadow,transform] duration-120 ease-enter",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    "[&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        /** The one thing to do on this screen. One per view. */
        primary: "bg-brand text-on-brand shadow-e1 hover:bg-brand/90",
        secondary: "border border-line-2/60 bg-surface-1 text-fg-1 hover:bg-sunken",
        ghost: "text-fg-1 hover:bg-sunken",
        danger: "bg-danger text-on-danger hover:bg-danger/90",
        success: "bg-success text-on-success hover:bg-success/90",
        link: "h-auto px-0 text-brand-fg underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-small",
        md: "h-(--v5-control-h) px-4 text-small",
        lg: "h-12 px-6 text-body",
        icon: "size-(--v5-control-h)",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Render the child (a router Link, an anchor) with button styling. */
  asChild?: boolean;
  /** Shows a spinner and blocks clicks; the label stays so the width does not jump. */
  loading?: boolean;
}

/**
 * The v5 button. Labels say what happens ("Send the test"), never "Submit".
 * `icon` size needs an `aria-label`.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, type, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
          {children}
        </Slot>
      );
    }
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
