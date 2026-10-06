/**
 * Topic titles are written with Markdown code marks ("`let` & `const`: the Temporal Dead Zone").
 * v5 shows them as plain text in headings, trails, cards and labels (Phase 9.2), so the marks go.
 * Only paired backticks around a word or phrase are removed; anything else is left as written.
 */
export function plainTitle(title: string): string {
  return title.replace(/`([^`\n]+)`/g, "$1");
}
