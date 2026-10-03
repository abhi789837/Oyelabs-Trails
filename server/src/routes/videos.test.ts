import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { VIDEOS_UNWATCHED_CODE, type TopicVideosResponse } from "../../../shared/video";
import { correctIndicesOf } from "../content/filter";
import { schema } from "../db";
import { activeLearner, adminSession, as, createTestApp, publishPlanFor, type Session, type TestContext } from "../test/harness";
import { ensureDataApiDurations, resetYouTubeCache } from "../videos/youtube";

let ctx: TestContext;
let admin: Session;
let learner: { id: string; username: string; session: Session };

/** A real topic with three short videos (4:34, 4:44, 3:26) and an 11-question quiz. */
const TOPIC = "lv-api-exceptions";
const VIDEOS = [
  { id: "oFzfX2c-IIg", seconds: 274 },
  { id: "eTOScyTCkiY", seconds: 284 },
  { id: "Tdh4oCe0rlc", seconds: 206 },
];

beforeEach(async () => {
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  learner = await activeLearner(ctx, admin);
  await publishPlanFor(ctx, admin, learner.id, [TOPIC, "js-closures"]);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  resetYouTubeCache();
  await ctx.close();
});

async function state(session: Session = learner.session): Promise<TopicVideosResponse> {
  const res = await ctx.app.inject({ method: "GET", url: `/api/me/topics/${TOPIC}/videos`, ...as(session) });
  expect(res.statusCode).toBe(200);
  return res.json();
}

async function sample(videoId: string, body: Record<string, number>) {
  return ctx.app.inject({
    method: "POST",
    url: `/api/me/topics/${TOPIC}/videos/${videoId}/progress`,
    ...as(learner.session),
    payload: body,
  });
}

/** Plays [from, to) in 20 s samples (allowed: 2x speed over 10 s of wall time). */
async function watch(videoId: string, from: number, to: number): Promise<TopicVideosResponse> {
  let last: TopicVideosResponse | null = null;
  for (let t = from; t < to; t += 20) {
    const next = Math.min(to, t + 20);
    const res = await sample(videoId, { from: t, to: next, position: next, elapsed: 10 });
    expect(res.statusCode).toBe(200);
    last = res.json();
  }
  return last!;
}

async function attempt(session: Session = learner.session) {
  const quiz = ctx.content.getTopic(TOPIC)!.topic.quiz!;
  return ctx.app.inject({
    method: "POST",
    url: `/api/topics/${TOPIC}/attempt`,
    ...as(session),
    payload: { kind: "quiz", answers: Object.fromEntries(quiz.map((q) => [q.id, correctIndicesOf(q)])) },
  });
}

describe("the playlist state", () => {
  test("lists the topic's three videos with durations from the content labels, none started", async () => {
    const s = await state();
    expect(s.videos.map((v) => v.videoId)).toEqual(VIDEOS.map((v) => v.id));
    expect(s.videos.map((v) => v.durationSeconds)).toEqual(VIDEOS.map((v) => v.seconds));
    expect(s.videos.every((v) => v.durationSource === "label" && v.status === "not-started")).toBe(true);
    expect(s).toMatchObject({ watchedCount: 0, total: 3, lockMode: "lock", locked: true, exempt: null });
  });

  test("progress accumulates, and the last position is the resume point", async () => {
    const s = await watch(VIDEOS[0].id, 0, 100);
    const v = s.videos[0];
    expect(v.watchedSeconds).toBe(100);
    expect(v.status).toBe("in-progress");
    expect(v.lastPosition).toBe(100);
    expect(v.resumeAt).toBe(100);
    expect(v.progress).toBeCloseTo(100 / 274, 3);
  });

  test("a seek is not counted", async () => {
    await watch(VIDEOS[0].id, 0, 40);
    const res = await sample(VIDEOS[0].id, { from: 40, to: 260, position: 260, elapsed: 5 });
    const v = (res.json() as TopicVideosResponse).videos[0];
    expect(v.watchedSeconds).toBe(40);
    expect(v.lastPosition).toBe(260);
    expect(v.watched).toBe(false);
  });

  test("replaying does not double count, and 90% makes a video watched", async () => {
    await watch(VIDEOS[2].id, 0, 100);
    await watch(VIDEOS[2].id, 0, 100);
    let v = (await state()).videos[2];
    expect(v.watchedSeconds).toBe(100);
    v = (await watch(VIDEOS[2].id, 100, 186)).videos[2];
    expect(v.watchedSeconds).toBe(186); // 186 / 206 = 90.3%
    expect(v.status).toBe("watched");
  });

  test("a video that is not in the topic is refused, and so is a topic outside the plan", async () => {
    expect((await sample("qikxEIxsXco", { from: 0, to: 5, position: 5 })).statusCode).toBe(404);
    const other = await activeLearner(ctx, admin, "learner.two");
    const res = await ctx.app.inject({ method: "GET", url: `/api/me/topics/${TOPIC}/videos`, ...as(other.session) });
    expect(res.statusCode).toBe(404);
  });

  test("a player-reported duration is used when the content has none, and clamps positions", async () => {
    const res = await sample(VIDEOS[0].id, { from: 0, to: 5, position: 5, duration: 280 });
    expect((res.json() as TopicVideosResponse).videos[0]).toMatchObject({ durationSeconds: 280, durationSource: "player" });
  });
});

describe("the lock", () => {
  test("lock mode refuses the test with 409 until every video is watched, then allows it", async () => {
    const blocked = await attempt();
    expect(blocked.statusCode).toBe(409);
    expect(blocked.json().error.code).toBe(VIDEOS_UNWATCHED_CODE);
    expect(blocked.json().error.message).toMatch(/0 of 3 watched/);

    for (const v of VIDEOS) await watch(v.id, 0, v.seconds);
    const s = await state();
    expect(s).toMatchObject({ watchedCount: 3, total: 3, locked: false });

    const ok = await attempt();
    expect(ok.statusCode).toBe(200);
    expect(ok.json().passed).toBe(true);
  });

  test("warn mode lets the test through and still reports the count", async () => {
    const put = await ctx.app.inject({ method: "PUT", url: "/api/admin/video-settings", ...as(admin), payload: { lockMode: "warn" } });
    expect(put.json().lockMode).toBe("warn");
    expect(await state()).toMatchObject({ lockMode: "warn", locked: false, watchedCount: 0 });
    expect((await attempt()).statusCode).toBe(200);
  });

  test("the admin setting is staff-only and validated", async () => {
    const asLearner = await ctx.app.inject({ method: "PUT", url: "/api/admin/video-settings", ...as(learner.session), payload: { lockMode: "warn" } });
    expect(asLearner.statusCode).toBe(403);
    const bad = await ctx.app.inject({ method: "PUT", url: "/api/admin/video-settings", ...as(admin), payload: { lockMode: "off" } });
    expect(bad.statusCode).toBe(400);
    const get = await ctx.app.inject({ method: "GET", url: "/api/admin/video-settings", ...as(admin) });
    expect(get.json().lockMode).toBe("lock");
  });

  test("a topic completed before v4.3 stays completed, and a retry is not locked", async () => {
    const at = Date.now() - 86_400_000;
    ctx.db
      .insert(schema.topicProgress)
      .values({ userId: learner.id, topicId: TOPIC, status: "completed", bestScore: 90, attempts: 1, completedAt: at, updatedAt: at })
      .run();
    expect(await state()).toMatchObject({ locked: false, exempt: "completed", watchedCount: 0 });

    const retry = await attempt();
    expect(retry.statusCode).toBe(200);
    const progress = await ctx.app.inject({ method: "GET", url: "/api/me/progress", ...as(learner.session) });
    expect(progress.json().progress[TOPIC]).toMatchObject({ status: "completed", completedAt: at });
  });

  test("staff are never locked", async () => {
    expect(await state(admin)).toMatchObject({ locked: false, exempt: "staff" });
  });

  test("an unplayable video stops counting, so it cannot lock a topic for good", async () => {
    for (const v of VIDEOS.slice(0, 2)) await watch(v.id, 0, v.seconds);
    const res = await ctx.app.inject({
      method: "POST",
      url: `/api/me/topics/${TOPIC}/videos/${VIDEOS[2].id}/error`,
      ...as(learner.session),
      payload: { code: 150 },
    });
    expect(res.json()).toMatchObject({ watchedCount: 2, total: 2, locked: false });
    expect(res.json().videos[2].status).toBe("unavailable");
    const transient = await ctx.app.inject({
      method: "POST",
      url: `/api/me/topics/${TOPIC}/videos/${VIDEOS[2].id}/error`,
      ...as(learner.session),
      payload: { code: 5 },
    });
    expect(transient.statusCode).toBe(400);
  });
});

describe("preferences and totals", () => {
  test("autoplay next defaults on and is remembered", async () => {
    const get = await ctx.app.inject({ method: "GET", url: "/api/me/prefs", ...as(learner.session) });
    expect(get.json()).toEqual({ autoplayNext: true });
    const put = await ctx.app.inject({ method: "PUT", url: "/api/me/prefs", ...as(learner.session), payload: { autoplayNext: false } });
    expect(put.json()).toEqual({ autoplayNext: false });
    const again = await ctx.app.inject({ method: "GET", url: "/api/me/prefs", ...as(learner.session) });
    expect(again.json()).toEqual({ autoplayNext: false });
    const bad = await ctx.app.inject({ method: "PUT", url: "/api/me/prefs", ...as(learner.session), payload: { autoplayNext: "yes" } });
    expect(bad.statusCode).toBe(400);
  });

  test("module totals add up the assigned topics' videos and what was watched", async () => {
    await watch(VIDEOS[0].id, 0, 120);
    const res = await ctx.app.inject({ method: "GET", url: "/api/me/modules/php/laravel-apis/videos", ...as(learner.session) });
    expect(res.statusCode).toBe(200);
    const totals = res.json();
    expect(totals.topics.map((t: { topicId: string }) => t.topicId)).toEqual([TOPIC]);
    expect(totals).toMatchObject({ videos: 3, watchedVideos: 0, totalSeconds: 274 + 284 + 206, watchedSeconds: 120 });
  });
});

describe("YouTube Data API durations", () => {
  test("with a key, durations are fetched in one batch, cached, and preferred over labels", async () => {
    vi.stubEnv("YOUTUBE_API_KEY", "test-key");
    const fetchMock = vi.fn(async (url: string | URL) => {
      const ids = new URL(String(url)).searchParams.get("id")!.split(",");
      return new Response(
        JSON.stringify({ items: ids.map((id, i) => ({ id, contentDetails: { duration: `PT${5 + i}M0S` } })) }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const s = await state();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("part=contentDetails");
    expect(s.videos.map((v) => [v.durationSeconds, v.durationSource])).toEqual([
      [300, "data-api"],
      [360, "data-api"],
      [420, "data-api"],
    ]);

    await state();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // A player report never overrides the Data API.
    const res = await sample(VIDEOS[0].id, { from: 0, to: 5, position: 5, duration: 999 });
    expect((res.json() as TopicVideosResponse).videos[0]).toMatchObject({ durationSeconds: 300, durationSource: "data-api" });
  });

  test("without a key nothing is fetched; an API failure degrades to labels", async () => {
    const fetchMock = vi.fn(async () => new Response("quota", { status: 403 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await ensureDataApiDurations(ctx.db, ["oFzfX2c-IIg"])).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();

    vi.stubEnv("YOUTUBE_API_KEY", "test-key");
    const s = await state();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(s.videos[0]).toMatchObject({ durationSeconds: 274, durationSource: "label" });
  });
});
