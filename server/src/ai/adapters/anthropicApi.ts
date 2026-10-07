import Anthropic from "@anthropic-ai/sdk";

import type { AiPurpose } from "../../../../shared/enums";
import { describeIssues, extractJson, toProviderJsonSchema } from "../jsonSchema";
import {
  AiOutputError,
  AiProviderError,
  DEFAULT_MAX_OUTPUT_TOKENS,
  DEFAULT_TIMEOUT_MS,
  SUGGESTED_MODELS,
  type AiProvider,
  type GenerateJsonRequest,
  type GenerateJsonResult,
  type WebSearchRequest,
  type WebSearchResult,
} from "../types";
import { isoOrNull, normaliseHits, searchInstruction } from "./webSearch";

/**
 * v4.5.1: the server-side web search tool. `web_search_20250305` is the basic version: no code
 * execution needed, and every current Claude model accepts it. (The 2026 versions add dynamic
 * filtering through code execution, which a plain "find me sources" call doesn't need.)
 */
export const ANTHROPIC_WEB_SEARCH_TOOL = "web_search_20250305" as const;

/**
 * The recommended adapter (brief §8.1): a company Console API key with a spending cap.
 *
 * Structured output is requested through `output_config.format`, so the model is constrained to
 * the schema rather than asked nicely for JSON. Validation still happens here, because a
 * constrained model can still produce a schema-valid document with unusable content (an empty
 * array, a topic id that does not exist), and only our zod schema knows the difference.
 */
export class AnthropicApiProvider implements AiProvider {
  readonly id = "anthropic-api" as const;
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    private readonly models: { generation?: string | null; critic?: string | null; evaluation?: string | null } = {},
  ) {
    this.client = new Anthropic({ apiKey, maxRetries: 0 });
  }

  defaultModel(purpose: AiPurpose): string {
    const suggested = SUGGESTED_MODELS["anthropic-api"];
    if (purpose === "item_critic") return this.models.critic || suggested.critic;
    if (purpose === "evaluation") return this.models.evaluation || suggested.evaluation;
    return this.models.generation || suggested.generation;
  }

  async generateJson<T>(request: GenerateJsonRequest<T>): Promise<GenerateJsonResult<T>> {
    const model = request.model ?? this.defaultModel(request.purpose);
    const schema = toProviderJsonSchema(request.contractSchema ?? request.schema);
    const started = Date.now();

    let usageIn = 0;
    let usageOut = 0;
    let cacheRead = 0;
    let cacheWrite = 0;

    const call = async (messages: Anthropic.MessageParam[]): Promise<string> => {
      try {
        const response = await this.client.messages.create(
          {
            model,
            max_tokens: request.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
            // The static instructions are the cacheable prefix (v4 Phase 6). Below the model's
            // minimum length the marker is simply ignored, so it is safe to always send.
            system: [{ type: "text", text: request.system, cache_control: { type: "ephemeral" } }],
            messages,
            output_config: { format: { type: "json_schema", schema } },
          },
          { timeout: request.timeoutMs ?? DEFAULT_TIMEOUT_MS },
        );

        usageIn += response.usage.input_tokens;
        usageOut += response.usage.output_tokens;
        cacheRead += response.usage.cache_read_input_tokens ?? 0;
        cacheWrite += response.usage.cache_creation_input_tokens ?? 0;

        const text = response.content
          .filter((block): block is Anthropic.TextBlock => block.type === "text")
          .map((block) => block.text)
          .join("");
        if (!text.trim()) throw new AiProviderError(`${model} returned an empty response.`);
        return text;
      } catch (error) {
        throw toProviderError(error);
      }
    };

    const first = await call([{ role: "user", content: request.user }]);
    const parsed = this.parse(request, first);
    if (parsed.ok) {
      return { data: parsed.data, usage: { input: usageIn, output: usageOut, cacheRead, cacheWrite }, latencyMs: Date.now() - started, model };
    }

    // One repair turn, naming the exact paths that failed (brief §8.2, D9).
    const repaired = await call([
      { role: "user", content: request.user },
      { role: "assistant", content: first },
      {
        role: "user",
        content: `That response did not match the required schema:\n${parsed.issues.map((i) => `- ${i}`).join("\n")}\n\nReturn the corrected JSON only.`,
      },
    ]);
    const second = this.parse(request, repaired);
    if (second.ok) {
      return { data: second.data, usage: { input: usageIn, output: usageOut, cacheRead, cacheWrite }, latencyMs: Date.now() - started, model };
    }

    throw new AiOutputError(`${model} returned output that did not match the schema, twice.`, second.issues, repaired.slice(0, 4000));
  }

  private parse<T>(
    request: GenerateJsonRequest<T>,
    text: string,
  ): { ok: true; data: T } | { ok: false; issues: string[] } {
    let value: unknown;
    try {
      value = JSON.parse(extractJson(text));
    } catch (error) {
      return { ok: false, issues: [`The response was not valid JSON: ${error instanceof Error ? error.message : String(error)}`] };
    }
    const result = request.schema.safeParse(value);
    return result.success ? { ok: true, data: result.data } : { ok: false, issues: describeIssues(result.error) };
  }

  /**
   * v4.5.1: one search with Anthropic's server-side web search tool. The results come back as
   * `web_search_tool_result` blocks (URL, title, page age); the model's own text is ignored, so a
   * URL can only come from the search itself. An organisation that has web search turned off in
   * the Console gets a 400 here, which the builder treats as "no web search" and carries on.
   */
  async webSearch(request: WebSearchRequest): Promise<WebSearchResult> {
    const model = request.model ?? this.defaultModel("course_research");
    const started = Date.now();
    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create(
        {
          model,
          max_tokens: request.maxOutputTokens ?? 1500,
          system: "You find sources for a training course. Search once, then answer in one short line.",
          messages: [{ role: "user", content: searchInstruction(request.query, request.limit) }],
          tools: [{ type: ANTHROPIC_WEB_SEARCH_TOOL, name: "web_search", max_uses: 1 }],
        },
        { timeout: request.timeoutMs ?? 120_000 },
      );
    } catch (error) {
      throw toProviderError(error);
    }
    const raw: { url: string; title: string; snippet: string; publishedAt: string | null }[] = [];
    for (const block of response.content) {
      if (block.type !== "web_search_tool_result") continue;
      if (!Array.isArray(block.content)) {
        const code = block.content.error_code;
        throw new AiProviderError(`web search failed: ${code}`, undefined, code === "too_many_requests" || code === "unavailable");
      }
      for (const result of block.content) raw.push({ url: result.url, title: result.title, snippet: "", publishedAt: isoOrNull(result.page_age) });
    }
    return {
      hits: normaliseHits(raw, request.limit),
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        cacheRead: response.usage.cache_read_input_tokens ?? 0,
        cacheWrite: response.usage.cache_creation_input_tokens ?? 0,
      },
      searches: response.usage.server_tool_use?.web_search_requests ?? 0,
      latencyMs: Date.now() - started,
      model,
    };
  }

  /** Model ids this key can use, from the Models API. */
  async listModels(): Promise<string[]> {
    const ids: string[] = [];
    for await (const model of this.client.models.list({ limit: 100 })) ids.push(model.id);
    return ids;
  }

  /** The Anthropic client, for the Message Batches path (`ai/batches.ts`). */
  get raw(): Anthropic {
    return this.client;
  }

  async verify(): Promise<void> {
    const response = await this.client.messages
      .create(
        {
          model: this.defaultModel("verify"),
          max_tokens: 64,
          system: "Reply with the requested JSON and nothing else.",
          messages: [{ role: "user", content: 'Return {"ok": true}.' }],
          output_config: {
            format: {
              type: "json_schema",
              schema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"], additionalProperties: false },
            },
          },
        },
        { timeout: 30_000 },
      )
      .catch((error: unknown) => {
        throw toProviderError(error);
      });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");
    const parsed = JSON.parse(extractJson(text)) as { ok?: unknown };
    if (parsed.ok !== true) throw new AiProviderError("The provider replied, but not with the expected result.");
  }
}

/** Normalises SDK errors so the retry policy and the admin UI see one shape. */
export function toProviderError(error: unknown): AiProviderError {
  if (error instanceof AiProviderError) return error;
  if (error instanceof Anthropic.APIError) {
    const status = error.status ?? 0;
    // 429 and 5xx are worth retrying; 401/403 mean the credential itself is wrong.
    return new AiProviderError(error.message, status, status === 429 || status >= 500);
  }
  if (error instanceof Error) {
    const retryable = /timeout|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up/i.test(error.message);
    return new AiProviderError(error.message, undefined, retryable);
  }
  return new AiProviderError(String(error));
}
