import type { CommandEntryKind } from "./commandIndex";

/**
 * What the palette offers before a single character is typed.
 *
 * Per user, because this machine is shared in the office and one person's recent waypoints are a
 * small leak of what they are being taught. Keyed by user id rather than username so a rename
 * cannot hand someone else's list to the wrong account.
 */
export interface RecentEntry {
  id: string;
  kind: CommandEntryKind;
  title: string;
  context: string;
  href: string;
}

export const RECENTS_LIMIT = 5;

export function recentsKey(userId: string): string {
  return `oyelearn:palette-recents:${userId}`;
}

/** Newest first, de-duplicated by id, capped. Pure, so the ordering rule is testable. */
export function pushRecent(list: RecentEntry[], entry: RecentEntry, limit = RECENTS_LIMIT): RecentEntry[] {
  return [entry, ...list.filter((item) => item.id !== entry.id)].slice(0, limit);
}

function isRecentEntry(value: unknown): value is RecentEntry {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.kind === "string" &&
    typeof item.title === "string" &&
    typeof item.context === "string" &&
    typeof item.href === "string"
  );
}

/** Tolerant of anything: a half-written key, an old shape, or storage being unavailable. */
export function parseRecents(raw: string | null): RecentEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecentEntry).slice(0, RECENTS_LIMIT);
  } catch {
    return [];
  }
}

export function readRecents(userId: string): RecentEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return parseRecents(localStorage.getItem(recentsKey(userId)));
  } catch {
    // Private mode, or storage disabled by policy. Recents are a convenience, never a requirement.
    return [];
  }
}

export function writeRecents(userId: string, list: RecentEntry[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(recentsKey(userId), JSON.stringify(list));
  } catch {
    /* Quota or policy. Nothing here is worth failing an interaction over. */
  }
}
