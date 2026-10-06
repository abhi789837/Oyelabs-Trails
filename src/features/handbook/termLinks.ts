import { CONFIRM_MARKER, TERM_LINK_RE } from "@shared/handbookText";

/** A run of inline text: either plain text or a `[[term:id|label]]` link. */
export type TermSegment = { kind: "text"; text: string } | { kind: "term"; id: string; label?: string; raw: string };

/** Splits text on handbook term links. Pure, so it is tested without a DOM. */
export function splitTermLinks(text: string): TermSegment[] {
  const out: TermSegment[] = [];
  let last = 0;
  // A fresh regex per call: the shared one is global, and its `lastIndex` must never leak between calls.
  const re = new RegExp(TERM_LINK_RE.source, "g");
  for (const m of text.matchAll(re)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ kind: "text", text: text.slice(last, at) });
    const label = m[2]?.trim();
    out.push({ kind: "term", id: m[1], raw: m[0], ...(label ? { label } : {}) });
    last = at + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}

/** Whether a text still holds the admin-to-confirm placeholder rather than Oyelabs' own meaning. */
export function isPlaceholder(meaning: string): boolean {
  return meaning.trimStart().startsWith(CONFIRM_MARKER);
}

/** The placeholder's own words, without the marker ("Our warranty window and what it covers."). */
export function withoutMarker(meaning: string): string {
  return meaning.replace(CONFIRM_MARKER, "").trim();
}

/** "change-request" → "change request": the fallback name for a term that is not in the glossary. */
export function humaniseId(id: string): string {
  return id.replace(/-/g, " ");
}
