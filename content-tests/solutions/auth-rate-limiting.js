/**
 * A per-key token bucket with lazy refill (no timers).
 * @param {{ capacity: number, refillPerSec: number }} config
 * @returns {{ tryRemove(key: string, nowMs: number, cost?: number): { allowed: boolean, remaining: number, retryAfterMs: number | null } }}
 */
function createTokenBucketLimiter({ capacity, refillPerSec }) {
  const buckets = new Map();
  return {
    tryRemove(key, nowMs, cost = 1) {
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { tokens: capacity, last: nowMs };
        buckets.set(key, bucket);
      }
      // Refill for the time since the last refill. A timestamp earlier than the last one adds nothing.
      if (nowMs > bucket.last) {
        bucket.tokens = Math.min(capacity, bucket.tokens + ((nowMs - bucket.last) * refillPerSec) / 1000);
        bucket.last = nowMs;
      }
      if (cost > capacity) {
        return { allowed: false, remaining: Math.floor(bucket.tokens), retryAfterMs: null };
      }
      if (bucket.tokens >= cost) {
        bucket.tokens -= cost;
        return { allowed: true, remaining: Math.floor(bucket.tokens), retryAfterMs: 0 };
      }
      const retryAfterMs = Math.ceil(((cost - bucket.tokens) * 1000) / refillPerSec);
      return { allowed: false, remaining: Math.floor(bucket.tokens), retryAfterMs };
    },
  };
}

// ---- Test driver (leave as is) ----
function runLimiterScenario(config, requests) {
  const limiter = createTokenBucketLimiter(config);
  return requests.map(([key, atMs, cost]) => limiter.tryRemove(key, atMs, cost === undefined ? 1 : cost));
}
