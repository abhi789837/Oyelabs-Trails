import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Render the child as the card, so a whole card can be one button. */
  asChild?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";
  return <Comp ref={ref} className={cn("rounded-lg border bg-surface", className)} {...props} />;
});
Card.displayName = "Card";

export { Card };
