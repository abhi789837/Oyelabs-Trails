import type { AccentTokenValue, ModuleMeta, TopicMeta, TrackMeta } from "@shared/content";

/**
 * The command palette's index and matcher.
 *
 * This is the part that has to stay fast. The curriculum is **715 topics**, and the palette
 * filters the whole set on every keystroke, so:
 *
 * - the index is built once per manifest and reused (`useMemo` on the tracks array identity);
 * - matching is a single lowercase pass over a pre-built haystack, with no regex compilation and
 *   no allocation per entry;
 * - and the results are **capped per group** before they reach React, which is what keeps the
 *   palette from mounting 715 rows and handing cmdk a list it would have to score itself.
 *
 * Kept free of React and of `@/content` so it can be tested directly — this repo's vitest runs in
 * Node with no DOM.
 */

export type CommandEntryKind = "topic" | "camp" | "trail" | "person" | "action";

export interface CommandEntry {
  /** Unique across kinds, and stable, so it can be stored as a recent item. */
  id: string;
  kind: CommandEntryKind;
  title: string;
  /** The second line: where this thing lives. */
  context: string;
  href: string;
  /** Lowercased, pre-joined search text. Built once. */
  haystack: string;
  /** Right-hand text on the row: a level, a status, a role. */
  meta?: string;
  accentToken?: AccentTokenValue;
  /** Present on topics, for the progress dot. */
  topicId?: string;
}

export interface CurriculumIndexOptions {
  /** Level labels, passed in so this module does not depend on the UI's copy. */
  levelLabel?: (level: string) => string;
  topicHref: (topic: Pick<TopicMeta, "id" | "moduleId" | "trackId">) => string;
  moduleHref: (module: Pick<ModuleMeta, "id" | "trackId">) => string;
}

/**
 * Trails, camps and topics, flattened.
 *
 * Unavailable modules — listed in the registry but not yet written — are skipped entirely, along
 * with their topics: a palette that offers a waypoint nobody can open is worse than one that does
 * not mention it.
 */
export function buildCurriculumIndex(tracks: TrackMeta[], options: CurriculumIndexOptions): CommandEntry[] {
  const { levelLabel, topicHref, moduleHref } = options;
  const entries: CommandEntry[] = [];

  for (const track of tracks) {
    entries.push({
      id: `trail:${track.id}`,
      kind: "trail",
      title: track.name,
      context: track.tagline,
      href: `/track/${track.id}`,
      haystack: `${track.name} ${track.tagline} ${track.id}`.toLowerCase(),
      accentToken: track.accentToken,
    });

    for (const module of track.modules) {
      if (!module.available) continue;
      entries.push({
        id: `camp:${module.id}`,
        kind: "camp",
        title: module.name,
        context: track.name,
        href: moduleHref(module),
        haystack: `${module.name} ${track.name} ${module.id}`.toLowerCase(),
        meta: `${module.topics.length} topics`,
        accentToken: track.accentToken,
      });

      for (const topic of module.topics) {
        entries.push({
          id: `topic:${topic.id}`,
          kind: "topic",
          title: topic.title,
          context: `${track.name} / ${module.name}`,
          href: topicHref(topic),
          haystack: `${topic.title} ${topic.id} ${module.name} ${track.name}`.toLowerCase(),
          meta: levelLabel ? levelLabel(topic.level) : undefined,
          accentToken: track.accentToken,
          topicId: topic.id,
        });
      }
    }
  }

  return entries;
}

/** A tiebreaker only: with equal relevance, the bigger thing wins. */
const KIND_WEIGHT: Record<CommandEntryKind, number> = {
  action: 5,
  trail: 4,
  camp: 3,
  person: 2,
  topic: 1,
};

/**
 * How well one entry answers one query. 0 means "do not show".
 *
 * Scored rather than merely filtered because "react" should put the React camp above the forty
 * topics that mention React in passing, and a topic id typed in full should win outright.
 */
export function scoreEntry(entry: CommandEntry, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  const words = q.split(/\s+/);
  for (const word of words) {
    if (!entry.haystack.includes(word)) return 0;
  }

  const title = entry.title.toLowerCase();
  let score = 100;

  if (entry.topicId && entry.topicId.toLowerCase() === q) score = 1000;
  else if (title === q) score = 900;
  else if (title.startsWith(q)) score = 600;
  else if (startsAWord(title, q)) score = 400;
  else if (title.includes(q)) score = 250;

  // Shorter titles that match are usually the more specific answer ("Closures" over
  // "setTimeout + closures interview question").
  return score * 10 + KIND_WEIGHT[entry.kind] - Math.min(title.length, 60) / 100;
}

function startsAWord(haystack: string, query: string): boolean {
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(query, from);
    if (at < 0) return false;
    if (at === 0 || /[\s\-/(.]/.test(haystack[at - 1])) return true;
    from = at + 1;
  }
}

export interface RankOptions {
  /** Hard cap on rows handed to React for this set. */
  limit: number;
}

/** The matching entries, best first, capped. */
export function rankEntries(index: CommandEntry[], query: string, { limit }: RankOptions): CommandEntry[] {
  if (!query.trim()) return [];
  const scored: { entry: CommandEntry; score: number }[] = [];
  for (const entry of index) {
    const score = scoreEntry(entry, query);
    if (score > 0) scored.push({ entry, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.entry);
}

/** Per-group caps. Together they bound the palette at 20 rows however big the curriculum gets. */
export const GROUP_LIMITS = { trail: 3, camp: 4, topic: 8, person: 5, action: 5 } as const;

export interface GroupedResults {
  trails: CommandEntry[];
  camps: CommandEntry[];
  topics: CommandEntry[];
  people: CommandEntry[];
  actions: CommandEntry[];
  total: number;
}

/**
 * One pass, split by kind, each kind capped.
 *
 * Grouping after ranking (rather than ranking within groups) keeps the ordering inside a group
 * honest while still guaranteeing every kind gets a look in — a query matching 300 topics would
 * otherwise bury the one camp that matches it.
 */
export function groupResults(index: CommandEntry[], query: string): GroupedResults {
  const buckets: Record<CommandEntryKind, { entry: CommandEntry; score: number }[]> = {
    trail: [],
    camp: [],
    topic: [],
    person: [],
    action: [],
  };

  for (const entry of index) {
    const score = scoreEntry(entry, query);
    if (score > 0) buckets[entry.kind].push({ entry, score });
  }

  const take = (kind: CommandEntryKind) =>
    buckets[kind]
      .sort((a, b) => b.score - a.score)
      .slice(0, GROUP_LIMITS[kind])
      .map((s) => s.entry);

  const trails = take("trail");
  const camps = take("camp");
  const topics = take("topic");
  const people = take("person");
  const actions = take("action");

  return {
    trails,
    camps,
    topics,
    people,
    actions,
    total: trails.length + camps.length + topics.length + people.length + actions.length,
  };
}
