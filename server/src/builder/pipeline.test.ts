import { describe, expect, test, vi } from "vitest";

import type { ScoredGap } from "../../../shared/builder";
import type { AiService } from "../ai/service";
import { buildCourse, type BuildDeps } from "./pipeline";
import type { SearchClient, VideoClient } from "./providers";
import type { SearchHit, VideoHit } from "./research";

/**
 * The generation pipeline, driven end to end with the model, the search provider, the YouTube API
 * and the fetcher all faked.
 *
 * This is the cPanel run from the brief: a learner who failed the deployment questions, whose admin
 * marked DevOps High, ends up with a cPanel deployment course. Everything outside the pipeline is a
 * stub, so what is actually being tested is the part that matters — that the orchestration only
 * keeps what was verified, stops at the budget, and refuses to invent its way past a dead end.
 */

const CPANEL_GAP: ScoredGap = {
  skill: "Deploying a PHP application on cPanel",
  severity: 0.85,
  roleRelevance: 1,
  weight: 1,
  source: "both",
  priorityScore: 0.85,
  evidence: {
    summary: "You missed 4 of 5 questions on server deployment.",
    itemIds: ["item-1", "item-2"],
    missed: 4,
    asked: 5,
  },
  skipped: false,
};

const REAL_URLS = [
  "https://docs.cpanel.net/knowledge-base/web-services/how-to-deploy-a-php-application/",
  "https://laravel.com/docs/11.x/deployment",
  "https://docs.cpanel.net/cpanel/software/setup-nodejs-app/",
  "https://docs.cpanel.net/knowledge-base/ssl/autossl/",
];

function searchStub(urls = REAL_URLS): SearchClient {
  return {
    id: "tavily",
    search: vi.fn(async (query: string): Promise<SearchHit[]> =>
      urls.map((url, index) => ({
        url,
        title: `Result ${index} for ${query}`,
        snippet: "An extract from a page that exists.",
        publishedAt: "2025-02-01T00:00:00.000Z",
      })),
    ),
  };
}

function videoStub(video?: Partial<VideoHit>): VideoClient {
  const hit: VideoHit = {
    videoId: "dQw4w9WgXcQ",
    title: "Deploying Laravel on cPanel",
    channel: "A real channel",
    durationSeconds: 900,
    viewCount: 120_000,
    subscriberCount: 250_000,
    embeddable: true,
    publishedAt: new Date().toISOString(),
    ...video,
  };
  return { search: vi.fn(async () => [hit]), lookup: vi.fn(async () => hit) };
}

/** Every fetch resolves with HTML that is neither gated nor dateless. */
function fetcherStub(status = 200, html = "<html><head><title>Real page</title></head><body>content</body></html>") {
  return vi.fn(async () => ({
    status,
    headers: new Headers({ "content-type": "text/html" }),
    text: async () => html,
  }));
}

/**
 * A model that returns a valid reply for each purpose.
 *
 * `references` are drawn from whatever URLs the prompt listed, which is what a well-behaved model
 * does. The tests that matter make it misbehave instead.
 */
function aiStub(overrides: { references?: string[]; videoId?: string | null; reviewScores?: number } = {}): AiService {
  const generateJson = vi.fn(async (request: { purpose: string; user: string }) => {
    const usage = { input: 1000, output: 500 };

    if (request.purpose === "course_plan") {
      return {
        data: {
          title: "Deploying PHP applications on cPanel",
          summary: "From a fresh account to a running Laravel app, including the parts people get stuck on.",
          sections: [
            {
              title: "cPanel basics",
              summary: "The account, the file system, and how requests reach your code.",
              topics: [
                {
                  title: "File Manager, FTP and where your code actually lives",
                  objective: "Upload an application and know which directory the web server serves.",
                  searchQueries: ["cpanel file manager public_html deploy php"],
                  videoQuery: "cpanel file manager deploy php",
                  estMinutes: 20,
                },
              ],
            },
          ],
        },
        usage,
        latencyMs: 10,
        model: "stub",
      };
    }

    if (request.purpose === "course_write") {
      // Mirrors a real model: cite the URLs the prompt listed, unless the test says otherwise.
      const listed = overrides.references ?? REAL_URLS.filter((url) => request.user.includes(url)).slice(0, 3);
      return {
        data: {
          summary: "x".repeat(200),
          keyConcepts: ["public_html", "document root", "file permissions"],
          references: listed.map((url) => ({ url, label: "A source", why: "It documents the exact directory layout." })),
          videoId: overrides.videoId === undefined ? "dQw4w9WgXcQ" : overrides.videoId,
          practice: {
            task: "Upload a one-file PHP app and serve it from your own domain.",
            acceptanceCriteria: ["The page loads over HTTPS", "The file is not inside a subdirectory of public_html"],
            hint: "Check the document root before you upload anything.",
          },
          test: {
            questions: Array.from({ length: 10 }, (_, index) => ({
              id: `q${index}`,
              kind: "mcq" as const,
              prompt: `A question about deployment number ${index}`,
              options: ["public_html", "/var/www", "~/app", "/srv"],
              correctIndices: [0],
              explanation: "cPanel serves the account's public_html directory by default.",
              objective: "Know which directory the web server serves.",
            })),
            passScore: 80,
          },
        },
        usage,
        latencyMs: 10,
        model: "stub",
      };
    }

    const score = overrides.reviewScores ?? 5;
    return {
      data: {
        accuracy: score,
        depth: score,
        gapCoverage: score,
        linkQuality: score,
        testQuality: score,
        noFiller: score,
        notes: "",
        weakTopics: [],
      },
      usage,
      latencyMs: 10,
      model: "stub",
    };
  });

  return { generateJson } as unknown as AiService;
}

function deps(overrides: Partial<BuildDeps> = {}): BuildDeps {
  return {
    ai: aiStub(),
    meta: { subjectUserId: "user-1" },
    search: searchStub(),
    video: videoStub(),
    research: { fetchUrl: fetcherStub() },
    budget: { tokens: 400_000, searches: 60 },
    ...overrides,
  };
}

const context = { targetRole: "PHP/Laravel Developer", level: 2 };

describe("the cPanel run", () => {
  test("produces a course that passes review, from verified sources only", async () => {
    const outcome = await buildCourse(CPANEL_GAP, context, deps());
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    expect(outcome.course.plan.title).toMatch(/cPanel/i);
    expect(outcome.course.passed).toBe(true);
    expect(outcome.course.score).toBe(5);

    const topic = outcome.course.sections[0].topics[0];
    expect(topic.written.references.length).toBeGreaterThanOrEqual(2);
    // Every cited URL came back from the (stubbed) search and survived the (stubbed) fetch.
    for (const reference of topic.written.references) {
      expect(REAL_URLS).toContain(reference.url);
    }
    expect(topic.written.test.questions.length).toBeGreaterThanOrEqual(10);
    expect(topic.written.videoId).toBe("dQw4w9WgXcQ");
  });

  test("reports progress a person can read", async () => {
    const notes: string[] = [];
    await buildCourse(CPANEL_GAP, context, deps({ onProgress: (note) => notes.push(note) }));
    expect(notes.some((note) => /Planning/i.test(note))).toBe(true);
    expect(notes.some((note) => /Researching lesson 1 of 1/i.test(note))).toBe(true);
    expect(notes.some((note) => /Reviewing/i.test(note))).toBe(true);
  });

  test("audits each step with counts, never with content", async () => {
    const steps: { step: string; detail: Record<string, unknown> }[] = [];
    await buildCourse(CPANEL_GAP, context, deps({ onStep: (step, detail) => steps.push({ step, detail }) }));

    expect(steps.map((entry) => entry.step)).toContain("plan");
    expect(steps.map((entry) => entry.step)).toContain("review");
    // The audit trail is counts and scores. A prompt body in here would put the answer key in a
    // table the admin console renders.
    const serialised = JSON.stringify(steps);
    expect(serialised).not.toContain("public_html");
  });
});

describe("what it refuses to do", () => {
  test("drops a citation the model invented", async () => {
    const outcome = await buildCourse(
      CPANEL_GAP,
      context,
      deps({
        ai: aiStub({
          references: [REAL_URLS[0], REAL_URLS[1], "https://docs.cpanel.net/this-page-does-not-exist"],
        }),
      }),
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    const urls = outcome.course.sections[0].topics[0].written.references.map((reference) => reference.url);
    expect(urls).not.toContain("https://docs.cpanel.net/this-page-does-not-exist");
    expect(urls).toHaveLength(2);
  });

  test("writes nothing when every link is dead", async () => {
    // The failure this whole pipeline exists to prevent: rather than writing from memory, it stops.
    const outcome = await buildCourse(CPANEL_GAP, context, deps({ research: { fetchUrl: fetcherStub(404) } }));
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.kind).toBe("research");
    expect(outcome.reason).toMatch(/resolved/i);
  });

  test("writes nothing when every result is a content farm", async () => {
    const outcome = await buildCourse(
      CPANEL_GAP,
      context,
      deps({ search: searchStub(["https://www.w3schools.com/php/", "https://www.geeksforgeeks.org/cpanel/"]) }),
    );
    expect(outcome.ok).toBe(false);
  });

  test("a gated page is not a source", async () => {
    const gated = fetcherStub(200, "<html><body>Subscribe to continue reading this article</body></html>");
    const outcome = await buildCourse(CPANEL_GAP, context, deps({ research: { fetchUrl: gated } }));
    expect(outcome.ok).toBe(false);
  });

  test("a video that cannot be embedded is left out rather than embedded", async () => {
    // It would render as a grey box inside the lesson, which is worse than no video.
    const outcome = await buildCourse(CPANEL_GAP, context, deps({ video: videoStub({ embeddable: false }) }));
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.course.sections[0].topics[0].written.videoId).toBeNull();
  });

  test("a video id the model was not given is dropped", async () => {
    const outcome = await buildCourse(CPANEL_GAP, context, deps({ ai: aiStub({ videoId: "notTheOne1" }) }));
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.course.sections[0].topics[0].written.videoId).toBeNull();
  });

  test("stops at the search budget instead of running on", async () => {
    const outcome = await buildCourse(CPANEL_GAP, context, deps({ budget: { tokens: 400_000, searches: 0 } }));
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.kind).toBe("budget");
  });

  test("a course that fails the rubric comes back marked failed, not thrown away", async () => {
    // The admin still gets to look at it — `needs_review` is a state, not a deletion.
    const outcome = await buildCourse(CPANEL_GAP, context, deps({ ai: aiStub({ reviewScores: 2 }) }));
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.course.passed).toBe(false);
    expect(outcome.course.score).toBe(2);
  });
});
