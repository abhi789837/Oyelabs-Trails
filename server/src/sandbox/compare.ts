/**
 * Comparing a harness's JSON output with an expected value, outside the sandbox.
 *
 * JSON-shaped values only (what crosses stdout). Object key order is ignored; an empty array and an
 * empty object are equal, because PHP's `json_encode([])` cannot say which one it meant; floats
 * compare within 1e-9 so `0.1 + 0.2` is not a wrong answer in one language and right in another.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  const emptyA = Array.isArray(a) ? a.length === 0 : Object.keys(a).length === 0;
  const emptyB = Array.isArray(b) ? b.length === 0 : Object.keys(b).length === 0;
  if (emptyA && emptyB) return true;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((value, i) => deepEqual(value, b[i]));
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  return ka.every((key) => Object.prototype.hasOwnProperty.call(b, key) && deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
}

export function formatValue(value: unknown): string {
  if (value === undefined) return "undefined";
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}
