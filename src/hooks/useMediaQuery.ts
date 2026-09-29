import { useEffect, useState } from "react";

/**
 * A media query as state.
 *
 * Used where the *markup* has to differ rather than the styling — a popover on a desktop and a bottom
 * sheet on a phone are two different components, not one component with different padding, and
 * rendering both and hiding one would mount two dialogs for every waypoint on the trail.
 *
 * Read synchronously on the first render, so there is no frame of the wrong one. Wrapped, because
 * `matchMedia` is missing in a server render and can throw in a locked-down browser.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => read(query));

  useEffect(() => {
    let list: MediaQueryList;
    try {
      list = window.matchMedia(query);
    } catch {
      return;
    }
    setMatches(list.matches);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

function read(query: string): boolean {
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

/** Tailwind's `sm` breakpoint, as the one place that number is written down for JavaScript. */
export function useIsNarrow(): boolean {
  return useMediaQuery("(max-width: 639px)");
}
