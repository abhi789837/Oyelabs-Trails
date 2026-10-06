import { z } from "zod";

/**
 * v4.2: the Oyelabs Process Handbook — the single source of truth for process terms, lifecycle
 * stages, rules and templates. Courses, the glossary, tooltips, the decision tool and assessment
 * items all read these entries (by id) rather than copying their text, so an admin edit or
 * confirmation shows up everywhere.
 *
 * Seeds live in `server/handbook/*.json`; the database holds the live, admin-edited copy.
 */

export const HANDBOOK_KINDS = ["term", "stage", "rule", "template"] as const;
export type HandbookKind = (typeof HANDBOOK_KINDS)[number];

export const TERM_CATEGORIES = ["commercial", "scope", "delivery", "quality", "governance", "whitelabel"] as const;
export type TermCategory = (typeof TERM_CATEGORIES)[number];
export const TERM_CATEGORY_LABELS: Record<TermCategory, string> = {
  commercial: "Commercial & contract",
  scope: "Scope",
  delivery: "Delivery",
  quality: "Quality & support",
  governance: "Communication & governance",
  whitelabel: "White-label",
};

export const PROJECT_TYPES = ["custom", "whitelabel"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

/** `confirmed` = Oyelabs has confirmed its meaning; `to-confirm` = industry standard, admin to confirm. */
export const HANDBOOK_STATUSES = ["confirmed", "to-confirm"] as const;
export type HandbookStatus = (typeof HANDBOOK_STATUSES)[number];
export const HANDBOOK_STATUS_LABELS: Record<HandbookStatus, string> = {
  confirmed: "Confirmed by Oyelabs",
  "to-confirm": "Industry standard – to confirm",
};

/** Kebab-case ids, stable forever: courses and items reference them. */
export const handbookIdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(60);

const text = (max: number) => z.string().trim().min(1).max(max);
const list = (max: number, each = 300) => z.array(text(each)).max(max);

export const handbookSourceSchema = z.object({
  label: text(160),
  url: z.string().url().startsWith("https://"),
  /** ISO time the link last returned HTTP 200 with the right page. */
  verifiedAt: z.string().optional(),
});
export type HandbookSource = z.infer<typeof handbookSourceSchema>;

export const termSchema = z.object({
  id: handbookIdSchema,
  name: text(80),
  /** Abbreviations and other spellings, e.g. ["CR"]; used for search and tooltips. */
  aka: list(8, 60).default([]),
  category: z.enum(TERM_CATEGORIES),
  projectTypes: z.array(z.enum(PROJECT_TYPES)).min(1).max(2),
  /** Industry-standard definition, plain English. */
  definition: text(600),
  /**
   * What it means at Oyelabs. Until confirmed, this says what the admin should confirm, e.g.
   * "[Oyelabs SOP – admin to confirm] Our warranty window and what it covers."
   */
  oyelabsMeaning: text(600),
  /** A short example from an agency project. */
  example: text(500),
  /** How to explain it to a client in one sentence. */
  clientSentence: text(300),
  /** Impact on time and billing. Typical values are labelled "typical". */
  impact: text(400),
  related: z.array(handbookIdSchema).max(10).default([]),
  confusedWith: z.array(handbookIdSchema).max(6).default([]),
  sources: z.array(handbookSourceSchema).max(4).default([]),
  status: z.enum(HANDBOOK_STATUSES).default("to-confirm"),
  /** Contractual terms show a "not legal advice" line. */
  contractual: z.boolean().default(false),
});
export type Term = z.infer<typeof termSchema>;

export const raciRowSchema = z.object({
  activity: text(160),
  responsible: text(80),
  accountable: text(80),
  consulted: z.string().trim().max(120).default(""),
  informed: z.string().trim().max(120).default(""),
});

export const stageSchema = z.object({
  id: handbookIdSchema,
  projectType: z.enum(PROJECT_TYPES),
  order: z.number().int().min(1).max(40),
  name: text(80),
  purpose: text(500),
  entryCriteria: list(10),
  exitCriteria: list(10),
  raci: z.array(raciRowSchema).max(10),
  clientTouchpoints: list(8),
  /** Template and term ids this stage produces or uses. */
  artifacts: z.array(handbookIdSchema).max(12).default([]),
  /** Always phrased as typical, e.g. "Typically 1–2 weeks". */
  typicalDuration: text(160),
  pitfalls: list(8),
  /** The course module that teaches this stage, e.g. "pmp-a05". */
  moduleId: z.string().max(40).nullable().default(null),
  sources: z.array(handbookSourceSchema).max(4).default([]),
  status: z.enum(HANDBOOK_STATUSES).default("to-confirm"),
});
export type Stage = z.infer<typeof stageSchema>;

export const ruleSchema = z.object({
  id: handbookIdSchema,
  name: text(120),
  category: z.enum(TERM_CATEGORIES),
  projectTypes: z.array(z.enum(PROJECT_TYPES)).min(1).max(2),
  /** The rule itself: "A change request is needed when…". */
  statement: text(800),
  terms: z.array(handbookIdSchema).max(8).default([]),
  sources: z.array(handbookSourceSchema).max(4).default([]),
  status: z.enum(HANDBOOK_STATUSES).default("to-confirm"),
  contractual: z.boolean().default(false),
});
export type Rule = z.infer<typeof ruleSchema>;

export const templateSchema = z.object({
  id: handbookIdSchema,
  name: text(80),
  purpose: text(400),
  format: z.enum(["docx", "xlsx"]),
  stageIds: z.array(handbookIdSchema).max(6).default([]),
  /** Section headings (docx) or column headers (xlsx) of the generated default. */
  sections: list(20, 120),
  /** A short filled example, as rows of [field, value], used for the "filled" version. */
  example: z.array(z.tuple([text(80), text(400)])).max(30),
  status: z.enum(HANDBOOK_STATUSES).default("to-confirm"),
});
export type HandbookTemplate = z.infer<typeof templateSchema>;

export type HandbookEntryData =
  | { kind: "term"; data: Term }
  | { kind: "stage"; data: Stage }
  | { kind: "rule"; data: Rule }
  | { kind: "template"; data: HandbookTemplate };

export const SCHEMA_BY_KIND = { term: termSchema, stage: stageSchema, rule: ruleSchema, template: templateSchema } as const;

/** One stored entry, as the API returns it. */
export interface HandbookEntry<K extends HandbookKind = HandbookKind> {
  kind: K;
  id: string;
  data: K extends "term" ? Term : K extends "stage" ? Stage : K extends "rule" ? Rule : HandbookTemplate;
  archived: boolean;
  /** Bumped on every edit; items that cite an entry record the version they were checked against. */
  version: number;
  updatedAt: number;
  updatedBy: string | null;
  /** Template entries only: an admin-uploaded replacement file exists. */
  hasUpload?: boolean;
}

/** The compact term list learners load once, for the glossary and tooltips. */
export interface GlossaryTerm {
  id: string;
  name: string;
  aka: string[];
  category: TermCategory;
  projectTypes: ProjectType[];
  definition: string;
  oyelabsMeaning: string;
  clientSentence: string;
  status: HandbookStatus;
}

// ---------------------------------------------------------------------------
// Course content links: [[term:change-request]] or [[term:change-request|CR]]
// ---------------------------------------------------------------------------

// Defined in the zod-free `./handbookText` (so the lesson player can use them without zod), and
// re-exported here so every existing import keeps working.
export { CONFIRM_MARKER, LEGAL_NOTE, TERM_LINK_RE, TYPICAL_NOTE, stripTermLinks, termLinksIn } from "./handbookText";

// ---------------------------------------------------------------------------
// API shapes
// ---------------------------------------------------------------------------

export const saveEntryRequestSchema = z.object({ data: z.unknown(), confirm: z.boolean().optional() });
export const listEntriesQuerySchema = z.object({
  kind: z.enum(HANDBOOK_KINDS).optional(),
  q: z.string().max(80).optional(),
  category: z.enum(TERM_CATEGORIES).optional(),
  projectType: z.enum(PROJECT_TYPES).optional(),
  status: z.enum(HANDBOOK_STATUSES).optional(),
  archived: z.enum(["0", "1"]).optional(),
});
