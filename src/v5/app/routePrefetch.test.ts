import { afterEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "@/api/client";
import { clearPrefetched, prefetchGet, takePrefetched } from "@/api/prefetch";

import { BOOT_FUNCTIONS, facadeVideoId, manifestModuleOf, posterUrl } from "./routePlan";
import { routePrefetchPlan } from "./routePrefetch";
import { needsCurriculum } from "./V5CurriculumProvider";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

afterEach(() => {
  clearPrefetched();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("route prefetch plan", () => {
  it("starts Today's code and its one query, with the manifest and progress", () => {
    const plan = routePrefetchPlan("/learn", "");
    expect(plan.code).toEqual(["today"]);
    expect(plan.queries).toEqual(["/api/v5/today", "/api/me/manifest", "/api/me/progress"]);
    expect(routePrefetchPlan("/learn/", "").code).toEqual(["today"]);
    expect(routePrefetchPlan("/", "").code).toEqual(["today"]);
  });

  it("starts a lesson's state, videos and prefs, and remembers the topic for its module", () => {
    const plan = routePrefetchPlan("/learn/lesson/js-closures", "?step=watch");
    expect(plan.code).toEqual(["lesson"]);
    expect(plan.lessonTopicId).toBe("js-closures");
    expect(plan.queries).toContain("/api/v5/lessons/js-closures/state");
    expect(plan.queries).toContain("/api/me/topics/js-closures/videos");
    expect(plan.queries).toContain("/api/me/prefs");
  });

  it("encodes the topic id the way the lesson API does", () => {
    const plan = routePrefetchPlan("/learn/lesson/a%20b", "");
    expect(plan.lessonTopicId).toBe("a b");
    expect(plan.queries).toContain("/api/v5/lessons/a%20b/state");
  });

  it("leaves course lessons, other pages and old URLs alone", () => {
    expect(routePrefetchPlan("/learn/lesson/x", "?course=c1").code).toEqual([]);
    expect(routePrefetchPlan("/learn/plan", "").queries).toEqual([]);
    expect(routePrefetchPlan("/admin/people", "").queries).toEqual([]);
    expect(routePrefetchPlan("/track/frontend", "").queries).toEqual([]);
  });

  it("starts Review's summary and the admin inbox", () => {
    expect(routePrefetchPlan("/learn/review", "").queries[0]).toBe("/api/v5/review/summary");
    const admin = routePrefetchPlan("/admin", "");
    expect(admin.code).toEqual(["admin", "inbox", "oldDialogs"]);
    expect(admin.queries[0]).toBe("/api/admin/v5/inbox");
  });
});

describe("which screens wait for the manifest", () => {
  it("lets Today, the inbox and Review render without it", () => {
    expect(needsCurriculum("/learn")).toBe(false);
    expect(needsCurriculum("/learn/")).toBe(false);
    expect(needsCurriculum("/admin")).toBe(false);
    expect(needsCurriculum("/learn/review")).toBe(false);
  });

  it("still holds the lesson, the plan and every other admin page", () => {
    expect(needsCurriculum("/learn/lesson/js-closures")).toBe(true);
    expect(needsCurriculum("/learn/plan")).toBe(true);
    expect(needsCurriculum("/admin/curriculum")).toBe(true);
    expect(needsCurriculum("/glossary")).toBe(true);
  });
});

describe("prefetched GETs", () => {
  it("are used once by apiFetch, then the network is asked again", async () => {
    const fetch = vi.fn(async () => json({ n: fetch.mock.calls.length }));
    vi.stubGlobal("fetch", fetch);
    void prefetchGet("/api/v5/today");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(await apiFetch("/api/v5/today")).toEqual({ n: 1 });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(await apiFetch("/api/v5/today")).toEqual({ n: 2 });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("only answer GETs of the same path", async () => {
    const fetch = vi.fn(async () => json({ ok: true }));
    vi.stubGlobal("fetch", fetch);
    void prefetchGet("/api/v5/today");
    await apiFetch("/api/v5/today", { method: "POST", body: {} });
    await apiFetch("/api/v5/today?x=1");
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(takePrefetched("/api/v5/today")).not.toBeNull();
  });

  it("are dropped when stale", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const fetch = vi.fn(async () => json({ ok: true }));
    vi.stubGlobal("fetch", fetch);
    void prefetchGet("/api/v5/today");
    vi.setSystemTime(Date.now() + 16_000);
    expect(takePrefetched("/api/v5/today")).toBeNull();
  });

  it("give the reader the same errors as a normal request", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ error: { code: "UNAUTHENTICATED", message: "Sign in again." } }, 401)));
    void prefetchGet("/api/v5/today");
    await expect(apiFetch("/api/v5/today")).rejects.toMatchObject({ status: 401, message: "Sign in again." });
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    void prefetchGet("/api/v5/review/summary");
    await expect(apiFetch("/api/v5/review/summary")).rejects.toMatchObject({ status: 0 });
  });

  it("still honour the caller's abort signal", async () => {
    let release: (r: Response) => void = () => undefined;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((r) => (release = r))));
    void prefetchGet("/api/v5/today");
    const controller = new AbortController();
    const pending = apiFetch("/api/v5/today", { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    release(json({}));
  });

  it("hand a copy to whoever started them, so the reader still gets the body", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ tracks: [] })));
    const copy = await prefetchGet("/api/me/manifest");
    expect(await copy.json()).toEqual({ tracks: [] });
    expect(await apiFetch("/api/me/manifest")).toEqual({ tracks: [] });
  });
});

describe("the lesson poster to warm", () => {
  const videos = { videos: [{ videoId: "aaa111", status: "watched" }, { videoId: "bbb222", status: "partial" }, { videoId: "ccc333" }] };

  it("is the saved video, else the first one not yet watched", () => {
    expect(facadeVideoId("", { step: "watch", videoId: "ccc333" }, videos)).toBe("ccc333");
    expect(facadeVideoId("", { step: "watch", videoId: null }, videos)).toBe("bbb222");
    expect(facadeVideoId("?video=aaa111", null, videos)).toBe("aaa111");
    expect(facadeVideoId("", null, { videos: [{ videoId: "x1", status: "watched" }] })).toBe("x1");
  });

  it("is none when the lesson won't open on the facade", () => {
    expect(facadeVideoId("?t=42", null, videos)).toBeNull();
    expect(facadeVideoId("?step=read", null, videos)).toBeNull();
    expect(facadeVideoId("", { step: "check" }, videos)).toBeNull();
    expect(facadeVideoId("", null, { videos: [] })).toBeNull();
    expect(facadeVideoId("", null, null)).toBeNull();
  });

  it("uses the facade's own poster URL", () => {
    expect(posterUrl("abc")).toBe("https://i.ytimg.com/vi/abc/hqdefault.jpg");
  });
});

describe("the lesson's module from the manifest", () => {
  it("finds the topic's track and module", () => {
    const manifest = { tracks: [{ id: "fe", modules: [{ id: "m1", topics: [{ id: "a" }] }, { id: "m2", topics: [{ id: "b" }] }] }] };
    expect(manifestModuleOf(manifest, "b")).toEqual({ trackId: "fe", moduleId: "m2" });
    expect(manifestModuleOf(manifest, "zz")).toBeNull();
    expect(manifestModuleOf(null, "a")).toBeNull();
  });
});

describe("the inline start-up script", () => {
  it("is built from functions that only call each other and browser globals", () => {
    const source = BOOT_FUNCTIONS.map((fn) => fn.toString()).join("\n");
    expect(source).not.toMatch(/__name|import\(|require\(/);
    // Runs as a plain script: every helper it calls is defined in the same text.
    for (const name of ["designGuessV5", "routePrefetchPlan", "manifestModuleOf", "facadeVideoId", "posterUrl"]) {
      expect(source).toContain(`function ${name}(`);
    }
    expect(() => new Function(`${source}\nreturn typeof bootPrefetch;`)()).not.toThrow();
  });
});
