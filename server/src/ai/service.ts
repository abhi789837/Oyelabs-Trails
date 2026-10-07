import { desc, eq, gte, sql } from "drizzle-orm";

import type { AiPurpose, ProviderId } from "../../../shared/enums";
import { schema, type Db } from "../db";
import type { Env } from "../env";
import { newId, now } from "../lib/ids";
import { AnthropicApiProvider } from "./adapters/anthropicApi";
import { ClaudeCliProvider } from "./adapters/claudeCli";
import { CodexCliProvider } from "./adapters/codexCli";
import { MockProvider } from "./adapters/mock";
import { OpenAiApiProvider } from "./adapters/openaiApi";
import { redact } from "./adapters/spawnJson";
import { getSettings, listCredentials, revealSecret, type StoredCredential } from "./credentials";
import { openAiEmbedder } from "../oyelabs/assign/embed";
import { AiBudgetPausedError, budgetStatus, isRoutable, routeFor, storeAvailableModels, warnOnBudget } from "./router";
import { costMicros, taskForPurpose, type AiTask } from "../../../shared/aiRouting";
import { AiOutputError, AiProviderError, type AiProvider, type GenerateJsonRequest, type GenerateJsonResult } from "./types";

/**
 * Limits how many provider calls are in flight at once (brief §8.2).
 *
 * Everyone on a deployment shares one credential, so a burst of assessment generations would hit
 * one rate limit together and fail together. Two at a time keeps generation progressing without
 * turning a shared quota into a queue of 429s.
 */
class Semaphore {
  private active = 0;
  private readonly waiting: (() => void)[] = [];

  constructor(private readonly limit: number) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.limit) await new Promise<void>((resolve) => this.waiting.push(resolve));
    this.active += 1;
    try {
      return await fn();
    } finally {
      this.active -= 1;
      this.waiting.shift()?.();
    }
  }
}

export class AiNotConfiguredError extends Error {
  constructor(message = "No AI credential is set up yet. Add one under Admin → AI connection.") {
    super(message);
    this.name = "AiNotConfiguredError";
  }
}

export interface AiServiceOptions {
  /** Dev/test only: forces the mock provider regardless of what is stored. */
  mock?: MockProvider | null;
}

/**
 * The one way the rest of the server talks to an AI provider.
 *
 * It resolves the active credential, applies the concurrency cap and the retry policy, and writes
 * an `ai_calls` row for every attempt — success or failure. That audit is what makes per-person
 * attribution possible even though the provider only ever sees one shared credential (§8.1).
 */
export class AiService {
  private readonly semaphore = new Semaphore(2);

  constructor(
    private readonly db: Db,
    private readonly env: Env,
    private readonly options: AiServiceOptions = {},
  ) {}

  /** True when a call would succeed as far as configuration is concerned. */
  isConfigured(): boolean {
    if (this.options.mock) return true;
    const settings = getSettings(this.db);
    return Boolean(settings.activeCredentialId);
  }

  /**
   * Builds the provider for a stored credential. Used by the verify job.
   *
   * When a mock is configured (development and tests), it stands in here too. Verification has to
   * behave like every other call: if it built a real client instead, `npm test` would make live
   * HTTPS requests with whatever placeholder secret a test happened to use, and development
   * without a credential would fail differently from development with one.
   */
  providerFor(credential: StoredCredential): AiProvider {
    if (this.options.mock) return this.options.mock;

    const secret = revealSecret(this.db, this.env, credential.id);
    if (secret === null) throw new AiNotConfiguredError("That credential no longer exists.");

    const settings = getSettings(this.db);
    const models = {
      generation: settings.modelGeneration,
      critic: settings.modelCritic,
      evaluation: settings.modelEvaluation,
    };

    switch (credential.provider) {
      case "anthropic-api":
        return new AnthropicApiProvider(secret, models);
      case "openai-api":
        return new OpenAiApiProvider(secret, models);
      case "claude-cli":
        return new ClaudeCliProvider(secret, models);
      case "codex-cli":
        return new CodexCliProvider(secret, models);
      case "mock":
        // Only reachable if a mock credential was somehow stored; production never offers it.
        if (this.env.isProduction) throw new AiNotConfiguredError("The mock provider is not available in production.");
        return new MockProvider();
    }
  }

  /**
   * v4.5 Phase 4: text embeddings (catalog matching) through a stored OpenAI credential, which
   * need not be the active one. Lives here because this is the one place allowed to decrypt a
   * credential. Null with the mock provider or when no usable OpenAI credential is stored; callers
   * then use the local embedder.
   */
  async embedTexts(texts: readonly string[]): Promise<{ model: string; vectors: Float32Array[] } | null> {
    if (this.options.mock) return null;
    const credential = listCredentials(this.db).find((c) => c.provider === "openai-api" && c.status !== "failed");
    const secret = credential ? revealSecret(this.db, this.env, credential.id) : null;
    if (!secret) return null;
    const embedder = openAiEmbedder(secret);
    return { model: embedder.model, vectors: await embedder.embed(texts) };
  }

  /**
   * Scrubs a string of the active credential before it is stored or shown.
   *
   * This exists so the generation log has somewhere honest to send a provider error: an error can
   * quote a command line, and a command line can carry the token. The plaintext is decrypted here
   * and dropped on the next line, so no caller ever holds it — which is the whole point of putting
   * the function here rather than handing the secret out. `redact` is the only scrubber in this
   * codebase; nothing may hand-roll a second one.
   */
  redactSecrets(text: string): string {
    let secrets: string[] = [];
    try {
      const activeId = getSettings(this.db).activeCredentialId;
      const secret = activeId ? revealSecret(this.db, this.env, activeId) : null;
      if (secret) secrets = [secret];
    } catch {
      // Falling through with no secret still strips anything API-key shaped, which is better than
      // refusing to redact at all.
    }
    return redact(text, secrets);
  }

  private activeProvider(): { provider: AiProvider; credentialId: string | null } {
    if (this.options.mock) return { provider: this.options.mock, credentialId: null };

    const settings = getSettings(this.db);
    if (!settings.activeCredentialId) throw new AiNotConfiguredError();

    const row = this.db
      .select()
      .from(schema.aiCredentials)
      .where(eq(schema.aiCredentials.id, settings.activeCredentialId))
      .get();
    if (!row) throw new AiNotConfiguredError();

    return {
      provider: this.providerFor({
        id: row.id,
        provider: row.provider,
        label: row.label,
        secretHint: row.secretHint,
        status: row.status,
        lastVerifiedAt: row.lastVerifiedAt,
        lastError: row.lastError,
        sharedUseAcknowledged: row.sharedUseAcknowledged,
        createdAt: row.createdAt,
      }),
      credentialId: row.id,
    };
  }

  /**
   * Makes a structured call, retrying 429s and 5xx with exponential backoff and jitter.
   *
   * A schema mismatch is deliberately *not* retried here: the adapter already spent a repair turn
   * on it, and rolling the dice again mostly burns tokens. It surfaces as a failed job with a
   * visible reason instead.
   */
  async generateJson<T>(incoming: GenerateJsonRequest<T>): Promise<GenerateJsonResult<T>> {
    const { provider, credentialId } = this.activeProvider();
    const maxAttempts = 3;

    // v4: the router decides the model and the output cap for this task, and the budget decides
    // whether non-urgent work may run at all.
    const task = (incoming.task as AiTask | undefined) ?? taskForPurpose(incoming.purpose);
    const route = routeFor(this.db, task);
    if (!route.urgent && budgetStatus(this.db).paused) throw new AiBudgetPausedError();
    const request: GenerateJsonRequest<T> = {
      ...incoming,
      task,
      model: incoming.model ?? (isRoutable(provider.id) ? route.model : undefined),
      maxOutputTokens: incoming.maxOutputTokens ?? route.maxTokens,
    };

    return this.semaphore.run(async () => {
      let lastError: unknown;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const started = Date.now();
        try {
          const result = await provider.generateJson(request);
          this.recordCall({
            credentialId,
            provider: provider.id,
            model: result.model,
            purpose: request.purpose,
            task,
            meta: request.meta,
            inputTokens: result.usage.input,
            outputTokens: result.usage.output,
            cacheReadTokens: result.usage.cacheRead ?? 0,
            cacheWriteTokens: result.usage.cacheWrite ?? 0,
            latencyMs: result.latencyMs,
            ok: true,
          });
          warnOnBudget(this.db);
          return result;
        } catch (error) {
          lastError = error;
          this.recordCall({
            credentialId,
            provider: provider.id,
            model: request.model ?? provider.defaultModel(request.purpose),
            purpose: request.purpose,
            task,
            meta: request.meta,
            inputTokens: 0,
            outputTokens: 0,
            latencyMs: Date.now() - started,
            ok: false,
            error: errorMessage(error),
          });

          const retryable = error instanceof AiProviderError && error.retryable;
          const willRetry = retryable && attempt < maxAttempts;
          try {
            request.onAttemptFailed?.({ attempt, maxAttempts, message: errorMessage(error), willRetry });
          } catch {
            // A watcher is not allowed to change what the call does.
          }
          if (!willRetry) break;

          // Exponential backoff with full jitter, so two workers that fail together do not
          // retry together.
          const base = 1000 * 2 ** (attempt - 1);
          await sleep(Math.round(base * (0.5 + Math.random() * 0.5)));
        }
      }

      throw lastError instanceof Error ? lastError : new AiProviderError(String(lastError));
    });
  }

  /** Asks the provider which models this credential can use, and stores the list for the router. */
  async refreshModels(): Promise<string[] | null> {
    try {
      const { provider } = this.activeProvider();
      if (!(provider instanceof AnthropicApiProvider)) return null;
      const ids = await provider.listModels();
      storeAvailableModels(this.db, ids);
      return ids;
    } catch {
      return null;
    }
  }

  /** The Anthropic client behind the active credential, for the Message Batches path. Null otherwise. */
  anthropicClient(): { client: import("@anthropic-ai/sdk").default; credentialId: string | null } | null {
    try {
      const { provider, credentialId } = this.activeProvider();
      return provider instanceof AnthropicApiProvider ? { client: provider.raw, credentialId } : null;
    } catch {
      return null;
    }
  }

  recordCall(entry: {
    credentialId: string | null;
    provider: ProviderId;
    model: string;
    purpose: AiPurpose;
    task?: AiTask;
    meta: { subjectUserId?: string | undefined; assessmentId?: string | undefined; courseId?: string | undefined };
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
    batch?: boolean;
    latencyMs: number;
    ok: boolean;
    error?: string;
  }): void {
    this.db
      .insert(schema.aiCalls)
      .values({
        id: newId(),
        credentialId: entry.credentialId,
        provider: entry.provider,
        model: entry.model,
        purpose: entry.purpose,
        subjectUserId: entry.meta.subjectUserId ?? null,
        assessmentId: entry.meta.assessmentId ?? null,
        inputTokens: entry.inputTokens,
        outputTokens: entry.outputTokens,
        task: entry.task ?? null,
        cacheReadTokens: entry.cacheReadTokens ?? 0,
        cacheWriteTokens: entry.cacheWriteTokens ?? 0,
        costMicros: costMicros(entry.model, { input: entry.inputTokens, output: entry.outputTokens, cacheRead: entry.cacheReadTokens, cacheWrite: entry.cacheWriteTokens }, entry.batch),
        courseId: entry.meta.courseId ?? null,
        batch: entry.batch ?? false,
        latencyMs: entry.latencyMs,
        ok: entry.ok,
        // Truncated: a provider error can carry a long body, and the useful part is the start.
        error: entry.error ? entry.error.slice(0, 2000) : null,
        createdAt: now(),
      })
      .run();
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof AiOutputError) return `${error.message} (${error.issues.slice(0, 3).join("; ")})`;
  return error instanceof Error ? error.message : String(error);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface UsageRow {
  purpose: AiPurpose;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  failures: number;
}

/** Usage for the admin's AI page, grouped by purpose over a window. */
export function usageByPurpose(db: Db, sinceMs: number): UsageRow[] {
  return db
    .select({
      purpose: schema.aiCalls.purpose,
      calls: sql<number>`count(*)`,
      inputTokens: sql<number>`coalesce(sum(${schema.aiCalls.inputTokens}), 0)`,
      outputTokens: sql<number>`coalesce(sum(${schema.aiCalls.outputTokens}), 0)`,
      failures: sql<number>`sum(case when ${schema.aiCalls.ok} = 0 then 1 else 0 end)`,
    })
    .from(schema.aiCalls)
    .where(gte(schema.aiCalls.createdAt, sinceMs))
    .groupBy(schema.aiCalls.purpose)
    .all();
}

export function recentCalls(db: Db, limit = 50) {
  return db.select().from(schema.aiCalls).orderBy(desc(schema.aiCalls.createdAt)).limit(limit).all();
}
