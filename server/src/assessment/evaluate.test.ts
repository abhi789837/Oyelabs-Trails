import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import type { EvaluationResult, ItemKey } from "../../../shared/assessment";
import { schema } from "../db";
import { SAMPLE_LEARNERS } from "../dev/sampleProfiles";
import {
  activeLearner,
  adminSession,
  approveAssessment,
  as,
  createTestApp,
  type Session,
  type TestContext,
} from "../test/harness";
import { fallbackPlan, validatePlan } from "./planValidation";

let ctx: TestContext;
let admin: Session;
let learner: { id: string; username: string; session: Session };
let assessmentId: string;

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
  // Generation stops at the approval gate; these tests are about what happens after it.
  await approveAssessment(ctx, admin, assessmentId);
});

afterEach(async () => {
  await ctx.close();
});

const url = (suffix: string) => `/api/assessment/${assessmentId}${suffix}`;

/** Takes the whole test, answering everything correctly, and submits. */
async function takeAndSubmit(limit = 40): Promise<number> {
  await ctx.app.inject({ method: "POST", url: url("/consent"), ...as(learner.session), payload: { agreed: true } });
  await ctx.app.inject({ method: "POST", url: url("/start"), ...as(learner.session), payload: {} });

  let answered = 0;
  for (let i = 0; i < limit; i++) {
    const next = await ctx.app.inject({ method: "GET", url: url("/next"), ...as(learner.session) });
    const body = next.json();
    if (body.done || !body.item) break;

    const row = ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, body.item.id)).get()!;
    const key = row.key as ItemKey;
    const payload =
      row.kind === "predict_output"
        ? { text: key.expectedOutput }
        : row.kind === "explain"
          ? { text: "Adding an index costs write time because every insert must also update the index." }
          : row.kind === "code"
            ? { code: key.referenceSolution }
            : { selected: key.correctIndices };

    await ctx.app.inject({ method: "POST", url: url(`/items/${body.item.id}`), ...as(learner.session), payload });
    answered += 1;
  }

  await ctx.app.inject({ method: "POST", url: url("/submit"), ...as(learner.session), payload: {} });
  return answered;
}

describe("the evaluation job", () => {
  test("turns a submitted assessment into an evaluation and a published plan", async () => {
    const answered = await takeAndSubmit();
    expect(answered).toBeGreaterThan(5);

    await ctx.drainJobs();

    const assessment = ctx.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get()!;
    expect(assessment.status, assessment.terminatedReason ?? "").toBe("completed");

    const evaluation = ctx.db.select().from(schema.evaluations).where(eq(schema.evaluations.assessmentId, assessmentId)).get();
    expect(evaluation).toBeDefined();

    const result = evaluation!.result as EvaluationResult;
    expect(result.overallLevel).toBeGreaterThanOrEqual(1);
    expect(result.areas.length).toBeGreaterThan(0);
    expect(result.learnerSummary.length).toBeGreaterThan(20);

    const plan = ctx.db.select().from(schema.learningPlans).where(eq(schema.learningPlans.userId, learner.id)).get();
    expect(plan).toBeDefined();
    expect(plan!.source).toBe("ai");
    expect(plan!.topicIds.length).toBeGreaterThanOrEqual(5);
    for (const topicId of plan!.topicIds) expect(ctx.content.hasTopic(topicId)).toBe(true);
  }, 120_000);

  test("the published plan is what the learner then sees, and nothing else", async () => {
    await takeAndSubmit();
    await ctx.drainJobs();

    const plan = ctx.db.select().from(schema.learningPlans).where(eq(schema.learningPlans.userId, learner.id)).get()!;
    const manifest = await ctx.app.inject({ method: "GET", url: "/api/me/manifest", ...as(learner.session) });

    const visible = manifest
      .json()
      .tracks.flatMap((t: { modules: { topics: { id: string }[] }[] }) => t.modules.flatMap((m) => m.topics.map((x) => x.id)));
    expect([...visible].sort()).toEqual([...plan.topicIds].sort());
  }, 120_000);

  test("the learner is notified, and so is the admin", async () => {
    await takeAndSubmit();
    await ctx.drainJobs();

    const theirs = ctx.db.select().from(schema.notifications).where(eq(schema.notifications.recipientId, learner.id)).all();
    expect(theirs.some((n) => n.kind === "plan.published")).toBe(true);

    const admins = ctx.db.select().from(schema.notifications).where(eq(schema.notifications.recipientId, admin.user.id)).all();
    expect(admins.some((n) => n.kind === "evaluation.ready")).toBe(true);
  }, 120_000);

  test("a terminated assessment is still evaluated, and the report records that", async () => {
    await ctx.app.inject({ method: "POST", url: url("/consent"), ...as(learner.session), payload: { agreed: true } });
    await ctx.app.inject({ method: "POST", url: url("/start"), ...as(learner.session), payload: {} });

    const next = await ctx.app.inject({ method: "GET", url: url("/next"), ...as(learner.session) });
    const item = next.json().item;
    const key = ctx.db.select().from(schema.assessmentItems).where(eq(schema.assessmentItems.id, item.id)).get()!.key as ItemKey;
    await ctx.app.inject({
      method: "POST",
      url: url(`/items/${item.id}`),
      ...as(learner.session),
      payload: { selected: key.correctIndices, text: key.expectedOutput },
    });

    for (const type of ["tab_hidden", "window_blur", "paste_attempt"]) {
      await ctx.app.inject({
        method: "POST",
        url: url("/events"),
        ...as(learner.session),
        payload: { type, severity: "hard", clientTs: Date.now() },
      });
    }

    await ctx.drainJobs();

    // Brief §18 answer 2: a terminated assessment still produces a plan, flagged for review.
    const evaluation = ctx.db.select().from(schema.evaluations).where(eq(schema.evaluations.assessmentId, assessmentId)).get();
    expect(evaluation).toBeDefined();
    expect((evaluation!.result as { terminated: boolean }).terminated).toBe(true);

    const plan = ctx.db.select().from(schema.learningPlans).where(eq(schema.learningPlans.userId, learner.id)).get();
    expect(plan).toBeDefined();

    const adminNotes = ctx.db.select().from(schema.notifications).where(eq(schema.notifications.recipientId, admin.user.id)).all();
    expect(adminNotes.some((n) => n.body.includes("terminated"))).toBe(true);
  }, 120_000);

  test("finishes well inside the ten-minute budget, with no artificial delay", async () => {
    await takeAndSubmit();
    const started = Date.now();
    await ctx.drainJobs();
    const elapsed = Date.now() - started;

    // Against the mock this is milliseconds; the assertion exists to catch a sleep being added.
    expect(elapsed).toBeLessThan(10 * 60_000);
  }, 120_000);
});

describe("plan validation", () => {
  test("drops topic ids that are not in the curriculum", () => {
    const result = validatePlan({ content: ctx.content, topicIds: ["js-closures", "not-a-topic", "js-hoisting"] });
    expect(result.topicIds).not.toContain("not-a-topic");
    expect(result.dropped).toEqual(["not-a-topic"]);
    expect(result.warnings.join(" ")).toMatch(/not in the curriculum/);
  });

  test("removes duplicates", () => {
    const result = validatePlan({ content: ctx.content, topicIds: ["js-closures", "js-closures", "js-hoisting"] });
    expect(result.topicIds.filter((id) => id === "js-closures")).toHaveLength(1);
  });

  test("sorts topics into curriculum order within a module", () => {
    // Submitted deliberately backwards.
    const result = validatePlan({ content: ctx.content, topicIds: ["js-closures", "js-hoisting", "js-call-stack"] });
    const order = result.topicIds.map((id) => ctx.content.topicIndex.get(id)!.order);
    expect([...order]).toEqual([...order].sort((a, b) => a - b));
  });

  test("keeps the AI's module order while fixing the order inside each module", () => {
    const backend = ctx.content.manifest.find((t) => t.id === "backend")!.modules.find((m) => m.available)!;
    const frontend = ctx.content.manifest.find((t) => t.id === "frontend")!.modules.find((m) => m.available)!;

    const result = validatePlan({
      content: ctx.content,
      // Backend module first, which is not curriculum order.
      topicIds: [backend.topics[1].id, backend.topics[0].id, frontend.topics[1].id, frontend.topics[0].id],
    });

    expect(ctx.content.topicIndex.get(result.topicIds[0])!.moduleId).toBe(backend.id);
    expect(result.topicIds.slice(-2).every((id) => ctx.content.topicIndex.get(id)!.moduleId === frontend.id)).toBe(true);
  });

  test("fills in prerequisites so a plan never starts mid-module", () => {
    const module = ctx.content.manifest[0].modules.find((m) => m.available && m.topics.length > 4)!;
    const fifth = module.topics[4];

    const result = validatePlan({ content: ctx.content, topicIds: [fifth.id] });
    expect(result.topicIds.length).toBeGreaterThan(1);
    expect(result.topicIds.at(-1)).toBe(fifth.id);
    expect(result.addedPrerequisites.length).toBeGreaterThan(0);
    expect(result.warnings.join(" ")).toMatch(/prerequisite/);
  });

  test("does not re-add a prerequisite the learner already completed", () => {
    const module = ctx.content.manifest[0].modules.find((m) => m.available && m.topics.length > 4)!;
    const completed = new Set([module.topics[0].id, module.topics[1].id]);

    const result = validatePlan({ content: ctx.content, topicIds: [module.topics[4].id], completedTopicIds: completed });
    expect(result.topicIds).not.toContain(module.topics[0].id);
    expect(result.topicIds).not.toContain(module.topics[1].id);
  });

  test("leaves a mastered module alone rather than filling it in", () => {
    const module = ctx.content.manifest[0].modules.find((m) => m.available && m.topics.length > 4)!;
    const result = validatePlan({
      content: ctx.content,
      topicIds: [module.topics[4].id],
      masteredModuleIds: new Set([module.id]),
    });
    expect(result.topicIds).toEqual([module.topics[4].id]);
  });

  test("warns when the plan is below the minimum size", () => {
    const result = validatePlan({ content: ctx.content, topicIds: ["js-closures"], masteredModuleIds: new Set(["fe-js-core"]) });
    expect(result.warnings.join(" ")).toMatch(/minimum/);
  });

  test("the fallback plan is real, ordered and non-empty", () => {
    const ids = fallbackPlan(ctx.content, ["frontend"], 10);
    expect(ids.length).toBe(10);
    for (const id of ids) expect(ctx.content.hasTopic(id)).toBe(true);
    const order = ids.map((id) => ctx.content.topicIndex.get(id)!.order);
    expect([...order]).toEqual([...order].sort((a, b) => a - b));
  });
});
