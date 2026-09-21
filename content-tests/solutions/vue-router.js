/**
 * Compiles route records into a matcher.
 * @param {{ path: string, name: string, meta: object, beforeEnter?: Function }[]} routes
 * @returns {{ resolve(path: string): null | { name: string, path: string, params: object, meta: object, record: object } }}
 */
function createMatcher(routes) {
  const PARAM = /^:(\w+)(?:\((.*)\))?([?+*])?$/;
  const splitPath = (p) => p.split("/").filter(Boolean);
  const decode = (s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };

  const compiled = routes.map((record, order) => {
    const tokens = splitPath(record.path).map((seg) => {
      const m = PARAM.exec(seg);
      if (!m) return { type: "static", value: seg.toLowerCase(), score: 4 };
      const [, name, source, modifier] = m;
      const regex = new RegExp("^(?:" + (source || "[^/]+") + ")$");
      let score = source ? 3 : 2;
      if (modifier === "?") score = 1;
      if (modifier === "+" || modifier === "*") score = 0;
      return { type: "param", name, source: source || "", regex, modifier: modifier || "", score };
    });
    return { record, order, tokens, scores: tokens.map((t) => t.score) };
  });

  function match(route, segments) {
    const params = {};
    let i = 0;
    for (const t of route.tokens) {
      if (t.type === "static") {
        if (i >= segments.length || segments[i].toLowerCase() !== t.value) return null;
        i++;
      } else if (t.modifier === "+" || t.modifier === "*") {
        const rest = segments.slice(i);
        if (t.modifier === "+" && rest.length === 0) return null;
        if (!rest.every((s) => t.regex.test(s))) return null;
        params[t.name] = rest.map(decode);
        i = segments.length;
      } else if (i >= segments.length) {
        if (t.modifier !== "?") return null;
      } else {
        if (!t.regex.test(segments[i])) return null;
        params[t.name] = decode(segments[i]);
        i++;
      }
    }
    return i === segments.length ? params : null;
  }

  // Positive if a should win over b.
  function compare(a, b) {
    const n = Math.min(a.scores.length, b.scores.length);
    for (let k = 0; k < n; k++) {
      if (a.scores[k] !== b.scores[k]) return a.scores[k] - b.scores[k];
    }
    if (a.scores.length !== b.scores.length) {
      // One is a prefix of the other: the longer wins, unless its extra last segment is a catch-all.
      const longer = a.scores.length > b.scores.length ? a : b;
      const last = longer.tokens[longer.tokens.length - 1];
      const longerWins = !(last.type === "param" && last.source === ".*");
      return (longer === a) === longerWins ? 1 : -1;
    }
    return b.order - a.order; // defined first wins
  }

  return {
    resolve(path) {
      const segments = splitPath(path);
      let best = null;
      let bestParams = null;
      for (const route of compiled) {
        const params = match(route, segments);
        if (params && (!best || compare(route, best) > 0)) {
          best = route;
          bestParams = params;
        }
      }
      if (!best) return null;
      return {
        name: best.record.name,
        path: "/" + segments.join("/"),
        params: bestParams,
        meta: best.record.meta || {},
        record: best.record,
      };
    },
  };
}

/**
 * Runs one navigation to toPath, starting at the resolved route "from" (null at start), through the guards.
 * @returns {Promise<object>} { status: "ok", name, path, params, redirectedFrom? } | { status: "aborted" }
 *   | { status: "duplicated" } | { status: "not-found", path } | { status: "error", message }
 */
async function navigate(matcher, toPath, from, guards) {
  const MAX_REDIRECTS = 10;
  let target = toPath;
  let redirects = 0;
  let redirectedFrom;

  attempt: for (;;) {
    const to = matcher.resolve(target);
    if (!to) return { status: "not-found", path: target };
    if (from && to.path === from.path) return { status: "duplicated" };

    const pipeline = guards.slice();
    if (to.record.beforeEnter && (!from || from.name !== to.name)) pipeline.push(to.record.beforeEnter);

    for (const guard of pipeline) {
      let result;
      try {
        result = await guard(to, from);
      } catch (err) {
        return { status: "error", message: err && err.message ? err.message : String(err) };
      }
      if (result === false) return { status: "aborted" };
      if (typeof result === "string") {
        if (++redirects > MAX_REDIRECTS) return { status: "error", message: "Too many redirects" };
        if (redirectedFrom === undefined) redirectedFrom = to.path;
        target = result;
        continue attempt;
      }
      // undefined or true: this guard validated the navigation
    }

    const ok = { status: "ok", name: to.name, path: to.path, params: to.params };
    if (redirectedFrom !== undefined) ok.redirectedFrom = redirectedFrom;
    return ok;
  }
}

// ---- Test driver (leave as is) ----
// routes: [{ path, name, meta?, beforeEnter?: rule }]; guards: global beforeEach rules, in order.
// A rule is { if: condition, then: action, async?: true }. Every key in the condition must hold:
//   { always: true } | { name } | { meta } (to.meta[meta] is truthy) | { loggedOut: true }
//   | { paramEquals: [param, value] } | { fromName }
// Actions: { allow: true } returns true, { abort: true } returns false,
//   { redirect: path } returns the path, { throw: message } throws an Error.
// navigations: paths to navigate to in order, or { login: true } / { logout: true }.
// Returns { results, log }; log records every guard call as "g<index>:<path>" or "enter:<path>".
async function runRouterScenario(routes, guards, navigations) {
  const session = { loggedIn: false };
  const log = [];
  const holds = (cond, to, from) => {
    if (cond.name !== undefined && to.name !== cond.name) return false;
    if (cond.meta !== undefined && !(to.meta && to.meta[cond.meta])) return false;
    if (cond.loggedOut && session.loggedIn) return false;
    if (cond.paramEquals && to.params[cond.paramEquals[0]] !== cond.paramEquals[1]) return false;
    if (cond.fromName !== undefined && !(from && from.name === cond.fromName)) return false;
    return true;
  };
  const toGuard = (rule, label) => (to, from) => {
    log.push(label + ":" + to.path);
    const decide = () => {
      if (!holds(rule.if, to, from)) return undefined;
      const action = rule.then;
      if (action.throw) throw new Error(action.throw);
      if (action.abort) return false;
      if (action.redirect) return action.redirect;
      if (action.allow) return true;
      return undefined;
    };
    return rule.async ? Promise.resolve().then(decide) : decide();
  };
  const records = routes.map((r) => ({
    path: r.path,
    name: r.name,
    meta: r.meta || {},
    beforeEnter: r.beforeEnter ? toGuard(r.beforeEnter, "enter") : undefined,
  }));
  const matcher = createMatcher(records);
  const guardFns = guards.map((rule, i) => toGuard(rule, "g" + i));
  let current = null;
  const results = [];
  for (const nav of navigations) {
    if (nav && typeof nav === "object") {
      session.loggedIn = Boolean(nav.login);
      continue;
    }
    const r = await navigate(matcher, nav, current, guardFns);
    const out = { status: r.status };
    if (r.status === "ok") {
      out.name = r.name;
      out.path = r.path;
      out.params = r.params;
      if (r.redirectedFrom) out.redirectedFrom = r.redirectedFrom;
      current = matcher.resolve(r.path);
    } else if (r.status === "error") out.message = r.message;
    else if (r.status === "not-found") out.path = r.path;
    results.push(out);
  }
  return { results, log };
}
