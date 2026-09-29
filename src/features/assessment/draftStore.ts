/**
 * What the learner has typed, kept across a refresh.
 *
 * A code question is five to ten minutes of work in a box. Losing it to an accidental refresh, a
 * dropped connection or a browser that decided to reload the tab is not a proctoring concern or an
 * integrity concern — it is just cruel, and it is the kind of thing that makes somebody's measured
 * level lower than their real one.
 *
 * Per item, not per assessment, so re-serving the item after a reload restores exactly what was in
 * the box and nothing else. Cleared as soon as the answer is accepted, because a draft that outlives
 * its question is a stale answer waiting to reappear in the wrong place.
 *
 * `sessionStorage`, not `localStorage`: a draft should not outlive the tab. It survives the refresh
 * it exists for and nothing longer, and it is never sent anywhere — the server already has the
 * answer once it is submitted.
 *
 * Every access is wrapped. Storage throws in a private window, with site data blocked, and when a
 * quota is full, and an assessment that cannot start because a *draft* could not be written would
 * be a far worse bug than the one this prevents.
 */

const PREFIX = "oyelearn.draft.";

export interface ItemDraft {
  code?: string;
  text?: string;
  selected?: number[];
  /** When it was last written, so a draft from an abandoned sitting can be recognised and ignored. */
  at: number;
}

/** Drafts older than this are ignored. Longer than any single question, shorter than a sitting. */
const MAX_AGE_MS = 60 * 60_000;

export function readDraft(itemId: string): ItemDraft | null {
  try {
    const raw = window.sessionStorage.getItem(PREFIX + itemId);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ItemDraft;
    if (typeof parsed?.at !== "number" || Date.now() - parsed.at > MAX_AGE_MS) {
      clearDraft(itemId);
      return null;
    }
    return parsed;
  } catch {
    // Unreadable, unparseable, or storage is blocked. There is simply no draft.
    return null;
  }
}

export function writeDraft(itemId: string, draft: Omit<ItemDraft, "at">): void {
  try {
    /* An empty draft is not written, and an existing one is removed. Otherwise clearing the box and
       refreshing would restore what was cleared, which is the opposite of what anybody expects. */
    const empty =
      (draft.code ?? "").trim() === "" && (draft.text ?? "").trim() === "" && (draft.selected ?? []).length === 0;
    if (empty) {
      clearDraft(itemId);
      return;
    }
    window.sessionStorage.setItem(PREFIX + itemId, JSON.stringify({ ...draft, at: Date.now() }));
  } catch {
    // Quota, private mode, blocked site data. The work is still on screen; it just will not survive.
  }
}

export function clearDraft(itemId: string): void {
  try {
    window.sessionStorage.removeItem(PREFIX + itemId);
  } catch {
    // Nothing to do, and nothing worth telling anybody about.
  }
}

/**
 * Removes every draft from this sitting.
 *
 * Called when an assessment ends. A learner who takes a second assessment in the same tab should
 * not find the first one's drafts, and the per-item keys make that impossible to do by expiry alone.
 */
export function clearAllDrafts(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      if (key?.startsWith(PREFIX)) keys.push(key);
    }
    for (const key of keys) window.sessionStorage.removeItem(key);
  } catch {
    // As above.
  }
}
