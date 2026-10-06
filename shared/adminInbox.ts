/**
 * v5 Phase 7: the admin home, "Needs your attention" (docs/v5/PLAN.md, `/admin`).
 *
 * The server (`server/src/v5/admin/inbox.ts`) reads the existing tables and builds one item per
 * thing a person should look at; this module holds the shapes, the stuck rule and the grouping,
 * all pure so they are tested without a database.
 *
 * Every item carries one primary action. Actions reuse existing endpoints (approve a test, decide a
 * review, fix a course); the few that are new (send a reminder, mark as checked) live with the
 * inbox route. Copy here is admin copy: plain words only (docs/v4.4/COPY_GUIDE.md).
 */

/** A learner with a plan and nothing done for this many days is "stuck". */
export const STUCK_DAYS = 7;
/** Items shown per group; the group still reports its full count. */
export const INBOX_GROUP_LIMIT = 5;
/** How long a reversible action waits for Undo before it is sent (ms). */
export const UNDO_MS = 6000;
/** A "mark as checked" on a stuck learner lasts this long, then they can come back. */
export const DISMISS_DAYS = 7;

const DAY_MS = 86_400_000;

export const INBOX_GROUPS = ["tests", "reviews", "courses", "problems", "stuck", "integrity", "setup"] as const;
export type InboxGroupId = (typeof INBOX_GROUPS)[number];

export const INBOX_GROUP_LABELS: Record<InboxGroupId, string> = {
  tests: "Tests ready to send",
  reviews: "Asked to check an answer again",
  courses: "Courses waiting for a look",
  problems: "Problems learners reported",
  stuck: "Learners who are stuck",
  integrity: "Test warnings to check",
  setup: "Setup to finish",
};

/** What the one primary button does. Each maps to one API call or one link. */
export type InboxAction =
  | { kind: "approve-test"; label: string; assessmentId: string }
  | { kind: "send-test"; label: string; userId: string }
  | { kind: "full-marks"; label: string; reviewId: string }
  | { kind: "fix-course"; label: string; courseId: string }
  | { kind: "publish-course"; label: string; courseId: string }
  | { kind: "resolve-problem"; label: string; problemId: string }
  | { kind: "nudge"; label: string; userId: string }
  | { kind: "dismiss"; label: string; key: string }
  | { kind: "open"; label: string; href: string };

export interface InboxItem {
  /** Unique across the inbox: `<group>:<source id>`. */
  id: string;
  group: InboxGroupId;
  /** One line: who or what, and what is wrong. */
  title: string;
  /** One more short line: why it's here, or what happens next. */
  detail: string;
  /** When it started waiting (ms), for ordering and "3 days ago". Null for setup issues. */
  at: number | null;
  userId?: string;
  /** Where "Open" goes, when the item has a page. */
  href?: string;
  action: InboxAction;
  /** A quieter second choice ("Open", "Mark as checked"). */
  secondary?: InboxAction;
}

export interface InboxGroup {
  id: InboxGroupId;
  label: string;
  /** Everything waiting in this group, not only the items returned. */
  total: number;
  items: InboxItem[];
}

export interface InboxResponse {
  groups: InboxGroup[];
  /** Sum of every group's total. */
  total: number;
  generatedAt: number;
}

/**
 * Groups items in the fixed order, oldest first inside a group (it has waited longest), capped at
 * `limit`. `totals` overrides a group's count when the server only read the first few rows.
 * Empty groups are dropped, so an empty inbox is `[]`.
 */
export function groupInbox(items: readonly InboxItem[], totals: Partial<Record<InboxGroupId, number>> = {}, limit = INBOX_GROUP_LIMIT): InboxGroup[] {
  const groups: InboxGroup[] = [];
  for (const id of INBOX_GROUPS) {
    const mine = items.filter((item) => item.group === id).sort((a, b) => (a.at ?? 0) - (b.at ?? 0) || a.id.localeCompare(b.id));
    const total = Math.max(totals[id] ?? 0, mine.length);
    if (total === 0) continue;
    groups.push({ id, label: INBOX_GROUP_LABELS[id], total, items: mine.slice(0, limit) });
  }
  return groups;
}

export function inboxTotal(groups: readonly InboxGroup[]): number {
  return groups.reduce((sum, g) => sum + g.total, 0);
}

/** Removes one item from the grouped list (optimistic removal), keeping the counts right. */
export function withoutItem(groups: readonly InboxGroup[], itemId: string): InboxGroup[] {
  const out: InboxGroup[] = [];
  for (const g of groups) {
    const items = g.items.filter((i) => i.id !== itemId);
    const total = items.length === g.items.length ? g.total : g.total - 1;
    if (total > 0) out.push({ ...g, items, total });
  }
  return out;
}

/**
 * Whether the action can be taken back. Reversible actions are sent after the Undo window; the
 * others (a decision, a publish) are sent at once and have no Undo.
 */
export function isReversible(action: InboxAction): boolean {
  return action.kind === "dismiss" || action.kind === "resolve-problem" || action.kind === "nudge";
}

// ---------------------------------------------------------------------------
// Stuck learners
// ---------------------------------------------------------------------------

export interface StuckFacts {
  role: string;
  status: string;
  /** They have a plan with lessons in it. */
  hasPlan: boolean;
  /** Every lesson in the plan is done. */
  planDone: boolean;
  /** When the plan reached them (ms). */
  planStartedAt: number | null;
  /** Their latest learning activity of any kind (ms), or null if none yet. */
  lastActivityAt: number | null;
}

/**
 * The stuck rule: an active learner with an unfinished plan and no learning activity for
 * `STUCK_DAYS` days. Someone who never started counts from the day the plan reached them, so a
 * plan sent yesterday is not "stuck" yet.
 */
export function isStuck(facts: StuckFacts, now: number, days = STUCK_DAYS): boolean {
  if (facts.role !== "learner" || facts.status !== "active") return false;
  if (!facts.hasPlan || facts.planDone) return false;
  const since = facts.lastActivityAt ?? facts.planStartedAt;
  if (since === null) return false;
  return now - since >= days * DAY_MS;
}

/** Whole days since `ts` (0 for today or the future). */
export function daysSince(ts: number, now: number): number {
  return Math.max(0, Math.floor((now - ts) / DAY_MS));
}

/** "today", "yesterday", "3 days ago". */
export function agoLabel(ts: number | null, now: number): string {
  if (ts === null) return "";
  const d = daysSince(ts, now);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d} days ago`;
}

// ---------------------------------------------------------------------------
// "Mark as checked"
// ---------------------------------------------------------------------------

/** Stored in app_meta under `INBOX_DISMISSED_META_KEY` as `{ [key]: dismissedAtMs }`. */
export const INBOX_DISMISSED_META_KEY = "v5.inbox.dismissed";

export function dismissKey(group: InboxGroupId, sourceId: string): string {
  return `${group}:${sourceId}`;
}

/**
 * A dismissed stuck learner returns after `DISMISS_DAYS`, in case they are still stuck; a checked
 * test warning stays checked.
 */
export function isDismissed(dismissed: Readonly<Record<string, number>>, key: string, now: number): boolean {
  const at = dismissed[key];
  if (typeof at !== "number") return false;
  if (key.startsWith("stuck:")) return now - at < DISMISS_DAYS * DAY_MS;
  return true;
}

/** Drops entries that no longer matter, so the stored map can't grow without end. */
export function pruneDismissed(dismissed: Readonly<Record<string, number>>, now: number, keepDays = 90): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, at] of Object.entries(dismissed)) {
    if (typeof at === "number" && now - at < keepDays * DAY_MS) out[key] = at;
  }
  return out;
}
