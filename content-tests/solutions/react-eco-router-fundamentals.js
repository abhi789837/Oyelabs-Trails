/**
 * @param {Array} routes
 * @param {string} pathname
 * @returns {{ ids: string[], params: Record<string, string> } | null}
 */
function matchRoutes(routes, pathname) {
  const toSegments = (path) => String(path || "").split("/").filter(Boolean);
  const decode = (segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  };

  // 1. Flatten the config into branches (depth-first, children before the route itself).
  const branches = [];
  const walk = (list, parents, parentSegments) => {
    for (const route of list || []) {
      const segments = parentSegments.concat(toSegments(route.path));
      const chain = parents.concat(route);
      if (route.children && route.children.length) walk(route.children, chain, segments);
      if (route.path != null || route.index) branches.push({ chain, segments, index: !!route.index, order: branches.length });
    }
  };
  walk(routes, [], []);

  // 2. Score each branch.
  const score = (b) => {
    const hasSplat = b.segments.includes("*");
    let s = b.segments.length + (hasSplat ? -2 : 0) + (b.index ? 2 : 0);
    for (const seg of b.segments) {
      if (seg === "*") continue;
      s += seg.startsWith(":") ? 3 : 10;
    }
    return s;
  };

  const urlSegments = toSegments(pathname);
  let best = null;
  for (const branch of branches) {
    const params = matchBranch(branch.segments, urlSegments);
    if (!params) continue;
    const s = score(branch);
    if (!best || s > best.score) best = { score: s, branch, params };
  }
  if (!best) return null;
  return { ids: best.branch.chain.map((r) => r.id), params: best.params };

  function matchBranch(pattern, url) {
    const params = {};
    for (let i = 0; i < pattern.length; i++) {
      const seg = pattern[i];
      if (seg === "*") {
        params["*"] = url.slice(i).map(decode).join("/");
        return params;
      }
      if (i >= url.length) return null;
      if (seg.startsWith(":")) params[seg.slice(1)] = decode(url[i]);
      else if (seg.toLowerCase() !== url[i].toLowerCase()) return null;
    }
    return pattern.length === url.length ? params : null;
  }
}
