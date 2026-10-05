import crypto from "node:crypto";
import { estimateSeconds } from "../../../shared/timing";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { and, eq, inArray, ne } from "drizzle-orm";

import { bankItemSchema, type BankItem, type BankItemRow, type BankStatus } from "../../../shared/bank";
import type { Db } from "../db";
import * as schema from "../db/schema";
import { now } from "../lib/ids";

/**
 * The question bank's storage (v4 Phase 5).
 *
 * Seed items live in `server/bank/<department>/<skill>.json`, written once and validated by
 * `scripts/bank/validate.mjs`, which runs every coding item's reference solution against its hidden
 * tests in the sandbox and records a content hash in a `<file>.validated.json` sidecar. At boot, absent
 * items are inserted — `active` when their hash is in the manifest, `draft` otherwise — so an item
 * edited after validation can never go live unvalidated. Existing rows are never overwritten:
 * an admin's edit or retirement wins over a deploy.
 */

const here = path.dirname(fileURLToPath(import.meta.url));

export function bankFolder(): string | null {
  const candidates = [path.resolve(here, "../../bank"), path.resolve(here, "../server/bank"), path.resolve(process.cwd(), "server/bank")];
  return candidates.find((dir) => fs.existsSync(dir)) ?? null;
}

/** Stable JSON: keys sorted at every level, so a hash depends on content and not on key order. */
export function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function itemHash(item: BankItem): string {
  return crypto.createHash("sha256").update(stable(item)).digest("hex").slice(0, 32);
}

let seedCache: { items: BankItem[]; validated: Record<string, string> } | null = null;

/** Reads and parses every seed file once per process. A malformed file is a loud error. */
export function loadSeedItems(folder = bankFolder()): { items: BankItem[]; validated: Record<string, string> } {
  if (seedCache && folder === bankFolder()) return seedCache;
  if (!folder) return { items: [], validated: {} };
  const items: BankItem[] = [];
  const validated: Record<string, string> = {};
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".validated.json")) {
        // One sidecar per seed file (`eng-react.json` → `eng-react.validated.json`), so two people
        // validating different files never write the same manifest.
        Object.assign(validated, JSON.parse(fs.readFileSync(full, "utf8")) as Record<string, string>);
      } else if (entry.name.endsWith(".json")) {
        let raw: unknown[];
        try {
          raw = JSON.parse(fs.readFileSync(full, "utf8")) as unknown[];
        } catch {
          console.warn(`[oyelearn] question bank: ${path.relative(folder, full)} is not valid JSON; skipped`);
          return;
        }
        raw.forEach((value, index) => {
          const parsed = bankItemSchema.safeParse(value);
          // The validator is the gate; boot only skips what it cannot read rather than refusing to start.
          if (!parsed.success) {
            console.warn(`[oyelearn] question bank: skipping ${path.relative(folder, full)}[${index}]: ${parsed.error.issues[0]?.message ?? "invalid"}`);
            return;
          }
          items.push(parsed.data);
        });
      }
    }
  };
  walk(folder);
  const result = { items, validated };
  if (folder === bankFolder()) seedCache = result;
  return result;
}

export function ensureBankSeed(db: Db): number {
  const { items, validated } = loadSeedItems();
  if (items.length === 0) return 0;
  const at = now();
  // v4.2: an item's handbook refs are stored with the entry versions it was written against, so a
  // later admin edit to one of those entries can find it and re-check it.
  const versions = handbookVersions(db);
  let inserted = 0;
  db.transaction((tx) => {
    for (const item of items) {
      const status: BankStatus = validated[item.id] === itemHash(item) ? "active" : "draft";
      const result = tx
        .insert(schema.questionBank)
        .values({
          ...toColumns(item),
          handbookRefs: citedRefs(item.handbookRefs, versions),
          status,
          source: "seed",
          validatedAt: status === "active" ? at : null,
          createdAt: at,
          updatedAt: at,
        })
        .onConflictDoNothing()
        .run();
      inserted += result.changes;
    }
  });
  return inserted;
}

/** `kind:id` → the entry's current version, for every handbook entry in the database. */
function handbookVersions(db: Db): Map<string, number> {
  const rows = db.select({ kind: schema.handbookEntries.kind, id: schema.handbookEntries.id, version: schema.handbookEntries.version }).from(schema.handbookEntries).all();
  return new Map(rows.map((r) => [`${r.kind}:${r.id}`, r.version]));
}

/** `["term:change-request"]` → `[{ kind: "term", id: "change-request", version }]`. An unknown entry is cited at version 0. */
export function citedRefs(refs: readonly string[] | undefined, versions: Map<string, number>): { id: string; kind: string; version: number }[] {
  return (refs ?? []).map((ref) => {
    const [kind, id] = ref.split(":") as [string, string];
    return { kind, id, version: versions.get(ref) ?? 0 };
  });
}

export function toColumns(item: BankItem) {
  return {
    id: item.id,
    departmentId: item.departmentId,
    skillId: item.skillId,
    trackId: item.trackId,
    stackId: item.stackId,
    language: item.coding?.language ?? item.mcq?.snippetLanguage ?? null,
    type: item.type,
    difficulty: item.difficulty,
    prompt: item.prompt,
    coding: item.coding,
    mcq: item.mcq,
    task: item.task,
    estMinutes: item.estMinutes,
    tags: item.tags ?? [],
    estSeconds: estimateSeconds(item),
  };
}

type Row = typeof schema.questionBank.$inferSelect;

export function fromRow(row: Row): BankItemRow {
  return {
    id: row.id,
    departmentId: row.departmentId,
    skillId: row.skillId,
    trackId: row.trackId,
    stackId: row.stackId,
    type: row.type,
    difficulty: row.difficulty,
    estMinutes: row.estMinutes,
    prompt: row.prompt,
    coding: (row.coding as BankItem["coding"]) ?? null,
    mcq: (row.mcq as BankItem["mcq"]) ?? null,
    task: (row.task as BankItem["task"]) ?? null,
    tags: row.tags ?? [],
    ...(row.handbookRefs?.length ? { handbookRefs: row.handbookRefs.map((r) => `${r.kind}:${r.id}`) } : {}),
    status: row.status,
    source: row.source,
    timesUsed: row.timesUsed,
    meanScore: row.timesScored > 0 ? row.scoreSum / row.timesScored : null,
    discrimination: row.discrimination,
    retiredReason: row.retiredReason,
    validatedAt: row.validatedAt,
    updatedAt: row.updatedAt,
  };
}

/** Every active item of a department: the assembler's whole universe. */
/**
 * Active items of a department. v4.4: `otherSkillIds` also brings in items of those skills from
 * any other department, for skills a learner may use across departments (the soft-skills area).
 */
export function activeItems(db: Db, departmentId: string, otherSkillIds: Iterable<string> = []): BankItemRow[] {
  const extra = [...new Set(otherSkillIds)];
  const live = and(eq(schema.questionBank.status, "active"), eq(schema.questionBank.flaggedSlow, false));
  const own = db.select().from(schema.questionBank).where(and(eq(schema.questionBank.departmentId, departmentId), live)).all();
  const others = extra.length
    ? db
        .select()
        .from(schema.questionBank)
        .where(and(inArray(schema.questionBank.skillId, extra), ne(schema.questionBank.departmentId, departmentId), live))
        .all()
    : [];
  return [...own, ...others].map(fromRow);
}

/** Bank items this learner has already been served, in any earlier sitting. */
export function seenItemIds(db: Db, userId: string): Set<string> {
  const assessments = db
    .select({ id: schema.assessments.id })
    .from(schema.assessments)
    .where(eq(schema.assessments.userId, userId))
    .all()
    .map((a) => a.id);
  if (assessments.length === 0) return new Set();
  return new Set(
    db
      .select({ bankItemId: schema.assessmentItems.bankItemId })
      .from(schema.assessmentItems)
      .where(inArray(schema.assessmentItems.assessmentId, assessments))
      .all()
      .map((r) => r.bankItemId)
      .filter((id): id is string => id != null),
  );
}
