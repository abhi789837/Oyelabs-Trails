import type { AiPurpose } from "../../../../shared/enums";
import { describeIssues, extractJson, toProviderJsonSchema } from "../jsonSchema";
import {
  AiOutputError,
  AiProviderError,
  DEFAULT_TIMEOUT_MS,
  SUGGESTED_MODELS,
  type AiProvider,
  type GenerateJsonRequest,
  type GenerateJsonResult,
} from "../types";
import { redact, spawnJson } from "./spawnJson";

/**
 * Claude Code CLI with a subscription OAuth token (brief §8.1).
 *
 * **This is not the recommended adapter.** Anthropic's Claude Code terms restrict Free/Pro/Max
 * OAuth tokens to Anthropic's own applications; routing other people's requests through a plan
 * credential is not permitted and has been enforced server-side. The admin has to tick the
 * shared-use acknowledgement before this can be saved, the UI carries the warning, and the
 * adapter surfaces Anthropic's own rejection text verbatim so the reason is unambiguous.
 *
 * The token exists only in the spawned process's environment — never on disk, never in a log.
 */
export class ClaudeCliProvider implements AiProvider {
  readonly id = "claude-cli" as const;

  constructor(
    private readonly token: string,
    private readonly models: { generation?: string | null; critic?: string | null; evaluation?: string | null } = {},
    private readonly command = "claude",
  ) {}

  defaultModel(purpose: AiPurpose): string {
    const suggested = SUGGESTED_MODELS["claude-cli"];
    if (purpose === "item_critic") return this.models.critic || suggested.critic;
    if (purpose === "evaluation") return this.models.evaluation || suggested.evaluation;
    return this.models.generation || suggested.generation;
  }

  async generateJson<T>(request: GenerateJsonRequest<T>): Promise<GenerateJsonResult<T>> {
    const model = request.model ?? this.defaultModel(request.purpose);
    const schema = toProviderJsonSchema(request.schema);
    const started = Date.now();

    // The CLI has no structured-output flag, so the schema goes in the prompt. That is weaker
    // than a constrained decode, which is one more reason the API key is the recommendation.
    const prompt = [
      request.system,
      "",
      "Reply with a single JSON document and nothing else — no prose, no code fence.",
      "It must validate against this JSON Schema:",
      JSON.stringify(schema),
      "",
      request.user,
    ].join("\n");

    const run = async (text: string) => {
      const result = await spawnJson({
        command: this.command,
        args: ["-p", "--output-format", "json", "--model", model],
        env: { CLAUDE_CODE_OAUTH_TOKEN: this.token },
        input: text,
        timeoutMs: request.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      });

      if (result.code !== 0) {
        const message = redact(result.stderr || result.stdout || `exit code ${result.code}`, [this.token]).trim();
        // Surface Anthropic's own wording rather than paraphrasing it (brief §8.1).
        if (/only authorized for use with Claude Code/i.test(message)) {
          throw new AiProviderError(
            `Anthropic rejected this credential: "${message}". Subscription tokens may only be used by Claude Code itself. Use an Anthropic API key instead.`,
          );
        }
        throw new AiProviderError(`claude exited with an error: ${message}`);
      }

      return this.extractResult(result.stdout, [this.token]);
    };

    const first = await run(prompt);
    const parsed = this.parse(request, first.text);
    if (parsed.ok) {
      return { data: parsed.data, usage: first.usage, latencyMs: Date.now() - started, model };
    }

    const repaired = await run(
      `${prompt}\n\nYour previous reply did not match the schema:\n${parsed.issues.map((i) => `- ${i}`).join("\n")}\n\nReturn the corrected JSON only.`,
    );
    const second = this.parse(request, repaired.text);
    if (second.ok) {
      return {
        data: second.data,
        usage: { input: first.usage.input + repaired.usage.input, output: first.usage.output + repaired.usage.output },
        latencyMs: Date.now() - started,
        model,
      };
    }

    throw new AiOutputError("claude returned output that did not match the schema, twice.", second.issues, repaired.text.slice(0, 4000));
  }

  /** `--output-format json` wraps the reply in an envelope with usage; fall back to raw text. */
  private extractResult(stdout: string, secrets: string[]): { text: string; usage: { input: number; output: number } } {
    try {
      const envelope = JSON.parse(stdout) as {
        result?: unknown;
        is_error?: boolean;
        usage?: { input_tokens?: number; output_tokens?: number };
      };
      if (envelope.is_error) {
        throw new AiProviderError(redact(String(envelope.result ?? "the CLI reported an error"), secrets));
      }
      const text = typeof envelope.result === "string" ? envelope.result : JSON.stringify(envelope.result);
      return {
        text,
        usage: { input: envelope.usage?.input_tokens ?? 0, output: envelope.usage?.output_tokens ?? 0 },
      };
    } catch (error) {
      if (error instanceof AiProviderError) throw error;
      return { text: stdout, usage: { input: 0, output: 0 } };
    }
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
    const result = await spawnJson({
      command: this.command,
      args: ["-p", "--output-format", "json", "--model", this.defaultModel("verify")],
      env: { CLAUDE_CODE_OAUTH_TOKEN: this.token },
      input: 'Reply with exactly {"ok": true} and nothing else.',
      timeoutMs: 60_000,
    });

    if (result.code !== 0) {
      throw new AiProviderError(redact(result.stderr || result.stdout || `claude exited with code ${result.code}`, [this.token]).trim());
    }
    const { text } = this.extractResult(result.stdout, [this.token]);
    const parsed = JSON.parse(extractJson(text)) as { ok?: unknown };
    if (parsed.ok !== true) throw new AiProviderError("claude replied, but not with the expected result.");
  }
}
