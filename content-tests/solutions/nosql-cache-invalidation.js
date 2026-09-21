/**
 * @param {(key: string) => Promise<unknown>} load
 * @param {{ ttl: number, swr: number, now: () => number }} options
 * @returns {{ get: (key: string) => Promise<unknown>, invalidate: (key: string) => void }}
 */
function createCache(load, options) {
  const ttl = options.ttl;
  const swr = options.swr || 0;
  const now = options.now;
  const entries = new Map(); // key -> { value, storedAt }
  const inflight = new Map(); // key -> { promise, token }

  // Starts a load and registers it as the in-flight load for key. A later invalidate()
  // (or a newer load) replaces the token, which makes this load obsolete: it may still
  // resolve its own waiters, but it never writes to the cache.
  function startLoad(key) {
    const token = {};
    let raw;
    try {
      raw = Promise.resolve(load(key));
    } catch (e) {
      raw = Promise.reject(e);
    }
    const isCurrent = () => {
      const running = inflight.get(key);
      return running !== undefined && running.token === token;
    };
    const promise = raw.then(
      (value) => {
        if (isCurrent()) {
          entries.set(key, { value, storedAt: now() });
          inflight.delete(key);
        }
        return value;
      },
      (error) => {
        if (isCurrent()) inflight.delete(key);
        throw error;
      },
    );
    inflight.set(key, { promise, token });
    return promise;
  }

  return {
    get(key) {
      const t = now();
      const entry = entries.get(key);
      if (entry && t < entry.storedAt + ttl) return Promise.resolve(entry.value);
      if (entry && t < entry.storedAt + ttl + swr) {
        // Serve stale, refresh once in the background; a failed refresh keeps the stale entry.
        if (!inflight.has(key)) startLoad(key).catch(() => {});
        return Promise.resolve(entry.value);
      }
      const running = inflight.get(key);
      if (running) return running.promise;
      return startLoad(key);
    },
    invalidate(key) {
      entries.delete(key);
      inflight.delete(key);
    },
  };
}

// ---- Test driver (leave as is) ----
async function runCacheScenario(config, events, endTime) {
  const clock = createFakeClock();
  const db = new Map(Object.entries(config.data || {}));
  const failLoads = config.failLoads || [];
  const loads = [];
  function load(key) {
    loads.push({ at: clock.now(), key });
    const loadNumber = loads.length;
    const value = db.has(key) ? db.get(key) : null; // read happens when the load starts
    return new Promise((resolve, reject) => {
      clock.setTimeout(() => {
        if (failLoads.includes(loadNumber)) reject(new Error("db timeout"));
        else resolve(value);
      }, config.latency);
    });
  }
  const cache = createCache(load, { ttl: config.ttl, swr: config.swr || 0, now: clock.now });
  const results = [];
  for (const [at, op, key, value] of events) {
    clock.at(at, () => {
      if (op === "write" || op === "dbWrite") {
        db.set(key, value);
        if (op === "write") cache.invalidate(key);
        return;
      }
      const slot = { at, key };
      results.push(slot);
      let promise;
      try {
        promise = cache.get(key);
      } catch (e) {
        slot.error = "threw synchronously";
        return;
      }
      Promise.resolve(promise).then(
        (v) => {
          slot.value = v;
          slot.doneAt = clock.now();
        },
        (e) => {
          slot.error = String((e && e.message) || e);
          slot.doneAt = clock.now();
        },
      );
    });
  }
  await clock.runUntil(endTime);
  return { results, loads };
}

function createFakeClock() {
  let now = 0;
  let nextId = 1;
  let seq = 0;
  let queue = [];
  const schedule = (time, cb) => {
    const id = nextId++;
    queue.push({ id, time, seq: seq++, cb });
    return id;
  };
  const flushMicrotasks = async () => {
    for (let i = 0; i < 100; i++) await null;
  };
  return {
    now: () => now,
    setTimeout: (cb, ms = 0) => schedule(now + Math.max(0, ms), cb),
    clearTimeout: (id) => {
      queue = queue.filter((t) => t.id !== id);
    },
    at: (time, cb) => schedule(time, cb),
    async runUntil(end) {
      for (;;) {
        await flushMicrotasks();
        queue.sort((a, b) => a.time - b.time || a.seq - b.seq);
        const next = queue[0];
        if (!next || next.time > end) break;
        queue.shift();
        now = next.time;
        next.cb();
      }
      now = end;
      await flushMicrotasks();
    },
  };
}
