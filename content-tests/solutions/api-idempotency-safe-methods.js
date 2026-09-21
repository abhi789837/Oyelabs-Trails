/**
 * Server-side Idempotency-Key handling (Stripe / IETF httpapi draft semantics).
 * @param {{ ttlMs: number, lockTimeoutMs: number }} config
 */
function createIdempotencyLayer({ ttlMs, lockTimeoutMs }) {
  const entries = new Map(); // key -> { fingerprint, state: "in_flight" | "done", createdAt, response? }

  return {
    /**
     * @returns {{ action: "execute" } | { action: "replay", response: object } | { action: "reject", status: 400 | 409 | 422 }}
     */
    begin(key, payload, now) {
      if (typeof key !== "string" || key.trim() === "") return { action: "reject", status: 400 };
      const fingerprint = canonicalize(payload);
      let entry = entries.get(key);

      // Expired keys, and in-flight locks abandoned by a crashed worker, are forgotten.
      if (entry && now - entry.createdAt >= ttlMs) entry = undefined;
      if (entry && entry.state === "in_flight" && now - entry.createdAt >= lockTimeoutMs) entry = undefined;

      if (!entry) {
        entries.set(key, { fingerprint, state: "in_flight", createdAt: now });
        return { action: "execute" };
      }
      if (entry.fingerprint !== fingerprint) return { action: "reject", status: 422 };
      if (entry.state === "in_flight") return { action: "reject", status: 409 };
      return { action: "replay", response: entry.response };
    },

    complete(key, response) {
      const entry = entries.get(key);
      if (entry && entry.state === "in_flight") {
        entry.state = "done";
        entry.response = response;
      }
    },

    fail(key) {
      const entry = entries.get(key);
      if (entry && entry.state === "in_flight") entries.delete(key);
    },
  };
}

// Stable serialization: object keys sorted, array order preserved.
function canonicalize(value) {
  if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map((k) => JSON.stringify(k) + ":" + canonicalize(value[k])).join(",") + "}";
  }
  return JSON.stringify(value) ?? "undefined";
}

// ---- Test driver (leave as is) ----
function runIdempotency(config, steps) {
  const layer = createIdempotencyLayer(config);
  const log = [];
  for (const step of steps) {
    if (step.op === "begin") log.push(layer.begin(step.key, step.payload, step.at));
    else if (step.op === "complete") layer.complete(step.key, step.response, step.at);
    else if (step.op === "fail") layer.fail(step.key, step.at);
  }
  return log;
}
