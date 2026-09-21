// target -> key -> Set<effect>
const targetMap = new WeakMap();
// raw object -> its proxy, so the same object always yields the same proxy
const proxyMap = new WeakMap();
const IS_PROXY = Symbol("isProxy");
let activeEffect = null;
const effectStack = [];

function track(target, key) {
  if (!activeEffect) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) targetMap.set(target, (depsMap = new Map()));
  let dep = depsMap.get(key);
  if (!dep) depsMap.set(key, (dep = new Set()));
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}

function trigger(target, key, extraKey) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const toRun = new Set();
  const add = (dep) => {
    if (dep) dep.forEach((e) => { if (e !== activeEffect) toRun.add(e); });
  };
  add(depsMap.get(key));
  if (extraKey !== undefined) add(depsMap.get(extraKey));
  // Iterate a copy: re-running an effect removes and re-adds it to the live sets.
  toRun.forEach((e) => (e.scheduler ? e.scheduler() : e.run()));
}

/**
 * Returns a reactive Proxy of target: reads are tracked, writes trigger effects.
 * @param {object} target
 */
function reactive(target) {
  if (target === null || typeof target !== "object") return target;
  if (target[IS_PROXY]) return target;
  const existing = proxyMap.get(target);
  if (existing) return existing;
  const proxy = new Proxy(target, {
    get(t, key, receiver) {
      if (key === IS_PROXY) return true;
      const value = Reflect.get(t, key, receiver);
      if (typeof key !== "symbol") track(t, key);
      // Lazily wrap nested objects on access.
      return value !== null && typeof value === "object" ? reactive(value) : value;
    },
    set(t, key, value, receiver) {
      const hadKey = Array.isArray(t) && /^\d+$/.test(String(key))
        ? Number(key) < t.length
        : Object.prototype.hasOwnProperty.call(t, key);
      const old = t[key];
      const ok = Reflect.set(t, key, value, receiver);
      if (!hadKey) {
        // Adding an array index changes its length implicitly.
        trigger(t, key, Array.isArray(t) ? "length" : undefined);
      } else if (!Object.is(old, value)) {
        trigger(t, key);
      }
      return ok;
    },
    deleteProperty(t, key) {
      const had = Object.prototype.hasOwnProperty.call(t, key);
      const ok = Reflect.deleteProperty(t, key);
      if (had && ok) trigger(t, key);
      return ok;
    },
  });
  proxyMap.set(target, proxy);
  return proxy;
}

function createEffect(fn, scheduler) {
  const e = {
    deps: [],
    active: true,
    scheduler,
    run() {
      if (!e.active) return fn();
      // Clean up: dependencies are re-collected on every run.
      e.deps.forEach((dep) => dep.delete(e));
      e.deps.length = 0;
      effectStack.push(e);
      activeEffect = e;
      try {
        return fn();
      } finally {
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1] || null;
      }
    },
    stop() {
      if (!e.active) return;
      e.deps.forEach((dep) => dep.delete(e));
      e.deps.length = 0;
      e.active = false;
    },
  };
  return e;
}

/**
 * Runs fn now, and again whenever a reactive property it read changes.
 * @param {Function} fn
 * @returns {Function} stop() - unsubscribes the effect
 */
function effect(fn) {
  const e = createEffect(fn);
  e.run();
  return function stop() {
    e.stop();
  };
}

/**
 * Returns { value } that is lazy, cached until a dependency changes, and trackable by effects.
 * @param {Function} getter
 */
function computed(getter) {
  let dirty = true;
  let cached;
  const obj = {
    get value() {
      if (dirty) {
        cached = inner.run();
        dirty = false;
      }
      track(obj, "value");
      return cached;
    },
  };
  // Don't recompute on change: just mark dirty and notify whoever read `.value`.
  const inner = createEffect(getter, () => {
    if (!dirty) {
      dirty = true;
      trigger(obj, "value");
    }
  });
  return obj;
}

// ---- Test driver (leave as is) ----
// Each scenario uses reactive/effect/computed and returns plain data.
function runReactivityScenario(name) {
  const scenarios = {
    basic() {
      const state = reactive({ count: 0 });
      const seen = [];
      effect(() => seen.push(state.count));
      state.count = 1;
      state.count = 2;
      return seen;
    },
    unrelatedKey() {
      const state = reactive({ a: 1, b: 1 });
      let runs = 0;
      effect(() => {
        runs++;
        return state.a;
      });
      state.b = 2;
      state.b = 3;
      state.a = 5;
      return runs;
    },
    sameValue() {
      const state = reactive({ count: 0, label: "x" });
      let runs = 0;
      effect(() => {
        runs++;
        return state.count + state.label;
      });
      state.count = 0;
      state.label = "x";
      return runs;
    },
    nested() {
      const raw = { user: { name: "Ada" } };
      const state = reactive(raw);
      const names = [];
      effect(() => names.push(state.user.name));
      state.user.name = "Grace";
      state.user = { name: "Linus" };
      state.user.name = "Evan";
      return {
        names,
        sameProxy: reactive(raw) === state,
        proxyIsNotRaw: state !== raw,
        sameNestedProxy: state.user === state.user,
      };
    },
    branchCleanup() {
      const state = reactive({ ok: true, text: "hello" });
      let runs = 0;
      const seen = [];
      effect(() => {
        runs++;
        seen.push(state.ok ? state.text : "off");
      });
      state.ok = false;
      state.text = "changed";
      state.ok = true;
      return { runs, seen };
    },
    computedLazy() {
      const state = reactive({ count: 1 });
      let getterRuns = 0;
      const double = computed(() => {
        getterRuns++;
        return state.count * 2;
      });
      const log = [getterRuns];
      log.push(double.value, double.value, getterRuns);
      state.count = 5;
      log.push(getterRuns);
      log.push(double.value, getterRuns);
      return log;
    },
    computedInEffect() {
      const state = reactive({ count: 1, other: 0 });
      const double = computed(() => state.count * 2);
      const seen = [];
      effect(() => seen.push(double.value));
      state.count = 2;
      state.other = 1;
      state.count = 3;
      return seen;
    },
    selfMutation() {
      const state = reactive({ count: 0 });
      let runs = 0;
      effect(() => {
        runs++;
        state.count = state.count + 1;
      });
      const afterCreate = [runs, state.count];
      state.count = 10;
      return { afterCreate, runs, count: state.count };
    },
    stop() {
      const state = reactive({ count: 0 });
      let runs = 0;
      const stopIt = effect(() => {
        runs++;
        return state.count;
      });
      state.count = 1;
      stopIt();
      state.count = 2;
      state.count = 3;
      return runs;
    },
    newKey() {
      const state = reactive({});
      const seen = [];
      effect(() => seen.push(state.later === undefined ? "missing" : state.later));
      state.later = "here";
      return seen;
    },
    arrayPush() {
      const list = reactive([1, 2]);
      const seen = [];
      effect(() => seen.push(list.join(",")));
      list.push(3);
      list[0] = 9;
      return seen;
    },
    nestedEffects() {
      const state = reactive({ a: 1, b: 1 });
      const log = [];
      effect(() => {
        effect(() => log.push("inner:" + state.b));
        log.push("outer:" + state.a);
      });
      state.a = 2;
      return log;
    },
    manyEffects() {
      const state = reactive({});
      for (let i = 0; i < 1000; i++) state["k" + i] = 0;
      let runs = 0;
      for (let i = 0; i < 1000; i++) {
        effect(() => {
          runs++;
          return state["k" + i];
        });
      }
      state.k500 = 1;
      return runs;
    },
  };
  if (!scenarios[name]) throw new Error("Unknown scenario " + name);
  return scenarios[name]();
}
