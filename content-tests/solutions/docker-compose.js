/**
 * Work out what `docker compose up` starts, and in which order.
 * @param {Record<string, { depends_on?: string[] | Record<string, { condition?: string, required?: boolean }>, profiles?: string[], healthcheck?: object }>} services
 * @param {string[]} targets services named on the command line (empty = every enabled service)
 * @param {string[]} profiles profiles enabled with --profile
 * @returns {{ waves: string[][], warnings: string[] } | { error: string }}
 */
function planStartup(services, targets, profiles) {
  const deps = (name) => {
    const d = services[name].depends_on ?? [];
    if (Array.isArray(d)) return d.map((dep) => ({ dep, condition: "service_started", required: true }));
    return Object.keys(d).map((dep) => ({
      dep,
      condition: d[dep]?.condition ?? "service_started",
      required: d[dep]?.required !== false,
    }));
  };
  for (const t of targets) if (!services[t]) return { error: `unknown service "${t}"` };
  const active = new Set(profiles);
  for (const t of targets) for (const p of services[t].profiles ?? []) active.add(p);
  const enabled = (name) => {
    const p = services[name].profiles ?? [];
    return p.length === 0 || p.some((x) => active.has(x));
  };

  const selected = new Set();
  const warnings = [];
  const edges = new Map();
  const queue = targets.length ? [...targets] : Object.keys(services).filter(enabled);
  while (queue.length) {
    const name = queue.shift();
    if (selected.has(name)) continue;
    selected.add(name);
    const kept = [];
    for (const { dep, condition, required } of deps(name)) {
      if (!services[dep]) return { error: `service "${name}" depends on undefined service "${dep}"` };
      if (!enabled(dep)) {
        if (required) return { error: `service "${name}" depends on "${dep}", which is not enabled by the active profiles` };
        warnings.push(`optional dependency "${dep}" of "${name}" is not enabled; skipping`);
        continue;
      }
      if (condition === "service_healthy" && !services[dep].healthcheck) {
        return { error: `"${name}" waits for "${dep}" to be healthy, but "${dep}" has no healthcheck` };
      }
      kept.push(dep);
      queue.push(dep);
    }
    edges.set(name, kept);
  }

  // Cycle detection (DFS with colours), reported starting at the alphabetically smallest member.
  const state = new Map();
  const stack = [];
  let cycle = null;
  const dfs = (n) => {
    state.set(n, 1);
    stack.push(n);
    for (const d of [...edges.get(n)].sort()) {
      if (cycle) return;
      if (state.get(d) === 1) {
        cycle = stack.slice(stack.indexOf(d));
        return;
      }
      if (!state.has(d)) dfs(d);
    }
    stack.pop();
    state.set(n, 2);
  };
  for (const n of [...selected].sort()) {
    if (cycle) break;
    if (!state.has(n)) dfs(n);
  }
  if (cycle) {
    const min = cycle.indexOf([...cycle].sort()[0]);
    const rotated = [...cycle.slice(min), ...cycle.slice(0, min)];
    return { error: `dependency cycle: ${[...rotated, rotated[0]].join(" -> ")}` };
  }

  const level = new Map();
  const depth = (n) => {
    if (level.has(n)) return level.get(n);
    const l = edges.get(n).reduce((m, d) => Math.max(m, depth(d) + 1), 0);
    level.set(n, l);
    return l;
  };
  const waves = [];
  for (const n of selected) {
    const l = depth(n);
    (waves[l] ??= []).push(n);
  }
  return { waves: waves.map((w) => w.sort()), warnings: warnings.sort() };
}
