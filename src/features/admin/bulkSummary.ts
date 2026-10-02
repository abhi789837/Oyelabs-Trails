import type { BulkUserResult } from "@shared/admin";

export interface BulkSummary {
  tone: "success" | "info" | "error";
  message: string;
  /** "Skipped: Ana Lopez (That is your own account); …". Absent when nothing was skipped. */
  description?: string;
}

/**
 * One toast for a bulk run: how many worked, and every person skipped with the server's reason.
 *
 * `names` maps ids to display names; an id the client no longer knows (deleted meanwhile) falls back
 * to the id itself rather than vanishing from the list.
 */
export function summariseBulk(
  results: readonly BulkUserResult[],
  names: ReadonlyMap<string, string>,
  verb: string,
  noun: { one: string; many: string } = { one: "person", many: "people" },
): BulkSummary {
  const done = results.filter((r) => r.ok).length;
  const skipped = results.filter((r) => !r.ok);
  const count = (n: number) => `${n} ${n === 1 ? noun.one : noun.many}`;
  const description = skipped.length
    ? `Skipped: ${skipped.map((r) => `${names.get(r.id) ?? r.id} (${r.error ?? "Not changed"})`).join("; ")}`
    : undefined;

  if (results.length === 0) return { tone: "info", message: "Nothing to do." };
  if (skipped.length === 0) return { tone: "success", message: `${verb} ${count(done)}.` };
  if (done === 0) return { tone: "error", message: `Nothing changed. ${count(skipped.length)} skipped.`, description };
  return { tone: "info", message: `${verb} ${done} of ${results.length}.`, description };
}

/** The exact phrase the server wants before a bulk delete: `delete 3`. */
export function bulkDeletePhrase(count: number): string {
  return `delete ${count}`;
}
