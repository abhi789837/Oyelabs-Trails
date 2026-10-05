import fs from "node:fs";

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { schema } from "../db";
import { newId, now } from "../lib/ids";
import { getAudioRetentionDays, runAudioRetention } from "../maintenance/retention";
import { MOCK_TRANSCRIPT, type SttClient } from "../speech/stt";
import { audioFilePath, getRecording } from "../speech/store";
import { activeLearner, adminSession, as, createTestApp, type Session, type TestContext } from "../test/harness";

/** Bytes that pass the WebM sniff (EBML magic), padded with a recognisable plaintext pattern. */
function fakeWebm(size = 4096): Buffer {
  const buf = Buffer.alloc(size, 0x41);
  buf.writeUInt32BE(0x1a45dfa3, 0);
  buf.write("PLAINTEXT-VOICE-MARKER", 16, "latin1");
  return buf;
}

function multipart(fields: Record<string, string>, file?: { name?: string; mime: string; data: Buffer; filename?: string }) {
  const boundary = `----oyelearn${newId()}`;
  const chunks: Buffer[] = [];
  for (const [k, v] of Object.entries(fields)) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
  }
  if (file) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${file.name ?? "audio"}"; filename="${file.filename ?? "answer.webm"}"\r\nContent-Type: ${file.mime}\r\n\r\n`,
      ),
    );
    chunks.push(file.data, Buffer.from("\r\n"));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return { payload: Buffer.concat(chunks), headers: { "content-type": `multipart/form-data; boundary=${boundary}` } };
}

let attemptNo = 0;
function seedAssessment(ctx: TestContext, userId: string, status: "in_progress" | "submitted" = "in_progress") {
  const assessmentId = newId();
  const itemId = newId();
  ctx.db.insert(schema.assessments).values({ id: assessmentId, userId, status, attemptNo: ++attemptNo, createdAt: now() } as typeof schema.assessments.$inferInsert).run();
  ctx.db
    .insert(schema.assessmentItems)
    .values({ id: itemId, assessmentId, area: "Communication", difficulty: 2, kind: "explain", topicIds: [], payload: {}, key: {} } as typeof schema.assessmentItems.$inferInsert)
    .run();
  return { assessmentId, itemId };
}

describe("speech recordings", () => {
  let ctx: TestContext;
  let admin: Session;
  let learner: Awaited<ReturnType<typeof activeLearner>>;

  beforeEach(async () => {
    ctx = await createTestApp();
    admin = await adminSession(ctx);
    learner = await activeLearner(ctx, admin);
  });

  afterEach(async () => {
    await ctx.close();
  });

  async function upload(session: Session, fields: Record<string, string>, file = { mime: "audio/webm;codecs=opus", data: fakeWebm() }) {
    return ctx.app.inject({ method: "POST", url: "/api/recordings", ...as(session), ...multipart(fields, file) });
  }

  it("stores the upload encrypted, transcribes it with the mock, and computes metrics", async () => {
    const { assessmentId, itemId } = seedAssessment(ctx, learner.id);
    const audio = fakeWebm(300 * 1024); // larger than the 200 KB snapshot default
    const res = await upload(learner.session, { assessmentId, itemId, durationSec: "42.5" }, { mime: "audio/webm;codecs=opus", data: audio });
    expect(res.statusCode, res.body).toBe(201);
    const { recordingId } = res.json() as { recordingId: string };

    const row = getRecording(ctx.db, recordingId)!;
    expect(row).toMatchObject({ userId: learner.id, assessmentId, itemId, mime: "audio/webm", bytes: audio.length, durationSec: 42.5, sttStatus: "pending" });
    expect(row.encPath).toBe(`${learner.id}/${recordingId}.bin`);

    const onDisk = fs.readFileSync(audioFilePath(ctx.env, row.encPath));
    expect(onDisk.equals(audio)).toBe(false);
    expect(onDisk.includes(Buffer.from("PLAINTEXT-VOICE-MARKER"))).toBe(false);

    const pending = await ctx.app.inject({ method: "GET", url: `/api/recordings/${recordingId}/status`, ...as(learner.session) });
    expect(pending.json()).toEqual({ recordingId, sttStatus: "pending" });

    await ctx.drainJobs();

    const done = await ctx.app.inject({ method: "GET", url: `/api/recordings/${recordingId}/status`, ...as(learner.session) });
    expect(done.json()).toEqual({ recordingId, sttStatus: "done" });
    expect(done.json()).not.toHaveProperty("transcript");

    const view = await ctx.app.inject({ method: "GET", url: `/api/admin/recordings/${recordingId}`, ...as(admin) });
    expect(view.statusCode).toBe(200);
    const rec = view.json().recording;
    expect(rec.transcript).toBe(MOCK_TRANSCRIPT);
    expect(rec.words.length).toBe(MOCK_TRANSCRIPT.split(" ").length);
    expect(rec.metrics.pauses).toBe(1);
    expect(rec.metrics.longestPauseSec).toBeGreaterThanOrEqual(1);
    expect(rec.metrics.fillers).toBe(1);
    expect(rec.metrics.wpm).toBeGreaterThan(100);

    // Staff can download the decrypted audio; the learner cannot.
    const dl = await ctx.app.inject({ method: "GET", url: `/api/admin/recordings/${recordingId}/audio`, ...as(admin) });
    expect(dl.statusCode).toBe(200);
    expect(dl.headers["content-type"]).toContain("audio/webm");
    expect(dl.rawPayload.equals(audio)).toBe(true);

    const learnerDl = await ctx.app.inject({ method: "GET", url: `/api/admin/recordings/${recordingId}/audio`, ...as(learner.session) });
    expect(learnerDl.statusCode).toBe(403);
    const learnerView = await ctx.app.inject({ method: "GET", url: `/api/admin/recordings/${recordingId}`, ...as(learner.session) });
    expect(learnerView.statusCode).toBe(403);
  });

  it("accepts a topic practice recording", async () => {
    const topicId = ctx.content.orderedTopicIds[0]!;
    const res = await upload(learner.session, { topicId });
    expect(res.statusCode, res.body).toBe(201);
    expect(getRecording(ctx.db, res.json().recordingId)!.topicId).toBe(topicId);

    const unknown = await upload(learner.session, { topicId: "no-such-topic" });
    expect(unknown.statusCode).toBe(404);
  });

  it("refuses someone else's assessment, a closed assessment and a foreign item", async () => {
    const other = await activeLearner(ctx, admin, "learner.two");
    const { assessmentId, itemId } = seedAssessment(ctx, other.id);
    expect((await upload(learner.session, { assessmentId, itemId })).statusCode).toBe(404);

    const closed = seedAssessment(ctx, learner.id, "submitted");
    expect((await upload(learner.session, closed)).statusCode).toBe(409);

    const mine = seedAssessment(ctx, learner.id);
    expect((await upload(learner.session, { assessmentId: mine.assessmentId, itemId })).statusCode).toBe(404);

    expect((await upload(learner.session, {})).statusCode).toBe(400);
    expect(ctx.db.select().from(schema.audioRecordings).all()).toHaveLength(0);
  });

  it("hides another learner's recording status", async () => {
    const { assessmentId, itemId } = seedAssessment(ctx, learner.id);
    const { recordingId } = (await upload(learner.session, { assessmentId, itemId })).json();
    const other = await activeLearner(ctx, admin, "learner.two");
    const res = await ctx.app.inject({ method: "GET", url: `/api/recordings/${recordingId}/status`, ...as(other.session) });
    expect(res.statusCode).toBe(404);
  });

  it("rejects a wrong mime type, a disguised file, a missing file and an oversize file", async () => {
    const { assessmentId, itemId } = seedAssessment(ctx, learner.id);
    const fields = { assessmentId, itemId };
    expect((await upload(learner.session, fields, { mime: "video/webm", data: fakeWebm() })).statusCode).toBe(415);
    expect((await upload(learner.session, fields, { mime: "audio/ogg", data: fakeWebm() })).statusCode).toBe(415);
    const noFile = await ctx.app.inject({ method: "POST", url: "/api/recordings", ...as(learner.session), ...multipart(fields) });
    expect(noFile.statusCode).toBe(400);
    const big = await upload(learner.session, fields, { mime: "audio/webm", data: fakeWebm(6 * 1024 * 1024 + 10) });
    expect([413]).toContain(big.statusCode);
    expect(ctx.db.select().from(schema.audioRecordings).all()).toHaveLength(0);
  });

  it("requires a signed-in learner", async () => {
    const res = await ctx.app.inject({ method: "POST", url: "/api/recordings", ...multipart({ topicId: "x" }, { mime: "audio/webm", data: fakeWebm() }) });
    expect(res.statusCode).toBe(401);
  });

  it("marks a failed transcription without losing the recording", async () => {
    const failing: SttClient = {
      transcribe: async () => {
        throw new Error("boom");
      },
    };
    const local = await createTestApp({}, { stt: failing });
    try {
      const a = await adminSession(local);
      const l = await activeLearner(local, a);
      const topicId = local.content.orderedTopicIds[0]!;
      const res = await local.app.inject({ method: "POST", url: "/api/recordings", ...as(l.session), ...multipart({ topicId }, { mime: "audio/webm", data: fakeWebm() }) });
      const { recordingId } = res.json();
      // Retries with backoff; force each retry to be due now.
      for (let i = 0; i < 3; i += 1) {
        local.db.update(schema.jobs).set({ runAfter: 0 }).run();
        await local.drainJobs();
      }
      const row = getRecording(local.db, recordingId)!;
      expect(row.sttStatus).toBe("failed");
      expect(row.sttError).toContain("boom");
    } finally {
      await local.close();
    }
  });

  it("deletes audio after the retention period and keeps the transcript", async () => {
    const { assessmentId, itemId } = seedAssessment(ctx, learner.id);
    const { recordingId } = (await upload(learner.session, { assessmentId, itemId })).json();
    await ctx.drainJobs();

    expect(getAudioRetentionDays(ctx.db)).toBe(30);
    const put = await ctx.app.inject({ method: "PUT", url: "/api/admin/settings/audio-retention", ...as(admin), payload: { days: 7 } });
    expect(put.statusCode).toBe(200);
    expect(put.json().days).toBe(7);
    expect(put.json().summary).toMatch(/7 days/);
    expect((await ctx.app.inject({ method: "GET", url: "/api/admin/settings/audio-retention", ...as(admin) })).json().days).toBe(7);
    expect((await ctx.app.inject({ method: "PUT", url: "/api/admin/settings/audio-retention", ...as(admin), payload: { days: 0 } })).statusCode).toBe(400);
    expect((await ctx.app.inject({ method: "GET", url: "/api/admin/settings/audio-retention", ...as(learner.session) })).statusCode).toBe(403);

    const file = audioFilePath(ctx.env, getRecording(ctx.db, recordingId)!.encPath);
    // Six days old: kept.
    ctx.db.update(schema.audioRecordings).set({ createdAt: now() - 6 * 86_400_000 }).where(eq(schema.audioRecordings.id, recordingId)).run();
    expect(runAudioRetention(ctx.db, ctx.env).rowsMarked).toBe(0);
    expect(fs.existsSync(file)).toBe(true);

    // Eight days old: the file goes, the transcript stays.
    ctx.db.update(schema.audioRecordings).set({ createdAt: now() - 8 * 86_400_000 }).where(eq(schema.audioRecordings.id, recordingId)).run();
    const result = runAudioRetention(ctx.db, ctx.env);
    expect(result).toMatchObject({ filesDeleted: 1, rowsMarked: 1, errors: [] });
    expect(fs.existsSync(file)).toBe(false);

    const row = getRecording(ctx.db, recordingId)!;
    expect(row.audioDeletedAt).not.toBeNull();
    expect(row.transcript).toBe(MOCK_TRANSCRIPT);

    const dl = await ctx.app.inject({ method: "GET", url: `/api/admin/recordings/${recordingId}/audio`, ...as(admin) });
    expect(dl.statusCode).toBe(410);
    const view = await ctx.app.inject({ method: "GET", url: `/api/admin/recordings/${recordingId}`, ...as(admin) });
    expect(view.json().recording).toMatchObject({ audioAvailable: false, transcript: MOCK_TRANSCRIPT });

    // A second run has nothing left to do.
    expect(runAudioRetention(ctx.db, ctx.env).rowsMarked).toBe(0);
  });
});
