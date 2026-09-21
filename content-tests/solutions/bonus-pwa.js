/**
 * Decide how the service worker should handle a request.
 * @param {{ url: string, method: string, mode: string, destination: string }} request
 * @returns {"network-only" | "cache-first" | "network-first" | "stale-while-revalidate"}
 */
function pickStrategy(request) {
  const { url, method, mode, destination } = request;
  if (method !== "GET") return "network-only";
  if (/^https?:\/\//.test(url)) {
    return url.startsWith("https://fonts.gstatic.com/") ? "cache-first" : "network-only";
  }
  if (mode === "navigate") return "network-first";
  if (url.startsWith("/assets/")) return "cache-first";
  if (url.startsWith("/api/")) return "network-first";
  return "stale-while-revalidate";
}

/**
 * Run a strategy against the simulated cache and network.
 * cache: get(url) -> { status, body } | undefined, put(url, response)
 * network: fetch(url) -> { status, body } | null (null means offline)
 * @returns {{ status: number, body: unknown, from: "network" | "cache" | "fallback" | "error" }}
 */
function handleFetch(request, strategy, cache, network) {
  const { url } = request;
  const fromNetwork = () => network.fetch(url);
  const store = (res) => {
    if (res && res.status === 200) cache.put(url, res);
  };
  const failure = () => {
    if (request.mode === "navigate") {
      const offline = cache.get("/offline.html");
      if (offline) return { status: offline.status, body: offline.body, from: "fallback" };
    }
    return { status: 503, body: null, from: "error" };
  };
  const wrap = (res, from) => ({ status: res.status, body: res.body, from });

  if (strategy === "network-only") {
    const res = fromNetwork();
    return res ? wrap(res, "network") : failure();
  }
  if (strategy === "cache-first") {
    const hit = cache.get(url);
    if (hit) return wrap(hit, "cache");
    const res = fromNetwork();
    if (!res) return failure();
    store(res);
    return wrap(res, "network");
  }
  if (strategy === "network-first") {
    const res = fromNetwork();
    if (res) {
      store(res);
      return wrap(res, "network");
    }
    const hit = cache.get(url);
    return hit ? wrap(hit, "cache") : failure();
  }
  // stale-while-revalidate
  const hit = cache.get(url);
  if (hit) {
    store(fromNetwork()); // background revalidation: the response below is still the cached one
    return wrap(hit, "cache");
  }
  const res = fromNetwork();
  if (!res) return failure();
  store(res);
  return wrap(res, "network");
}

// ---- Test driver (leave as is) ----
// server: { [url]: { status, body } } (unknown URLs answer 404). precache: { [url]: body }.
// steps: ["fetch", request] | ["offline"] | ["online"] | ["deploy", url, body, status = 200]
function runServiceWorker(server, precache, steps) {
  const store = new Map(Object.entries(precache).map(([url, body]) => [url, { status: 200, body }]));
  const origin = new Map(Object.entries(server));
  let online = true;
  let networkCalls = 0;
  const cache = {
    get: (url) => (store.has(url) ? { ...store.get(url) } : undefined),
    put: (url, res) => store.set(url, { status: res.status, body: res.body }),
  };
  const network = {
    fetch(url) {
      networkCalls++;
      if (!online) return null;
      const res = origin.get(url);
      return res ? { ...res } : { status: 404, body: "Not Found" };
    },
  };
  const log = [];
  for (const [op, a, b, c] of steps) {
    if (op === "offline") online = false;
    else if (op === "online") online = true;
    else if (op === "deploy") origin.set(a, { status: c === undefined ? 200 : c, body: b });
    else if (op === "fetch") {
      const request = { method: "GET", mode: "cors", destination: "", ...a };
      const strategy = pickStrategy(request);
      log.push({ url: request.url, strategy, ...handleFetch(request, strategy, cache, network) });
    }
  }
  return { log, networkCalls, cached: [...store.keys()].sort() };
}
