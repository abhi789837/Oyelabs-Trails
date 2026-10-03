import { z } from "zod";

import { displayNameSchema, usernameSchema } from "./auth";
import { setupSchema } from "./setup";

/**
 * v4.3 Phase 6: bulk onboarding. The admin pastes rows from a sheet or types them, one person per
 * line: `name, username, department, one-line description`. Comma or tab separated; quotes, a
 * header row and blank lines are tolerated; the username is optional (made from the name) and the
 * department can be its id, its name or something close to either.
 *
 * Pure, so the paste preview and its tests agree.
 */

export const MAX_BULK_ROWS = 50;

export interface DepartmentRef {
  id: string;
  name: string;
}

export interface ParsedBulkRow {
  /** 1-based line in the pasted text, for error messages. */
  line: number;
  name: string;
  /** As typed; empty when it is to be made from the name. */
  username: string;
  usernameAuto: boolean;
  /** Resolved department id, or null when what was typed matched none. */
  departmentId: string | null;
  departmentInput: string;
  description: string;
}

/** "Priya Sharma" → "priya.sharma". Accents dropped; anything else becomes a dot. */
export function usernameFrom(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 32);
}

/** Splits one line on `delimiter`, honouring double quotes ("a, b" stays one field; "" is a quote). */
export function splitFields(line: string, delimiter: "," | "\t"): string[] {
  const out: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"' && field.trim() === "") {
      quoted = true;
      field = "";
    } else if (ch === delimiter) {
      out.push(field.trim());
      field = "";
    } else field += ch;
  }
  out.push(field.trim());
  return out;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
const initials = (s: string) =>
  s
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0]!.toLowerCase())
    .join("");

/**
 * The department a typed value means: id or name exactly, then initials ("PM", "BD"), then a prefix
 * either way ("eng", "Project mgmt" → no; "Project" → yes). Ambiguous prefixes resolve to nothing.
 */
export function matchDepartment(input: string, departments: readonly DepartmentRef[]): string | null {
  const x = norm(input);
  if (!x) return null;
  const exact = departments.find((d) => norm(d.id) === x || norm(d.name) === x);
  if (exact) return exact.id;
  const byInitials = x.length >= 2 ? departments.filter((d) => initials(d.name) === x) : [];
  if (byInitials.length === 1) return byInitials[0]!.id;
  const prefix = departments.filter((d) => x.length >= 2 && (norm(d.name).startsWith(x) || norm(d.id).startsWith(x) || x.startsWith(norm(d.name))));
  if (prefix.length === 1) return prefix[0]!.id;
  return null;
}

const HEADER = /^(full\s*)?name$/i;

/**
 * Reads pasted text into rows. Field layouts, by count:
 * - 4 or more: name, username, department, description (anything after the 4th field is part of
 *   the description, so an unquoted comma in it is fine). If the 2nd field is a department and the
 *   3rd is not, the username was left out: name, department, description….
 * - 3: name, department, description when the 2nd is a department; otherwise name, username,
 *   description (department: the default).
 * - 2: name, description. 1: just a name.
 */
export function parseBulkRows(text: string, departments: readonly DepartmentRef[], defaultDepartmentId: string): ParsedBulkRow[] {
  const rows: ParsedBulkRow[] = [];
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  lines.forEach((raw, index) => {
    if (!raw.trim()) return;
    const delimiter = raw.includes("\t") ? "\t" : ",";
    const f = splitFields(raw, delimiter);
    if (rows.length === 0 && HEADER.test(f[0] ?? "")) return;

    const dept = (s: string | undefined) => (s ? matchDepartment(s, departments) : null);
    let name = f[0] ?? "";
    let username = "";
    let departmentInput = "";
    let description = "";
    if (f.length >= 4) {
      if (dept(f[1]) && !dept(f[2])) {
        departmentInput = f[1]!;
        description = f.slice(2).join(delimiter === "," ? ", " : " ");
      } else {
        username = f[1]!;
        departmentInput = f[2]!;
        description = f.slice(3).join(delimiter === "," ? ", " : " ");
      }
    } else if (f.length === 3) {
      if (dept(f[1])) {
        departmentInput = f[1]!;
      } else {
        username = f[1]!;
      }
      description = f[2]!;
    } else if (f.length === 2) {
      description = f[1]!;
    }
    name = name.trim();
    username = username.trim().toLowerCase();
    const usernameAuto = username === "";
    rows.push({
      line: index + 1,
      name,
      username: usernameAuto ? usernameFrom(name) : username,
      usernameAuto,
      departmentId: departmentInput ? dept(departmentInput) : defaultDepartmentId,
      departmentInput,
      description: description.trim().replace(/\s+/g, " ").slice(0, 600),
    });
  });
  return rows;
}

/**
 * Makes auto usernames unique (against the roster and the other rows) by adding `.2`, `.3`…; a
 * typed username is never changed — a clash there is the admin's to fix and is reported instead.
 */
export function dedupeUsernames<T extends { username: string; usernameAuto: boolean }>(rows: readonly T[], taken: ReadonlySet<string>): T[] {
  const used = new Set(taken);
  for (const r of rows) if (!r.usernameAuto) used.add(r.username);
  return rows.map((r) => {
    if (!r.usernameAuto || !r.username) return r;
    let candidate = r.username;
    for (let n = 2; used.has(candidate); n += 1) candidate = `${r.username.slice(0, 36)}.${n}`;
    used.add(candidate);
    return { ...r, username: candidate };
  });
}

/** Per-row problems, keyed by field, for the review table. Empty object = ready to create. */
export function bulkRowErrors(
  rows: readonly { name: string; username: string; departmentId: string | null; description: string; departmentInput?: string }[],
  taken: ReadonlySet<string>,
): Record<string, string>[] {
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.username, (counts.get(r.username) ?? 0) + 1);
  return rows.map((r) => {
    const errors: Record<string, string> = {};
    if (!displayNameSchema.safeParse(r.name).success) errors.name = "Name is required.";
    const u = usernameSchema.safeParse(r.username);
    if (!u.success) errors.username = u.error.issues[0]?.message ?? "Not a valid username.";
    else if (taken.has(r.username)) errors.username = "Already taken.";
    else if ((counts.get(r.username) ?? 0) > 1) errors.username = "Used twice in this list.";
    if (!r.departmentId) errors.department = r.departmentInput ? `No department called "${r.departmentInput}".` : "Pick a department.";
    if (r.description.trim().length < 3) errors.description = "Add a one-line description.";
    return errors;
  });
}

/** Turns rows into a CSV the admin can paste into a sheet: values quoted when they need it. */
export function toCsv(rows: readonly (readonly string[])[]): string {
  const cell = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return rows.map((r) => r.map(cell).join(",")).join("\n");
}

// ---------------------------------------------------------------------------
// The request: one create + setup save + assign per row
// ---------------------------------------------------------------------------

export const bulkOnboardRowSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema,
  /** The setup to save (goals, track, level, hours…). Always assigned after saving. */
  setup: setupSchema,
});

export const bulkOnboardRequestSchema = z.object({
  rows: z.array(bulkOnboardRowSchema).min(1).max(MAX_BULK_ROWS),
});
export type BulkOnboardRequest = z.input<typeof bulkOnboardRequestSchema>;

export interface BulkOnboardResult {
  /** Index into the request's rows. */
  index: number;
  ok: boolean;
  userId?: string;
  username: string;
  displayName: string;
  /** Shown once. */
  temporaryPassword?: string;
  /** The assessment that was issued, or why none was. */
  issued?: { assessmentId: string; status?: "generating" | "ready"; notice?: string } | null;
  issueError?: string;
  error?: string;
  /** The field the error is about, e.g. `username`. */
  field?: string;
}
