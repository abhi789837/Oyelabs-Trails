import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "../cn";

import type { Density } from "../density";

export const DensityContext = createContext<Density>("comfortable");
export const useDesignDensity = () => useContext(DensityContext);

/** True once the element is within `margin` of the viewport (or immediately when `eager`). */
export function useNearViewport<T extends Element>(eager: boolean, margin = "800px"): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(eager);
  useEffect(() => {
    if (near || !ref.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setNear(true);
    }, { rootMargin: margin });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [near, margin]);
  return [ref, near];
}

/** A page section that mounts its (lazy) content only as it nears the viewport. */
export function DesignSection({ id, title, intro, eager, minHeight = 600, children }: { id: string; title: string; intro?: ReactNode; eager: boolean; minHeight?: number; children: ReactNode }) {
  const [ref, near] = useNearViewport<HTMLElement>(eager);
  return (
    <section ref={ref} id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 border-t border-line-1 py-12 first:border-t-0">
      <h2 id={`${id}-title`} className="font-display text-h1 font-semibold text-fg-1">
        {title}
      </h2>
      {intro ? <div className="mt-2 max-w-article text-body text-fg-2">{intro}</div> : null}
      <div className="mt-8" style={near ? undefined : { minHeight }}>
        {near ? children : null}
      </div>
    </section>
  );
}

/**
 * The same content in a light and a dark pane, side by side (stacked on a phone), at the page's
 * density. Works because v5 components take their theme from tokens, not from `dark:` classes.
 */
export function Preview({ children, className, paneClassName, single }: { children: ReactNode | ((theme: "light" | "dark") => ReactNode); className?: string; paneClassName?: string; single?: boolean }) {
  const density = useDesignDensity();
  const themes = single ? (["light"] as const) : (["light", "dark"] as const);
  return (
    <div className={cn("grid gap-3", !single && "lg:grid-cols-2", className)}>
      {themes.map((theme) => (
        <div
          key={theme}
          data-density={density}
          className={cn(theme === "light" ? "v5-light" : "dark", "relative min-w-0 rounded-card border border-line-1 bg-surface-0 p-4 text-fg-1 sm:p-5", paneClassName)}
        >
          <span className="absolute right-3 top-2 font-mono text-[0.6875rem] text-fg-2">{theme === "light" ? "Light" : "Dark"}</span>
          {typeof children === "function" ? children(theme) : children}
        </div>
      ))}
    </div>
  );
}

/** One component on the page: its name, when to use it, the preview. */
export function Demo({ name, use, children, id }: { name: string; use: ReactNode; children: ReactNode; id?: string }) {
  return (
    <div id={id} className="mb-12 scroll-mt-20">
      <h3 className="font-display text-h3 font-semibold text-fg-1">{name}</h3>
      <div className="mb-4 mt-1 max-w-article text-small text-fg-2">{use}</div>
      {children}
    </div>
  );
}
