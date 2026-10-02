import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import {
  HANDBOOK_KINDS,
  PROJECT_TYPES,
  SCHEMA_BY_KIND,
  TERM_CATEGORIES,
  handbookIdSchema,
  listEntriesQuerySchema,
  saveEntryRequestSchema,
  type GlossaryTerm,
  type HandbookEntry,
  type HandbookKind,
  type HandbookTemplate,
} from "../../../shared/handbook";
import { requireActiveUser, staffOnly, requireStaff } from "../auth/guards";
import { stable } from "../bank/repo";
import { schema } from "../db";
import { byName, getRow, revalidatingChange, rowsOf, toEntry, toGlossaryTerm } from "../handbook/repo";
import { flagCitingItems } from "../handbook/revalidate";
import {
  MIME,
  TEMPLATE_VARIANTS,
  UPLOAD_MAX_BYTES,
  buildTemplateFile,
  looksLikeOfficeFile,
  readUpload,
  removeUpload,
  saveUpload,
} from "../handbook/templates";
import { writeAudit } from "../lib/audit";
import { badRequest, conflict, notFound, parseOrThrow } from "../lib/errors";
import { now } from "../lib/ids";

/**
 * v4.2: the Oyelabs Process Handbook. Learner routes (any active user, any department) read it;
 * `/api/admin/handbook/*` (staff) edits, confirms, archives and replaces template files.
 * Contract: docs brief, `shared/handbook.ts`.
 */

const DAY = 24 * 60 * 60 * 1000;
/** Leitner boxes 1–5. */
export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 16] as const;
export const FLASHCARD_RESULTS = ["again", "good", "easy"] as const;
export type FlashcardResult = (typeof FLASHCARD_RESULTS)[number];

/** A new card counts as box 1. Again → box 1 (due now), good → +1, easy → +2, capped at 5. */
export function nextBox(box: number, result: FlashcardResult, at = Date.now()): { box: number; dueAt: number } {
  const next = result === "again" ? 1 : Math.min(5, Math.max(1, box) + (result === "easy" ? 2 : 1));
  return { box: next, dueAt: at + BOX_INTERVAL_DAYS[next - 1]! * DAY };
}

const live = <T extends { archived: boolean }>(rows: T[]) => rows.filter((r) => !r.archived);

function liveEntries<K extends HandbookKind>(app: FastifyInstance, kind: K): HandbookEntry<K>[] {
  return live(rowsOf(app.db, kind)).map((r) => toEntry(r) as HandbookEntry<K>);
}

const idParams = z.object({ id: handbookIdSchema });
const kindParams = z.object({ kind: z.enum(HANDBOOK_KINDS) });
const kindIdParams = z.object({ kind: z.enum(HANDBOOK_KINDS), id: handbookIdSchema });
const downloadQuery = z.object({ variant: z.enum(TEMPLATE_VARIANTS).default("blank") });
const dueQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.union([z.enum(TERM_CATEGORIES), z.literal("")]).optional(),
});
const flashcardBody = z.object({ result: z.enum(FLASHCARD_RESULTS) });
const termParams = z.object({ termId: handbookIdSchema });

export async function registerHandbookRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/handbook/glossary", async (request): Promise<{ terms: GlossaryTerm[] }> => {
    requireActiveUser(request);
    return { terms: liveEntries(app, "term").sort(byName).map(toGlossaryTerm) };
  });

  app.get("/api/handbook/terms/:id", async (request) => {
    requireActiveUser(request);
    const { id } = parseOrThrow(idParams, request.params, "Unknown term.");
    const row = getRow(app.db, "term", id);
    if (!row || row.archived) throw notFound("That term isn't in the handbook.");
    return { entry: toEntry(row) as HandbookEntry<"term"> };
  });

  app.get("/api/handbook/rules", async (request) => {
    requireActiveUser(request);
    const { ids } = parseOrThrow(z.object({ ids: z.string().max(2000).optional() }), request.query);
    const wanted = ids ? new Set(ids.split(",").map((s) => s.trim()).filter(Boolean)) : null;
    const rules = liveEntries(app, "rule").filter((r) => !wanted || wanted.has(r.id));
    return { rules: rules.sort(byName) };
  });

  app.get("/api/handbook/stages", async (request) => {
    requireActiveUser(request);
    const { projectType } = parseOrThrow(z.object({ projectType: z.enum(PROJECT_TYPES).optional() }), request.query);
    const stages = liveEntries(app, "stage")
      .filter((s) => !projectType || s.data.projectType === projectType)
      .sort((a, b) => a.data.order - b.data.order || a.data.projectType.localeCompare(b.data.projectType));
    return { stages };
  });

  app.get("/api/handbook/templates", async (request) => {
    requireActiveUser(request);
    return { templates: liveEntries(app, "template").sort(byName) };
  });

  app.get("/api/handbook/templates/:id/download", async (request, reply) => {
    requireActiveUser(request);
    const { id } = parseOrThrow(idParams, request.params, "Unknown template.");
    const { variant } = parseOrThrow(downloadQuery, request.query);
    const row = getRow(app.db, "template", id);
    if (!row || row.archived) throw notFound("That template isn't in the handbook.");
    const template = row.data as unknown as HandbookTemplate;
    const uploaded = row.uploadName ? readUpload(app.env.dataDir, row.uploadName) : null;
    const format = uploaded && row.uploadName?.endsWith(".xlsx") ? "xlsx" : uploaded ? "docx" : template.format;
    const body = uploaded ?? (await buildTemplateFile(template, variant));
    const filename = `oyelabs-${id}${uploaded || variant === "blank" ? "" : "-example"}.${format}`;
    return reply
      .header("content-type", uploaded && row.uploadType ? row.uploadType : MIME[format])
      .header("content-disposition", `attachment; filename="${filename}"`)
      .header("cache-control", "no-store")
      .send(body);
  });

  app.get("/api/handbook/flashcards/due", async (request) => {
    const user = requireActiveUser(request);
    const { limit, category } = parseOrThrow(dueQuery, request.query);
    const at = now();
    const terms = liveEntries(app, "term").filter((t) => !category || t.data.category === category);
    const termIds = new Set(terms.map((t) => t.id));
    const rows = app.db.select().from(schema.handbookFlashcards).where(eq(schema.handbookFlashcards.userId, user.id)).all();
    const seen = new Set(rows.map((r) => r.termId));
    const due = rows
      .filter((r) => termIds.has(r.termId) && r.dueAt <= at)
      .sort((a, b) => a.dueAt - b.dueAt)
      .map((r) => ({ termId: r.termId, box: r.box, dueAt: r.dueAt, isNew: false }));
    const fresh = terms.filter((t) => !seen.has(t.id)).sort(byName);
    const cards = [...due, ...fresh.map((t) => ({ termId: t.id, box: 1, dueAt: at, isNew: true }))].slice(0, limit);
    return { cards, dueCount: due.length, newCount: fresh.length };
  });

  app.post("/api/handbook/flashcards/:termId", async (request) => {
    const user = requireActiveUser(request);
    const { termId } = parseOrThrow(termParams, request.params, "Unknown term.");
    const { result } = parseOrThrow(flashcardBody, request.body, "Answer again, good or easy.");
    const term = getRow(app.db, "term", termId);
    if (!term || term.archived) throw notFound("That term isn't in the handbook.");
    const t = schema.handbookFlashcards;
    const where = and(eq(t.userId, user.id), eq(t.termId, termId));
    const current = app.db.select().from(t).where(where).get();
    const next = nextBox(current?.box ?? 1, result, now());
    app.db
      .insert(t)
      .values({ userId: user.id, termId, ...next })
      .onConflictDoUpdate({ target: [t.userId, t.termId], set: next })
      .run();
    return next;
  });
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

/** The four entry schemas behind one type, so a route can validate whichever kind it was given. */
const schemaFor = (kind: HandbookKind) => SCHEMA_BY_KIND[kind] as unknown as z.ZodType<Record<string, unknown> & { id: string }>;

const UPLOAD_TYPES = [MIME.docx, MIME.xlsx, "application/octet-stream"];

function withoutStatus(data: unknown): string {
  const { status: _status, ...rest } = data as Record<string, unknown>;
  return stable(rest);
}

function matches(entry: HandbookEntry, q: string): boolean {
  const d = entry.data as Record<string, unknown>;
  const hay = [entry.id, d.name, ...(Array.isArray(d.aka) ? d.aka : []), d.definition, d.statement, d.purpose].filter(Boolean).join(" ").toLowerCase();
  return hay.includes(q.toLowerCase());
}

export async function registerAdminHandbookRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", staffOnly);

  // Template uploads arrive as the raw file. Scoped to this plugin, so nothing else accepts them.
  app.addContentTypeParser(UPLOAD_TYPES, { parseAs: "buffer", bodyLimit: UPLOAD_MAX_BYTES }, (_req, body, done) => done(null, body));

  app.get("/api/admin/handbook", async (request) => {
    const q = parseOrThrow(listEntriesQuerySchema, request.query);
    const all = rowsOf(app.db, q.kind).map(toEntry);
    const status = (e: HandbookEntry) => (e.data as { status: string }).status;
    const counts = {
      toConfirm: all.filter((e) => !e.archived && status(e) === "to-confirm").length,
      confirmed: all.filter((e) => !e.archived && status(e) === "confirmed").length,
      archived: all.filter((e) => e.archived).length,
    };
    const entries = all
      .filter((e) => (q.archived === undefined ? true : e.archived === (q.archived === "1")))
      .filter((e) => !q.status || status(e) === q.status)
      .filter((e) => !q.category || (e.data as { category?: string }).category === q.category)
      .filter((e) => {
        if (!q.projectType) return true;
        const d = e.data as { projectTypes?: string[]; projectType?: string };
        return d.projectType === q.projectType || Boolean(d.projectTypes?.includes(q.projectType));
      })
      .filter((e) => !q.q || matches(e, q.q))
      .sort((a, b) => Number(status(a) === "confirmed") - Number(status(b) === "confirmed") || byName(a, b));
    return { entries, counts };
  });

  app.put("/api/admin/handbook/:kind/:id", async (request) => {
    const actor = requireStaff(request);
    const { kind, id } = parseOrThrow(kindIdParams, request.params, "Unknown handbook entry.");
    const body = parseOrThrow(saveEntryRequestSchema, request.body);
    const existing = getRow(app.db, kind, id);
    if (!existing) throw notFound("That handbook entry doesn't exist.");
    const parsed = parseOrThrow(schemaFor(kind), { ...(body.data as object), id });
    if (body.confirm) parsed.status = "confirmed";

    const edited = withoutStatus(parsed) !== withoutStatus(existing.data);
    const changed = edited || parsed.status !== existing.data.status;
    const t = schema.handbookEntries;
    app.db
      .update(t)
      .set({ data: parsed, version: changed ? existing.version + 1 : existing.version, updatedAt: now(), updatedBy: actor.id })
      .where(and(eq(t.kind, kind), eq(t.id, id)))
      .run();

    if (edited || !body.confirm) writeAudit(app.db, { actorId: actor.id, action: "handbook.save", targetType: `handbook.${kind}`, targetId: id, details: { version: existing.version + (changed ? 1 : 0) } });
    if (body.confirm) writeAudit(app.db, { actorId: actor.id, action: "handbook.confirm", targetType: `handbook.${kind}`, targetId: id });

    const revalidating = revalidatingChange(kind, existing.data, parsed) ? flagCitingItems(app.db, app.ai, kind, id) : 0;
    return { entry: toEntry(getRow(app.db, kind, id)!), revalidating };
  });

  app.post("/api/admin/handbook/:kind", async (request, reply) => {
    const actor = requireStaff(request);
    const { kind } = parseOrThrow(kindParams, request.params, "Unknown handbook kind.");
    const body = parseOrThrow(z.object({ data: z.unknown() }), request.body);
    const parsed = parseOrThrow(schemaFor(kind), body.data);
    if (getRow(app.db, kind, parsed.id)) throw conflict("An entry with that id already exists.", { id: "That id is taken." });
    app.db.insert(schema.handbookEntries).values({ kind, id: parsed.id, data: parsed, version: 1, seedHash: null, updatedAt: now(), updatedBy: actor.id }).run();
    writeAudit(app.db, { actorId: actor.id, action: "handbook.save", targetType: `handbook.${kind}`, targetId: parsed.id, details: { created: true } });
    return reply.status(201).send({ entry: toEntry(getRow(app.db, kind, parsed.id)!) });
  });

  for (const action of ["archive", "unarchive"] as const) {
    app.post(`/api/admin/handbook/:kind/:id/${action}`, async (request) => {
      const actor = requireStaff(request);
      const { kind, id } = parseOrThrow(kindIdParams, request.params, "Unknown handbook entry.");
      if (!getRow(app.db, kind, id)) throw notFound("That handbook entry doesn't exist.");
      const t = schema.handbookEntries;
      app.db
        .update(t)
        .set({ archived: action === "archive", updatedAt: now(), updatedBy: actor.id })
        .where(and(eq(t.kind, kind), eq(t.id, id)))
        .run();
      writeAudit(app.db, { actorId: actor.id, action: "handbook.archive", targetType: `handbook.${kind}`, targetId: id, details: { archived: action === "archive" } });
      return { entry: toEntry(getRow(app.db, kind, id)!) };
    });
  }

  app.put("/api/admin/handbook/templates/:id/upload", async (request) => {
    const actor = requireStaff(request);
    const { id } = parseOrThrow(idParams, request.params, "Unknown template.");
    const row = getRow(app.db, "template", id);
    if (!row) throw notFound("That template doesn't exist.");
    const body = request.body;
    if (!Buffer.isBuffer(body) || body.length === 0) throw badRequest("Upload the .docx or .xlsx file as the request body.");
    if (!looksLikeOfficeFile(body)) throw badRequest("That file isn't a .docx or .xlsx document.");
    const type = String(request.headers["content-type"] ?? "").split(";")[0]!.trim();
    const format: "docx" | "xlsx" = type === MIME.xlsx ? "xlsx" : type === MIME.docx ? "docx" : (row.data as unknown as HandbookTemplate).format;
    if (row.uploadName && row.uploadName !== `${id}.${format}`) removeUpload(app.env.dataDir, row.uploadName);
    const name = saveUpload(app.env.dataDir, id, format, body);
    const t = schema.handbookEntries;
    app.db
      .update(t)
      .set({ uploadName: name, uploadType: MIME[format], updatedAt: now(), updatedBy: actor.id })
      .where(and(eq(t.kind, "template"), eq(t.id, id)))
      .run();
    writeAudit(app.db, { actorId: actor.id, action: "handbook.upload", targetType: "handbook.template", targetId: id, details: { bytes: body.length, format } });
    return { entry: toEntry(getRow(app.db, "template", id)!) };
  });

  app.delete("/api/admin/handbook/templates/:id/upload", async (request) => {
    const actor = requireStaff(request);
    const { id } = parseOrThrow(idParams, request.params, "Unknown template.");
    const row = getRow(app.db, "template", id);
    if (!row) throw notFound("That template doesn't exist.");
    if (row.uploadName) removeUpload(app.env.dataDir, row.uploadName);
    const t = schema.handbookEntries;
    app.db
      .update(t)
      .set({ uploadName: null, uploadType: null, updatedAt: now(), updatedBy: actor.id })
      .where(and(eq(t.kind, "template"), eq(t.id, id)))
      .run();
    writeAudit(app.db, { actorId: actor.id, action: "handbook.upload", targetType: "handbook.template", targetId: id, details: { reverted: true } });
    return { entry: toEntry(getRow(app.db, "template", id)!) };
  });
}

