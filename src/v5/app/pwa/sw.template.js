/* Oyelearn service worker (docs/v5/DECISIONS.md, "Phase 8 — app-wide").
 *
 * Built by vite.config.ts (`oyelearnServiceWorker`): the two placeholders below are replaced with
 * the build's version id and precache list, and the result is written to dist/sw.js.
 *
 * What it does, and nothing else:
 * - precaches the app shell (index.html), the start-up JS of the v5 frame and Review, all CSS,
 *   the woff2 fonts and the icons; other hashed files under /assets are cached the first time
 *   they're used (cache-first, the names never change);
 * - navigations go to the network first, so online pages (and their CSP headers) are always fresh;
 *   only when the network fails does it answer with the cached index.html;
 * - /api is never cached, with one narrow exception: the last good GET /api/auth/me, answered
 *   ONLY when the network is unreachable, so the app can open offline. It is dropped on sign-in,
 *   sign-out and any 401;
 * - signing out also deletes the offline Review data (IndexedDB "oyelearn-offline");
 * - a new version waits until the page asks it to take over ("A new version is ready"), so a
 *   learner is never reloaded in the middle of a lesson.
 */
const VERSION = "__OYELEARN_SW_VERSION__";
const PRECACHE_URLS = /* __OYELEARN_PRECACHE__ */ [];

const PRECACHE = `oyelearn-precache-${VERSION}`;
const RUNTIME = "oyelearn-assets";
const SESSION = "oyelearn-session";
const ME_URL = "/api/auth/me";
const OFFLINE_DB = "oyelearn-offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      // `cache: "reload"` skips the HTTP cache, so a stale copy never lands in the precache.
      await cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: "reload" })));
      // The very first install takes over at once (nothing to replace). An update waits.
      if (!self.registration.active) await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => (n.startsWith("oyelearn-precache-") && n !== PRECACHE) || n === RUNTIME)
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
      // The page that installed us asked /api/auth/me before we were in control, so keep a copy
      // now: without it the very first offline visit would land on the sign-in page.
      try {
        await meNetworkFirst(new Request(ME_URL, { credentials: "same-origin" }));
      } catch {
        // Offline already, or signed out: nothing to keep.
      }
    })(),
  );
});

self.addEventListener("message", (event) => {
  const type = event.data && event.data.type;
  if (type === "SKIP_WAITING") void self.skipWaiting();
  if (type === "CLEAR_USER_DATA") event.waitUntil(clearUserData());
});

async function clearUserData() {
  await caches.delete(SESSION);
  await new Promise((resolve) => {
    try {
      const req = indexedDB.deleteDatabase(OFFLINE_DB);
      req.onsuccess = req.onerror = req.onblocked = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  });
}

async function meNetworkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(SESSION);
    if (response.ok) await cache.put(ME_URL, response.clone());
    else if (response.status === 401 || response.status === 403) await cache.delete(ME_URL);
    return response;
  } catch (error) {
    const cached = await caches.match(ME_URL, { cacheName: SESSION });
    if (cached) return cached;
    throw error;
  }
}

async function navigation(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const shell = await caches.match("/index.html", { cacheName: PRECACHE });
    if (shell) return shell;
    throw error;
  }
}

async function cacheFirst(request) {
  const hit = await caches.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    const cache = await caches.open(RUNTIME);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.method !== "GET") {
    // A new sign-in or a sign-out: forget the previous person's offline copies.
    if (request.method === "POST" && (url.pathname === "/api/auth/logout" || url.pathname === "/api/auth/login")) {
      event.waitUntil(clearUserData());
    }
    return;
  }

  if (url.pathname === ME_URL) {
    event.respondWith(meNetworkFirst(request));
    return;
  }
  // Everything else under /api goes straight to the network, never cached.
  if (url.pathname.startsWith("/api/")) return;
  // The code runner has its own CSP and must never be served from a cache.
  if (url.pathname === "/runner.html" || url.pathname === "/sw.js") return;

  if (request.mode === "navigate") {
    event.respondWith(navigation(request));
    return;
  }
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(caches.match(url.pathname, { cacheName: PRECACHE }).then((hit) => hit || fetch(request)));
  }
});
