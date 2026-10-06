import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { moduleItemId } from "../../../../shared/me";
import { schema } from "../../db";
import { activeLearner, adminSession, as, createTestApp, publishPlanFor, type Session, type TestContext } from "../../test/harness";

let ctx: TestContext;
let admin: Session;
let learner: { id: string; username: string; session: Session };

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  learner = await activeLearner(ctx, admin);
});

afterEach(async () => {
  await ctx.close();
});

const get = (url: string) => ctx.app.inject({ method: "GET", url, ...as(learner.session) });
const put = (url: string, payload: object) => ctx.app.inject({ method: "PUT", url, payload, ...as(learner.session) });

describe("settings", () => {
  test("defaults, then a change merges into user_prefs without touching other keys", async () => {
    await put("/api/me/ui", { v5: true });
    const first = await get("/api/v5/me/settings");
    expect(first.json().settings).toMatchObject({ theme: "system", autoplayNext: true, celebrations: true });

    const res = await put("/api/v5/me/settings", { theme: "dark", reminderTime: "18:30", quietHours: { from: "22:00", to: "07:00" }, autoplayNext: false });
    expect(res.statusCode).toBe(200);
    expect(res.json().settings).toMatchObject({ theme: "dark", reminderTime: "18:30", autoplayNext: false });

    const prefs = ctx.db.select().from(schema.userPrefs).where(eq(schema.userPrefs.userId, learner.id)).get()!.data;
    expect(prefs.uiV5).toBe(true);
    expect(prefs.autoplayNext).toBe(false);
    // The lesson player's own prefs route sees the same value.
    expect((await get("/api/me/prefs")).json().autoplayNext).toBe(false);
  });

  test("bad values and unknown keys are refused", async () => {
    expect((await put("/api/v5/me/settings", { reminderTime: "25:00" })).statusCode).toBe(400);
    expect((await put("/api/v5/me/settings", { uiV5: false })).statusCode).toBe(400);
    expect((await put("/api/v5/me/settings", { reducedMotion: "sometimes" })).statusCode).toBe(400);
  });
});

describe("notes", () => {
  test("lists the learner's notes with a link to the moment, and searches them", async () => {
    const at = Date.now();
    ctx.db.insert(schema.lessonNotes).values([
      { id: "n1", userId: learner.id, topicId: "js-closures", videoId: "qikxEIxsXco", atSec: 125.4, body: "Closures keep the scope alive", createdAt: at, updatedAt: at },
      { id: "n2", userId: learner.id, topicId: "js-hoisting", videoId: null, atSec: null, body: "TDZ for let", createdAt: at, updatedAt: at + 1 },
    ]).run();
    const all = (await get("/api/v5/me/notes")).json().notes;
    expect(all.map((n: { id: string }) => n.id)).toEqual(["n2", "n1"]);
    const closure = all.find((n: { id: string }) => n.id === "n1");
    expect(closure.href).toBe("/learn/lesson/js-closures?step=watch&t=125&video=qikxEIxsXco");
    expect(closure.topicTitle).toMatch(/Closure/i);
    const found = (await get("/api/v5/me/notes?q=scope%20alive")).json().notes;
    expect(found.map((n: { id: string }) => n.id)).toEqual(["n1"]);
  });
});

describe("profile", () => {
  test("returns levels, cases, certificates, XP by week and the streak", async () => {
    ctx.db.insert(schema.xpEvents).values({ id: "x1", userId: learner.id, kind: "lesson_completed", refId: "t1", xp: 30, createdAt: Date.now() }).run();
    const res = await get("/api/v5/me/profile");
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.displayName).toBe("Learner One");
    expect(body.xp.total).toBe(30);
    expect(body.xp.weeks).toHaveLength(8);
    expect(body.xp.weeks.at(-1).xp).toBe(30);
    expect(Array.isArray(body.skills)).toBe(true);
    expect(Array.isArray(body.certificates)).toBe(true);
  });
});

describe("library", () => {
  test("lists plan modules with outcomes, and the course page shows the syllabus with lesson links", async () => {
    await publishPlanFor(ctx, admin, learner.id, ["js-closures", "js-hoisting"]);
    const lib = (await get("/api/v5/me/library")).json();
    const mod = lib.items.find((i: { id: string }) => i.id === moduleItemId("frontend", "fe-js-core"));
    expect(mod).toBeTruthy();
    expect(mod.outcomes.length).toBeGreaterThan(0);
    expect(mod.lessonCount).toBe(2);
    expect(mod.nextLessonHref).toMatch(/^\/learn\/lesson\//);

    const detail = await get(`/api/v5/me/library/${encodeURIComponent(mod.id)}`);
    expect(detail.statusCode).toBe(200);
    const course = detail.json().course;
    expect(course.syllabus[0].lessons.map((l: { id: string }) => l.id).sort()).toEqual(["js-closures", "js-hoisting"]);
    expect(Array.isArray(course.prerequisites)).toBe(true);
  });

  test("an unknown or hidden course is a 404", async () => {
    expect((await get("/api/v5/me/library/nope")).statusCode).toBe(404);
    expect((await get(`/api/v5/me/library/${encodeURIComponent(moduleItemId("backend", "be-node-core"))}`)).statusCode).toBe(404);
  });
});
