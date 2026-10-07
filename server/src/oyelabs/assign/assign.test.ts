import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { EMPTY_PRIORITIES } from "../../../../shared/builder";
import { OYELABS_BADGE_TEXT } from "../../../../shared/oyelabsCore";
import { OYELABS_BADGE, oyelabsCourseReason } from "../../../../shared/oyelabsCourses";
import { oyelabsReason } from "../../../../shared/pathReasons";
import { runBuilder } from "../../builder/run";
import { currentPath } from "../../builder/repo";
import { schema } from "../../db";
import { onboardPreview } from "../../goals/preview";
import { newId, now } from "../../lib/ids";
import { buildWeek } from "../../plans/weekly/builder";
import { gatherLibrary } from "../../plans/weekly/candidates";
import { activeLearner, adminSession, as, createTestApp, type Session, type TestContext } from "../../test/harness";
import { learnerVisibilityFacts } from "../visibility";
import { cosine, embedCourse, LOCAL_EMBED_MODEL, localEmbed, localEmbedder, encodeVector, openAiEmbedder, type Embedder } from "./embed";
import { oyelabsCourseFor, suggestOyelabsCourses } from "./match";

/**
 * v4.5 Phase 4 (builder D), PLAN.md §8: manual add with priority, department rules (including
 * people who join later), the legacy assignees PUT, required courses in the first weeks with
 * progression, the path builder preferring an Oyelabs course (and generating nothing), embeddings,
 * onboarding suggestions and search.
 */

interface CourseSpec {
  title: string;
  summary?: string;
  oyelabs?: boolean;
  audience?: "everyone" | "assigned";
  published?: boolean;
  departments?: string[];
  skills?: string[];
  modules?: string[];
  minutes?: number;
}

function makeCourse(ctx: TestContext, spec: CourseSpec): { id: string; lessons: string[] } {
  const at = now();
  const id = newId();
  ctx.db
    .insert(schema.courses)
    .values({ id, title: spec.title, summary: spec.summary ?? "", oyelabs: spec.oyelabs ?? false, audience: spec.audience ?? "everyone", published: spec.published ?? true, createdAt: at, updatedAt: at })
    .run();
  for (const d of spec.departments ?? []) ctx.db.insert(schema.courseDepartments).values({ courseId: id, departmentId: d }).run();
  for (const s of spec.skills ?? []) ctx.db.insert(schema.courseSkills).values({ courseId: id, skillId: s }).run();
  const lessons: string[] = [];
  (spec.modules ?? ["Module 1"]).forEach((title, position) => {
    const sectionId = newId();
    const topicId = newId();
    ctx.db.insert(schema.courseSections).values({ id: sectionId, courseId: id, title, position }).run();
    ctx.db.insert(schema.courseTopics).values({ id: topicId, sectionId, courseId: id, title, position: 0, kind: spec.oyelabs ? "module" : "lesson", estMinutes: spec.minutes ?? 30 }).run();
    lessons.push(topicId);
  });
  return { id, lessons };
}

const WHITE_LABEL: CourseSpec = {
  title: "Oyelabs White-label Onboarding SOP",
  summary: "Our own process for white-label projects, from kick-off to handover.",
  oyelabs: true,
  departments: ["pm"],
  skills: ["pm-proc-whitelabel"],
  modules: ["Kick-off", "Handover"],
};

describe("assignments", () => {
  let ctx: TestContext;
  let admin: Session;
  beforeEach(async () => {
    ctx = await createTestApp();
    admin = await adminSession(ctx);
  });
  afterEach(async () => {
    await ctx.close();
  });

  const assign = (payload: Record<string, unknown>) => ctx.app.inject({ method: "POST", url: "/api/admin/oyelabs/assignments", ...as(admin), payload });
  const setDepartment = (userId: string, departmentId: string) =>
    ctx.db.update(schema.learnerProfiles).set({ departmentId }).where(eq(schema.learnerProfiles.userId, userId)).run();
  const row = (courseId: string, userId: string) =>
    ctx.db.select().from(schema.courseAssignments).where(and(eq(schema.courseAssignments.courseId, courseId), eq(schema.courseAssignments.userId, userId))).get();

  test("a learner gets a course with a priority; adding again changes the priority, never duplicates", async () => {
    const learner = await activeLearner(ctx, admin);
    const course = makeCourse(ctx, { title: "Git at Oyelabs", audience: "assigned" });

    const first = await assign({ courseId: course.id, target: { kind: "learner", userId: learner.id }, priority: "most_important" });
    expect(first.statusCode).toBe(200);
    expect(first.json()).toMatchObject({ added: 1, updated: 0 });
    expect(first.json().message).toBe('Added "Git at Oyelabs" for Learner One as Most important.');
    expect(row(course.id, learner.id)).toMatchObject({ priority: "most_important", source: "admin" });

    const again = await assign({ courseId: course.id, target: { kind: "learner", userId: learner.id }, priority: "nice_to_have" });
    expect(again.json()).toMatchObject({ added: 0, updated: 1 });
    expect(ctx.db.select().from(schema.courseAssignments).all()).toHaveLength(1);
    expect(row(course.id, learner.id)?.priority).toBe("nice_to_have");

    const view = await ctx.app.inject({ method: "GET", url: `/api/admin/oyelabs/courses/${course.id}/assignments`, ...as(admin) });
    expect(view.json().learners).toEqual([expect.objectContaining({ userId: learner.id, priority: "nice_to_have", source: "admin" })]);

    // A staff account is refused, and so is a learner calling the route.
    expect((await assign({ courseId: course.id, target: { kind: "learner", userId: admin.user.id }, priority: "important" })).statusCode).toBe(400);
    const asLearner = await ctx.app.inject({ method: "POST", url: "/api/admin/oyelabs/assignments", ...as(learner.session), payload: {} });
    expect(asLearner.statusCode).toBe(403);
  });

  test("a department now expands into rows; 'everyone in the department' also covers people who join later", async () => {
    const a = await activeLearner(ctx, admin, "pm.one");
    setDepartment(a.id, "pm");
    const now1 = makeCourse(ctx, { title: "Status reports", audience: "assigned" });
    const res = await assign({ courseId: now1.id, target: { kind: "department", departmentId: "pm" }, priority: "important" });
    expect(res.json().added).toBe(1);
    expect(row(now1.id, a.id)).toMatchObject({ priority: "important", source: "department" });

    const rule = makeCourse(ctx, { ...WHITE_LABEL });
    const ruled = await assign({ courseId: rule.id, target: { kind: "department_everyone", departmentId: "pm", required: true }, priority: "most_important" });
    expect(ruled.statusCode).toBe(200);
    expect(ruled.json().message).toMatch(/required for everyone in Project Management|required for everyone in/i);

    // Joins later: no row is written for them, and they still have both rule courses' visibility.
    const b = await activeLearner(ctx, admin, "pm.two");
    setDepartment(b.id, "pm");
    expect(row(rule.id, b.id)).toBeUndefined();
    expect(learnerVisibilityFacts(ctx.db, b.id).ruleCourseIds.has(rule.id)).toBe(true);
    const library = gatherLibrary({ db: ctx.db, content: ctx.content, userId: b.id });
    expect(library.candidates.filter((c) => c.courseId === rule.id).map((c) => c.required)).toEqual([true, true]);
    // "Assign to the department now" did not reach them (it was a one-off).
    expect(library.candidates.some((c) => c.courseId === now1.id)).toBe(false);

    // Someone in another department does not see the Oyelabs course at all.
    const eng = await activeLearner(ctx, admin, "eng.one");
    expect(gatherLibrary({ db: ctx.db, content: ctx.content, userId: eng.id }).candidates.some((c) => c.courseId === rule.id)).toBe(false);

    // Removing the department removes the rule and the department rows, not named people.
    const del = await ctx.app.inject({ method: "DELETE", url: `/api/admin/oyelabs/courses/${now1.id}/assignments/departments/pm`, ...as(admin) });
    expect(del.json()).toEqual({ rule: false, learners: 1 });
  });

  test("the legacy assignees PUT keeps the priority and source of the rows it keeps", async () => {
    const a = await activeLearner(ctx, admin, "keep.one");
    const b = await activeLearner(ctx, admin, "keep.two");
    const course = makeCourse(ctx, { title: "Handbook basics", audience: "assigned" });
    await assign({ courseId: course.id, target: { kind: "learner", userId: a.id }, priority: "most_important" });

    const put = await ctx.app.inject({ method: "PUT", url: `/api/admin/courses/${course.id}/assignees`, ...as(admin), payload: { userIds: [a.id, b.id] } });
    expect(put.statusCode).toBe(200);
    expect(row(course.id, a.id)).toMatchObject({ priority: "most_important", source: "admin" });
    expect(row(course.id, b.id)?.priority).toBeNull();

    await ctx.app.inject({ method: "PUT", url: `/api/admin/courses/${course.id}/assignees`, ...as(admin), payload: { userIds: [b.id] } });
    expect(row(course.id, a.id)).toBeUndefined();
  });

  test("search includes Oyelabs courses first, with the badge flag and what the learner already has", async () => {
    const learner = await activeLearner(ctx, admin);
    const plain = makeCourse(ctx, { title: "Onboarding basics" });
    const own = makeCourse(ctx, { ...WHITE_LABEL, departments: [] });
    makeCourse(ctx, { title: "Generated onboarding" });
    ctx.db.update(schema.courses).set({ origin: "generated" }).where(eq(schema.courses.title, "Generated onboarding")).run();
    await assign({ courseId: plain.id, target: { kind: "learner", userId: learner.id }, priority: "important" });

    const res = await ctx.app.inject({ method: "GET", url: `/api/admin/oyelabs/search?q=onboarding&userId=${learner.id}`, ...as(admin) });
    expect(res.statusCode).toBe(200);
    const hits = res.json().courses as { courseId: string; oyelabs: boolean; lessons: number; assigned: unknown }[];
    expect(hits.map((h) => h.courseId)).toEqual([own.id, plain.id]);
    expect(hits[0]).toMatchObject({ oyelabs: true, lessons: 2, assigned: null });
    expect(hits[1]).toMatchObject({ oyelabs: false, assigned: { priority: "important" } });

    const mine = await ctx.app.inject({ method: "GET", url: `/api/admin/oyelabs/learners/${learner.id}`, ...as(admin) });
    expect(mine.json()).toMatchObject({ departmentId: "engineering", departmentName: "Engineering" });
  });
});

describe("weekly plan: required and prioritised courses", () => {
  let ctx: TestContext;
  let admin: Session;
  beforeEach(async () => {
    ctx = await createTestApp();
    admin = await adminSession(ctx);
  });
  afterEach(async () => {
    await ctx.close();
  });

  const week = (userId: string, weekNumber: number) => {
    const { candidates } = gatherLibrary({ db: ctx.db, content: ctx.content, userId });
    return buildWeek({
      weekNumber,
      startDate: "2026-10-05",
      endDate: "2026-10-11",
      budgetMinutes: 600,
      priorities: { ...EMPTY_PRIORITIES },
      gaps: [],
      candidates,
      carryOver: [],
      pinned: [],
      strengths: [],
    });
  };

  test("required → Do it now in the first 2 weeks, in module order, with an unmet prerequisite first", async () => {
    const learner = await activeLearner(ctx, admin);
    // The skill graph says i18n comes before design-to-code; a course teaches i18n.
    ctx.db.insert(schema.skillEdges).values({ fromSkill: "eng-i18n", toSkill: "eng-design-to-code", type: "prerequisite", updatedAt: now() }).onConflictDoNothing().run();
    const prereq = makeCourse(ctx, { title: "Translating the UI", skills: ["eng-i18n"], modules: ["Strings", "Plurals"], minutes: 20 });
    const required = makeCourse(ctx, { title: "Our design handoff", oyelabs: true, skills: ["eng-design-to-code"], modules: ["Figma files", "Tokens", "Review"], minutes: 40 });
    ctx.db.insert(schema.courseDepartmentRules).values({ courseId: required.id, departmentId: "engineering", priority: "important", required: true, createdAt: now() }).run();

    const first = week(learner.id, 1);
    const doNow = first.lanes.doNow.filter((i) => i.courseId === required.id).map((i) => i.lessonId);
    expect(doNow).toEqual(required.lessons); // all three modules, in order (120 min ≤ half of 600)
    expect(first.lanes.doNow[0]?.reason).toBe("Required for everyone in your department");
    // The prerequisite course's first lessons come first, in Must know, and the module depends on them.
    expect(first.lanes.mustKnow.map((i) => i.lessonId)).toEqual(prereq.lessons);
    expect(first.lanes.doNow.find((i) => i.lessonId === required.lessons[0])?.dependsOn).toEqual(prereq.lessons);

    // Week 3: no longer "first weeks", so it follows the rule's priority (Important → Medium).
    const third = week(learner.id, 3);
    expect(third.lanes.doNow.some((i) => i.courseId === required.id)).toBe(false);
    expect(third.lanes.medium.filter((i) => i.courseId === required.id).map((i) => i.lessonId)).toEqual(required.lessons.slice(0, 2));
    expect(third.lanes.medium[0]?.reason).toBe("Added by your administrator: Important");
  });

  test("progression: a module that doesn't fit holds back the ones after it", async () => {
    const learner = await activeLearner(ctx, admin);
    const required = makeCourse(ctx, { title: "Long SOP", oyelabs: true, modules: ["One", "Two", "Three"], minutes: 200 });
    ctx.db.insert(schema.courseDepartmentRules).values({ courseId: required.id, departmentId: "engineering", priority: "most_important", required: true, createdAt: now() }).run();
    const w = week(learner.id, 1);
    // Half of 600 is 300: module One fits, Two would not, so Three never jumps ahead of it.
    expect(w.lanes.doNow.filter((i) => i.courseId === required.id).map((i) => i.lessonId)).toEqual([required.lessons[0]]);
  });

  test("priority lanes: Most important → Do it now, Nice to have → Low", async () => {
    const learner = await activeLearner(ctx, admin);
    const most = makeCourse(ctx, { title: "Most", audience: "assigned", minutes: 30 });
    const nice = makeCourse(ctx, { title: "Nice", audience: "assigned", minutes: 30 });
    ctx.db.insert(schema.courseAssignments).values({ courseId: most.id, userId: learner.id, assignedAt: now(), priority: "most_important" }).run();
    ctx.db.insert(schema.courseAssignments).values({ courseId: nice.id, userId: learner.id, assignedAt: now(), priority: "nice_to_have" }).run();
    const w = week(learner.id, 5);
    expect(w.lanes.doNow.map((i) => i.courseId)).toContain(most.id);
    expect(w.lanes.low.find((i) => i.courseId === nice.id)?.reason).toBe("Added by your administrator: Nice to have");
  });
});

describe("embeddings and matching", () => {
  test("the local embedder is deterministic and ranks by meaning-ish overlap", () => {
    const a = localEmbed("White-label project onboarding");
    expect(Array.from(localEmbed("White-label project onboarding"))).toEqual(Array.from(a));
    const close = cosine(localEmbed("handles white-label clients"), a);
    const far = cosine(localEmbed("React hooks and state"), a);
    expect(close).toBeGreaterThan(far);
    expect(far).toBeLessThan(0.1);
  });

  test("the OpenAI embedder sends one batch and keeps the order (injected fetch, no network)", async () => {
    const sent: string[] = [];
    const fake = async (_url: string, init: { body: string }) => {
      sent.push(init.body);
      return { ok: true, status: 200, json: async () => ({ data: [{ index: 1, embedding: [0, 2] }, { index: 0, embedding: [3, 0] }] }) };
    };
    const vectors = await openAiEmbedder("sk-test", fake as never).embed(["a", "b"]);
    expect(JSON.parse(sent[0]!)).toMatchObject({ model: "text-embedding-3-small", input: ["a", "b"] });
    expect(vectors.map((v) => Array.from(v))).toEqual([[1, 0], [0, 1]]);
  });

  test("vectors from different embedders are never compared", () => {
    expect(() => cosine(new Float32Array(512), new Float32Array(1536))).toThrow();
  });

  test("a stored vector from another model is ignored: the local comparison answers", async () => {
    const ctx = await createTestApp();
    const course = makeCourse(ctx, { ...WHITE_LABEL, skills: [] });
    // A (fake) remote vector that would match anything if it were compared with a local one.
    ctx.db.insert(schema.courseEmbeddings).values({ courseId: course.id, model: "text-embedding-3-small", dims: 4, vector: encodeVector(new Float32Array([1, 0, 0, 0])), textHash: "x", updatedAt: now() }).run();
    const calls: number[] = [];
    const remote: Embedder = { model: "text-embedding-3-small", embed: async (t) => { calls.push(t.length); return t.map(() => new Float32Array([0, 1, 0, 0])); } };
    // Local embedder: never touches the remote vector.
    expect(await oyelabsCourseFor(ctx.db, { name: "React hooks" }, { departmentId: "pm" })).toBeNull();
    expect((await oyelabsCourseFor(ctx.db, { name: "White-label projects" }, { departmentId: "pm" }))?.courseId).toBe(course.id);
    // Remote embedder: compared with the stored remote vector only (orthogonal → no match).
    expect(await oyelabsCourseFor(ctx.db, { name: "White-label projects" }, { departmentId: "pm", embedder: remote })).toBeNull();
    expect(calls.length).toBe(1);
    await ctx.close();
  });

  test("the embed job writes once and skips unchanged text", async () => {
    const ctx = await createTestApp();
    const course = makeCourse(ctx, WHITE_LABEL);
    expect(await embedCourse(ctx.db, localEmbedder, course.id)).toBe("written");
    expect(await embedCourse(ctx.db, localEmbedder, course.id)).toBe("unchanged");
    const stored = ctx.db.select().from(schema.courseEmbeddings).where(eq(schema.courseEmbeddings.courseId, course.id)).get();
    expect(stored).toMatchObject({ model: LOCAL_EMBED_MODEL, dims: 512 });
    ctx.db.update(schema.courses).set({ summary: "Changed." }).where(eq(schema.courses.id, course.id)).run();
    expect(await embedCourse(ctx.db, localEmbedder, course.id)).toBe("written");
    // A failing remote embedder falls back to the local one.
    const broken: Embedder = { model: "text-embedding-3-small", embed: async () => { throw new Error("down"); } };
    ctx.db.update(schema.courses).set({ summary: "Changed again." }).where(eq(schema.courses.id, course.id)).run();
    expect(await embedCourse(ctx.db, broken, course.id)).toBe("written");
    expect(ctx.db.select().from(schema.courseEmbeddings).get()?.model).toBe(LOCAL_EMBED_MODEL);
    await ctx.close();
  });
});

describe("plain reasons", () => {
  test("the core badge text matches the contract", () => {
    expect(OYELABS_BADGE_TEXT).toBe(OYELABS_BADGE);
  });

  test("the course's own words, as Oyelabs' own", () => {
    expect(oyelabsReason({ title: "Oyelabs White-label Onboarding SOP", summary: "Our own process for white-label projects, from kick-off to handover." })).toBe(
      "Added because it's Oyelabs' own process for white-label projects.",
    );
    expect(oyelabsCourseReason({ title: "X", summary: "This course covers how we price fixed-scope work." })).toBe("Added because it's Oyelabs' own course on how we price fixed-scope work.");
    expect(oyelabsCourseReason({ title: "Client calls", summary: "" })).toBe("Added because it's Oyelabs' own course: Client calls.");
    expect(oyelabsCourseReason({ title: "X", summary: "How we run a sprint review. Two parts." })).toBe("Added because it's Oyelabs' own guide to how we run a sprint review.");
  });
});

describe("onboarding suggestions", () => {
  test("a description that mentions white-label clients suggests the white-label SOP, with the plain reason", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const course = makeCourse(ctx, { ...WHITE_LABEL, skills: [] });
    makeCourse(ctx, { title: "Oyelabs expense policy", summary: "Our own process for expenses and receipts.", oyelabs: true, departments: ["pm"] });

    const res = await ctx.app.inject({
      method: "POST",
      url: "/api/admin/oyelabs/suggest",
      ...as(admin),
      payload: { description: "PM, 3 yrs agency work, handles white-label clients", departmentId: "pm" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().courses).toEqual([
      expect.objectContaining({ courseId: course.id, title: WHITE_LABEL.title, reason: "Added because it's Oyelabs' own process for white-label projects." }),
    ]);
    // Another department's learner gets nothing: the course is for Project Management only.
    expect(await suggestOyelabsCourses(ctx.db, { description: "handles white-label clients", departmentId: "engineering" })).toEqual([]);

    // The onboarding preview carries the same suggestion, and the course's skill needs no new course.
    const preview = onboardPreview(ctx.db, ctx.content, {
      departmentId: "pm",
      trackId: "pm-agile",
      stackIds: [],
      experienceBand: "3-5",
      level: 3,
      priorities: [{ skillId: "pm-proc-whitelabel", slider: 5 }],
      skip: [],
      hoursPerWeek: 15,
      advanced: { weekStartsMonday: false, deadlineWeeks: null, courseCap: 5, autoPublish: false },
      description: "PM who handles white-label clients",
    } as unknown as Parameters<typeof onboardPreview>[2], "path");
    expect(preview.oyelabsCourses?.[0]).toMatchObject({ courseId: course.id });
    await ctx.close();
  });
});

describe("path builder prefers an Oyelabs course", () => {
  test("a skill an Oyelabs course covers is taken from it, and no course is generated", async () => {
    const ctx = await createTestApp();
    const admin = await adminSession(ctx);
    const learner = await activeLearner(ctx, admin, "oye.path");
    const own = makeCourse(ctx, {
      title: "Oyelabs i18n checklist",
      summary: "Our own checklist for shipping translated apps.",
      oyelabs: true,
      departments: ["engineering"],
      skills: ["eng-i18n"],
    });
    const res = await ctx.app.inject({
      method: "PUT",
      url: `/api/admin/users/${learner.id}/setup`,
      ...as(admin),
      payload: {
        departmentId: "engineering", trackId: "frontend", stackIds: ["stack-react"], experienceBand: "3-5", level: 3,
        priorities: [], skip: [], hoursPerWeek: 15,
        goals: [{ type: "text", originalText: "Ship translated apps", outcome: "Can ship translated apps at work.", skillIds: ["eng-i18n"], targetLevel: 3, caseId: null, slider: 5 }],
        advanced: { weekStartsMonday: false, deadlineWeeks: null, courseCap: 5, autoPublish: false },
        assign: false,
      },
    });
    expect(res.statusCode).toBe(200);

    const outcome = await runBuilder({ userId: learner.id, assessmentId: null, evaluation: null, adminNotes: "" }, { db: ctx.db, env: ctx.env, ai: ctx.ai, content: ctx.content });
    const items = ctx.db.select().from(schema.pathItems).where(eq(schema.pathItems.pathId, outcome.pathId)).all();
    const item = items.find((i) => i.skillId === "eng-i18n");
    expect(item).toMatchObject({ courseId: own.id, source: "unlock", reason: "Added because it's Oyelabs' own checklist for shipping translated apps." });
    // Nothing generated for it, and the learner has the course.
    const jobs = ctx.db.select().from(schema.jobs).where(eq(schema.jobs.type, "course.generate")).all();
    expect(jobs.filter((j) => JSON.stringify(j.payload).includes("eng-i18n"))).toEqual([]);
    expect(ctx.db.select().from(schema.courseAssignments).where(eq(schema.courseAssignments.courseId, own.id)).get()).toMatchObject({ userId: learner.id, source: "path" });
    // The path view carries the badge flag and keeps the plain reason.
    const view = currentPath(ctx.db, learner.id, ctx.content)!;
    expect(view.items.find((i) => i.courseId === own.id)).toMatchObject({ oyelabs: true, reason: "Added because it's Oyelabs' own checklist for shipping translated apps." });
    await ctx.close();
  }, 120_000);
});
