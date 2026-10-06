/**
 * The admin palette's own matching (cmdk's fuzzy score lets "Tutor answers" — keyword "helpful" —
 * beat "Rahul Verma" for "rahul"). Plain and predictable instead: every word typed must start a
 * word of the item's label, hint or keywords. Items whose label starts with the query come first,
 * and when something is typed, people come before pages, because a name is the usual search.
 */

export interface PaletteEntry {
  label: string;
  hint?: string;
  keywords?: string[];
}

export interface PaletteGroup<T extends PaletteEntry> {
  heading: string;
  items: T[];
}

function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

export function matchScore(entry: PaletteEntry, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  const label = entry.label.toLowerCase();
  if (label.startsWith(q)) return 3;
  const haystack = [...words(entry.label), ...words(entry.hint ?? ""), ...(entry.keywords ?? []).flatMap(words)];
  const typed = words(q);
  if (typed.length && typed.every((t) => haystack.some((w) => w.startsWith(t)))) return words(entry.label).some((w) => w.startsWith(typed[0]!)) ? 2 : 1;
  return 0;
}

export function filterPalette<T extends PaletteEntry>(groups: readonly PaletteGroup<T>[], query: string, firstWhenSearching = "People"): PaletteGroup<T>[] {
  const q = query.trim();
  const out = groups
    .map((g) => ({
      heading: g.heading,
      items: g.items
        .map((item, i) => ({ item, i, score: matchScore(item, q) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score || a.i - b.i)
        .map((x) => x.item),
    }))
    .filter((g) => g.items.length > 0);
  if (!q) return out;
  return [...out.filter((g) => g.heading === firstWhenSearching), ...out.filter((g) => g.heading !== firstWhenSearching)];
}
