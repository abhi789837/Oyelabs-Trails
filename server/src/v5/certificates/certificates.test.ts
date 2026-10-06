import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { bankItemSchema } from "../../../../shared/bank";
import { certificateCode, isCertificateId, MIN_TRACK_TOPICS } from "../../../../shared/certificates";
import { schema } from "../../db";
import { newId, now } from "../../lib/ids";
import { activeLearner, adminSession, as, createTestApp, publishPlanFor, type Session, type TestContext } from "../../test/harness";
import { evaluateV4 } from "../../assessment/evaluateV4";
import { itemsOf, storeItems, submitItem } from "../../assessment/v4";
import { hashOf, syncCertificates } from "./repo";

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

const get = (url: string, session: Session | null = learner.session) => ctx.app.inject({ method: "GET", url, ...(session ? as(session) : {}) });
const send = (method: "POST" | "PUT", url: string, payload: object, session: Session = learner.session) => ctx.app.inject({ method, url, payload, ...as(session) });

function completeTopics(topicIds: string[]): void {
  const at = now();
  ctx.db
    .insert(schema.topicProgress)
    .values(topicIds.map((topicId, i) => ({ userId: learner.id, topicId, status: "completed" as const, bestScore: 80 + (i % 3) * 5, attempts: 1, completedAt: at - 1000 + i, updatedAt: at })))
    .run();
}

/** A track with at least MIN_TRACK_TOPICS available topics, and its topic ids. */
function smallestTrack(): { id: string; name: string; topicIds: string[] } {
  const tracks = ctx.content.manifest
    .map((t) => ({ id: t.id, name: t.name, topicIds: t.modules.filter((m) => m.available).flatMap((m) => m.topics.map((x) => x.id)) }))
    .filter((t) => t.topicIds.length >= MIN_TRACK_TOPICS)
    .sort((a, b) => a.topicIds.length - b.topicIds.length);
  return tracks[0];
}

function achieveGoal(outcome: string): string {
  const id = newId();
  const at = now();
  ctx.db
    .insert(schema.learnerGoals)
    .values({ id, userId: learner.id, type: "text", originalText: outcome, outcome, skillIds: ["eng-git"], targetLevel: 3, slider: 3, position: 0, status: "achieved", achievedAt: at, source: "admin", createdAt: at, updatedAt: at })
    .run();
  return id;
}

describe("certificate codes", () => {
  test("OYL-XXXX-XXXX in Crockford base32; old browser ids still match", () => {
    const code = certificateCode(new Uint8Array([1, 2, 3, 4, 5]));
    expect(code).toMatch(/^OYL-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
    expect(isCertificateId(code)).toBe(true);
    expect(isCertificateId("OYL-FE-7K2Q-M9XD")).toBe(true);
    expect(isCertificateId("../etc/passwd")).toBe(false);
  });
});

describe("issuing", () => {
  test("a finished track in the plan issues one certificate, idempotently, with XP and a notification", async () => {
    const track = smallestTrack();
    await publishPlanFor(ctx, admin, learner.id, track.topicIds);
    expect((await get("/api/v5/certificates")).json().certificates).toEqual([]);

    completeTopics(track.topicIds);
    const first = (await get("/api/v5/certificates")).json();
    expect(first.certificates).toHaveLength(1);
    expect(first.newlyIssued).toEqual([first.certificates[0].id]);
    const cert = first.certificates[0];
    expect(cert).toMatchObject({ kind: "track", refId: track.id, title: track.name, holderName: "Learner One", topicCount: track.topicIds.length, revokedAt: null });
    expect(cert.verifyPath).toBe(`/verify/${cert.id}`);
    expect(isCertificateId(cert.id)).toBe(true);

    // Again, and from the profile, and straight from the repo: still one.
    const second = (await get("/api/v5/certificates")).json();
    expect(second.newlyIssued).toEqual([]);
    await get("/api/v5/me/profile");
    expect(syncCertificates(ctx.db, ctx.content, { id: learner.id, role: "learner" })).toEqual([]);
    expect(ctx.db.select().from(schema.certificates).where(eq(schema.certificates.userId, learner.id)).all()).toHaveLength(1);

    const xp = ctx.db.select().from(schema.xpEvents).where(and(eq(schema.xpEvents.userId, learner.id), eq(schema.xpEvents.kind, "certificate"))).all();
    expect(xp.map((x) => [x.refId, x.xp])).toEqual([[cert.id, 200]]);
    const notes = ctx.db.select().from(schema.notifications).where(and(eq(schema.notifications.recipientId, learner.id), eq(schema.notifications.kind, "certificate.issued"))).all();
    expect(notes).toHaveLength(1);
    expect(notes[0].link).toBe(`/learn/certificate/${cert.id}`);

    // The Me profile lists it.
    const profile = (await get("/api/v5/me/profile")).json();
    expect(profile.certificates.map((c: { id: string }) => c.id)).toEqual([cert.id]);
  });

  test("an unfinished track, or one with too few plan topics, issues nothing", async () => {
    const track = smallestTrack();
    await publishPlanFor(ctx, admin, learner.id, track.topicIds);
    completeTopics(track.topicIds.slice(1));
    expect((await get("/api/v5/certificates")).json().certificates).toEqual([]);

    const tiny = track.topicIds.slice(0, MIN_TRACK_TOPICS - 1);
    await publishPlanFor(ctx, admin, learner.id, tiny);
    expect((await get("/api/v5/certificates")).json().certificates).toEqual([]);
  });

  test("an achieved goal and a finished course issue their own certificates", async () => {
    const goalId = achieveGoal("Ship a clean pull request on your own");
    const at = now();
    const courseId = newId();
    const sectionId = newId();
    ctx.db.insert(schema.courses).values({ id: courseId, title: "Docker in practice", published: true, audience: "everyone", createdAt: at, updatedAt: at }).run();
    ctx.db.insert(schema.courseSections).values({ id: sectionId, courseId, title: "Basics", position: 0 }).run();
    const lessons = [newId(), newId()];
    ctx.db.insert(schema.courseTopics).values(lessons.map((id, i) => ({ id, sectionId, courseId, title: `Lesson ${i + 1}`, position: i }))).run();
    ctx.db.insert(schema.courseProgress).values({ userId: learner.id, topicId: lessons[0], courseId, completedAt: at }).run();

    let certs = (await get("/api/v5/certificates")).json().certificates as { kind: string; refId: string; title: string }[];
    expect(certs.map((c) => [c.kind, c.refId, c.title])).toEqual([["goal", goalId, "Ship a clean pull request on your own"]]);

    ctx.db.insert(schema.courseProgress).values({ userId: learner.id, topicId: lessons[1], courseId, completedAt: at + 5 }).run();
    certs = (await get("/api/v5/certificates")).json().certificates;
    expect(certs.map((c) => c.kind).sort()).toEqual(["course", "goal"]);
    expect(certs.find((c) => c.kind === "course")).toMatchObject({ refId: courseId, title: "Docker in practice" });
  });

  test("the holder name: their own choice, applied to current certificates with a fresh hash", async () => {
    achieveGoal("Lead a stand-up");
    await get("/api/v5/certificates");
    const bad = await send("PUT", "/api/v5/certificates/name", { name: " " });
    expect(bad.statusCode).toBe(400);
    const res = await send("PUT", "/api/v5/certificates/name", { name: "  Rahul   Verma " });
    expect(res.statusCode).toBe(200);
    expect(res.json().holderName).toBe("Rahul Verma");
    const [cert] = res.json().certificates;
    expect(cert.holderName).toBe("Rahul Verma");
    const pub = (await get(`/api/v5/certificates/${cert.id}/public`, null)).json().certificate;
    expect(pub).toMatchObject({ holderName: "Rahul Verma", status: "valid" });
    // Later certificates use it too.
    achieveGoal("Write a clear client email");
    const all = (await get("/api/v5/certificates")).json();
    expect(all.holderName).toBe("Rahul Verma");
    expect(all.certificates.every((c: { holderName: string }) => c.holderName === "Rahul Verma")).toBe(true);
  });
});

describe("verification and revoking", () => {
  test("public: no session, minimal data, valid → revoked → valid again; tampering shows", async () => {
    achieveGoal("Review a pull request");
    const [cert] = (await get("/api/v5/certificates")).json().certificates;

    const pub = await get(`/api/v5/certificates/${cert.id}/public`, null);
    expect(pub.statusCode).toBe(200);
    expect(pub.json().certificate).toEqual({ id: cert.id, holderName: "Learner One", title: "Review a pull request", kind: "goal", issuedAt: cert.issuedAt, status: "valid", revokedAt: null });
    expect(JSON.stringify(pub.json())).not.toContain(learner.id);

    expect((await get("/api/v5/certificates/OYL-0000-0000/public", null)).statusCode).toBe(404);
    expect((await get("/api/v5/certificates/not-a-code/public", null)).statusCode).toBe(404);

    // Learners can't revoke.
    expect((await send("POST", `/api/admin/v5/certificates/${cert.id}/revoke`, {})).statusCode).toBe(403);
    const revoked = await send("POST", `/api/admin/v5/certificates/${cert.id}/revoke`, { note: "Issued by mistake" }, admin);
    expect(revoked.statusCode).toBe(200);
    expect(revoked.json().certificate.revokedAt).toBeGreaterThan(0);
    expect((await get(`/api/v5/certificates/${cert.id}/public`, null)).json().certificate.status).toBe("revoked");
    const audit = ctx.db.select().from(schema.auditLog).where(eq(schema.auditLog.action, "certificate.revoke")).all();
    expect(audit).toHaveLength(1);

    // Revoked is never re-issued by the sync, and drops off the Me profile.
    expect(syncCertificates(ctx.db, ctx.content, { id: learner.id, role: "learner" })).toEqual([]);
    expect((await get("/api/v5/me/profile")).json().certificates).toEqual([]);

    expect((await send("POST", `/api/admin/v5/certificates/${cert.id}/restore`, {}, admin)).statusCode).toBe(200);
    expect((await get(`/api/v5/certificates/${cert.id}/public`, null)).json().certificate.status).toBe("valid");
    expect((await send("POST", `/api/admin/v5/certificates/${cert.id}/restore`, {}, admin)).statusCode).toBe(400);

    // A record edited behind the app's back no longer matches its hash.
    ctx.db.update(schema.certificates).set({ title: "Something grander" }).where(eq(schema.certificates.id, cert.id)).run();
    expect((await get(`/api/v5/certificates/${cert.id}/public`, null)).json().certificate.status).toBe("changed");
    const row = ctx.db.select().from(schema.certificates).where(eq(schema.certificates.id, cert.id)).get()!;
    expect(row.hash).not.toBe(hashOf(row));
  });

  test("someone else's certificate is a 404 on the private route; admins list by learner", async () => {
    achieveGoal("Pair on a bug");
    const [cert] = (await get("/api/v5/certificates")).json().certificates;
    expect((await get(`/api/v5/certificates/${cert.id}`)).statusCode).toBe(200);
    expect((await get(`/api/v5/certificates/${cert.id}`, admin)).statusCode).toBe(404);
    const list = (await get(`/api/admin/v5/certificates?userId=${learner.id}`, admin)).json().certificates;
    expect(list.map((c: { id: string; userId: string }) => [c.id, c.userId])).toEqual([[cert.id, learner.id]]);
    expect((await get("/api/admin/v5/certificates")).statusCode).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

async function evaluatedSitting(): Promise<{ assessmentId: string; wrongId: string; rightId: string; unknownId: string }> {
  const setup = await send("PUT", `/api/admin/users/${learner.id}/setup`, { departmentId: "engineering", priorities: [{ skillId: "eng-git", slider: 4 }] }, admin);
  expect(setup.statusCode, setup.body).toBe(200);
  const assessmentId = newId();
  ctx.db
    .insert(schema.assessments)
    .values({ id: assessmentId, userId: learner.id, status: "in_progress", attemptNo: 1, createdAt: now(), startedAt: now() - 60_000, deadlineAt: now() + 3_600_000, config: { format: "v4", departmentId: "engineering", assessmentFormat: "coding" } } as typeof schema.assessments.$inferInsert)
    .run();
  const mcq = (n: number) =>
    bankItemSchema.parse({
      id: `m-${n}-${newId().toLowerCase()}`,
      departmentId: "engineering",
      skillId: "eng-git",
      type: "mcq",
      difficulty: 2,
      estMinutes: 1,
      prompt: `Which git command does thing ${n}?`,
      mcq: { options: ["git a", "git b", "git c"], correctIndex: 0, explanation: `Because git a does thing ${n}.` },
      tags: [],
    });
  storeItems(ctx.db, assessmentId, [1, 2, 3].map((n) => ({ item: mcq(n), skillId: "eng-git", skillName: "Git", group: "focus" as const, origin: "bank" as const, bankItemId: null })));
  const [a, b, c] = itemsOf(ctx.db, assessmentId);
  const key = (row: typeof a) => (row.key as { mcq: { correctIndex: number } }).mcq.correctIndex;
  const deps = { db: ctx.db, sandbox: null as never, piston: null };
  await submitItem(deps, a, { choice: key(a) });
  await submitItem(deps, b, { choice: (key(b) + 1) % 3 });
  await submitItem(deps, c, { unknown: true });
  ctx.db.update(schema.assessments).set({ status: "submitted", submittedAt: now() }).where(eq(schema.assessments.id, assessmentId)).run();
  return { assessmentId, rightId: a.id, wrongId: b.id, unknownId: c.id };
}

describe("results", () => {
  test("nothing is shown before results are out", async () => {
    const { assessmentId } = await evaluatedSitting();
    const res = (await get("/api/v5/assessment/results")).json();
    expect(res.assessment.id).toBe(assessmentId);
    expect(res.released).toBe(false);
    expect(res.items).toBeNull();
    expect(res.result).toBeNull();
  });

  test("after evaluation: levels, goals, own items with verdicts and explanations; Request review works on Not yet", async () => {
    const { assessmentId, rightId, wrongId, unknownId } = await evaluatedSitting();
    await evaluateV4({ db: ctx.db, ai: ctx.ai, content: ctx.content, sandbox: null as never, piston: null }, assessmentId);
    const res = (await get("/api/v5/assessment/results")).json();
    expect(res.released).toBe(true);
    expect(res.result.skills.map((s: { skillId: string }) => s.skillId)).toContain("eng-git");
    expect(JSON.stringify(res.result)).not.toContain("rawScore");
    expect(res.itemsHidden).toBe(false);
    const byId = new Map(res.items.map((i: { id: string }) => [i.id, i]));
    expect(byId.get(rightId)).toMatchObject({ verdict: "full", canRequestReview: false, kindLabel: "Multiple choice" });
    const wrong = byId.get(wrongId) as { verdict: string; canRequestReview: boolean; explanation: string; chosen: number; correct: number; options: string[] };
    expect(wrong).toMatchObject({ verdict: "not_yet", canRequestReview: true });
    expect(wrong.explanation).toMatch(/Because git a does thing 2/);
    expect(wrong.chosen).not.toBe(wrong.correct);
    expect(wrong.options).toHaveLength(3);
    expect(byId.get(unknownId)).toMatchObject({ unknown: true, canRequestReview: false });

    const review = await send("POST", "/api/review-requests", { source: "assessment_item", refId: wrongId, note: "I think b is right too" });
    expect(review.statusCode, review.body).toBe(200);
    const after = (await get("/api/v5/assessment/results")).json();
    expect(after.items.find((i: { id: string }) => i.id === wrongId)).toMatchObject({ reviewStatus: "requested", canRequestReview: false });

    // Another learner gets nothing of this test.
    const other = await activeLearner(ctx, admin, "learner.two");
    const theirs = (await ctx.app.inject({ method: "GET", url: `/api/v5/assessment/results?assessmentId=${assessmentId}`, ...as(other.session) })).json();
    expect(theirs.assessment).toBeNull();
    expect(theirs.items).toBeNull();
  });

  test("the admin setting hides the items (staff only, audited)", async () => {
    const { assessmentId } = await evaluatedSitting();
    await evaluateV4({ db: ctx.db, ai: ctx.ai, content: ctx.content, sandbox: null as never, piston: null }, assessmentId);
    expect((await get("/api/admin/v5/assessment/review-setting", admin)).json()).toEqual({ showItemsAfter: true });
    expect((await send("PUT", "/api/admin/v5/assessment/review-setting", { showItemsAfter: false })).statusCode).toBe(403);
    expect((await send("PUT", "/api/admin/v5/assessment/review-setting", { showItemsAfter: false }, admin)).statusCode).toBe(200);
    const res = (await get("/api/v5/assessment/results")).json();
    expect(res.released).toBe(true);
    expect(res.items).toBeNull();
    expect(res.itemsHidden).toBe(true);
    expect(ctx.db.select().from(schema.auditLog).where(eq(schema.auditLog.action, "assessment.show_items_after")).all()).toHaveLength(1);
  });
});
