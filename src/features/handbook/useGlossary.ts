import { useEffect, useSyncExternalStore } from "react";

import type { GlossaryTerm } from "@shared/handbook";
import { handbookApi } from "./api";

/**
 * The compact glossary, loaded once per session and shared by every tooltip, the glossary page and
 * the flashcards. A page with forty term links makes one request, not forty.
 *
 * A tiny external store rather than Zustand: it never persists, and `useSyncExternalStore` gives
 * server rendering (used by the unit tests) a stable snapshot for free.
 */

export type GlossaryState =
  | { status: "idle" | "loading"; terms: GlossaryTerm[]; byId: Map<string, GlossaryTerm> }
  | { status: "ready"; terms: GlossaryTerm[]; byId: Map<string, GlossaryTerm> }
  | { status: "error"; terms: GlossaryTerm[]; byId: Map<string, GlossaryTerm>; message: string };

const EMPTY: GlossaryState = { status: "idle", terms: [], byId: new Map() };

let state: GlossaryState = EMPTY;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function set(next: GlossaryState) {
  state = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;

function indexTerms(terms: GlossaryTerm[]): Map<string, GlossaryTerm> {
  return new Map(terms.map((t) => [t.id, t]));
}

/** Starts the one load, if it has not started (or failed) already. Safe to call from anywhere. */
export function loadGlossary(): Promise<void> {
  if (state.status === "ready") return Promise.resolve();
  if (inflight) return inflight;
  set({ ...state, status: "loading" });
  inflight = handbookApi
    .glossary()
    .then(({ terms }) => set({ status: "ready", terms, byId: indexTerms(terms) }))
    .catch((error: unknown) =>
      set({ status: "error", terms: [], byId: new Map(), message: error instanceof Error ? error.message : "The glossary couldn't be loaded." }),
    )
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Tests, and a fresh account: forget what was loaded. */
export function resetGlossary() {
  inflight = null;
  set(EMPTY);
}

/** Tests: start with a known glossary instead of fetching one. */
export function primeGlossary(terms: GlossaryTerm[]) {
  inflight = null;
  set({ status: "ready", terms, byId: indexTerms(terms) });
}

/** The session glossary. Triggers the load on first use; a failed load is retried on the next mount. */
export function useGlossary(): GlossaryState {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    if (state.status === "idle" || state.status === "error") void loadGlossary();
  }, []);
  return snapshot;
}
