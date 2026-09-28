import { describe, expect, test } from "vitest";

import type { WrittenTopic } from "../../../shared/builder";
import type { VerifiedSource } from "./research";
import { citationsSufficient, enforceCitations, sameUrl } from "./citations";

/**
 * The citation check.
 *
 * This is the guarantee the whole feature rests on: the write prompt *tells* the model not to invent
 * URLs, and this *proves* it did not. The failure being guarded against is silent — an invented URL
 * looks exactly like a real one until a learner clicks it weeks later — so these tests are written
 * around the ways a plausible fake could slip through.
 */

const source = (url: string): VerifiedSource => ({
  url,
  title: "A real page",
  snippet: "",
  httpStatus: 200,
  publishedAt: null,
});

const topic = (references: { url: string }[], videoId: string | null = null): WrittenTopic => ({
  summary: "x".repeat(100),
  keyConcepts: ["a", "b"],
  references: references.map((reference) => ({ url: reference.url, label: "Label here", why: "Worth reading." })),
  videoId,
  practice: { task: "x".repeat(30), acceptanceCriteria: ["It works"], hint: "" },
  test: {
    questions: Array.from({ length: 10 }, (_, index) => ({
      id: `q${index}`,
      kind: "mcq" as const,
      prompt: "A question long enough",
      options: ["a", "b"],
      correctIndices: [0],
      explanation: "Because of this.",
      objective: "",
    })),
    passScore: 80,
  },
});

describe("sameUrl", () => {
  test("ignores the differences a model actually introduces", () => {
    expect(sameUrl("https://docs.cpanel.net/kb/", "https://docs.cpanel.net/kb")).toBe(true);
    expect(sameUrl("https://www.laravel.com/docs", "https://laravel.com/docs")).toBe(true);
    expect(sameUrl("https://laravel.com/docs?ref=x", "https://laravel.com/docs")).toBe(true);
    expect(sameUrl("https://laravel.com/Docs", "https://laravel.com/docs")).toBe(true);
  });

  test("does not treat a different page on the same host as the same page", () => {
    // The failure mode that matters: an invented deep link on a host that really exists.
    expect(sameUrl("https://docs.cpanel.net/real-page", "https://docs.cpanel.net/invented-page")).toBe(false);
  });

  test("a malformed URL matches nothing, including another malformed one", () => {
    expect(sameUrl("not a url", "not a url")).toBe(false);
  });
});

describe("enforceCitations", () => {
  const verified = [source("https://docs.cpanel.net/real-page"), source("https://laravel.com/docs/deployment")];

  test("passes a lesson that cited only what it was given", () => {
    const result = enforceCitations(
      topic([{ url: "https://docs.cpanel.net/real-page" }, { url: "https://laravel.com/docs/deployment" }]),
      verified,
      null,
    );
    expect(result.ok).toBe(true);
    expect(result.invented).toEqual([]);
    expect(result.cleaned.references).toHaveLength(2);
  });

  test("drops an invented URL and names it", () => {
    const result = enforceCitations(
      topic([{ url: "https://docs.cpanel.net/real-page" }, { url: "https://docs.cpanel.net/made-up" }]),
      verified,
      null,
    );
    expect(result.ok).toBe(false);
    expect(result.invented).toEqual(["https://docs.cpanel.net/made-up"]);
    expect(result.cleaned.references.map((reference) => reference.url)).toEqual(["https://docs.cpanel.net/real-page"]);
  });

  test("stores the URL that was actually fetched, not the model's spelling of it", () => {
    // `course_sources` re-checks these weekly, so the stored string has to be the one that resolved.
    const result = enforceCitations(topic([{ url: "https://www.docs.cpanel.net/real-page/" }]), verified, null);
    expect(result.cleaned.references[0].url).toBe("https://docs.cpanel.net/real-page");
  });

  test("a video id that was not the one handed over is dropped", () => {
    const result = enforceCitations(topic([{ url: verified[0].url }], "invented123"), verified, "dQw4w9WgXcQ");
    expect(result.ok).toBe(false);
    expect(result.invented).toContain("video:invented123");
    expect(result.cleaned.videoId).toBeNull();
  });

  test("the verified video id survives", () => {
    const result = enforceCitations(topic([{ url: verified[0].url }], "dQw4w9WgXcQ"), verified, "dQw4w9WgXcQ");
    expect(result.ok).toBe(true);
    expect(result.cleaned.videoId).toBe("dQw4w9WgXcQ");
  });

  test("no video is not an invented video", () => {
    const result = enforceCitations(topic([{ url: verified[0].url }], null), verified, "dQw4w9WgXcQ");
    expect(result.ok).toBe(true);
    expect(result.cleaned.videoId).toBeNull();
  });

  test("an empty verified list rejects every citation rather than trusting any", () => {
    const result = enforceCitations(topic([{ url: "https://anything.example.com" }]), [], null);
    expect(result.ok).toBe(false);
    expect(result.cleaned.references).toEqual([]);
  });
});

describe("citationsSufficient", () => {
  test("two surviving references is enough to keep a lesson", () => {
    expect(citationsSufficient(topic([{ url: "a" }, { url: "b" }]))).toBe(true);
  });

  test("one is not", () => {
    expect(citationsSufficient(topic([{ url: "a" }]))).toBe(false);
  });
});
