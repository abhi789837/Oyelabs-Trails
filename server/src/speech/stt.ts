import type { Env } from "../env";
import type { TimedWord } from "./metrics";

/**
 * v4.4: the speech-to-text client.
 *
 * OpenAI-shaped on purpose (`POST {STT_BASE_URL}/v1/audio/transcriptions`, multipart `file`,
 * `response_format=verbose_json`), so the self-hosted whisper.cpp server can be swapped for
 * speaches or a hosted API by changing one env var. whisper.cpp puts word timings inside each
 * segment; OpenAI puts them at the top level; both are read.
 *
 * Unset STT_BASE_URL: development and tests get a deterministic mock so the whole flow runs on a
 * fresh clone; production reports "unavailable" rather than inventing a transcript.
 */

export type SttResult =
  | { status: "done"; transcript: string; words: TimedWord[]; durationSec: number | null }
  | { status: "unavailable"; reason: string };

export interface SttClient {
  transcribe(audio: Buffer, mime: string): Promise<SttResult>;
}

export class SttError extends Error {
  constructor(message: string, readonly retryable: boolean) {
    super(message);
    this.name = "SttError";
  }
}

/** Nudges Whisper to keep disfluencies it would otherwise normalise away (research §D). */
const FILLER_PROMPT = "Umm, let me think like, hmm... Okay, here's what I'm, like, thinking.";

const EXTENSIONS: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
};

export function createSttClient(env: Env, fetchImpl: typeof fetch = fetch): SttClient {
  if (env.sttBaseUrl) return new HttpSttClient(env.sttBaseUrl, env.sttTimeoutMs, fetchImpl);
  if (env.isProduction) return { transcribe: async () => ({ status: "unavailable", reason: "Speech-to-text is not set up (STT_BASE_URL is empty)." }) };
  return new MockSttClient();
}

export class HttpSttClient implements SttClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async transcribe(audio: Buffer, mime: string): Promise<SttResult> {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(audio)], { type: mime }), `answer.${EXTENSIONS[mime] ?? "bin"}`);
    form.append("model", "whisper-1");
    form.append("response_format", "verbose_json");
    form.append("timestamp_granularities[]", "word");
    form.append("temperature", "0.0");
    form.append("language", "en");
    form.append("prompt", FILLER_PROMPT);

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}/v1/audio/transcriptions`, {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
      throw new SttError(timedOut ? `Speech-to-text timed out after ${Math.round(this.timeoutMs / 1000)} s.` : `Speech-to-text could not be reached: ${error instanceof Error ? error.message : String(error)}`, true);
    }

    const text = await response.text();
    if (!response.ok) {
      // 4xx is about this file (unreadable audio); 5xx and 429 may pass on a retry.
      const retryable = response.status >= 500 || response.status === 429;
      throw new SttError(`Speech-to-text returned ${response.status}: ${text.slice(0, 300)}`, retryable);
    }

    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      throw new SttError("Speech-to-text returned something that is not JSON.", false);
    }
    return { status: "done", ...parseVerboseJson(body) };
  }
}

interface RawWord {
  word?: unknown;
  start?: unknown;
  end?: unknown;
}

/** Maps a verbose_json body (whisper.cpp or OpenAI) to `{ transcript, words }`. */
export function parseVerboseJson(body: unknown): { transcript: string; words: TimedWord[]; durationSec: number | null } {
  if (!body || typeof body !== "object") throw new SttError("Speech-to-text returned an empty response.", false);
  const b = body as { text?: unknown; words?: unknown; segments?: unknown; duration?: unknown; error?: unknown };
  if (b.error) throw new SttError(`Speech-to-text failed: ${typeof b.error === "string" ? b.error : JSON.stringify(b.error).slice(0, 300)}`, false);

  const rawWords: RawWord[] = Array.isArray(b.words)
    ? (b.words as RawWord[])
    : Array.isArray(b.segments)
      ? (b.segments as { words?: unknown }[]).flatMap((s) => (Array.isArray(s?.words) ? (s.words as RawWord[]) : []))
      : [];

  const words: TimedWord[] = [];
  for (const raw of rawWords) {
    if (typeof raw?.word !== "string") continue;
    const w = raw.word.trim();
    const start = Number(raw.start);
    const end = Number(raw.end);
    // whisper.cpp emits special tokens like "[_BEG_]" and bare punctuation as words.
    if (!w || /^\[_.*_\]$/.test(w) || !/[\p{L}\p{N}]/u.test(w)) continue;
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    words.push({ w, start: round2(start), end: round2(Math.max(start, end)) });
  }

  const transcript = typeof b.text === "string" ? b.text.trim().replace(/\s+/g, " ") : words.map((x) => x.w).join(" ");
  const durationSec = typeof b.duration === "number" && Number.isFinite(b.duration) ? b.duration : null;
  return { transcript, words, durationSec };
}

/** Deterministic, offline. Always the same sentence and timings, so tests can assert on them. */
export const MOCK_TRANSCRIPT = "Um, so the release moves by one week because we found a payment bug, and the fix is already in review.";

export class MockSttClient implements SttClient {
  async transcribe(): Promise<SttResult> {
    const words: TimedWord[] = [];
    let t = 0.5;
    for (const [i, w] of MOCK_TRANSCRIPT.split(" ").entries()) {
      // A 1.2 s pause after "week" (the 6th word), so the pause metric has something to find.
      if (i === 6) t += 1.2;
      words.push({ w, start: round2(t), end: round2(t + 0.3) });
      t += 0.4;
    }
    return { status: "done", transcript: MOCK_TRANSCRIPT, words, durationSec: round2(t + 0.5) };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
