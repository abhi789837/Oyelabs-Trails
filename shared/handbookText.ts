/**
 * Handbook text helpers with no dependencies (no zod): term links in course text
 * (`[[term:change-request]]` or `[[term:change-request|CR]]`) and the fixed notes. Re-exported by
 * `./handbook`; imported directly by client code that ships in a learner route's first download.
 */

export const TERM_LINK_RE = /\[\[term:([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g;

export function termLinksIn(text: string): string[] {
  return [...text.matchAll(TERM_LINK_RE)].map((m) => m[1]);
}

/** Plain text with links replaced by their label or the term name (for search, AI prompts, PDFs). */
export function stripTermLinks(text: string, nameOf: (id: string) => string | undefined = () => undefined): string {
  return text.replace(TERM_LINK_RE, (_all, id: string, label?: string) => label ?? nameOf(id) ?? id.replace(/-/g, " "));
}

export const LEGAL_NOTE = "Not legal advice: the signed contract always wins.";
export const TYPICAL_NOTE = "Typical industry value — Oyelabs' own value may differ.";
export const CONFIRM_MARKER = "[Oyelabs SOP – admin to confirm]";
