/**
 * Wraps `value` in a deeply reactive proxy, the way Svelte 5's `$state` does.
 * @param {any} value
 * @param {(path: string[]) => void} onChange called with the property path on every real write
 * @returns {any} the proxy, or `value` itself if it isn't proxyable
 */
function deepState(value, onChange) {
  const cache = new WeakMap();

  const isProxyable = (v) =>
    v !== null && typeof v === "object" && (Array.isArray(v) || Object.getPrototypeOf(v) === Object.prototype);

  function wrap(target, path) {
    if (!isProxyable(target)) return target;
    const existing = cache.get(target);
    if (existing) return existing;
    const proxy = new Proxy(target, {
      get(obj, key) {
        const v = Reflect.get(obj, key);
        if (typeof key === "symbol") return v;
        return wrap(v, path.concat(key));
      },
      set(obj, key, next) {
        const had = Reflect.has(obj, key);
        const prev = Reflect.get(obj, key);
        const ok = Reflect.set(obj, key, next);
        if (ok && typeof key !== "symbol" && (!had || !Object.is(prev, next))) onChange(path.concat(key));
        return ok;
      },
      deleteProperty(obj, key) {
        const had = Reflect.has(obj, key);
        const ok = Reflect.deleteProperty(obj, key);
        if (ok && had && typeof key !== "symbol") onChange(path.concat(key));
        return ok;
      },
    });
    cache.set(target, proxy);
    return proxy;
  }

  return wrap(value, []);
}

/**
 * Returns a plain, proxy-free deep clone of plain objects and arrays.
 * @param {any} value
 */
function snapshot(value) {
  if (Array.isArray(value)) return value.map(snapshot);
  if (value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    const out = {};
    for (const key of Object.keys(value)) out[key] = snapshot(value[key]);
    return out;
  }
  return value;
}

// ---- Test driver (leave as is) ----
class Counter {
  constructor() {
    this.n = 0;
  }
  bump() {
    this.n += 1;
  }
}

function runStateScenario(name) {
  const changes = [];
  const record = (path) => changes.push(path.join("."));

  const scenarios = {
    topLevel() {
      const s = deepState({ count: 0, label: "a" }, record);
      s.count = 1;
      s.count = 2;
      s.label = "a";
      return { changes, count: s.count };
    },
    nested() {
      const s = deepState({ user: { name: "Ada", tags: ["x"] } }, record);
      s.user.name = "Grace";
      s.user.tags.push("y");
      s.user.tags[0] = "z";
      return { changes, tags: snapshot(s.user.tags) };
    },
    sameValue() {
      const s = deepState({ count: 0 }, record);
      s.count = 0;
      s.count = 1;
      s.count = 1;
      return { changes, count: s.count };
    },
    notPlain() {
      const map = new Map([["k", 1]]);
      const date = new Date(0);
      const counter = new Counter();
      const s = deepState({ map, date, counter }, record);
      s.map.set("k", 2);
      s.counter.bump();
      s.date.setTime(5);
      return {
        changes,
        sameMap: s.map === map,
        sameCounter: s.counter === counter,
        isMap: s.map instanceof Map,
        n: s.counter.n,
        mapValue: s.map.get("k"),
      };
    },
    identity() {
      const raw = { user: { name: "Ada" } };
      const s = deepState(raw, record);
      return { stable: s.user === s.user, notRaw: s.user !== raw.user, rootNotRaw: s !== raw };
    },
    arrays() {
      const s = deepState([1, 2], record);
      const isArray = Array.isArray(s);
      s.push(3);
      s[0] = 9;
      return { changes, isArray, value: snapshot(s), length: s.length };
    },
    assignObject() {
      const s = deepState({ user: { name: "Ada" } }, record);
      s.user = { name: "Linus" };
      s.user.name = "Evan";
      return { changes, name: s.user.name };
    },
    deleteKey() {
      const s = deepState({ a: 1, b: 2 }, record);
      delete s.a;
      delete s.a;
      return { changes, keys: Object.keys(s) };
    },
    snapshotIsPlain() {
      const s = deepState({ user: { name: "Ada" }, list: [1, [2]] }, record);
      const snap = snapshot(s);
      snap.user.name = "Grace";
      snap.list[1].push(3);
      return { changes, snap, live: snapshot(s) };
    },
    many() {
      const s = deepState({ n: 0 }, record);
      for (let i = 1; i <= 1000; i++) s.n = i;
      return { count: changes.length, n: s.n };
    },
  };

  if (!scenarios[name]) throw new Error("Unknown scenario " + name);
  return scenarios[name]();
}
