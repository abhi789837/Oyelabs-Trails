class LRUCache {
  /** @param {number} capacity */
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map(); // iteration order = least recently used first
  }

  /** @returns {any} the value, or -1 if the key is missing */
  get(key) {
    if (!this.map.has(key)) return -1;
    const value = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.capacity <= 0) return;
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) this.map.delete(this.map.keys().next().value);
  }
}

// ---- Test driver (leave as is) ----
// ops: ["put", key, value], ["get", key] or ["use", key] (a get whose result isn't recorded).
// Returns the results of the "get" calls in order.
function runLRU(capacity, ops) {
  const cache = new LRUCache(capacity);
  const results = [];
  for (const [op, key, value] of ops) {
    if (op === "put") cache.put(key, value);
    else if (op === "use") cache.get(key);
    else results.push(cache.get(key));
  }
  return results;
}
