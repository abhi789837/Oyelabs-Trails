import type { LearnerTask } from "@shared/tasks";

/**
 * Pure helpers for the simulated screens: reading a status out of free text and finding the
 * column that plays a part (time, status) so each app's layout can be built from `columns`.
 */

type Sim = Extract<LearnerTask, { kind: "sim" }>;
export type SimApp = Sim["app"];

export type StatusTone = "ok" | "bad" | "pending" | null;

/** "Passed", "Approved", "✓" → ok; "Failed", "Changes requested", "✗" → bad; "Pending", "Running" → pending. */
export function statusTone(text: string): StatusTone {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  if (/^(✗|✕|x)$|fail|error|changes requested|rejected|declined|blocked|red\b/.test(t)) return "bad";
  if (/^(✓|✔)$|pass|success|approved|merged|\bok\b|done|green\b|complete/.test(t)) return "ok";
  if (/pending|running|queued|waiting|in progress|awaiting|review requested|amber\b/.test(t)) return "pending";
  return null;
}

/** Index of the first column whose name matches, or -1. */
export function columnIndex(columns: readonly string[], pattern: RegExp): number {
  return columns.findIndex((c) => pattern.test(c));
}

/** "feature/login → main", "feature/login into main", "feature/login -> main" → the two branches. */
export function branchesOf(title: string): { head: string; base: string } | null {
  const m = /([\w./-]+)\s*(?:→|->|into)\s*([\w./-]+)/.exec(title);
  return m ? { head: m[1], base: m[2] } : null;
}

/** Distinct first-column values in order: a meeting's participants from its chat lines. */
export function participantsOf(rows: readonly { cells: string[] }[]): string[] {
  return [...new Set(rows.map((r) => (r.cells[0] ?? "").trim()).filter(Boolean))];
}

/** "Ann Lee" → "AL"; "bo" → "B". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0]?.[0] ?? "?")).toUpperCase();
}

export const SIM_APP_LABELS: Record<SimApp, string> = {
  "keka-timesheets": "Timesheets · Approvals",
  "keka-psa": "Projects · Resource allocation",
  teams: "Meeting",
  "github-pr": "Pull request",
  outlook: "Inbox",
  generic: "Screen",
};

/** What the per-row checkbox says on each screen. */
export const SIM_FLAG_LABELS: Record<SimApp, string> = {
  "keka-timesheets": "Flag — don't approve",
  "keka-psa": "Flag",
  teams: "Flag",
  "github-pr": "Flag",
  outlook: "Flag",
  generic: "Flag",
};
