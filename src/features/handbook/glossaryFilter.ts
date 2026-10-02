import type { GlossaryTerm, ProjectType, TermCategory } from "@shared/handbook";

export interface GlossaryFilter {
  query: string;
  categories: TermCategory[];
  projectType: ProjectType | null;
}

export const EMPTY_FILTER: GlossaryFilter = { query: "", categories: [], projectType: null };

/** Search across name, aka and definition; every word must match somewhere. */
export function matchesTerm(term: GlossaryTerm, filter: GlossaryFilter): boolean {
  if (filter.categories.length && !filter.categories.includes(term.category)) return false;
  if (filter.projectType && !term.projectTypes.includes(filter.projectType)) return false;
  const q = filter.query.trim().toLowerCase();
  if (!q) return true;
  const haystack = `${term.name} ${term.aka.join(" ")} ${term.definition}`.toLowerCase();
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

/**
 * Name and aka matches first, then definition-only matches, so "CR" finds Change request at the
 * top rather than every definition that mentions a CR.
 */
export function filterTerms(terms: GlossaryTerm[], filter: GlossaryFilter): GlossaryTerm[] {
  const matches = terms.filter((t) => matchesTerm(t, filter));
  const q = filter.query.trim().toLowerCase();
  if (!q) return matches;
  const strong = (t: GlossaryTerm) => [t.name, ...t.aka].some((n) => n.toLowerCase().includes(q));
  return [...matches.filter(strong), ...matches.filter((t) => !strong(t))];
}

export interface LetterGroup {
  letter: string;
  terms: GlossaryTerm[];
}

/** A–Z groups by the name's first letter; digits and symbols go under "#". */
export function groupByLetter(terms: GlossaryTerm[]): LetterGroup[] {
  const groups = new Map<string, GlossaryTerm[]>();
  for (const term of [...terms].sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }))) {
    const first = term.name.trim().charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(first) ? first : "#";
    const list = groups.get(letter) ?? [];
    list.push(term);
    groups.set(letter, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)))
    .map(([letter, list]) => ({ letter, terms: list }));
}
