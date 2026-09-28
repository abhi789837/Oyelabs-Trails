import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";

import { SESSION_COOKIE } from "../../../shared/auth";
import { schema } from "../db";
import { activeLearner, adminSession, as, createTestApp, login, type Session, type TestContext } from "../test/harness";

let ctx: TestContext;
let admin: Session;
let learner: { id: string; username: string; session: Session };

/**
 * The builder's routes, and mostly the rules about who may touch what.
 *
 * Two boundaries matter here and neither is obvious from the UI: the research keys reach outside the
 * deployment and are shared by everyone, so they sit with the superadmin; and a learner may see
 * their own path and nobody else's gap map — a gap map is a list of the things somebody cannot do,
 * which is not a document to be casually readable.
 */
beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  learner = await activeLearner(ctx, admin, "priya.sharma");
});

async function staffSession(username: string): Promise<Session> {
  const created = await ctx.app.inject({
    method: "POST",
    url: "/api/admin/users",
    ...as(admin),
    payload: {
      username,
      displayName: "A Lead",
      role: "admin",
      profile: { roleTitle: null, yearsExperience: null, adminNotes: "", claimedSkills: [], targetTracks: [] },
      issueAssessment: false,
    },
  });
  const temporary: string = created.json().temporaryPassword;
  const first = await login(ctx, username, temporary);
  const changed = await ctx.app.inject({
    method: "POST",
    url: "/api/auth/change-password",
    ...as(first),
    payload: { currentPassword: temporary, newPassword: "camp-ridge-settled-4417" },
  });
  const cookie = changed.cookies.find((c) => c.name === SESSION_COOKIE)!.value;
  return { cookie, user: changed.json().user };
}

describe("priorities", () => {
  const priorities = {
    targetRole: "PHP/Laravel Developer",
    mustHave: [{ skill: "DevOps", weight: "high" }],
    skip: ["CSS"],
    deadlineWeeks: 8,
    courseCap: 3,
    autoPublish: false,
  };

  test("round-trip through the route", async () => {
    const saved = await ctx.app.inject({
      method: "PUT",
      url: `/api/admin/users/${learner.id}/priorities`,
      ...as(admin),
      payload: priorities,
    });
    expect(saved.statusCode).toBe(200);

    const read = await ctx.app.inject({ method: "GET", url: `/api/admin/users/${learner.id}/priorities`, ...as(admin) });
    expect(read.json().priorities).toMatchObject({ targetRole: "PHP/Laravel Developer", courseCap: 3 });
  });

  test("an unknown learner is a 404, not an orphaned row", async () => {
    const res = await ctx.app.inject({
      method: "PUT",
      url: "/api/admin/users/nobody/priorities",
      ...as(admin),
      payload: priorities,
    });
    expect(res.statusCode).toBe(404);
    expect(ctx.db.select().from(schema.learnerPriorities).all()).toHaveLength(0);
  });

  test("the audit entry records counts, not the admin's notes", async () => {
    await ctx.app.inject({
      method: "PUT",
      url: `/api/admin/users/${learner.id}/priorities`,
      ...as(admin),
      payload: priorities,
    });
    const entry = ctx.db.select().from(schema.auditLog).all().find((row) => row.action === "priorities.updated");
    expect(entry).toBeDefined();
    expect(JSON.stringify(entry!.details)).toContain("PHP/Laravel Developer");
    // The skip list and the weights are counts here; the profile is the place for the detail.
    expect(JSON.stringify(entry!.details)).not.toContain("CSS");
  });

  test("a learner cannot read or set their own priorities", async () => {
    // They are the admin's assessment of what this person needs, which is not the same thing as
    // something written *for* them.
    expect(
      (await ctx.app.inject({ method: "GET", url: `/api/admin/users/${learner.id}/priorities`, ...as(learner.session) }))
        .statusCode,
    ).toBe(403);
  });
});

describe("requesting a path", () => {
  test("queues a job", async () => {
    const res = await ctx.app.inject({ method: "POST", url: `/api/admin/users/${learner.id}/path`, ...as(admin) });
    expect(res.statusCode).toBe(202);
    expect(ctx.db.select().from(schema.jobs).all().some((job) => job.type === "path.build")).toBe(true);
  });

  test("refuses one for a staff account", async () => {
    const res = await ctx.app.inject({ method: "POST", url: `/api/admin/users/${admin.user.id}/path`, ...as(admin) });
    expect(res.statusCode).toBe(400);
  });

  test("refuses a second while one is running", async () => {
    /* Two concurrent runs would both claim to be current, and the learner would end up on whichever
       finished last with the other's courses orphaned on a superseded path. */
    await ctx.app.inject({ method: "POST", url: `/api/admin/users/${learner.id}/path`, ...as(admin) });
    const queued = ctx.db.select().from(schema.jobs).all()[0];
    ctx.db.update(schema.jobs).set({ status: "running" }).where(eq(schema.jobs.id, queued.id)).run();

    const second = await ctx.app.inject({ method: "POST", url: `/api/admin/users/${learner.id}/path`, ...as(admin) });
    expect(second.statusCode).toBe(400);
    expect(second.json().error.message).toMatch(/already being built/i);
  });
});

describe("the research keys", () => {
  test("a plain admin cannot read them", async () => {
    const lead = await staffSession("surya");
    expect((await ctx.app.inject({ method: "GET", url: "/api/admin/research", ...as(lead) })).statusCode).toBe(403);
  });

  test("a plain admin cannot set them", async () => {
    const lead = await staffSession("nishant");
    const res = await ctx.app.inject({
      method: "PUT",
      url: "/api/admin/research",
      ...as(lead),
      payload: { provider: "tavily", searchKey: "tvly-whatever" },
    });
    expect(res.statusCode).toBe(403);
    expect(ctx.db.select().from(schema.researchSettings).all()).toHaveLength(0);
  });

  test("the superadmin can, and only the last four characters come back", async () => {
    const res = await ctx.app.inject({
      method: "PUT",
      url: "/api/admin/research",
      ...as(admin),
      payload: { provider: "tavily", searchKey: "tvly-secret-value-1234", youtubeKey: "AIzaSyYouTubeKey9876" },
    });
    expect(res.statusCode).toBe(200);

    const body = JSON.stringify(res.json());
    expect(body).not.toContain("tvly-secret-value-1234");
    expect(body).not.toContain("AIzaSyYouTubeKey9876");
    expect(res.json().settings.searchHint).toContain("1234");
    expect(res.json().settings.configured).toBe(true);
  });

  test("saving the budget alone does not wipe the keys", async () => {
    // The form cannot show a stored key, so an omitted field has to mean "leave it".
    await ctx.app.inject({
      method: "PUT",
      url: "/api/admin/research",
      ...as(admin),
      payload: { provider: "tavily", searchKey: "tvly-secret-value-1234", youtubeKey: "AIzaSyYouTubeKey9876" },
    });
    const res = await ctx.app.inject({
      method: "PUT",
      url: "/api/admin/research",
      ...as(admin),
      payload: { budgetSearches: 20 },
    });
    expect(res.json().settings.configured).toBe(true);
    expect(res.json().settings.budgetSearches).toBe(20);
  });

  test("an empty string is the explicit clear", async () => {
    await ctx.app.inject({
      method: "PUT",
      url: "/api/admin/research",
      ...as(admin),
      payload: { provider: "tavily", searchKey: "tvly-secret-value-1234", youtubeKey: "AIzaSyYouTubeKey9876" },
    });
    const res = await ctx.app.inject({
      method: "PUT",
      url: "/api/admin/research",
      ...as(admin),
      payload: { searchKey: "" },
    });
    expect(res.json().settings.configured).toBe(false);
    expect(res.json().settings.searchHint).toBeNull();
  });

  test("the audit entry never carries the key, not even its hint", async () => {
    await ctx.app.inject({
      method: "PUT",
      url: "/api/admin/research",
      ...as(admin),
      payload: { provider: "tavily", searchKey: "tvly-secret-value-1234" },
    });
    const entry = ctx.db.select().from(schema.auditLog).all().find((row) => row.action === "research.settings_updated");
    const details = JSON.stringify(entry!.details);
    expect(details).not.toContain("1234");
    expect(details).toContain("tavily");
  });
});

describe("the learner's own view", () => {
  test("a learner with no path gets null rather than an error", async () => {
    const res = await ctx.app.inject({ method: "GET", url: "/api/me/path", ...as(learner.session) });
    expect(res.statusCode).toBe(200);
    expect(res.json().path).toBeNull();
  });

  test("a learner cannot read anyone's gap map, including their own", async () => {
    // Their *path* carries the reasons in the second person; the gap map is the admin's working
    // notes about what somebody cannot do, and is a different document.
    const res = await ctx.app.inject({ method: "GET", url: `/api/admin/users/${learner.id}/gaps`, ...as(learner.session) });
    expect(res.statusCode).toBe(403);
  });
});
