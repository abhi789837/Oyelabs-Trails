import { z } from "zod";

/**
 * v4.5 Phase 3: one test per Oyelabs course module, written from the module's own material.
 *
 * Built on the v4.3 grounded pipeline (shared/topicTests.ts, server/src/topicTests/): the items are
 * ordinary `topic_test_items` rows whose `topic_id` is the module's managed lesson
 * (`course_topics.id`, kind `module`), and the grounding is a `topic_grounding` row with the same
 * id. What this file adds: where a passage came from (doc/page/section, video timestamp), the
 * module test's status and summary, and the admin/learner wire shapes.
 *
 * The generator and the extraction are builder C's (`server/src/oyelabs/moduleTests/`,
 * `server/src/oyelabs/extract/`).
 */

// ---------------------------------------------------------------------------
// Sources and passages
// ---------------------------------------------------------------------------

/** What a module's text is gathered from. */
export const MODULE_SOURCE_KINDS = ["doc", "doc_link", "video", "note", "description"] as const;
export const moduleSourceKindSchema = z.enum(MODULE_SOURCE_KINDS);
export type ModuleSourceKind = z.infer<typeof moduleSourceKindSchema>;

/** How a source's text was read. Recorded per source, so "why is this doc missing" has an answer. */
export const EXTRACTION_METHODS = [
  "pdf",
  "ocr",
  "docx",
  "pptx",
  "xlsx",
  "text",
  "google_export",
  "readability",
  "captions",
  "whisper",
  "notes",
] as const;
export const extractionMethodSchema = z.enum(EXTRACTION_METHODS);
export type ExtractionMethod = z.infer<typeof extractionMethodSchema>;

export const SOURCE_TEXT_STATUSES = ["pending", "done", "failed", "skipped"] as const;
export type SourceTextStatus = (typeof SOURCE_TEXT_STATUSES)[number];

/** Where inside a source a passage sits. Every field optional: a TXT file has none. */
export const passageLocatorSchema = z.object({
  page: z.number().int().min(1).optional(),
  slide: z.number().int().min(1).optional(),
  sheet: z.string().max(120).optional(),
  section: z.string().max(200).optional(),
  startSec: z.number().min(0).optional(),
  endSec: z.number().min(0).optional(),
});
export type PassageLocator = z.infer<typeof passageLocatorSchema>;

/**
 * One citable passage. `id` is stable for unchanged text (`<source short id>.<n>`), so an item's
 * citation survives a re-extraction of an unchanged source. Stored in `course_module_texts.passages`
 * and copied into the module's `topic_grounding` as v4.3 passages (heading = `citationLabel`).
 */
export const modulePassageSchema = z.object({
  id: z.string().min(1).max(80),
  sourceKind: moduleSourceKindSchema,
  sourceId: z.string().max(64),
  sourceTitle: z.string().max(200),
  locator: passageLocatorSchema,
  text: z.string().min(1).max(6000),
});
export type ModulePassage = z.infer<typeof modulePassageSchema>;

/** An item's citation: the v4.3 `{ passageId, quote }` plus where that passage is, for display. */
export const moduleCitationSchema = z.object({
  passageId: z.string().min(1).max(80),
  quote: z.string().min(8).max(600),
  sourceKind: moduleSourceKindSchema,
  sourceId: z.string().max(64),
  sourceTitle: z.string().max(200),
  locator: passageLocatorSchema,
});
export type ModuleCitation = z.infer<typeof moduleCitationSchema>;

function clock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
}

/** "Onboarding.pdf, page 3", "Kick-off call, 12:40", "Rates.xlsx, sheet Q3", "Module notes". */
export function citationLabel(c: Pick<ModuleCitation, "sourceTitle" | "locator">): string {
  const where: string[] = [];
  const l = c.locator;
  if (l.page !== undefined) where.push(`page ${l.page}`);
  if (l.slide !== undefined) where.push(`slide ${l.slide}`);
  if (l.sheet) where.push(`sheet ${l.sheet}`);
  if (l.section) where.push(l.section);
  if (l.startSec !== undefined) where.push(clock(l.startSec));
  return where.length ? `${c.sourceTitle}, ${where.join(", ")}` : c.sourceTitle;
}

// ---------------------------------------------------------------------------
// The module test
// ---------------------------------------------------------------------------

/**
 * `empty`: nothing generated yet. `gathering`: reading sources. `generating`: writing + gates.
 * `ready`: active items exist (auto-saved; no approval step). `needs_content`: too little text to
 * write 6 grounded items (says what to add). `failed`: retries exhausted (says Retry).
 */
export const MODULE_TEST_STATUSES = ["empty", "gathering", "generating", "ready", "needs_content", "failed"] as const;
export const moduleTestStatusSchema = z.enum(MODULE_TEST_STATUSES);
export type ModuleTestStatus = z.infer<typeof moduleTestStatusSchema>;

/** 6-10 items, mostly scenarios (brief Phase 3). */
export const MODULE_TEST_SIZE = { min: 6, max: 10, target: 8 } as const;
/** Share of items that should be scenario items (the rest recall; `hands_on` for code material). */
export const MODULE_TEST_SCENARIO_SHARE = 0.6;
/** The cost one module's generation should stay near (logged via the AI router, `ai_calls.course_id`). */
export const MODULE_TEST_COST_TARGET_USD = 0.05;
/** Below this many characters of gathered text the module is `needs_content`. */
export const MODULE_TEST_MIN_SOURCE_CHARS = 1500;

export const MODULE_ITEM_KINDS = ["scenario", "recall", "hands_on"] as const;
export type ModuleItemKind = (typeof MODULE_ITEM_KINDS)[number];

/** What a module's test was built from. Shown as the summary and on the admin preview. */
export const moduleTestSourceSummarySchema = z.object({
  docs: z.number().int().min(0),
  videos: z.number().int().min(0),
  notes: z.boolean(),
  /** Sources that gave no text, with the plain reason ("Scanned PDF, OCR found no text"). */
  skipped: z.array(z.object({ title: z.string().max(200), reason: z.string().max(300) })).max(80),
});
export type ModuleTestSourceSummary = z.infer<typeof moduleTestSourceSummarySchema>;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "8 questions created from 3 docs and 2 videos". */
export function moduleTestSummaryLine(items: number, s: Pick<ModuleTestSourceSummary, "docs" | "videos" | "notes">): string {
  const from: string[] = [];
  if (s.docs > 0) from.push(plural(s.docs, "doc", "docs"));
  if (s.videos > 0) from.push(plural(s.videos, "video", "videos"));
  if (s.notes) from.push("your notes");
  const list = from.length <= 1 ? (from[0] ?? "the course description") : `${from.slice(0, -1).join(", ")} and ${from[from.length - 1]}`;
  return `${plural(items, "question", "questions")} created from ${list}`;
}

/** Admin preview of one item. */
export interface ModuleTestItemView {
  id: string;
  origin: "generated" | "admin";
  status: "active" | "flagged" | "retired" | "draft";
  kind: ModuleItemKind;
  prompt: string;
  options: string[];
  correctIndices: number[];
  explanation: string;
  /** Null only for an admin-added item without a source. */
  citation: ModuleCitation | null;
  citationLabel: string | null;
  /** v4.3 gate failures in plain words, when any. */
  gateNotes: string[];
}

export interface ModuleTestView {
  sectionId: string;
  topicId: string;
  courseId: string;
  status: ModuleTestStatus;
  /** `moduleTestSummaryLine`, or the plain reason for needs_content/failed. */
  summary: string;
  sources: ModuleTestSourceSummary;
  items: ModuleTestItemView[];
  /** True when the module's material changed since the items were written (Regenerate is offered). */
  stale: boolean;
  generatedAt: number | null;
}

const optionsSchema = z.array(z.string().trim().min(1).max(400)).min(3).max(5);

/** Admin "add your own question" and "edit". Single-answer when `correctIndices` has one entry. */
export const moduleTestItemInputSchema = z
  .object({
    kind: z.enum(MODULE_ITEM_KINDS).default("scenario"),
    prompt: z.string().trim().min(10).max(2000),
    options: optionsSchema,
    correctIndices: z.array(z.number().int().min(0).max(4)).min(1).max(4),
    explanation: z.string().trim().max(1500).default(""),
    citation: moduleCitationSchema.nullable().default(null),
  })
  .refine((v) => v.correctIndices.every((i) => i < v.options.length), { message: "Tick an answer that exists.", path: ["correctIndices"] });
export type ModuleTestItemInput = z.infer<typeof moduleTestItemInputSchema>;

// ---------------------------------------------------------------------------
// Learner: taking a module test
// ---------------------------------------------------------------------------

export interface ServedModuleTestItem {
  id: string;
  prompt: string;
  options: string[];
  multi: boolean;
}

export interface ServedModuleTest {
  topicId: string;
  items: ServedModuleTestItem[];
  /** v4.3/v5 rule: 80% of items fully right ("Full marks or Not yet" per item). */
  passPercent: number;
  /** The playlist lock: true when videos must be watched first. */
  locked: boolean;
}

/** Item id → chosen option indices (as served). */
export const moduleTestAttemptSchema = z.object({
  answers: z.record(z.string().max(64), z.array(z.number().int().min(0).max(9)).max(5)),
});
export type ModuleTestAttempt = z.infer<typeof moduleTestAttemptSchema>;

export interface GradedModuleTest {
  score: number;
  passed: boolean;
  results: { itemId: string; verdict: "full" | "not_yet"; correctIndices: number[]; explanation: string; source: string | null }[];
  /** True when passing marked the module lesson done (a `course_progress` row). */
  completed: boolean;
}
