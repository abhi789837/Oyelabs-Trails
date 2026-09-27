import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { beforeAll, describe, expect, test } from "vitest";

import { migrationsFolder, schema, type Db } from "../db";
import { pagedQuery } from "./pagedRoute";
import { TableQueryError } from "./tableQuery";
import { usersTableSpec } from "./tableSpecs";

/**
 * `pagedQuery` is three lines of glue, and every one of them is a line a route would otherwise get
 * wrong on its own.
 *
 * The claim worth testing is the ordering: the total has to be counted **with the same WHERE** and
 * handed to `buildTableQuery` before the offset is computed. Skip that and asking for page 9 of a
 * 3-page result returns nothing — which looks like "no matches" rather than "you overshot", and
 * sends an admin off to check their filters when the filters were fine.
 */

let db: Db;

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 0, 1);

beforeAll(() => {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: migrationsFolder() });

  // Twelve people: enough for several pages at the smallest page size, six of them disabled so a
  // filtered count is genuinely different from the unfiltered one.
  for (let i = 0; i < 12; i += 1) {
    db.insert(schema.users)
      .values({
        id: `user-${String(i).padStart(2, "0")}`,
        username: `person${i}`,
        displayName: `Person ${i}`,
        passwordHash: "x",
        role: "learner",
        status: i % 2 === 0 ? "active" : "disabled",
        mustChangePassword: false,
        createdAt: NOW - (12 - i) * DAY,
      })
      .run();
  }
});

function page(raw: Record<string, string>) {
  const { meta, apply } = pagedQuery(db, usersTableSpec, schema.users, raw);
  const rows = apply(db.select({ username: schema.users.username }).from(schema.users).$dynamic()).all();
  return { meta, usernames: rows.map((r) => r.username) };
}

describe("pagedQuery", () => {
  test("counts the whole set and returns the first page", () => {
    const { meta, usernames } = page({ pageSize: "10" });
    expect(meta.total).toBe(12);
    expect(meta.pageCount).toBe(2);
    expect(usernames).toHaveLength(10);
  });

  test("a page past the end is clamped to the last page, not returned empty", () => {
    const { meta, usernames } = page({ pageSize: "10", page: "9" });
    expect(meta.page).toBe(2);
    expect(usernames).toHaveLength(2);
  });

  test("page 0 and a negative page both resolve to the first page", () => {
    expect(page({ pageSize: "10", page: "0" }).meta.page).toBe(1);
    expect(page({ pageSize: "10", page: "-3" }).meta.page).toBe(1);
  });

  test("the total counts the filtered set, not the table", () => {
    const filtered = page({
      pageSize: "10",
      filters: JSON.stringify({ combinator: "and", conditions: [{ field: "status", operator: "eq", value: "disabled" }] }),
    });
    expect(filtered.meta.total).toBe(6);
    expect(filtered.meta.pageCount).toBe(1);
    expect(filtered.usernames).toHaveLength(6);
  });

  test("clamping uses the filtered total, so an overshoot lands on the filtered last page", () => {
    const filtered = page({
      pageSize: "5",
      page: "8",
      filters: JSON.stringify({ combinator: "and", conditions: [{ field: "status", operator: "eq", value: "disabled" }] }),
    });
    expect(filtered.meta.page).toBe(2);
    expect(filtered.usernames).toHaveLength(1);
  });

  test("an unknown field is still a 400 through the helper, not a dropped condition", () => {
    expect(() =>
      page({
        filters: JSON.stringify({
          combinator: "and",
          conditions: [{ field: "passwordHash", operator: "eq", value: "x" }],
        }),
      }),
    ).toThrow(TableQueryError);
  });

  test("an empty result reports zero rather than one empty page of an unknown total", () => {
    const { meta, usernames } = page({
      filters: JSON.stringify({
        combinator: "and",
        conditions: [{ field: "username", operator: "eq", value: "nobody" }],
      }),
    });
    expect(meta.total).toBe(0);
    expect(usernames).toEqual([]);
  });
});
