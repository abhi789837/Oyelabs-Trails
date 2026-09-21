/**
 * Simplified App Router matcher.
 * @param {string[]} files  paths relative to app/, e.g. "(shop)/cart/page.tsx"
 * @param {string} url      e.g. "/blog/hello?ref=x"
 * @returns {{ file: string, params: Record<string, string | string[]> } | { error: "conflict", files: string[] } | null}
 */
function matchRoute(files, url) {
  const routes = [];
  const byPattern = new Map();

  for (const file of files) {
    const parts = file.split("/");
    const name = parts.pop();
    if (!/^(page|route)\.[a-z]+$/.test(name)) continue;
    const skip = parts.some((p) => p.startsWith("_") || p.startsWith("@") || /^\(\.{1,3}\)/.test(p));
    if (skip) continue;
    const segments = parts.filter((p) => !/^\(.*\)$/.test(p));
    const pattern = "/" + segments.join("/");
    if (byPattern.has(pattern)) return { error: "conflict", files: [byPattern.get(pattern), file] };
    byPattern.set(pattern, file);
    routes.push({ file, segments: segments.map(parseSegment) });
  }

  routes.sort((a, b) => compareRoutes(a.segments, b.segments));

  const path = url.split(/[?#]/)[0];
  const urlSegments = path.split("/").filter(Boolean).map((s) => decodeURIComponent(s));

  for (const route of routes) {
    const params = tryMatch(route.segments, urlSegments);
    if (params) return { file: route.file, params };
  }
  return null;
}

const RANK = { static: 0, dynamic: 1, catchAll: 2, optionalCatchAll: 3 };

function parseSegment(folder) {
  let m = /^\[\[\.\.\.(.+)\]\]$/.exec(folder);
  if (m) return { type: "optionalCatchAll", name: m[1] };
  m = /^\[\.\.\.(.+)\]$/.exec(folder);
  if (m) return { type: "catchAll", name: m[1] };
  m = /^\[(.+)\]$/.exec(folder);
  if (m) return { type: "dynamic", name: m[1] };
  return { type: "static", name: folder };
}

function compareRoutes(a, b) {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (a[i] === undefined) return -1;
    if (b[i] === undefined) return 1;
    const diff = RANK[a[i].type] - RANK[b[i].type];
    if (diff !== 0) return diff;
    if (a[i].type === "static" && a[i].name !== b[i].name) return a[i].name < b[i].name ? -1 : 1;
  }
  return 0;
}

function tryMatch(segments, urlSegments) {
  const params = {};
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.type === "catchAll" || seg.type === "optionalCatchAll") {
      const rest = urlSegments.slice(i);
      if (seg.type === "catchAll" && rest.length === 0) return null;
      if (rest.length > 0) params[seg.name] = rest;
      return params;
    }
    if (i >= urlSegments.length) return null;
    if (seg.type === "static") {
      if (seg.name !== urlSegments[i]) return null;
    } else {
      params[seg.name] = urlSegments[i];
    }
  }
  return segments.length === urlSegments.length ? params : null;
}
