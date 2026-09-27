import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A keyboard hint.
 *
 * Shortcuts are only worth advertising if the hint matches the keyboard in front of the person,
 * so the modifier is resolved at render rather than hard-coded to one platform. `navigator.platform`
 * is deprecated and lies on Apple Silicon browsers, hence the user-agent test.
 */
export function isAppleKeyboard(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** "⌘" on Apple hardware, "Ctrl" everywhere else. */
export function modKeyLabel(): string {
  return isAppleKeyboard() ? "⌘" : "Ctrl";
}

export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-sm border bg-surface-sunken px-1.5 font-mono text-[11px] font-medium leading-none text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
