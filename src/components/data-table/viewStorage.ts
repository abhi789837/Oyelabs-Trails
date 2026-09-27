import { tableQuerySchema, type TableQuery } from "@shared/table";

import type { SavedView } from "./types";

/**
 * Saved views, in the admin's own browser.
 *
 * Local rather than on the server, deliberately. A view is a working habit — "the three people I
 * am chasing this week" — not shared state, and putting it in SQLite would mean a table, an
 * endpoint, a permissions question and a migration for something that is worth exactly as much as
 * the browser it was made in. The cost is honest and visible: views do not follow the admin to
 * another machine, and the UI says so rather than pretending otherwise.
 *
 * The key is scoped by table **and by account**, because this app has one shared admin laptop in
 * more than one office.
 */

const PREFIX = "oyelearn.table.views";
const MAX_VIEWS = 30;

export function viewsStorageKey(tableKey: string, accountId: string | null | undefined): string {
  return `${PREFIX}.${tableKey}.${accountId ?? "anon"}`;
}

/**
 * Anything in `localStorage` is untrusted input: it survives deploys, it is editable from the
 * console, and a view saved by an older build may name a field that no longer exists. Every entry
 * is re-validated against the shared schema on the way out, and a bad one is dropped rather than
 * taking the whole list with it.
 */
export function loadViews(tableKey: string, accountId: string | null | undefined): SavedView[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(viewsStorageKey(tableKey, accountId));
  } catch {
    // Private mode, or storage disabled by policy. No views, no error.
    return [];
  }
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const views: SavedView[] = [];
    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null) continue;
      const candidate = entry as Partial<SavedView>;
      if (typeof candidate.id !== "string" || typeof candidate.name !== "string") continue;
      const query = tableQuerySchema.safeParse(candidate.query);
      if (!query.success) continue;
      views.push({
        id: candidate.id,
        name: candidate.name.slice(0, 60),
        query: query.data,
        savedAt: typeof candidate.savedAt === "number" ? candidate.savedAt : 0,
      });
    }
    return views.slice(0, MAX_VIEWS);
  } catch {
    return [];
  }
}

export function saveViews(tableKey: string, accountId: string | null | undefined, views: SavedView[]): void {
  try {
    localStorage.setItem(viewsStorageKey(tableKey, accountId), JSON.stringify(views.slice(0, MAX_VIEWS)));
  } catch {
    // Quota, or storage disabled. The view is lost; the table keeps working, which is the priority.
  }
}

/**
 * Adds a view, replacing one of the same name.
 *
 * Replacing by name rather than appending is what makes "save" feel like saving: an admin who
 * tweaks a filter and saves under the same name means *update*, and a list with "Flagged",
 * "Flagged" and "Flagged" in it is nobody's intention.
 *
 * The page number is dropped. A view is a *question*, and "page 3" is not part of one.
 */
export function upsertView(views: SavedView[], name: string, query: TableQuery, now = Date.now()): SavedView[] {
  const trimmed = name.trim().slice(0, 60);
  if (!trimmed) return views;
  const view: SavedView = {
    id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: trimmed,
    query: { ...query, page: 1 },
    savedAt: now,
  };
  const existing = views.findIndex((entry) => entry.name.toLowerCase() === trimmed.toLowerCase());
  if (existing === -1) return [view, ...views].slice(0, MAX_VIEWS);
  const next = [...views];
  next[existing] = { ...view, id: views[existing]!.id };
  return next;
}

export function removeView(views: SavedView[], id: string): SavedView[] {
  return views.filter((view) => view.id !== id);
}

/**
 * Whether the table is currently showing this view.
 *
 * Compares the question, not the position: page is ignored, and so is page size, so scrolling to
 * page 2 does not make the view look unsaved.
 */
export function isSameView(a: TableQuery, b: TableQuery): boolean {
  const shape = (query: TableQuery) =>
    JSON.stringify({
      q: query.q.trim(),
      combinator: query.filters.combinator,
      // Order within a filter set carries no meaning, so two views that differ only in the order
      // the chips were clicked are the same view.
      conditions: [...query.filters.conditions]
        .map((condition) => JSON.stringify(condition))
        .sort(),
      sort: query.sort,
    });
  return shape(a) === shape(b);
}
