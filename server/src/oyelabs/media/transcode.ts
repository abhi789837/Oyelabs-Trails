import { execFile, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { eq } from "drizzle-orm";

import { schema, type Db } from "../../db";
import type { Env } from "../../env";
import { now } from "../../lib/ids";
import { moduleMinutes } from "../editor/minutes";
import { isPlayableMime, uploadPath } from "./storage";

/**
 * v4.5 Phase 2: uploaded videos. ffprobe reads the length and codecs; ffmpeg converts a video
 * browsers can't play (MOV/MKV/AVI, or an MP4 that isn't H.264) to MP4 (H.264/AAC, +faststart).
 *
 * ffmpeg is a separate process from Debian's package in the runtime image (Dockerfile), so there is
 * no linking. Without it, MP4/WebM uploads still play as they are and other formats say "Video
 * conversion isn't available" on the card instead of failing.
 */

export interface ProbeResult {
  durationSeconds: number | null;
  /** e.g. "mov,mp4,m4a,3gp,3g2,mj2", "matroska,webm". */
  format: string;
  videoCodec: string | null;
  audioCodec: string | null;
}

/** The two commands, injectable so tests run without ffmpeg (PLAN.md §8: "a fake runner"). */
export interface MediaTools {
  available: () => Promise<boolean>;
  probe: (input: string) => Promise<ProbeResult>;
  transcode: (input: string, output: string) => Promise<void>;
}

/** One conversion may take this long (a 1 GB file at veryfast is minutes, not hours). */
export const TRANSCODE_TIMEOUT_MS = 60 * 60 * 1000;
const PROBE_TIMEOUT_MS = 30_000;

let ffmpegAvailable: Promise<boolean> | null = null;

function run(bin: string, args: string[], timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(bin, args, { timeout: timeoutMs, maxBuffer: 4 * 1024 * 1024, windowsHide: true }, (error, stdout) => (error ? reject(error) : resolve(stdout)));
  });
}

export function parseProbe(stdout: string): ProbeResult {
  const data = JSON.parse(stdout) as { format?: { duration?: string; format_name?: string }; streams?: { codec_type?: string; codec_name?: string }[] };
  const duration = Number(data.format?.duration);
  const streams = data.streams ?? [];
  return {
    durationSeconds: Number.isFinite(duration) && duration > 0 ? Math.round(duration * 100) / 100 : null,
    format: data.format?.format_name ?? "",
    videoCodec: streams.find((s) => s.codec_type === "video")?.codec_name ?? null,
    audioCodec: streams.find((s) => s.codec_type === "audio")?.codec_name ?? null,
  };
}

export const systemMediaTools: MediaTools = {
  available: () => {
    ffmpegAvailable ??= run("ffmpeg", ["-version"], 10_000).then(
      () => run("ffprobe", ["-version"], 10_000).then(() => true),
    ).catch(() => false);
    return ffmpegAvailable;
  },
  probe: async (input) =>
    parseProbe(await run("ffprobe", ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", "-protocol_whitelist", "file,http,https,tcp,tls", input], PROBE_TIMEOUT_MS)),
  transcode: (input, output) =>
    new Promise((resolve, reject) => {
      const child = spawn(
        "ffmpeg",
        ["-y", "-nostdin", "-loglevel", "error", "-i", input, "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", output],
        { stdio: ["ignore", "ignore", "pipe"], windowsHide: true },
      );
      let stderr = "";
      child.stderr.on("data", (chunk: Buffer) => {
        stderr = (stderr + chunk.toString()).slice(-2000);
      });
      const timer = setTimeout(() => child.kill("SIGKILL"), TRANSCODE_TIMEOUT_MS);
      child.on("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        if (code === 0) resolve();
        else reject(new Error(stderr.trim().split("\n").pop() || `ffmpeg exited with ${code}`));
      });
    }),
};

/** Browsers play H.264/VP8/VP9/AV1 video in MP4 or WebM; anything else is converted. */
export function needsTranscode(mime: string, probe: ProbeResult): boolean {
  if (!isPlayableMime(mime)) return true;
  const codec = probe.videoCodec ?? "";
  if (mime === "video/mp4") return !["h264", "av1"].includes(codec) || !["aac", "mp3", "opus", null].includes(probe.audioCodec);
  return !["vp8", "vp9", "av1"].includes(codec);
}

/** Puts a found length on every module video that uses this upload, and refreshes the module's minutes. */
function spreadDuration(db: Db, uploadId: string, seconds: number): void {
  const rows = db.select({ id: schema.courseVideos.id, topicId: schema.courseVideos.topicId }).from(schema.courseVideos).where(eq(schema.courseVideos.uploadId, uploadId)).all();
  const at = now();
  for (const row of rows) {
    db.update(schema.courseVideos).set({ durationSeconds: seconds, durationSource: "probe", updatedAt: at }).where(eq(schema.courseVideos.id, row.id)).run();
  }
  for (const topicId of new Set(rows.map((r) => r.topicId))) moduleMinutes(db, topicId);
}

/**
 * The `oyelabs.upload.transcode` job: probe, then convert when needed. Idempotent: a finished or
 * failed upload is left alone, and a rerun after a crash starts the conversion again.
 */
export async function transcodeUpload(db: Db, env: Pick<Env, "dataDir">, uploadId: string, tools: MediaTools = systemMediaTools, log: (m: string) => void = () => undefined): Promise<void> {
  const row = db.select().from(schema.mediaUploads).where(eq(schema.mediaUploads.id, uploadId)).get();
  if (!row || row.kind !== "video" || row.deletedAt) return;
  if (row.transcodeStatus === "done" || row.transcodeStatus === "failed") return;
  const set = (values: Partial<typeof schema.mediaUploads.$inferInsert>) => db.update(schema.mediaUploads).set(values).where(eq(schema.mediaUploads.id, uploadId)).run();

  if (!(await tools.available())) {
    // MP4/WebM still play as they are; other formats can't without a conversion.
    if (isPlayableMime(row.mime)) set({ transcodeStatus: "none" });
    else set({ transcodeStatus: "failed", error: "Video conversion isn't available on this server. Upload an MP4 or WebM instead." });
    return;
  }

  const input = uploadPath(env, row.relPath);
  let probe: ProbeResult;
  try {
    probe = await tools.probe(input);
  } catch (error) {
    set({ transcodeStatus: "failed", error: "We couldn't read this video file. It may be damaged." });
    log(`oyelabs upload ${uploadId}: probe failed: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }
  if (probe.durationSeconds) {
    set({ durationSeconds: probe.durationSeconds });
    spreadDuration(db, uploadId, probe.durationSeconds);
  }
  if (!needsTranscode(row.mime, probe)) {
    set({ transcodeStatus: "none" });
    return;
  }

  set({ transcodeStatus: "running", error: null });
  const playbackRelPath = row.relPath.replace(/\.[a-z\d]+$/i, "") + ".play.mp4";
  const output = uploadPath(env, playbackRelPath);
  const partial = `${output}.part.mp4`;
  try {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    await tools.transcode(input, partial);
    fs.renameSync(partial, output);
  } catch (error) {
    fs.rmSync(partial, { force: true });
    set({ transcodeStatus: "failed", error: "This video couldn't be converted to play in the browser. Export it as MP4 (H.264) and upload it again." });
    log(`oyelabs upload ${uploadId}: transcode failed: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }
  set({ transcodeStatus: "done", playbackRelPath, playbackMime: "video/mp4", error: null });
}
