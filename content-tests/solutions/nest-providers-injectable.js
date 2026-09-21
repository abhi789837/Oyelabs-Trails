/**
 * @param {Array<object>} providers
 * @returns {{ get(token: string): unknown }}
 */
function createContainer(providers) {
  const registry = new Map();
  for (const provider of providers) registry.set(provider.provide, provider); // last one wins
  const singletons = new Map();
  const stack = []; // tokens currently being resolved, outermost first

  function resolve(token, consumerCache) {
    const provider = registry.get(token);
    if (!provider) throw new Error('No provider for "' + token + '"');
    if (stack.includes(token)) throw new Error("Circular dependency: " + [...stack, token].join(" -> "));
    if ("useValue" in provider) return provider.useValue;
    if ("useExisting" in provider) {
      stack.push(token);
      try {
        return resolve(provider.useExisting, consumerCache);
      } finally {
        stack.pop();
      }
    }
    const transient = provider.scope === "transient";
    if (!transient && singletons.has(token)) return singletons.get(token);
    if (transient && consumerCache.has(token)) return consumerCache.get(token);

    stack.push(token);
    try {
      // Transient dependencies are shared within this one consumer, fresh for every other consumer.
      const ownCache = new Map();
      const list = provider.useClass ? provider.deps || [] : provider.inject || [];
      const args = list.map((dep) => {
        const isObject = typeof dep === "object" && dep !== null;
        const depToken = isObject ? dep.token : dep;
        if (isObject && dep.optional && !registry.has(depToken)) return undefined;
        return resolve(depToken, ownCache);
      });
      const instance = provider.useClass ? new provider.useClass(...args) : provider.useFactory(...args);
      if (transient) consumerCache.set(token, instance);
      else singletons.set(token, instance);
      return instance;
    } finally {
      stack.pop();
    }
  }

  return { get: (token) => resolve(token, new Map()) };
}

// ---- Test driver (leave as is) ----
// defs: [{ provide, kind: "class" | "factory" | "value" | "existing", deps?, inject?, scope?, value?, target? }]
// steps: ["get", token] | ["same", tokenA, tokenB] | ["created", token]
// Instances are described as Name#n(dep,dep,...), where n counts how many times Name was constructed.
function runContainerScenario(defs, steps) {
  const created = {};
  const labels = new WeakMap();
  const track = (name, instance, args) => {
    created[name] = (created[name] || 0) + 1;
    labels.set(instance, { label: name + "#" + created[name], args });
    return instance;
  };
  const makeClass = (name) =>
    class {
      constructor(...args) {
        track(name, this, args);
      }
    };
  const makeFactory = (name) => (...args) => track(name, {}, args);
  const providers = defs.map((d) => {
    const p = { provide: d.provide };
    if (d.kind === "value") p.useValue = d.value;
    else if (d.kind === "existing") p.useExisting = d.target;
    else if (d.kind === "class") p.useClass = makeClass(d.provide);
    else p.useFactory = makeFactory(d.provide);
    if (d.deps) p.deps = d.deps;
    if (d.inject) p.inject = d.inject;
    if (d.scope) p.scope = d.scope;
    return p;
  });
  const describe = (v) => {
    const meta = v !== null && typeof v === "object" ? labels.get(v) : undefined;
    if (meta) return meta.args.length ? meta.label + "(" + meta.args.map(describe).join(",") + ")" : meta.label;
    return v === undefined ? "undefined" : JSON.stringify(v);
  };
  const container = createContainer(providers);
  const log = [];
  const attempt = (fn) => {
    try {
      log.push(fn());
    } catch (err) {
      log.push("error: " + (err && err.message));
    }
  };
  for (const [op, a, b] of steps) {
    if (op === "get") attempt(() => describe(container.get(a)));
    else if (op === "same") attempt(() => "same:" + (container.get(a) === container.get(b)));
    else if (op === "created") log.push("created:" + a + "=" + (created[a] || 0));
  }
  return log;
}
