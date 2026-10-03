import { bulkRowErrors, dedupeUsernames, parseBulkRows, toCsv, type BulkOnboardResult, type DepartmentRef } from "@shared/bulkOnboard";
import type { OnboardSuggestion } from "@shared/goals";

import { signInUrl } from "../invite";
import { toSaveRequest, type SetupState } from "./helpers";
import { stateFromSuggestion } from "./suggestion";

/**
 * Bulk onboarding's review table, as pure state (v4.3 P6): rows from the paste, Suggest answers
 * folded in, per-row errors, the create request and its results. The component only renders this.
 */

export interface BulkRow {
  key: string;
  line: number;
  name: string;
  username: string;
  usernameAuto: boolean;
  departmentId: string | null;
  departmentInput: string;
  description: string;
  /** The suggested (then edited) setup; null until Suggest answered. */
  state: SetupState | null;
  status: "new" | "suggesting" | "suggested" | "suggest-failed" | "created" | "failed";
  /** Suggest's or the server's error for the row. */
  message?: string;
  /** The field a server error is about, so the table highlights it. */
  errorField?: string;
  /** Set once created: shown once. */
  password?: string;
  userId?: string;
  /** The account exists but the assessment was not issued. */
  issueError?: string;
}

let counter = 0;
const rowKey = () => `bulk-${(counter += 1)}`;

export function rowsFromText(text: string, departments: readonly DepartmentRef[], defaultDepartmentId: string, taken: ReadonlySet<string>): BulkRow[] {
  return dedupeUsernames(parseBulkRows(text, departments, defaultDepartmentId), taken).map((r) => ({ ...r, key: rowKey(), state: null, status: "new" as const }));
}

/** Folds one Suggest answer (or its failure) into a row. */
export function withSuggestion(row: BulkRow, answer: { suggestion?: OnboardSuggestion; error?: string }): BulkRow {
  if (!answer.suggestion) return { ...row, state: null, status: "suggest-failed", message: answer.error ?? "Suggest did not answer for this row." };
  return { ...row, state: stateFromSuggestion(answer.suggestion, row.description, row.departmentId ?? answer.suggestion.departmentId), status: "suggested", message: undefined };
}

/** Field errors per row (created rows have none: they are done). Server errors are kept on their field. */
export function rowErrors(rows: readonly BulkRow[], taken: ReadonlySet<string>): Record<string, string>[] {
  const open = rows.filter((r) => r.status !== "created");
  const errs = bulkRowErrors(open, taken);
  let i = 0;
  return rows.map((r) => {
    if (r.status === "created") return {};
    const e = { ...errs[i++]! };
    if (r.status === "failed" && r.message && r.errorField && !e[r.errorField]) e[r.errorField] = r.message;
    return e;
  });
}

/** The rows "Create & assign all" sends: suggested, error-free and not created yet. */
export function readyRows(rows: readonly BulkRow[], errors: readonly Record<string, string>[]): BulkRow[] {
  return rows.filter((r, i) => r.state !== null && r.status !== "created" && r.status !== "suggesting" && Object.keys(errors[i] ?? {}).length === 0);
}

export function toBulkRequest(rows: readonly BulkRow[]) {
  return {
    rows: rows.map((r) => {
      const { assign: _assign, ...setup } = toSaveRequest({ ...r.state!, description: r.description }, true);
      return { username: r.username, displayName: r.name.trim(), setup };
    }),
  };
}

/** Results come back by index into the sent rows. */
export function applyResults(rows: readonly BulkRow[], sent: readonly BulkRow[], results: readonly BulkOnboardResult[]): BulkRow[] {
  const byKey = new Map<string, BulkOnboardResult>();
  for (const r of results) {
    const row = sent[r.index];
    if (row) byKey.set(row.key, r);
  }
  return rows.map((row) => {
    const r = byKey.get(row.key);
    if (!r) return row;
    if (r.ok) return { ...row, status: "created", password: r.temporaryPassword, userId: r.userId, issueError: r.issueError, message: undefined, errorField: undefined };
    return { ...row, status: "failed", message: r.error, errorField: r.field === "displayName" ? "name" : (r.field ?? "row") };
  });
}

/** "Copy all": the created rows' sign-in details as CSV, for a sheet or a message. */
export function credentialsCsv(rows: readonly BulkRow[], origin: string): string {
  const created = rows.filter((r) => r.status === "created" && r.password);
  return toCsv([["Name", "Username", "Temporary password", "Sign in"], ...created.map((r) => [r.name, r.username, r.password!, signInUrl(origin)])]);
}
