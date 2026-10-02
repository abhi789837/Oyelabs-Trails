import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { and, eq } from "drizzle-orm";

import {
  HANDBOOK_KINDS,
  SCHEMA_BY_KIND,
  type GlossaryTerm,
  type HandbookEntry,
  type HandbookKind,
  type Term,
} from "../../../shared/handbook";
import { stable } from "../bank/repo";
import type { Db } from "../db";
import * as schema from "../db/schema";
import { now } from "../lib/ids";

/**
 * The Oyelabs Process Handbook's storage (v4.2).
 *
 * Seeds live in `server/handbook/`: `terms-*.json`, `stages.json`, `rules.json` and
 * `templates.json`, each a JSON array of entries. At boot, absent entries are inserted, and an
 * entry nobody has edited (`updated_by` null) is refreshed when its seed changed. Once an admin
 * saves or confirms an entry the seed never touches it again: the admin's word wins over a deploy.
 */

const here = path.dirname(fileURLToPath(import.meta.url));

export function handbookFolder(): string | null {
  const candidates = [path.resolve(here, "../../handbook"), path.resolve(here, "../server/handbook"), path.resolve(process.cwd(), "server/handbook")];
  return candidates.find((dir) => fs.existsSync(dir)) ?? null;
}

type Row = typeof schema.handbookEntries.$inferSelect;

export function seedHash(data: unknown): string {
  return crypto.createHash("sha256").update(stable(data)).digest("hex").slice(0, 32);
}

const FILE_KIND: { test: (name: string) => boolean; kind: HandbookKind }[] = [
  { test: (n) => /^terms(-[\w-]+)?\.json$/.test(n), kind: "term" },
  { test: (n) => n === "stages.json", kind: "stage" },
  { test: (n) => n === "rules.json", kind: "rule" },
  { test: (n) => n === "templates.json", kind: "template" },
];

export interface SeedEntry {
  kind: HandbookKind;
  id: string;
  data: Record<string, unknown>;
}

/** Reads and validates every seed file. Never throws: a bad file or entry is logged and skipped. */
export function loadHandbookSeed(folder: string | null = handbookFolder(), warn: (message: string) => void = console.warn): SeedEntry[] {
  if (!folder || !fs.existsSync(folder)) return [];
  const out: SeedEntry[] = [];
  const seen = new Set<string>();
  const files = fs.readdirSync(folder).sort();
  for (const name of files) {
    const kind = FILE_KIND.find((f) => f.test(name))?.kind;
    if (!kind) continue;
    let raw: unknown;
    try {
      raw = JSON.parse(fs.readFileSync(path.join(folder, name), "utf8"));
    } catch {
      warn(`[oyelearn] handbook: ${name} is not valid JSON; skipped`);
      continue;
    }
    if (!Array.isArray(raw)) {
      warn(`[oyelearn] handbook: ${name} is not a JSON array; skipped`);
      continue;
    }
    raw.forEach((value, index) => {
      const parsed = SCHEMA_BY_KIND[kind].safeParse(value);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        warn(`[oyelearn] handbook: skipping ${name}[${index}]: ${issue ? `${issue.path.join(".")} ${issue.message}` : "invalid"}`);
        return;
      }
      const key = `${kind}:${parsed.data.id}`;
      if (seen.has(key)) {
        warn(`[oyelearn] handbook: skipping ${name}[${index}]: duplicate ${key}`);
        return;
      }
      seen.add(key);
      out.push({ kind, id: parsed.data.id, data: parsed.data as Record<string, unknown> });
    });
  }
  return out;
}

export interface SeedResult {
  inserted: number;
  updated: number;
}

export function ensureHandbookSeed(db: Db, folder: string | null = handbookFolder(), warn?: (message: string) => void): SeedResult {
  const entries = loadHandbookSeed(folder, warn);
  const result: SeedResult = { inserted: 0, updated: 0 };
  if (entries.length === 0) return result;
  const at = now();
  const t = schema.handbookEntries;
  db.transaction((tx) => {
    for (const entry of entries) {
      const hash = seedHash(entry.data);
      const existing = tx.select().from(t).where(and(eq(t.kind, entry.kind), eq(t.id, entry.id))).get();
      if (!existing) {
        tx.insert(t).values({ kind: entry.kind, id: entry.id, data: entry.data, seedHash: hash, version: 1, updatedAt: at, updatedBy: null }).run();
        result.inserted += 1;
      } else if (existing.updatedBy === null && existing.seedHash !== hash) {
        tx.update(t)
          .set({ data: entry.data, seedHash: hash, version: existing.version + 1, updatedAt: at })
          .where(and(eq(t.kind, entry.kind), eq(t.id, entry.id)))
          .run();
        result.updated += 1;
      }
    }
  });
  return result;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function toEntry(row: Row): HandbookEntry {
  return {
    kind: row.kind,
    id: row.id,
    data: row.data as unknown as HandbookEntry["data"],
    archived: row.archived,
    version: row.version,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
    ...(row.kind === "template" ? { hasUpload: Boolean(row.uploadName) } : {}),
  };
}

export function getRow(db: Db, kind: HandbookKind, id: string): Row | undefined {
  const t = schema.handbookEntries;
  return db.select().from(t).where(and(eq(t.kind, kind), eq(t.id, id))).get();
}

export function rowsOf(db: Db, kind?: HandbookKind): Row[] {
  const t = schema.handbookEntries;
  return kind ? db.select().from(t).where(eq(t.kind, kind)).all() : db.select().from(t).all();
}

export function nameOf(data: unknown): string {
  return String((data as { name?: unknown }).name ?? "");
}

export function byName(a: { data: unknown }, b: { data: unknown }): number {
  return nameOf(a.data).localeCompare(nameOf(b.data));
}

export function toGlossaryTerm(entry: HandbookEntry<"term">): GlossaryTerm {
  const t: Term = entry.data;
  return {
    id: t.id,
    name: t.name,
    aka: t.aka,
    category: t.category,
    projectTypes: t.projectTypes,
    definition: t.definition,
    oyelabsMeaning: t.oyelabsMeaning,
    clientSentence: t.clientSentence,
    status: t.status,
  };
}

export function isHandbookKind(value: string): value is HandbookKind {
  return (HANDBOOK_KINDS as readonly string[]).includes(value);
}

/**
 * The fields whose wording a bank item's answer can depend on. A change to any of them re-checks
 * the items that cite the entry; a confirm alone (status only) does not.
 */
export const REVALIDATING_FIELDS: Partial<Record<HandbookKind, readonly string[]>> = {
  term: ["definition", "oyelabsMeaning", "impact"],
  rule: ["statement"],
};

export function revalidatingChange(kind: HandbookKind, before: unknown, after: unknown): boolean {
  const fields = REVALIDATING_FIELDS[kind] ?? [];
  const a = before as Record<string, unknown>;
  const b = after as Record<string, unknown>;
  return fields.some((f) => a[f] !== b[f]);
}
