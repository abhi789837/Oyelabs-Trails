import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-transparent bg-foreground/10 text-foreground",
        outline: "border-border text-muted-foreground",
        progress: "border-trailmark/40 bg-trailmark/10 text-trailmark-strong",
        success: "border-summit/40 bg-summit/10 text-summit-strong",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
