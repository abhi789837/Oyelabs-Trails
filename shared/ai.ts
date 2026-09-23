import { z } from "zod";

import { aiPurposeSchema, credentialStatusSchema, providerIdSchema, selectableProviderIds } from "./enums";

export const selectableProviderSchema = z.enum(selectableProviderIds);
export type SelectableProvider = z.infer<typeof selectableProviderSchema>;

/**
 * Providers whose credential is a *subscription* rather than an API key. The brief requires an
 * explicit acknowledgement and a visible warning for these (§8.1), so the rule lives in shared
 * code and both the server and the UI read the same list.
 */
export const SHARED_USE_PROVIDERS: SelectableProvider[] = ["claude-cli", "codex-cli"];

export function requiresSharedUseAcknowledgement(provider: string): boolean {
  return (SHARED_USE_PROVIDERS as string[]).includes(provider);
}

export interface ProviderCopy {
  id: SelectableProvider;
  name: string;
  /** What the admin pastes. */
  secretLabel: string;
  secretHint: string;
  summary: string;
  recommended?: boolean;
  /** Shown above the acknowledgement checkbox, verbatim. */
  policyWarning?: string;
}

/**
 * The provider descriptions and policy warnings shown on Admin → AI connection.
 *
 * The warnings are not decoration. Anthropic restricts Claude subscription OAuth tokens to its own
 * applications and enforces that server-side; OpenAI's guidance is that API keys are the right
 * default for automation and that `auth.json` is a password. Both are reproduced here so an admin
 * choosing a CLI adapter is choosing it knowingly.
 */
export const PROVIDER_COPY: Record<SelectableProvider, ProviderCopy> = {
  "anthropic-api": {
    id: "anthropic-api",
    name: "Anthropic API key",
    secretLabel: "API key",
    secretHint: "Starts with sk-ant-api03-. Create it in the Anthropic Console, on a company account with a spending cap.",
    summary: "The recommended option. Billed per token against a key you control, with a cap you set.",
    recommended: true,
  },
  "openai-api": {
    id: "openai-api",
    name: "OpenAI API key",
    secretLabel: "API key",
    secretHint: "Starts with sk-. Create it in the OpenAI platform dashboard.",
    summary: "Billed per token against a key you control.",
  },
  "claude-cli": {
    id: "claude-cli",
    name: "Claude Code CLI (subscription token)",
    secretLabel: "OAuth token",
    secretHint: "The sk-ant-oat01-… token printed by `claude setup-token`. Requires the claude CLI on the server.",
    summary: "Uses a Claude Pro or Max subscription through the Claude Code CLI.",
    policyWarning:
      "Anthropic's Claude Code terms restrict Free, Pro and Max OAuth tokens to Anthropic's own applications. Routing other people's requests through a plan credential is not permitted, and Anthropic has enforced this server-side since early 2026 — doing it anyway risks the account. Use an Anthropic API key instead unless you have written confirmation otherwise.",
  },
  "codex-cli": {
    id: "codex-cli",
    name: "Codex CLI (ChatGPT auth.json)",
    secretLabel: "auth.json contents",
    secretHint: "The full contents of ~/.codex/auth.json after `codex login --device-auth`. Requires the codex CLI on the server.",
    summary: "Uses a ChatGPT subscription through the Codex CLI.",
    policyWarning:
      "OpenAI's documentation treats auth.json like a password and positions ChatGPT-managed auth for trusted runners, with API keys as the right default for automation. Use an OpenAI API key instead unless you have a specific reason not to.",
  },
};

/** Shown for every provider once a credential is active. */
export const SHARED_CREDENTIAL_NOTICE =
  "Everyone on this deployment shares this credential. They share one usage limit, so when it is reached every learner stops at once, and the provider cannot attribute usage to individuals — the usage table below does that instead, from our own records.";

export const credentialSchema = z.object({
  id: z.string(),
  provider: providerIdSchema,
  label: z.string(),
  /** Last four characters only. The secret itself is never returned after it is saved. */
  secretHint: z.string(),
  status: credentialStatusSchema,
  lastVerifiedAt: z.number().nullable(),
  lastError: z.string().nullable(),
  sharedUseAcknowledged: z.boolean(),
  createdAt: z.number(),
});
export type Credential = z.infer<typeof credentialSchema>;

export const createCredentialRequestSchema = z
  .object({
    provider: selectableProviderSchema,
    label: z.string().trim().min(1, "Give this credential a name").max(80),
    secret: z.string().trim().min(8, "That does not look like a complete credential").max(20_000),
    sharedUseAcknowledged: z.boolean().default(false),
  })
  .refine((value) => !requiresSharedUseAcknowledgement(value.provider) || value.sharedUseAcknowledged, {
    message: "Tick the acknowledgement to use a subscription credential.",
    path: ["sharedUseAcknowledged"],
  });
export type CreateCredentialRequest = z.infer<typeof createCredentialRequestSchema>;

export const aiSettingsSchema = z.object({
  activeCredentialId: z.string().nullable(),
  modelGeneration: z.string().nullable(),
  modelEvaluation: z.string().nullable(),
  modelCritic: z.string().nullable(),
  monthlyBudgetNote: z.string().nullable(),
  updatedAt: z.number(),
});
export type AiSettingsValue = z.infer<typeof aiSettingsSchema>;

export const updateAiSettingsRequestSchema = z.object({
  activeCredentialId: z.string().nullable().optional(),
  modelGeneration: z.string().trim().max(120).nullable().optional(),
  modelEvaluation: z.string().trim().max(120).nullable().optional(),
  modelCritic: z.string().trim().max(120).nullable().optional(),
  monthlyBudgetNote: z.string().trim().max(500).nullable().optional(),
});
export type UpdateAiSettingsRequest = z.infer<typeof updateAiSettingsRequestSchema>;

export const usageRowSchema = z.object({
  purpose: aiPurposeSchema,
  calls: z.number(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  failures: z.number(),
});

export const aiStatusResponseSchema = z.object({
  credentials: z.array(credentialSchema),
  settings: aiSettingsSchema,
  usage7d: z.array(usageRowSchema),
  /** Suggested models per provider, so the settings form can show sensible placeholders. */
  suggestedModels: z.record(z.string(), z.object({ generation: z.string(), critic: z.string(), evaluation: z.string() })),
  /** True when a dev-only mock provider is standing in for a real one. */
  usingMockProvider: z.boolean(),
});
export type AiStatusResponse = z.infer<typeof aiStatusResponseSchema>;
