const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * @param {number} n a non-negative safe integer
 * @returns {string} the canonical base62 encoding
 */
function toBase62(n) {
  if (n === 0) return "0";
  let s = "";
  while (n > 0) {
    const digit = n % 62;
    s = ALPHABET[digit] + s;
    n = (n - digit) / 62;
  }
  return s;
}

/**
 * @param {string} s
 * @returns {number | null} the decoded number, or null if `s` isn't a valid canonical code
 */
function fromBase62(s) {
  if (typeof s !== "string" || s.length === 0) return null;
  if (s.length > 1 && s[0] === "0") return null;
  let n = 0;
  for (const ch of s) {
    const d = ALPHABET.indexOf(ch);
    if (d < 0) return null;
    n = n * 62 + d;
    if (n > Number.MAX_SAFE_INTEGER) return null;
  }
  return n;
}

/**
 * @param {{ minLength: number, blockSize: number }} options
 * @returns {{ shorten: Function, resolve: Function }}
 */
function createShortener({ minLength, blockSize }) {
  let counter = 62 ** (minLength - 1);
  const blocks = new Map(); // server -> { next, end }
  const links = new Map(); // code -> url
  const nextId = (server) => {
    let b = blocks.get(server);
    if (!b || b.next >= b.end) {
      b = { next: counter, end: counter + blockSize };
      counter += blockSize;
      blocks.set(server, b);
    }
    return b.next++;
  };
  return {
    shorten(url, server, alias) {
      if (typeof url !== "string" || !/^https?:\/\/\S+$/.test(url)) return { error: "invalid url" };
      if (alias !== undefined) {
        if (!/^[0-9a-zA-Z]{3,30}$/.test(alias)) return { error: "invalid alias" };
        if (links.has(alias)) return { error: "alias taken" };
        links.set(alias, url);
        return { code: alias };
      }
      for (;;) {
        const code = toBase62(nextId(server));
        if (links.has(code)) continue; // taken by a custom alias: burn this id
        links.set(code, url);
        return { code };
      }
    },
    resolve(code) {
      return links.get(code) ?? null;
    },
  };
}

// ---- Test driver (leave as is) ----
function runShortener(options, ops) {
  const shortener = createShortener(options);
  return ops.map(([op, ...args]) => {
    if (op === "encode") return toBase62(args[0]);
    if (op === "decode") return fromBase62(args[0]);
    if (op === "shorten") return shortener.shorten(...args);
    if (op === "resolve") return shortener.resolve(args[0]);
    throw new Error("unknown op " + op);
  });
}
