import { lengthBucket, type LengthBucket, type LibraryItem, type LibraryLevel } from "@shared/me";

/**
 * Library search and filters, pure so they're tested on their own (libraryLogic.test.ts) and run
 * instantly on every keystroke: the whole catalogue is already on the page.
 */

export interface LibraryFilters {
  query: string;
  department: string | "all";
  skill: string | "all";
  level: LibraryLevel | "all";
  length: LengthBucket | "all";
  format: "video" | "reading" | "all";
}

export const EMPTY_FILTERS: LibraryFilters = { query: "", department: "all", skill: "all", level: "all", length: "all", format: "all" };

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

/**
 * How well an item matches a query; 0 means no match. Every word must match somewhere. A word in
 * the title counts most (more at the start of the title or a word), then skills, then outcomes,
 * then the summary.
 */
export function matchScore(item: LibraryItem, query: string): number {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return 1;
  const title = norm(item.title);
  const skills = norm(item.skills.map((s) => s.name).join(" "));
  const outcomes = norm(item.outcomes.join(" "));
  const summary = norm(item.summary);
  let total = 0;
  for (const w of words) {
    let best = 0;
    if (title.startsWith(w)) best = 10;
    else if (new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(title)) best = 8;
    else if (title.includes(w)) best = 6;
    else if (skills.includes(w)) best = 5;
    else if (outcomes.includes(w)) best = 3;
    else if (summary.includes(w)) best = 1;
    if (best === 0) return 0;
    total += best;
  }
  return total;
}

export function passesFilters(item: LibraryItem, f: LibraryFilters): boolean {
  if (f.department !== "all" && item.department?.id !== f.department) return false;
  if (f.skill !== "all" && !item.skills.some((s) => s.id === f.skill)) return false;
  if (f.level !== "all" && item.level !== f.level) return false;
  if (f.length !== "all" && lengthBucket(item.minutes) !== f.length) return false;
  if (f.format !== "all" && item.format !== f.format) return false;
  return true;
}

/** Filters, then ranks: search score, then "Recommended for you", then started ones, then title. */
export function searchLibrary(items: readonly LibraryItem[], f: LibraryFilters): LibraryItem[] {
  const scored = items
    .filter((item) => passesFilters(item, f))
    .map((item) => ({ item, score: matchScore(item, f.query) }))
    .filter((x) => x.score > 0);
  return scored
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(b.item.recommended) - Number(a.item.recommended) ||
        Number(b.item.doneCount > 0 && b.item.doneCount < b.item.lessonCount) - Number(a.item.doneCount > 0 && a.item.doneCount < a.item.lessonCount) ||
        a.item.title.localeCompare(b.item.title),
    )
    .map((x) => x.item);
}

/** Every skill used by the catalogue, for the skill filter. */
export function skillOptions(items: readonly LibraryItem[]): { id: string; name: string }[] {
  const map = new Map<string, string>();
  for (const item of items) for (const s of item.skills) if (!map.has(s.id)) map.set(s.id, s.name);
  return [...map].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
}

export const LEVEL_LABELS: Record<LibraryLevel, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced", expert: "Super advanced" };
export const LENGTH_LABELS: Record<LengthBucket, string> = { short: "Under 1.5 hours", medium: "1.5 to 6 hours", long: "Over 6 hours" };
export const FORMAT_LABELS = { video: "Mostly video", reading: "Mostly reading", mixed: "Video and reading" } as const;

export function activeFilterCount(f: LibraryFilters): number {
  return (["department", "skill", "level", "length", "format"] as const).filter((k) => f[k] !== "all").length;
}
