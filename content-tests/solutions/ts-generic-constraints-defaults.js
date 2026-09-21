/**
 * Runtime twin of TypeScript's Pick<T, K>.
 * @template {object} T
 * @template {keyof T} K
 * @param {T} obj
 * @param {readonly K[]} keys
 * @returns {Pick<T, K>}
 */
function pick(obj, keys) {
  const out = {};
  for (const key of keys) {
    // Own properties only; Object.hasOwn also survives an own "hasOwnProperty" key.
    if (!Object.hasOwn(obj, key)) continue;
    // defineProperty creates a real own "__proto__" property instead of changing the prototype.
    Object.defineProperty(out, key, { value: obj[key], enumerable: true, writable: true, configurable: true });
  }
  return out;
}

/**
 * Runtime twin of TypeScript's Omit<T, K>.
 * @template {object} T
 * @template {keyof T} K
 * @param {T} obj
 * @param {readonly K[]} keys
 * @returns {Omit<T, K>}
 */
function omit(obj, keys) {
  const drop = new Set(keys);
  // Object.fromEntries defines own data properties, so "__proto__" stays an ordinary key.
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !drop.has(key)));
}

// ---- Test driver (leave as is) ----
function runPickOmit(op, obj, keys) {
  const before = Object.entries(obj);
  const result = op === "pick" ? pick(obj, keys) : omit(obj, keys);
  const after = Object.entries(obj);
  return {
    entries: Object.entries(result),
    plainPrototype: Object.getPrototypeOf(result) === Object.prototype,
    sharesValues: Object.keys(result).every((k) => Object.is(result[k], obj[k])),
    inputUnchanged: after.length === before.length && after.every(([k, v], i) => k === before[i][0] && Object.is(v, before[i][1])),
  };
}
