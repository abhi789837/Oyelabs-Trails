import type { ZodType } from "zod";

import type { AiPurpose, ProviderId } from "../../../shared/enums";

/**
 * The AI layer's contract (brief §8.2).
 *
 * Every call is structured: a zod schema goes in, validated data comes out. Nothing in the
 * assessment pipeline parses free-form prose, because an item pool or a learning plan has to be
 * machine-checkable before it can be trusted.
 */

export interface GenerateJsonRequest<T> {
  purpose: AiPurpose;
  system: string;
  user: string;
  /** Converted to JSON Schema for the provider, and used to validate what comes back. */
  schema: ZodType<T>;
  /** A short name for the schema. Some providers require one. */
  schemaName?: string;
  model?: string;
  maxOutputTokens?: number;
  /** Default 120 s. Evaluation is allowed up to 480 s (brief §8.2). */
  timeoutMs?: number;
  meta: { subjectUserId?: string | undefined; assessmentId?: string | undefined };
}

export interface GenerateJsonResult<T> {
  data: T;
  usage: { input: number; output: number };
  latencyMs: number;
  model: string;
}

export interface AiProvider {
  id: ProviderId;
  /** The model used when a request does not name one. */
  defaultModel(purpose: AiPurpose): string;
  generateJson<T>(request: GenerateJsonRequest<T>): Promise<GenerateJsonResult<T>>;
  /** A tiny structured call, to prove the credential works. Throws on failure. */
  verify(): Promise<void>;
}

/** The model returned something that does not match the schema, twice. */
export class AiOutputError extends Error {
  constructor(
    message: string,
    readonly issues: string[],
    readonly raw?: string,
  ) {
    super(message);
    this.name = "AiOutputError";
  }
}

/** The provider rejected the credential, or refused the request. */
export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly retryable = false,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

export const DEFAULT_TIMEOUT_MS = 120_000;
export const EVALUATION_TIMEOUT_MS = 480_000;
export const DEFAULT_MAX_OUTPUT_TOKENS = 16_000;

/**
 * Suggested defaults (brief §8.2). The admin can override each one in `ai_settings`; these are
 * only what a fresh install starts with.
 */
export const SUGGESTED_MODELS: Record<ProviderId, { generation: string; critic: string; evaluation: string }> = {
  "anthropic-api": { generation: "claude-sonnet-5", critic: "claude-sonnet-5", evaluation: "claude-opus-5-5" },
  "openai-api": { generation: "gpt-5.1", critic: "gpt-5.1", evaluation: "gpt-5.1" },
  "claude-cli": { generation: "claude-sonnet-5", critic: "claude-sonnet-5", evaluation: "claude-opus-5-5" },
  "codex-cli": { generation: "gpt-5.1-codex", critic: "gpt-5.1-codex", evaluation: "gpt-5.1-codex" },
  mock: { generation: "mock-1", critic: "mock-1", evaluation: "mock-1" },
};

export function modelFor(
  provider: ProviderId,
  purpose: AiPurpose,
  overrides: { generation?: string | null; critic?: string | null; evaluation?: string | null },
): string {
  const suggested = SUGGESTED_MODELS[provider];
  switch (purpose) {
    case "item_critic":
      return overrides.critic || suggested.critic;
    case "evaluation":
      return overrides.evaluation || suggested.evaluation;
    default:
      return overrides.generation || suggested.generation;
  }
}
