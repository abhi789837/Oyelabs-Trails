/**
 * Token-bucket check for one request, run by any of several app servers that share `store`.
 * @param {{ get: Function, set: Function, eval: Function }} store shared, Redis-like, every call is async
 * @param {string} key bucket key, e.g. "user:42"
 * @param {number} now this server's clock, in ms
 * @param {{ capacity: number, refillMs: number }} policy
 * @returns {Promise<{ allowed: boolean, remaining: number, retryAfter: number }>}
 */
async function takeToken(store, key, now, policy) {
  const { capacity, refillMs } = policy;
  return store.eval(key, (bucket) => {
    let tokens = capacity;
    let last = now;
    if (bucket) {
      tokens = bucket.tokens;
      last = bucket.last;
      const gained = Math.floor(Math.max(0, now - last) / refillMs);
      if (gained > 0) {
        tokens = Math.min(capacity, tokens + gained);
        last = tokens === capacity ? now : last + gained * refillMs;
      }
    }
    if (tokens >= 1) {
      tokens -= 1;
      return { value: { tokens, last }, result: { allowed: true, remaining: tokens, retryAfter: 0 } };
    }
    const retryAfter = Math.ceil((last + refillMs - now) / 1000);
    return { value: { tokens, last }, result: { allowed: false, remaining: 0, retryAfter } };
  });
}

// ---- Test driver (leave as is) ----
function createStore(seed) {
  const data = new Map(Object.entries(seed ?? {}));
  const copy = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  const networkHop = async () => {
    await null;
    await null;
  };
  return {
    async get(key) {
      await networkHop();
      return copy(data.get(key));
    },
    async set(key, value) {
      await networkHop();
      data.set(key, copy(value));
    },
    // Like a Redis Lua script: read, run fn, write, with nothing interleaved.
    async eval(key, fn) {
      await networkHop();
      const { value, result } = fn(copy(data.get(key)));
      if (value === undefined) data.delete(key);
      else data.set(key, copy(value));
      return copy(result);
    },
  };
}

async function runLimiter(policy, requests, seed) {
  const store = createStore(seed);
  const results = [];
  for (let i = 0; i < requests.length; ) {
    let j = i;
    while (j < requests.length && requests[j].at === requests[i].at) j++;
    const batch = requests.slice(i, j); // same timestamp = concurrent requests on different servers
    const answers = await Promise.all(batch.map((r) => takeToken(store, r.key, r.at, policy)));
    results.push(...answers);
    i = j;
  }
  return results;
}
