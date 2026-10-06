/**
 * Two-key shortcuts ("g i" for the inbox) and single keys ("?" for help), Linear-style.
 *
 * Pure: `feed` takes one key press and the time, and returns the binding it completes (or null).
 * The shell wires it to `keydown`; the tests feed it directly.
 */

export interface Shortcut {
  /** "g i", "g p", "?" */
  keys: string;
  label: string;
}

export const ADMIN_SHORTCUTS: readonly Shortcut[] = [
  { keys: "g i", label: "Go to the inbox" },
  { keys: "g o", label: "Go to the overview" },
  { keys: "g p", label: "Go to people" },
  { keys: "g n", label: "Onboard someone" },
  { keys: "g l", label: "Go to the library" },
  { keys: "g r", label: "Go to reports" },
  { keys: "?", label: "Show keyboard shortcuts" },
];

/** How long after "g" the second key still counts (ms). */
export const SEQUENCE_MS = 1200;

export interface KeySequence {
  feed(key: string, at: number): string | null;
  reset(): void;
}

export function createKeySequence(bindings: readonly string[], timeoutMs = SEQUENCE_MS): KeySequence {
  const set = new Set(bindings);
  let first: { key: string; at: number } | null = null;
  return {
    feed(rawKey, at) {
      const key = rawKey.length === 1 ? rawKey.toLowerCase() : rawKey;
      if (rawKey === "?") {
        first = null;
        return set.has("?") ? "?" : null;
      }
      if (first && at - first.at <= timeoutMs) {
        const combo = `${first.key} ${key}`;
        first = null;
        if (set.has(combo)) return combo;
      }
      first = null;
      if ([...set].some((b) => b.startsWith(`${key} `))) {
        first = { key, at };
        return null;
      }
      return set.has(key) ? key : null;
    },
    reset() {
      first = null;
    },
  };
}

/** Typing in a field, or holding a modifier, is never a shortcut. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as HTMLElement).tagName !== "string") return false;
  const el = target as HTMLElement;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable === true || el.getAttribute?.("role") === "textbox";
}
