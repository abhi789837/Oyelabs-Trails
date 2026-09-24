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
  /**
   * What the model is *asked* for, when that is stricter than what the caller will accept.
   *
   * Item batches are why this exists. The reply is validated element by element so that one
   * malformed item costs that item rather than the whole batch — but the schema sent to the
   * provider must still be the strict one, because it is the only thing that tells the model an
   * item needs a `rationale`. Sending the lenient shape would make the very failure this guards
   * against far more likely. Only the provider's JSON Schema comes from here; validation is
   * always `schema`.
   */
  contractSchema?: ZodType<unknown>;
  /** A short name for the schema. Some providers require one. */
  schemaName?: string;
  model?: string;
  maxOutputTokens?: number;
  /** Default 120 s. Evaluation is allowed up to 480 s (brief §8.2). */
  timeoutMs?: number;
  meta: { subjectUserId?: string | undefined; assessmentId?: string | undefined };
  /**
   * Called after each failed attempt, before the backoff.
   *
   * The retry policy lives inside `AiService`, so without this a caller only ever learns that a
   * call gave up — never that it is on its second try. The generation log wants the difference:
   * a four-minute gap with nothing in it reads as a hang. A watcher may not change what the call
   * does, so anything it throws is swallowed.
   */
  onAttemptFailed?: (attempt: { attempt: number; maxAttempts: number; message: string; willRetry: boolean }) => void;
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

/**
 * How long one AI call may take before it is abandoned.
 *
 * Two minutes was far too short. A single assessment generation is not one call: it is a blueprint,
 * then one item batch per area (eight areas is normal), then an explain batch, then critic passes —
 * a dozen or more round trips. The CLI providers are slower still, because each call starts a
 * process and waits for a model to think, so a batch that an API answers in ninety seconds can take
 * a CLI several minutes.
 *
 * This is a safety net against a hung process, not a service-level target: it should sit well above
 * how long the work actually takes, so that hitting it means something is wrong rather than merely
 * slow. Override with AI_TIMEOUT_MS when a provider or a machine is unusually slow.
 */
export const DEFAULT_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? 900_000);
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
