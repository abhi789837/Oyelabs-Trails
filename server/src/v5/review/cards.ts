import { and, eq, gte, inArray } from "drizzle-orm";

import { termLinksIn, type GlossaryTerm, type HandbookEntry } from "../../../../shared/handbook";
import { type ReviewCardBack, type ReviewCardFront, type ReviewSource } from "../../../../shared/review";
import type { TestItemPayload } from "../../../../shared/topicTests";
import type { ContentStore } from "../../content/store";
import { schema, type Db } from "../../db";
import { getRow, toEntry, toGlossaryTerm } from "../../handbook/repo";
import { newId, now } from "../../lib/ids";
import { BOX_INTERVAL_DAYS } from "../../routes/handbook";
import { buildGrounding } from "../../topicTests/grounding";
import { getGrounding } from "../../topicTests/repo";
import { cardFromLeitner, newCard, type StoredCard } from "./scheduler";
import { plainTitle } from "../../../../shared/plainTitle";

/**
 * Where review cards come from. Every function here is idempotent: the unique index
 * (user_id, source, ref_id) plus `on conflict do nothing` means running it twice adds nothing.
 *
 * - mistake: every quiz item a learner answered wrong (from `topic_attempts`, keyed by the stored
 *   test item), front = the question and options, back = the right answer and the explanation.
 * - topic_point: up to 3 key points (summary + first two sections) of topics completed in the
 *   last `TOPIC_POINT_DAYS` days.
 * - glossary: every term the learner practised in the handbook flashcards (bridged from the
 *   Leitner boxes, see `migrateHandbookFlashcards`) and every term linked from a topic they finished.
 * - quiz_item: not generated in v5 (see DECISIONS, Phase 4): correct answers are not re-drilled.
 */

export const TOPIC_POINT_DAYS = 30;
const POINTS_PER_TOPIC = 3;
const BACK_MAX_CHARS = 420;
export const HANDBOOK_MIGRATION_KEY = "v5.review.handbook_flashcards_migrated";

interface NewCard {
  source: ReviewSource;
  refId: string;
  topicId: string | null;
  front: ReviewCardFront;
  back: ReviewCardBack;
  fsrs?: StoredCard;
}

function insertCards(db: Db, userId: string, cards: NewCard[]): number {
  if (cards.length === 0) return 0;
  const at = now();
  let added = 0;
  db.transaction(() => {
    for (const card of cards) {
      const fsrs = card.fsrs ?? newCard(at);
      const res = db
        .insert(schema.reviewCards)
        .values({
          id: newId(),
          userId,
          source: card.source,
          refId: card.refId,
          topicId: card.topicId,
          front: card.front as unknown as Record<string, unknown>,
          back: card.back as unknown as Record<string, unknown>,
          fsrs: fsrs as unknown as Record<string, unknown>,
          due: fsrs.due,
          createdAt: at,
          updatedAt: at,
        })
        .onConflictDoNothing()
        .run();
      added += res.changes;
    }
  });
  return added;
}

function existingRefs(db: Db, userId: string, source: ReviewSource): Set<string> {
  const t = schema.reviewCards;
  return new Set(
    db
      .select({ refId: t.refId })
      .from(t)
      .where(and(eq(t.userId, userId), eq(t.source, source)))
      .all()
      .map((r) => r.refId),
  );
}

/** Trims to a sentence boundary near `max` characters. */
export function clip(text: string, max = BACK_MAX_CHARS): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  return stop > max * 0.5 ? cut.slice(0, stop + 1) : `${cut.replace(/\s+\S*$/, "")}…`;
}

const sortedKey = (xs: readonly number[]) => [...new Set(xs)].sort((a, b) => a - b).join(",");

export function keyOf(item: Pick<TestItemPayload, "correctIndex" | "correctIndices">): number[] {
  return item.correctIndices && item.correctIndices.length > 1 ? [...item.correctIndices].sort((a, b) => a - b) : [item.correctIndex];
}

/** A wrong answer to a stored test item, as a card. */
export function mistakeCard(topicId: string, topicTitle: string | null, rowId: string, item: TestItemPayload, chosen: number[]): NewCard {
  const correct = keyOf(item);
  const multi = correct.length > 1;
  const front: ReviewCardFront = { kind: "choice", prompt: item.prompt, options: item.options, multi, ...(topicTitle ? { context: topicTitle } : {}) };
  const back: ReviewCardBack = {
    answer: correct.map((i) => item.options[i]).filter(Boolean).join(" · "),
    explanation: item.explanation ? clip(item.explanation, 600) : undefined,
    correctIndices: correct,
    yourIndices: [...new Set(chosen)].sort((a, b) => a - b),
  };
  return { source: "mistake", refId: rowId, topicId, front, back };
}

function topicTitle(content: ContentStore | null, topicId: string): string | null {
  const title = content?.topicIndex.get(topicId)?.meta.title;
  return title ? plainTitle(title) : null;
}

/**
 * Mistake cards from quiz attempts. `sinceMs` limits the scan (the hook passes the attempt's own
 * time); a full sync reads every quiz attempt the learner has, which is a few hundred rows at most.
 */
export function syncMistakeCards(db: Db, content: ContentStore | null, userId: string, opts: { topicId?: string; sinceMs?: number } = {}): number {
  const a = schema.topicAttempts;
  const conds = [eq(a.userId, userId), eq(a.kind, "quiz")];
  if (opts.topicId) conds.push(eq(a.topicId, opts.topicId));
  if (opts.sinceMs) conds.push(gte(a.createdAt, opts.sinceMs));
  const attempts = db.select().from(a).where(and(...conds)).all();
  if (attempts.length === 0) return 0;

  const have = existingRefs(db, userId, "mistake");
  const topicIds = [...new Set(attempts.map((x) => x.topicId))];
  const items = db.select().from(schema.topicTestItems).where(inArray(schema.topicTestItems.topicId, topicIds)).all();
  const byServed = new Map<string, (typeof items)[number]>();
  for (const row of items) {
    byServed.set(`${row.topicId}\u0000${row.sourceId ?? row.id}`, row);
    byServed.set(`${row.topicId}\u0000${row.id}`, row);
  }

  const cards: NewCard[] = [];
  const queued = new Set<string>();
  for (const attempt of attempts) {
    const answers = (attempt.answers ?? {}) as Record<string, unknown>;
    for (const [servedId, raw] of Object.entries(answers)) {
      const row = byServed.get(`${attempt.topicId}\u0000${servedId}`);
      if (!row || have.has(row.id) || queued.has(row.id)) continue;
      const chosen = Array.isArray(raw) ? raw.filter((n): n is number => typeof n === "number") : [];
      const item = row.item as unknown as TestItemPayload;
      if (!Array.isArray(item.options) || typeof item.prompt !== "string") continue;
      if (sortedKey(chosen) === sortedKey(keyOf(item))) continue;
      queued.add(row.id);
      cards.push(mistakeCard(attempt.topicId, topicTitle(content, attempt.topicId), row.id, item, chosen));
    }
  }
  return insertCards(db, userId, cards);
}

/** Up to three key points of a topic: the first summary paragraph and the first paragraph of two sections. */
export function topicPointCards(db: Db, content: ContentStore | null, topicId: string): NewCard[] {
  let grounding = getGrounding(db, topicId);
  if (!grounding) {
    const found = content?.getTopic(topicId);
    if (!found) return [];
    grounding = buildGrounding(found.topic);
  }
  const title = grounding.title || topicTitle(content, topicId) || "this lesson";
  const picked: typeof grounding.passages = [];
  const summary = grounding.passages.find((p) => p.source === "summary");
  if (summary) picked.push(summary);
  const seenHeadings = new Set<string>();
  for (const p of grounding.passages) {
    if (picked.length >= POINTS_PER_TOPIC) break;
    if (p.source !== "section" || seenHeadings.has(p.heading) || p.text.trim().length < 40) continue;
    seenHeadings.add(p.heading);
    picked.push(p);
  }
  return picked.map((p) => ({
    source: "topic_point" as const,
    refId: `${topicId}:${p.id}`,
    topicId,
    front:
      p.source === "summary"
        ? // The lesson's own title, as section cards use their own heading (UX review R2).
          { kind: "text" as const, prompt: title, context: "The lesson in a sentence or two. Say it in your own words, then check." }
        : { kind: "text" as const, prompt: p.heading, context: `From "${title}". What do you remember about this?` },
    back: { answer: clip(p.text) },
  }));
}

export function syncTopicPointCards(db: Db, content: ContentStore | null, userId: string, opts: { topicId?: string; days?: number } = {}): number {
  const t = schema.topicProgress;
  const since = now() - (opts.days ?? TOPIC_POINT_DAYS) * 86_400_000;
  const conds = [eq(t.userId, userId), eq(t.status, "completed")];
  if (opts.topicId) conds.push(eq(t.topicId, opts.topicId));
  else conds.push(gte(t.completedAt, since));
  const done = db.select({ topicId: t.topicId }).from(t).where(and(...conds)).all();
  if (done.length === 0) return 0;
  const haveTopics = new Set([...existingRefs(db, userId, "topic_point")].map((ref) => ref.slice(0, ref.lastIndexOf(":"))));
  const cards: NewCard[] = [];
  for (const { topicId } of done) {
    if (haveTopics.has(topicId)) continue;
    cards.push(...topicPointCards(db, content, topicId));
  }
  return insertCards(db, userId, cards);
}

function glossaryCard(term: GlossaryTerm, topicId: string | null): NewCard {
  return {
    source: "glossary",
    refId: term.id,
    topicId,
    front: { kind: "text", prompt: term.name, context: "What does this mean at Oyelabs?" },
    back: { answer: clip(term.definition), ...(term.oyelabsMeaning ? { explanation: clip(term.oyelabsMeaning, 300) } : {}) },
  };
}

function liveTerm(db: Db, termId: string): GlossaryTerm | null {
  const row = getRow(db, "term", termId);
  if (!row || row.archived) return null;
  return toGlossaryTerm(toEntry(row) as HandbookEntry<"term">);
}

/**
 * Glossary cards: terms practised in the handbook flashcards (their Leitner box carried over into
 * FSRS) and terms linked from topics the learner completed.
 */
export function syncGlossaryCards(db: Db, content: ContentStore, userId: string): number {
  const have = existingRefs(db, userId, "glossary");
  const cards: NewCard[] = [];
  const queued = new Set<string>();
  const practised = db.select().from(schema.handbookFlashcards).where(eq(schema.handbookFlashcards.userId, userId)).all();
  for (const row of practised) {
    if (have.has(row.termId) || queued.has(row.termId)) continue;
    const term = liveTerm(db, row.termId);
    if (!term) continue;
    queued.add(row.termId);
    cards.push({ ...glossaryCard(term, null), fsrs: cardFromLeitner(row.box, row.dueAt, BOX_INTERVAL_DAYS[Math.max(1, Math.min(5, row.box)) - 1]!) });
  }

  const done = db
    .select({ topicId: schema.topicProgress.topicId })
    .from(schema.topicProgress)
    .where(and(eq(schema.topicProgress.userId, userId), eq(schema.topicProgress.status, "completed")))
    .all();
  for (const { topicId } of done) {
    const grounding = getGrounding(db, topicId);
    const text = grounding ? grounding.passages.map((p) => p.text).join("\n") : (content.getTopic(topicId)?.topic.sections ?? []).map((s) => s.body).join("\n");
    for (const termId of termLinksIn(text)) {
      if (have.has(termId) || queued.has(termId)) continue;
      const term = liveTerm(db, termId);
      if (!term) continue;
      queued.add(termId);
      cards.push(glossaryCard(term, topicId));
    }
  }
  return insertCards(db, userId, cards);
}

/**
 * One-time move of every learner's handbook flashcards into FSRS cards, guarded by app_meta so it
 * runs once per database. The handbook rows are left in place (the old design still reads them),
 * so nothing is lost; later handbook practice is picked up by `syncGlossaryCards`.
 */
export function migrateHandbookFlashcards(db: Db, content: ContentStore): { migrated: number; skipped: boolean } {
  const done = db.select().from(schema.appMeta).where(eq(schema.appMeta.key, HANDBOOK_MIGRATION_KEY)).get();
  if (done) return { migrated: 0, skipped: true };
  const users = [...new Set(db.select({ userId: schema.handbookFlashcards.userId }).from(schema.handbookFlashcards).all().map((r) => r.userId))];
  let migrated = 0;
  for (const userId of users) migrated += syncGlossaryCards(db, content, userId);
  const at = now();
  db.insert(schema.appMeta)
    .values({ key: HANDBOOK_MIGRATION_KEY, value: JSON.stringify({ at, migrated }), updatedAt: at })
    .onConflictDoNothing()
    .run();
  return { migrated, skipped: false };
}

// ---------------------------------------------------------------------------
// Sync and hooks
// ---------------------------------------------------------------------------

const lastSync = new WeakMap<Db, Map<string, number>>();
const SYNC_EVERY_MS = 60_000;

/**
 * Makes sure every card the learner should have exists. Cheap and idempotent; throttled to once a
 * minute per learner unless `force` (the hooks force it for the one topic they touched).
 */
export function syncAll(db: Db, content: ContentStore, userId: string, force = false): number {
  let map = lastSync.get(db);
  if (!map) {
    map = new Map();
    lastSync.set(db, map);
  }
  const at = now();
  if (!force && at - (map.get(userId) ?? 0) < SYNC_EVERY_MS) return 0;
  map.set(userId, at);
  return syncMistakeCards(db, content, userId) + syncTopicPointCards(db, content, userId) + syncGlossaryCards(db, content, userId);
}

/**
 * Hook, called from `recordAttempt` (server/src/progress/repo.ts) for every graded attempt: makes
 * the attempt's mistake cards, and the topic's key-point cards when it is now completed. Content is
 * not needed (titles are added when a card is shown; key points come from the stored grounding).
 * Never throws: a review card must not fail a test submission.
 */
export function onTopicAttemptSafely(db: Db, userId: string, topicId: string, content: ContentStore | null = null): number {
  try {
    return syncMistakeCards(db, content, userId, { topicId }) + syncTopicPointCards(db, content, userId, { topicId });
  } catch {
    return 0;
  }
}

