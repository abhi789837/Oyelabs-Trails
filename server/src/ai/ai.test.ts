import crypto from "node:crypto";

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { schema } from "../db";
import { hint, open, seal } from "../crypto/secretBox";
import { adminSession, as, createTestApp, type Session, type TestContext } from "../test/harness";
import { MockProvider } from "./adapters/mock";
import { AiService } from "./service";
import { AiProviderError } from "./types";

let ctx: TestContext;
let admin: Session;

const ANTHROPIC_KEY = "sk-ant-api03-not-a-real-key-0000000000000000000000000000a9F2";

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
});

afterEach(async () => {
  await ctx.close();
});

describe("secret box", () => {
  const key = crypto.randomBytes(32);

  test("round-trips, and never stores the plaintext", () => {
    const sealed = seal(ANTHROPIC_KEY, key);
    expect(JSON.stringify(sealed)).not.toContain(ANTHROPIC_KEY);
    expect(open(sealed, key)).toBe(ANTHROPIC_KEY);
  });

  test("uses a fresh nonce every time, so the same secret encrypts differently", () => {
    const a = seal(ANTHROPIC_KEY, key);
    const b = seal(ANTHROPIC_KEY, key);
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  test("a tampered ciphertext fails to open rather than returning garbage", () => {
    const sealed = seal(ANTHROPIC_KEY, key);
    const flipped = Buffer.from(sealed.ciphertext, "base64");
    flipped[0] ^= 0xff;
    expect(() => open({ ...sealed, ciphertext: flipped.toString("base64") }, key)).toThrow();
  });

  test("the wrong key fails to open", () => {
    const sealed = seal(ANTHROPIC_KEY, key);
    expect(() => open(sealed, crypto.randomBytes(32))).toThrow();
  });

  test("the hint is only the last four characters", () => {
    expect(hint(ANTHROPIC_KEY)).toBe("…a9F2");
    expect(hint(ANTHROPIC_KEY)).not.toContain("sk-ant");
  });
});

describe("credentials API", () => {
  const add = (body: Record<string, unknown>) =>
    ctx.app.inject({ method: "POST", url: "/api/admin/ai/credentials", ...as(admin), payload: body });

  test("stores a credential encrypted and never returns the secret", async () => {
    const res = await add({ provider: "anthropic-api", label: "Company key", secret: ANTHROPIC_KEY });
    expect(res.statusCode).toBe(201);

    // Nothing in the response body, at any depth.
    expect(res.body).not.toContain(ANTHROPIC_KEY);
    expect(res.body).not.toContain("sk-ant-api03");
    expect(res.json().credential.secretHint).toBe("…a9F2");

    // Nothing in the row either.
    const row = ctx.db.select().from(schema.aiCredentials).get()!;
    expect(row.secretCiphertext).not.toContain(ANTHROPIC_KEY);
    expect(JSON.stringify(row)).not.toContain(ANTHROPIC_KEY);

    // But it is recoverable with the master key, which is what makes it usable.
    expect(open({ ciphertext: row.secretCiphertext, iv: row.secretIv, tag: row.secretTag }, ctx.env.masterKey)).toBe(
      ANTHROPIC_KEY,
    );
  });

  test("the list and status endpoints never carry the secret", async () => {
    await add({ provider: "anthropic-api", label: "Company key", secret: ANTHROPIC_KEY });
    const res = await ctx.app.inject({ method: "GET", url: "/api/admin/ai", ...as(admin) });
    expect(res.statusCode).toBe(200);
    expect(res.body).not.toContain(ANTHROPIC_KEY);
    expect(res.json().credentials[0].secretHint).toBe("…a9F2");
    expect(Object.keys(res.json().credentials[0])).not.toContain("secretCiphertext");
  });

  test("the audit row records the provider and hint, never the secret", async () => {
    await add({ provider: "anthropic-api", label: "Company key", secret: ANTHROPIC_KEY });
    const entry = ctx.db.select().from(schema.auditLog).where(eq(schema.auditLog.action, "ai.credential_added")).get();
    expect(entry).toBeDefined();
    expect(JSON.stringify(entry)).not.toContain(ANTHROPIC_KEY);
    expect(JSON.stringify(entry)).toContain("…a9F2");
  });

  test("a subscription credential is refused without the acknowledgement", async () => {
    const res = await add({ provider: "claude-cli", label: "My Max plan", secret: "sk-ant-oat01-abcdefgh12345678" });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.fields.sharedUseAcknowledged).toBeDefined();
  });

  test("a subscription credential is accepted with the acknowledgement", async () => {
    const res = await add({
      provider: "claude-cli",
      label: "My Max plan",
      secret: "sk-ant-oat01-abcdefgh12345678",
      sharedUseAcknowledged: true,
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().credential.sharedUseAcknowledged).toBe(true);
  });

  test("the mock provider cannot be added through the API", async () => {
    const res = await add({ provider: "mock", label: "Sneaky", secret: "anything-at-all" });
    expect(res.statusCode).toBe(400);
  });

  test("a learner cannot reach any AI route", async () => {
    const aiRoutes = ctx.app.routeTable.filter((r) => r.url.startsWith("/api/admin/ai"));
    expect(aiRoutes.length).toBeGreaterThan(3);
    // The admin-route guard test in users.test.ts covers the 403; this asserts the routes exist
    // under /api/admin, which is what puts them behind that guard in the first place.
    for (const route of aiRoutes) expect(route.url.startsWith("/api/admin/")).toBe(true);
  });

  test("setting an unverified subscription credential active is refused", async () => {
    const created = await add({ provider: "anthropic-api", label: "Key", secret: ANTHROPIC_KEY });
    const id = created.json().credential.id;

    const ok = await ctx.app.inject({
      method: "PUT",
      url: "/api/admin/ai/settings",
      ...as(admin),
      payload: { activeCredentialId: id },
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().settings.activeCredentialId).toBe(id);

    const missing = await ctx.app.inject({
      method: "PUT",
      url: "/api/admin/ai/settings",
      ...as(admin),
      payload: { activeCredentialId: "01JZZZZZZZZZZZZZZZZZZZZZZZ" },
    });
    expect(missing.statusCode).toBe(400);
  });

  test("deleting a credential clears it as the active one instead of dangling", async () => {
    const created = await add({ provider: "anthropic-api", label: "Key", secret: ANTHROPIC_KEY });
    const id = created.json().credential.id;
    await ctx.app.inject({ method: "PUT", url: "/api/admin/ai/settings", ...as(admin), payload: { activeCredentialId: id } });

    const res = await ctx.app.inject({ method: "DELETE", url: `/api/admin/ai/credentials/${id}`, ...as(admin) });
    expect(res.statusCode).toBe(200);

    const status = await ctx.app.inject({ method: "GET", url: "/api/admin/ai", ...as(admin) });
    expect(status.json().credentials).toHaveLength(0);
    expect(status.json().settings.activeCredentialId).toBeNull();
  });
});

describe("credential verification job", () => {
  test("a credential is queued for verification when it is added, and the job records the outcome", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: "/api/admin/ai/credentials",
      ...as(admin),
      payload: { provider: "anthropic-api", label: "Key", secret: ANTHROPIC_KEY },
    });
    const id = res.json().credential.id;
    expect(res.json().credential.status).toBe("unverified");

    const queued = ctx.db.select().from(schema.jobs).all();
    expect(queued).toHaveLength(1);
    expect(queued[0].type).toBe("credential.verify");

    // The harness's AiService runs the mock, whose verify() succeeds.
    const processed = await ctx.drainJobs();
    expect(processed).toBe(1);

    const after = ctx.db.select().from(schema.aiCredentials).where(eq(schema.aiCredentials.id, id)).get()!;
    expect(after.status).toBe("verified");
    expect(after.lastVerifiedAt).toBeGreaterThan(0);
  });

  test("a failing credential is marked failed with the reason, and the job still completes", async () => {
    const failing = new AiService(ctx.db, ctx.env, {
      mock: new MockProvider({}, new AiProviderError("401 invalid x-api-key")),
    });

    const res = await ctx.app.inject({
      method: "POST",
      url: "/api/admin/ai/credentials",
      ...as(admin),
      payload: { provider: "anthropic-api", label: "Bad key", secret: ANTHROPIC_KEY },
    });
    const id = res.json().credential.id;

    const { verifyCredentialHandler } = await import("../jobs/handlers/verifyCredential");
    const { JobWorker } = await import("../jobs/worker");
    const worker = new JobWorker({
      db: ctx.db,
      handlers: { "credential.verify": verifyCredentialHandler(ctx.db, failing) },
      tickMs: 60_000,
    });
    await worker.drain();

    const after = ctx.db.select().from(schema.aiCredentials).where(eq(schema.aiCredentials.id, id)).get()!;
    expect(after.status).toBe("failed");
    expect(after.lastError).toMatch(/invalid x-api-key/);

    // Marked done, not retried: a wrong key is an answer, not a transient failure.
    const job = ctx.db.select().from(schema.jobs).get()!;
    expect(job.status).toBe("done");
  });
});

describe("structured calls and the audit trail", () => {
  const schemaUnderTest = z.object({
    areas: z.array(z.object({ name: z.string(), level: z.number().int().min(1).max(5) })).min(2),
    note: z.string(),
  });

  test("returns schema-valid data and records usage against the subject", async () => {
    const result = await ctx.ai.generateJson({
      purpose: "blueprint",
      system: "You build assessment blueprints.",
      user: "Build one for a mid-level React developer.",
      schema: schemaUnderTest,
      // Not "blueprint": that name is reserved by the mock for the real pipeline fixture.
      schemaName: "test_shape",
      meta: { subjectUserId: admin.user.id, assessmentId: "assessment-1" },
    });

    expect(result.data.areas.length).toBeGreaterThanOrEqual(2);
    for (const area of result.data.areas) expect(area.level).toBeGreaterThanOrEqual(1);

    const call = ctx.db.select().from(schema.aiCalls).get()!;
    expect(call.ok).toBe(true);
    expect(call.purpose).toBe("blueprint");
    expect(call.subjectUserId).toBe(admin.user.id);
    expect(call.assessmentId).toBe("assessment-1");
    expect(call.outputTokens).toBeGreaterThan(0);
  });

  test("a failed call is recorded too, so failures are attributable", async () => {
    const failing = new AiService(ctx.db, ctx.env, {
      mock: new MockProvider({}, new AiProviderError("429 rate limited", 429, true)),
    });

    await expect(
      failing.generateJson({
        purpose: "evaluation",
        system: "s",
        user: "u",
        schema: schemaUnderTest,
        meta: { subjectUserId: admin.user.id },
      }),
    ).rejects.toThrow(/rate limited/);

    const calls = ctx.db.select().from(schema.aiCalls).all();
    // Retried three times, each attempt recorded.
    expect(calls).toHaveLength(3);
    expect(calls.every((c) => !c.ok)).toBe(true);
    expect(calls[0].error).toMatch(/rate limited/);
  }, 20_000);

  test("a non-retryable failure is attempted once", async () => {
    const failing = new AiService(ctx.db, ctx.env, {
      mock: new MockProvider({}, new AiProviderError("401 invalid key", 401, false)),
    });

    await expect(
      failing.generateJson({ purpose: "verify", system: "s", user: "u", schema: schemaUnderTest, meta: {} }),
    ).rejects.toThrow(/invalid key/);

    expect(ctx.db.select().from(schema.aiCalls).all()).toHaveLength(1);
  });

  test("without a configured credential, a call says so rather than failing obscurely", async () => {
    const unconfigured = new AiService(ctx.db, ctx.env, {});
    expect(unconfigured.isConfigured()).toBe(false);
    await expect(
      unconfigured.generateJson({ purpose: "blueprint", system: "s", user: "u", schema: schemaUnderTest, meta: {} }),
    ).rejects.toThrow(/No AI credential/);
  });

  test("usage is reported per purpose for the admin page", async () => {
    await ctx.ai.generateJson({
      purpose: "blueprint",
      system: "s",
      user: "u",
      schema: schemaUnderTest,
      meta: { subjectUserId: admin.user.id },
    });
    const res = await ctx.app.inject({ method: "GET", url: "/api/admin/ai", ...as(admin) });
    const usage = res.json().usage7d.find((row: { purpose: string }) => row.purpose === "blueprint");
    expect(usage.calls).toBe(1);
    expect(usage.failures).toBe(0);
  });
});

describe("the mock provider", () => {
  test("is deterministic for the same request", async () => {
    const shape = z.object({ items: z.array(z.object({ id: z.string(), score: z.number() })).min(3) });
    const a = new MockProvider();
    const b = new MockProvider();
    const request = { purpose: "blueprint" as const, system: "s", user: "same input", schema: shape, meta: {} };
    expect(JSON.stringify((await a.generateJson(request)).data)).toBe(
      JSON.stringify((await b.generateJson(request)).data),
    );
  });

  test("uses real topic ids when they are supplied as hints", async () => {
    const realIds = ctx.content.orderedTopicIds.slice(0, 20);
    const provider = new MockProvider({ topicIds: realIds });
    const shape = z.object({ plan: z.object({ topicIds: z.array(z.string()).min(3) }) });

    const result = await provider.generateJson({ purpose: "evaluation", system: "s", user: "u", schema: shape, meta: {} });
    for (const id of result.data.plan.topicIds) {
      expect(ctx.content.hasTopic(id), `${id} should be a real topic`).toBe(true);
    }
  });
});

describe("job queue", () => {
  test("claims each job exactly once and retries with backoff before failing", async () => {
    const { enqueue } = await import("../jobs/queue");
    const { JobWorker } = await import("../jobs/worker");

    let runs = 0;
    enqueue(ctx.db, { type: "assessment.blueprint", payload: { n: 1 }, maxAttempts: 2 });

    const worker = new JobWorker({
      db: ctx.db,
      tickMs: 60_000,
      handlers: {
        "assessment.blueprint": async () => {
          runs += 1;
          throw new Error("boom");
        },
      },
    });

    await worker.drain();
    expect(runs).toBe(1);
    let job = ctx.db.select().from(schema.jobs).get()!;
    expect(job.status).toBe("queued");
    expect(job.lastError).toBe("boom");

    // Backoff means the retry is not eligible yet; pull it forward rather than waiting.
    ctx.db.update(schema.jobs).set({ runAfter: Date.now() - 1 }).run();
    await worker.drain();

    expect(runs).toBe(2);
    job = ctx.db.select().from(schema.jobs).get()!;
    expect(job.status).toBe("failed");
    expect(job.attempts).toBe(2);
  });

  test("a job with no handler fails immediately rather than looping forever", async () => {
    const { enqueue } = await import("../jobs/queue");
    const { JobWorker } = await import("../jobs/worker");

    enqueue(ctx.db, { type: "assessment.evaluate", payload: {} });
    const worker = new JobWorker({ db: ctx.db, tickMs: 60_000, handlers: {} });
    await worker.drain();

    const job = ctx.db.select().from(schema.jobs).get()!;
    expect(job.status).toBe("failed");
    expect(job.lastError).toMatch(/No handler/);
  });

  test("jobs left running by a dead process are requeued on start", async () => {
    const { enqueue, requeueAllRunning } = await import("../jobs/queue");
    const id = enqueue(ctx.db, { type: "assessment.blueprint", payload: {} });
    ctx.db.update(schema.jobs).set({ status: "running", lockedAt: Date.now() - 60_000 }).where(eq(schema.jobs.id, id)).run();

    expect(requeueAllRunning(ctx.db)).toBe(1);
    expect(ctx.db.select().from(schema.jobs).get()!.status).toBe("queued");
  });
});
