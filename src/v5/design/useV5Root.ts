import { useLayoutEffect, useState } from "react";

import type { Density } from "./density";
import type { ReducedMotionPref } from "./motion";

export interface V5RootOptions {
  density?: Density;
  /** The learner's reduced-motion preference. "on" also flattens CSS transitions. */
  reducedMotion?: ReducedMotionPref | null;
}

/**
 * Turns the v5 tokens on for the whole document while the calling component is mounted.
 *
 * Sets `data-ui="v5"` (and `data-density`, `data-motion`) on <html>; removes them on unmount, so
 * switching back to the previous design leaves the old UI exactly as it was. Theme (light/dark)
 * stays on the existing `.dark` class that `uiStore` manages.
 *
 * Call it once, at the top of `V5App`, with the learner's density and reduced-motion prefs. The
 * design page calls it too (no options), so it also works on its own; nested calls are safe.
 */
export function useV5Root({ density, reducedMotion }: V5RootOptions = {}): void {
  // Set during the first render, not only in an effect: children's layout effects run before their
  // parent's, so a child that reads a token on mount (a swatch, a chart colour) would otherwise
  // see no v5 values when it commits in the same pass. Setting an attribute is idempotent.
  // Only the outermost caller "owns" the scope: a nested call (DesignPage inside V5App) never
  // removes it on unmount.
  const [owner] = useState(() => {
    if (typeof document === "undefined") return { owns: false, before: null as string | null };
    const before = document.documentElement.getAttribute("data-ui");
    document.documentElement.setAttribute("data-ui", "v5");
    return { owns: before !== "v5", before };
  });

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-ui", "v5");
    return () => {
      if (!owner.owns) return;
      if (owner.before === null) root.removeAttribute("data-ui");
      else root.setAttribute("data-ui", owner.before);
    };
  }, [owner]);

  // Density and motion are only touched when passed, so a nested call doesn't reset them.
  useLayoutEffect(() => {
    if (!density) return;
    const root = document.documentElement;
    root.setAttribute("data-density", density);
    return () => root.removeAttribute("data-density");
  }, [density]);

  useLayoutEffect(() => {
    if (reducedMotion === undefined) return;
    const root = document.documentElement;
    if (reducedMotion === "on") root.setAttribute("data-motion", "reduce");
    else root.removeAttribute("data-motion");
    return () => root.removeAttribute("data-motion");
  }, [reducedMotion]);
}
