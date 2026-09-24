import { describe, expect, test } from "vitest";

import {
  DEFAULT_PAGE_SIZE,
  EMPTY_TABLE_QUERY,
  FILTER_OPERATORS,
  MAX_SORT_FIELDS,
  OPERATOR_LABELS,
  isQueryEmpty,
  operatorArity,
  pageMetaOf,
  pageRange,
  parseSort,
  parseTableQuery,
  serializeSort,
  type FilterOperator,
} from "./table";

/**
 * The shared contract. `server/src/lib/tableQuery.test.ts` exercises the schema against real SQL;
 * this file covers the small pure helpers both halves lean on, where a wrong answer would show up
 * as a cosmetic bug on one side and a correctness bug on the other.
 */

describe("operators", () => {
  test("every operator has a label and an arity", () => {
    for (const operator of FILTER_OPERATORS) {
      expect(OPERATOR_LABELS[operator], operator).toBeTruthy();
      expect(["scalar", "list", "range", "none"]).toContain(operatorArity(operator));
    }
  });

  test("arity is what decides the shape of a value", () => {
    expect(operatorArity("eq")).toBe("scalar");
    expect(operatorArity("in")).toBe("list");
    expect(operatorArity("between")).toBe("range");
    expect(operatorArity("isNull")).toBe("none");
    // An operator nobody defined is treated as a scalar rather than crashing a render.
    expect(operatorArity("matches" as FilterOperator)).toBe("scalar");
  });
});

describe("sort serialisation", () => {
  test("round-trips", () => {
    const sort = [
      { field: "createdAt", dir: "desc" as const },
      { field: "displayName", dir: "asc" as const },
    ];
    expect(serializeSort(sort)).toBe("createdAt:desc,displayName:asc");
    expect(parseSort(serializeSort(sort))).toEqual(sort);
  });

  test("an empty sort is an empty string, not a stray comma", () => {
    expect(serializeSort([])).toBe("");
    expect(parseSort("")).toEqual([]);
    expect(parseSort(null)).toEqual([]);
    expect(parseSort(undefined)).toEqual([]);
  });

  test("malformed keys are dropped, valid ones alongside them are kept", () => {
    expect(parseSort("createdAt:desc,:asc,broken,name:sideways,username:asc")).toEqual([
      { field: "createdAt", dir: "desc" },
      { field: "username", dir: "asc" },
    ]);
  });

  test("more keys than the cap are truncated to the cap", () => {
    const many = ["a:asc", "b:asc", "c:asc", "d:asc", "e:asc"].join(",");
    expect(parseSort(many)).toHaveLength(MAX_SORT_FIELDS);
  });
});

describe("emptiness", () => {
  test("a query with no search and no filters would show the whole table", () => {
    expect(isQueryEmpty(EMPTY_TABLE_QUERY)).toBe(true);
    // A sort is not a filter: sorted-but-unfiltered is still "everything", so the empty state
    // shown must be "nothing here yet", not "nothing matches".
    expect(isQueryEmpty({ ...EMPTY_TABLE_QUERY, sort: [{ field: "id", dir: "asc" }] })).toBe(true);
    expect(isQueryEmpty({ ...EMPTY_TABLE_QUERY, page: 3 })).toBe(true);

    expect(isQueryEmpty({ ...EMPTY_TABLE_QUERY, q: "ada" })).toBe(false);
    expect(isQueryEmpty({ ...EMPTY_TABLE_QUERY, q: "   " })).toBe(true);
    expect(
      isQueryEmpty({
        ...EMPTY_TABLE_QUERY,
        filters: { combinator: "and", conditions: [{ field: "status", operator: "isNull" }] },
      }),
    ).toBe(false);
  });
});

describe("page arithmetic", () => {
  test("clamps into range", () => {
    expect(pageMetaOf(312, 2, 20)).toEqual({ page: 2, pageSize: 20, total: 312, pageCount: 16 });
    expect(pageMetaOf(312, 99, 20).page).toBe(16);
    expect(pageMetaOf(312, 0, 20).page).toBe(1);
    expect(pageMetaOf(312, -4, 20).page).toBe(1);
  });

  test("survives nonsense without producing a NaN page", () => {
    expect(pageMetaOf(Number.NaN, Number.NaN, Number.NaN)).toEqual({ page: 1, pageSize: 1, total: 0, pageCount: 1 });
    expect(pageMetaOf(-10, 1, 25).total).toBe(0);
    expect(pageMetaOf(10, 1, 0).pageSize).toBe(1);
  });

  test("the range sentence matches the page", () => {
    expect(pageRange(pageMetaOf(312, 2, 20))).toEqual({ from: 21, to: 40 });
    // The last page is short, and the sentence has to say so rather than promising 20 more.
    expect(pageRange(pageMetaOf(312, 16, 20))).toEqual({ from: 301, to: 312 });
    expect(pageRange(pageMetaOf(1, 1, 20))).toEqual({ from: 1, to: 1 });
    // Nothing to show means no sentence at all, not "Showing 1–0 of 0".
    expect(pageRange(pageMetaOf(0, 1, 20))).toBeNull();
  });
});

describe("reading a URL", () => {
  test("an empty query string is the default query", () => {
    expect(parseTableQuery(new URLSearchParams())).toEqual(EMPTY_TABLE_QUERY);
    expect(parseTableQuery({})).toEqual(EMPTY_TABLE_QUERY);
  });

  test("a plain object works as well as URLSearchParams, for the server's `request.query`", () => {
    const fromObject = parseTableQuery({ q: "ada", page: "2", pageSize: "50", sort: "id:desc" });
    const fromParams = parseTableQuery(new URLSearchParams("q=ada&page=2&pageSize=50&sort=id:desc"));
    expect(fromObject).toEqual(fromParams);
    expect(fromObject.pageSize).toBe(50);
  });

  test("an unknown page size falls back rather than reaching the database", () => {
    expect(parseTableQuery({ pageSize: "999999" }).pageSize).toBe(DEFAULT_PAGE_SIZE);
  });
});
