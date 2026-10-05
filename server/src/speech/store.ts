import fs from "node:fs";
import path from "node:path";

import { eq } from "drizzle-orm";

import { openBuffer, sealBuffer } from "../crypto/secretBox";
import { schema, type Db } from "../db";
import type { Env } from "../env";
import { newId, now } from "../lib/ids";

/**
 * v4.4: Speak recordings at rest.
 *
 * A recording is a person's voice, so it is never written in the clear: each file is one
 * AES-256-GCM blob (`sealBuffer`, the master key) under `DATA_DIR/audio/<userId>/<id>.bin`, and
 * the only route that decrypts it is staff-only. The row keeps the path relative to the audio
 * directory, so moving DATA_DIR does not invalidate rows.
 */

export type AudioRecording = typeof schema.audioRecordings.$inferSelect;

/** Base mime types accepted from the browser. Codec parameters ("audio/webm;codecs=opus") are stripped first. */
export const AUDIO_MIMES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav"] as const;
export type AudioMime = (typeof AUDIO_MIMES)[number];

export const MAX_AUDIO_BYTES = 6 * 1024 * 1024;

export function baseMime(raw: string | undefined | null): string {
  return (raw ?? "").split(";")[0]!.trim().toLowerCase();
}

export function isAllowedMime(mime: string): mime is AudioMime {
  return (AUDIO_MIMES as readonly string[]).includes(mime);
}

/**
 * A cheap check that the bytes are the container they claim to be, so a renamed file of
 * something else is refused before it is stored or handed to ffmpeg. Not a full parse.
 */
export function looksLike(mime: AudioMime, buf: Buffer): boolean {
  if (buf.length < 12) return false;
  switch (mime) {
    case "audio/webm":
      return buf.readUInt32BE(0) === 0x1a45dfa3; // EBML
    case "audio/ogg":
      return buf.subarray(0, 4).toString("latin1") === "OggS";
    case "audio/wav":
      return buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WAVE";
    case "audio/mp4":
      return buf.subarray(4, 8).toString("latin1") === "ftyp";
    case "audio/mpeg":
      return buf.subarray(0, 3).toString("latin1") === "ID3" || (buf[0] === 0xff && (buf[1]! & 0xe0) === 0xe0);
  }
}

/** Resolves a stored relative path and refuses anything that would leave the audio directory. */
export function audioFilePath(env: Env, encPath: string): string {
  const root = path.resolve(env.audioDir);
  const full = path.resolve(root, encPath);
  if (!full.startsWith(root + path.sep)) throw new Error(`Refused an audio path outside the audio directory: ${encPath}`);
  return full;
}

export interface SaveRecordingInput {
  userId: string;
  assessmentId?: string | null;
  itemId?: string | null;
  topicId?: string | null;
  mime: AudioMime;
  audio: Buffer;
  durationSec?: number | null;
}

export async function saveRecording(db: Db, env: Env, input: SaveRecordingInput): Promise<AudioRecording> {
  const id = newId();
  const encPath = path.posix.join(input.userId, `${id}.bin`);
  const full = audioFilePath(env, encPath);
  await fs.promises.mkdir(path.dirname(full), { recursive: true });
  await fs.promises.writeFile(full, sealBuffer(input.audio, env.masterKey), { mode: 0o600 });

  const row = {
    id,
    userId: input.userId,
    assessmentId: input.assessmentId ?? null,
    itemId: input.itemId ?? null,
    topicId: input.topicId ?? null,
    mime: input.mime,
    bytes: input.audio.length,
    durationSec: input.durationSec ?? null,
    encPath,
    sttStatus: "pending" as const,
    createdAt: now(),
  };
  try {
    db.insert(schema.audioRecordings).values(row).run();
  } catch (error) {
    // No row, no file: an orphaned ciphertext would never be cleaned up by retention.
    await fs.promises.rm(full, { force: true });
    throw error;
  }
  return getRecording(db, id)!;
}

export function getRecording(db: Db, id: string): AudioRecording | null {
  return db.select().from(schema.audioRecordings).where(eq(schema.audioRecordings.id, id)).get() ?? null;
}

/** The decrypted audio, or null when the file was removed by retention (or is missing). */
export async function readRecordingAudio(env: Env, recording: AudioRecording): Promise<Buffer | null> {
  if (recording.audioDeletedAt) return null;
  const full = audioFilePath(env, recording.encPath);
  let sealed: Buffer;
  try {
    sealed = await fs.promises.readFile(full);
  } catch {
    return null;
  }
  return openBuffer(sealed, env.masterKey);
}

/** Deletes the audio file and marks the row; the transcript and metrics stay. */
export function deleteRecordingAudio(db: Db, env: Env, recording: AudioRecording): boolean {
  const full = audioFilePath(env, recording.encPath);
  const existed = fs.existsSync(full);
  if (existed) fs.unlinkSync(full);
  db.update(schema.audioRecordings).set({ audioDeletedAt: now() }).where(eq(schema.audioRecordings.id, recording.id)).run();
  return existed;
}
