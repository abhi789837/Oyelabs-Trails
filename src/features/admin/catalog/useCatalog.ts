import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";

import type { Catalog } from "@shared/catalog";

import { ApiRequestError } from "@/api/client";
import { catalogApi } from "./api";
import { departmentName, departmentOptions } from "./helpers";

/**
 * The catalog, fetched once per session and shared by every admin page that needs it.
 *
 * A module-level cache rather than a Zustand store: it is read-mostly, only the Departments page
 * writes to it, and that page calls `refresh()` after each change. Archived rows are always fetched
 * so the Departments page can restore them; option lists filter them out.
 */

interface CatalogState {
  catalog: Catalog | null;
  error: string | null;
}

let state: CatalogState = { catalog: null, error: null };
let inFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function setState(next: CatalogState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Fetches the catalog. Concurrent callers share one request. */
export function refreshCatalog(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = catalogApi
    .get({ includeArchived: true })
    .then((catalog) => setState({ catalog, error: null }))
    .catch((err: unknown) => {
      setState({
        catalog: state.catalog,
        error: err instanceof ApiRequestError ? err.message : "Could not load the departments.",
      });
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

export function useCatalog() {
  const snapshot = useSyncExternalStore(subscribe, () => state);

  useEffect(() => {
    if (!state.catalog && !inFlight) void refreshCatalog();
  }, []);

  const { catalog } = snapshot;
  const nameOf = useCallback((id: string | null | undefined) => departmentName(catalog, id), [catalog]);
  const options = useMemo(() => departmentOptions(catalog), [catalog]);

  return {
    catalog: snapshot.catalog,
    error: snapshot.error,
    refresh: refreshCatalog,
    departmentName: nameOf,
    /** Live departments as `{ value, label }`, for filters and pickers. */
    departmentOptions: options,
  };
}
