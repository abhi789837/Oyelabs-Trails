import { z } from "zod";

import type { AiPurpose } from "./enums";

/**
 * AI task types, default models and prices (v4 Phase 6).
 *
 * Every model call names a task. The admin picks a model per task on Admin → AI connection; these
 * are the defaults a fresh install starts with. Assembling and grading assessments are not tasks at
 * all — they are code — which is where most of v3's spend used to go.
 *
 * Model ids are *config*, verified against the provider's live model list at boot: a configured
 * model the account cannot use falls back to Sonnet 5.5 rather than failing every call.
 */

export const AI_TASKS = [
  "understand",
  "item_generate",
  "item_check",
  "grade_written",
  "skill_tagging",
  "week_plan",
  "bank_fill",
  "course_outline",
  "course_write",
  "course_review",
  "planning",
  "legacy_generation",
  "legacy_critic",
  "verify",
] as const;
export const aiTaskSchema = z.enum(AI_TASKS);
export type AiTask = z.infer<typeof aiTaskSchema>;

export const HAIKU = "claude-haiku-4-5-20251001";
export const SONNET = "claude-sonnet-5-5";
export const OPUS = "claude-opus-5-5";
/** What any task falls back to when its configured model is not offered to this account. */
export const FALLBACK_MODEL = SONNET;

export interface TaskDefault {
  label: string;
  model: string;
  maxTokens: number;
  /** Urgent tasks run even when the monthly budget is used up: a learner is waiting on them. */
  urgent: boolean;
  /** Sent through the Message Batches API (50% off) when the provider supports it. */
  batch: boolean;
  note: string;
}

export const TASK_DEFAULTS: Record<AiTask, TaskDefault> = {
  understand: { label: "Understanding the admin's setup (assessment plan)", model: HAIKU, maxTokens: 2500, urgent: true, batch: false, note: "One small call per setup" },
  item_generate: { label: "Writing personalised assessment items", model: SONNET, maxTokens: 9000, urgent: false, batch: false, note: "2-3 calls per assessment" },
  item_check: { label: "Checking generated MCQs", model: HAIKU, maxTokens: 1200, urgent: false, batch: false, note: "One call per assessment" },
  grade_written: { label: "Grading written tasks (PM/BD)", model: HAIKU, maxTokens: 400, urgent: true, batch: false, note: "Short rubric, JSON out" },
  skill_tagging: { label: "Skill matching, tagging, short reasons", model: HAIKU, maxTokens: 1500, urgent: false, batch: false, note: "Cheap and frequent" },
  week_plan: { label: "Shaping a learner's week", model: HAIKU, maxTokens: 2000, urgent: false, batch: false, note: "Revises a rules-built week" },
  bank_fill: { label: "Filling gaps in the question bank", model: SONNET, maxTokens: 12_000, urgent: false, batch: true, note: "Validated by tests before use" },
  course_outline: { label: "Course outline", model: SONNET, maxTokens: 3000, urgent: false, batch: false, note: "" },
  course_write: { label: "Writing course topics", model: SONNET, maxTokens: 4000, urgent: false, batch: false, note: "" },
  course_review: { label: "Final course quality review", model: OPUS, maxTokens: 1500, urgent: false, batch: false, note: "Opus, used sparingly" },
  planning: { label: "Difficult planning (legacy evaluation)", model: OPUS, maxTokens: 6000, urgent: false, batch: false, note: "Opus, used sparingly" },
  legacy_generation: { label: "Legacy assessment generation", model: SONNET, maxTokens: 8000, urgent: false, batch: false, note: "v3 format only" },
  legacy_critic: { label: "Legacy item critic", model: SONNET, maxTokens: 3000, urgent: false, batch: false, note: "v3 format only" },
  verify: { label: "Credential check", model: HAIKU, maxTokens: 64, urgent: true, batch: false, note: "" },
};

/** Calls that predate task types are routed by their purpose. */
export function taskForPurpose(purpose: AiPurpose): AiTask {
  switch (purpose) {
    case "blueprint":
      return "legacy_generation";
    case "item_critic":
      return "legacy_critic";
    case "evaluation":
      return "planning";
    case "verify":
      return "verify";
    case "gap_analysis":
    case "course_match":
      return "skill_tagging";
    case "course_plan":
      return "course_outline";
    case "course_write":
      return "course_write";
    case "course_review":
      return "course_review";
    case "week_plan":
      return "week_plan";
    case "bank_fill":
      return "bank_fill";
    case "grade_written":
      return "grade_written";
    case "assessment_plan":
      return "understand";
    case "item_generate":
      return "item_generate";
    case "item_check":
      return "item_check";
  }
}

// ---------------------------------------------------------------------------
// Prices (USD per million tokens), from anthropic.com/pricing, checked 2026-10-02
// ---------------------------------------------------------------------------

export interface ModelPrice {
  input: number;
  output: number;
}

const PRICES: { match: RegExp; price: ModelPrice }[] = [
  { match: /haiku-4-5/, price: { input: 1, output: 5 } },
  { match: /sonnet-5-5/, price: { input: 2, output: 10 } },
  { match: /sonnet-4-5|sonnet-4/, price: { input: 3, output: 15 } },
  { match: /opus-5-5/, price: { input: 4, output: 20 } },
  { match: /opus/, price: { input: 5, output: 25 } },
  { match: /haiku/, price: { input: 1, output: 5 } },
  { match: /sonnet/, price: { input: 3, output: 15 } },
];

export const CACHE_WRITE_MULTIPLIER = 1.25;
export const CACHE_READ_MULTIPLIER = 0.1;
export const BATCH_MULTIPLIER = 0.5;

/** Unknown models (mock, CLI subscriptions, OpenAI) are priced at zero rather than guessed. */
export function priceFor(model: string): ModelPrice | null {
  if (!/claude/.test(model)) return null;
  return PRICES.find((p) => p.match.test(model))?.price ?? { input: 3, output: 15 };
}

export interface CallUsage {
  input: number;
  output: number;
  cacheRead?: number;
  cacheWrite?: number;
}

/** Cost in micro-dollars (1e-6 USD), so it sums exactly as an integer column. */
export function costMicros(model: string, usage: CallUsage, batch = false): number {
  const price = priceFor(model);
  if (!price) return 0;
  const dollars =
    (usage.input * price.input +
      (usage.cacheWrite ?? 0) * price.input * CACHE_WRITE_MULTIPLIER +
      (usage.cacheRead ?? 0) * price.input * CACHE_READ_MULTIPLIER +
      usage.output * price.output) /
    1_000_000;
  return Math.round(dollars * (batch ? BATCH_MULTIPLIER : 1) * 1_000_000);
}

// ---------------------------------------------------------------------------
// Admin views
// ---------------------------------------------------------------------------

export interface TaskRoute {
  task: AiTask;
  label: string;
  model: string;
  maxTokens: number;
  urgent: boolean;
  batch: boolean;
  /** The admin changed it from the default. */
  custom: boolean;
  /** Set when the configured model is not offered to this account and the fallback is in use. */
  fallbackFrom: string | null;
}

export const updateRouteSchema = z.object({
  model: z.string().trim().min(3).max(80).nullable(),
  maxTokens: z.number().int().min(16).max(64_000).nullable(),
});

export const budgetSchema = z.object({ monthlyBudgetUsd: z.number().min(0).max(100_000).nullable() });

export interface BudgetStatus {
  monthlyBudgetUsd: number | null;
  spentUsd: number;
  /** 0..1+, null with no budget set. */
  share: number | null;
  warning: boolean;
  /** Non-urgent jobs wait until the month turns over or the budget is raised. */
  paused: boolean;
  monthStart: number;
}

export interface UsageReport {
  budget: BudgetStatus;
  days: { day: string; usd: number; calls: number }[];
  byTask: { task: string; calls: number; usd: number; inputTokens: number; outputTokens: number; cacheReadTokens: number }[];
  byLearner: { userId: string; displayName: string; usd: number; calls: number }[];
  perAssessment: { count: number; avgUsd: number };
  perCourse: { count: number; avgUsd: number };
  totalUsd: number;
}
