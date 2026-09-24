import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { itemBatchSchema, looseItemBatchSchema } from "../../../shared/assessment";
import type { GenerateJsonRequest, GenerateJsonResult } from "../ai/types";
import { MockProvider, type MockHints } from "../ai/adapters/mock";
import { AiService } from "../ai/service";
import { schema } from "../db";
import { SAMPLE_LEARNERS } from "../dev/sampleProfiles";
import type { Job } from "../jobs/queue";
import { adminSession, as, createTestApp, type Session, type TestContext } from "../test/harness";
import { blueprintHandler } from "./blueprintJob";
import { generationLogFor } from "./generationLog";
import { splitItemBatch } from "./validateItem";

/**
 * A batch with a bad item in it (the failure this file exists for).
 *
 * A live generation died on `items.14.rationale: Invalid input: expected string, received
 * undefined`. One item of roughly twenty was missing one field, the strict array parse threw away
 * the other nineteen, the retry hit another single bad item, and the area — then the whole
 * assessment — failed with a good blueprint already in hand.
 *
 * So: the batch is parsed element by element, a malformed item is dropped like any other item the
 * pipeline cannot use, and the provider is only asked again when nothing in the batch survived.
 */

let ctx: TestContext;
let admin: Session;

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
});

afterEach(async () => {
  await ctx.close();
});

// ---------------------------------------------------------------------------
// The split itself
// ---------------------------------------------------------------------------

const goodItem = (suffix: string) => ({
  kind: "mcq",
  difficulty: 3,
  topicIds: ["js-closures"],
  prompt: `A prompt long enough to pass the schema's minimum length (${suffix}).`,
  options: ["the correct one", "a distractor", "another distractor"],
  correctIndices: [0],
  rationale: "A rationale long enough to pass the schema's minimum length.",
});

describe("splitting a batch", () => {
  test("the strict schema is what killed the live run, and the lenient one is what saves it", () => {
    const noRationale: Record<string, unknown> = { ...goodItem("bad") };
    delete noRationale.rationale;
    const batch = { items: [goodItem("one"), noRationale] };

    // The exact production failure: `items.1.rationale: Invalid input: expected string, received
    // undefined` — and with it, both items.
    const strict = itemBatchSchema.safeParse(batch);
    expect(strict.success).toBe(false);
    expect(strict.error!.issues.some((i) => i.path.join(".") === "items.1.rationale")).toBe(true);

    const lenient = looseItemBatchSchema.safeParse(batch);
    expect(lenient.success).toBe(true);
    expect(splitItemBatch(lenient.data!.items).items).toHaveLength(1);
  });

  test("one item missing a field costs that item, not the batch", () => {
    const noRationale: Record<string, unknown> = { ...goodItem("bad") };
    delete noRationale.rationale;
    const split = splitItemBatch([goodItem("one"), noRationale, goodItem("three")]);

    expect(split.items).toHaveLength(2);
    expect(split.malformed).toHaveLength(1);
    expect(split.malformed[0].index).toBe(1);
    expect(split.malformed[0].paths).toContain("items.1.rationale");
  });

  test("a wrong-typed field is reported by path too", () => {
    const split = splitItemBatch([{ ...goodItem("typed"), difficulty: "hard" }, goodItem("fine")]);

    expect(split.items).toHaveLength(1);
    expect(split.malformed[0].paths).toContain("items.0.difficulty");
  });

  test("the paths carry no values, while the stored detail does say what was wrong", () => {
    const split = splitItemBatch([{ ...goodItem("detail"), difficulty: 9 }]);

    for (const path of split.malformed[0].paths) {
      expect(path).toMatch(/^items\.\d+(\.[\w[\]]+)*$/);
    }
    expect(split.malformed[0].detail).toMatch(/did not match the schema/);
    expect(split.malformed[0].detail).toContain("difficulty");
  });

  test("something that is not an object at all is malformed, not a crash", () => {
    const split = splitItemBatch([null, "an item", 42, goodItem("survivor")]);

    expect(split.items).toHaveLength(1);
    expect(split.malformed).toHaveLength(3);
    expect(split.malformed.every((m) => m.paths.length > 0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// The same thing, through the job that killed a live generation
// ---------------------------------------------------------------------------

/** Values a log line must never carry, taken from the fixture items the corruption preserves. */
const RATIONALE_TEXT = "Tests whether the candidate can read code and predict its output.";
const OPTION_TEXT = "The correct explanation, which describes the actual mechanism";
const REFERENCE_SOLUTION = "numbers.filter((n) => n % 2 === 0)";

/**
 * The mock provider, with one area's batch damaged on its way out.
 *
 * Damaging the fixture itself would not do: the mock validates it against the contract schema, so
 * a corrupted fixture is a loud error rather than the thing production actually sees, which is a
 * model returning an item that does not match what it was asked for.
 */
class DamagedItemsProvider extends MockProvider {
  /** One entry per `items` call, so a test can prove a retry did or did not happen. */
  readonly itemCalls: number[] = [];
  /** What each `items` call asked for, and what it was willing to accept. */
  readonly schemasSeen: { validate: unknown; contract: unknown }[] = [];

  constructor(
    hints: MockHints,
    private readonly damage: (items: unknown[], call: number) => unknown[],
  ) {
    super(hints);
  }

  override async generateJson<T>(request: GenerateJsonRequest<T>): Promise<GenerateJsonResult<T>> {
    const result = await super.generateJson(request);
    if (request.schemaName !== "items") return result;

    const call = this.itemCalls.length;
    this.itemCalls.push(call);
    this.schemasSeen.push({ validate: request.schema, contract: request.contractSchema });
    const batch = result.data as { items: unknown[] };
    return { ...result, data: { items: this.damage(batch.items, call) } as T };
  }
}

/** Issues an assessment, then runs the blueprint job against a provider of the test's choosing. */
async function generateWith(damage: (items: unknown[], call: number) => unknown[]) {
  const sample = SAMPLE_LEARNERS[0];
  const created = await ctx.app.inject({
    method: "POST",
    url: "/api/admin/users",
    ...as(admin),
    payload: { username: sample.username, displayName: sample.displayName, profile: sample.profile, issueAssessment: false },
  });
  expect(created.statusCode).toBe(201);
  const userId = created.json().user.id as string;

  const issued = await ctx.app.inject({
    method: "POST",
    url: `/api/admin/users/${userId}/assessments`,
    ...as(admin),
    payload: {},
  });
  expect(issued.statusCode).toBe(202);
  const assessmentId = issued.json().assessmentId as string;

  const provider = new DamagedItemsProvider(
    {
      topicIds: ctx.content.orderedTopicIds,
      moduleIds: ctx.content.manifest.flatMap((t) => t.modules.filter((m) => m.available).map((m) => m.id)),
    },
    damage,
  );
  const handler = blueprintHandler({
    db: ctx.db,
    ai: new AiService(ctx.db, ctx.env, { mock: provider }),
    content: ctx.content,
    sandbox: ctx.app.sandbox,
  });

  const job: Job = { id: "test-job", type: "assessment.blueprint", payload: { assessmentId }, attempts: 1, maxAttempts: 3 };
  const failure = await handler(job).then(
    () => null,
    (error: unknown) => (error instanceof Error ? error : new Error(String(error))),
  );

  const items = ctx.db
    .select()
    .from(schema.assessmentItems)
    .where(eq(schema.assessmentItems.assessmentId, assessmentId))
    .all();

  return {
    assessmentId,
    provider,
    failure,
    assessment: ctx.db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get()!,
    pool: items.filter((i) => i.status === "pool"),
    dropped: items.filter((i) => i.status === "dropped"),
    log: generationLogFor(ctx.db, assessmentId),
  };
}

/** Drops `rationale` from the first item and mistypes a field on two more — the production shape. */
const damageThreeItems = (items: unknown[]): unknown[] =>
  items.map((item, index) => {
    const copy = { ...(item as Record<string, unknown>) };
    if (index === 0) delete copy.rationale;
    if (index === 1) copy.difficulty = "hard";
    if (copy.kind === "code") copy.visibleTests = "two of them";
    return copy;
  });

/** Leaves nothing in the batch parseable at all. */
const damageEverything = (items: unknown[]): unknown[] => items.map(() => ({ kind: "mcq" }));

describe("a batch with a bad item in it", () => {
  test("keeps the good items, drops the bad ones, and does not fail the job", async () => {
    const run = await generateWith(damageThreeItems);

    expect(run.failure, run.failure?.message).toBeNull();
    expect(run.assessment.status).toBe("awaiting_approval");
    expect(run.assessment.terminatedReason).toBeNull();
    // The nineteen that were fine are still there, area by area.
    expect(run.pool.length).toBeGreaterThan(10);
    expect(new Set(run.pool.map((i) => i.area)).size).toBeGreaterThanOrEqual(5);

    const schemaDrops = run.dropped.filter((i) => /did not match the schema/.test(i.dropReason ?? ""));
    const areas = (run.assessment.blueprint as { areas: unknown[] }).areas.length;
    expect(schemaDrops).toHaveLength(areas * 3);
    expect(schemaDrops.every((i) => i.dropReason && i.dropReason.length > 0)).toBe(true);
  }, 60_000);

  test("does not ask the provider again — one bad item in twenty is not a failed call", async () => {
    const run = await generateWith(damageThreeItems);

    const areas = (run.assessment.blueprint as { areas: unknown[] }).areas.length;
    expect(run.provider.itemCalls).toHaveLength(areas);
  }, 60_000);

  test("the model is still asked for the strict schema, whatever we are willing to accept", async () => {
    const run = await generateWith(damageThreeItems);

    expect(run.provider.schemasSeen.length).toBeGreaterThan(0);
    for (const seen of run.provider.schemasSeen) {
      // Leniency belongs on our side of the call. The schema the provider turns into JSON Schema
      // is the only thing that tells a model an item needs a `rationale` at all — sending the
      // lenient shape would make this very failure more likely, not less.
      expect(seen.validate).toBe(looseItemBatchSchema);
      expect(seen.contract).toBe(itemBatchSchema);
    }
  }, 60_000);

  test("says so in the log, by path and by code, and nowhere near an answer key", async () => {
    const run = await generateWith(damageThreeItems);

    const dropLines = run.log.filter((l) => l.message.includes("schema-invalid"));
    expect(dropLines.length).toBeGreaterThan(0);
    expect(dropLines.some((l) => l.message.includes("items.0.rationale"))).toBe(true);
    for (const line of dropLines) {
      expect(line.message).toMatch(/^Dropped a malformed item \S+ in ".+" — schema-invalid \(items\./);
    }

    // The whole log, not only those lines: a leak anywhere in it is a leak.
    const wholeLog = run.log.map((l) => l.message).join("\n");
    for (const secret of [RATIONALE_TEXT, OPTION_TEXT, REFERENCE_SOLUTION]) {
      expect(wholeLog).not.toContain(secret);
    }
    // Zod's own wording quotes what it received, so it stays on the item row.
    expect(wholeLog).not.toContain("Invalid input");
    expect(wholeLog).not.toContain("did not match the schema");
  }, 60_000);

  test("the pool preview shows the dropped item and the full reason", async () => {
    const run = await generateWith(damageThreeItems);

    const res = await ctx.app.inject({
      method: "GET",
      url: `/api/admin/assessments/${run.assessmentId}/pool`,
      ...as(admin),
    });
    expect(res.statusCode).toBe(200);

    const body = res.json() as { pool: { status: string; dropReason: string | null; payload: { prompt: string } }[] };
    const schemaDrop = body.pool.find((i) => /did not match the schema/.test(i.dropReason ?? ""));
    expect(schemaDrop).toBeDefined();
    expect(schemaDrop!.dropReason).toContain("rationale");
    // The card renders a prompt and a rationale unconditionally, so both have to be strings.
    expect(typeof schemaDrop!.payload.prompt).toBe("string");
  }, 60_000);
});

describe("a batch nothing survives", () => {
  test("is asked for again, and the area is left out rather than failing the run", async () => {
    // The first area's two attempts are both ruined; every later area is fine.
    const run = await generateWith((items, call) => (call < 2 ? damageEverything(items) : items));

    expect(run.failure, run.failure?.message).toBeNull();
    expect(run.assessment.status).toBe("awaiting_approval");

    const areas = (run.assessment.blueprint as { areas: { name: string }[] }).areas;
    // One extra call: the ruined area was asked for twice, every other area once.
    expect(run.provider.itemCalls).toHaveLength(areas.length + 1);

    const emptyArea = areas[0].name;
    expect(run.pool.some((i) => i.area === emptyArea)).toBe(false);
    expect(run.pool.length).toBeGreaterThan(10);

    const wholeLog = run.log.map((l) => l.message).join("\n");
    expect(wholeLog).toContain(`Area "${emptyArea}" came back with nothing usable`);
    expect(wholeLog).toMatch(/came out thinner than planned/);
  }, 60_000);

  test("every area failing is what does fail the run, with a reason the admin can read", async () => {
    const run = await generateWith(damageEverything);

    expect(run.failure).not.toBeNull();
    expect(run.assessment.status).toBe("failed");
    expect(run.assessment.terminatedReason).toMatch(/not enough to serve an assessment/);
    // Still not silent: every unusable item was recorded on the way down.
    expect(run.dropped.length).toBeGreaterThan(10);
  }, 60_000);
});
