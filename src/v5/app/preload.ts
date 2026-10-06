import { createElement, lazy, useState, type ComponentType } from "react";

/**
 * Lazy route modules that can be fetched before they render (Phase 9 performance).
 *
 * `React.lazy` suspends on its first render even when the chunk has already arrived, and React then
 * holds the reveal of the suspended content for about 300 ms. With the route's code fetched at app
 * start (`routePrefetch.ts`), that pause was most of the time between the data arriving and the page
 * showing. A component made with `lazyPreloaded` renders the module directly when it has already
 * loaded, and falls back to `React.lazy` (with its Suspense fallback) when it hasn't.
 *
 * Modules are registered by name, so `routePrefetch.ts` (in the entry) and the route tree (lazy)
 * share one download without importing each other.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- route components take any props.
type AnyComponent = ComponentType<any>;

interface Entry {
  promise: Promise<unknown> | null;
  loaded: AnyComponent | null;
}

const registry = new Map<string, Entry>();

function entryFor(name: string): Entry {
  let entry = registry.get(name);
  if (!entry) {
    entry = { promise: null, loaded: null };
    registry.set(name, entry);
  }
  return entry;
}

/** Starts loading a module once (later calls reuse the first download), and remembers its default export. */
export function preloadModule<M extends { default: AnyComponent }>(name: string, load: () => Promise<M>): Promise<M> {
  const entry = entryFor(name);
  if (!entry.promise) {
    entry.promise = load().then(
      (mod) => {
        entry.loaded = mod.default;
        return mod;
      },
      (error: unknown) => {
        // Let the next render try again (and show the chunk error then, as React.lazy would).
        entry.promise = null;
        throw error;
      },
    );
  }
  return entry.promise as Promise<M>;
}

/** Like `React.lazy`, but renders at once when `preloadModule(name)` has already finished. */
export function lazyPreloaded<P extends object>(name: string, load: () => Promise<{ default: ComponentType<P> }>): ComponentType<P> {
  const Lazy = lazy(() => preloadModule(name, load));
  function Preloaded(props: P) {
    // Decided once per mount: switching from the lazy wrapper to the module itself would remount it.
    const [direct] = useState(() => entryFor(name).loaded as ComponentType<P> | null);
    return direct ? createElement(direct, props) : createElement(Lazy as unknown as ComponentType<P>, props);
  }
  Preloaded.displayName = `Preloaded(${name})`;
  return Preloaded;
}

/** Tests only. */
export function isPreloaded(name: string): boolean {
  return entryFor(name).loaded !== null;
}
