import { getTableName, is, sql } from "drizzle-orm";
import { SQLiteTable } from "drizzle-orm/sqlite-core";
import { afterAll, beforeAll, expect, test } from "vitest";

import { schema } from "../db";
import { createTestApp, type TestContext } from "../test/harness";

let ctx: TestContext;

beforeAll(async () => {
  ctx = await createTestApp();
});

afterAll(async () => {
  await ctx.close();
});

test("GET /api/health reports ok and reaches the database", async () => {
  const res = await ctx.app.inject({ method: "GET", url: "/api/health" });
  expect(res.statusCode).toBe(200);
  const body = res.json();
  expect(body.ok).toBe(true);
  expect(body.db).toBe("ok");
  expect(body.name).toBe("oyelabs-trails");
  expect(typeof body.uptimeSec).toBe("number");
});

test("migrations create every table the schema declares", () => {
  // Widened to unknown first: `schema` is a union of specific table types, and a type predicate
  // has to narrow to a subtype of its parameter.
  const declared = (Object.values(schema) as unknown[])
    .filter((value): value is SQLiteTable => is(value, SQLiteTable))
    .map((table) => getTableName(table))
    .sort();

  const existing = new Set(
    ctx.db
      .all<{ name: string }>(sql`select name from sqlite_master where type = 'table'`)
      .map((row) => row.name),
  );

  expect(declared.length).toBeGreaterThan(10);
  // A table in the schema but not in the database means someone edited schema.ts without
  // running `npm run db:generate`.
  expect(declared.filter((name) => !existing.has(name))).toEqual([]);
});

test("foreign keys are enforced on the connection", () => {
  // SQLite defaults foreign_keys to OFF per connection, so this pragma is load-bearing.
  const [row] = ctx.db.all<{ foreign_keys: number }>(sql`pragma foreign_keys`);
  expect(row.foreign_keys).toBe(1);
});

test("an unknown API route returns the JSON error envelope, not HTML", async () => {
  const res = await ctx.app.inject({ method: "GET", url: "/api/does-not-exist" });
  expect(res.statusCode).toBe(404);
  expect(res.json().error.code).toBe("not_found");
});
