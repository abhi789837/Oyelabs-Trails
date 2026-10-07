import fs from "node:fs";
import path from "node:path";

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { activeTimeSampleSchema, ESTIMATED_MAX_SAMPLE_SEC, type ModulePlaylistResponse } from "../../../../shared/videoSources";
import { DOC_UPLOAD_MAX_BYTES } from "../../../../shared/oyelabsCourses";
import { schema } from "../../db";
import { newId, now } from "../../lib/ids";
import { activeLearner, adminSession, as, createTestApp, type Session, type TestContext } from "../../test/harness";
import { setVideoLockMode } from "../../videos/repo";
import { brokenLinkInboxItems } from "./inboxItems";
import { mediaJobHandlers } from "./jobs";
import { checkVideo, sweepOrphanUploads } from "./check";
import type { ResolveDeps } from "./resolve";
import { parseRange } from "./routes";
import { uploadPath } from "./storage";
import { assertModuleVideosWatched, confirmWatched, findModuleLesson, recordActiveSample, recordExactSample } from "./tracking";
import { transcodeUpload, type MediaTools } from "./transcode";

const WEBM = fs.readFileSync(path.resolve(process.cwd(), "scripts/e2e/fixtures/v45-sample.webm"));

function multipart(fields: Record<string, string>, file: { name: string; data: Buffer; type?: string }) {
  const boundary = "----oyelearnTestBoundary";
  const parts: Buffer[] = [];
  for (const [k, v] of Object.entries(fields)) parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.name}"\r\nContent-Type: ${file.type ?? "application/octet-stream"}\r\n\r\n`));
  parts.push(file.data, Buffer.from(`\r\n--${boundary}--\r\n`));
  return { payload: Buffer.concat(parts), headers: { "content-type": `multipart/form-data; boundary=${boundary}` } };
}

interface Fixture {
  courseId: string;
  sectionId: string;
  topicId: string;
  drive: string;
  dropbox: string;
}

/** A published Oyelabs course with one module: a Drive video (estimated, 100 s) and a Dropbox video (exact, 100 s). */
function seedCourse(ctx: TestContext, departments: string[] = []): Fixture {
  const at = now();
  const courseId = newId();
  const sectionId = newId();
  const topicId = newId();
  ctx.db.insert(schema.courses).values({ id: courseId, title: "White-label delivery", oyelabs: true, published: true, audience: "everyone", createdAt: at, updatedAt: at }).run();
  for (const d of departments) ctx.db.insert(schema.courseDepartments).values({ courseId, departmentId: d }).run();
  ctx.db.insert(schema.courseSections).values({ id: sectionId, courseId, title: "Kick-off" }).run();
  ctx.db.insert(schema.courseTopics).values({ id: topicId, sectionId, courseId, title: "Kick-off", kind: "module" }).run();
  const drive = newId();
  const dropbox = newId();
  ctx.db
    .insert(schema.courseVideos)
    .values([
      { id: drive, courseId, sectionId, topicId, position: 0, kind: "gdrive", playerKind: "iframe", tracking: "estimated", inputUrl: "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view", embedUrl: "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/preview", title: "Kick-off call", durationSeconds: 100, durationSource: "admin", status: "ok", createdAt: at, updatedAt: at },
      { id: dropbox, courseId, sectionId, topicId, position: 1, kind: "dropbox", playerKind: "html5", tracking: "exact", inputUrl: "https://www.dropbox.com/s/a/b.mp4?dl=0", playbackUrl: "https://www.dropbox.com/s/a/b.mp4?raw=1", title: "Handover", durationSeconds: 100, durationSource: "probe", status: "ok", createdAt: at, updatedAt: at },
    ])
    .run();
  return { courseId, sectionId, topicId, drive, dropbox };
}

describe("Oyelabs media", () => {
  let ctx: TestContext;
  let admin: Session;
  let learner: { id: string; session: Session };
  beforeEach(async () => {
    ctx = await createTestApp();
    admin = await adminSession(ctx);
    learner = await activeLearner(ctx, admin);
  });
  afterEach(async () => {
    await ctx.close();
  });

  const upload = (kind: string, file: { name: string; data: Buffer }, who: Session = admin) =>
    ctx.app.inject({ method: "POST", url: `/api/admin/oyelabs/uploads?kind=${kind}`, ...as(who), ...multipart({}, file) });

  describe("uploads", () => {
    test("a video upload is stored, deduplicated by sha256, and queued for probing", async () => {
      const first = await upload("video", { name: "kick-off.webm", data: WEBM });
      expect(first.statusCode).toBe(201);
      const view = first.json();
      expect(view).toMatchObject({ kind: "video", name: "kick-off.webm", mime: "video/webm", bytes: WEBM.length, transcode: "none" });
      const row = ctx.db.select().from(schema.mediaUploads).where(eq(schema.mediaUploads.id, view.id)).get()!;
      expect(fs.readFileSync(uploadPath(ctx.env, row.relPath)).equals(WEBM)).toBe(true);
      expect(row.relPath).toMatch(/^\d{4}\/\d{2}\/[\w-]+\.webm$/);
      expect(ctx.db.select().from(schema.jobs).all().filter((j) => j.type === "oyelabs.upload.transcode")).toHaveLength(1);

      const again = await upload("video", { name: "copy.webm", data: WEBM });
      expect(again.statusCode).toBe(200);
      expect(again.json().id).toBe(view.id);
      expect(ctx.db.select().from(schema.mediaUploads).all()).toHaveLength(1);
      expect(fs.readdirSync(path.join(ctx.env.dataDir, "uploads", "tmp"))).toEqual([]);
    });

    test("413 over the limit, 415 for a bad extension or magic bytes, 403 for a learner", async () => {
      const big = await upload("doc", { name: "huge.txt", data: Buffer.alloc(DOC_UPLOAD_MAX_BYTES + 10, 0x61) });
      expect(big.statusCode).toBe(413);
      expect(big.json().error.message).toContain("50 MB");
      const fake = await upload("video", { name: "notreally.mp4", data: Buffer.from("this is text, not a video") });
      expect(fake.statusCode).toBe(415);
      expect(fake.json().error.message).toBe("That file doesn't look like a real .mp4 file. Save it again from the app that made it, then upload it.");
      const pdfAsWebm = await upload("doc", { name: "x.pdf", data: WEBM });
      expect(pdfAsWebm.statusCode).toBe(415);
      const exe = await upload("doc", { name: "x.exe", data: Buffer.from("MZ") });
      expect(exe.statusCode).toBe(415);
      const asLearner = await upload("video", { name: "a.webm", data: WEBM }, learner.session);
      expect(asLearner.statusCode).toBe(403);
      expect(fs.readdirSync(path.join(ctx.env.dataDir, "uploads", "tmp"))).toEqual([]);
    });

    test("path traversal: the name is cleaned and stored paths can't escape", async () => {
      const res = await upload("doc", { name: "../../../etc/notes.md", data: Buffer.from("# Notes\nHello") });
      expect(res.statusCode).toBe(201);
      expect(res.json().name).toBe("notes.md");
      const row = ctx.db.select().from(schema.mediaUploads).all()[0]!;
      expect(uploadPath(ctx.env, row.relPath).startsWith(path.join(ctx.env.dataDir, "uploads"))).toBe(true);
      expect(() => uploadPath(ctx.env, "../../secret")).toThrow(/escapes/);
      const bad = await ctx.app.inject({ method: "GET", url: "/api/v5/oyelabs/media/..%2F..%2Fsecret", ...as(admin) });
      expect([400, 404]).toContain(bad.statusCode);
    });

    test("the upload plays: Range 206 for the learner, 404 outside the department", async () => {
      const f = seedCourse(ctx);
      const up = (await upload("video", { name: "handover.webm", data: WEBM })).json();
      ctx.db.insert(schema.courseVideos).values({ id: newId(), courseId: f.courseId, sectionId: f.sectionId, topicId: f.topicId, position: 2, kind: "upload", playerKind: "html5", tracking: "exact", uploadId: up.id, title: "Handover", status: "ok", createdAt: now(), updatedAt: now() }).run();

      const playlist = (await ctx.app.inject({ method: "GET", url: `/api/v5/oyelabs/lessons/${f.topicId}/playlist`, ...as(learner.session) })).json() as ModulePlaylistResponse;
      const entry = playlist.entries.find((e) => e.kind === "upload")!;
      expect(entry.playbackUrl).toBe(`/api/v5/oyelabs/media/${up.id}`);
      expect(entry.status).toBe("not-started");

      const full = await ctx.app.inject({ method: "GET", url: entry.playbackUrl!, ...as(learner.session) });
      expect(full.statusCode).toBe(200);
      expect(full.headers["accept-ranges"]).toBe("bytes");
      expect(full.headers["content-type"]).toContain("video/webm");
      expect(full.rawPayload.equals(WEBM)).toBe(true);
      const part = await ctx.app.inject({ method: "GET", url: entry.playbackUrl!, headers: { range: "bytes=0-99" }, ...as(learner.session) });
      expect(part.statusCode).toBe(206);
      expect(part.headers["content-range"]).toBe(`bytes 0-99/${WEBM.length}`);
      expect(part.rawPayload.equals(WEBM.subarray(0, 100))).toBe(true);
      const tooFar = await ctx.app.inject({ method: "GET", url: entry.playbackUrl!, headers: { range: `bytes=${WEBM.length}-` }, ...as(learner.session) });
      expect(tooFar.statusCode).toBe(416);

      // Move the course to another department: the learner (engineering) can't stream or see it.
      ctx.db.insert(schema.courseDepartments).values({ courseId: f.courseId, departmentId: "project-management" }).run();
      expect((await ctx.app.inject({ method: "GET", url: entry.playbackUrl!, ...as(learner.session) })).statusCode).toBe(404);
      expect((await ctx.app.inject({ method: "GET", url: `/api/v5/oyelabs/lessons/${f.topicId}/playlist`, ...as(learner.session) })).statusCode).toBe(404);
      expect((await ctx.app.inject({ method: "GET", url: entry.playbackUrl! })).statusCode).toBe(401);
      // Staff preview still works.
      expect((await ctx.app.inject({ method: "GET", url: entry.playbackUrl!, ...as(admin) })).statusCode).toBe(200);
    });

    test("an uploaded doc downloads for the learner", async () => {
      const f = seedCourse(ctx);
      const up = (await upload("doc", { name: "Process.pdf", data: Buffer.from("%PDF-1.4\n%fake but magic is right\n") })).json();
      const docId = newId();
      ctx.db.insert(schema.courseDocs).values({ id: docId, courseId: f.courseId, sectionId: f.sectionId, source: "upload", uploadId: up.id, title: "Process.pdf", createdAt: now(), updatedAt: now() }).run();
      const list = (await ctx.app.inject({ method: "GET", url: `/api/v5/oyelabs/lessons/${f.topicId}/playlist`, ...as(learner.session) })).json();
      expect(list.docs[0]).toMatchObject({ docId, title: "Process.pdf", source: "upload" });
      const res = await ctx.app.inject({ method: "GET", url: list.docs[0].href, ...as(learner.session) });
      expect(res.statusCode).toBe(200);
      expect(res.headers["content-disposition"]).toContain("Process.pdf");
    });

    test("Range parsing", () => {
      expect(parseRange(undefined, 100)).toBeNull();
      expect(parseRange("bytes=10-", 100)).toEqual({ start: 10, end: 99 });
      expect(parseRange("bytes=-10", 100)).toEqual({ start: 90, end: 99 });
      expect(parseRange("bytes=0-1000", 100)).toEqual({ start: 0, end: 99 });
      expect(parseRange("bytes=200-300", 100)).toBe("invalid");
      expect(parseRange("items=1-2", 100)).toBeNull();
    });
  });

  describe("transcode (fake runner)", () => {
    const fakeTools = (over: Partial<MediaTools> = {}): MediaTools & { calls: string[] } => {
      const calls: string[] = [];
      return {
        calls,
        available: async () => true,
        probe: async () => ({ durationSeconds: 61.5, format: "mov,mp4,m4a,3gp,3g2,mj2", videoCodec: "hevc", audioCodec: "aac" }),
        transcode: async (input, output) => {
          calls.push(`${path.basename(input)} -> ${path.basename(output)}`);
          fs.writeFileSync(output, "converted");
        },
        ...over,
      };
    };
    // A MOV is ISO-BMFF too: an ftyp box at byte 4.
    const MOV = Buffer.concat([Buffer.from([0, 0, 0, 20]), Buffer.from("ftypqt  "), Buffer.alloc(64, 1)]);

    test("a MOV is converted to MP4, with its length spread to the module", async () => {
      const f = seedCourse(ctx);
      const up = (await upload("video", { name: "screen.mov", data: MOV })).json();
      expect(up.transcode).toBe("pending");
      const vid = newId();
      ctx.db.insert(schema.courseVideos).values({ id: vid, courseId: f.courseId, sectionId: f.sectionId, topicId: f.topicId, position: 3, kind: "upload", playerKind: "html5", tracking: "exact", uploadId: up.id, status: "ok", createdAt: now(), updatedAt: now() }).run();
      // Not playable before conversion: unavailable, so it doesn't block the lock.
      let list = (await ctx.app.inject({ method: "GET", url: `/api/v5/oyelabs/lessons/${f.topicId}/playlist`, ...as(learner.session) })).json() as ModulePlaylistResponse;
      expect(list.entries.find((e) => e.videoId === vid)?.status).toBe("unavailable");

      const tools = fakeTools();
      await transcodeUpload(ctx.db, ctx.env, up.id, tools);
      const row = ctx.db.select().from(schema.mediaUploads).where(eq(schema.mediaUploads.id, up.id)).get()!;
      expect(row).toMatchObject({ transcodeStatus: "done", playbackMime: "video/mp4", durationSeconds: 61.5 });
      expect(row.playbackRelPath).toMatch(/\.play\.mp4$/);
      expect(tools.calls).toHaveLength(1);
      expect(ctx.db.select().from(schema.courseVideos).where(eq(schema.courseVideos.id, vid)).get()?.durationSeconds).toBe(61.5);
      const stream = await ctx.app.inject({ method: "GET", url: `/api/v5/oyelabs/media/${up.id}`, ...as(learner.session) });
      expect(stream.body).toBe("converted");
      expect(stream.headers["content-type"]).toContain("video/mp4");
      list = (await ctx.app.inject({ method: "GET", url: `/api/v5/oyelabs/lessons/${f.topicId}/playlist`, ...as(learner.session) })).json() as ModulePlaylistResponse;
      expect(list.entries.find((e) => e.videoId === vid)?.status).toBe("not-started");
      // Idempotent.
      await transcodeUpload(ctx.db, ctx.env, up.id, tools);
      expect(tools.calls).toHaveLength(1);
    });

    test("a playable WebM is only probed; no ffmpeg means MOV fails plainly", async () => {
      const webm = (await upload("video", { name: "a.webm", data: WEBM })).json();
      const tools = fakeTools({ probe: async () => ({ durationSeconds: 4, format: "matroska,webm", videoCodec: "vp8", audioCodec: null }) });
      await transcodeUpload(ctx.db, ctx.env, webm.id, tools);
      expect(ctx.db.select().from(schema.mediaUploads).where(eq(schema.mediaUploads.id, webm.id)).get()).toMatchObject({ transcodeStatus: "none", durationSeconds: 4 });
      expect(tools.calls).toEqual([]);

      const mov = (await upload("video", { name: "b.mov", data: MOV })).json();
      await transcodeUpload(ctx.db, ctx.env, mov.id, fakeTools({ available: async () => false }));
      const row = ctx.db.select().from(schema.mediaUploads).where(eq(schema.mediaUploads.id, mov.id)).get()!;
      expect(row.transcodeStatus).toBe("failed");
      expect(row.error).toContain("Video conversion isn't available");
      const job = mediaJobHandlers({ db: ctx.db, env: ctx.env, ai: ctx.ai, log: () => undefined }, { tools: fakeTools() })["oyelabs.upload.transcode"]!;
      await job({ id: "j", type: "oyelabs.upload.transcode", payload: { uploadId: mov.id } } as never);
      expect(ctx.db.select().from(schema.mediaUploads).where(eq(schema.mediaUploads.id, mov.id)).get()?.transcodeStatus).toBe("failed");
    });
  });

  describe("estimated tracking", () => {
    test("wall-clock cap, hidden/unfocused ignored, confirm refused under 80%, watched needs both", async () => {
      const f = seedCourse(ctx);
      const lesson = findModuleLesson(ctx.db, f.topicId)!;
      const video = ctx.db.select().from(schema.courseVideos).where(eq(schema.courseVideos.id, f.drive)).get()!;
      let t = 1_000_000;
      // First sample: at most one interval (15 s) + slack.
      expect(recordActiveSample(ctx.db, learner.id, lesson, video, { activeSeconds: 30, visible: true, focused: true }, t)).toBe(17);
      // 5 s of wall clock later: a 30 s claim gets 5 + 2.
      t += 5_000;
      expect(recordActiveSample(ctx.db, learner.id, lesson, video, { activeSeconds: 30, visible: true, focused: true }, t)).toBe(7);
      // Hidden or unfocused: nothing.
      t += 15_000;
      expect(recordActiveSample(ctx.db, learner.id, lesson, video, { activeSeconds: 15, visible: false, focused: true }, t)).toBe(0);
      t += 15_000;
      expect(recordActiveSample(ctx.db, learner.id, lesson, video, { activeSeconds: 15, visible: true, focused: false }, t)).toBe(0);
      // A sleeping laptop: hours later, still at most 30 s.
      t += 3 * 3600_000;
      expect(recordActiveSample(ctx.db, learner.id, lesson, video, { activeSeconds: 30, visible: true, focused: true }, t)).toBe(ESTIMATED_MAX_SAMPLE_SEC);
      // The schema refuses a bigger claim outright.
      expect(activeTimeSampleSchema.safeParse({ activeSeconds: 3600, visible: true, focused: true }).success).toBe(false);
      // 54 s active of a 100 s video: confirm refused (needs 80).
      expect(() => confirmWatched(ctx.db, learner.id, lesson, video, t)).toThrow(/Keep watching/);
      t += 15_000;
      recordActiveSample(ctx.db, learner.id, lesson, video, { activeSeconds: 15, visible: true, focused: true }, t);
      t += 15_000;
      recordActiveSample(ctx.db, learner.id, lesson, video, { activeSeconds: 15, visible: true, focused: true }, t);
      let state = (await ctx.app.inject({ method: "GET", url: `/api/v5/oyelabs/lessons/${f.topicId}/playlist`, ...as(learner.session) })).json() as ModulePlaylistResponse;
      let entry = state.entries.find((e) => e.videoId === f.drive)!;
      expect(entry).toMatchObject({ tracking: "estimated", watchedSeconds: 84, requiredSeconds: 80, canConfirm: true, watched: false, confirmed: false, status: "in-progress" });
      // 80% alone isn't watched; the click makes it.
      const res = await ctx.app.inject({ method: "POST", url: `/api/v5/oyelabs/lessons/${f.topicId}/videos/${f.drive}/watched`, ...as(learner.session) });
      expect(res.statusCode).toBe(200);
      entry = (res.json() as ModulePlaylistResponse).entries.find((e) => e.videoId === f.drive)!;
      expect(entry).toMatchObject({ watched: true, confirmed: true, status: "watched", canConfirm: false });
      state = res.json();
      expect(state.watchedCount).toBe(1);
    });

    test("confirm refused when the length is unknown; the route takes active samples", async () => {
      const f = seedCourse(ctx);
      ctx.db.update(schema.courseVideos).set({ durationSeconds: null, durationSource: null }).where(eq(schema.courseVideos.id, f.drive)).run();
      const sample = await ctx.app.inject({ method: "POST", url: `/api/v5/oyelabs/lessons/${f.topicId}/videos/${f.drive}/progress`, payload: { activeSeconds: 10, visible: true, focused: true }, ...as(learner.session) });
      expect(sample.statusCode).toBe(200);
      expect((sample.json() as ModulePlaylistResponse).entries[0]).toMatchObject({ watchedSeconds: 10, requiredSeconds: null, canConfirm: false });
      const confirm = await ctx.app.inject({ method: "POST", url: `/api/v5/oyelabs/lessons/${f.topicId}/videos/${f.drive}/watched`, ...as(learner.session) });
      expect(confirm.statusCode).toBe(409);
      expect(confirm.json().error.message).toContain("Ask your admin to add the video's length");
      const wrongShape = await ctx.app.inject({ method: "POST", url: `/api/v5/oyelabs/lessons/${f.topicId}/videos/${f.drive}/progress`, payload: { from: 0, to: 5, position: 5 }, ...as(learner.session) });
      expect(wrongShape.statusCode).toBe(400);
    });
  });

  describe("exact tracking", () => {
    test("Dropbox/direct reuse v4.3 ranges: seeks don't count, 90% watches", async () => {
      const f = seedCourse(ctx);
      const url = `/api/v5/oyelabs/lessons/${f.topicId}/videos/${f.dropbox}/progress`;
      const send = (from: number, to: number, elapsed: number) => ctx.app.inject({ method: "POST", url, payload: { from, to, position: to, elapsed, duration: 100 }, ...as(learner.session) });
      expect((await send(0, 5, 5)).statusCode).toBe(200);
      // A seek to 80 s counts nothing.
      let entry = ((await send(5, 80, 1)).json() as ModulePlaylistResponse).entries.find((e) => e.videoId === f.dropbox)!;
      expect(entry.watchedSeconds).toBe(5);
      expect(entry.tracking).toBe("exact");
      for (let s = 5; s < 95; s += 5) await send(s, s + 5, 5);
      entry = ((await send(95, 100, 5)).json() as ModulePlaylistResponse).entries.find((e) => e.videoId === f.dropbox)!;
      expect(entry).toMatchObject({ watched: true, status: "watched", watchedSeconds: 100 });
      const estimatedShape = await ctx.app.inject({ method: "POST", url, payload: { activeSeconds: 10, visible: true, focused: true }, ...as(learner.session) });
      expect(estimatedShape.statusCode).toBe(400);
    });

    test("a length the player reports fills in an unknown one", () => {
      const f = seedCourse(ctx);
      ctx.db.update(schema.courseVideos).set({ durationSeconds: null }).where(eq(schema.courseVideos.id, f.dropbox)).run();
      const lesson = findModuleLesson(ctx.db, f.topicId)!;
      const video = ctx.db.select().from(schema.courseVideos).where(eq(schema.courseVideos.id, f.dropbox)).get()!;
      recordExactSample(ctx.db, learner.id, lesson, video, { from: 0, to: 5, position: 5, elapsed: 5, duration: 240 });
      expect(ctx.db.select().from(schema.courseVideos).where(eq(schema.courseVideos.id, f.dropbox)).get()).toMatchObject({ durationSeconds: 240, durationSource: "player" });
      expect(ctx.db.select().from(schema.courseTopics).where(eq(schema.courseTopics.id, f.topicId)).get()?.estMinutes).toBeGreaterThan(4);
    });
  });

  describe("the lock", () => {
    const learnerUser = () => ({ id: learner.id, role: "learner" }) as never;

    test("409 until watched; warn mode; staff exempt; unavailable entries don't block", () => {
      const f = seedCourse(ctx);
      expect(() => assertModuleVideosWatched(ctx.db, learnerUser(), f.topicId)).toThrow(/Watch the 2 remaining videos of this module first \(0 of 2 watched\)/);
      try {
        assertModuleVideosWatched(ctx.db, learnerUser(), f.topicId);
      } catch (error) {
        expect((error as { statusCode: number; code: string }).statusCode).toBe(409);
        expect((error as { code: string }).code).toBe("videos_unwatched");
      }
      expect(() => assertModuleVideosWatched(ctx.db, { id: "x", role: "admin" } as never, f.topicId)).not.toThrow();
      setVideoLockMode(ctx.db, "warn");
      expect(() => assertModuleVideosWatched(ctx.db, learnerUser(), f.topicId)).not.toThrow();
      setVideoLockMode(ctx.db, "lock");

      // Dropbox link broken (not found) → unavailable; Drive watched → unlocked.
      ctx.db.update(schema.courseVideos).set({ status: "not_found", problem: { code: "not_found", message: "This Dropbox video wasn't found.", fix: "x" } }).where(eq(schema.courseVideos.id, f.dropbox)).run();
      const lesson = findModuleLesson(ctx.db, f.topicId)!;
      const drive = ctx.db.select().from(schema.courseVideos).where(eq(schema.courseVideos.id, f.drive)).get()!;
      let t = 5_000_000;
      for (let i = 0; i < 6; i++) recordActiveSample(ctx.db, learner.id, lesson, drive, { activeSeconds: 15, visible: true, focused: true }, (t += 15_000));
      expect(() => assertModuleVideosWatched(ctx.db, learnerUser(), f.topicId)).toThrow(/last video/);
      confirmWatched(ctx.db, learner.id, lesson, drive, t);
      expect(() => assertModuleVideosWatched(ctx.db, learnerUser(), f.topicId)).not.toThrow();

      // A private Drive link can be "Oyelabs only": it still counts (signed-in learners can play it).
      ctx.db.update(schema.courseVideos).set({ status: "private" }).where(eq(schema.courseVideos.id, f.drive)).run();
      ctx.db.delete(schema.videoProgress).run();
      expect(() => assertModuleVideosWatched(ctx.db, learnerUser(), f.topicId)).toThrow(/last video/);
    });

    test("a completed module is exempt", () => {
      const f = seedCourse(ctx);
      ctx.db.insert(schema.courseProgress).values({ userId: learner.id, topicId: f.topicId, courseId: f.courseId, completedAt: now() }).run();
      expect(() => assertModuleVideosWatched(ctx.db, learnerUser(), f.topicId)).not.toThrow();
    });
  });

  describe("daily re-check and the inbox", () => {
    const deps = (status: number, location?: string): ResolveDeps => ({
      lookup: async () => ["142.250.1.1"],
      fetchImpl: (async (input: string | URL | Request) => {
        const url = String(input);
        if (url.startsWith("https://accounts.google.com")) return new Response("", { status: 200 });
        return new Response("<title>Kick-off call - Google Drive</title>", { status, headers: location ? { location } : {} });
      }) as typeof fetch,
    });

    test("a newly broken link sets broken_since and shows in the inbox; fixed clears it", async () => {
      const f = seedCourse(ctx);
      await checkVideo(ctx.db, f.drive, deps(302, "https://accounts.google.com/ServiceLogin"));
      const broken = ctx.db.select().from(schema.courseVideos).where(eq(schema.courseVideos.id, f.drive)).get()!;
      expect(broken.status).toBe("private");
      expect(broken.brokenSince).toBeGreaterThan(0);
      expect(broken.problem?.message).toBe("This Drive video is private.");
      const items = brokenLinkInboxItems(ctx.db);
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({ group: "courses", title: '1 link in "White-label delivery" stopped working', detail: "This Drive video is private.", href: `/admin/library/${f.courseId}/oyelabs` });
      // The real inbox shows it too.
      const inbox = await ctx.app.inject({ method: "GET", url: "/api/admin/v5/inbox", ...as(admin) });
      expect(JSON.stringify(inbox.json())).toContain("stopped working");
      // Dismissed: hidden until another break.
      const key = (items[0]!.secondary as { key: string }).key;
      expect(brokenLinkInboxItems(ctx.db, { [key]: Date.now() })).toHaveLength(0);

      await checkVideo(ctx.db, f.drive, deps(200));
      const fixed = ctx.db.select().from(schema.courseVideos).where(eq(schema.courseVideos.id, f.drive)).get()!;
      expect(fixed).toMatchObject({ status: "ok", brokenSince: null, problem: null, title: "Kick-off call" });
      expect(fixed.durationSeconds).toBe(100); // the admin's length is kept
      expect(brokenLinkInboxItems(ctx.db)).toHaveLength(0);
    });

    test("one network blip isn't a break; two in a row are", async () => {
      const f = seedCourse(ctx);
      const failing: ResolveDeps = { lookup: async () => ["142.250.1.1"], fetchImpl: (async () => Promise.reject(new Error("ECONNRESET"))) as typeof fetch };
      await checkVideo(ctx.db, f.drive, failing);
      expect(ctx.db.select().from(schema.courseVideos).where(eq(schema.courseVideos.id, f.drive)).get()).toMatchObject({ status: "unreachable", brokenSince: null });
      await checkVideo(ctx.db, f.drive, failing);
      expect(ctx.db.select().from(schema.courseVideos).where(eq(schema.courseVideos.id, f.drive)).get()?.brokenSince).toBeGreaterThan(0);
    });

    test("the sweep queues stale links and removes week-old orphan uploads", async () => {
      const f = seedCourse(ctx);
      ctx.db.update(schema.courseVideos).set({ lastCheckedAt: now() }).where(eq(schema.courseVideos.id, f.dropbox)).run();
      const orphan = (await upload("doc", { name: "old.md", data: Buffer.from("# Old") })).json();
      const kept = (await upload("doc", { name: "draft.md", data: Buffer.from("# In a draft") })).json();
      ctx.db.insert(schema.courseDrafts).values({ id: newId(), data: { modules: [{ docs: [{ uploadId: kept.id }] }] }, createdAt: now(), updatedAt: now() }).run();
      ctx.db.update(schema.mediaUploads).set({ createdAt: now() - 8 * 24 * 3600_000 }).run();

      const handlers = mediaJobHandlers({ db: ctx.db, env: ctx.env, ai: ctx.ai, log: () => undefined });
      await handlers["oyelabs.links.recheck"]!({ id: "j", type: "oyelabs.links.recheck", payload: {} } as never);
      const queued = ctx.db.select().from(schema.jobs).all().filter((j) => j.type === "oyelabs.link.check");
      expect(queued.map((j) => j.payload)).toEqual([{ videoId: f.drive }]);
      const rows = ctx.db.select().from(schema.mediaUploads).all();
      expect(rows.find((r) => r.id === orphan.id)?.deletedAt).toBeGreaterThan(0);
      expect(rows.find((r) => r.id === kept.id)?.deletedAt).toBeNull();
      expect(sweepOrphanUploads(ctx.db, ctx.env)).toBe(0);
    });

    test("Check again runs at once (admin only)", async () => {
      const f = seedCourse(ctx);
      ctx.db.update(schema.courseVideos).set({ kind: "upload", inputUrl: null }).where(eq(schema.courseVideos.id, f.drive)).run();
      const res = await ctx.app.inject({ method: "POST", url: `/api/admin/oyelabs/videos/${f.drive}/check`, ...as(admin) });
      expect(res.statusCode).toBe(200);
      expect(res.json().status).toBe("ok");
      expect((await ctx.app.inject({ method: "POST", url: `/api/admin/oyelabs/videos/${f.drive}/check`, ...as(learner.session) })).statusCode).toBe(403);
      expect((await ctx.app.inject({ method: "POST", url: `/api/admin/oyelabs/videos/nope/check`, ...as(admin) })).statusCode).toBe(404);
    });
  });
});
