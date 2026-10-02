import { and, eq, gte, sql } from "drizzle-orm";

import {
  AI_TASKS,
  FALLBACK_MODEL,
  TASK_DEFAULTS,
  type AiTask,
  type BudgetStatus,
  type TaskRoute,
} from "../../../shared/aiRouting";
import type { ProviderId } from "../../../shared/enums";
import type { Db } from "../db";
import * as schema from "../db/schema";
import { now } from "../lib/ids";
import { notify } from "../lib/notify";

/**
 * The AI router (v4 Phase 6): which model, and how many output tokens, for each task type.
 *
 * Every call through `AiService` names a task. The admin's choice per task lives in
 * `ai_task_routes`; anything unset uses `TASK_DEFAULTS`. Model ids are checked against the live
 * model list the provider returned at boot — a configured model this account cannot use falls back
 * to Sonnet 5.5 and the AI page says so, rather than every call failing.
 */

export function listRoutes(db: Db): TaskRoute[] {
  const stored = new Map(db.select().from(schema.aiTaskRoutes).all().map((r) => [r.task, r]));
  const available = availableModels(db);
  return AI_TASKS.map((task) => {
    const d = TASK_DEFAULTS[task];
    const row = stored.get(task);
    const configured = row?.model || d.model;
    const resolved = resolveAgainst(configured, available);
    return {
      task,
      label: d.label,
      model: resolved,
      maxTokens: row?.maxTokens ?? d.maxTokens,
      urgent: d.urgent,
      batch: d.batch,
      custom: Boolean(row?.model || row?.maxTokens),
      fallbackFrom: resolved !== configured ? configured : null,
    };
  });
}

export function routeFor(db: Db, task: AiTask): TaskRoute {
  return listRoutes(db).find((r) => r.task === task)!;
}

export function setRoute(db: Db, task: AiTask, patch: { model: string | null; maxTokens: number | null }, actorId: string): void {
  const values = { task, model: patch.model, maxTokens: patch.maxTokens, updatedBy: actorId, updatedAt: now() };
  db.insert(schema.aiTaskRoutes).values(values).onConflictDoUpdate({ target: schema.aiTaskRoutes.task, set: values }).run();
}

function availableModels(db: Db): string[] | null {
  const row = db.select({ models: schema.aiSettings.availableModels }).from(schema.aiSettings).where(eq(schema.aiSettings.id, "singleton")).get();
  return row?.models && row.models.length ? row.models : null;
}

/**
 * The model to send: the configured one when the account offers it (or when no list is known yet),
 * otherwise the fallback, otherwise any Sonnet the account has.
 */
export function resolveAgainst(configured: string, available: string[] | null): string {
  if (!available) return configured;
  if (available.includes(configured)) return configured;
  // Aliases: "claude-sonnet-5-5" is offered as a dated id too; accept a prefix match.
  const prefixed = available.find((id) => id.startsWith(`${configured}-`) || configured.startsWith(`${id}-`));
  if (prefixed) return prefixed;
  if (available.includes(FALLBACK_MODEL)) return FALLBACK_MODEL;
  return available.find((id) => id.includes("sonnet")) ?? configured;
}

/** Called after the provider's models API answers (boot, and every credential verification). */
export function storeAvailableModels(db: Db, ids: string[]): void {
  db.insert(schema.aiSettings)
    .values({ id: "singleton", availableModels: ids, modelsFetchedAt: now(), updatedAt: now() })
    .onConflictDoUpdate({ target: schema.aiSettings.id, set: { availableModels: ids, modelsFetchedAt: now() } })
    .run();
}

/** Only the Anthropic API is routed by model id; other providers keep their own model naming. */
export function isRoutable(provider: ProviderId): boolean {
  return provider === "anthropic-api";
}

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

export function monthStart(at = now()): number {
  const d = new Date(at);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

export function budgetStatus(db: Db): BudgetStatus {
  const settings = db.select({ budget: schema.aiSettings.monthlyBudgetUsd }).from(schema.aiSettings).where(eq(schema.aiSettings.id, "singleton")).get();
  const start = monthStart();
  const spent =
    db
      .select({ micros: sql<number>`coalesce(sum(${schema.aiCalls.costMicros}), 0)` })
      .from(schema.aiCalls)
      .where(gte(schema.aiCalls.createdAt, start))
      .get()?.micros ?? 0;
  const spentUsd = spent / 1_000_000;
  const budget = settings?.budget ?? null;
  const share = budget && budget > 0 ? spentUsd / budget : null;
  return { monthlyBudgetUsd: budget, spentUsd, share, warning: share != null && share >= 0.8, paused: share != null && share >= 1, monthStart: start };
}

export function setBudget(db: Db, monthlyBudgetUsd: number | null): void {
  const existing = db.select({ id: schema.aiSettings.id }).from(schema.aiSettings).where(eq(schema.aiSettings.id, "singleton")).get();
  if (existing) db.update(schema.aiSettings).set({ monthlyBudgetUsd, updatedAt: now() }).where(eq(schema.aiSettings.id, "singleton")).run();
  else db.insert(schema.aiSettings).values({ id: "singleton", monthlyBudgetUsd, updatedAt: now() }).run();
}

/** Tells the superadmins once per month when spend crosses 80%, and once when it hits 100%. */
export function warnOnBudget(db: Db): void {
  const status = budgetStatus(db);
  if (!status.warning) return;
  const level = status.paused ? "100" : "80";
  const key = `ai.budget_warned.${new Date(status.monthStart).toISOString().slice(0, 7)}.${level}`;
  const done = db.select().from(schema.appMeta).where(eq(schema.appMeta.key, key)).get();
  if (done) return;
  db.insert(schema.appMeta).values({ key, value: "1", updatedAt: now() }).onConflictDoNothing().run();
  const superadmins = db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.role, "superadmin"), eq(schema.users.status, "active")))
    .all();
  for (const admin of superadmins) {
    notify(db, {
      recipientId: admin.id,
      kind: "ai.budget",
      title: status.paused ? "AI budget reached — background jobs paused" : "AI budget 80% used",
      body: `$${status.spentUsd.toFixed(2)} of $${status.monthlyBudgetUsd?.toFixed(2)} this month.${status.paused ? " Course generation and bank fills wait until the budget is raised or the month turns." : ""}`,
      link: "/admin/ai-usage",
    });
  }
}

export class AiBudgetPausedError extends Error {
  constructor() {
    super("The monthly AI budget is used up, so non-urgent AI work is paused.");
    this.name = "AiBudgetPausedError";
  }
}
