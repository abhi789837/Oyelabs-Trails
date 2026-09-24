import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * An initials avatar.
 *
 * There are no profile photographs anywhere in Oyelearn — accounts are created by a superadmin and
 * nobody uploads anything — so this is deliberately not the usual image-with-fallback component.
 * It is the fallback, and it is the whole thing.
 */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: "sm" | "md";
  /** Marks the wearer as a superadmin, which is the only identity distinction the app makes. */
  elevated?: boolean;
}

export function Avatar({ name, size = "md", elevated = false, className, ...props }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border font-mono font-medium uppercase",
        size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs",
        elevated ? "border-primary/40 bg-primary/10 text-primary-strong" : "border-border bg-surface-sunken text-muted-foreground",
        className,
      )}
      {...props}
    >
      {initialsOf(name)}
    </span>
  );
}
