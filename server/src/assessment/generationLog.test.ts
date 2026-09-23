import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { schema } from "../db";
import { SAMPLE_LEARNERS } from "../dev/sampleProfiles";
import {
  activeLearner,
  adminSession,
  as,
  createTestApp,
  type Session,
  type TestContext,
} from "../test/harness";
import { GenerationLog, MAX_GENERATION_LOG_LINES, generationLogFor } from "./generationLog";

let ctx: TestContext;
let admin: Session;
let learner: { id: string; username: string; session: Session };
let assessmentId: string;

/**
 * Watching a generation (brief §13).
 *
 * The properties that matter here are the two the log could get wrong in a way nobody would
 * notice until it was too late: the credential must never appear in it, and neither must an
 * answer key. Both are asserted against the raw response body, because a value nested anywhere at
 * all would still show up there.
 */
beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  learner = await activeLearner(ctx, admin, SAMPLE_LEARNERS[0].username);

  await ctx.app.inject({
    method: "PUT",
    url: `/api/admin/users/${learner.id}/profile`,
    ...as(admin),
    payload: { profile: SAMPLE_LEARNERS[0].profile },
  });
  const issued = await ctx.app.inject({
    method: "POST",
    url: `/api/admin/users/${learner.id}/assessments`,
    ...as(admin),
    payload: {},
  });
  assessmentId = issued.json().assessmentId;
  await ctx.drainJobs();
}, 60_000);

afterEach(async () => {
  await ctx.close();
});

const logUrl = () => `/api/admin/assessments/${assessmentId}/generation-log`;

describe("the log a generation leaves behind", () => {
  test("survives the run finishing, and reads back in order", async () => {
    const res = await ctx.app.inject({ method: "GET", url: logUrl(), ...as(admin) });
    expect(res.statusCode).toBe(200);

    const body = res.json() as { status: string; truncated: boolean; lines: { seq: number; stage: string }[] };
    expect(body.status).not.toBe("generating");
    expect(body.truncated).toBe(false);
    expect(body.lines.length).toBeGreaterThan(5);
    expect(body.lines.map((l) => l.seq)).toEqual([...body.lines].sort((a, b) => a.seq - b.seq).map((l) => l.seq));

    // The stages the job actually goes through, in the order it goes through them.
    const stages = body.lines.map((l) => l.stage);
    expect(stages[0]).toBe("start");
    expect(stages).toContain("blueprint");
    expect(stages).toContain("items");
    expect(stages).toContain("critic");
    expect(stages).toContain("explain");
    expect(stages.at(-1)).toBe("finish");

    // Stored, not only streamed: the rows outlive the job that wrote them.
    expect(generationLogFor(ctx.db, assessmentId).length).toBe(body.lines.length);
  });

  test("records a count per stage and what each provider call cost", async () => {
    const lines = generationLogFor(ctx.db, assessmentId);

    expect(lines.some((l) => /\d+ items returned/.test(l.message))).toBe(true);
    expect(lines.some((l) => /\d+ kept, \d+ dropped/.test(l.message))).toBe(true);

    const withUsage = lines.filter((l) => l.inputTokens !== null);
    expect(withUsage.length).toBeGreaterThan(0);
    for (const line of withUsage) {
      expect(line.outputTokens).not.toBeNull();
      expect(line.elapsedMs).not.toBeNull();
    }
  });

  test("names every dropped item and says why, as a fixed tag", async () => {
    const dropLines = generationLogFor(ctx.db, assessmentId).filter((l) => l.message.startsWith("Dropped "));
    const droppedItems = ctx.db
      .select()
      .from(schema.assessmentItems)
      .where(eq(schema.assessmentItems.assessmentId, assessmentId))
      .all()
      .filter((i) => i.status === "dropped");

    // The fixture drops items on purpose, so this is not a vacuous check.
    expect(droppedItems.length).toBeGreaterThan(0);
    expect(dropLines.length).toBe(droppedItems.length);

    for (const item of droppedItems) {
      expect(dropLines.some((l) => l.message.includes(item.id))).toBe(true);
    }
    expect(dropLines.some((l) => l.message.includes("critic-disagreed") || l.message.includes("critic-rejected"))).toBe(
      true,
    );
  });

  test("keeps one run bounded, dropping the oldest lines", () => {
    const log = new GenerationLog({ db: ctx.db, assessmentId, redactLine: (text) => text });
    const before = generationLogFor(ctx.db, assessmentId).length;
    for (let i = 0; i < MAX_GENERATION_LOG_LINES + 25; i++) log.info("items", `filler ${i}`);

    const lines = generationLogFor(ctx.db, assessmentId);
    expect(lines.length).toBe(MAX_GENERATION_LOG_LINES);
    // The tail is what is kept: a run that failed is diagnosed from its end, not its beginning.
    expect(lines.at(-1)!.message).toBe(`filler ${MAX_GENERATION_LOG_LINES + 24}`);
    expect(lines[0].seq).toBeGreaterThan(before);

    const res = ctx.db.select().from(schema.generationLog).all();
    expect(res.length).toBe(MAX_GENERATION_LOG_LINES);
  });
});

describe("who may read it", () => {
  test("a learner is refused", async () => {
    const res = await ctx.app.inject({ method: "GET", url: logUrl(), ...as(learner.session) });
    expect(res.statusCode).toBe(403);
    expect(res.body).not.toContain("Dropped");
  });

  test("an anonymous request is refused", async () => {
    const res = await ctx.app.inject({ method: "GET", url: logUrl() });
    expect(res.statusCode).toBe(401);
  });

  test("the route is under /api/admin, so the blanket admin guard covers it", () => {
    const route = ctx.app.routeTable.find((r) => r.url.endsWith("/generation-log"));
    expect(route?.url.startsWith("/api/admin/")).toBe(true);
  });
});

describe("the credential never reaches it", () => {
  /** Deliberately not `sk-` shaped: only the supplied secret can redact this one. */
  const CLI_TOKEN = "oyelabs-shared-cli-session-ZZQQ-7788-4411";
  const API_KEY = "sk-ant-api03-not-a-real-key-0000000000000000000000000000a9F2";

  beforeEach(async () => {
    const created = await ctx.app.inject({
      method: "POST",
      url: "/api/admin/ai/credentials",
      ...as(admin),
      payload: { provider: "claude-cli", label: "Shared CLI", secret: CLI_TOKEN, sharedUseAcknowledged: true },
    });
    expect(created.statusCode).toBe(201);
    await ctx.app.inject({
      method: "PUT",
      url: "/api/admin/ai/settings",
      ...as(admin),
      payload: { activeCredentialId: created.json().credential.id },
    });
  });

  /** Writes through the same choke point the job uses, with no scrubbing of its own. */
  const writeAsTheJobWould = (message: string) =>
    new GenerationLog({ db: ctx.db, assessmentId, redactLine: (text) => ctx.ai.redactSecrets(text) }).error(
      "finish",
      message,
    );

  test("a provider error that quotes the command line is scrubbed", async () => {
    writeAsTheJobWould(`claude --print --token ${CLI_TOKEN} exited with code 1`);

    const res = await ctx.app.inject({ method: "GET", url: logUrl(), ...as(admin) });
    expect(res.statusCode).toBe(200);
    expect(res.body).not.toContain(CLI_TOKEN);
    expect(res.body).toContain("[redacted]");
  });

  test("anything API-key shaped is scrubbed even when it is not the stored credential", async () => {
    writeAsTheJobWould(`401 from the provider: invalid x-api-key ${API_KEY}`);

    const res = await ctx.app.inject({ method: "GET", url: logUrl(), ...as(admin) });
    expect(res.body).not.toContain(API_KEY);
    expect(res.body).not.toContain("sk-ant-api03");
  });

  test("the stored row is scrubbed too, not just the response", () => {
    writeAsTheJobWould(`claude --token ${CLI_TOKEN} failed`);
    const stored = generationLogFor(ctx.db, assessmentId).at(-1)!;
    expect(stored.message).not.toContain(CLI_TOKEN);
  });
});

describe("no answer key reaches it", () => {
  test("nothing an item says appears in the log", async () => {
    const res = await ctx.app.inject({ method: "GET", url: logUrl(), ...as(admin) });
    expect(res.statusCode).toBe(200);

    const items = ctx.db
      .select()
      .from(schema.assessmentItems)
      .where(eq(schema.assessmentItems.assessmentId, assessmentId))
      .all();

    const keyMaterial: string[] = [];
    for (const item of items) {
      const payload = item.payload as { prompt?: string; options?: string[]; starterCode?: string };
      const key = item.key as {
        rationale?: string;
        expectedOutput?: string;
        referenceSolution?: string;
        rubric?: { point: string }[];
      };
      keyMaterial.push(
        ...(payload.options ?? []),
        ...(payload.prompt ? [payload.prompt] : []),
        ...(payload.starterCode ? [payload.starterCode] : []),
        ...(key.rationale ? [key.rationale] : []),
        ...(key.expectedOutput ? [key.expectedOutput] : []),
        ...(key.referenceSolution ? [key.referenceSolution] : []),
        ...(key.rubric ?? []).map((p) => p.point),
      );
      // The prose drop reason quotes the expected output and the critic's own answer, which is
      // exactly why the log carries a tag instead.
      if (item.dropReason) keyMaterial.push(item.dropReason);
    }

    // Short strings would match by accident; these are the ones a leak would actually be.
    const meaningful = [...new Set(keyMaterial)].filter((text) => text.trim().length >= 20);
    expect(meaningful.length).toBeGreaterThan(10);
    for (const text of meaningful) expect(res.body).not.toContain(text);

    // And no key-shaped field names either.
    expect(res.body).not.toContain("rationale");
    expect(res.body).not.toContain("correctIndices");
    expect(res.body).not.toContain("referenceSolution");
    expect(res.body).not.toContain("expectedOutput");

    // While still saying enough to be worth reading.
    expect(res.body).toContain("Dropped");
  });
});
