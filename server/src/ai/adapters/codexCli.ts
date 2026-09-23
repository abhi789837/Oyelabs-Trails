import fs from "node:fs";
import os from "node:os";
import path from "node:path";

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
 * Codex CLI with a ChatGPT `auth.json` (brief §8.1).
 *
 * Like the Claude CLI adapter, this is behind the shared-use acknowledgement and is not the
 * recommendation: OpenAI's own guidance is that API keys are the right default for automation,
 * and `auth.json` should be treated like a password.
 *
 * The credential is written to a private CODEX_HOME created with mode 0700 and removed after the
 * run, so it is on disk only for the duration of the call and only readable by this user.
 */
export class CodexCliProvider implements AiProvider {
  readonly id = "codex-cli" as const;

  constructor(
    private readonly authJson: string,
    private readonly models: { generation?: string | null; critic?: string | null; evaluation?: string | null } = {},
    private readonly command = "codex",
  ) {}

  defaultModel(purpose: AiPurpose): string {
    const suggested = SUGGESTED_MODELS["codex-cli"];
    if (purpose === "item_critic") return this.models.critic || suggested.critic;
    if (purpose === "evaluation") return this.models.evaluation || suggested.evaluation;
    return this.models.generation || suggested.generation;
  }

  /**
   * `mkdtemp` under the OS temp directory, then chmod 0700. On Windows the mode is a no-op, but
   * the per-user temp directory is already restricted there.
   */
  private async withCodexHome<T>(fn: (home: string) => Promise<T>): Promise<T> {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "trails-codex-"));
    try {
      fs.chmodSync(home, 0o700);
      fs.writeFileSync(path.join(home, "auth.json"), this.authJson, { mode: 0o600 });
      return await fn(home);
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  }

  async generateJson<T>(request: GenerateJsonRequest<T>): Promise<GenerateJsonResult<T>> {
    const model = request.model ?? this.defaultModel(request.purpose);
    const schema = toProviderJsonSchema(request.schema);
    const started = Date.now();

    const prompt = [
      request.system,
      "",
      "Reply with a single JSON document and nothing else — no prose, no code fence.",
      "It must validate against this JSON Schema:",
      JSON.stringify(schema),
      "",
      request.user,
    ].join("\n");

    const run = (text: string) =>
      this.withCodexHome(async (home) => {
        const result = await spawnJson({
          command: this.command,
          // `exec` is the non-interactive mode; sandbox and approval flags keep it from touching
          // the filesystem or waiting for a human.
          args: ["exec", "--json", "--model", model, "--sandbox", "read-only", "--skip-git-repo-check", "-"],
          env: { CODEX_HOME: home },
          input: text,
          timeoutMs: request.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        });

        if (result.code !== 0) {
          throw new AiProviderError(
            `codex exited with an error: ${redact(result.stderr || result.stdout || `exit code ${result.code}`, [this.authJson]).trim()}`,
          );
        }
        return this.extractResult(result.stdout);
      });

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

    throw new AiOutputError("codex returned output that did not match the schema, twice.", second.issues, repaired.text.slice(0, 4000));
  }

  /**
   * `--json` emits newline-delimited events rather than one document. The reply is the last
   * assistant message; usage, when present, is on a token-count event.
   */
  private extractResult(stdout: string): { text: string; usage: { input: number; output: number } } {
    const lines = stdout.split(/\r?\n/).filter((line) => line.trim().startsWith("{"));
    let text = "";
    let input = 0;
    let output = 0;

    for (const line of lines) {
      let event: Record<string, unknown>;
      try {
        event = JSON.parse(line) as Record<string, unknown>;
      } catch {
        continue;
      }

      const message = (event.msg ?? event) as Record<string, unknown>;
      const type = String(message.type ?? "");

      if (type.includes("agent_message") || type === "assistant" || type === "item.completed") {
        const candidate = message.message ?? message.text ?? message.content ?? (message.item as Record<string, unknown>)?.text;
        if (typeof candidate === "string" && candidate.trim()) text = candidate;
      }

      const usage = (message.usage ?? message.token_usage ?? message.info) as Record<string, unknown> | undefined;
      if (usage) {
        input = Number(usage.input_tokens ?? usage.prompt_tokens ?? input) || input;
        output = Number(usage.output_tokens ?? usage.completion_tokens ?? output) || output;
      }
    }

    // If the event shape was not what we expected, fall back to the raw output rather than
    // failing: the JSON we want may still be in there, and the schema check is the real gate.
    return { text: text || stdout, usage: { input, output } };
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
    const { text } = await this.withCodexHome(async (home) => {
      const result = await spawnJson({
        command: this.command,
        args: ["exec", "--json", "--model", this.defaultModel("verify"), "--sandbox", "read-only", "--skip-git-repo-check", "-"],
        env: { CODEX_HOME: home },
        input: 'Reply with exactly {"ok": true} and nothing else.',
        timeoutMs: 90_000,
      });
      if (result.code !== 0) {
        throw new AiProviderError(redact(result.stderr || result.stdout || `codex exited with code ${result.code}`, [this.authJson]).trim());
      }
      return this.extractResult(result.stdout);
    });

    const parsed = JSON.parse(extractJson(text)) as { ok?: unknown };
    if (parsed.ok !== true) throw new AiProviderError("codex replied, but not with the expected result.");
  }
}
