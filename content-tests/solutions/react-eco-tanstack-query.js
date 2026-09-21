/**
 * @param {{ staleTime: number, gcTime: number, now: () => number,
 *           setTimeout: Function, clearTimeout: Function,
 *           fetchQuery: (key: unknown[], onSuccess: (data: unknown) => void) => void }} config
 */
function createQueryClient(config) {
  const { staleTime, gcTime, now, fetchQuery } = config;
  const queries = new Map(); // hash -> query
  const observers = new Map(); // observerId -> query

  const hashKey = (key) =>
    JSON.stringify(key, (_, value) =>
      value && typeof value === "object" && !Array.isArray(value)
        ? Object.keys(value).sort().reduce((acc, k) => ((acc[k] = value[k]), acc), {})
        : value,
    );

  const partialMatch = (a, b) => {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a && b && typeof a === "object") {
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      if (Array.isArray(b) && b.length > a.length) return false;
      return Object.keys(b).every((k) => partialMatch(a[k], b[k]));
    }
    return false;
  };

  const isStale = (q) => q.invalidated || q.data === null || now() - q.dataUpdatedAt >= staleTime;

  const scheduleGc = (q) => {
    config.clearTimeout(q.gcTimer);
    q.gcTimer = config.setTimeout(() => {
      q.gcTimer = null;
      if (q.observers.size === 0 && q.fetchStatus === "idle") queries.delete(q.hash);
    }, gcTime);
  };

  const fetch = (q, { cancelRefetch = false } = {}) => {
    if (q.fetchStatus === "fetching") {
      if (!(cancelRefetch && q.data !== null)) return; // dedupe
    }
    const fetchId = ++q.fetchId;
    q.fetchStatus = "fetching";
    fetchQuery(q.key, (data) => {
      if (fetchId !== q.fetchId) return; // superseded
      q.data = data;
      q.dataUpdatedAt = now();
      q.status = "success";
      q.fetchStatus = "idle";
      q.invalidated = false;
      if (q.observers.size === 0) scheduleGc(q);
    });
  };

  return {
    mount(observerId, key) {
      const hash = hashKey(key);
      let q = queries.get(hash);
      if (!q) {
        q = { hash, key, data: null, dataUpdatedAt: 0, status: "pending", fetchStatus: "idle", invalidated: false, observers: new Set(), gcTimer: null, fetchId: 0 };
        queries.set(hash, q);
      }
      config.clearTimeout(q.gcTimer);
      q.gcTimer = null;
      q.observers.add(observerId);
      observers.set(observerId, q);
      if (isStale(q)) fetch(q);
    },
    unmount(observerId) {
      const q = observers.get(observerId);
      if (!q) return;
      observers.delete(observerId);
      q.observers.delete(observerId);
      if (q.observers.size === 0) scheduleGc(q);
    },
    invalidate(filterKey, { exact = false } = {}) {
      const target = hashKey(filterKey);
      for (const q of queries.values()) {
        const matches = exact ? q.hash === target : partialMatch(q.key, filterKey);
        if (!matches) continue;
        q.invalidated = true;
        if (q.observers.size > 0) fetch(q, { cancelRefetch: true });
      }
    },
    focus() {
      for (const q of queries.values()) {
        if (q.observers.size > 0 && isStale(q)) fetch(q);
      }
    },
    read(observerId) {
      const q = observers.get(observerId);
      if (!q) return null;
      return { status: q.status, fetchStatus: q.fetchStatus, data: q.data, isStale: isStale(q) };
    },
    has(key) {
      return queries.has(hashKey(key));
    },
  };
}

// ---- Test driver (leave as is) ----
// steps: ["mount", observerId, key] | ["unmount", observerId] | ["advance", ms]
//        ["invalidate", filterKey, exact?] | ["focus"] | ["read", observerId] | ["has", key] | ["fetches"]
// Every fetch takes options.fetchMs on the fake clock and resolves to "data@<time it resolved>".
function runQueryScenario(options, steps) {
  const clock = createFakeClock();
  let fetchCount = 0;
  const client = createQueryClient({
    staleTime: options.staleTime,
    gcTime: options.gcTime,
    now: clock.now,
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    fetchQuery(key, onSuccess) {
      fetchCount++;
      clock.setTimeout(() => onSuccess("data@" + clock.now()), options.fetchMs);
    },
  });
  const log = [];
  for (const [op, a, b] of steps) {
    if (op === "mount") client.mount(a, b);
    else if (op === "unmount") client.unmount(a);
    else if (op === "advance") clock.advance(a);
    else if (op === "invalidate") client.invalidate(a, { exact: b === true });
    else if (op === "focus") client.focus();
    else if (op === "read") log.push(client.read(a));
    else if (op === "has") log.push(client.has(a));
    else if (op === "fetches") log.push(fetchCount);
  }
  return log;
}

function createFakeClock() {
  let now = 0, nextId = 1, seq = 0, queue = [];
  return {
    now: () => now,
    setTimeout(cb, ms = 0) {
      const id = nextId++;
      queue.push({ id, time: now + Math.max(0, ms), seq: seq++, cb });
      return id;
    },
    clearTimeout(id) {
      queue = queue.filter((t) => t.id !== id);
    },
    advance(ms) {
      const end = now + ms;
      for (;;) {
        queue.sort((x, y) => x.time - y.time || x.seq - y.seq);
        const next = queue[0];
        if (!next || next.time > end) break;
        queue.shift();
        now = next.time;
        next.cb();
      }
      now = end;
    },
  };
}
