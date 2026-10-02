import { z } from "zod";
import { beforeEach, describe, expect, test } from "vitest";

import { costMicros, HAIKU, OPUS, SONNET, taskForPurpose } from "../../../shared/aiRouting";
import { schema } from "../db";
import { enqueue } from "../jobs/queue";
import { now } from "../lib/ids";
import { createTestApp, type TestContext } from "../test/harness";
import { AnthropicApiProvider } from "./adapters/anthropicApi";
import { AiBudgetPausedError, budgetStatus, listRoutes, resolveAgainst, routeFor, setBudget, setRoute, storeAvailableModels } from "./router";

let ctx: TestContext;
beforeEach(async () => {
  ctx = await createTestApp();
});

describe("routing", () => {
  test("defaults follow the brief: Haiku grades and tags, Sonnet writes, Opus reviews", () => {
    expect(routeFor(ctx.db, "grade_written").model).toBe(HAIKU);
    expect(routeFor(ctx.db, "skill_tagging").model).toBe(HAIKU);
    expect(routeFor(ctx.db, "bank_fill")).toMatchObject({ model: SONNET, batch: true });
    expect(routeFor(ctx.db, "course_write").model).toBe(SONNET);
    expect(routeFor(ctx.db, "course_review").model).toBe(OPUS);
  });

  test("calls that predate tasks are routed by purpose", () => {
    expect(taskForPurpose("course_match")).toBe("skill_tagging");
    expect(taskForPurpose("course_plan")).toBe("course_outline");
    expect(taskForPurpose("week_plan")).toBe("week_plan");
  });

  test("an admin can change a task's model and cap", () => {
    setRoute(ctx.db, "course_write", { model: OPUS, maxTokens: 5000 }, "admin");
    expect(routeFor(ctx.db, "course_write")).toMatchObject({ model: OPUS, maxTokens: 5000, custom: true });
  });

  test("a model the account does not offer falls back to Sonnet 5.5 and says so", () => {
    storeAvailableModels(ctx.db, [SONNET, OPUS]);
    const route = listRoutes(ctx.db).find((r) => r.task === "grade_written")!;
    expect(route.model).toBe(SONNET);
    expect(route.fallbackFrom).toBe(HAIKU);
    expect(resolveAgainst("claude-sonnet-5-5", ["claude-sonnet-5-5-20260901"])).toBe("claude-sonnet-5-5-20260901");
  });
});

describe("cost", () => {
  test("prices input, output, cache reads/writes and the batch discount", () => {
    expect(costMicros(SONNET, { input: 1_000_000, output: 0 })).toBe(2_000_000);
    expect(costMicros(HAIKU, { input: 0, output: 1_000_000 })).toBe(5_000_000);
    expect(costMicros(SONNET, { input: 0, output: 0, cacheRead: 1_000_000 })).toBe(200_000);
    expect(costMicros(SONNET, { input: 1_000_000, output: 0 }, true)).toBe(1_000_000);
    expect(costMicros("mock-1", { input: 1000, output: 1000 })).toBe(0);
  });
});

describe("prompt caching", () => {
  test("the static system prompt is sent as a cacheable block, and cache tokens are reported", async () => {
    const provider = new AnthropicApiProvider("sk-ant-test");
    let sent: unknown;
    (provider.raw.messages as unknown as { create: (body: unknown) => Promise<unknown> }).create = async (body: unknown) => {
      sent = body;
      return { content: [{ type: "text", text: '{"ok":true}' }], usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 900, cache_creation_input_tokens: 0 } };
    };
    const result = await provider.generateJson({ purpose: "verify", system: "static instructions", user: "x", schema: z.object({ ok: z.boolean() }), meta: {} });
    expect((sent as { system: unknown[] }).system[0]).toMatchObject({ type: "text", text: "static instructions", cache_control: { type: "ephemeral" } });
    expect(result.usage).toMatchObject({ cacheRead: 900, cacheWrite: 0 });
  });
});

describe("budget", () => {
  function spend(usd: number) {
    ctx.db
      .insert(schema.aiCalls)
      .values({ id: `c${Math.random()}`, provider: "anthropic-api", model: SONNET, purpose: "course_write", task: "course_write", costMicros: usd * 1_000_000, ok: true, createdAt: now() })
      .run();
  }

  test("warns at 80% and pauses non-urgent work at 100%", async () => {
    setBudget(ctx.db, 10);
    spend(8.5);
    expect(budgetStatus(ctx.db)).toMatchObject({ warning: true, paused: false });
    spend(2);
    expect(budgetStatus(ctx.db).paused).toBe(true);
    await expect(ctx.ai.generateJson({ purpose: "course_write", system: "s", user: "u", schema: z.object({}), meta: {} })).rejects.toBeInstanceOf(AiBudgetPausedError);
  });

  test("urgent work (grading a learner's written answer) still runs", async () => {
    setBudget(ctx.db, 1);
    spend(5);
    await expect(ctx.ai.generateJson({ purpose: "evaluation", task: "grade_written", system: "s", user: "u", schema: z.object({}).passthrough(), meta: {} })).resolves.toBeDefined();
  });

  test("a paused job is deferred, not failed", async () => {
    setBudget(ctx.db, 1);
    spend(5);
    enqueue(ctx.db, { type: "bank.fill", payload: { departmentId: "engineering", skillId: "eng-go", type: "coding" } });
    await ctx.drainJobs();
    const job = ctx.db.select().from(schema.jobs).all().find((j) => j.type === "bank.fill")!;
    expect(job.status).toBe("queued");
    expect(job.runAfter).toBeGreaterThan(now() + 60 * 60 * 1000);
  });

  test("every call is logged with its task and cost", async () => {
    await ctx.ai.generateJson({ purpose: "course_match", system: "s", user: "u", schema: z.object({}).passthrough(), meta: {} });
    const row = ctx.db.select().from(schema.aiCalls).all().at(-1)!;
    expect(row.task).toBe("skill_tagging");
  });
});
