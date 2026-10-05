import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "../cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** 1 sits on the page (default), 2 floats above other cards. 0 is a flat, bordered well. */
  elevation?: 0 | 1 | 2;
  /** Hover lift, for a card that is itself a link or button. */
  interactive?: boolean;
}

/**
 * A surface. Padding follows density (`p-(--v5-card-pad)`). Don't nest cards: use a `Card` and plain sections.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, elevation = 1, interactive, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-card border p-(--v5-card-pad) text-fg-1",
      elevation === 0 && "border-line-1 bg-sunken",
      elevation === 1 && "border-line-1 bg-surface-1 shadow-e1",
      elevation === 2 && "border-line-1 bg-surface-2 shadow-e2",
      interactive && "transition-[box-shadow,transform] duration-200 ease-enter hover:-translate-y-0.5 hover:shadow-e2 focus-within:shadow-e2",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

export function CardHeader({ title, description, action, className }: { title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h3 className="font-display text-h4 font-semibold text-fg-1">{title}</h3>
        {description ? <p className="mt-0.5 text-small text-fg-2">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
