import Database from "better-sqlite3";
import { count, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { beforeAll, describe, expect, test } from "vitest";

import {
  parseTableQuery,
  tableQuerySchema,
  writeTableQuery,
  EMPTY_TABLE_QUERY,
  MAX_PAGE_SIZE,
  type FilterCondition,
  type TableQuery,
} from "../../../shared/table";
import { migrationsFolder, schema, type Db } from "../db";
import {
  TableQueryError,
  buildTableQuery,
  defineTableSpec,
  pageMetaOf,
  resolvePageSize,
} from "./tableQuery";
import { auditTableSpec, usersTableSpec } from "./tableSpecs";

/**
 * The table query layer is the one part of the UI kit with a security surface: a string from an
 * address bar decides what SQL runs. These tests are written against a **real SQLite database**
 * with the real migrations applied, not against a mock, because the thing worth proving is not
 * "the builder returns an object" but "after this request the `users` table still exists and
 * still has eight rows in it".
 *
 * Four groups, in order of how much they matter:
 *   1. whitelisting — what is rejected, and that rejection is not the same as being dropped
 *   2. injection — identifiers, values, operators, sort keys and malformed JSON
 *   3. pagination edges — page 0, negative, past the end, pageSize over the cap
 *   4. semantics — that the queries which *are* allowed return the right rows
 */

let db: Db;

/** A query with everything at its default except what a test overrides. */
function query(overrides: Partial<TableQuery> = {}): TableQuery {
  return { ...EMPTY_TABLE_QUERY, ...overrides };
}

/** Wraps bare conditions into a filter set, AND'ed. */
function filters(...conditions: FilterCondition[]): Partial<TableQuery> {
  return { filters: { combinator: "and", conditions } };
}

function runUsers(q: TableQuery): { id: string; username: string; status: string }[] {
  const built = buildTableQuery(usersTableSpec, q);
  return db
    .select({ id: schema.users.id, username: schema.users.username, status: schema.users.status })
    .from(schema.users)
    .where(built.where)
    .orderBy(...built.orderBy)
    .limit(built.limit)
    .offset(built.offset)
    .all();
}

function usernames(q: TableQuery): string[] {
  return runUsers(q).map((row) => row.username);
}

function userCount(): number {
  return db.select({ n: count() }).from(schema.users).get()!.n;
}

/** Eight people, deliberately including names with SQL and LIKE metacharacters in them. */
const PEOPLE = [
  { username: "ada", displayName: "Ada Bose", role: "superadmin", status: "active", days: 60 },
  { username: "bala", displayName: "Bala Menon", role: "learner", status: "active", days: 50 },
  { username: "chitra", displayName: "Chitra Rao", role: "learner", status: "disabled", days: 40 },
  { username: "dev", displayName: "Dev Kapoor", role: "learner", status: "active", days: 30 },
  { username: "esha", displayName: "Esha D'Souza", role: "learner", status: "active", days: 20 },
  { username: "farhan", displayName: "Farhan 100% Ali", role: "learner", status: "disabled", days: 10 },
  { username: "gita", displayName: "Gita_Nair", role: "learner", status: "active", days: 5 },
  { username: "hari", displayName: "Hari'; DROP TABLE users; --", role: "learner", status: "active", days: 1 },
] as const;

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 0, 1);

beforeAll(() => {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: migrationsFolder() });

  for (const [index, person] of PEOPLE.entries()) {
    db.insert(schema.users)
      .values({
        // Fixed-width ids so `order by id` is a stable, readable tiebreak in the paging tests.
        id: `u${String(index).padStart(2, "0")}`,
        username: person.username,
        displayName: person.displayName,
        passwordHash: `hash-${person.username}`,
        role: person.role,
        status: person.status,
        mustChangePassword: index % 2 === 0,
        createdAt: NOW - person.days * DAY,
        lastLoginAt: person.status === "active" ? NOW - person.days * DAY + 3600_000 : null,
      })
      .run();
  }
});

// ---------------------------------------------------------------------------
// 1. Whitelisting
// ---------------------------------------------------------------------------

describe("whitelisting", () => {
  test("a field the spec does not list is rejected, not dropped", () => {
    // `failed_logins` is a real column on a real table. It is simply not granted.
    expect(() => runUsers(query(filters({ field: "failedLogins", operator: "gt", value: 0 })))).toThrow(
      TableQueryError,
    );

    try {
      runUsers(query(filters({ field: "failedLogins", operator: "gt", value: 0 })));
    } catch (error) {
      expect(error).toBeInstanceOf(TableQueryError);
      const typed = error as TableQueryError;
      expect(typed.reason).toBe("unknown_field");
      expect(typed.statusCode).toBe(400);
    }
  });

  test("the password hash is not filterable, sortable or searchable", () => {
    expect(() => runUsers(query(filters({ field: "passwordHash", operator: "contains", value: "argon2" })))).toThrow(
      /not a field/i,
    );
    expect(() => runUsers(query({ sort: [{ field: "passwordHash", dir: "asc" }] }))).toThrow(TableQueryError);
    // …and it is not in the search either, so `q` cannot be used to probe it one character at a time.
    expect(usersTableSpec.searchFields).toEqual(["username", "displayName"]);
  });

  test("inherited Object.prototype keys are unknown fields, not usable ones", () => {
    for (const field of ["constructor", "toString", "hasOwnProperty", "valueOf"]) {
      expect(() => runUsers(query(filters({ field, operator: "eq", value: "x" })))).toThrow(/not a field/i);
    }
  });

  test("an operator the field's type does not allow is rejected", () => {
    // `role` is an enum: `is any of` says everything `contains` could, without the scan.
    const thrown = (() => {
      try {
        runUsers(query(filters({ field: "role", operator: "contains", value: "admin" })));
      } catch (error) {
        return error as TableQueryError;
      }
      return null;
    })();
    expect(thrown?.reason).toBe("operator_not_allowed");

    // And `contains` on a date is meaningless in both directions.
    expect(() => runUsers(query(filters({ field: "createdAt", operator: "startsWith", value: "17" })))).toThrow(
      TableQueryError,
    );
  });

  test("an enum value outside the field's list is rejected", () => {
    expect(() => runUsers(query(filters({ field: "role", operator: "eq", value: "root" })))).toThrow(
      /not a value of "role"/,
    );
    // …including inside an `in` list, where one bad value poisons the whole condition.
    expect(() =>
      runUsers(query(filters({ field: "status", operator: "in", value: ["active", "superuser"] }))),
    ).toThrow(TableQueryError);
  });

  test("a value of the wrong type for the field is rejected rather than coerced", () => {
    expect(() => runUsers(query(filters({ field: "mustChangePassword", operator: "eq", value: "true" })))).toThrow(
      /true or false/,
    );
    expect(() => runUsers(query(filters({ field: "createdAt", operator: "gt", value: "yesterday" })))).toThrow(
      /takes a date/,
    );
    expect(() => runUsers(query(filters({ field: "username", operator: "eq", value: 42 })))).toThrow(/takes text/);
  });

  test("sorting by a column the spec marks non-sortable is rejected", () => {
    const thrown = (() => {
      try {
        buildTableQuery(auditTableSpec, query({ sort: [{ field: "action", dir: "asc" }] }));
      } catch (error) {
        return error as TableQueryError;
      }
      return null;
    })();
    expect(thrown?.reason).toBe("not_sortable");
  });

  test("a spec with nothing searchable refuses `q` instead of returning everything", () => {
    const noSearch = defineTableSpec({
      name: "jobs",
      fields: {
        id: { column: schema.jobs.id, type: "string" },
        status: { column: schema.jobs.status, type: "enum", values: ["queued", "running", "done", "failed"] },
      },
      defaultSort: [{ field: "id", dir: "desc" }],
    });
    const thrown = (() => {
      try {
        buildTableQuery(noSearch, query({ q: "anything" }));
      } catch (error) {
        return error as TableQueryError;
      }
      return null;
    })();
    expect(thrown?.reason).toBe("not_searchable");
  });
});

describe("spec definition", () => {
  const column = schema.users.username;

  test("an enum field without a value list fails at definition time", () => {
    expect(() =>
      defineTableSpec({
        name: "bad",
        fields: { role: { column: schema.users.role, type: "enum" } },
        defaultSort: [{ field: "role", dir: "asc" }],
      }),
    ).toThrow(/values` whitelist/);
  });

  test("a field cannot widen the operator set its type allows", () => {
    expect(() =>
      defineTableSpec({
        name: "bad",
        fields: { flag: { column: schema.users.mustChangePassword, type: "boolean", operators: ["contains"] } },
        defaultSort: [{ field: "flag", dir: "asc" }],
      }),
    ).toThrow(/cannot allow contains/);
  });

  test("only text-shaped fields can be searchable", () => {
    expect(() =>
      defineTableSpec({
        name: "bad",
        fields: { createdAt: { column: schema.users.createdAt, type: "date", searchable: true } },
        defaultSort: [{ field: "createdAt", dir: "asc" }],
      }),
    ).toThrow(/searchable/);
  });

  test("a default sort or tiebreak naming a field that is not there fails at definition time", () => {
    expect(() =>
      defineTableSpec({ name: "bad", fields: { username: { column, type: "string" } }, defaultSort: [{ field: "nope", dir: "asc" }] }),
    ).toThrow(/unknown field "nope"/);

    expect(() =>
      defineTableSpec({
        name: "bad",
        fields: { username: { column, type: "string" } },
        defaultSort: [{ field: "username", dir: "asc" }],
        tiebreak: "nope",
      }),
    ).toThrow(/tiebreak names unknown field/);
  });

  test("a spec cannot raise its page cap above the global ceiling", () => {
    const greedy = defineTableSpec({
      name: "greedy",
      fields: { username: { column, type: "string" } },
      defaultSort: [{ field: "username", dir: "asc" }],
      maxPageSize: 100_000,
    });
    expect(greedy.maxPageSize).toBe(MAX_PAGE_SIZE);
  });
});

// ---------------------------------------------------------------------------
// 2. Injection
// ---------------------------------------------------------------------------

describe("injection", () => {
  test("a field carrying SQL fails the shared schema before it reaches the builder", () => {
    const parsed = tableQuerySchema.safeParse({
      filters: { combinator: "and", conditions: [{ field: "1;DROP TABLE users", operator: "eq", value: "x" }] },
    });
    expect(parsed.success).toBe(false);

    for (const field of ["id) or 1=1 --", "users.password_hash", "id; delete from users", "id`", "id'"]) {
      expect(
        tableQuerySchema.safeParse({
          filters: { combinator: "and", conditions: [{ field, operator: "eq", value: "x" }] },
        }).success,
      ).toBe(false);
    }
  });

  test("and, if one got past the schema, the builder still refuses it and the table survives", () => {
    const before = userCount();
    // Constructed by hand, bypassing the schema entirely — this is the belt-and-braces case.
    const smuggled = { field: "1;DROP TABLE users", operator: "eq", value: "x" } as unknown as FilterCondition;
    expect(() => runUsers(query(filters(smuggled)))).toThrow(TableQueryError);
    expect(userCount()).toBe(before);
    expect(db.select({ n: count() }).from(schema.users).get()!.n).toBe(before);
  });

  test("SQL inside a value is matched as text, and matches nothing", () => {
    const before = userCount();
    const payload = "x'; DROP TABLE users; --";

    expect(usernames(query({ q: payload }))).toEqual([]);
    expect(usernames(query(filters({ field: "username", operator: "eq", value: payload })))).toEqual([]);
    expect(usernames(query(filters({ field: "username", operator: "in", value: [payload, "ada"] })))).toEqual(["ada"]);

    expect(userCount()).toBe(before);
  });

  test("a value that looks like a tautology stays a value", () => {
    expect(usernames(query(filters({ field: "username", operator: "eq", value: "x' OR '1'='1" })))).toEqual([]);
    expect(usernames(query(filters({ field: "username", operator: "eq", value: "' OR 1=1 --" })))).toEqual([]);
    // The row whose display name genuinely contains a DROP statement is found by searching for it,
    // which is the proof that values round-trip as data rather than being stripped.
    expect(usernames(query({ q: "DROP TABLE" }))).toEqual(["hari"]);
  });

  test("an operator smuggled into a value is a value, not an operator", () => {
    const rows = usernames(query(filters({ field: "displayName", operator: "contains", value: "Bose' OR 1=1" })));
    expect(rows).toEqual([]);
  });

  test("LIKE metacharacters in a search term are escaped, not honoured", () => {
    // Left unescaped, `%` matches every row and `_` matches any single character.
    expect(usernames(query({ q: "%" }))).toEqual(["farhan"]);
    expect(usernames(query({ q: "_" }))).toEqual(["gita"]);
    expect(usernames(query({ q: "100%" }))).toEqual(["farhan"]);
    // A backslash is escaped too, so it cannot be used to break out of the escaping itself.
    expect(usernames(query({ q: "\\" }))).toEqual([]);
    expect(usernames(query({ q: "a" })).length).toBeGreaterThan(1);
  });

  test("a sort key carrying SQL is dropped by the URL parser, leaving the default order", () => {
    const injected = parseTableQuery(new URLSearchParams("sort=createdAt:desc;DROP TABLE users"));
    expect(injected.sort).toEqual([]);

    for (const raw of ["username:asc--", "username:ASC); drop table users; --", "username:", ":asc", "username"]) {
      expect(parseSortOf(raw)).toEqual([]);
    }

    // …and the builder then uses the spec's own default, which names a field it owns.
    const built = buildTableQuery(usersTableSpec, injected);
    expect(built.orderBy).toHaveLength(2); // createdAt desc, then the id tiebreak
  });

  test("JSON that parses to an unexpected shape drops the filters whole", () => {
    const cases = [
      'filters={"combinator":"and","conditions":{"field":"status","operator":"eq","value":"active"}}', // object, not array
      "filters=[]", // array, not a filter set
      "filters=null",
      "filters=42",
      'filters="status=active"',
      "filters={not json at all", // not JSON
      'filters={"combinator":"and\'; --","conditions":[]}', // combinator outside the enum
      'filters={"combinator":"and","conditions":[{"field":"status","operator":"in","value":"active"}]}', // `in` without a list
      'filters={"combinator":"and","conditions":[{"field":"status","operator":"drop","value":"x"}]}', // unknown operator
      'filters={"combinator":"and","conditions":[{"field":"status","operator":"eq","value":{"$ne":null}}]}', // object value
      'filters={"combinator":"and","conditions":[{"field":"status","operator":"eq","value":["a","b"]}]}', // array value
    ];

    for (const search of cases) {
      const parsed = parseTableQuery(new URLSearchParams(search));
      expect(parsed.filters.conditions, search).toEqual([]);
      expect(parsed.filters.combinator, search).toBe("and");
    }
  });

  test("a filter set longer than the cap is refused rather than truncated", () => {
    const conditions = Array.from({ length: 25 }, () => ({ field: "status", operator: "eq", value: "active" }));
    expect(tableQuerySchema.safeParse({ filters: { combinator: "and", conditions } }).success).toBe(false);
    // Through the URL it degrades to no filters at all — never to the first twenty of twenty-five.
    const url = new URLSearchParams({ filters: JSON.stringify({ combinator: "and", conditions }) });
    expect(parseTableQuery(url).filters.conditions).toEqual([]);
  });

  test("the search term is length-capped", () => {
    const long = "a".repeat(5_000);
    expect(parseTableQuery(new URLSearchParams({ q: long })).q).toHaveLength(200);
    expect(tableQuerySchema.safeParse({ q: long }).success).toBe(false);
  });
});

/** `parseSort` reached through the public URL parser, so the test exercises the shipped path. */
function parseSortOf(raw: string): { field: string; dir: string }[] {
  return parseTableQuery(new URLSearchParams({ sort: raw })).sort;
}

// ---------------------------------------------------------------------------
// 3. Pagination edges
// ---------------------------------------------------------------------------

describe("pagination", () => {
  test("page 0 and negative pages clamp to the first page", () => {
    expect(buildTableQuery(usersTableSpec, query({ page: 0 })).page).toBe(1);
    expect(buildTableQuery(usersTableSpec, query({ page: -17 })).page).toBe(1);
    expect(buildTableQuery(usersTableSpec, query({ page: 0 })).offset).toBe(0);
    // Through the URL they never even become a page number.
    expect(parseTableQuery(new URLSearchParams("page=0")).page).toBe(1);
    expect(parseTableQuery(new URLSearchParams("page=-3")).page).toBe(1);
    expect(parseTableQuery(new URLSearchParams("page=abc")).page).toBe(1);
    expect(parseTableQuery(new URLSearchParams("page=1e9999")).page).toBe(1);
  });

  test("a page past the end clamps to the last real page once the total is known", () => {
    const total = userCount(); // 8
    const built = buildTableQuery(usersTableSpec, query({ page: 40, pageSize: 3 }), { total });
    expect(built.page).toBe(3);
    expect(built.offset).toBe(6);

    // Without the total the builder cannot know, so it honours the page and returns nothing —
    // which is why the route pattern counts first.
    const blind = buildTableQuery(usersTableSpec, query({ page: 40, pageSize: 3 }));
    expect(blind.offset).toBe(117);
    expect(runUsers(query({ page: 40, pageSize: 3 }))).toEqual([]);
  });

  test("an empty result still reports one page", () => {
    const meta = pageMetaOf(0, 7, 25);
    expect(meta).toEqual({ page: 1, pageSize: 25, total: 0, pageCount: 1 });
  });

  test("pageSize is capped by the spec and by the global ceiling", () => {
    expect(resolvePageSize(usersTableSpec, 10_000)).toBe(MAX_PAGE_SIZE);
    expect(resolvePageSize(auditTableSpec, 10_000)).toBe(100); // the audit spec caps lower
    expect(buildTableQuery(auditTableSpec, query({ pageSize: MAX_PAGE_SIZE })).limit).toBe(100);
    expect(resolvePageSize(usersTableSpec, 0)).toBe(1);
    expect(resolvePageSize(usersTableSpec, -5)).toBe(1);
    expect(resolvePageSize(usersTableSpec, Number.NaN)).toBe(25);
    expect(resolvePageSize(usersTableSpec, 25.9)).toBe(25);
  });

  test("an absurd pageSize in the URL falls back to the default", () => {
    expect(parseTableQuery(new URLSearchParams("pageSize=100000")).pageSize).toBe(25);
    expect(parseTableQuery(new URLSearchParams("pageSize=0")).pageSize).toBe(25);
    expect(parseTableQuery(new URLSearchParams("pageSize=-1")).pageSize).toBe(25);
    expect(parseTableQuery(new URLSearchParams("pageSize=50")).pageSize).toBe(50);
  });

  test("paging over a column full of ties never repeats or loses a row", () => {
    // `status` has two distinct values across eight rows, so without a tiebreak SQLite is free to
    // return the same row on two pages. Walking every page must still yield all eight, once each.
    const seen: string[] = [];
    for (let page = 1; page <= 4; page++) {
      seen.push(...usernames(query({ sort: [{ field: "status", dir: "asc" }], page, pageSize: 2 })));
    }
    expect(seen).toHaveLength(8);
    expect(new Set(seen).size).toBe(8);
  });

  test("the tiebreak follows the direction of the last sort key", () => {
    const asc = usernames(query({ sort: [{ field: "status", dir: "asc" }], pageSize: 100 }));
    const desc = usernames(query({ sort: [{ field: "status", dir: "desc" }], pageSize: 100 }));
    expect(asc[0]).toBe("ada"); // active, lowest id
    expect(desc[0]).toBe("farhan"); // disabled, highest id
  });
});

// ---------------------------------------------------------------------------
// 4. Semantics
// ---------------------------------------------------------------------------

describe("filtering", () => {
  test("conditions AND together by default", () => {
    expect(
      usernames(
        query({
          filters: {
            combinator: "and",
            conditions: [
              { field: "status", operator: "eq", value: "active" },
              { field: "role", operator: "eq", value: "learner" },
            ],
          },
          pageSize: 100,
        }),
      ),
    ).toEqual(["hari", "gita", "esha", "dev", "bala"]);
  });

  test("an OR filter set widens", () => {
    expect(
      usernames(
        query({
          filters: {
            combinator: "or",
            conditions: [
              { field: "status", operator: "eq", value: "disabled" },
              { field: "role", operator: "eq", value: "superadmin" },
            ],
          },
          pageSize: 100,
        }),
      ).sort(),
    ).toEqual(["ada", "chitra", "farhan"]);
  });

  test("search narrows an OR set rather than widening it", () => {
    const or = {
      combinator: "or" as const,
      conditions: [
        { field: "status", operator: "eq" as const, value: "disabled" },
        { field: "role", operator: "eq" as const, value: "superadmin" },
      ],
    };
    expect(usernames(query({ filters: or, q: "chitra", pageSize: 100 }))).toEqual(["chitra"]);
    // If `q` were OR'ed in, "ada" and "farhan" would still be here.
    expect(usernames(query({ filters: or, q: "zzz", pageSize: 100 }))).toEqual([]);
  });

  test("`between` accepts an open end at either side", () => {
    const from = NOW - 35 * DAY;
    const to = NOW - 15 * DAY;
    expect(usernames(query({ ...filters({ field: "createdAt", operator: "between", value: [from, to] }), pageSize: 100 }))).toEqual(
      ["esha", "dev"],
    );
    expect(
      usernames(query({ ...filters({ field: "createdAt", operator: "between", value: [null, to] }), pageSize: 100 })),
    ).toEqual(["esha", "dev", "chitra", "bala", "ada"]);
    expect(
      usernames(query({ ...filters({ field: "createdAt", operator: "between", value: [from, null] }), pageSize: 100 }))
        .length,
    ).toBe(5);
    // A range with both ends open is not a range.
    expect(
      tableQuerySchema.safeParse({
        filters: { combinator: "and", conditions: [{ field: "createdAt", operator: "between", value: [null, null] }] },
      }).success,
    ).toBe(false);
  });

  test("a date may arrive as an ISO string and is compared as epoch milliseconds", () => {
    const iso = new Date(NOW - 35 * DAY).toISOString();
    const byString = usernames(query({ ...filters({ field: "createdAt", operator: "gte", value: iso }), pageSize: 100 }));
    const byNumber = usernames(
      query({ ...filters({ field: "createdAt", operator: "gte", value: NOW - 35 * DAY }), pageSize: 100 }),
    );
    expect(byString).toEqual(byNumber);
    expect(byString).toHaveLength(5);
  });

  test("`isNull` and `isNotNull` take no value and split the table", () => {
    const missing = usernames(query({ ...filters({ field: "lastLoginAt", operator: "isNull" }), pageSize: 100 }));
    const present = usernames(query({ ...filters({ field: "lastLoginAt", operator: "isNotNull" }), pageSize: 100 }));
    expect(missing.sort()).toEqual(["chitra", "farhan"]);
    expect(missing.length + present.length).toBe(8);
  });

  test("booleans compare as booleans", () => {
    const yes = usernames(query({ ...filters({ field: "mustChangePassword", operator: "eq", value: true }), pageSize: 100 }));
    expect(yes.sort()).toEqual(["ada", "chitra", "esha", "gita"]);
  });

  test("the default sort applies when the request asks for none", () => {
    // Newest first, which for this fixture is `hari`.
    expect(usernames(query({ pageSize: 100 }))[0]).toBe("hari");
  });

  test("no filters means no WHERE clause at all", () => {
    expect(buildTableQuery(usersTableSpec, query()).where).toBeUndefined();
  });

  test("the built clause is parameterised, never interpolated", () => {
    const built = buildTableQuery(
      usersTableSpec,
      query(filters({ field: "username", operator: "contains", value: "'; DROP TABLE users; --" })),
    );
    const compiled = db.select().from(schema.users).where(built.where).toSQL();
    expect(compiled.sql).not.toContain("DROP");
    expect(compiled.sql).toContain("?");
    expect(compiled.params).toContain("%'; DROP TABLE users; --%");
  });

  test("the escape clause survives compilation", () => {
    const built = buildTableQuery(usersTableSpec, query({ q: "100%" }));
    const compiled = db.select().from(schema.users).where(built.where).toSQL();
    expect(compiled.sql.toLowerCase()).toContain("escape");
    expect(compiled.params).toContain("%100\\%%");
  });
});

// ---------------------------------------------------------------------------
// URL round-trip
// ---------------------------------------------------------------------------

describe("url round-trip", () => {
  test("a query survives being written to a URL and read back", () => {
    const original = query({
      q: "rao",
      filters: {
        combinator: "or",
        conditions: [
          { field: "status", operator: "in", value: ["active", "disabled"] },
          { field: "createdAt", operator: "between", value: [1, 2] },
          { field: "lastLoginAt", operator: "isNull" },
        ],
      },
      sort: [{ field: "displayName", dir: "asc" }],
      page: 3,
      pageSize: 50,
    });
    expect(parseTableQuery(writeTableQuery(original))).toEqual(original);
  });

  test("defaults are left out of the URL entirely", () => {
    expect(writeTableQuery(EMPTY_TABLE_QUERY).toString()).toBe("");
    expect(writeTableQuery(query({ page: 1, pageSize: 25 })).toString()).toBe("");
  });

  test("writing into existing params leaves unrelated ones alone", () => {
    const params = new URLSearchParams({ tab: "progress", page: "9" });
    writeTableQuery(query({ q: "ada" }), params);
    expect(params.get("tab")).toBe("progress");
    expect(params.get("q")).toBe("ada");
    expect(params.get("page")).toBeNull(); // back to its default, so removed
  });

  test("a round-tripped query still compiles against the whitelist", () => {
    const parsed = parseTableQuery(
      writeTableQuery(query({ ...filters({ field: "role", operator: "in", value: ["learner"] }), q: "a" })),
    );
    expect(usernames({ ...parsed, pageSize: 100 }).length).toBeGreaterThan(0);
  });
});

describe("the database is intact after all of the above", () => {
  test("every row is still there", () => {
    expect(userCount()).toBe(PEOPLE.length);
    const tables = db
      .all<{ name: string }>(sql`select name from sqlite_master where type = 'table' and name = 'users'`);
    expect(tables).toHaveLength(1);
  });
});
