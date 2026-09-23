import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { MIN_ITEM_TARGET } from "../../../shared/assessment";
import { schema } from "../db";
import { SAMPLE_LEARNERS } from "../dev/sampleProfiles";
import { adminSession, as, createTestApp, type Session, type TestContext } from "../test/harness";
import { normaliseOutput, validateGeneratedItem } from "./validateItem";

let ctx: TestContext;
let admin: Session;

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
});

afterEach(async () => {
  await ctx.close();
});

/** Onboards one of the sample learners and returns their id. */
async function onboardSample(index: number): Promise<string> {
  const sample = SAMPLE_LEARNERS[index];
  const res = await ctx.app.inject({
    method: "POST",
    url: "/api/admin/users",
    ...as(admin),
    payload: {
      username: sample.username,
      displayName: sample.displayName,
      profile: sample.profile,
      issueAssessment: false,
    },
  });
  expect(res.statusCode).toBe(201);
  return res.json().user.id;
}

async function issueAndGenerate(userId: string): Promise<string> {
  const issued = await ctx.app.inject({
    method: "POST",
    url: `/api/admin/users/${userId}/assessments`,
    ...as(admin),
    payload: {},
  });
  expect(issued.statusCode).toBe(202);
  await ctx.drainJobs();
  return issued.json().assessmentId as string;
}

describe("issuing", () => {
  test("creates a generating assessment and queues the blueprint job", async () => {
    const userId = await onboardSample(0);
    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/admin/users/${userId}/assessments`,
      ...as(admin),
      payload: {},
    });

    expect(res.statusCode).toBe(202);
    expect(res.json().status).toBe("generating");

    const job = ctx.db.select().from(schema.jobs).get()!;
    expect(job.type).toBe("assessment.blueprint");
  });

  test("refuses a second assessment while one is live", async () => {
    const userId = await onboardSample(0);
    await ctx.app.inject({ method: "POST", url: `/api/admin/users/${userId}/assessments`, ...as(admin), payload: {} });

    const second = await ctx.app.inject({
      method: "POST",
      url: `/api/admin/users/${userId}/assessments`,
      ...as(admin),
      payload: {},
    });
    expect(second.statusCode).toBe(409);
  });

  test("refuses to issue one for the superadmin", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/admin/users/${admin.user.id}/assessments`,
      ...as(admin),
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("generation, for each sample profile", () => {
  for (const [index, sample] of SAMPLE_LEARNERS.entries()) {
    test(`${sample.displayName} gets an assessment meeting the P4 bar, held for approval`, async () => {
      const userId = await onboardSample(index);
      const assessmentId = await issueAndGenerate(userId);

      const row = ctx.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get()!;
      // Generation stops at the gate: `ready` is now something a person (or the deadline) grants.
      expect(row.status, `status was ${row.status}: ${row.terminatedReason ?? ""}`).toBe("awaiting_approval");
      expect(row.awaitingApprovalSince).toBeGreaterThan(0);
      expect(row.approvedAt).toBeNull();

      const blueprint = row.blueprint as { areas: { name: string; moduleIds: string[] }[] };
      // Brief §17 P4: at least 25 validated items across at least 5 areas.
      expect(blueprint.areas.length).toBeGreaterThanOrEqual(5);

      const items = ctx.db
        .select()
        .from(schema.assessmentItems)
        .where(eq(schema.assessmentItems.assessmentId, assessmentId))
        .all();
      const pool = items.filter((i) => i.status === "pool");

      expect(pool.length).toBeGreaterThanOrEqual(MIN_ITEM_TARGET);
      expect(new Set(pool.map((i) => i.area)).size).toBeGreaterThanOrEqual(5);

      // Every kept item's topic tags are real.
      for (const item of pool) {
        expect(item.topicIds.length).toBeGreaterThan(0);
        for (const topicId of item.topicIds) {
          expect(ctx.content.hasTopic(topicId), `${topicId} should be a real topic`).toBe(true);
        }
      }

      // Difficulty is spread, not bunched at one level.
      expect(new Set(pool.map((i) => i.difficulty)).size).toBeGreaterThanOrEqual(4);

      // Written answers are present and sit outside the adaptive areas.
      expect(pool.filter((i) => i.kind === "explain").length).toBeGreaterThanOrEqual(2);
    }, 60_000);
  }
});

describe("validation and dropping", () => {
  test("dropped items are stored with a readable reason", async () => {
    const userId = await onboardSample(0);
    const assessmentId = await issueAndGenerate(userId);

    const dropped = ctx.db
      .select()
      .from(schema.assessmentItems)
      .where(eq(schema.assessmentItems.assessmentId, assessmentId))
      .all()
      .filter((i) => i.status === "dropped");

    expect(dropped.length).toBeGreaterThan(0);
    for (const item of dropped) {
      expect(item.dropReason, `item ${item.id} was dropped with no reason`).toBeTruthy();
    }
    // The fixture includes an item tagged with a topic that does not exist, and one the critic
    // rejects, so both rejection paths run on every generation.
    expect(dropped.some((i) => /not in the curriculum/i.test(i.dropReason ?? ""))).toBe(true);
    expect(dropped.some((i) => /critic/i.test(i.dropReason ?? ""))).toBe(true);
  }, 60_000);

  test("a code item is only kept when its reference solution really passes", async () => {
    const userId = await onboardSample(0);
    const assessmentId = await issueAndGenerate(userId);

    const codeItems = ctx.db
      .select()
      .from(schema.assessmentItems)
      .where(eq(schema.assessmentItems.assessmentId, assessmentId))
      .all()
      .filter((i) => i.kind === "code" && i.status === "pool");

    expect(codeItems.length).toBeGreaterThan(0);
    for (const item of codeItems) {
      const payload = item.payload as { functionName: string; starterCode: string; visibleTests: unknown[] };
      const key = item.key as { referenceSolution: string; hiddenTests: unknown[] };
      const tests = [...(payload.visibleTests as never[]), ...(key.hiddenTests as never[])];

      const solution = await ctx.app.sandbox.run({
        code: key.referenceSolution,
        functionName: payload.functionName,
        testCases: tests,
      });
      expect(solution.passedCount).toBe(tests.length);

      const starter = await ctx.app.sandbox.run({
        code: payload.starterCode,
        functionName: payload.functionName,
        testCases: tests,
      });
      expect(starter.passedCount).toBeLessThan(tests.length);
    }
  }, 60_000);

  test("at most three code items survive across the whole assessment", async () => {
    const userId = await onboardSample(2);
    const assessmentId = await issueAndGenerate(userId);

    const code = ctx.db
      .select()
      .from(schema.assessmentItems)
      .where(eq(schema.assessmentItems.assessmentId, assessmentId))
      .all()
      .filter((i) => i.kind === "code" && i.status === "pool");

    expect(code.length).toBeLessThanOrEqual(3);
  }, 60_000);
});

describe("item validation rules", () => {
  const known = new Set(["js-closures"]);
  const base = {
    difficulty: 3 as const,
    topicIds: ["js-closures"],
    prompt: "A prompt long enough to pass the schema's minimum length.",
    rationale: "A rationale long enough to pass the schema's minimum length.",
  };

  test("rejects an item tagged only with unknown topics", () => {
    const result = validateGeneratedItem(
      { ...base, kind: "mcq", topicIds: ["nope"], options: ["a", "b", "c"], correctIndices: [0] },
      known,
    );
    expect(result.ok).toBe(false);
  });

  test("rejects a multi-select with only one correct option", () => {
    const result = validateGeneratedItem(
      { ...base, kind: "multi", options: ["a", "b", "c", "d"], correctIndices: [1] },
      known,
    );
    expect(result).toMatchObject({ ok: false, reason: expect.stringMatching(/two or more/) });
  });

  test("rejects an item where every option is correct", () => {
    const result = validateGeneratedItem(
      { ...base, kind: "multi", options: ["a", "b", "c"], correctIndices: [0, 1, 2] },
      known,
    );
    expect(result).toMatchObject({ ok: false, reason: expect.stringMatching(/Every option/) });
  });

  test("rejects a prompt that references option positions, because options are shuffled", () => {
    const result = validateGeneratedItem(
      {
        ...base,
        kind: "mcq",
        prompt: "Which is correct, option A or option C? Consider the code above carefully.",
        options: ["a", "b", "c"],
        correctIndices: [0],
      },
      known,
    );
    expect(result).toMatchObject({ ok: false, reason: expect.stringMatching(/option positions/) });
  });

  test("rejects duplicate options", () => {
    const result = validateGeneratedItem(
      { ...base, kind: "mcq", options: ["same", "Same ", "other"], correctIndices: [0] },
      known,
    );
    expect(result).toMatchObject({ ok: false, reason: expect.stringMatching(/duplicate/i) });
  });

  test("normalises predict_output so a correct answer does not fail on whitespace", () => {
    expect(normaliseOutput("  2,4,6  ")).toBe("2,4,6");
    expect(normaliseOutput("a   b\n  c  ")).toBe("a b\nc");
    expect(normaliseOutput("line1\r\nline2")).toBe("line1\nline2");
  });

  test("rejects a code item whose starter does not declare the function", () => {
    const result = validateGeneratedItem(
      {
        ...base,
        kind: "code",
        functionName: "solve",
        starterCode: "function other() {}",
        referenceSolution: "function solve() { return 1; }",
        visibleTests: [
          { args: [], expected: 1, description: "one" },
          { args: [], expected: 1, description: "two" },
        ],
        hiddenTests: [
          { args: [], expected: 1, description: "three" },
          { args: [], expected: 1, description: "four" },
        ],
      },
      known,
    );
    expect(result).toMatchObject({ ok: false, reason: expect.stringMatching(/does not declare solve/) });
  });

  test("rejects an explain item whose rubric weights are nowhere near 1", () => {
    const result = validateGeneratedItem(
      {
        ...base,
        kind: "explain",
        rubric: [
          { point: "A point that a reader could agree is present", weight: 1 },
          { point: "Another point that a reader could agree is present", weight: 1 },
          { point: "A third point that a reader could agree is present", weight: 1 },
        ],
      },
      known,
    );
    expect(result).toMatchObject({ ok: false, reason: expect.stringMatching(/sum to/) });
  });
});

describe("the admin pool preview", () => {
  test("shows kept and dropped items with keys, rationales and verdicts", async () => {
    const userId = await onboardSample(0);
    const assessmentId = await issueAndGenerate(userId);

    const res = await ctx.app.inject({ method: "GET", url: `/api/admin/assessments/${assessmentId}/pool`, ...as(admin) });
    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body.assessment.status).toBe("awaiting_approval");
    expect(body.pool.length).toBeGreaterThan(body.assessment.itemCounts.pool);

    const kept = body.pool.find((i: { status: string }) => i.status === "pool");
    expect(kept.key.rationale).toBeTruthy();
    expect(kept.criticVerdict).not.toBeNull();

    const dropped = body.pool.find((i: { status: string }) => i.status === "dropped");
    expect(dropped.dropReason).toBeTruthy();
  }, 60_000);

  test("a learner cannot read a pool", async () => {
    const userId = await onboardSample(0);
    const assessmentId = await issueAndGenerate(userId);

    // The learner hasn't changed their password, so this proves the guard chain end to end.
    const res = await ctx.app.inject({ method: "GET", url: `/api/admin/assessments/${assessmentId}/pool` });
    expect(res.statusCode).toBe(401);
  }, 60_000);
});
