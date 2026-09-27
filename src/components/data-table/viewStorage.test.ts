import { beforeEach, describe, expect, test } from "vitest";

import { EMPTY_TABLE_QUERY, type TableQuery } from "@shared/table";

import { isSameView, loadViews, removeView, saveViews, upsertView, viewsStorageKey } from "./viewStorage";
import type { SavedView } from "./types";

/**
 * Saved views come out of `localStorage`, which means they are untrusted input: editable from the
 * console, left behind by older builds, and shared with whatever else is on that origin. The
 * tests that matter are the ones about what happens when what comes back is not what was put in.
 */

/** A minimal in-memory `localStorage`; the test environment is Node and has none. */
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  key(index: number) {
    return [...this.store.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

const storage = new MemoryStorage();
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true, writable: true });

const KEY = viewsStorageKey("admin.people", "u-1");

function query(overrides: Partial<TableQuery> = {}): TableQuery {
  return { ...EMPTY_TABLE_QUERY, ...overrides };
}

beforeEach(() => storage.clear());

describe("scoping", () => {
  test("views are keyed by table and by account", () => {
    expect(viewsStorageKey("admin.people", "u-1")).not.toBe(viewsStorageKey("admin.people", "u-2"));
    expect(viewsStorageKey("admin.people", "u-1")).not.toBe(viewsStorageKey("admin.audit", "u-1"));
    // A signed-out read must not fall through to someone else's list.
    expect(viewsStorageKey("admin.people", null)).toContain("anon");
  });

  test("one account's views are invisible to another", () => {
    saveViews("admin.people", "u-1", [{ id: "a", name: "Mine", query: query(), savedAt: 1 }]);
    expect(loadViews("admin.people", "u-2")).toEqual([]);
    expect(loadViews("admin.people", "u-1")).toHaveLength(1);
  });
});

describe("reading back what is there", () => {
  test("a round trip preserves the query", () => {
    const view: SavedView = {
      id: "a",
      name: "Flagged",
      query: query({ q: "ada", sort: [{ field: "createdAt", dir: "desc" }], pageSize: 50 }),
      savedAt: 42,
    };
    saveViews("admin.people", "u-1", [view]);
    expect(loadViews("admin.people", "u-1")).toEqual([view]);
  });

  test("nothing stored is no views, not a crash", () => {
    expect(loadViews("admin.people", "u-1")).toEqual([]);
  });

  test("junk in the slot is no views, not a crash", () => {
    for (const junk of ["not json", "null", "42", '"a string"', "{}", '{"views":[]}']) {
      storage.setItem(KEY, junk);
      expect(loadViews("admin.people", "u-1"), junk).toEqual([]);
    }
  });

  test("one corrupt view is dropped and the rest survive", () => {
    storage.setItem(
      KEY,
      JSON.stringify([
        { id: "good", name: "Good", query: EMPTY_TABLE_QUERY, savedAt: 1 },
        { id: "no-query", name: "Broken" },
        { id: 7, name: "Bad id", query: EMPTY_TABLE_QUERY },
        { name: "No id", query: EMPTY_TABLE_QUERY },
        // Parses as JSON, but the query is not a query.
        { id: "bad-query", name: "Bad", query: { filters: "everything" } },
        // A stale view from a build whose operator no longer exists.
        {
          id: "stale",
          name: "Stale",
          query: { ...EMPTY_TABLE_QUERY, filters: { combinator: "and", conditions: [{ field: "x", operator: "matches", value: "y" }] } },
        },
        null,
        "a string",
      ]),
    );

    const views = loadViews("admin.people", "u-1");
    expect(views.map((view) => view.id)).toEqual(["good"]);
  });

  test("a hostile field name in a stored view does not survive the schema", () => {
    storage.setItem(
      KEY,
      JSON.stringify([
        {
          id: "evil",
          name: "Evil",
          query: {
            ...EMPTY_TABLE_QUERY,
            filters: { combinator: "and", conditions: [{ field: "1; DROP TABLE users", operator: "eq", value: "x" }] },
          },
        },
      ]),
    );
    expect(loadViews("admin.people", "u-1")).toEqual([]);
  });

  test("a view with a missing savedAt still loads, at the bottom of the order", () => {
    storage.setItem(KEY, JSON.stringify([{ id: "a", name: "A", query: EMPTY_TABLE_QUERY }]));
    expect(loadViews("admin.people", "u-1")[0]?.savedAt).toBe(0);
  });

  test("a very long name is truncated rather than rejected", () => {
    storage.setItem(KEY, JSON.stringify([{ id: "a", name: "x".repeat(500), query: EMPTY_TABLE_QUERY, savedAt: 1 }]));
    expect(loadViews("admin.people", "u-1")[0]?.name).toHaveLength(60);
  });
});

describe("adding and removing", () => {
  test("a new name is added at the top", () => {
    const first = upsertView([], "Flagged", query({ q: "a" }), 1);
    const second = upsertView(first, "Inactive", query({ q: "b" }), 2);
    expect(second.map((view) => view.name)).toEqual(["Inactive", "Flagged"]);
  });

  test("the same name updates in place and keeps its id", () => {
    const first = upsertView([], "Flagged", query({ q: "a" }), 1);
    const again = upsertView(first, "flagged", query({ q: "b" }), 2);
    expect(again).toHaveLength(1);
    expect(again[0]!.id).toBe(first[0]!.id);
    expect(again[0]!.query.q).toBe("b");
  });

  test("the page number is not part of a saved view", () => {
    const views = upsertView([], "Page 7", query({ page: 7 }), 1);
    expect(views[0]!.query.page).toBe(1);
  });

  test("an empty or whitespace name saves nothing", () => {
    expect(upsertView([], "   ", query(), 1)).toEqual([]);
  });

  test("removing by id leaves the others", () => {
    const views = upsertView(upsertView([], "A", query(), 1), "B", query(), 2);
    expect(removeView(views, views[0]!.id).map((view) => view.name)).toEqual(["A"]);
    expect(removeView(views, "not-there")).toHaveLength(2);
  });

  test("the list is capped, so a script cannot fill the origin's storage", () => {
    let views: SavedView[] = [];
    for (let index = 0; index < 80; index++) views = upsertView(views, `View ${index}`, query(), index + 1);
    expect(views).toHaveLength(30);
    saveViews("admin.people", "u-1", views);
    expect(loadViews("admin.people", "u-1")).toHaveLength(30);
  });
});

describe("recognising the current view", () => {
  test("page and page size are not part of the comparison", () => {
    expect(isSameView(query({ q: "ada", page: 1, pageSize: 25 }), query({ q: "ada", page: 4, pageSize: 100 }))).toBe(true);
  });

  test("the order conditions were added in is not either", () => {
    const a = query({
      filters: {
        combinator: "and",
        conditions: [
          { field: "status", operator: "eq", value: "active" },
          { field: "role", operator: "eq", value: "learner" },
        ],
      },
    });
    const b = query({
      filters: {
        combinator: "and",
        conditions: [
          { field: "role", operator: "eq", value: "learner" },
          { field: "status", operator: "eq", value: "active" },
        ],
      },
    });
    expect(isSameView(a, b)).toBe(true);
  });

  test("but the combinator, the search and the sort all are", () => {
    const conditions = [{ field: "status", operator: "eq" as const, value: "active" }];
    expect(isSameView(query({ filters: { combinator: "and", conditions } }), query({ filters: { combinator: "or", conditions } }))).toBe(false);
    expect(isSameView(query({ q: "ada" }), query({ q: "bala" }))).toBe(false);
    expect(isSameView(query({ sort: [{ field: "id", dir: "asc" }] }), query({ sort: [{ field: "id", dir: "desc" }] }))).toBe(false);
    // Whitespace around a search term is not a different question.
    expect(isSameView(query({ q: " ada " }), query({ q: "ada" }))).toBe(true);
  });
});

describe("storage that refuses to work", () => {
  test("a throwing localStorage is not a broken table", () => {
    const broken = {
      getItem() {
        throw new Error("SecurityError");
      },
      setItem() {
        throw new Error("QuotaExceededError");
      },
    };
    Object.defineProperty(globalThis, "localStorage", { value: broken, configurable: true, writable: true });

    expect(loadViews("admin.people", "u-1")).toEqual([]);
    expect(() => saveViews("admin.people", "u-1", [{ id: "a", name: "A", query: query(), savedAt: 1 }])).not.toThrow();

    Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true, writable: true });
  });
});
