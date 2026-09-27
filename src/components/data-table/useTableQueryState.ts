import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { parseTableQuery, writeTableQuery, type TableQuery } from "@shared/table";

import type { TableDensity } from "@/components/ui/table";

/**
 * The table's state lives in the URL.
 *
 * Not in component state with the URL as a mirror — *in* the URL. That one decision buys three
 * things at once: a filtered view is a link an admin can paste into a chat, the back button walks
 * back through filters the way people expect it to, and a refresh in the middle of triaging
 * forty learners does not throw the work away.
 *
 * What does **not** go in the URL: which columns are visible, and the density. Those are personal
 * preferences, not part of the question being asked, and sending someone a link that also
 * rearranges their columns would be rude. They live in `localStorage` instead, keyed by table.
 *
 * Search text is debounced by the toolbar, not here — this hook writes whatever it is given, and
 * `replace: true` keeps the history stack from growing one entry per keystroke.
 */
export function useTableQueryState(): {
  query: TableQuery;
  setQuery: (next: TableQuery | ((current: TableQuery) => TableQuery), options?: { push?: boolean }) => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = useMemo(() => parseTableQuery(searchParams), [searchParams]);

  /* The latest query, readable without making `setQuery` depend on it. Without this, every
     component holding a `setQuery` re-renders on every keystroke that changes the URL. */
  const latest = useRef(query);
  latest.current = query;

  const setQuery = useCallback(
    (next: TableQuery | ((current: TableQuery) => TableQuery), options: { push?: boolean } = {}) => {
      const value = typeof next === "function" ? next(latest.current) : next;
      setSearchParams(
        (current) => {
          /* Applied onto the existing parameters, not replacing them: admin pages carry their own
             (`tab`, a selected id) and a filter change must not drop them. */
          const params = new URLSearchParams(current);
          return writeTableQuery(value, params);
        },
        // Replace by default. Typing "pri" into a search box should not put three entries in the
        // history; `push` is for a deliberate jump, like choosing a saved view.
        { replace: !options.push },
      );
    },
    [setSearchParams],
  );

  return { query, setQuery };
}

// ---------------------------------------------------------------------------
// Per-table display preferences
// ---------------------------------------------------------------------------

export interface TablePreferences {
  /** Column id → visible. Absent means visible. */
  columns: Record<string, boolean>;
  density: TableDensity;
}

const PREFS_PREFIX = "oyelearn.table.prefs";

const DEFAULT_PREFERENCES: TablePreferences = { columns: {}, density: "comfortable" };

function readPreferences(tableKey: string): TablePreferences {
  try {
    const raw = localStorage.getItem(`${PREFS_PREFIX}.${tableKey}`);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_PREFERENCES;
    const candidate = parsed as Partial<TablePreferences>;
    return {
      columns: typeof candidate.columns === "object" && candidate.columns !== null ? candidate.columns : {},
      density: candidate.density === "compact" ? "compact" : "comfortable",
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Column visibility and density, remembered per table.
 *
 * Lazily initialised from `localStorage` so the first paint already has the admin's layout — read
 * in an effect instead and every visit would flash the default columns before rearranging itself.
 */
export function useTablePreferences(tableKey: string): {
  preferences: TablePreferences;
  setPreferences: (next: Partial<TablePreferences>) => void;
} {
  const [preferences, setState] = useState<TablePreferences>(() => readPreferences(tableKey));

  // A different table means different preferences, and the component may not remount between them.
  useEffect(() => setState(readPreferences(tableKey)), [tableKey]);

  const setPreferences = useCallback(
    (next: Partial<TablePreferences>) => {
      setState((current) => {
        const merged = { ...current, ...next };
        try {
          localStorage.setItem(`${PREFS_PREFIX}.${tableKey}`, JSON.stringify(merged));
        } catch {
          // Storage unavailable. The change still applies for this session.
        }
        return merged;
      });
    },
    [tableKey],
  );

  return { preferences, setPreferences };
}

/**
 * Debounces a value.
 *
 * 250 ms for the search box: long enough that a typist does not filter on every letter, short
 * enough that it never feels like the table is lagging behind the cursor.
 */
export function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
