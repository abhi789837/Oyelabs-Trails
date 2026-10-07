import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Transform, type Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import { and, eq, isNull } from "drizzle-orm";

import {
  DOC_UPLOAD_MAX_BYTES,
  DOC_UPLOAD_TYPES,
  VIDEO_PLAYABLE_MIMES,
  VIDEO_UPLOAD_EXTENSIONS,
  VIDEO_UPLOAD_MAX_BYTES,
  type UploadKind,
  type UploadView,
} from "../../../../shared/oyelabsCourses";
import { schema, type Db } from "../../db";
import type { Env } from "../../env";
import { newId, now } from "../../lib/ids";

/**
 * v4.5 upload storage (builder B owns this file). Everything lives on the `/data` volume, next to
 * the database, so backups of the volume include it and nothing new needs mounting:
 *
 *   DATA_DIR/uploads/<yyyy>/<mm>/<id>.<ext>            the original
 *   DATA_DIR/uploads/<yyyy>/<mm>/<id>.play.mp4         the transcoded copy, when one was needed
 *   DATA_DIR/uploads/tmp/                              in-flight uploads (renamed into place when complete)
 *
 * `media_uploads.rel_path` is relative to `uploadsDir(env)`; always resolve it with `uploadPath`,
 * which refuses anything that would escape the directory.
 */
export function uploadsDir(env: Pick<Env, "dataDir">): string {
  return path.join(env.dataDir, "uploads");
}

export function uploadPath(env: Pick<Env, "dataDir">, relPath: string): string {
  const root = uploadsDir(env);
  const full = path.resolve(root, relPath);
  if (full !== root && !full.startsWith(root + path.sep)) throw new Error("Upload path escapes the uploads directory.");
  return full;
}

// ---------------------------------------------------------------------------
// What a file is (extension and magic bytes)
// ---------------------------------------------------------------------------

export const VIDEO_MIMES: Record<(typeof VIDEO_UPLOAD_EXTENSIONS)[number], string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
  avi: "video/x-msvideo",
};

type Magic = "pdf" | "zip" | "isobmff" | "ebml" | "riff_avi" | "text";

/** What the first bytes say the file is. Null when they match nothing we accept. */
export function sniffMagic(head: Buffer): Magic | null {
  if (head.length >= 4 && head.subarray(0, 4).toString("latin1") === "%PDF") return "pdf";
  if (head.length >= 4 && head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04) return "zip";
  if (head.length >= 8 && head.subarray(4, 8).toString("latin1") === "ftyp") return "isobmff";
  if (head.length >= 4 && head.readUInt32BE(0) === 0x1a45dfa3) return "ebml";
  if (head.length >= 12 && head.subarray(0, 4).toString("latin1") === "RIFF" && head.subarray(8, 12).toString("latin1") === "AVI ") return "riff_avi";
  // Plain text: no NUL bytes, and the start decodes as UTF-8 (a cut multi-byte character at the end is fine).
  if (head.length > 0 && !head.includes(0)) {
    const text = new TextDecoder("utf-8", { fatal: false }).decode(head.subarray(0, Math.max(0, head.length - 4)));
    if (!text.includes("�")) return "text";
  }
  return null;
}

const EXPECTED_MAGIC: Record<string, Magic> = {
  pdf: "pdf",
  docx: "zip",
  pptx: "zip",
  xlsx: "zip",
  txt: "text",
  md: "text",
  mp4: "isobmff",
  m4v: "isobmff",
  mov: "isobmff",
  webm: "ebml",
  mkv: "ebml",
  avi: "riff_avi",
};

/** The lower-case extension of an upload's name, when it is one this kind accepts. */
export function acceptedExtension(kind: UploadKind, filename: string): string | null {
  const ext = path.extname(filename).slice(1).toLowerCase();
  const allowed: readonly string[] = kind === "doc" ? Object.keys(DOC_UPLOAD_TYPES) : VIDEO_UPLOAD_EXTENSIONS;
  return allowed.includes(ext) ? ext : null;
}

export function mimeFor(kind: UploadKind, ext: string): string {
  return kind === "doc" ? DOC_UPLOAD_TYPES[ext as keyof typeof DOC_UPLOAD_TYPES] : VIDEO_MIMES[ext as keyof typeof VIDEO_MIMES];
}

export function maxBytesFor(kind: UploadKind): number {
  return kind === "doc" ? DOC_UPLOAD_MAX_BYTES : VIDEO_UPLOAD_MAX_BYTES;
}

/** A display name with no directories and nothing odd in it ("../../x.pdf" → "x.pdf"). */
export function safeDisplayName(filename: string): string {
  const name = path.basename(filename.replace(/\\/g, "/")).replace(/[\u0000-\u001f"<>|*?:]/g, "").trim();
  return (name || "file").slice(0, 200);
}

// ---------------------------------------------------------------------------
// Saving
// ---------------------------------------------------------------------------

export class UploadRejected extends Error {
  constructor(
    readonly statusCode: 413 | 415 | 400,
    message: string,
  ) {
    super(message);
    this.name = "UploadRejected";
  }
}

export type UploadRow = typeof schema.mediaUploads.$inferSelect;

export function uploadView(row: UploadRow): UploadView {
  return {
    id: row.id,
    kind: row.kind,
    name: row.originalName,
    mime: row.mime,
    bytes: row.bytes,
    transcode: row.transcodeStatus,
    durationSeconds: row.durationSeconds ?? null,
    createdAt: row.createdAt,
  };
}

/** Browsers play these as they are. */
export function isPlayableMime(mime: string): boolean {
  return (VIDEO_PLAYABLE_MIMES as readonly string[]).includes(mime);
}

export interface SaveUploadInput {
  kind: UploadKind;
  filename: string;
  stream: Readable & { truncated?: boolean };
  userId: string | null;
}

export interface SaveUploadResult {
  upload: UploadRow;
  /** True when an identical file was already stored and is reused. */
  reused: boolean;
}

/**
 * Streams one upload to disk while hashing it: never held in memory. Rejects a wrong extension
 * (415), first bytes that don't match the extension (415), and a file over the kind's limit (413,
 * from the multipart limit: the stream ends `truncated`). An identical file (same sha256 and kind)
 * reuses the stored one. Written to `uploads/tmp/` first and renamed into place when complete, so a
 * half-written file is never visible.
 */
export async function saveUpload(env: Pick<Env, "dataDir">, db: Db, input: SaveUploadInput): Promise<SaveUploadResult> {
  const name = safeDisplayName(input.filename);
  const ext = acceptedExtension(input.kind, name);
  if (!ext) {
    input.stream.resume();
    throw new UploadRejected(
      415,
      input.kind === "doc" ? "That file type isn't supported. Upload a PDF, Word, PowerPoint, Excel, text or Markdown file." : "That video type isn't supported. Upload an MP4, WebM, MOV, M4V, MKV or AVI file.",
    );
  }
  const root = uploadsDir(env);
  const tmpDir = path.join(root, "tmp");
  fs.mkdirSync(tmpDir, { recursive: true });
  const id = newId();
  const tmpPath = path.join(tmpDir, `${id}.part`);

  const hash = crypto.createHash("sha256");
  let bytes = 0;
  let head = Buffer.alloc(0);
  const meter = new Transform({
    transform(chunk: Buffer, _enc, done) {
      hash.update(chunk);
      bytes += chunk.length;
      if (head.length < 4096) head = Buffer.concat([head, chunk.subarray(0, 4096 - head.length)]);
      done(null, chunk);
    },
  });
  try {
    await pipeline(input.stream, meter, fs.createWriteStream(tmpPath));
  } catch (error) {
    fs.rmSync(tmpPath, { force: true });
    if (input.stream.truncated) throw new UploadRejected(413, tooLargeMessage(input.kind));
    throw error;
  }
  const discard = () => fs.rmSync(tmpPath, { force: true });
  if (input.stream.truncated || bytes > maxBytesFor(input.kind)) {
    discard();
    throw new UploadRejected(413, tooLargeMessage(input.kind));
  }
  if (bytes === 0) {
    discard();
    throw new UploadRejected(400, "That file is empty.");
  }
  if (sniffMagic(head) !== EXPECTED_MAGIC[ext]) {
    discard();
    throw new UploadRejected(415, `That file doesn't look like a real .${ext} file. Save it again from the app that made it, then upload it.`);
  }

  const sha256 = hash.digest("hex");
  const existing = db
    .select()
    .from(schema.mediaUploads)
    .where(and(eq(schema.mediaUploads.sha256, sha256), eq(schema.mediaUploads.kind, input.kind), isNull(schema.mediaUploads.deletedAt)))
    .get();
  if (existing && fs.existsSync(uploadPath(env, existing.relPath))) {
    discard();
    return { upload: existing, reused: true };
  }

  const at = now();
  const date = new Date(at);
  const relPath = path.posix.join(String(date.getUTCFullYear()), String(date.getUTCMonth() + 1).padStart(2, "0"), `${id}.${ext}`);
  const finalPath = uploadPath(env, relPath);
  fs.mkdirSync(path.dirname(finalPath), { recursive: true });
  fs.renameSync(tmpPath, finalPath);

  const mime = mimeFor(input.kind, ext);
  const row: UploadRow = {
    id,
    kind: input.kind,
    relPath,
    originalName: name,
    mime,
    bytes,
    sha256,
    // A video browsers can't play is converted by the transcode job; one they can play is still
    // probed (length, codec), and converted only if its codec turns out unplayable.
    transcodeStatus: input.kind === "video" && !isPlayableMime(mime) ? "pending" : "none",
    playbackRelPath: null,
    playbackMime: null,
    durationSeconds: null,
    error: null,
    createdBy: input.userId,
    createdAt: at,
    deletedAt: null,
  };
  db.insert(schema.mediaUploads).values(row).run();
  return { upload: row, reused: false };
}

function tooLargeMessage(kind: UploadKind): string {
  return kind === "doc"
    ? "That file is over 50 MB. Make it smaller, or split it into parts."
    : "That video is over 1 GB. Export it at a lower quality, or put it on Drive or YouTube and paste the link.";
}

/** The file to stream for an upload: the converted copy when there is one, else the original. */
export function playbackFile(env: Pick<Env, "dataDir">, row: UploadRow): { file: string; mime: string } {
  if (row.transcodeStatus === "done" && row.playbackRelPath) return { file: uploadPath(env, row.playbackRelPath), mime: row.playbackMime ?? "video/mp4" };
  return { file: uploadPath(env, row.relPath), mime: row.mime };
}

/** Whether an uploaded video can be played right now, and why not. */
export function uploadPlayable(row: UploadRow | undefined): { ok: true } | { ok: false; reason: string } {
  if (!row || row.deletedAt) return { ok: false, reason: "This video was removed." };
  if (row.kind !== "video") return { ok: false, reason: "This file isn't a video." };
  if (row.transcodeStatus === "done" && row.playbackRelPath) return { ok: true };
  // MP4/WebM play as uploaded while a conversion runs (or if one failed: most still play).
  if (isPlayableMime(row.mime)) return { ok: true };
  if (row.transcodeStatus === "failed") return { ok: false, reason: "This video couldn't be converted to play in the browser." };
  return { ok: false, reason: "This video is still being prepared. Check back in a few minutes." };
}
