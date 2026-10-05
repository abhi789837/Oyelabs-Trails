import { describe, expect, it } from "vitest";

import { loadEnv } from "../env";
import { createSttClient, HttpSttClient, MockSttClient, parseVerboseJson, SttError } from "./stt";

/** Trimmed from a real whisper.cpp `verbose_json` response (docs/v4.4/research/whisper-benchmark.md). */
const WHISPER_CPP = {
  task: "transcribe",
  language: "english",
  duration: 30.36456298828125,
  text: " So, um, the main thing",
  segments: [
    {
      id: 0,
      text: " So, um, the main thing",
      start: 0,
      end: 3.36,
      words: [
        { word: " So", start: 0.13, end: 0.14, t_dtw: -1, probability: 0.97 },
        { word: ",", start: 0.14, end: 0.28, t_dtw: -1, probability: 0.93 },
        { word: " um", start: 0.28, end: 0.41000000000000003, t_dtw: -1, probability: 0.74 },
        { word: ",", start: 0.42, end: 0.45, t_dtw: -1, probability: 0.77 },
        { word: " the", start: 0.77, end: 0.77, t_dtw: -1, probability: 0.99 },
        { word: "[_BEG_]", start: 0.8, end: 0.8 },
        { word: " main", start: 0.85, end: 1.05, t_dtw: -1, probability: 0.99 },
      ],
    },
    { id: 1, text: " thing", start: 3.36, end: 4, words: [{ word: " thing", start: 3.4, end: 3.6 }] },
  ],
};

describe("parseVerboseJson", () => {
  it("reads whisper.cpp segment words, dropping punctuation and special tokens", () => {
    const parsed = parseVerboseJson(WHISPER_CPP);
    expect(parsed.transcript).toBe("So, um, the main thing");
    expect(parsed.durationSec).toBeCloseTo(30.36, 1);
    expect(parsed.words).toEqual([
      { w: "So", start: 0.13, end: 0.14 },
      { w: "um", start: 0.28, end: 0.41 },
      { w: "the", start: 0.77, end: 0.77 },
      { w: "main", start: 0.85, end: 1.05 },
      { w: "thing", start: 3.4, end: 3.6 },
    ]);
  });

  it("reads OpenAI's top-level words", () => {
    const parsed = parseVerboseJson({ text: "Hello there", words: [{ word: "Hello", start: 0, end: 0.4 }, { word: "there", start: 0.5, end: 0.9 }] });
    expect(parsed.words).toHaveLength(2);
    expect(parsed.durationSec).toBeNull();
  });

  it("builds a transcript from words when there is no text, and tolerates no words at all", () => {
    expect(parseVerboseJson({ words: [{ word: "Hi", start: 0, end: 1 }] }).transcript).toBe("Hi");
    expect(parseVerboseJson({ text: "" })).toEqual({ transcript: "", words: [], durationSec: null });
  });

  it("rejects an error body or a non-object as not retryable", () => {
    expect(() => parseVerboseJson({ error: "failed to read audio" })).toThrow(SttError);
    expect(() => parseVerboseJson(null)).toThrow(/empty/);
  });
});

describe("HttpSttClient", () => {
  it("posts an OpenAI-shaped multipart request and maps the response", async () => {
    let seen: { url: string; form: FormData } | null = null;
    const fake = (async (url: string, init: RequestInit) => {
      seen = { url, form: init.body as FormData };
      return new Response(JSON.stringify(WHISPER_CPP), { status: 200 });
    }) as unknown as typeof fetch;
    const client = new HttpSttClient("http://whisper:8080", 5000, fake);
    const result = await client.transcribe(Buffer.from("audio"), "audio/webm");
    expect(result.status).toBe("done");
    expect(seen!.url).toBe("http://whisper:8080/v1/audio/transcriptions");
    expect(seen!.form.get("response_format")).toBe("verbose_json");
    expect((seen!.form.get("file") as File).name).toBe("answer.webm");
  });

  it("marks 5xx and network errors retryable, 4xx not", async () => {
    const respond = (status: number) => (async () => new Response("nope", { status })) as unknown as typeof fetch;
    await expect(new HttpSttClient("http://x", 1000, respond(503)).transcribe(Buffer.from("a"), "audio/webm")).rejects.toMatchObject({ retryable: true });
    await expect(new HttpSttClient("http://x", 1000, respond(400)).transcribe(Buffer.from("a"), "audio/webm")).rejects.toMatchObject({ retryable: false });
    const down = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;
    await expect(new HttpSttClient("http://x", 1000, down).transcribe(Buffer.from("a"), "audio/webm")).rejects.toMatchObject({ retryable: true });
  });

  it("times out", async () => {
    const hang = ((_: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal!.addEventListener("abort", () => reject(init.signal!.reason));
      })) as unknown as typeof fetch;
    await expect(new HttpSttClient("http://x", 20, hang).transcribe(Buffer.from("a"), "audio/webm")).rejects.toThrow(/timed out/);
  });
});

describe("createSttClient", () => {
  const base = { DATA_DIR: "./data-test-stt", APP_MASTER_KEY: Buffer.alloc(32, 1).toString("base64"), SESSION_SECRET: "s" };

  it("uses the mock in development and test when STT_BASE_URL is unset", async () => {
    const client = createSttClient(loadEnv({ ...base, NODE_ENV: "test" } as NodeJS.ProcessEnv));
    expect(client).toBeInstanceOf(MockSttClient);
    const a = await client.transcribe(Buffer.from("x"), "audio/webm");
    const b = await client.transcribe(Buffer.from("y"), "audio/webm");
    expect(a).toEqual(b);
  });

  it("reports unavailable in production when STT_BASE_URL is unset", async () => {
    const client = createSttClient(loadEnv({ ...base, NODE_ENV: "production" } as NodeJS.ProcessEnv));
    expect((await client.transcribe(Buffer.from("x"), "audio/webm")).status).toBe("unavailable");
  });

  it("uses HTTP when STT_BASE_URL is set, trimming a trailing slash", () => {
    const env = loadEnv({ ...base, NODE_ENV: "production", STT_BASE_URL: "http://whisper:8080/" } as NodeJS.ProcessEnv);
    expect(env.sttBaseUrl).toBe("http://whisper:8080");
    expect(createSttClient(env)).toBeInstanceOf(HttpSttClient);
  });
});
