/**
 * The token-refresh layer of a React app's API client.
 *
 * @param {{
 *   callApi: (path: string, token: string | null) => Promise<{ status: number, body: unknown }>,
 *   refreshToken: () => Promise<{ status: number, accessToken?: string }>,
 *   initialToken: string | null,
 *   onLogout: () => void,
 * }} deps
 * @returns {{ request: (path: string) => Promise<object>, getToken: () => string | null }}
 */
function createAuthClient({ callApi, refreshToken, initialToken, onLogout }) {
  let token = initialToken;
  let refreshing = null; // Promise<"ok" | "expired" | "network"> while a refresh is in flight
  let loggedOut = false;

  function refreshOnce() {
    if (!refreshing) {
      refreshing = (async () => {
        try {
          const res = await refreshToken();
          if (res && res.status === 200) {
            token = res.accessToken;
            return "ok";
          }
          token = null;
          loggedOut = true;
          onLogout();
          return "expired";
        } catch {
          return "network";
        }
      })().finally(() => {
        refreshing = null;
      });
    }
    return refreshing;
  }

  const failure = (outcome) =>
    outcome === "network" ? { status: 0, error: "network" } : { status: 401, error: "session_expired" };

  async function request(path) {
    if (loggedOut) return { status: 401, error: "logged_out" };
    if (refreshing) {
      const outcome = await refreshing;
      if (outcome !== "ok") return failure(outcome);
    }
    const used = token;
    const res = await callApi(path, used);
    if (res.status !== 401) return res;
    if (loggedOut) return { status: 401, error: "logged_out" };
    if (token === used) {
      const outcome = await refreshOnce();
      if (outcome !== "ok") return failure(outcome);
    } else if (refreshing) {
      const outcome = await refreshing;
      if (outcome !== "ok") return failure(outcome);
    }
    return callApi(path, token);
  }

  return { request, getToken: () => token };
}

// ---- Test driver (leave as is) ----
// Replays timed requests against a scripted fake API on a fake clock.
// script: {
//   initialToken, serverToken,           // the token the client starts with / the one the API accepts
//   refreshOutcomes: [...],              // per refresh call: "tok" (issued and accepted), "!tok" (issued but
//                                        // rejected by the API), "NETWORK" (request fails), null (refresh token expired)
//   latency: { [path]: ms },             // API latency per path (default 10 ms); refreshLatency default 20 ms
//   requests: [[atMs, path], ...]
// }
// Paths starting with /admin answer 403 even with a valid token.
async function runAuthScenario(script) {
  const clock = createFakeClock();
  const calls = [];
  let refreshes = 0;
  let logouts = 0;
  let serverToken = script.serverToken ?? null;
  const outcomes = [...(script.refreshOutcomes ?? [])];
  const latency = script.latency ?? {};
  const callApi = (path, token) => {
    calls.push(clock.now() + " " + path + " " + token);
    const valid = token !== null && token === serverToken;
    const res = !valid ? { status: 401, body: null } : path.startsWith("/admin") ? { status: 403, body: null } : { status: 200, body: path + ":ok" };
    return new Promise((resolve) => clock.setTimeout(() => resolve(res), latency[path] ?? 10));
  };
  const refreshToken = () => {
    refreshes++;
    calls.push(clock.now() + " refresh");
    return new Promise((resolve, reject) =>
      clock.setTimeout(() => {
        const next = outcomes.length ? outcomes.shift() : null;
        if (next === "NETWORK") return reject(new TypeError("Failed to fetch"));
        if (typeof next !== "string") return resolve({ status: 401 });
        const accepted = !next.startsWith("!");
        const issued = accepted ? next : next.slice(1);
        if (accepted) serverToken = issued;
        resolve({ status: 200, accessToken: issued });
      }, script.refreshLatency ?? 20),
    );
  };
  const client = createAuthClient({ callApi, refreshToken, initialToken: script.initialToken ?? null, onLogout: () => { logouts++; } });
  const results = script.requests.map(() => null);
  script.requests.forEach(([at, path], i) =>
    clock.at(at, () => {
      Promise.resolve(client.request(path)).then(
        (res) => { results[i] = res; },
        (err) => { results[i] = { threw: String((err && err.message) || err) }; },
      );
    }),
  );
  await clock.runAll();
  return { results, calls, refreshes, logouts, token: client.getToken() };
}

function createFakeClock() {
  let now = 0, nextId = 1, seq = 0, queue = [];
  const schedule = (time, cb) => {
    const id = nextId++;
    queue.push({ id, time, seq: seq++, cb });
    return id;
  };
  const flush = async () => {
    for (let i = 0; i < 200; i++) await Promise.resolve();
  };
  return {
    now: () => now,
    setTimeout: (cb, ms = 0) => schedule(now + Math.max(0, ms), cb),
    at: (time, cb) => schedule(time, cb),
    async runAll() {
      await flush();
      for (let step = 0; step < 100000; step++) {
        queue.sort((a, b) => a.time - b.time || a.seq - b.seq);
        const next = queue.shift();
        if (!next) break;
        now = next.time;
        next.cb();
        await flush();
      }
    },
  };
}
