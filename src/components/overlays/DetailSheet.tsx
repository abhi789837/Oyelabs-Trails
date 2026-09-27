import type { ReactNode } from "react";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface DetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The record's name. Rendered as the panel's accessible title. */
  title: ReactNode;
  /** One line under it — a username, an id, a timestamp. Usually monospaced context, not prose. */
  subtitle?: ReactNode;
  /**
   * What the panel is, for screen readers, when the title alone does not say it. Rendered
   * visually hidden, because a sighted reader already has the record in front of them.
   */
  description?: string;
  /** Actions, pinned to the bottom edge so a long body scrolls under them rather than past them. */
  footer?: ReactNode;
  /** `md` (default) suits a field list; `lg` suits a panel with a table or a transcript in it. */
  size?: "md" | "lg";
  side?: "left" | "right";
  className?: string;
  children: ReactNode;
}

/**
 * A record-detail panel: the thing a table row opens into.
 *
 * It is a slide-over rather than a modal on purpose — the row it came from stays on screen behind
 * it, so "which learner am I looking at" is answered by the page, not by memory. Header and footer
 * are fixed and only the body scrolls, so the actions never drift off the bottom of a long record.
 */
export function DetailSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  description,
  footer,
  size = "md",
  side = "right",
  className,
  children,
}: DetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        size={size}
        closeLabel="Close details"
        className={cn("flex w-full flex-col p-0 sm:w-[85vw]", className)}
      >
        <header className="border-b px-5 py-4 pr-12">
          <SheetTitle>{title}</SheetTitle>
          {subtitle && <p className="mt-1 font-mono text-xs text-muted-foreground">{subtitle}</p>}
          {description && <SheetDescription className="sr-only">{description}</SheetDescription>}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer && (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t px-5 py-4">{footer}</footer>
        )}
      </SheetContent>
    </Sheet>
  );
}
