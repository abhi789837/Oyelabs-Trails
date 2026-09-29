import fs from "node:fs";
import path from "node:path";

import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";

import { schema } from "../db";
import { now } from "../lib/ids";
import { activeLearner, adminSession, createTestApp, type Session, type TestContext } from "../test/harness";
import { getFocus, listTargets, setFocus, setTargets } from "./repo";

/**
 * Targets: the ordered list an admin sets, and the migration that carries the old one across.
 *
 * The backfill is the test that matters most here. `learner_priorities.must_have` holds the
 * priorities already set on live accounts, and the moment the assessment starts reading
 * `learner_targets` instead, anything left behind means a generic test for a learner whose admin
 * had said exactly what to ask about.
 */

let ctx: TestContext;
let admin: Session;
let learner: { id: string; username: string; session: Session };

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  learner = await activeLearner(ctx, admin);
});

describe("writing targets", () => {
  test("keeps the admin's order within a priority", () => {
    setTargets(ctx.db, learner.id, [
      { skill: "Testing with Jest", priority: "medium", position: 0, targetDate: null },
      { skill: "Docker deployment", priority: "high", position: 1, targetDate: null },
      { skill: "Laravel REST APIs", priority: "high", position: 0, targetDate: null },
    ]);

    /* Position is rewritten from the order given, not trusted from the client: two targets claiming
       position 0 would otherwise be ranked by row insertion order, which is not something anybody
       dragged. The array order is the truth. */
    expect(listTargets(ctx.db, learner.id).map((t) => t.skill)).toEqual([
      "Docker deployment",
      "Laravel REST APIs",
      "Testing with Jest",
    ]);
  });

  test("replaces wholesale rather than merging", () => {
    setTargets(ctx.db, learner.id, [
      { skill: "Gone next time", priority: "high", position: 0, targetDate: null },
      { skill: "Kept", priority: "high", position: 1, targetDate: null },
    ]);
    setTargets(ctx.db, learner.id, [{ skill: "Kept", priority: "high", position: 0, targetDate: null }]);

    expect(listTargets(ctx.db, learner.id).map((t) => t.skill)).toEqual(["Kept"]);
  });

  test("a reorder keeps the ids, so it is not a delete and an insert", () => {
    setTargets(ctx.db, learner.id, [
      { skill: "First", priority: "high", position: 0, targetDate: null },
      { skill: "Second", priority: "high", position: 1, targetDate: null },
    ]);
    const before = new Map(listTargets(ctx.db, learner.id).map((t) => [t.skill, t.id]));

    setTargets(ctx.db, learner.id, [
      { skill: "Second", priority: "high", position: 0, targetDate: null },
      { skill: "First", priority: "high", position: 1, targetDate: null },
    ]);
    const after = new Map(listTargets(ctx.db, learner.id).map((t) => [t.skill, t.id]));

    expect(after.get("First")).toBe(before.get("First"));
    expect(after.get("Second")).toBe(before.get("Second"));
  });

  test("positions restart per priority", () => {
    setTargets(ctx.db, learner.id, [
      { skill: "H1", priority: "high", position: 0, targetDate: null },
      { skill: "M1", priority: "medium", position: 0, targetDate: null },
      { skill: "H2", priority: "high", position: 0, targetDate: null },
    ]);
    const rows = ctx.db.select().from(schema.learnerTargets).where(eq(schema.learnerTargets.userId, learner.id)).all();
    expect(rows.find((r) => r.skill === "H1")!.position).toBe(0);
    expect(rows.find((r) => r.skill === "H2")!.position).toBe(1);
    expect(rows.find((r) => r.skill === "M1")!.position).toBe(0);
  });

  test("a blank skill is dropped rather than stored", () => {
    setTargets(ctx.db, learner.id, [
      { skill: "  ", priority: "high", position: 0, targetDate: null },
      { skill: "Real", priority: "high", position: 1, targetDate: null },
    ]);
    expect(listTargets(ctx.db, learner.id).map((t) => t.skill)).toEqual(["Real"]);
  });

  test("a target date is kept as given", () => {
    setTargets(ctx.db, learner.id, [{ skill: "Ship it", priority: "high", position: 0, targetDate: "2026-12-01" }]);
    expect(listTargets(ctx.db, learner.id)[0].targetDate).toBe("2026-12-01");
  });
});

describe("the track and the stack", () => {
  test("are written onto the profile and read back together with the targets", () => {
    setFocus(ctx.db, learner.id, { track: "backend", stack: "PHP + Laravel", selfLevel: 3 }, admin.user.id);
    setTargets(ctx.db, learner.id, [{ skill: "Docker deployment", priority: "high", position: 0, targetDate: null }]);

    const focus = getFocus(ctx.db, learner.id);
    expect(focus.track).toBe("backend");
    expect(focus.stack).toBe("PHP + Laravel");
    expect(focus.selfLevel).toBe(3);
    expect(focus.targets).toHaveLength(1);
  });

  test("setting one field does not blank the others", () => {
    setFocus(ctx.db, learner.id, { track: "backend", stack: "PHP + Laravel" }, admin.user.id);
    setFocus(ctx.db, learner.id, { selfLevel: 4 }, admin.user.id);

    const focus = getFocus(ctx.db, learner.id);
    expect(focus.track).toBe("backend");
    expect(focus.stack).toBe("PHP + Laravel");
    expect(focus.selfLevel).toBe(4);
  });

  test("works for a learner whose profile row does not exist yet", () => {
    // Every account onboarded before these columns existed. The first save has to create the row.
    ctx.db.delete(schema.learnerProfiles).where(eq(schema.learnerProfiles.userId, learner.id)).run();
    setFocus(ctx.db, learner.id, { track: "devops", stack: "Terraform + AWS" }, admin.user.id);
    expect(getFocus(ctx.db, learner.id).track).toBe("devops");
  });

  test("the notes an admin wrote survive a focus change", () => {
    ctx.db
      .update(schema.learnerProfiles)
      .set({ adminNotes: "Strong on SQL, shaky on deployment." })
      .where(eq(schema.learnerProfiles.userId, learner.id))
      .run();

    setFocus(ctx.db, learner.id, { track: "backend", stack: "PHP + Laravel" }, admin.user.id);

    const row = ctx.db.select().from(schema.learnerProfiles).where(eq(schema.learnerProfiles.userId, learner.id)).get()!;
    expect(row.adminNotes).toBe("Strong on SQL, shaky on deployment.");
  });
});

describe("the migration backfill", () => {
  test("turns existing must-have priorities into targets, in their original order", () => {
    /* Simulates the live state: a `learner_priorities` row written before `learner_targets` existed.
       The migration has already run on this database, so the backfill is re-run here as the
       migration would run it — the `NOT EXISTS` guard is what makes that safe and is itself the
       thing being checked. */
    ctx.db
      .insert(schema.learnerPriorities)
      .values({
        userId: learner.id,
        targetRole: "Backend Engineer - Laravel",
        mustHave: [
          { skill: "Docker deployment", weight: "high" },
          { skill: "Laravel REST APIs", weight: "high" },
          { skill: "Testing with Jest", weight: "medium" },
        ],
        skip: [],
        deadlineWeeks: null,
        courseCap: 5,
        autoPublish: false,
        hoursPerWeek: 15,
        daysPerWeek: 5,
        weekStartsMonday: false,
        updatedBy: admin.user.id,
        updatedAt: now(),
      })
      .run();

    runBackfill();

    const targets = listTargets(ctx.db, learner.id);
    expect(targets.map((t) => t.skill)).toEqual(["Docker deployment", "Laravel REST APIs", "Testing with Jest"]);
    expect(targets.map((t) => t.priority)).toEqual(["high", "high", "medium"]);
  });

  test("running it twice does not duplicate anything", () => {
    ctx.db
      .insert(schema.learnerPriorities)
      .values({
        userId: learner.id,
        targetRole: "",
        mustHave: [{ skill: "Docker deployment", weight: "high" }],
        skip: [],
        deadlineWeeks: null,
        courseCap: 5,
        autoPublish: false,
        hoursPerWeek: 15,
        daysPerWeek: 5,
        weekStartsMonday: false,
        updatedBy: admin.user.id,
        updatedAt: now(),
      })
      .run();

    runBackfill();
    runBackfill();

    expect(listTargets(ctx.db, learner.id)).toHaveLength(1);
  });

  test("skips a blank skill rather than creating an unnamed target", () => {
    ctx.db
      .insert(schema.learnerPriorities)
      .values({
        userId: learner.id,
        targetRole: "",
        mustHave: [{ skill: "   ", weight: "high" }, { skill: "Real", weight: "low" }],
        skip: [],
        deadlineWeeks: null,
        courseCap: 5,
        autoPublish: false,
        hoursPerWeek: 15,
        daysPerWeek: 5,
        weekStartsMonday: false,
        updatedBy: admin.user.id,
        updatedAt: now(),
      })
      .run();

    runBackfill();
    expect(listTargets(ctx.db, learner.id).map((t) => t.skill)).toEqual(["Real"]);
  });
});

/**
 * The backfill statement from `0009_learner_targets.sql`, read from the file itself.
 *
 * Read rather than retyped: a copy in the test would keep passing after somebody edited the
 * migration, which is the one thing this test exists to prevent.
 */
function runBackfill(): void {
  const statement = backfillStatement();
  ctx.db.run(sql.raw(statement));
}

let cachedStatement: string | null = null;
function backfillStatement(): string {
  if (cachedStatement) return cachedStatement;
  const file = path.resolve(process.cwd(), "server/drizzle/0009_learner_targets.sql");
  const parts = fs.readFileSync(file, "utf8").split("--> statement-breakpoint");
  const insert = parts.find((part) => part.includes("INSERT INTO `learner_targets`"));
  if (!insert) throw new Error("0009_learner_targets.sql no longer contains the backfill INSERT.");
  cachedStatement = insert.trim();
  return cachedStatement;
}
