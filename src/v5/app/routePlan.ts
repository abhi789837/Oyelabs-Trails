/// <reference lib="dom" />
/**
 * What a v5 route needs first, and the start-up prefetch itself (Phase 9 performance).
 *
 * These functions run in two places:
 * - inlined into `index.html` by the build (vite.config.ts `bootPrefetchScript`), so the route's
 *   queries start while the HTML is still parsing, in parallel with the JavaScript download;
 * - from `routePrefetch.ts` in the app (development, where index.html has no such script, and tests).
 *
 * So this file has **no imports and no module-level values**: each function is turned back into
 * source text with `Function.prototype.toString` and may only call the other functions listed in
 * `BOOT_FUNCTIONS`, plus browser globals. Keep the syntax plain (no TypeScript-only runtime
 * features such as enums).
 *
 * Responses are kept on `globalThis.__oyelearnPrefetch` (path → { response, at }); `api.get` of the
 * same path takes one, once (src/api/prefetch.ts). Nothing runs unless this device last opened v5
 * (or a staff `?ui=v5`), so the old UI never gets these requests.
 */

/** The prefetch store shared by the inline script and the app. */
export interface PrefetchEntry {
  response: Promise<Response>;
  at: number;
}

/** True when this start-up should bet on v5: a `?ui=` override, this tab's override, or the last design used here. */
export function designGuessV5(search: string): boolean {
  const fromUrl = /[?&]ui=(v5|old)(&|$)/.exec(search);
  if (fromUrl) return fromUrl[1] === "v5";
  try {
    // Same keys as src/v5/app/designFlag.ts (the tab's staff override) and routePrefetch.ts (the guess).
    const tab = window.sessionStorage.getItem("oyelearn-ui-override");
    if (tab === "v5" || tab === "old") return tab === "v5";
    return window.localStorage.getItem("oyelearn-ui-guess") === "v5";
  } catch {
    return false;
  }
}

/** The matched route's code (names in routePrefetch.ts `ROUTE_MODULES`) and first queries. */
export function routePrefetchPlan(pathname: string, search: string): { code: string[]; queries: string[]; lessonTopicId: string | null } {
  const path = pathname.replace(/\/+$/, "") || "/";
  const params = new URLSearchParams(search);
  const learner = ["/api/me/manifest", "/api/me/progress"];
  if (path === "/learn" || path === "/") return { code: ["today"], queries: ["/api/v5/today", ...learner], lessonTopicId: null };
  if (path === "/learn/review") return { code: ["review"], queries: ["/api/v5/review/summary", ...learner], lessonTopicId: null };
  const lesson = /^\/learn\/lesson\/([^/]+)$/.exec(path);
  if (lesson && !params.get("course")) {
    const topicId = decodeURIComponent(lesson[1]);
    const id = encodeURIComponent(topicId);
    return {
      code: ["lesson"],
      queries: [...learner, `/api/v5/lessons/${id}/state`, `/api/me/topics/${id}/videos`, "/api/me/prefs"],
      lessonTopicId: topicId,
    };
  }
  if (path === "/admin") return { code: ["admin", "inbox", "oldDialogs"], queries: ["/api/admin/v5/inbox", ...learner], lessonTopicId: null };
  return { code: [], queries: [], lessonTopicId: null };
}

/** A topic's track and module in the manifest, so the lesson's module content can start with it. */
export function manifestModuleOf(
  manifest: { tracks?: { id: string; modules?: { id: string; topics?: { id: string }[] }[] }[] } | null,
  topicId: string,
): { trackId: string; moduleId: string } | null {
  for (const track of manifest?.tracks ?? []) {
    for (const mod of track.modules ?? []) {
      if (mod.topics?.some((t) => t.id === topicId)) return { trackId: track.id, moduleId: mod.id };
    }
  }
  return null;
}

/**
 * The video whose thumbnail the Watch step's facade will show (WatchStep: the `?video=` or saved
 * video, else the first one not yet watched), or null when the lesson won't open on that facade
 * (another step, a `?t=` link that starts the player, or no playlist).
 */
export function facadeVideoId(
  search: string,
  state: { step?: string; videoId?: string | null } | null,
  videos: { videos?: { videoId: string; status?: string }[] } | null,
): string | null {
  const params = new URLSearchParams(search);
  const items = videos?.videos ?? [];
  if (params.has("t") || items.length === 0) return null;
  const step = params.get("step") ?? state?.step ?? "watch";
  if (step !== "watch") return null;
  const wanted = params.get("video") ?? state?.videoId ?? null;
  const saved = wanted ? items.find((v) => v.videoId === wanted) : undefined;
  if (saved) return saved.videoId;
  return (items.find((v) => v.status !== "watched" && v.status !== "unavailable") ?? items[0]).videoId;
}

/** The facade's poster. The same URL is warmed at start-up, so the image is on its way when it renders. */
export function posterUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Starts `/api/auth/me` and the route's queries (and, for a lesson, its module content and video poster), and preloads
 * v5's fonts. Safe to call twice: a path already in the store isn't fetched again.
 */
export function bootPrefetch(fonts: string[]): void {
  try {
    const { pathname, search } = window.location;
    if (!designGuessV5(search)) return;
    if (/^\/(login|change-password|verify)(\/|$)/.test(pathname)) return;
    const head = document.head;
    for (const href of fonts) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "font";
      link.type = "font/woff2";
      link.crossOrigin = "anonymous";
      link.href = href;
      head.appendChild(link);
    }
    const g = globalThis as unknown as { __oyelearnPrefetch?: Record<string, PrefetchEntry> };
    const store = g.__oyelearnPrefetch ?? (g.__oyelearnPrefetch = {});
    const start = (url: string): Promise<Response> => {
      if (!store[url]) {
        const response = fetch(url, { credentials: "same-origin" });
        response.catch(() => undefined);
        store[url] = { response, at: Date.now() };
      }
      return store[url].response;
    };
    // A copy, so the page still gets the original body.
    const json = (url: string) => start(url).then((r) => (r.ok ? r.clone().json() : null));
    // Every signed-in page asks who's there first (AuthProvider); it no longer waits for the app's code.
    start("/api/auth/me");
    const plan = routePrefetchPlan(pathname, search);
    for (const url of plan.queries) start(url);
    const topicId = plan.lessonTopicId;
    if (topicId) {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = "https://i.ytimg.com";
      head.appendChild(link);
      const id = encodeURIComponent(topicId);
      Promise.all([json(`/api/v5/lessons/${id}/state`), json(`/api/me/topics/${id}/videos`)])
        .then(([state, videos]) => {
          const videoId = facadeVideoId(search, state, videos);
          if (!videoId) return;
          const img = new Image();
          img.fetchPriority = "high";
          img.src = posterUrl(videoId);
        })
        .catch(() => undefined);
      json("/api/me/manifest")
        .then((manifest) => {
          const where = manifestModuleOf(manifest, topicId);
          if (where) start(`/api/content/modules/${where.trackId}/${where.moduleId}`);
        })
        .catch(() => undefined);
    }
  } catch {
    // A prefetch is only ever a head start.
  }
}

/** Every function `bootPrefetch` needs, for the inline script. */
export const BOOT_FUNCTIONS = [designGuessV5, routePrefetchPlan, manifestModuleOf, facadeVideoId, posterUrl, bootPrefetch];
