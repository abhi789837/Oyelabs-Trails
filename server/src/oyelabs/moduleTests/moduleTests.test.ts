import fs from "node:fs";
import path from "node:path";

import { and, eq, sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { MODULE_TEST_COST_TARGET_USD, MODULE_TEST_SIZE, type ModuleTestView, type ServedModuleTest } from "../../../../shared/moduleTests";
import type { TopicGroundingContent } from "../../../../shared/topicTests";
import { schema } from "../../db";
import { JobWorker } from "../../jobs/worker";
import { newId, now } from "../../lib/ids";
import { HttpSttClient } from "../../speech/stt";
import { citationProblem } from "../../topicTests/grounding";
import { activeLearner, adminSession, as, createTestApp, type Session, type TestContext } from "../../test/harness";
import { sha256 } from "../extract/passages";
import { uploadPath } from "../media/storage";
import { estimateModuleCostUsd, itemPayload, moduleItems } from "./generate";
import { moduleTestJobHandlers } from "./jobs";

/**
 * v4.5 Phase 3 (PLAN §8, builder C): module tests from a module's own material, end to end through
 * the real job handlers, the v4.3 gates and the mock AI fixtures.
 */

const FIXTURES = path.resolve(__dirname, "../extract/fixtures");

let ctx: TestContext;
let admin: Session;
let worker: JobWorker;
let sttCalls: number;

/** A fake Whisper: answers each chunk with a few timed words; the second chunk is the last. */
function fakeWhisper(): typeof fetch {
  return (async () => {
    sttCalls += 1;
    const last = sttCalls >= 2;
    const words = (last ? "After the demo the project manager writes the change requests into the tracker." : "In the sprint demo the team shows finished stories to the client every Friday.")
      .split(" ")
      .map((w, i) => ({ word: w, start: i * 0.5, end: i * 0.5 + 0.4 }));
    return new Response(JSON.stringify({ text: words.map((w) => w.word).join(" "), words, duration: last ? 95 : 600 }), { status: 200 });
  }) as unknown as typeof fetch;
}

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  sttCalls = 0;
  worker = new JobWorker({
    db: ctx.db,
    tickMs: 60_000,
    handlers: moduleTestJobHandlers(
      { db: ctx.db, env: ctx.env, ai: ctx.ai, log: () => undefined },
      {
        extract: {
          ocr: async () => "",
          stt: new HttpSttClient("http://whisper:8080", 5000, fakeWhisper()),
          chunker: { chunk: async (_input, start) => Buffer.alloc(start < 1200 ? 4096 : 10, 1) },
          lookup: async () => ["93.184.216.34"],
        },
      },
    ),
  });
});
afterEach(async () => {
  await ctx.close();
});

/** Runs every job, including deferred ones, until the queue is empty. */
async function drain(): Promise<void> {
  for (let i = 0; i < 30; i++) {
    await worker.drain();
    const queued = ctx.db.select({ n: sql<number>`count(*)` }).from(schema.jobs).where(eq(schema.jobs.status, "queued")).get()?.n ?? 0;
    if (queued === 0) return;
    ctx.db.update(schema.jobs).set({ runAfter: 0 }).where(eq(schema.jobs.status, "queued")).run();
  }
  throw new Error("jobs never settled");
}

function upload(file: string, kind: "doc" | "video" = "doc", mime = "application/pdf"): string {
  const id = newId();
  const rel = `2026/10/${id}${path.extname(file)}`;
  const body = fs.readFileSync(path.join(FIXTURES, file));
  const full = uploadPath(ctx.env, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, body);
  ctx.db.insert(schema.mediaUploads).values({ id, kind, relPath: rel, originalName: file, mime, bytes: body.length, sha256: sha256(body), createdAt: now() }).run();
  return id;
}

interface Built {
  courseId: string;
  modules: { sectionId: string; topicId: string }[];
}

/** What the editor's Save & publish leaves behind (A's tables), plus the generate jobs it queues. */
function buildCourse(modules: { title: string; docs: { file: string; mime: string }[]; notes?: string; video?: boolean }[]): Built {
  const at = now();
  const courseId = newId();
  ctx.db
    .insert(schema.courses)
    .values({ id: courseId, title: "White-label delivery", summary: "How Oyelabs delivers white-label apps.", oyelabs: true, published: true, audience: "everyone", level: "intermediate", createdAt: at, updatedAt: at })
    .run();
  const out: Built = { courseId, modules: [] };
  modules.forEach((m, i) => {
    const sectionId = newId();
    const topicId = newId();
    ctx.db.insert(schema.courseSections).values({ id: sectionId, courseId, title: m.title, position: i, notesText: m.notes ?? "" }).run();
    ctx.db.insert(schema.courseTopics).values({ id: topicId, sectionId, courseId, title: m.title, kind: "module", position: 0 }).run();
    m.docs.forEach((d, p) => {
      ctx.db.insert(schema.courseDocs).values({ id: newId(), courseId, sectionId, position: p, source: "upload", uploadId: upload(d.file, "doc", d.mime), title: d.file, createdAt: at, updatedAt: at }).run();
    });
    if (m.video) {
      const uploadId = upload("notes.md", "video", "video/mp4");
      ctx.db
        .insert(schema.courseVideos)
        .values({ id: newId(), courseId, sectionId, topicId, kind: "upload", playerKind: "html5", tracking: "exact", uploadId, title: "Sprint demo recording", durationSeconds: 700, status: "ok", createdAt: at, updatedAt: at })
        .run();
    }
    out.modules.push({ sectionId, topicId });
  });
  return out;
}

function publish(built: Built): void {
  for (const m of built.modules) ctx.db.insert(schema.jobs).values({ id: newId(), type: "oyelabs.module_test.generate", payload: { sectionId: m.sectionId, reason: "publish" }, status: "queued", attempts: 0, maxAttempts: 3, runAfter: 0, createdAt: now() }).run();
}

async function view(sectionId: string): Promise<ModuleTestView> {
  const res = await ctx.app.inject({ method: "GET", url: `/api/admin/oyelabs/modules/${sectionId}/test`, ...as(admin) });
  expect(res.statusCode).toBe(200);
  return res.json();
}

const PDF = { file: "process-2-pages.pdf", mime: "application/pdf" };
const DOCX = { file: "escalations.docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
const PPTX = { file: "rituals.pptx", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation" };
const XLSX = { file: "rates.xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
const NOTES = [
  "Every client project has one project manager. The project manager is the only person who promises dates to the client, and every promise is written down in the tracker the same day.",
  "",
  "When a client asks for something new in the middle of a sprint, do not start it. Thank them, write it up as a change request, and bring it to the next planning meeting with an estimate.",
  "",
  "Release builds are signed by the release engineer only. Developers never upload a build to a client's app store account themselves, even when the client gives them the password.",
  "",
  "Code reviews at Oyelabs need one approval from a teammate who did not write the change. The reviewer answers within one working day, and the author merges only after the checks pass.",
  "",
  "Client feedback arrives through the shared tracker, not chat. If a client sends feedback by chat or email, the project manager copies it into the tracker and links the message, so nothing is lost between releases.",
  "",
  "If a deadline is at risk, the project manager tells the client at least five working days before the date, with a new date and the reason. Bad news is never saved for the demo.",
].join("\n")

describe("generation", () => {
  test("writes a ready, cited test from the module's docs and notes; cost is logged per course", async () => {
    const built = buildCourse([{ title: "Kick-off and handover", docs: [PDF, DOCX, PPTX], notes: NOTES }]);
    publish(built);
    await drain();

    const v = await view(built.modules[0].sectionId);
    expect(v.status).toBe("ready");
    expect(v.items.length).toBeGreaterThanOrEqual(MODULE_TEST_SIZE.min);
    expect(v.items.length).toBeLessThanOrEqual(MODULE_TEST_SIZE.max);
    expect(v.summary).toBe(`${v.items.length} questions created from 3 docs and your notes`);
    expect(v.sources).toMatchObject({ docs: 3, notes: true });

    // Every item cites an exact passage of this module, and passed every gate.
    const grounding = ctx.db.select().from(schema.topicGrounding).where(eq(schema.topicGrounding.topicId, built.modules[0].topicId)).get()!.content as unknown as TopicGroundingContent;
    for (const row of moduleItems(ctx.db, built.modules[0].topicId, ["active"])) {
      const p = itemPayload(row);
      expect(citationProblem(grounding, p.citation)).toBeNull();
      expect(p.moduleCitation?.sourceTitle).toBeTruthy();
      expect((row.gates as { passed: boolean }).passed).toBe(true);
    }
    expect(v.items.every((i) => i.citationLabel && /, (page|slide) \d|\.docx, |: notes$/.test(i.citationLabel))).toBe(true);
    // Round 1 of the mock writes two bad items; the gates dropped them.
    const ai = ctx.db.select().from(schema.aiCalls).where(eq(schema.aiCalls.courseId, built.courseId)).all();
    expect(new Set(ai.map((c) => c.task))).toEqual(new Set(["module_test_write", "module_test_relevance", "module_test_answer"]));
    expect(ai.filter((c) => c.task === "module_test_write").length).toBeGreaterThanOrEqual(2);

    const textRows = ctx.db.select().from(schema.courseModuleTexts).where(eq(schema.courseModuleTexts.sectionId, built.modules[0].sectionId)).all();
    expect(new Set(textRows.map((r) => r.method))).toEqual(new Set(["pdf", "docx", "pptx", "notes"]));
  });

  test("too little material → needs content, with what to add, and no AI spent", async () => {
    const built = buildCourse([{ title: "Tiny", docs: [], notes: "Be on time." }]);
    publish(built);
    await drain();
    const v = await view(built.modules[0].sectionId);
    expect(v.status).toBe("needs_content");
    expect(v.summary).toMatch(/Add a doc, some notes, or a video/);
    expect(ctx.db.select().from(schema.aiCalls).where(eq(schema.aiCalls.courseId, built.courseId)).all()).toHaveLength(0);
  });

  test("an uploaded video is transcribed with Whisper in 10-minute chunks and cited by time", async () => {
    const built = buildCourse([{ title: "Sprint rituals", docs: [XLSX], notes: NOTES, video: true }]);
    publish(built);
    await drain();
    expect(sttCalls).toBe(2);
    const row = ctx.db.select().from(schema.courseModuleTexts).where(and(eq(schema.courseModuleTexts.sectionId, built.modules[0].sectionId), eq(schema.courseModuleTexts.sourceKind, "video"))).get()!;
    expect(row.status).toBe("done");
    expect(row.method).toBe("whisper");
    expect(row.passages.map((p) => p.locator.startSec ?? -1).some((s) => s >= 600)).toBe(true);
    const video = ctx.db.select().from(schema.courseVideos).where(eq(schema.courseVideos.sectionId, built.modules[0].sectionId)).get()!;
    expect(video.transcriptStatus).toBe("done");
    const v = await view(built.modules[0].sectionId);
    expect(v.sources.videos).toBe(1);
  });

  test("a video that can't be transcribed is noted, and the test uses the docs and notes", async () => {
    const built = buildCourse([{ title: "Kick-off", docs: [PDF], notes: NOTES }]);
    const at = now();
    ctx.db
      .insert(schema.courseVideos)
      .values({ id: newId(), courseId: built.courseId, sectionId: built.modules[0].sectionId, topicId: built.modules[0].topicId, kind: "gdrive", playerKind: "iframe", tracking: "estimated", inputUrl: "https://drive.google.com/file/d/abc/view", title: "Kick-off call", status: "ok", createdAt: at, updatedAt: at })
      .run();
    publish(built);
    await drain();
    const v = await view(built.modules[0].sectionId);
    expect(v.status).toBe("ready");
    expect(v.sources.skipped).toEqual([{ title: "Kick-off call", reason: "Questions use the docs and notes for this video." }]);
  });

  test("changing one doc in module 2 regenerates only module 2; old items are retired and old attempts still read", async () => {
    const built = buildCourse([
      { title: "Kick-off", docs: [PDF], notes: NOTES },
      { title: "Escalations", docs: [DOCX, PPTX], notes: NOTES },
    ]);
    publish(built);
    await drain();
    const [m1, m2] = built.modules;
    const before1 = ctx.db.select().from(schema.courseModuleTests).where(eq(schema.courseModuleTests.sectionId, m1.sectionId)).get()!;
    const oldItems2 = moduleItems(ctx.db, m2.topicId, ["active"]).map((r) => r.id);

    // A learner answers module 2's test once.
    const learner = await activeLearner(ctx, admin);
    const attempt = await ctx.app.inject({ method: "POST", url: `/api/v5/oyelabs/lessons/${m2.topicId}/test/attempt`, ...as(learner.session), payload: { answers: Object.fromEntries(oldItems2.map((id) => [id, [0]])) } });
    expect(attempt.statusCode).toBe(200);

    // The admin swaps module 2's PPTX for the PDF and saves: every module is queued again.
    const doc = ctx.db.select().from(schema.courseDocs).where(and(eq(schema.courseDocs.sectionId, m2.sectionId), eq(schema.courseDocs.title, PPTX.file))).get()!;
    ctx.db.update(schema.courseDocs).set({ uploadId: upload(PDF.file), title: "Handover.pdf", updatedAt: now() + 1 }).where(eq(schema.courseDocs.id, doc.id)).run();
    publish(built);
    await drain();

    const after1 = ctx.db.select().from(schema.courseModuleTests).where(eq(schema.courseModuleTests.sectionId, m1.sectionId)).get()!;
    const after2 = ctx.db.select().from(schema.courseModuleTests).where(eq(schema.courseModuleTests.sectionId, m2.sectionId)).get()!;
    expect(after1.generation).toBe(before1.generation);
    expect(after1.generatedAt).toBe(before1.generatedAt);
    expect(after2.generation).toBe(2);
    expect(after2.status).toBe("ready");
    const statuses = ctx.db.select().from(schema.topicTestItems).where(eq(schema.topicTestItems.topicId, m2.topicId)).all();
    for (const id of oldItems2) expect(statuses.find((r) => r.id === id)?.status).toBe("retired");
    const stored = ctx.db.select().from(schema.topicAttempts).where(eq(schema.topicAttempts.topicId, m2.topicId)).all();
    expect(stored).toHaveLength(1);
    expect(Object.keys(stored[0].answers as object).every((id) => statuses.some((r) => r.id === id))).toBe(true);

    // Publishing again with nothing changed spends nothing.
    const calls = ctx.db.select({ n: sql<number>`count(*)` }).from(schema.aiCalls).get()!.n;
    publish(built);
    await drain();
    expect(ctx.db.select({ n: sql<number>`count(*)` }).from(schema.aiCalls).get()!.n).toBe(calls);
  });

  test("the estimated cost of a full module stays near the target", () => {
    expect(estimateModuleCostUsd(20_000)).toBeLessThanOrEqual(MODULE_TEST_COST_TARGET_USD * 1.2);
    expect(estimateModuleCostUsd(6_000)).toBeLessThan(MODULE_TEST_COST_TARGET_USD);
  });
});

describe("admin edits", () => {
  test("add, edit and remove; Regenerate keeps the admin's own questions", async () => {
    const built = buildCourse([{ title: "Kick-off", docs: [PDF], notes: NOTES }]);
    publish(built);
    await drain();
    const sectionId = built.modules[0].sectionId;
    const base = `/api/admin/oyelabs/modules/${sectionId}/test`;
    const start = await view(sectionId);

    const added = await ctx.app.inject({
      method: "POST",
      url: `${base}/items`,
      ...as(admin),
      payload: { kind: "scenario", prompt: "A client asks for a kick-off next week. What do you do?", options: ["Book it within two working days", "Wait for the client", "Ask QA"], correctIndices: [0] },
    });
    expect(added.statusCode).toBe(200);
    const mine = added.json().item;
    expect(mine.origin).toBe("admin");
    expect(added.json().test.items).toHaveLength(start.items.length + 1);

    const badQuote = await ctx.app.inject({
      method: "POST",
      url: `${base}/items`,
      ...as(admin),
      payload: { prompt: "Which is right about kick-offs?", options: ["One", "Two", "Three"], correctIndices: [0], citation: { passageId: "nope.1", quote: "this quote is not anywhere", sourceKind: "doc", sourceId: "x", sourceTitle: "x", locator: {} } },
    });
    expect(badQuote.statusCode).toBe(400);

    const target = start.items[0];
    const edited = await ctx.app.inject({ method: "PUT", url: `${base}/items/${target.id}`, ...as(admin), payload: { kind: "recall", prompt: "Edited: when does the kick-off happen?", options: target.options, correctIndices: target.correctIndices, explanation: "Within two working days." } });
    expect(edited.statusCode).toBe(200);
    expect(edited.json().item.prompt).toBe("Edited: when does the kick-off happen?");

    const removed = await ctx.app.inject({ method: "DELETE", url: `${base}/items/${start.items[1].id}`, ...as(admin) });
    expect(removed.statusCode).toBe(200);
    expect(removed.json().test.items.find((i: { id: string }) => i.id === start.items[1].id)).toBeUndefined();

    const regen = await ctx.app.inject({ method: "POST", url: `${base}/regenerate`, ...as(admin) });
    expect(regen.json().status).toBe("gathering");
    await drain();
    const after = await view(sectionId);
    expect(after.status).toBe("ready");
    expect(after.items.some((i) => i.id === mine.id)).toBe(true);
    expect(after.items.some((i) => i.id === target.id)).toBe(true);
    expect(after.items.some((i) => i.id === start.items[2].id)).toBe(false);

    const learner = await activeLearner(ctx, admin);
    const forbidden = await ctx.app.inject({ method: "GET", url: `${base}`, ...as(learner.session) });
    expect(forbidden.statusCode).toBe(403);
  });
});

describe("learner", () => {
  async function pass(session: Session, topicId: string, right = true) {
    const served = await ctx.app.inject({ method: "GET", url: `/api/v5/oyelabs/lessons/${topicId}/test`, ...as(session) });
    const test: ServedModuleTest = served.json();
    const keys = new Map(moduleItems(ctx.db, topicId, ["active"]).map((r) => [r.id, itemPayload(r)]));
    const answers = Object.fromEntries(
      test.items.map((item, i) => {
        const p = keys.get(item.id)!;
        const key = p.correctIndices ?? [p.correctIndex];
        return [item.id, right || i > 0 ? key : [(key[0] + 1) % item.options.length]];
      }),
    );
    if (!right) for (const item of test.items.slice(0, 3)) answers[item.id] = [(keys.get(item.id)!.correctIndex + 1) % item.options.length];
    return ctx.app.inject({ method: "POST", url: `/api/v5/oyelabs/lessons/${topicId}/test/attempt`, ...as(session), payload: { answers } });
  }

  test("served without keys; Full or Not yet; 80% passes, marks the module done, and the last module issues the certificate", async () => {
    const built = buildCourse([
      { title: "Kick-off", docs: [PDF], notes: NOTES },
      { title: "Escalations", docs: [DOCX, PPTX], notes: NOTES },
    ]);
    publish(built);
    await drain();
    const learner = await activeLearner(ctx, admin);
    const [m1, m2] = built.modules;

    const served = await ctx.app.inject({ method: "GET", url: `/api/v5/oyelabs/lessons/${m1.topicId}/test`, ...as(learner.session) });
    expect(served.statusCode).toBe(200);
    expect(served.body).not.toMatch(/correct|explanation|citation/i);
    expect(served.json()).toMatchObject({ passPercent: 80, locked: false });

    // Ticking a module lesson off is refused.
    const tick = await ctx.app.inject({ method: "POST", url: `/api/me/courses/topics/${m1.topicId}/complete`, ...as(learner.session), payload: { done: true } });
    expect(tick.statusCode).toBe(409);
    expect(tick.json().error.message).toBe("Pass the module test to finish this module.");

    const fail = await pass(learner.session, m1.topicId, false);
    expect(fail.statusCode).toBe(200);
    expect(fail.json()).toMatchObject({ passed: false, completed: false });
    expect(fail.json().results.some((r: { verdict: string }) => r.verdict === "not_yet")).toBe(true);
    expect(fail.json().results[0].source).toBeTruthy();

    const ok = await pass(learner.session, m1.topicId);
    expect(ok.json()).toMatchObject({ passed: true, score: 100, completed: true });
    expect(ctx.db.select().from(schema.certificates).where(eq(schema.certificates.userId, learner.id)).all()).toHaveLength(0);

    const ok2 = await pass(learner.session, m2.topicId);
    expect(ok2.json().completed).toBe(true);
    const certs = ctx.db.select().from(schema.certificates).where(eq(schema.certificates.userId, learner.id)).all();
    expect(certs).toMatchObject([{ kind: "course", refId: built.courseId }]);
    const attempts = ctx.db.select().from(schema.topicAttempts).where(eq(schema.topicAttempts.userId, learner.id)).all();
    expect(attempts.every((a) => a.courseId === built.courseId)).toBe(true);
  });

  test("the test waits for the module's videos (409 videos_unwatched)", async () => {
    const built = buildCourse([{ title: "Sprint rituals", docs: [PDF], notes: NOTES, video: true }]);
    publish(built);
    await drain();
    const learner = await activeLearner(ctx, admin);
    const served = await ctx.app.inject({ method: "GET", url: `/api/v5/oyelabs/lessons/${built.modules[0].topicId}/test`, ...as(learner.session) });
    expect(served.json().locked).toBe(true);
    const res = await pass(learner.session, built.modules[0].topicId);
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe("videos_unwatched");
  });
});
