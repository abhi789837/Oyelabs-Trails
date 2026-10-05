import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { bankItemSchema, codingSpecSchema, mcqSpecSchema, type BankItem } from "../../../shared/bank";
import { taskSchema } from "../../../shared/tasks";
import { onBatchComplete, submitOrRun } from "../ai/batches";
import type { AiService } from "../ai/service";
import { getSkill } from "../catalog/repo";
import type { Db } from "../db";
import * as schema from "../db/schema";
import type { Job } from "../jobs/queue";
import { now } from "../lib/ids";
import type { PolyglotDeps } from "../sandbox/polyglot";
import { fromRow, toColumns } from "./repo";
import { validateBankItem } from "./validate";

/**
 * `bank.fill` (v4 Phase 5): generate the items a thin skill is missing, **once, for everyone**.
 *
 * The model writes candidates; nothing it writes is trusted. Each candidate is parsed against the
 * bank schema and validated exactly like a seed item (reference passes every test, starter fails
 * one) before it is inserted as `active` with `source = generated`. Failures are dropped and
 * counted. With no AI credential the job ends quietly: the assessment already went out with what
 * the bank had, and the admin page shows the skill as thin.
 */

export interface BankFillDeps extends PolyglotDeps {
  db: Db;
  ai: AiService;
  log?: (message: string) => void;
}

const payloadSchema = z.object({ departmentId: z.string(), skillId: z.string(), type: z.enum(["coding", "mcq", "task"]), missing: z.number().optional() });

const candidateSchema = z.object({
  items: z
    .array(
      z.object({
        difficulty: z.number().int().min(1).max(4),
        estMinutes: z.number().min(0.5).max(4),
        prompt: z.string().min(10).max(3000),
        coding: codingSpecSchema.nullable(),
        mcq: mcqSpecSchema.nullable(),
        task: taskSchema.nullable(),
      }),
    )
    .min(1)
    .max(12),
});

export const BANK_FILL_SYSTEM = `You write assessment items for a software agency's internal skills platform.
Items are small and practical, never tricky: a coding item takes 1-2 minutes (complete a function, fix
one or two lines, make the output match). Difficulty 1 = first week on the job, 4 = senior.
Rules:
- coding: language + mode exactly as instructed. "function" mode: tests are {"args":[...],"expected":...}
  (plain JSON). "program" mode: {"stdin":"...","expected":"stdout"}. "sql" mode (SQLite):
  {"setup":"CREATE...;INSERT...;","expected":[{row}]} with ORDER BY for determinism.
  starterCode must FAIL at least one hidden test; referenceSolution must pass ALL tests.
  1-2 sampleTests, 3-6 hiddenTests including an edge case. Mark every test "tier": "core" (the job
  itself; at least 2 core) or "edge" (a boundary case: empty input, zero, huge values). No randomness, clocks or network.
- mcq: 3-5 options, one correctIndex, an explanation; options are shuffled, never refer to positions.
  Put code the learner can run in "snippet" with "snippetLanguage".
- task: one of rank/calculate/scenario/spot (or write only when asked), per the schema.
Only the field matching the requested type is non-null. Return JSON only.`;

export function bankFillHandler(deps: BankFillDeps) {
  registerCompletion(deps);
  return async (job: Job): Promise<void> => {
    const { departmentId, skillId, type, missing } = payloadSchema.parse(job.payload);
    const skill = getSkill(deps.db, skillId);
    if (!skill) return;
    if (!deps.ai.isConfigured()) {
      deps.log?.(`bank.fill ${skillId}/${type}: no AI credential; left thin`);
      return;
    }

    const examples = deps.db
      .select()
      .from(schema.questionBank)
      .where(and(eq(schema.questionBank.skillId, skillId), eq(schema.questionBank.type, type), eq(schema.questionBank.status, "active")))
      .limit(2)
      .all()
      .map(fromRow)
      .map(({ difficulty, prompt, coding, mcq, task }) => ({ difficulty, prompt, coding, mcq, task }));

    const want = Math.min(12, Math.max(3, missing ?? 6));
    const language = skill.language ?? "javascript";
    const mode = language === "sql" ? "sql" : language === "java" || language === "dart" ? "program" : "function";
    const user = [
      `Skill: ${skill.name} (${skill.area}). Also known as: ${skill.aliases.join(", ") || "-"}.`,
      `Department: ${departmentId}. Write ${want} ${type} items, difficulties spread across 1-4.`,
      type === "coding" ? `Language: ${language}, mode: ${mode}.` : "",
      type === "task" && departmentId === "engineering" ? "Use spot, rank or scenario tasks only (no write)." : "",
      examples.length ? `Existing items (match the style, do not repeat them):\n${JSON.stringify(examples).slice(0, 6000)}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const mode2 = await submitOrRun(deps.ai, deps.db, "bank_fill", [
      { customId: `${skillId}-${type}`.slice(0, 64), purpose: "bank_fill", task: "bank_fill", system: BANK_FILL_SYSTEM, user, schema: candidateSchema },
    ], { departmentId, skillId, type });
    deps.log?.(`bank.fill ${skillId}/${type}: ${mode2 === "batched" ? "submitted as a batch" : "generated"}`);
  };
}

/** Finishes a fill: every candidate is schema-checked and validated before it may go live. */
export async function insertCandidates(
  deps: BankFillDeps,
  context: { departmentId: string; skillId: string; type: "coding" | "mcq" | "task" },
  candidates: z.infer<typeof candidateSchema>["items"],
): Promise<{ added: number; dropped: number }> {
  const { departmentId, skillId, type } = context;
  const existingIds = new Set(deps.db.select({ id: schema.questionBank.id }).from(schema.questionBank).where(eq(schema.questionBank.skillId, skillId)).all().map((r) => r.id));
  let added = 0;
  let dropped = 0;
  for (const [index, candidate] of candidates.entries()) {
    let n = existingIds.size + index + 1;
    let id = `${skillId}-g${type[0]}${candidate.difficulty}-${n}`;
    while (existingIds.has(id)) id = `${skillId}-g${type[0]}${candidate.difficulty}-${++n}`;
    const parsed = bankItemSchema.safeParse({ ...candidate, id, departmentId, skillId, type, trackId: null, stackId: null });
    if (!parsed.success) {
      dropped += 1;
      continue;
    }
    const item: BankItem = parsed.data;
    const problems = await validateBankItem(deps, item).catch((error: unknown) => [String(error)]);
    if (problems.length) {
      dropped += 1;
      continue;
    }
    const at = now();
    deps.db
      .insert(schema.questionBank)
      .values({ ...toColumns(item), status: "active", source: "generated", validatedAt: at, createdAt: at, updatedAt: at })
      .onConflictDoNothing()
      .run();
    existingIds.add(id);
    added += 1;
  }
  deps.log?.(`bank.fill ${skillId}/${type}: ${added} added, ${dropped} dropped by validation`);
  return { added, dropped };
}

/** Wires the batch completion for `bank_fill`. Called once when the handler is built. */
function registerCompletion(deps: BankFillDeps): void {
  onBatchComplete("bank_fill", candidateSchema, async (_db, context, results) => {
    for (const result of results) {
      if (!result.data) continue;
      await insertCandidates(deps, context as Parameters<typeof insertCandidates>[1], (result.data as z.infer<typeof candidateSchema>).items);
    }
  });
}
