/**
 * Returns the specificity of one complex selector as [ids, classes, types],
 * or null if the input isn't exactly one valid complex selector.
 * @param {string} selector
 * @returns {[number, number, number] | null}
 */
function specificity(selector) {
  if (typeof selector !== "string") return null;
  const src = selector;
  let i = 0;

  const ZERO = [0, 0, 0];
  const add = (x, y) => [x[0] + y[0], x[1] + y[1], x[2] + y[2]];
  const compare = (x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
  const maxOf = (list) => list.reduce((best, s) => (compare(s, best) > 0 ? s : best), ZERO);
  const LEGACY_PSEUDO_ELEMENTS = new Set(["before", "after", "first-line", "first-letter"]);
  const fail = () => {
    throw new SyntaxError("invalid selector");
  };
  const isWs = (c) => c === " " || c === "\t" || c === "\n" || c === "\r" || c === "\f";
  const skipWs = () => {
    while (i < src.length && isWs(src[i])) i++;
  };
  const isNameStart = (c) => c !== undefined && (/[A-Za-z_\-]/.test(c) || c === "\\" || c > "\x7f");

  function readName() {
    let out = "";
    while (i < src.length) {
      const c = src[i];
      if (c === "\\") {
        if (i + 1 >= src.length) fail();
        out += src[i + 1];
        i += 2;
      } else if (/[A-Za-z0-9_\-]/.test(c) || c > "\x7f") {
        out += c;
        i++;
      } else break;
    }
    if (!out) fail();
    return out;
  }

  // Skips a quoted string starting at src[i]; leaves i after the closing quote.
  function skipString() {
    const quote = src[i++];
    while (i < src.length && src[i] !== quote) {
      if (src[i] === "\\") i++;
      i++;
    }
    if (i >= src.length) fail();
    i++;
  }

  // Returns the raw text inside balanced parentheses; i must be just after "(".
  function readParenContent() {
    const start = i;
    let depth = 1;
    while (i < src.length) {
      const c = src[i];
      if (c === '"' || c === "'") {
        skipString();
        continue;
      }
      if (c === "\\") {
        i += 2;
        continue;
      }
      if (c === "(") depth++;
      else if (c === ")" && --depth === 0) {
        const text = src.slice(start, i);
        i++;
        return text;
      }
      i++;
    }
    fail();
  }

  // Parses a comma-separated selector list up to ")" or the end of input.
  function parseList(relative) {
    const items = [parseComplex(relative)];
    skipWs();
    while (src[i] === ",") {
      i++;
      items.push(parseComplex(relative));
      skipWs();
    }
    return items;
  }

  function parseComplex(relative) {
    skipWs();
    if (src[i] === ">" || src[i] === "+" || src[i] === "~") {
      if (!relative) fail();
      i++;
      skipWs();
    }
    let total = parseCompound();
    if (total === null) fail();
    for (;;) {
      const before = i;
      skipWs();
      const c = src[i];
      if (c === ">" || c === "+" || c === "~") {
        i++;
        skipWs();
      } else if (i === before || c === undefined || c === "," || c === ")") {
        break;
      }
      const next = parseCompound();
      if (next === null) fail();
      total = add(total, next);
    }
    return total;
  }

  // Returns the specificity of a compound selector, or null if none starts here.
  function parseCompound() {
    let spec = null;
    const bump = (s) => {
      spec = add(spec ?? ZERO, s);
    };
    if (src[i] === "*") {
      i++;
      bump(ZERO);
    } else if (isNameStart(src[i])) {
      readName();
      bump([0, 0, 1]);
    }
    for (;;) {
      const c = src[i];
      if (c === "#") {
        i++;
        readName();
        bump([1, 0, 0]);
      } else if (c === ".") {
        i++;
        readName();
        bump([0, 1, 0]);
      } else if (c === "[") {
        i++;
        let sawContent = false;
        while (i < src.length && src[i] !== "]") {
          if (src[i] === '"' || src[i] === "'") skipString();
          else {
            if (!isWs(src[i])) sawContent = true;
            i += src[i] === "\\" ? 2 : 1;
          }
        }
        if (i >= src.length || !sawContent) fail();
        i++;
        bump([0, 1, 0]);
      } else if (c === ":") {
        i++;
        if (src[i] === ":") {
          i++;
          readName();
          if (src[i] === "(") {
            i++;
            readParenContent();
          }
          bump([0, 0, 1]);
          continue;
        }
        const name = readName().toLowerCase();
        if (LEGACY_PSEUDO_ELEMENTS.has(name)) {
          bump([0, 0, 1]);
          continue;
        }
        if (src[i] !== "(") {
          bump([0, 1, 0]);
          continue;
        }
        i++;
        if (name === "is" || name === "not" || name === "has" || name === "where") {
          const args = parseList(name === "has");
          skipWs();
          if (src[i] !== ")") fail();
          i++;
          bump(name === "where" ? ZERO : maxOf(args));
        } else if (name === "nth-child" || name === "nth-last-child") {
          const text = readParenContent();
          const m = /^[\s\S]*?\sof\s([\s\S]+)$/.exec(text);
          const ofSpec = m ? specificityList(m[1]) : null;
          if (m && ofSpec === null) fail();
          bump(add([0, 1, 0], ofSpec ? maxOf(ofSpec) : ZERO));
        } else {
          readParenContent();
          bump([0, 1, 0]);
        }
      } else break;
    }
    return spec;
  }

  try {
    skipWs();
    if (i >= src.length) return null;
    const list = parseList(false);
    skipWs();
    if (i !== src.length || list.length !== 1) return null;
    return list[0];
  } catch (e) {
    if (e instanceof SyntaxError) return null;
    throw e;
  }
}

// Helper for `:nth-child(An+B of S)`: specificities of each selector in S, or null.
function specificityList(text) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let start = 0;
  for (let k = 0; k < text.length; k++) {
    const c = text[k];
    if (quote) {
      if (c === "\\") k++;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === "\\") k++;
    else if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (c === "," && depth === 0) {
      parts.push(text.slice(start, k));
      start = k + 1;
    }
  }
  parts.push(text.slice(start));
  const specs = parts.map((p) => specificity(p));
  return specs.some((s) => s === null) ? null : specs;
}
