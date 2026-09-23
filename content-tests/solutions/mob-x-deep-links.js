/**
 * Route an incoming https deep link to the most specific matching pattern.
 *
 * @param {string[]} patterns
 * @param {string} url
 * @returns {{ pattern: string, params: Record<string, string>, query: Record<string, string> } | null}
 */
function matchDeepLink(patterns, url) {
  const { segments, query } = parseUrl(url);

  let best = null;
  let bestIndex = -1;
  for (const [index, pattern] of patterns.entries()) {
    const params = matchPattern(pattern, segments);
    if (!params) continue;
    if (best === null || moreSpecific(pattern, best) > 0) {
      best = pattern;
      bestIndex = index;
    }
  }
  if (best === null) return null;
  return { pattern: best, params: matchPattern(best, segments), query };
}

function matchPattern(pattern, segments) {
  const parts = splitPattern(pattern);
  const params = {};
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === "*") {
      params.rest = segments.slice(i).join("/");
      return params;
    }
    if (i >= segments.length) return null;
    if (part.startsWith(":")) params[part.slice(1)] = segments[i];
    else if (part !== segments[i]) return null;
  }
  return parts.length === segments.length ? params : null;
}

function moreSpecific(a, b) {
  const pa = splitPattern(a);
  const pb = splitPattern(b);
  const score = (p) => (p === "*" ? 0 : p.startsWith(":") ? 1 : 2);
  const shared = Math.min(pa.length, pb.length);
  for (let i = 0; i < shared; i++) {
    const diff = score(pa[i]) - score(pb[i]);
    if (diff !== 0) return diff;
  }
  return pa.length - pb.length;
}

// ---- Test driver (leave as is) ----
function splitPattern(pattern) {
  return pattern.split("/").filter((s) => s.length > 0);
}

function parseUrl(url) {
  let rest = url.replace(/^https:\/\//, "");
  const hash = rest.indexOf("#");
  if (hash >= 0) rest = rest.slice(0, hash);
  let queryString = "";
  const q = rest.indexOf("?");
  if (q >= 0) {
    queryString = rest.slice(q + 1);
    rest = rest.slice(0, q);
  }
  const slash = rest.indexOf("/");
  const path = slash >= 0 ? rest.slice(slash) : "";
  const segments = path.split("/").filter((s) => s.length > 0).map(decodeURIComponent);
  const query = {};
  for (const pair of queryString.split("&")) {
    if (!pair) continue;
    const eq = pair.indexOf("=");
    const key = decodeURIComponent(eq >= 0 ? pair.slice(0, eq) : pair);
    query[key] = eq >= 0 ? decodeURIComponent(pair.slice(eq + 1)) : "";
  }
  return { segments, query };
}
