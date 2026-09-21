/**
 * Returns true if the media query list `query` matches `env`.
 * @param {string} query
 * @param {{ width: number, height: number, type?: string, defaultFontSize?: number, rootFontSize?: number,
 *   hover?: string, pointer?: string, prefersReducedMotion?: string, prefersColorScheme?: string }} env
 * @returns {boolean}
 */
function matchesMedia(query, env) {
  const e = {
    type: "screen",
    defaultFontSize: 16,
    hover: "hover",
    pointer: "fine",
    prefersReducedMotion: "no-preference",
    prefersColorScheme: "light",
    ...env,
  };
  const tokens = tokenize(query);
  if (tokens.length === 0) return true;

  // Split at top-level commas. An unclosed "(" swallows the rest of the list.
  const queries = [];
  let current = [];
  let depth = 0;
  let broken = false;
  for (const t of tokens) {
    if (t.type === "," && depth === 0) {
      queries.push({ tokens: current, broken });
      current = [];
      broken = false;
      continue;
    }
    if (t.type === "(" || t.type === "function") depth++;
    else if (t.type === ")") {
      if (depth === 0) broken = true;
      else depth--;
    }
    current.push(t);
  }
  queries.push({ tokens: current, broken: broken || depth !== 0 });
  return queries.some((q) => !q.broken && evaluateQuery(q.tokens, e));
}

// Three-valued (Kleene) logic: and = min, or = max, not = 1 - x.
const T = 1;
const F = 0;
const U = 0.5;

class MediaSyntaxError extends Error {}
const syntaxError = () => {
  throw new MediaSyntaxError("syntax error");
};

function evaluateQuery(tokens, env) {
  try {
    if (tokens.length === 0) syntaxError();
    const reserved = ["and", "or", "not", "only", "layer"];
    const isIdent = (t) => t && t.type === "ident";
    let p = 0;
    let modifier = null;
    if (isIdent(tokens[0]) && (tokens[0].value === "not" || tokens[0].value === "only") && isIdent(tokens[1])) {
      modifier = tokens[0].value;
      p = 1;
    }
    let value;
    if (modifier || (isIdent(tokens[0]) && !reserved.includes(tokens[0].value))) {
      const type = tokens[p++].value;
      if (reserved.includes(type)) syntaxError();
      value = type === "all" || type === env.type ? T : F;
      if (p < tokens.length) {
        if (!isIdent(tokens[p]) || tokens[p].value !== "and") syntaxError();
        value = Math.min(value, parseCondition(tokens.slice(p + 1), false, env));
      }
      if (modifier === "not") value = 1 - value;
    } else {
      value = parseCondition(tokens, true, env);
    }
    return value === T;
  } catch (err) {
    if (err instanceof MediaSyntaxError) return false;
    throw err;
  }
}

// Parses an entire token list as a <media-condition>; throws on a grammar mismatch.
function parseCondition(toks, allowOr, env) {
  let p = 0;
  const term = () => {
    const t = toks[p];
    if (!t || (t.type !== "(" && t.type !== "function")) syntaxError();
    let depth = 0;
    let j = p;
    for (; j < toks.length; j++) {
      if (toks[j].type === "(" || toks[j].type === "function") depth++;
      else if (toks[j].type === ")" && --depth === 0) break;
    }
    if (j >= toks.length) syntaxError();
    const inner = toks.slice(p + 1, j);
    p = j + 1;
    return t.type === "function" ? U : evaluateInParens(inner, env);
  };
  if (toks[0] && toks[0].type === "ident" && toks[0].value === "not") {
    p = 1;
    const v = 1 - term();
    if (p !== toks.length) syntaxError();
    return v;
  }
  let v = term();
  let joiner = null;
  while (p < toks.length) {
    const t = toks[p];
    if (t.type !== "ident" || (t.value !== "and" && t.value !== "or")) syntaxError();
    if (t.value === "or" && !allowOr) syntaxError();
    if (joiner && joiner !== t.value) syntaxError();
    joiner = t.value;
    p++;
    const next = term();
    v = joiner === "and" ? Math.min(v, next) : Math.max(v, next);
  }
  return v;
}

// ( <condition> ) | ( <feature> ) | anything else in parentheses (unknown)
function evaluateInParens(inner, env) {
  try {
    return parseCondition(inner, true, env);
  } catch (err) {
    if (!(err instanceof MediaSyntaxError)) throw err;
  }
  return evaluateFeature(inner, env);
}

const RANGE_FEATURES = {
  width: (env) => env.width,
  height: (env) => env.height,
};
const DISCRETE_FEATURES = {
  orientation: { values: ["portrait", "landscape"], get: (env) => (env.height >= env.width ? "portrait" : "landscape") },
  hover: { values: ["none", "hover"], get: (env) => env.hover },
  pointer: { values: ["none", "coarse", "fine"], get: (env) => env.pointer },
  "prefers-reduced-motion": { values: ["no-preference", "reduce"], get: (env) => env.prefersReducedMotion },
  "prefers-color-scheme": { values: ["light", "dark"], get: (env) => env.prefersColorScheme },
};

function toPx(tok, env) {
  if (!tok || tok.type !== "number") return null;
  if (tok.unit === "px") return tok.value;
  if (tok.unit === "em" || tok.unit === "rem") return tok.value * env.defaultFontSize;
  if (tok.unit === "" && tok.value === 0) return 0;
  return null;
}

function compare(a, op, b) {
  if (op === "<") return a < b;
  if (op === "<=") return a <= b;
  if (op === ">") return a > b;
  if (op === ">=") return a >= b;
  return a === b;
}

function evaluateFeature(t, env) {
  const bool = (b) => (b ? T : F);
  const isRange = (tok) => tok && tok.type === "ident" && tok.value in RANGE_FEATURES;

  // (name): boolean context
  if (t.length === 1 && t[0].type === "ident") {
    const name = t[0].value;
    if (name in RANGE_FEATURES) return bool(RANGE_FEATURES[name](env) !== 0);
    if (name in DISCRETE_FEATURES) {
      const v = DISCRETE_FEATURES[name].get(env);
      return bool(v !== "none" && v !== "no-preference");
    }
    return U;
  }

  // (name: value), with min-/max- prefixes for range features
  if (t.length === 3 && t[0].type === "ident" && t[1].type === ":") {
    const m = /^(min|max)-(.+)$/.exec(t[0].value);
    const prefix = m ? m[1] : null;
    const name = m ? m[2] : t[0].value;
    if (name in RANGE_FEATURES) {
      const px = toPx(t[2], env);
      if (px === null) return U;
      const actual = RANGE_FEATURES[name](env);
      return bool(prefix === "min" ? actual >= px : prefix === "max" ? actual <= px : actual === px);
    }
    if (name in DISCRETE_FEATURES) {
      const feature = DISCRETE_FEATURES[name];
      if (prefix || t[2].type !== "ident" || !feature.values.includes(t[2].value)) return U;
      return bool(feature.get(env) === t[2].value);
    }
    return U;
  }

  // (name op value) | (value op name)
  if (t.length === 3 && t[1].type === "op") {
    if (isRange(t[0])) {
      const px = toPx(t[2], env);
      return px === null ? U : bool(compare(RANGE_FEATURES[t[0].value](env), t[1].value, px));
    }
    if (isRange(t[2])) {
      const px = toPx(t[0], env);
      return px === null ? U : bool(compare(px, t[1].value, RANGE_FEATURES[t[2].value](env)));
    }
    return U;
  }

  // (value op name op value), both operators pointing the same way
  if (t.length === 5 && t[1].type === "op" && t[3].type === "op" && isRange(t[2])) {
    const a = t[1].value;
    const b = t[3].value;
    const lt = (o) => o === "<" || o === "<=";
    const gt = (o) => o === ">" || o === ">=";
    if (!((lt(a) && lt(b)) || (gt(a) && gt(b)))) return U;
    const lo = toPx(t[0], env);
    const hi = toPx(t[4], env);
    if (lo === null || hi === null) return U;
    const actual = RANGE_FEATURES[t[2].value](env);
    return bool(compare(lo, a, actual) && compare(actual, b, hi));
  }

  return U;
}

/**
 * Splits a media query string into tokens (whitespace is skipped):
 * - { type: "ident", value }       identifiers, lower-cased
 * - { type: "function", value }    an identifier immediately followed by "(" (the "(" is part of it)
 * - { type: "number", value, unit } e.g. 600px -> { value: 600, unit: "px" }; unit is "" for bare numbers
 * - { type: "op", value }          "<", "<=", ">", ">=" or "="
 * - { type: "(" }, { type: ")" }, { type: "," }, { type: ":" }
 * - { type: "delim", value }       any other character
 */
function tokenize(str) {
  const tokens = [];
  let i = 0;
  while (i < str.length) {
    const ch = str[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === "(" || ch === ")" || ch === "," || ch === ":") {
      tokens.push({ type: ch });
      i++;
      continue;
    }
    if (ch === "<" || ch === ">") {
      const op = str[i + 1] === "=" ? ch + "=" : ch;
      tokens.push({ type: "op", value: op });
      i += op.length;
      continue;
    }
    if (ch === "=") {
      tokens.push({ type: "op", value: "=" });
      i++;
      continue;
    }
    const num = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)([a-z%]*)/i.exec(str.slice(i));
    if (num) {
      tokens.push({ type: "number", value: parseFloat(num[0]), unit: num[1].toLowerCase() });
      i += num[0].length;
      continue;
    }
    const ident = /^-?[a-z_][\w-]*/i.exec(str.slice(i));
    if (ident) {
      i += ident[0].length;
      if (str[i] === "(") {
        tokens.push({ type: "function", value: ident[0].toLowerCase() });
        i++;
      } else {
        tokens.push({ type: "ident", value: ident[0].toLowerCase() });
      }
      continue;
    }
    tokens.push({ type: "delim", value: ch });
    i++;
  }
  return tokens;
}
