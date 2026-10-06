import type { MouseEvent } from "react";

import { cn } from "../cn";

/**
 * "Skip to content" (WCAG 2.4.1). Put it first in the page so Tab reaches it first. It moves focus
 * (not only the scroll position) to the target, so the next Tab continues from the content.
 *
 * `target` is an element id. When no element has that id (a screen that renders its own `<main>`
 * without one), it falls back to the first `<main>` on the page, then to the first `<h1>`, so frames
 * we don't own still work.
 */
export function SkipLink({ target = "v5-main", className, tone = "v5" }: { target?: string; className?: string; tone?: "v5" | "shared" }) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // A frame with no <main> yet (the assessment pre-flight) still gets a useful jump: its heading.
    const el = document.getElementById(target) ?? document.querySelector<HTMLElement>("main") ?? document.querySelector<HTMLElement>("h1");
    if (!el) return;
    event.preventDefault();
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: "start" });
  };
  return (
    <a
      href={`#${target}`}
      onClick={onClick}
      data-testid="skip-link"
      className={cn(
        "sr-only z-[100] px-4 py-2 font-medium focus:not-sr-only focus:fixed focus:left-3 focus:top-3",
        // "shared" uses names both designs define, for frames that may show an old page.
        tone === "v5"
          ? "rounded-control bg-brand text-on-brand shadow-e2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          : "rounded-md bg-primary text-primary-foreground shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong",
        className,
      )}
    >
      Skip to content
    </a>
  );
}
