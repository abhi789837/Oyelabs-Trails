import { and, asc, eq } from "drizzle-orm";

import { normaliseSkillText } from "../../../shared/catalog";
import { capstoneSchema, practicalOutcomeSeedSchema, type OutcomeOption, type PracticalOutcome, type PracticalOutcomeSeed } from "../../../shared/goals";
import { checkTask, taskSchema } from "../../../shared/tasks";
import type { Db } from "../db";
import * as schema from "../db/schema";
import { now } from "../lib/ids";
import BD_OUTCOMES from "./seed/bd";
import ENGINEERING_OUTCOMES from "./seed/engineering";
import PM_OUTCOMES from "./seed/pm";
import SOFT_OUTCOMES from "./seed/soft";

/**
 * The practical-outcomes library ("Resolve a merge conflict and open a clean PR"), per department.
 *
 * Seeds live in ./seed/{engineering,pm,bd,soft}.ts (v4.4: `soft` is an area; its cases are offered to
 * every department through `listUsableOutcomes`). At boot each entry is validated — the schema, its
 * skills against the department's catalog, its capstone (a task `checkTask` accepts, or a topic id)
 * — and upserted by id. An invalid entry is skipped with a warning; boot never fails on a seed.
 */

export const OUTCOME_SEEDS: readonly unknown[] = [...(ENGINEERING_OUTCOMES as unknown[]), ...(PM_OUTCOMES as unknown[]), ...(BD_OUTCOMES as unknown[]), ...(SOFT_OUTCOMES as unknown[])];

export interface SeedReport {
  upserted: number;
  skipped: { id: string; reason: string }[];
}

/** Why a seed entry cannot be used, or null. `topicExists` is optional: topics are checked when known. */
export function seedProblem(seed: PracticalOutcomeSeed, skillDepartment: ReadonlyMap<string, string>, topicExists?: (id: string) => boolean): string | null {
  const wrong = seed.skillIds.find((id) => skillDepartment.get(id) !== seed.departmentId);
  if (wrong) return `skill ${wrong} is not in the ${seed.departmentId} catalog`;
  const capstone = capstoneSchema.parse(seed.capstone);
  if (capstone.kind === "task") {
    const parsed = taskSchema.safeParse(capstone.task);
    if (!parsed.success) return `capstone task is invalid (${parsed.error.issues[0]?.path.join(".")}: ${parsed.error.issues[0]?.message})`;
    const problems = checkTask(parsed.data);
    if (problems.length) return `capstone task: ${problems[0]}`;
  } else if (topicExists && !topicExists(capstone.topicId)) {
    return `capstone topic ${capstone.topicId} does not exist`;
  }
  return null;
}

export function ensureOutcomeSeed(db: Db, seeds: readonly unknown[] = OUTCOME_SEEDS, options: { topicExists?: (id: string) => boolean; log?: (line: string) => void } = {}): SeedReport {
  const log = options.log ?? ((line: string) => console.warn(line));
  const skillDepartment = new Map(db.select({ id: schema.skills.id, departmentId: schema.skills.departmentId }).from(schema.skills).all().map((s) => [s.id, s.departmentId]));
  const report: SeedReport = { upserted: 0, skipped: [] };
  const positions = new Map<string, number>();
  const seen = new Set<string>();
  const at = now();
  db.transaction((tx) => {
    for (const raw of seeds) {
      const parsed = practicalOutcomeSeedSchema.safeParse(raw);
      const id = typeof (raw as { id?: unknown })?.id === "string" ? (raw as { id: string }).id : "(no id)";
      if (!parsed.success) {
        report.skipped.push({ id, reason: `${parsed.error.issues[0]?.path.join(".")}: ${parsed.error.issues[0]?.message}` });
        continue;
      }
      const seed = parsed.data;
      if (seen.has(seed.id)) {
        report.skipped.push({ id, reason: "duplicate id" });
        continue;
      }
      const problem = seedProblem(seed, skillDepartment, options.topicExists);
      if (problem) {
        report.skipped.push({ id, reason: problem });
        continue;
      }
      seen.add(seed.id);
      const position = positions.get(seed.departmentId) ?? 0;
      positions.set(seed.departmentId, position + 1);
      const row = {
        departmentId: seed.departmentId,
        title: seed.title,
        statement: seed.statement,
        skillIds: seed.skillIds,
        level: seed.level,
        aliases: seed.aliases,
        capstone: seed.capstone as Record<string, unknown>,
        position,
        updatedAt: at,
      };
      tx.insert(schema.practicalOutcomes)
        .values({ id: seed.id, ...row, status: "active" })
        .onConflictDoUpdate({ target: schema.practicalOutcomes.id, set: row })
        .run();
      report.upserted += 1;
    }
  });
  for (const s of report.skipped) log(`[oyelearn] practical outcome ${s.id} skipped: ${s.reason}`);
  return report;
}

type OutcomeRow = typeof schema.practicalOutcomes.$inferSelect;

export function toOutcome(row: OutcomeRow): PracticalOutcome {
  return {
    id: row.id,
    departmentId: row.departmentId,
    title: row.title,
    statement: row.statement,
    skillIds: row.skillIds,
    level: row.level,
    aliases: row.aliases,
    capstone: capstoneSchema.parse(row.capstone),
    status: row.status,
    position: row.position,
  };
}

export function toOutcomeOption(outcome: PracticalOutcome): OutcomeOption {
  return {
    id: outcome.id,
    title: outcome.title,
    statement: outcome.statement,
    skillIds: outcome.skillIds,
    level: outcome.level,
    aliases: outcome.aliases,
    capstoneTitle: outcome.capstone.title,
  };
}

export function listOutcomes(db: Db, departmentId: string): PracticalOutcome[] {
  return db
    .select()
    .from(schema.practicalOutcomes)
    .where(and(eq(schema.practicalOutcomes.departmentId, departmentId), eq(schema.practicalOutcomes.status, "active")))
    .orderBy(asc(schema.practicalOutcomes.position))
    .all()
    .map(toOutcome);
}

/**
 * v4.4: the cases a learner in `departmentId` can be given: their own department's, then every area
 * department's (Soft skills), in that order. For an area department itself, just its own cases.
 */
export function listUsableOutcomes(db: Db, departmentId: string): PracticalOutcome[] {
  const areas = db
    .select({ id: schema.departments.id })
    .from(schema.departments)
    .where(eq(schema.departments.kind, "area"))
    .orderBy(asc(schema.departments.position))
    .all()
    .map((d) => d.id)
    .filter((id) => id !== departmentId);
  return [departmentId, ...areas].flatMap((id) => listOutcomes(db, id));
}

export function getOutcome(db: Db, id: string): PracticalOutcome | null {
  const row = db.select().from(schema.practicalOutcomes).where(eq(schema.practicalOutcomes.id, id)).get();
  return row ? toOutcome(row) : null;
}

/**
 * Ranks a department's outcomes for a query: title or alias exact, then prefix, then every word in
 * the title, statement or aliases. An empty query returns the library in order.
 */
export function searchOutcomes<T extends Pick<PracticalOutcome, "title" | "statement" | "aliases">>(outcomes: readonly T[], query: string): T[] {
  const q = normaliseSkillText(query);
  if (!q) return [...outcomes];
  const words = q.split(" ").filter((w) => w.length > 1);
  const scored: { outcome: T; score: number; index: number }[] = [];
  outcomes.forEach((outcome, index) => {
    const names = [outcome.title, ...outcome.aliases].map(normaliseSkillText);
    const all = normaliseSkillText([outcome.title, outcome.statement, ...outcome.aliases].join(" "));
    let score = 0;
    if (names.some((n) => n === q)) score = 100;
    else if (names.some((n) => n.startsWith(q))) score = 80;
    else if (words.length && words.every((w) => all.includes(w))) score = 60;
    else {
      const hits = words.filter((w) => all.includes(w)).length;
      if (words.length && hits / words.length >= 0.6) score = 30 + hits;
    }
    if (score > 0) scored.push({ outcome, score, index });
  });
  return scored.sort((a, b) => b.score - a.score || a.index - b.index).map((s) => s.outcome);
}
