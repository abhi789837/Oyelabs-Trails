import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Catalog } from "../../../../shared/catalog";
import { SESSION_COOKIE } from "../../../../shared/auth";
import { activeLearner, adminSession, login as signIn, type TestContext, createTestApp } from "../../test/harness";

let ctx: TestContext;

beforeEach(async () => {
  ctx = await createTestApp();
});
afterEach(async () => {
  await ctx.close();
});

/** A cookie header for a signed-in user of the given role, past the forced password change. */
async function login(role: "superadmin" | "admin" | "learner"): Promise<string> {
  const superadmin = await adminSession(ctx);
  if (role === "superadmin") return `${SESSION_COOKIE}=${superadmin.cookie}`;
  if (role === "learner") return `${SESSION_COOKIE}=${(await activeLearner(ctx, superadmin)).session.cookie}`;
  const created = await ctx.app.inject({
    method: "POST",
    url: "/api/admin/users",
    cookies: { [SESSION_COOKIE]: superadmin.cookie },
    payload: { username: "dept.admin", displayName: "Dept Admin", role: "admin", profile: { roleTitle: null, yearsExperience: null, adminNotes: "", claimedSkills: [], targetTracks: [] }, issueAssessment: false },
  });
  const first = await signIn(ctx, "dept.admin", created.json().temporaryPassword);
  const changed = await ctx.app.inject({
    method: "POST",
    url: "/api/auth/change-password",
    cookies: { [SESSION_COOKIE]: first.cookie },
    payload: { currentPassword: created.json().temporaryPassword, newPassword: "harbour-lantern-7712" },
  });
  return `${SESSION_COOKIE}=${changed.cookies.find((c) => c.name === SESSION_COOKIE)!.value}`;
}

describe("catalog", () => {
  it("seeds three departments and the soft-skills area with their tracks at boot", async () => {
    const cookie = await login("superadmin");
    const res = await ctx.app.inject({ method: "GET", url: "/api/admin/catalog", headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const catalog = res.json() as Catalog;
    expect(catalog.departments.map((d) => d.id)).toEqual(["engineering", "pm", "bd", "soft"]);
    expect(catalog.tracks.filter((t) => t.departmentId === "engineering").map((t) => t.id)).toEqual(
      expect.arrayContaining(["frontend", "backend", "fullstack", "mobile", "devops", "ai-ml"]),
    );
    expect(catalog.skills.length).toBeGreaterThan(300);
  });

  it("lets the superadmin add a department without a code change, and archive it", async () => {
    const cookie = await login("superadmin");
    const created = await ctx.app.inject({
      method: "POST",
      url: "/api/admin/departments",
      headers: { cookie },
      payload: { name: "Design", assessmentFormat: "tasks" },
    });
    expect(created.statusCode).toBe(200);
    const id = created.json().department.id as string;
    expect(id).toBe("design");

    const track = await ctx.app.inject({ method: "POST", url: "/api/admin/tracks", headers: { cookie }, payload: { departmentId: id, name: "Product design" } });
    expect(track.statusCode).toBe(200);

    await ctx.app.inject({ method: "POST", url: `/api/admin/departments/${id}/archive`, headers: { cookie }, payload: { archived: true } });
    const visible = (await ctx.app.inject({ method: "GET", url: "/api/admin/catalog", headers: { cookie } })).json() as Catalog;
    expect(visible.departments.some((d) => d.id === id)).toBe(false);
    const all = (await ctx.app.inject({ method: "GET", url: "/api/admin/catalog?includeArchived=1", headers: { cookie } })).json() as Catalog;
    expect(all.departments.find((d) => d.id === id)?.archived).toBe(true);
  });

  it("keeps catalog edits to the superadmin, but lets an admin request a skill", async () => {
    const cookie = await login("admin");
    const denied = await ctx.app.inject({ method: "POST", url: "/api/admin/departments", headers: { cookie }, payload: { name: "QA" } });
    expect(denied.statusCode).toBe(403);

    const requested = await ctx.app.inject({
      method: "POST",
      url: "/api/admin/skills/requests",
      headers: { cookie },
      payload: { departmentId: "pm", name: "Running hackathons" },
    });
    expect(requested.statusCode).toBe(200);
    expect(requested.json().skill.status).toBe("pending");

    const duplicate = await ctx.app.inject({
      method: "POST",
      url: "/api/admin/skills/requests",
      headers: { cookie },
      payload: { departmentId: "pm", name: "running hackathons" },
    });
    expect(duplicate.statusCode).toBe(409);
  });

  it("refuses the catalog to learners", async () => {
    const cookie = await login("learner");
    const res = await ctx.app.inject({ method: "GET", url: "/api/admin/catalog", headers: { cookie } });
    expect(res.statusCode).toBe(403);
  });

  it("tells a learner their department", async () => {
    const cookie = await login("learner");
    const res = await ctx.app.inject({ method: "GET", url: "/api/auth/me", headers: { cookie } });
    expect(res.json().department).toMatchObject({ id: "engineering", practiceNoun: "Code" });
  });
});
