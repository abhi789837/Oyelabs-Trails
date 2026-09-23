import OpenAI from "openai";

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
} from "../types";

/**
 * OpenAI API key adapter (brief §8.1), using Chat Completions with a strict JSON schema.
 *
 * Strict mode requires every property to be listed in `required` and `additionalProperties: false`
 * everywhere, which a zod-derived schema does not always satisfy (optional fields become
 * non-required). Rather than silently rewrite the schema and change what the model is asked for,
 * this sends `strict: false` and relies on the same zod validation and repair turn the other
 * adapters use — one behaviour for all providers.
 */
export class OpenAiApiProvider implements AiProvider {
  readonly id = "openai-api" as const;
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    private readonly models: { generation?: string | null; critic?: string | null; evaluation?: string | null } = {},
  ) {
    this.client = new OpenAI({ apiKey, maxRetries: 0 });
  }

  defaultModel(purpose: AiPurpose): string {
    const suggested = SUGGESTED_MODELS["openai-api"];
    if (purpose === "item_critic") return this.models.critic || suggested.critic;
    if (purpose === "evaluation") return this.models.evaluation || suggested.evaluation;
    return this.models.generation || suggested.generation;
  }

  async generateJson<T>(request: GenerateJsonRequest<T>): Promise<GenerateJsonResult<T>> {
    const model = request.model ?? this.defaultModel(request.purpose);
    const schema = toProviderJsonSchema(request.schema);
    const started = Date.now();

    let usageIn = 0;
    let usageOut = 0;

    const call = async (messages: OpenAI.Chat.ChatCompletionMessageParam[]): Promise<string> => {
      try {
        const response = await this.client.chat.completions.create(
          {
            model,
            messages: [{ role: "system", content: request.system }, ...messages],
            max_completion_tokens: request.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
            response_format: {
              type: "json_schema",
              json_schema: { name: request.schemaName ?? "result", schema, strict: false },
            },
          },
          { timeout: request.timeoutMs ?? DEFAULT_TIMEOUT_MS },
        );

        usageIn += response.usage?.prompt_tokens ?? 0;
        usageOut += response.usage?.completion_tokens ?? 0;

        const text = response.choices[0]?.message?.content ?? "";
        if (!text.trim()) throw new AiProviderError(`${model} returned an empty response.`);
        return text;
      } catch (error) {
        throw toProviderError(error);
      }
    };

    const first = await call([{ role: "user", content: request.user }]);
    const parsed = this.parse(request, first);
    if (parsed.ok) {
      return { data: parsed.data, usage: { input: usageIn, output: usageOut }, latencyMs: Date.now() - started, model };
    }

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
      return { data: second.data, usage: { input: usageIn, output: usageOut }, latencyMs: Date.now() - started, model };
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

  async verify(): Promise<void> {
    const response = await this.client.chat.completions
      .create(
        {
          model: this.defaultModel("verify"),
          messages: [
            { role: "system", content: "Reply with the requested JSON and nothing else." },
            { role: "user", content: 'Return {"ok": true}.' },
          ],
          max_completion_tokens: 64,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "verify",
              schema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"], additionalProperties: false },
              strict: true,
            },
          },
        },
        { timeout: 30_000 },
      )
      .catch((error: unknown) => {
        throw toProviderError(error);
      });

    const parsed = JSON.parse(extractJson(response.choices[0]?.message?.content ?? "")) as { ok?: unknown };
    if (parsed.ok !== true) throw new AiProviderError("The provider replied, but not with the expected result.");
  }
}

function toProviderError(error: unknown): AiProviderError {
  if (error instanceof AiProviderError) return error;
  if (error instanceof OpenAI.APIError) {
    const status = error.status ?? 0;
    return new AiProviderError(error.message, status, status === 429 || status >= 500);
  }
  if (error instanceof Error) {
    const retryable = /timeout|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up/i.test(error.message);
    return new AiProviderError(error.message, undefined, retryable);
  }
  return new AiProviderError(String(error));
}
