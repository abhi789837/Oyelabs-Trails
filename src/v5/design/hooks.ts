import { useEffect, useState } from "react";

/** Subscribes to a media query. Server/test safe: false when `matchMedia` is missing. */
export function useMediaQuery(query: string): boolean {
  const get = () => (typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    onChange();
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/** Below 768px: bottom nav, bottom sheets, tabbed split views. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

export function usePrefersReducedMotion(): boolean {
  const system = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [forced, setForced] = useState(() => typeof document !== "undefined" && document.documentElement.dataset.motion === "reduce");
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setForced(root.dataset.motion === "reduce"));
    observer.observe(root, { attributes: true, attributeFilter: ["data-motion"] });
    return () => observer.disconnect();
  }, []);
  return system || forced;
}
