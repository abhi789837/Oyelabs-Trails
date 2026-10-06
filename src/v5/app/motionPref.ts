import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { api } from "@/api/client";
import type { ReducedMotionPref } from "@/v5/design/motion";

/**
 * The learner's saved reduced-motion preference (Me → Settings: "system" | "on" | "off"), applied
 * to every v5 screen, not only Me:
 *
 * - V5App passes it to the root `V5MotionProvider`, so Motion's `MotionConfig` follows it and every
 *   screen's own provider inherits it;
 * - `<html data-motion="reduce">` (the v5 token CSS flattens transitions and keyframes with it; the
 *   same attribute `useV5Root` sets) and `data-reduced-motion="<pref>"` are kept in step.
 *
 * Read once from `GET /api/v5/me/settings` when V5App mounts, and again after leaving the Me screen
 * (where it can change). Until then, and if the read fails, it is "system" (the OS setting).
 */
export function parseMotionPref(value: unknown): ReducedMotionPref {
  return value === "on" || value === "off" || value === "system" ? value : "system";
}

/** The attributes `<html>` should carry for a preference. */
export function motionAttributes(pref: ReducedMotionPref): { "data-motion": "reduce" | null; "data-reduced-motion": ReducedMotionPref } {
  return { "data-motion": pref === "on" ? "reduce" : null, "data-reduced-motion": pref };
}

export function useAppMotionPref(): ReducedMotionPref {
  const { pathname } = useLocation();
  const [pref, setPref] = useState<ReducedMotionPref>("system");
  const [version, setVersion] = useState(0);
  const lastPath = useRef(pathname);

  // Leaving Me (where the setting lives) reads it again.
  useEffect(() => {
    if (lastPath.current.startsWith("/learn/me") && !pathname.startsWith("/learn/me")) setVersion((v) => v + 1);
    lastPath.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<{ settings: { reducedMotion?: unknown } }>("/api/v5/me/settings", controller.signal)
      .then((res) => setPref(parseMotionPref(res.settings?.reducedMotion)))
      .catch(() => undefined);
    return () => controller.abort();
  }, [version]);

  // Re-applied on every navigation too: a screen that sets its own value (Me) removes the attribute
  // when it unmounts.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const attrs = motionAttributes(pref);
    if (attrs["data-motion"]) root.setAttribute("data-motion", attrs["data-motion"]);
    else root.removeAttribute("data-motion");
    root.setAttribute("data-reduced-motion", attrs["data-reduced-motion"]);
  }, [pref, pathname]);

  useLayoutEffect(
    () => () => {
      document.documentElement.removeAttribute("data-motion");
      document.documentElement.removeAttribute("data-reduced-motion");
    },
    [],
  );

  return pref;
}
