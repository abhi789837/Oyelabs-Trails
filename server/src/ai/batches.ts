import { eq } from "drizzle-orm";
import type { ZodType } from "zod";

import { taskForPurpose, type AiTask } from "../../../shared/aiRouting";
import type { AiPurpose } from "../../../shared/enums";
import type { Db } from "../db";
import * as schema from "../db/schema";
import { enqueue, type Job } from "../jobs/queue";
import { newId, now } from "../lib/ids";
import { describeIssues, extractJson, toProviderJsonSchema } from "./jsonSchema";
import { AiBudgetPausedError, budgetStatus, routeFor } from "./router";
import type { AiService } from "./service";

/**
 * The Message Batches path (v4 Phase 6): half price for work nobody is waiting on.
 *
 * Bank gap fills (and anything else marked `batch` in TASK_DEFAULTS) are submitted as a batch and
 * finished by a polling job, which re-queues itself every minute until the batch ends (the API
 * guarantees an answer within 24 hours). Results go to the completion handler registered for the
 * task. Each result is logged in `ai_calls` with `batch = 1` at the discounted price.
 *
 * Only the Anthropic API supports this; `submitOrRun` falls back to a normal call otherwise.
 */

export interface BatchRequest<T> {
  customId: string;
  purpose: AiPurpose;
  task: AiTask;
  system: string;
  user: string;
  schema: ZodType<T>;
  meta?: { subjectUserId?: string; assessmentId?: string; courseId?: string };
}

export type BatchCompletion = (db: Db, context: unknown, results: { customId: string; data: unknown | null; error: string | null }[]) => Promise<void>;

const completions = new Map<string, { schema: ZodType<unknown>; handle: BatchCompletion }>();

/** Registers how a task's batch results are finished. Done once at boot by the owning module. */
export function onBatchComplete(task: AiTask, schemaForResults: ZodType<unknown>, handle: BatchCompletion): void {
  completions.set(task, { schema: schemaForResults, handle });
}

/**
 * Submits the requests as one batch when the provider supports it; otherwise runs them now, one at
 * a time, and hands the results to the same completion handler. Either way the caller is done.
 */
export async function submitOrRun<T>(ai: AiService, db: Db, task: AiTask, requests: BatchRequest<T>[], context: unknown): Promise<"batched" | "ran"> {
  const route = routeFor(db, task);
  if (!route.urgent && budgetStatus(db).paused) throw new AiBudgetPausedError();
  const anthropic = route.batch ? ai.anthropicClient() : null;
  const completion = completions.get(task);
  if (!completion) throw new Error(`No batch completion handler for ${task}.`);

  if (!anthropic) {
    const results = [];
    for (const request of requests) {
      try {
        const result = await ai.generateJson({ purpose: request.purpose, task, system: request.system, user: request.user, schema: request.schema, meta: request.meta ?? {} });
        results.push({ customId: request.customId, data: result.data as unknown, error: null });
      } catch (error) {
        results.push({ customId: request.customId, data: null, error: error instanceof Error ? error.message : String(error) });
      }
    }
    await completion.handle(db, context, results);
    return "ran";
  }

  const batch = await anthropic.client.messages.batches.create({
    requests: requests.map((r) => ({
      custom_id: r.customId,
      params: {
        model: route.model,
        max_tokens: route.maxTokens,
        system: [{ type: "text" as const, text: r.system, cache_control: { type: "ephemeral" as const } }],
        messages: [{ role: "user" as const, content: r.user }],
        output_config: { format: { type: "json_schema" as const, schema: toProviderJsonSchema(r.schema) } },
      },
    })),
  });
  const id = newId();
  db.insert(schema.aiBatches)
    .values({ id, providerBatchId: batch.id, task, model: route.model, context, requestCount: requests.length, createdAt: now() })
    .run();
  enqueue(db, { type: "ai.batch.poll", payload: { batchId: id }, delayMs: 60_000, maxAttempts: 5 });
  return "batched";
}

/** `ai.batch.poll`: checks one batch; re-queues itself until it ends, then finishes it. */
export function batchPollHandler(deps: { db: Db; ai: AiService; log?: (m: string) => void }) {
  return async (job: Job): Promise<void> => {
    const { batchId } = job.payload as { batchId: string };
    const row = deps.db.select().from(schema.aiBatches).where(eq(schema.aiBatches.id, batchId)).get();
    if (!row || row.status !== "submitted") return;
    const anthropic = deps.ai.anthropicClient();
    if (!anthropic) {
      deps.db.update(schema.aiBatches).set({ status: "failed", endedAt: now() }).where(eq(schema.aiBatches.id, batchId)).run();
      return;
    }

    const batch = await anthropic.client.messages.batches.retrieve(row.providerBatchId);
    if (batch.processing_status !== "ended") {
      enqueue(deps.db, { type: "ai.batch.poll", payload: { batchId }, delayMs: 60_000, maxAttempts: 5 });
      return;
    }

    const completion = completions.get(row.task);
    const results: { customId: string; data: unknown | null; error: string | null }[] = [];
    for await (const entry of await anthropic.client.messages.batches.results(row.providerBatchId)) {
      if (entry.result.type !== "succeeded") {
        results.push({ customId: entry.custom_id, data: null, error: entry.result.type });
        continue;
      }
      const message = entry.result.message;
      deps.ai.recordCall({
        credentialId: anthropic.credentialId,
        provider: "anthropic-api",
        model: message.model,
        purpose: row.task === "bank_fill" ? "bank_fill" : "blueprint",
        task: row.task as AiTask,
        meta: {},
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
        cacheReadTokens: message.usage.cache_read_input_tokens ?? 0,
        cacheWriteTokens: message.usage.cache_creation_input_tokens ?? 0,
        batch: true,
        latencyMs: 0,
        ok: true,
      });
      const text = message.content.map((block) => (block.type === "text" ? block.text : "")).join("");
      try {
        const parsed = completion?.schema.safeParse(JSON.parse(extractJson(text)));
        if (parsed && !parsed.success) results.push({ customId: entry.custom_id, data: null, error: describeIssues(parsed.error).join("; ") });
        else results.push({ customId: entry.custom_id, data: parsed?.data ?? null, error: null });
      } catch (error) {
        results.push({ customId: entry.custom_id, data: null, error: error instanceof Error ? error.message : String(error) });
      }
    }
    deps.db.update(schema.aiBatches).set({ status: "ended", endedAt: now() }).where(eq(schema.aiBatches.id, batchId)).run();
    if (completion) await completion.handle(deps.db, row.context, results);
    deps.log?.(`batch ${batchId} (${row.task}) ended: ${results.filter((r) => r.data).length}/${results.length} usable`);
  };
}

export { taskForPurpose };
