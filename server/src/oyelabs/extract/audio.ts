import { spawn } from "node:child_process";

/**
 * Audio for Whisper (PLAN §4.3): ffmpeg reads the video (a local upload or a public URL already
 * checked by the SSRF guard) and writes mono 16 kHz Opus for one 10-minute window. One window per
 * job run keeps the single worker free between chunks (the queue runs one job at a time).
 *
 * ffmpeg is a separate process (no linking). When it isn't installed, the chunker throws
 * `AudioUnavailableError` and the video is recorded as "not used for questions".
 */

export const TRANSCRIBE_CHUNK_SEC = 600;
const FFMPEG_TIMEOUT_MS = 5 * 60 * 1000;

export class AudioUnavailableError extends Error {
  constructor(message = "Video conversion isn't available on this server (ffmpeg is missing).") {
    super(message);
    this.name = "AudioUnavailableError";
  }
}

export interface AudioChunker {
  /** Opus audio for [startSec, startSec + lengthSec). An empty buffer means the video has ended. */
  chunk(input: string, startSec: number, lengthSec: number): Promise<Buffer>;
}

export function ffmpegChunker(binary = "ffmpeg"): AudioChunker {
  return {
    chunk: (input, startSec, lengthSec) =>
      new Promise<Buffer>((resolve, reject) => {
        const args = ["-nostdin", "-v", "error", "-ss", String(startSec), "-t", String(lengthSec), "-i", input, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "libopus", "-b:a", "24k", "-f", "ogg", "pipe:1"];
        let child;
        try {
          child = spawn(binary, args, { stdio: ["ignore", "pipe", "pipe"] });
        } catch {
          reject(new AudioUnavailableError());
          return;
        }
        const out: Buffer[] = [];
        let err = "";
        const timer = setTimeout(() => child.kill("SIGKILL"), FFMPEG_TIMEOUT_MS);
        child.stdout.on("data", (d: Buffer) => out.push(d));
        child.stderr.on("data", (d: Buffer) => {
          if (err.length < 2000) err += d.toString();
        });
        child.on("error", (e: NodeJS.ErrnoException) => {
          clearTimeout(timer);
          reject(e.code === "ENOENT" ? new AudioUnavailableError() : e);
        });
        child.on("close", (code) => {
          clearTimeout(timer);
          if (code === 0) resolve(Buffer.concat(out));
          else reject(new Error(`ffmpeg could not read the video's sound (${code}): ${err.trim().slice(0, 300)}`));
        });
      }),
  };
}

/** Under this many bytes an Opus chunk is only container headers: the window was past the end. */
export const EMPTY_AUDIO_BYTES = 1024;
