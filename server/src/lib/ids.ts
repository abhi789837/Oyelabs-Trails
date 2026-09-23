import { ulid } from "ulid";

/**
 * All primary keys are ULIDs: 26 characters, URL-safe, and lexicographically sortable by creation
 * time, so `ORDER BY id` is chronological and we never need a separate sequence column.
 */
export function newId(): string {
  return ulid();
}

/** Epoch milliseconds. The single source of "now" so tests can stub it in one place. */
export function now(): number {
  return Date.now();
}
