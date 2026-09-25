import { count } from "drizzle-orm";
import type { SQLiteSelect, SQLiteTable } from "drizzle-orm/sqlite-core";

import { parseTableQuery, type PageMeta, type TableQuery } from "../../../shared/table";
import type { Db } from "../db";
import { buildTableQuery, pageMetaOf, type TableSpec } from "./tableQuery";

/**
 * The three lines every server-paged admin table would otherwise repeat.
 *
 * Counting before selecting is deliberate, and in that order: the page number has to be clamped
 * against the real total before the `OFFSET` is computed, or asking for page 9 of a 3-page result
 * returns an empty page instead of the last one. `buildTableQuery` does that clamping, but only
 * when it is handed the total — which is why this helper exists rather than each route
 * remembering to pass it.
 *
 * The identifiers never come from the request: `spec` is a compile-time whitelist and an unknown
 * field or operator is a 400 from `buildTableQuery`, not a silently dropped condition.
 */
export function pagedQuery(db: Db, spec: TableSpec, table: SQLiteTable, rawQuery: unknown): {
  query: TableQuery;
  meta: PageMeta;
  /** Applies `where`, `orderBy`, `limit` and `offset` to a select you have already shaped. */
  apply: <T extends SQLiteSelect>(select: T) => T;
} {
  const query = parseTableQuery((rawQuery ?? {}) as Record<string, string | undefined>);

  // A count with the same WHERE, before the page is resolved.
  const counted = buildTableQuery(spec, query);
  const total = db.select({ n: count() }).from(table).where(counted.where).get()?.n ?? 0;

  const built = buildTableQuery(spec, query, { total });
  const meta = pageMetaOf(total, built.page, built.pageSize);

  return {
    query,
    meta,
    apply: (select) =>
      select.where(built.where).orderBy(...built.orderBy).limit(built.limit).offset(built.offset) as typeof select,
  };
}
