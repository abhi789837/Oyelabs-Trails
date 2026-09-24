import { describe, expect, test } from "vitest";

import { EMPTY_TABLE_QUERY, type FilterCondition, type TableQuery } from "@shared/table";

import { applyTableQuery, conditionsForField, facetCounts, filterRows, setFieldConditions, sortRows } from "./query";
import type { TableFieldDef } from "./types";

/**
 * The client evaluator has to give the same answers as the SQL builder, because the same saved
 * view runs through both. These tests are the pairing to `server/src/lib/tableQuery.test.ts` —
 * the same fixture, the same questions, checked for the same answers, with particular attention
 * to the three places SQL behaves in a way JavaScript does not:
 *
 *   `=` is case-sensitive · `LIKE` is not · every comparison with NULL is false.
 */

interface Person {
  id: string;
  username: string;
  displayName: string;
  role: "learner" | "superadmin";
  status: "active" | "disabled";
  years: number | null;
  lastLoginAt: number | null;
  mustChangePassword: boolean;
}

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 0, 1);

const PEOPLE: Person[] = [
  { id: "u00", username: "ada", displayName: "Ada Bose", role: "superadmin", status: "active", years: 9, lastLoginAt: NOW - 1 * DAY, mustChangePassword: false },
  { id: "u01", username: "bala", displayName: "Bala Menon", role: "learner", status: "active", years: 3, lastLoginAt: NOW - 20 * DAY, mustChangePassword: true },
  { id: "u02", username: "chitra", displayName: "Chitra Rao", role: "learner", status: "disabled", years: 1, lastLoginAt: null, mustChangePassword: true },
  { id: "u03", username: "dev", displayName: "Dev Kapoor", role: "learner", status: "active", years: null, lastLoginAt: NOW - 2 * DAY, mustChangePassword: false },
  { id: "u04", username: "esha", displayName: "ESHA D'Souza", role: "learner", status: "active", years: 6, lastLoginAt: NOW - 40 * DAY, mustChangePassword: false },
  { id: "u05", username: "farhan", displayName: "Farhan 100% Ali", role: "learner", status: "disabled", years: 2, lastLoginAt: null, mustChangePassword: true },
];

const fields: TableFieldDef<Person>[] = [
  { name: "id", label: "Id", type: "string" },
  { name: "username", label: "Username", type: "string", searchable: true },
  { name: "displayName", label: "Name", type: "string", searchable: true },
  {
    name: "role",
    label: "Account",
    type: "enum",
    quick: true,
    options: [
      { value: "learner", label: "Learner" },
      { value: "superadmin", label: "Super admin" },
    ],
  },
  {
    name: "status",
    label: "Status",
    type: "enum",
    quick: true,
    options: [
      { value: "active", label: "Active" },
      { value: "disabled", label: "Disabled" },
    ],
  },
  { name: "years", label: "Experience", type: "number", min: 0, max: 20 },
  { name: "lastLoginAt", label: "Last seen", type: "date" },
  { name: "mustChangePassword", label: "Temporary password", type: "boolean" },
  { name: "initial", label: "Initial", type: "string", accessor: (row) => row.displayName[0] },
];

function query(overrides: Partial<TableQuery> = {}): TableQuery {
  return { ...EMPTY_TABLE_QUERY, ...overrides };
}

function withFilters(...conditions: FilterCondition[]): TableQuery {
  return query({ filters: { combinator: "and", conditions } });
}

const names = (rows: Person[]) => rows.map((row) => row.username);

describe("matching, the way SQLite matches", () => {
  test("`eq` on text is case-sensitive", () => {
    expect(names(filterRows(PEOPLE, withFilters({ field: "displayName", operator: "eq", value: "Ada Bose" }), fields))).toEqual(["ada"]);
    expect(filterRows(PEOPLE, withFilters({ field: "displayName", operator: "eq", value: "ada bose" }), fields)).toEqual([]);
  });

  test("`contains` is not", () => {
    expect(names(filterRows(PEOPLE, withFilters({ field: "displayName", operator: "contains", value: "esha" }), fields))).toEqual(["esha"]);
    expect(names(filterRows(PEOPLE, withFilters({ field: "displayName", operator: "startsWith", value: "ADA" }), fields))).toEqual(["ada"]);
    expect(names(filterRows(PEOPLE, withFilters({ field: "displayName", operator: "endsWith", value: "ALI" }), fields))).toEqual(["farhan"]);
  });

  test("a missing value fails every comparison, including `ne`", () => {
    // `dev` has no years. `!= 3` is NULL in SQL, which is not true, so he is not in the result.
    const notThree = names(filterRows(PEOPLE, withFilters({ field: "years", operator: "ne", value: 3 }), fields));
    expect(notThree).not.toContain("dev");
    expect(notThree).toEqual(["ada", "chitra", "esha", "farhan"]);

    expect(names(filterRows(PEOPLE, withFilters({ field: "years", operator: "isNull" }), fields))).toEqual(["dev"]);
    expect(filterRows(PEOPLE, withFilters({ field: "years", operator: "gt", value: -1 }), fields)).toHaveLength(5);
  });

  test("`notContains` also excludes rows with no value", () => {
    const rows = names(filterRows(PEOPLE, withFilters({ field: "lastLoginAt", operator: "isNotNull" }), fields));
    expect(rows).toEqual(["ada", "bala", "dev", "esha"]);
  });

  test("`in` and `notIn` compare exactly", () => {
    expect(names(filterRows(PEOPLE, withFilters({ field: "status", operator: "in", value: ["disabled"] }), fields))).toEqual(["chitra", "farhan"]);
    expect(names(filterRows(PEOPLE, withFilters({ field: "role", operator: "notIn", value: ["learner"] }), fields))).toEqual(["ada"]);
    // Case matters, exactly as it does for `=`.
    expect(filterRows(PEOPLE, withFilters({ field: "status", operator: "in", value: ["DISABLED"] }), fields)).toEqual([]);
  });

  test("`between` honours an open end", () => {
    expect(names(filterRows(PEOPLE, withFilters({ field: "years", operator: "between", value: [3, null] }), fields))).toEqual(["ada", "bala", "esha"]);
    expect(names(filterRows(PEOPLE, withFilters({ field: "years", operator: "between", value: [null, 2] }), fields))).toEqual(["chitra", "farhan"]);
  });

  test("booleans compare as booleans", () => {
    expect(names(filterRows(PEOPLE, withFilters({ field: "mustChangePassword", operator: "eq", value: true }), fields))).toEqual(["bala", "chitra", "farhan"]);
  });

  test("an accessor field is filterable like any other", () => {
    expect(names(filterRows(PEOPLE, withFilters({ field: "initial", operator: "eq", value: "F" }), fields))).toEqual(["farhan"]);
  });

  test("a condition naming an unknown field matches nothing rather than being skipped", () => {
    // Skipping it would silently widen a stale saved view into "show everything".
    expect(filterRows(PEOPLE, withFilters({ field: "passwordHash", operator: "contains", value: "x" }), fields)).toEqual([]);
  });
});

describe("combining", () => {
  test("AND narrows, OR widens", () => {
    const conditions: FilterCondition[] = [
      { field: "status", operator: "eq", value: "disabled" },
      { field: "role", operator: "eq", value: "superadmin" },
    ];
    expect(filterRows(PEOPLE, query({ filters: { combinator: "and", conditions } }), fields)).toEqual([]);
    expect(names(filterRows(PEOPLE, query({ filters: { combinator: "or", conditions } }), fields))).toEqual(["ada", "chitra", "farhan"]);
  });

  test("search narrows an OR set instead of widening it", () => {
    const filters = {
      combinator: "or" as const,
      conditions: [
        { field: "status", operator: "eq" as const, value: "disabled" },
        { field: "role", operator: "eq" as const, value: "superadmin" },
      ],
    };
    expect(names(filterRows(PEOPLE, query({ filters, q: "chitra" }), fields))).toEqual(["chitra"]);
    expect(filterRows(PEOPLE, query({ filters, q: "zzz" }), fields)).toEqual([]);
  });

  test("search runs across every searchable field, case-insensitively", () => {
    expect(names(filterRows(PEOPLE, query({ q: "rao" }), fields))).toEqual(["chitra"]);
    expect(names(filterRows(PEOPLE, query({ q: "ESHA" }), fields))).toEqual(["esha"]);
    // `%` is a literal here: the client has no LIKE to escape, and must agree with the server,
    // which does escape it.
    expect(names(filterRows(PEOPLE, query({ q: "%" }), fields))).toEqual(["farhan"]);
  });
});

describe("sorting", () => {
  test("nulls sort first ascending and last descending, as SQLite does", () => {
    const asc = names(sortRows(PEOPLE, [{ field: "years", dir: "asc" }], fields));
    const desc = names(sortRows(PEOPLE, [{ field: "years", dir: "desc" }], fields));
    expect(asc[0]).toBe("dev");
    expect(desc[desc.length - 1]).toBe("dev");
  });

  test("several keys are applied in order", () => {
    const sorted = names(
      sortRows(PEOPLE, [{ field: "status", dir: "asc" }, { field: "username", dir: "desc" }], fields),
    );
    expect(sorted).toEqual(["esha", "dev", "bala", "ada", "farhan", "chitra"]);
  });

  test("sorting leaves the caller's array alone", () => {
    const original = [...PEOPLE];
    sortRows(PEOPLE, [{ field: "username", dir: "desc" }], fields);
    expect(PEOPLE).toEqual(original);
  });

  test("a sort on an unknown field is ignored rather than throwing", () => {
    expect(names(sortRows(PEOPLE, [{ field: "nope", dir: "asc" }], fields))).toEqual(names(PEOPLE));
  });
});

describe("facet counts", () => {
  test("count every option that would match, ignoring that field's own filter", () => {
    const filtered = query({ filters: { combinator: "and", conditions: [{ field: "status", operator: "in", value: ["active"] }] } });
    const counts = facetCounts(PEOPLE, filtered, "status", fields);
    // "Disabled" still reports 2 — the point of a facet count is to say what ticking it would do.
    expect(counts.get("active")).toBe(4);
    expect(counts.get("disabled")).toBe(2);
  });

  test("other filters still apply", () => {
    const filtered = query({ filters: { combinator: "and", conditions: [{ field: "role", operator: "eq", value: "learner" }] } });
    const counts = facetCounts(PEOPLE, filtered, "status", fields);
    expect(counts.get("active")).toBe(3); // ada is a superadmin and drops out
    expect(counts.get("disabled")).toBe(2);
  });

  test("rows with no value are not counted under any option", () => {
    const counts = facetCounts(PEOPLE, query(), "lastLoginAt", fields);
    expect([...counts.values()].reduce((sum, n) => sum + n, 0)).toBe(4);
  });
});

describe("the whole pipeline", () => {
  test("filters, then sorts, then pages — in that order", () => {
    const result = applyTableQuery(
      PEOPLE,
      query({
        filters: { combinator: "and", conditions: [{ field: "role", operator: "eq", value: "learner" }] },
        sort: [{ field: "username", dir: "asc" }],
        pageSize: 2,
        page: 2,
      }),
      fields,
    );
    expect(names(result.rows)).toEqual(["dev", "esha"]);
    expect(result.meta).toEqual({ page: 2, pageSize: 2, total: 5, pageCount: 3 });
    // `matched` is every matching row, which is what the count announces and what CSV exports.
    expect(result.matched).toHaveLength(5);
  });

  test("a page past the end lands on the last page, not on nothing", () => {
    const result = applyTableQuery(PEOPLE, query({ page: 99, pageSize: 2 }), fields);
    expect(result.meta.page).toBe(3);
    expect(result.rows).toHaveLength(2);
  });

  test("an empty result reports one page and no rows", () => {
    const result = applyTableQuery(PEOPLE, query({ q: "nobody" }), fields);
    expect(result.rows).toEqual([]);
    expect(result.meta).toEqual({ page: 1, pageSize: 25, total: 0, pageCount: 1 });
  });

  test("the default sort applies only when the query names none", () => {
    const fallback = applyTableQuery(PEOPLE, query(), fields, [{ field: "username", dir: "desc" }]);
    expect(names(fallback.rows)[0]).toBe("farhan");

    const explicit = applyTableQuery(PEOPLE, query({ sort: [{ field: "username", dir: "asc" }] }), fields, [
      { field: "username", dir: "desc" },
    ]);
    expect(names(explicit.rows)[0]).toBe("ada");
  });
});

describe("editing a filter set", () => {
  test("setting a field's conditions replaces only that field's", () => {
    const start = query({
      filters: {
        combinator: "and",
        conditions: [
          { field: "status", operator: "in", value: ["active"] },
          { field: "role", operator: "eq", value: "learner" },
        ],
      },
      page: 4,
    });

    const next = setFieldConditions(start, "status", [{ field: "status", operator: "in", value: ["disabled"] }]);
    expect(conditionsForField(next, "status")).toEqual([{ field: "status", operator: "in", value: ["disabled"] }]);
    expect(conditionsForField(next, "role")).toHaveLength(1);
    // Changing a filter goes back to page 1: page 4 of a two-page result reads as "nothing here".
    expect(next.page).toBe(1);
  });

  test("passing no conditions removes the field's filter entirely", () => {
    const start = withFilters({ field: "status", operator: "in", value: ["active"] });
    expect(setFieldConditions(start, "status", []).filters.conditions).toEqual([]);
  });
});
