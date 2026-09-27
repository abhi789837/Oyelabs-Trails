import { z } from "zod";

/**
 * The one query language every table in Oyelearn speaks.
 *
 * The same object is produced by the browser's URL (`?q=&filters=&sort=&page=&pageSize=`),
 * validated here, evaluated client-side for small tables, and compiled to SQL by
 * `server/src/lib/tableQuery.ts` for the unbounded ones. Sharing the schema is what stops the
 * two halves drifting: a filter the client can build is a filter the server can execute, and a
 * filter the server refuses is one the client could not have built in the first place.
 *
 * **This schema is a shape check, not an authorisation check.** It says "`field` looks like an
 * identifier and `operator` is one of fifteen known words". It has no idea which fields exist on
 * which table, and it must never be the only thing standing between a query string and SQL. The
 * whitelist lives in the per-table spec on the server (`defineTableSpec`), which rejects anything
 * it was not explicitly told about. Two layers, and the outer one is deliberately the weaker.
 */

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

/** What the page-size select offers. */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export const DEFAULT_PAGE_SIZE = 25;

/**
 * The hard ceiling, applied after everything else. A table spec may cap lower, never higher.
 * `?pageSize=100000` is not an error worth an error page — it is clamped, because the only thing
 * that matters is that it cannot reach the database.
 */
export const MAX_PAGE_SIZE = 200;

/**
 * A filter set is a human building a question, not a program generating one. Twenty conditions is
 * far past any real use and well short of anything that could make SQLite work hard.
 */
export const MAX_FILTER_CONDITIONS = 20;

/** Three sort keys is already more than a reader can hold; past that it is someone probing. */
export const MAX_SORT_FIELDS = 3;

/** Long enough for a full email or a ULID, short enough that a `LIKE` scan stays cheap. */
export const MAX_SEARCH_LENGTH = 200;

/** One `in` list. A faceted filter over a status enum needs a handful; 100 is generous. */
export const MAX_IN_VALUES = 100;

// ---------------------------------------------------------------------------
// Operators
// ---------------------------------------------------------------------------

/** Operators taking exactly one scalar. */
export const SCALAR_OPERATORS = [
  "eq",
  "ne",
  "lt",
  "lte",
  "gt",
  "gte",
  "contains",
  "notContains",
  "startsWith",
  "endsWith",
] as const;

/** Operators taking a list. */
export const LIST_OPERATORS = ["in", "notIn"] as const;

/** Operators taking a `[from, to]` pair. */
export const RANGE_OPERATORS = ["between"] as const;

/** Operators taking no value at all. */
export const UNARY_OPERATORS = ["isNull", "isNotNull"] as const;

export const FILTER_OPERATORS = [
  ...SCALAR_OPERATORS,
  ...LIST_OPERATORS,
  ...RANGE_OPERATORS,
  ...UNARY_OPERATORS,
] as const;

export type FilterOperator = (typeof FILTER_OPERATORS)[number];

/** Labels for the advanced builder's operator select. */
export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  eq: "is",
  ne: "is not",
  lt: "is before",
  lte: "is at most",
  gt: "is after",
  gte: "is at least",
  contains: "contains",
  notContains: "does not contain",
  startsWith: "starts with",
  endsWith: "ends with",
  in: "is any of",
  notIn: "is none of",
  between: "is between",
  isNull: "is empty",
  isNotNull: "is not empty",
};

export function operatorArity(operator: FilterOperator): "scalar" | "list" | "range" | "none" {
  if ((LIST_OPERATORS as readonly string[]).includes(operator)) return "list";
  if ((RANGE_OPERATORS as readonly string[]).includes(operator)) return "range";
  if ((UNARY_OPERATORS as readonly string[]).includes(operator)) return "none";
  return "scalar";
}

// ---------------------------------------------------------------------------
// Conditions
// ---------------------------------------------------------------------------

/**
 * A field name is an identifier and nothing else.
 *
 * This is the cheap, early half of the defence: `1;DROP TABLE users`, `users.password_hash` and
 * `id) or 1=1 --` all fail here before any lookup happens. The expensive, authoritative half is
 * the per-table whitelist. Neither is sufficient alone; the regex exists so that a malformed
 * field never even reaches the code that decides what is allowed.
 */
export const fieldNameSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "A field name must be a plain identifier.");

/** Filter values are data. A value is never interpolated into SQL — it is always a bound parameter. */
export const filterScalarSchema = z.union([z.string().max(MAX_SEARCH_LENGTH), z.number().finite(), z.boolean()]);

export type FilterScalar = z.infer<typeof filterScalarSchema>;

const scalarConditionSchema = z.object({
  field: fieldNameSchema,
  operator: z.enum(SCALAR_OPERATORS),
  value: filterScalarSchema,
});

const listConditionSchema = z.object({
  field: fieldNameSchema,
  operator: z.enum(LIST_OPERATORS),
  value: z.array(filterScalarSchema).min(1).max(MAX_IN_VALUES),
});

const rangeConditionSchema = z.object({
  field: fieldNameSchema,
  operator: z.enum(RANGE_OPERATORS),
  /** `[from, to]`. Either end may be null for an open range; both null is rejected. */
  value: z
    .tuple([filterScalarSchema.nullable(), filterScalarSchema.nullable()])
    .refine(([from, to]) => from !== null || to !== null, "A range needs at least one end."),
});

const unaryConditionSchema = z.object({
  field: fieldNameSchema,
  operator: z.enum(UNARY_OPERATORS),
  value: z.undefined().optional(),
});

/**
 * One `field · operator · value` row.
 *
 * A union rather than one loose object, so the operator and the shape of its value can never
 * disagree: `{ operator: "in", value: "admin" }` is not a filter that runs and quietly matches
 * nothing, it is a filter that fails to parse.
 */
export const filterConditionSchema = z.union([
  scalarConditionSchema,
  listConditionSchema,
  rangeConditionSchema,
  unaryConditionSchema,
]);

export type FilterCondition = z.infer<typeof filterConditionSchema>;

export const filterCombinatorSchema = z.enum(["and", "or"]);
export type FilterCombinator = z.infer<typeof filterCombinatorSchema>;

/**
 * Conditions plus how to join them. Flat on purpose: the filter chips, the faceted popovers and
 * the advanced builder all produce this, and one level of nesting would double the UI for a
 * question nobody has asked yet.
 */
export const filterSetSchema = z.object({
  combinator: filterCombinatorSchema.default("and"),
  conditions: z.array(filterConditionSchema).max(MAX_FILTER_CONDITIONS).default([]),
});

export type FilterSet = z.infer<typeof filterSetSchema>;

export const EMPTY_FILTER_SET: FilterSet = { combinator: "and", conditions: [] };

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

export const sortDirectionSchema = z.enum(["asc", "desc"]);
export type SortDirection = z.infer<typeof sortDirectionSchema>;

export const sortSpecSchema = z.object({ field: fieldNameSchema, dir: sortDirectionSchema });
export type SortSpec = z.infer<typeof sortSpecSchema>;

// ---------------------------------------------------------------------------
// The query
// ---------------------------------------------------------------------------

export const tableQuerySchema = z.object({
  /** Global search. Matched against the fields the table spec marks searchable. */
  q: z.string().max(MAX_SEARCH_LENGTH).default(""),
  filters: filterSetSchema.default(EMPTY_FILTER_SET),
  sort: z.array(sortSpecSchema).max(MAX_SORT_FIELDS).default([]),
  /** One-based. Clamped, never rejected — a stale link is not an attack. */
  page: z.number().int().min(1).catch(1).default(1),
  pageSize: z.number().int().min(1).max(MAX_PAGE_SIZE).catch(DEFAULT_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type TableQuery = z.infer<typeof tableQuerySchema>;

export const EMPTY_TABLE_QUERY: TableQuery = {
  q: "",
  filters: EMPTY_FILTER_SET,
  sort: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

/** True when the query would return the whole table — used to pick which empty state to show. */
export function isQueryEmpty(query: TableQuery): boolean {
  return query.q.trim() === "" && query.filters.conditions.length === 0;
}

// ---------------------------------------------------------------------------
// URL encoding
// ---------------------------------------------------------------------------

/**
 * `sort` travels as `field:dir,field2:dir` rather than JSON, because it is the part of the query
 * a person is most likely to read or hand-edit in the address bar.
 */
export function serializeSort(sort: readonly SortSpec[]): string {
  return sort.map((s) => `${s.field}:${s.dir}`).join(",");
}

export function parseSort(raw: string | null | undefined): SortSpec[] {
  if (!raw) return [];
  const out: SortSpec[] = [];
  for (const part of raw.split(",")) {
    const [field = "", dir = ""] = part.split(":");
    const parsed = sortSpecSchema.safeParse({ field: field.trim(), dir: dir.trim() });
    // A malformed sort key is dropped rather than failing the whole request: it changes the
    // order of rows, not which rows a caller is allowed to see.
    if (parsed.success) out.push(parsed.data);
    if (out.length >= MAX_SORT_FIELDS) break;
  }
  return out;
}

function parseIntParam(raw: string | null | undefined, fallback: number): number {
  if (raw == null || raw.trim() === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

/**
 * Reads a `TableQuery` out of URL parameters.
 *
 * Never throws. A URL is shared over chat, truncated by a mail client and edited by hand, so the
 * failure mode that matters is "shows the unfiltered table", not "shows a stack trace". Anything
 * unparseable falls back to its default — **except** a filter set that parses as JSON but does not
 * match the schema, which is dropped whole rather than partially applied, so a corrupted link can
 * never silently widen a filter into a different one.
 */
export function parseTableQuery(params: URLSearchParams | Record<string, string | undefined>): TableQuery {
  const get = (key: string): string | null => {
    if (params instanceof URLSearchParams) return params.get(key);
    return params[key] ?? null;
  };

  let filters: FilterSet = EMPTY_FILTER_SET;
  const rawFilters = get("filters");
  if (rawFilters) {
    try {
      const parsed = filterSetSchema.safeParse(JSON.parse(rawFilters));
      if (parsed.success) filters = parsed.data;
    } catch {
      // Not JSON at all. Same outcome as failing the schema: no filters.
    }
  }

  const result = tableQuerySchema.safeParse({
    q: (get("q") ?? "").slice(0, MAX_SEARCH_LENGTH),
    filters,
    sort: parseSort(get("sort")),
    page: parseIntParam(get("page"), 1),
    pageSize: parseIntParam(get("pageSize"), DEFAULT_PAGE_SIZE),
  });

  if (result.success) return result.data;
  // `.catch()` covers page and pageSize, so getting here means something structural is wrong.
  return EMPTY_TABLE_QUERY;
}

/**
 * Writes a `TableQuery` into URL parameters, omitting anything at its default.
 *
 * Defaults are left out so the common case has a clean address bar and a "reset" genuinely looks
 * reset. `mutate` lets a caller apply this onto an existing `URLSearchParams` — the admin pages
 * keep unrelated parameters (an open tab, a selected learner) alongside the table's.
 */
export function writeTableQuery(query: TableQuery, into: URLSearchParams = new URLSearchParams()): URLSearchParams {
  const set = (key: string, value: string | null) => {
    if (value === null || value === "") into.delete(key);
    else into.set(key, value);
  };

  set("q", query.q.trim());
  set("filters", query.filters.conditions.length ? JSON.stringify(query.filters) : null);
  set("sort", serializeSort(query.sort));
  set("page", query.page > 1 ? String(query.page) : null);
  set("pageSize", query.pageSize !== DEFAULT_PAGE_SIZE ? String(query.pageSize) : null);
  return into;
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

/** What a paged endpoint returns alongside its rows. */
export const pageMetaSchema = z.object({
  /** After clamping. May differ from what was asked for, and the UI should follow it. */
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  /** Rows matching the filters, ignoring pagination. */
  total: z.number().int().min(0),
  pageCount: z.number().int().min(1),
});

export type PageMeta = z.infer<typeof pageMetaSchema>;

export function tablePageSchema<T extends z.ZodTypeAny>(row: T) {
  return z.object({ rows: z.array(row), meta: pageMetaSchema });
}

/**
 * `total` rows at `pageSize` per page, with `page` clamped into range.
 *
 * Shared rather than duplicated because both halves have to agree: a client-side table that
 * clamps page 40 to page 3 and a server that returns an empty page 40 would disagree about what
 * the same URL means, and the bug would only show up on a link someone sent to someone else.
 */
export function pageMetaOf(total: number, page: number, pageSize: number): PageMeta {
  const safeTotal = Math.max(0, Math.trunc(total) || 0);
  const safeSize = Math.max(1, Math.trunc(pageSize) || 1);
  const pageCount = Math.max(1, Math.ceil(safeTotal / safeSize));
  const safePage = Math.min(Math.max(1, Math.trunc(page) || 1), pageCount);
  return { page: safePage, pageSize: safeSize, total: safeTotal, pageCount };
}

/**
 * "Showing 21–40 of 312". Returns nulls for an empty result so the caller can say "No results"
 * rather than "Showing 1–0 of 0".
 */
export function pageRange(meta: PageMeta): { from: number; to: number } | null {
  if (meta.total === 0) return null;
  const from = (meta.page - 1) * meta.pageSize + 1;
  return { from, to: Math.min(meta.total, from + meta.pageSize - 1) };
}
