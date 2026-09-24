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
} from "../types";

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

    const call = async (messages: Anthropic.MessageParam[]): Promise<string> => {
      try {
        const response = await this.client.messages.create(
          {
            model,
            max_tokens: request.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
            system: request.system,
            messages,
            output_config: { format: { type: "json_schema", schema } },
          },
          { timeout: request.timeoutMs ?? DEFAULT_TIMEOUT_MS },
        );

        usageIn += response.usage.input_tokens;
        usageOut += response.usage.output_tokens;

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
      return { data: parsed.data, usage: { input: usageIn, output: usageOut }, latencyMs: Date.now() - started, model };
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
