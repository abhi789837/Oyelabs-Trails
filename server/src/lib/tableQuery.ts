import { and, asc, desc, eq, gt, gte, inArray, isNotNull, isNull, lt, lte, ne, notInArray, or, sql, type SQL } from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";

import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  pageMetaOf,
  type FilterCondition,
  type FilterOperator,
  type FilterScalar,
  type SortSpec,
  type TableQuery,
} from "../../../shared/table";
import { HttpError } from "./errors";
import { ERROR_CODES } from "../../../shared/api";

/**
 * Compiles a `TableQuery` (shared/table.ts) into Drizzle SQL — against a whitelist, and only a
 * whitelist.
 *
 * ## The rule
 *
 * Nothing from a query string ever becomes SQL text. Two different things travel in a table query
 * and they are treated completely differently:
 *
 * - **Identifiers** — the field to filter on, the field to sort by, the direction. These *cannot*
 *   be parameterised by SQLite, so they are never taken from the request at all. The request
 *   supplies a *key*; the key is looked up in the table's `fields` map; the map supplies the
 *   Drizzle column object. A key that is not in the map is a 400. It is not coerced, not
 *   prefix-matched, not lowercased-and-retried, and above all not passed through.
 * - **Values** — always bound parameters, via Drizzle's operators or a `sql` template hole. A
 *   value containing `'; DROP TABLE users; --` is stored and compared as that exact 24-character
 *   string, because it never reaches the parser.
 *
 * ## Rejected, not ignored
 *
 * An unknown field, an operator the field does not allow, an enum value outside the field's list,
 * a sort on a non-sortable column — each throws. Dropping them instead would be worse than the
 * error: a filter that silently disappears shows the caller *more* rows than they asked for, and
 * on tables like `audit_log` and `ai_calls` "more rows than you asked for" is the whole problem.
 *
 * The one deliberate exception is pagination. `page` and `pageSize` are clamped rather than
 * rejected, because a stale bookmark to page 40 of a list that has shrunk to 3 pages is an
 * everyday event, not an attack, and there is a correct answer to give.
 */

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/**
 * A 400 with a stable `reason`, so tests can assert *why* a query was refused rather than
 * matching on prose. Extends `HttpError`, so routes need no mapping — the app's error handler
 * already turns it into the standard error body.
 */
export class TableQueryError extends HttpError {
  constructor(
    readonly reason:
      | "unknown_field"
      | "operator_not_allowed"
      | "value_not_allowed"
      | "not_sortable"
      | "not_searchable",
    message: string,
    fields?: Record<string, string>,
  ) {
    super(400, ERROR_CODES.BAD_REQUEST, message, fields);
    this.name = "TableQueryError";
  }
}

// ---------------------------------------------------------------------------
// Spec
// ---------------------------------------------------------------------------

export type TableFieldType = "string" | "number" | "boolean" | "date" | "enum";

/**
 * Which operators each type may use, unless a field narrows it further.
 *
 * `enum` gets equality and membership only. `contains` on an enum is always either a bug or
 * someone probing: the set of values is finite and known, so "is any of" says it exactly.
 */
const OPERATORS_BY_TYPE: Record<TableFieldType, readonly FilterOperator[]> = {
  string: ["eq", "ne", "contains", "notContains", "startsWith", "endsWith", "in", "notIn", "isNull", "isNotNull"],
  number: ["eq", "ne", "lt", "lte", "gt", "gte", "between", "in", "notIn", "isNull", "isNotNull"],
  date: ["eq", "ne", "lt", "lte", "gt", "gte", "between", "isNull", "isNotNull"],
  boolean: ["eq", "ne", "isNull", "isNotNull"],
  enum: ["eq", "ne", "in", "notIn", "isNull", "isNotNull"],
};

export interface TableFieldSpec {
  /** The Drizzle column. This object — never a string from the request — is what reaches SQL. */
  column: SQLiteColumn;
  type: TableFieldType;
  /** Narrows `OPERATORS_BY_TYPE`. Widening past the type's list is not possible. */
  operators?: readonly FilterOperator[];
  /** Required for `type: "enum"`: the only values this field will compare against. */
  values?: readonly string[];
  /** Default true. Set false for a column with no index behind it that would scan the table. */
  sortable?: boolean;
  /** Included in the global `q` search. String and enum fields only. */
  searchable?: boolean;
}

export interface TableSpecInput {
  /** Used in error messages, so an admin can tell which table refused them. */
  name: string;
  fields: Record<string, TableFieldSpec>;
  /** Applied when the request asks for no sort. Must name sortable fields. */
  defaultSort: readonly SortSpec[];
  /**
   * A unique, sortable field appended to every sort as the final key.
   *
   * Without it, `ORDER BY status` over rows that share a status has no defined order, and SQLite
   * is free to return a row on page 1 *and* page 2 of the same scan. Defaults to `id` when the
   * spec has one.
   */
  tiebreak?: string;
  /** Caps below the global `MAX_PAGE_SIZE`. Never above it. */
  maxPageSize?: number;
}

export interface TableSpec extends Omit<TableSpecInput, "tiebreak" | "maxPageSize"> {
  readonly searchFields: readonly string[];
  readonly maxPageSize: number;
  /** Resolved: the spec's own, `id` if it has one, otherwise null (and paging over ties is then
   * only as stable as the columns being sorted). */
  readonly tiebreak: string | null;
}

/**
 * Validates a spec once, at module load, so a mistake in it is a boot failure rather than a 500
 * the first time an admin sorts by the wrong column.
 */
export function defineTableSpec(input: TableSpecInput): TableSpec {
  const names = Object.keys(input.fields);
  if (names.length === 0) throw new Error(`Table spec "${input.name}" has no fields.`);

  const searchFields: string[] = [];
  for (const [name, field] of Object.entries(input.fields)) {
    if (field.type === "enum" && (!field.values || field.values.length === 0)) {
      throw new Error(`Table spec "${input.name}": enum field "${name}" needs a \`values\` whitelist.`);
    }
    if (field.operators) {
      const allowed = OPERATORS_BY_TYPE[field.type];
      const widened = field.operators.filter((op) => !allowed.includes(op));
      if (widened.length) {
        throw new Error(
          `Table spec "${input.name}": field "${name}" (${field.type}) cannot allow ${widened.join(", ")}.`,
        );
      }
    }
    if (field.searchable) {
      if (field.type !== "string" && field.type !== "enum") {
        throw new Error(`Table spec "${input.name}": only string and enum fields can be searchable ("${name}").`);
      }
      searchFields.push(name);
    }
  }

  for (const sort of input.defaultSort) {
    const field = input.fields[sort.field];
    if (!field) throw new Error(`Table spec "${input.name}": defaultSort names unknown field "${sort.field}".`);
    if (field.sortable === false) {
      throw new Error(`Table spec "${input.name}": defaultSort names non-sortable field "${sort.field}".`);
    }
  }

  const tiebreak = input.tiebreak ?? (input.fields.id ? "id" : null);
  if (tiebreak) {
    const field = input.fields[tiebreak];
    if (!field) throw new Error(`Table spec "${input.name}": tiebreak names unknown field "${tiebreak}".`);
    if (field.sortable === false) {
      throw new Error(`Table spec "${input.name}": tiebreak field "${tiebreak}" must be sortable.`);
    }
  }

  const maxPageSize = Math.min(input.maxPageSize ?? MAX_PAGE_SIZE, MAX_PAGE_SIZE);
  if (maxPageSize < 1) throw new Error(`Table spec "${input.name}": maxPageSize must be at least 1.`);

  return { ...input, searchFields, maxPageSize, tiebreak };
}

// ---------------------------------------------------------------------------
// Lookups — the whitelist gate
// ---------------------------------------------------------------------------

function fieldOrThrow(spec: TableSpec, name: string): TableFieldSpec {
  /* `Object.hasOwn`, not `spec.fields[name]`, so `?filters=[{"field":"constructor"}]` and its
     friends on Object.prototype are unknown fields rather than objects we then try to use. */
  if (!Object.hasOwn(spec.fields, name)) {
    throw new TableQueryError("unknown_field", `"${name}" is not a field on ${spec.name}.`, { field: name });
  }
  return spec.fields[name]!;
}

function allowedOperators(field: TableFieldSpec): readonly FilterOperator[] {
  return field.operators ?? OPERATORS_BY_TYPE[field.type];
}

// ---------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------

/** What a value may become once the field's type has had its say. */
type BoundValue = string | number | boolean;

/**
 * Coerces and validates one value against the field it is being compared to.
 *
 * Strict rather than forgiving: a boolean field compared to `"yes"` is a 400, not a `true`. The
 * client builds these from the same field definitions, so a mismatch means something is wrong
 * with the request rather than with the person making it.
 */
function coerceValue(spec: TableSpec, name: string, field: TableFieldSpec, value: FilterScalar): BoundValue {
  switch (field.type) {
    case "string":
      if (typeof value !== "string") {
        throw new TableQueryError("value_not_allowed", `"${name}" on ${spec.name} takes text.`, { field: name });
      }
      return value;

    case "enum": {
      if (typeof value !== "string" || !field.values!.includes(value)) {
        throw new TableQueryError("value_not_allowed", `"${value}" is not a value of "${name}" on ${spec.name}.`, {
          field: name,
        });
      }
      return value;
    }

    case "boolean":
      if (typeof value !== "boolean") {
        throw new TableQueryError("value_not_allowed", `"${name}" on ${spec.name} takes true or false.`, {
          field: name,
        });
      }
      return value;

    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new TableQueryError("value_not_allowed", `"${name}" on ${spec.name} takes a number.`, { field: name });
      }
      return value;

    case "date": {
      /* Dates travel as epoch milliseconds, which is how every timestamp is stored. An ISO string
         is accepted too, because a hand-edited URL is far likelier to carry one than a 13-digit
         number, and `Date.parse` either understands it or the filter is refused. */
      if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
      if (typeof value === "string") {
        const parsed = Date.parse(value);
        if (Number.isFinite(parsed)) return parsed;
      }
      throw new TableQueryError("value_not_allowed", `"${name}" on ${spec.name} takes a date.`, { field: name });
    }
  }
}

/**
 * Escapes the three characters SQLite's `LIKE` treats as syntax, so a search for `100%` finds the
 * string "100%" instead of every row. The pattern itself is still a bound parameter — this is
 * about correctness, not injection, but getting it wrong looks like a security bug either way.
 */
function likePattern(value: string, mode: "contains" | "startsWith" | "endsWith"): string {
  const escaped = value.replace(/[\\%_]/g, (char) => `\\${char}`);
  if (mode === "startsWith") return `${escaped}%`;
  if (mode === "endsWith") return `%${escaped}`;
  return `%${escaped}%`;
}

/**
 * `column LIKE ? ESCAPE '\'`.
 *
 * Written as a `sql` template rather than Drizzle's `like()` because `like()` emits no `ESCAPE`
 * clause, which would leave the backslashes added above as literal backslashes to match.
 */
function likeSql(column: SQLiteColumn, pattern: string): SQL {
  return sql`${column} like ${pattern} escape '\\'`;
}

function notLikeSql(column: SQLiteColumn, pattern: string): SQL {
  return sql`${column} not like ${pattern} escape '\\'`;
}

// ---------------------------------------------------------------------------
// Conditions
// ---------------------------------------------------------------------------

function conditionToSql(spec: TableSpec, condition: FilterCondition): SQL {
  const field = fieldOrThrow(spec, condition.field);
  const operator = condition.operator;

  if (!allowedOperators(field).includes(operator)) {
    throw new TableQueryError(
      "operator_not_allowed",
      `"${operator}" cannot be used on "${condition.field}" (${field.type}) on ${spec.name}.`,
      { field: condition.field },
    );
  }

  const column = field.column;
  const one = (value: FilterScalar) => coerceValue(spec, condition.field, field, value);

  switch (operator) {
    case "isNull":
      return isNull(column);
    case "isNotNull":
      return isNotNull(column);

    case "in":
    case "notIn": {
      const values = condition.value.map(one);
      return operator === "in" ? inArray(column, values) : notInArray(column, values);
    }

    case "between": {
      const [rawFrom, rawTo] = condition.value;
      const parts: SQL[] = [];
      if (rawFrom !== null) parts.push(gte(column, one(rawFrom)));
      if (rawTo !== null) parts.push(lte(column, one(rawTo)));
      /* The schema guarantees at least one end, so `and()` always has something to combine and
         cannot return undefined here. The `!` is that guarantee restated for the type checker. */
      return and(...parts)!;
    }

    case "contains":
    case "notContains":
    case "startsWith":
    case "endsWith": {
      const value = one(condition.value);
      if (typeof value !== "string") {
        throw new TableQueryError("value_not_allowed", `"${condition.field}" takes text for "${operator}".`, {
          field: condition.field,
        });
      }
      if (operator === "notContains") return notLikeSql(column, likePattern(value, "contains"));
      return likeSql(column, likePattern(value, operator === "contains" ? "contains" : operator));
    }

    case "eq":
      return eq(column, one(condition.value));
    case "ne":
      return ne(column, one(condition.value));
    case "lt":
      return lt(column, one(condition.value));
    case "lte":
      return lte(column, one(condition.value));
    case "gt":
      return gt(column, one(condition.value));
    case "gte":
      return gte(column, one(condition.value));
  }
}

/**
 * The global search box: `contains` across every field the spec marks searchable, OR'd together.
 *
 * A spec with nothing searchable refuses the search rather than returning the whole table. The
 * alternative — quietly ignoring `q` — shows a caller every row while they believe they are
 * looking at matches, which is the exact failure this module exists to avoid.
 */
function searchToSql(spec: TableSpec, term: string): SQL | undefined {
  const trimmed = term.trim();
  if (!trimmed) return undefined;
  if (spec.searchFields.length === 0) {
    throw new TableQueryError("not_searchable", `${spec.name} cannot be searched by text.`, { q: "Not searchable." });
  }
  const pattern = likePattern(trimmed, "contains");
  return or(...spec.searchFields.map((name) => likeSql(spec.fields[name]!.column, pattern)));
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

function sortToSql(spec: TableSpec, sort: readonly SortSpec[]): SQL[] {
  const out: SQL[] = [];
  const used = new Set<string>();

  for (const entry of sort) {
    const field = fieldOrThrow(spec, entry.field);
    if (field.sortable === false) {
      throw new TableQueryError("not_sortable", `${spec.name} cannot be sorted by "${entry.field}".`, {
        field: entry.field,
      });
    }
    if (used.has(entry.field)) continue;
    used.add(entry.field);
    out.push(entry.dir === "desc" ? desc(field.column) : asc(field.column));
  }

  /* Stable paging. Two rows with the same sort key have no defined order in SQLite, so without a
     unique final key the same row can appear on two consecutive pages while another never
     appears at all. Appended only if the caller did not already sort by it. */
  if (spec.tiebreak && !used.has(spec.tiebreak)) {
    const last = sort[sort.length - 1];
    const dir = last?.dir === "desc" ? desc : asc;
    out.push(dir(spec.fields[spec.tiebreak]!.column));
  }

  return out;
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface PaginationOptions {
  /** Pass the matching row count to clamp a page past the end back onto the last real page. */
  total?: number;
}

export function resolvePageSize(spec: TableSpec, requested: number): number {
  if (!Number.isFinite(requested)) return Math.min(DEFAULT_PAGE_SIZE, spec.maxPageSize);
  return Math.max(1, Math.min(Math.trunc(requested), spec.maxPageSize, MAX_PAGE_SIZE));
}

/** Re-exported so a route needs one import to page a table, not two. */
export { pageMetaOf };

// ---------------------------------------------------------------------------
// The builder
// ---------------------------------------------------------------------------

export interface BuiltTableQuery {
  /** `undefined` when nothing is filtered — pass it straight to `.where()`, which accepts that. */
  where: SQL | undefined;
  orderBy: SQL[];
  limit: number;
  offset: number;
  /** After clamping. Echo this back to the client rather than what it asked for. */
  page: number;
  pageSize: number;
}

/**
 * Compiles a validated `TableQuery` against a table spec.
 *
 * Usage is two steps, because the row count is needed to clamp a page past the end:
 *
 * ```ts
 * const built = buildTableQuery(auditTableSpec, query);
 * const total = db.select({ n: count() }).from(auditLog).where(built.where).get()!.n;
 * const meta = pageMetaOf(total, built.page, built.pageSize);
 * const rows = db.select().from(auditLog)
 *   .where(built.where).orderBy(...built.orderBy)
 *   .limit(meta.pageSize).offset((meta.page - 1) * meta.pageSize).all();
 * ```
 *
 * Passing `{ total }` collapses that to one step when the count is already known.
 */
export function buildTableQuery(spec: TableSpec, query: TableQuery, options: PaginationOptions = {}): BuiltTableQuery {
  const search = searchToSql(spec, query.q);

  const conditions = query.filters.conditions.map((condition) => conditionToSql(spec, condition));
  const filterClause =
    conditions.length === 0
      ? undefined
      : query.filters.combinator === "or"
        ? or(...conditions)
        : and(...conditions);

  /* Search always narrows. It is AND'ed with the filter set even when that set is OR — otherwise
     typing into the search box on an OR filter would *widen* the result, which is the opposite of
     what a search box means. */
  const where = search && filterClause ? and(search, filterClause) : (search ?? filterClause);

  const orderBy = sortToSql(spec, query.sort.length ? query.sort : spec.defaultSort);

  const pageSize = resolvePageSize(spec, query.pageSize);
  const page =
    options.total === undefined
      ? Math.max(1, Math.trunc(query.page) || 1)
      : pageMetaOf(options.total, query.page, pageSize).page;

  return { where, orderBy, limit: pageSize, offset: (page - 1) * pageSize, page, pageSize };
}
