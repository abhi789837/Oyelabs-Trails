import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";

import { schema } from "../db";
import { activeLearner, adminSession, createTestApp, type Session, type TestContext } from "../test/harness";
import { getFocus, setFocus, setTargets } from "./repo";

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
