import type { Module } from "@/types/curriculum";

// Route records shared by several Vue Router challenge test cases (plain data).
const ROUTER_AUTH_ROUTES = [
  { path: "/", name: "home" },
  { path: "/login", name: "login" },
  { path: "/admin", name: "admin", meta: { requiresAuth: true } },
];

// Starter code for the code challenges, kept out of the topic objects for readability.
const REACTIVITY_STARTER = `/**
 * Returns a reactive Proxy of target: reads are tracked, writes trigger effects.
 * @param {object} target
 */
function reactive(target) {
  // Your code here (this placeholder tracks nothing)
  return target;
}

/**
 * Runs fn now, and again whenever a reactive property it read changes.
 * @param {Function} fn
 * @returns {Function} stop() - unsubscribes the effect
 */
function effect(fn) {
  // Your code here
  fn();
  return function stop() {};
}

/**
 * Returns { value } that is lazy, cached until a dependency changes, and trackable by effects.
 * @param {Function} getter
 */
function computed(getter) {
  // Your code here
  return {
    get value() {
      return getter();
    },
  };
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
`;

const SCHEDULER_STARTER = `/**
 * A Vue-style update scheduler.
 * @param {(fn: Function) => void} defer schedules fn as a microtask (use it instead of Promise.resolve().then)
 * @returns {{ queueJob: Function, queuePostFlushCb: Function, nextTick: Function }}
 */
function createScheduler(defer) {
  // Your code here (this placeholder runs everything immediately, with no batching)
  return {
    queueJob(job) {
      job();
    },
    queuePostFlushCb(cb) {
      cb();
    },
    nextTick(fn) {
      defer(fn);
    },
  };
}

// ---- Test driver (leave as is) ----
// ops:
//   ["job", name, id, nestedOps?]    queueJob(job): e.g. a component's update ("render:Parent")
//   ["pre", name, id, nestedOps?]    queueJob(job) with job.pre = true: a flush: "pre" watcher
//   ["post", name, id?, nestedOps?]  queuePostFlushCb(cb): onMounted/onUpdated, flush: "post" watchers
//   ["tick", name, nestedOps?]       nextTick(fn)
//   ["mark", name]                   logs name right away (synchronous code)
//   ["drain"]                        runs every pending microtask now
// When a job or callback runs it logs its name, then performs its nested ops.
// The same kind + name is always the same function object. Returns the log.
function runSchedulerScenario(ops) {
  const microtasks = [];
  const defer = (fn) => {
    microtasks.push(fn);
  };
  const drain = () => {
    let guard = 0;
    while (microtasks.length) {
      if (++guard > 100000) throw new Error("Too many microtasks");
      microtasks.shift()();
    }
  };
  const scheduler = createScheduler(defer);
  const log = [];
  const fns = new Map();
  let runs = 0;
  const getFn = (kind, name, id, nested) => {
    const key = kind + ":" + name;
    if (!fns.has(key)) {
      const fn = function () {
        if (++runs > 100000) throw new Error("Too many runs");
        log.push(name);
        perform(fn.nested);
      };
      if (typeof id === "number") fn.id = id;
      if (kind === "pre") fn.pre = true;
      fn.nested = nested || [];
      fns.set(key, fn);
    }
    return fns.get(key);
  };
  function perform(list) {
    for (const op of list) {
      const [type, name, a, b] = op;
      if (type === "job" || type === "pre") scheduler.queueJob(getFn(type, name, a, b));
      else if (type === "post") scheduler.queuePostFlushCb(getFn("post", name, a, b));
      else if (type === "tick") {
        scheduler.nextTick(() => {
          log.push(name);
          perform(a || []);
        });
      } else if (type === "mark") log.push(name);
      else if (type === "drain") drain();
      else throw new Error("Unknown op " + type);
    }
  }
  perform(ops);
  drain();
  return log;
}
`;

const ROUTER_STARTER = `/**
 * Compiles route records into a matcher.
 * @param {{ path: string, name: string, meta: object, beforeEnter?: Function }[]} routes
 * @returns {{ resolve(path: string): null | { name: string, path: string, params: object, meta: object, record: object } }}
 */
function createMatcher(routes) {
  // Your code here (this placeholder only matches paths exactly)
  return {
    resolve(path) {
      const record = routes.find((r) => r.path === path);
      return record ? { name: record.name, path, params: {}, meta: record.meta, record } : null;
    },
  };
}

/**
 * Runs one navigation to toPath, starting at the resolved route "from" (null at start), through the guards.
 * @returns {Promise<object>} { status: "ok", name, path, params, redirectedFrom? } | { status: "aborted" }
 *   | { status: "duplicated" } | { status: "not-found", path } | { status: "error", message }
 */
async function navigate(matcher, toPath, from, guards) {
  // Your code here
  const to = matcher.resolve(toPath);
  if (!to) return { status: "not-found", path: toPath };
  return { status: "ok", name: to.name, path: to.path, params: to.params };
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
`;

const STORE_STARTER = `/**
 * @returns {{ use(plugin: Function): object }} a registry that owns one instance of each store
 */
function createPinia() {
  // Your code here
  return { use() {} };
}

/**
 * Defines an option store.
 * @param {string} id
 * @param {{ state?: () => object, getters?: object, actions?: object }} options
 * @returns {(pinia: object) => object} useStore(pinia)
 */
function defineStore(id, options) {
  // Your code here (this placeholder only copies the initial state)
  return function useStore(pinia) {
    return { $id: id, ...(options.state ? options.state() : {}) };
  };
}

// ---- Test driver (leave as is) ----
// Each scenario uses createPinia/defineStore and returns plain data (some scenarios are async).
function runStoreScenario(name) {
  const useCounter = defineStore("counter", {
    state: () => ({ count: 0, name: "Eduardo", items: [], user: { name: "Ada", age: 36 }, tags: ["a"] }),
    getters: {
      double: (state) => state.count * 2,
      quadruple() {
        return this.double * 2;
      },
    },
    actions: {
      increment(by = 1) {
        this.count += by;
        return this.count;
      },
      fail() {
        throw new Error("nope");
      },
      async load(value) {
        await Promise.resolve();
        this.name = value;
        return "loaded " + value;
      },
      async loadFail() {
        await Promise.resolve();
        throw new Error("network");
      },
    },
  });
  const watchActions = (store, log) =>
    store.$onAction(({ name, args, after, onError }) => {
      log.push("before " + name + " " + JSON.stringify(args));
      after((result) => log.push("after " + name + " = " + result));
      onError((error) => log.push("error " + name + ": " + error.message));
    });

  const scenarios = {
    stateGettersActions() {
      const store = useCounter(createPinia());
      store.increment();
      store.increment(2);
      return { id: store.$id, count: store.count, double: store.double, quadruple: store.quadruple };
    },
    destructuredAction() {
      const store = useCounter(createPinia());
      const { increment } = store;
      increment();
      increment();
      return store.count;
    },
    singleton() {
      const p1 = createPinia();
      const p2 = createPinia();
      const a = useCounter(p1);
      const b = useCounter(p1);
      const c = useCounter(p2);
      a.increment();
      return { same: a === b, separate: a !== c, bCount: b.count, cCount: c.count };
    },
    directSubscribe() {
      const store = useCounter(createPinia());
      const log = [];
      store.$subscribe((mutation, state) => log.push([mutation.type, mutation.storeId, state.count, "payload" in mutation]));
      store.count = 1;
      store.count = 1;
      store.name = "Evan";
      store.increment();
      return log;
    },
    patchObject() {
      const store = useCounter(createPinia());
      const log = [];
      store.$subscribe((mutation) => log.push([mutation.type, mutation.payload]));
      store.$patch({ count: 5, user: { name: "Grace" }, tags: ["b"] });
      return { log, count: store.count, user: store.user, tags: store.tags };
    },
    patchFunction() {
      const store = useCounter(createPinia());
      const log = [];
      store.$subscribe((mutation) => log.push([mutation.type, "payload" in mutation]));
      store.$patch((state) => {
        state.count++;
        state.items.push("x");
        state.name = "Pinia";
      });
      return { log, count: store.count, items: store.items, name: store.name };
    },
    reset() {
      let stateCalls = 0;
      const useList = defineStore("list", {
        state: () => {
          stateCalls++;
          return { n: 0, list: [] };
        },
      });
      const store = useList(createPinia());
      store.list.push(1);
      store.n = 5;
      const before = store.list;
      const log = [];
      store.$subscribe((mutation) => log.push(mutation.type));
      store.$reset();
      return { n: store.n, list: store.list, freshArray: store.list !== before, log, stateCalls };
    },
    stateSetter() {
      const store = useCounter(createPinia());
      const log = [];
      store.$subscribe((mutation) => log.push([mutation.type, "payload" in mutation]));
      store.$state = { count: 9, user: { name: "Zoe" } };
      return { log, count: store.count, name: store.name, user: store.user };
    },
    unsubscribe() {
      const store = useCounter(createPinia());
      let calls = 0;
      const off = store.$subscribe(() => calls++);
      store.count = 1;
      off();
      off();
      store.count = 2;
      store.$patch({ count: 3 });
      return calls;
    },
    onActionSync() {
      const store = useCounter(createPinia());
      const log = [];
      watchActions(store, log);
      store.increment(5);
      try {
        store.fail();
      } catch (e) {
        log.push("caught " + e.message);
      }
      return log;
    },
    async onActionAsync() {
      const store = useCounter(createPinia());
      const log = [];
      watchActions(store, log);
      const pending = store.load("data");
      log.push("called");
      log.push("resolved " + (await pending));
      try {
        await store.loadFail();
      } catch (e) {
        log.push("caught " + e.message);
      }
      return { log, name: store.name };
    },
    plugin() {
      const pinia = createPinia();
      const early = defineStore("early", { state: () => ({ v: 1 }) })(pinia);
      pinia.use(({ store }) => ({ secret: store.$id + "-secret" }));
      const late = useCounter(pinia);
      return { late: late.secret, earlyHasIt: early.secret !== undefined };
    },
  };
  if (!scenarios[name]) throw new Error("Unknown scenario " + name);
  return scenarios[name]();
}
`;

export default {
  id: "fe-vue",
  trackId: "frontend",
  name: "Vue.js",
  description:
    "Vue 3.5 with the Composition API, for engineers who already ship React or plain JavaScript: the Proxy-based reactivity system (you'll build one), templates and directives, computed vs watchers, the scheduler behind lifecycle hooks and `nextTick`, component contracts (props, emits, `defineModel`, slots, provide/inject), composables, Vue Router 5, Pinia 4 and typing it all with TypeScript. Four topics are code challenges: a reactivity core, an update scheduler, a router and a store.",
  refs: [
    { label: "Vue.js Guide: Introduction", url: "https://vuejs.org/guide/introduction.html", kind: "docs" },
    { label: "Pinia: The intuitive store for Vue.js", url: "https://pinia.vuejs.org/", kind: "docs" },
    { label: "Vue Router: The official Router for Vue.js", url: "https://router.vuejs.org/", kind: "docs" },
    { label: "sudheerj: Vue.js Interview Questions", url: "https://github.com/sudheerj/vuejs-interview-questions", kind: "interview-prep" },
  ],
  topics: [
    {
      id: "vue-reactivity-fundamentals",
      moduleId: "fe-vue",
      trackId: "frontend",
      title: "Reactivity Fundamentals: ref vs reactive",
      summary:
        "Vue's rendering model is the opposite of React's. React re-runs a component function and diffs the output; Vue runs a component's `setup` once and records, for each effect (a render function, a `computed`, a watcher), exactly which reactive properties it read, then re-runs only the effects whose dependencies changed. `reactive()` returns a Proxy whose `get` trap tracks the running effect against `(target, key)` and whose `set` trap triggers its subscribers; `ref()` wraps a value in an object whose `.value` getter and setter do the same, which is how primitives become reactive. There are no dependency arrays and no stale closures, because code reads live state through the proxy.\n\nThe official recommendation is `ref()` by default. `reactive()` only holds objects, can't be replaced wholesale (`state = reactive({...})` disconnects everything that captured the old proxy), and destructuring it or passing `state.count` to a function hands out a plain value; `toRefs()` and `toRef()` turn properties into linked refs. Refs unwrap automatically in templates (top-level bindings only) and as properties of a reactive object, but not as elements of a reactive array or `Map`. Since Vue 3.5, `const { foo } = defineProps()` stays reactive because the compiler rewrites `foo` to `props.foo`.\n\nThe gotchas are identity and cost. `reactive(raw) !== raw`, and mutating `raw` triggers nothing, so hold on to the proxy only. Conversion is deep (lazily, on access), which is wasted work for large immutable payloads: `shallowRef` tracks only `.value` replacement (call `triggerRef` after an in-place change), and `markRaw` keeps class instances and third-party objects out of the proxy graph. Vue 3.5 cut the reactivity system's memory use by 56% with no behaviour change; 3.6, in release candidate, refactors it on top of alien-signals and adds opt-in Vapor Mode, which compiles templates to direct DOM operations without a virtual DOM.",
      level: "advanced",
      estMinutes: 75,
      isMilestone: true,
      webRefs: [
        { label: "Vue.js: Reactivity Fundamentals", url: "https://vuejs.org/guide/essentials/reactivity-fundamentals.html", kind: "docs" },
        { label: "Vue.js: Reactivity in Depth", url: "https://vuejs.org/guide/extras/reactivity-in-depth.html", kind: "article" },
        { label: "Vue.js API: Reactivity Advanced (shallowRef, markRaw)", url: "https://vuejs.org/api/reactivity-advanced.html", kind: "docs" },
        { label: "vuejs/core: @vue/reactivity source", url: "https://github.com/vuejs/core/tree/main/packages/reactivity", kind: "repo" },
      ],
      video: {
        title: "Reactivity in Vue 3 - How does it work?",
        channel: "Vue Mastery",
        url: "https://www.youtube.com/watch?v=NZfNS4sJ8CI",
        videoId: "NZfNS4sJ8CI",
        durationLabel: "9:47",
      },
      alternateVideos: [
        {
          title: "Vue.js Course for Beginners",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=8pn9KEuXG28",
          videoId: "8pn9KEuXG28",
          durationLabel: "6:56:13",
          startSeconds: 1803,
          chapterLabel: "Reactivity in Vue",
        },
        {
          title: "The definitive guide to shallowRef in Vue",
          channel: "Alexander Lichter",
          url: "https://www.youtube.com/watch?v=HdDVfiHtWHE",
          videoId: "HdDVfiHtWHE",
          durationLabel: "11:52",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Build the core of Vue's reactivity system: `reactive`, `effect` and `computed`.\n\n- `reactive(target)` returns a Proxy. Reading a property while an effect is running subscribes that effect to that property; writing it re-runs the subscribed effects. Nested objects must be reactive too (wrap them when they're read), and wrapping the same raw object twice must return the same proxy.\n- A write only triggers if the value actually changed (`Object.is`). Adding a key that didn't exist triggers effects that read it while it was missing, and adding a new index to an array also triggers effects that depend on its `length` (that's how `push` reaches an effect that called `join`).\n- `effect(fn)` runs `fn` immediately and again whenever one of its dependencies changes. Re-collect dependencies on every run, so a branch that is no longer taken stops triggering it. An effect must not re-trigger itself while it's running, and an effect created inside another effect must not break the outer one's tracking. It returns `stop()`, which unsubscribes it for good.\n- `computed(getter)` returns an object with a `value` getter. It doesn't run the getter until `.value` is read, caches the result, and recomputes only on the next read after a dependency changed (a dirty flag). Effects that read `.value` must re-run when the computed's inputs change.\n- Tip: when triggering, iterate over a copy of the subscriber set. Re-running an effect removes it from the live set and adds it back, which would otherwise loop forever.\n\nThe tests call `runReactivityScenario(name)`, which runs one of the scenarios in the driver and returns plain data (values seen, run counts). Leave the driver as it is.",
        starterCode: REACTIVITY_STARTER,
        functionName: "runReactivityScenario",
        testCases: [
          { description: "an effect re-runs when a property it read changes", args: ["basic"], expected: [0, 1, 2] },
          { description: "writing a property the effect never read doesn't re-run it", args: ["unrelatedKey"], expected: 2 },
          { description: "assigning the value a property already has doesn't trigger", args: ["sameValue"], expected: 1, isEdgeCase: true },
          {
            description: "nested objects are reactive, and one raw object always maps to one proxy",
            args: ["nested"],
            expected: { names: ["Ada", "Grace", "Linus", "Evan"], sameProxy: true, proxyIsNotRaw: true, sameNestedProxy: true },
          },
          {
            description: "dependencies are re-collected on each run, so a branch no longer taken stops triggering",
            args: ["branchCleanup"],
            expected: { runs: 3, seen: ["hello", "off", "changed"] },
            isEdgeCase: true,
          },
          { description: "computed is lazy and cached: the getter runs on first read and after a dependency changes", args: ["computedLazy"], expected: [0, 2, 2, 1, 1, 10, 2] },
          { description: "an effect that reads a computed re-runs when the computed's inputs change", args: ["computedInEffect"], expected: [2, 4, 6] },
          {
            description: "an effect that writes a property it reads doesn't trigger itself into a loop",
            args: ["selfMutation"],
            expected: { afterCreate: [1, 1], runs: 2, count: 11 },
            isEdgeCase: true,
          },
          { description: "stop() unsubscribes the effect", args: ["stop"], expected: 2 },
          { description: "reading a key that doesn't exist yet subscribes to it being added", args: ["newKey"], expected: ["missing", "here"], isEdgeCase: true },
          { description: "push notifies effects that iterate the array", args: ["arrayPush"], expected: ["1,2", "1,2,3", "9,2,3"], isEdgeCase: true },
          {
            description: "the outer effect is still tracked after creating an inner effect",
            args: ["nestedEffects"],
            expected: ["inner:1", "outer:1", "inner:1", "outer:2"],
            isEdgeCase: true,
          },
          { description: "1,000 effects on different keys: one write re-runs exactly one of them", args: ["manyEffects"], expected: 1001, isEdgeCase: true },
        ],
      },
    },
    {
      id: "vue-template-directives",
      moduleId: "fe-vue",
      trackId: "frontend",
      title: "Template Syntax & Directives",
      summary:
        "Vue templates are HTML-compatible markup that the compiler turns into render functions ahead of time. That's the tradeoff against JSX: you give up arbitrary JavaScript in markup (each binding is a single expression, and only an allow-list of globals such as `Math` and `Date` is visible), and in exchange the compiler knows which parts are static. It caches static nodes and tags dynamic ones with patch flags, so updates skip everything that can't change. Directives are the vocabulary: `v-bind` (`:`, with the same-name shorthand `:id` since 3.4), `v-on` (`@`) with modifiers such as `.prevent`, `.stop`, `.once` and key modifiers, `v-model` for two-way binding, `v-if`/`v-else-if`/`v-else`, `v-show`, `v-for`, and `v-html`, which is an XSS hole for anything user-supplied.\n\n`v-if` really creates and destroys its block (child components unmount, their state is lost, listeners are removed); `v-show` renders once and toggles `display`. Prefer `v-show` for things that toggle often and `v-if` for conditions that rarely change or gate expensive subtrees. `v-for` patches in place by index unless each item has a stable `:key`, just like React's reconciliation, and without keys, component state and typed-in input values stay attached to positions rather than to items. On a component, `v-model` compiles to a `modelValue` prop plus an `onUpdate:modelValue` listener (Vue 2 used `value` and `input`).\n\nThe classic migration bug: Vue 3 reversed the precedence of `v-if` and `v-for` on the same element. `v-if` now runs first, so it can't see the loop variable, and `<li v-for=\"todo in todos\" v-if=\"!todo.done\">` throws at render time. Filter with a computed property, or put the loop on a wrapping `<template v-for>` and the condition on the inner element. Modifier order matters too, because code is generated in order: `@click.prevent.self` prevents the default for clicks on children as well, while `@click.self.prevent` only does so for clicks on the element itself.",
      level: "intermediate",
      estMinutes: 60,
      webRefs: [
        { label: "Vue.js: Template Syntax", url: "https://vuejs.org/guide/essentials/template-syntax.html", kind: "docs" },
        { label: "Vue.js: List Rendering (v-for and key)", url: "https://vuejs.org/guide/essentials/list.html", kind: "docs" },
        { label: "Vue 3 Migration Guide: v-if vs. v-for Precedence", url: "https://v3-migration.vuejs.org/breaking-changes/v-if-v-for.html", kind: "article" },
        { label: "sudheerj: Vue.js Interview Questions", url: "https://github.com/sudheerj/vuejs-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Vue.js Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=8pn9KEuXG28",
        videoId: "8pn9KEuXG28",
        durationLabel: "6:56:13",
        startSeconds: 2440,
        chapterLabel: "Directives in Vue",
      },
      alternateVideos: [
        {
          title: "Vue.js Crash Course",
          channel: "Traversy Media",
          url: "https://www.youtube.com/watch?v=VeNfHj6MhgA",
          videoId: "VeNfHj6MhgA",
          durationLabel: "2:56:44",
          startSeconds: 1716,
          chapterLabel: "v-if, v-else & v-else-if Directives",
        },
        {
          title: "Learn Vue.js – Tutorial for Beginners",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=Kt2E8nblvXU",
          videoId: "Kt2E8nblvXU",
          durationLabel: "1:38:17",
          startSeconds: 3869,
          chapterLabel: "Template Syntax - Text Interpolation",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "vue-template-directives-q1",
          prompt:
            "What happens when this renders in Vue 3?\n\n```html\n<ul>\n  <li v-for=\"todo in todos\" v-if=\"!todo.done\">{{ todo.text }}</li>\n</ul>\n```",
          options: [
            "It throws while rendering: `v-if` is evaluated before `v-for`, so `todo` is undefined in the condition",
            "It renders only the unfinished todos, filtering each item as the loop runs",
            "It renders every todo, because `v-if` is ignored on an element that has `v-for`",
            "The template compiler rejects it with a syntax error",
          ],
          correctIndex: 0,
          explanation:
            "Vue 3 gives `v-if` higher priority than `v-for` on the same element (Vue 2 did the opposite), so the condition runs outside the loop's scope and `todo.done` throws. The compiler accepts it; fix it with a computed filtered list or `<template v-for>` wrapping an inner `v-if`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-template-directives-q2",
          prompt:
            "The user types into the first input, then `items.value.shift()` removes the first item. What do the two remaining rows show?\n\n```html\n<!-- items = ref(['a', 'b', 'c']) -->\n<ul>\n  <li v-for=\"item in items\"><input /> {{ item }}</li>\n</ul>\n```",
          options: [
            "`b` with the typed text still in its input, and `c` with an empty input",
            "`b` and `c`, both with empty inputs",
            "`a` with the typed text, and `b`",
            "All three rows, because Vue doesn't track `shift()` on refs",
          ],
          correctIndex: 0,
          explanation:
            "Without a `key`, Vue patches rows in place by index: the first `<li>` is reused for `b`, so its input keeps the DOM value typed for `a`. `:key=\"item\"` makes Vue move and remove the right element instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-template-directives-q3",
          prompt: "Which statements about `v-if` and `v-show` are true? (Select all that apply.)",
          options: [
            "Toggling `v-if` to false unmounts child components, so their local state is lost",
            "`v-show` always renders the element and only toggles its CSS `display`",
            "`v-show` can't be used on `<template>` and doesn't work with `v-else`",
            "`v-show` has a higher toggle cost than `v-if`, so it suits rarely changing conditions",
            "When the initial condition is false, `v-if` renders nothing until it becomes true",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 4],
          explanation:
            "`v-if` is real conditional rendering (lazy, destroys and recreates the block); `v-show` pays the initial render once and then toggles `display`. So `v-if` has the higher toggle cost and `v-show` the higher initial cost, which is the reverse of the fourth option.",
        },
        {
          id: "vue-template-directives-q4",
          prompt: "What does this render?\n\n```html\n<span v-for=\"n in 3\">{{ n }}</span>\n```",
          options: ["`123`", "`012`", "`0123`", "Nothing: `v-for` needs an array or object"],
          correctIndex: 0,
          explanation:
            "`v-for` accepts an integer and repeats the template that many times, with `n` starting at 1, not 0. Off-by-one bugs appear when people index into arrays with it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-template-directives-q5",
          prompt: "In Vue 3, what does `<MyInput v-model=\"text\" />` on a component compile to?",
          options: [
            "A `modelValue` prop and an `onUpdate:modelValue` listener that assigns `$event` to `text`",
            "A `value` prop and an `input` event listener",
            "A two-way binding that lets `MyInput` assign to `text` directly",
            "A `v-bind:text` and `v-on:change` pair",
          ],
          correctIndex: 0,
          explanation:
            "Vue 3 standardized component `v-model` on `modelValue` / `update:modelValue` (and `v-model:title` on `title` / `update:title`). `value`/`input` was the Vue 2 convention; the child never writes the parent's variable directly.",
        },
        {
          id: "vue-template-directives-q6",
          prompt:
            "A `<div>` contains a link. Which statement about these two listeners is correct?\n\n```html\n<div @click.prevent.self=\"onA\">...</div>\n<div @click.self.prevent=\"onB\">...</div>\n```",
          options: [
            "The first prevents the default action for clicks on the div and its children; the second only for clicks on the div itself",
            "They're identical: modifier order doesn't matter",
            "The second prevents the default for children too; the first only for the div",
            "Neither prevents anything, because `.self` cancels `.prevent`",
          ],
          correctIndex: 0,
          explanation:
            "Modifiers generate code in the order written. `.prevent.self` calls `preventDefault()` before checking the target, so clicking the child link is still prevented; `.self.prevent` returns early when the target isn't the div.",
        },
        {
          id: "vue-template-directives-q7",
          prompt:
            "An `<input v-model.number=\"age\">` holds `42`. The user clears the field. What is `age` now?",
          options: ["`\"\"` (an empty string)", "`0`", "`NaN`", "`null`"],
          correctIndex: 0,
          explanation:
            "`.number` casts with `parseFloat()` and falls back to the original string when parsing fails, so an empty input yields `\"\"`. Validation code that assumes a number (or `NaN`) breaks here.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-template-directives-q8",
          prompt:
            "What does this render?\n\n```vue\n<script setup>\nimport { ref } from 'vue'\nconst object = { id: ref(1) }\n</script>\n\n<template>\n  <p>{{ object.id + 1 }}</p>\n</template>\n```",
          options: ["`[object Object]1`", "`2`", "`11`", "`NaN`"],
          correctIndex: 0,
          explanation:
            "Refs are only unwrapped in templates when they're top-level bindings; `object` is a plain object, so `object.id` is still a ref and string concatenation kicks in. `{{ object.id }}` alone would show `1`, because a ref that is the final value of an interpolation is unwrapped.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-template-directives-q9",
          prompt:
            "A script sets `window.appConfig = { name: 'Trails' }` before the app mounts. A template contains `{{ window.appConfig.name }}`. What happens?",
          options: [
            "It fails: template expressions are sandboxed to an allow-list of globals such as `Math` and `Date`, and `window` isn't on it",
            "It renders `Trails`, since templates can read any global",
            "It renders `Trails` in development but fails in production builds",
            "It renders `Trails` but isn't reactive",
          ],
          correctIndex: 0,
          explanation:
            "Templates only see the component's bindings plus a restricted list of built-in globals. Expose the value from `setup`, or register it with `app.config.globalProperties`.",
        },
        {
          id: "vue-template-directives-q10",
          prompt: "Which of these are valid template bindings in Vue 3.5? (Select all that apply.)",
          options: [
            "`{{ ok ? 'YES' : 'NO' }}`",
            "`{{ const label = 'x' }}`",
            "`{{ if (ok) { return message } }}`",
            "`<a :[attrName]=\"url\">` with a dynamic argument",
            "`<div :id>` as shorthand for `:id=\"id\"`",
          ],
          correctIndex: 0,
          correctIndices: [0, 3, 4],
          explanation:
            "Each binding must be a single expression, so declarations and `if` statements are rejected while a ternary is fine. Dynamic arguments (`:[attrName]`) are supported, and the same-name shorthand `:id` has been available since 3.4.",
        },
        {
          id: "vue-template-directives-q11",
          prompt:
            "Clicking Edit throws instead of focusing the input. Why, and what fixes it?\n\n```vue\n<script setup>\nimport { ref, useTemplateRef } from 'vue'\nconst editing = ref(false)\nconst input = useTemplateRef('input')\n\nfunction startEditing() {\n  editing.value = true\n  input.value.focus()\n}\n</script>\n\n<template>\n  <input v-if=\"editing\" ref=\"input\" />\n  <button @click=\"startEditing\">Edit</button>\n</template>\n```",
          options: [
            "DOM updates are batched until the next tick, so the input doesn't exist yet and `input.value` is `null`; `await nextTick()` before calling `focus()`",
            "Elements with `v-if` can't have template refs; switch to `v-show`",
            "Template refs are only filled in during `onMounted`, so the component would have to remount",
            "Calling `focus()` inside a `flush: 'sync'` watcher on `editing` fixes it",
          ],
          correctIndex: 0,
          explanation:
            "Setting `editing` only queues the re-render; the `<input>` is created when the scheduler flushes, and `nextTick()` resolves after that. A sync watcher runs even earlier, before any DOM update, so it wouldn't help.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "vue-computed-watchers",
      moduleId: "fe-vue",
      trackId: "frontend",
      title: "Computed Properties & Watchers",
      summary:
        "`computed()` is derived state with memoization built in: the getter runs lazily on first read, its reactive reads become its dependencies, and the result is cached until one of them changes (a dirty flag, not a recompute on every write). Since 3.4 a computed only notifies its dependents when its value actually changed. Think `useMemo` without a hand-written dependency list. A computed is getter-only by default (assigning to it warns), a writable computed takes `get` and `set`, and the getter must stay pure: no mutations, requests or DOM work, because Vue decides when, and whether, it runs.\n\nSide effects belong in watchers. `watch(source, cb)` is lazy and explicit: the source is a ref, a reactive object (implicitly deep), a getter or an array of these, and the callback receives new and old values. `watchEffect(fn)` runs immediately and tracks whatever it reads, but only during its synchronous execution, so anything read after the first `await` is invisible to it. Options: `immediate`, `once` (3.4+), `deep` (a number sets a maximum depth since 3.5) and `flush`: `'pre'` by default (after parent updates, before the owner component's DOM update), `'post'` (after the DOM update) or `'sync'` (no batching). Watchers are batched per tick: ten synchronous pushes fire one callback, and a change that's reverted in the same tick fires nothing.\n\nThe classic bugs: `watch(obj.count, cb)` passes a number, not a source (use `() => obj.count`); `watch(someRef, cb)` on a ref that holds an object ignores nested mutations unless `deep` is set; a watcher created asynchronously (in a `setTimeout` or promise callback) isn't bound to the component and leaks unless you call its stop handle; and `onWatcherCleanup()` (3.5+) must be called before the first `await`, while the `onCleanup` callback argument has no such limit. Prefer `watch` when you need old values, laziness or precise triggers.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Vue.js: Computed Properties", url: "https://vuejs.org/guide/essentials/computed.html", kind: "docs" },
        { label: "Vue.js: Watchers", url: "https://vuejs.org/guide/essentials/watchers.html", kind: "docs" },
        { label: "Vue blog: Announcing Vue 3.4 (computed and watcher improvements)", url: "https://blog.vuejs.org/posts/vue-3-4", kind: "article" },
        { label: "Vue.js API: watch() and watchEffect()", url: "https://vuejs.org/api/reactivity-core.html#watch", kind: "docs" },
      ],
      video: {
        title: "Vue.js Watchers have Callback Flush WHAT?!",
        channel: "Alexander Lichter",
        url: "https://www.youtube.com/watch?v=FnTME7I5C5A",
        videoId: "FnTME7I5C5A",
        durationLabel: "12:13",
      },
      alternateVideos: [
        {
          title: "Vue 3 Watch vs WatchEffect! Watch OUT, you'll probably get this wrong!",
          channel: "Program With Erik",
          url: "https://www.youtube.com/watch?v=QkadKspKoJo",
          videoId: "QkadKspKoJo",
          durationLabel: "9:04",
        },
        {
          title: "The Best way to learn Vue in 2025 - CRASH COURSE",
          channel: "Vue Mastery",
          url: "https://www.youtube.com/watch?v=s9URD3PefTk",
          videoId: "s9URD3PefTk",
          durationLabel: "56:52",
          startSeconds: 1961,
          chapterLabel: "Lesson 8 - Computed Properties",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "vue-computed-watchers-q1",
          prompt:
            "This watcher never fires when `count` changes. Why?\n\n```js\nconst obj = reactive({ count: 0 })\nwatch(obj.count, (n) => console.log(n))\nobj.count++\n```",
          options: [
            "`obj.count` is evaluated once and passes the number `0`, which isn't a reactive source, so Vue warns and watches nothing",
            "`watch` is lazy, so it only fires from the second change onward",
            "Watching a property of a `reactive()` object requires `{ deep: true }`",
            "It fires, but only after the next component render",
          ],
          correctIndex: 0,
          explanation:
            "A watch source must be a ref, a reactive object, a getter or an array of these; `obj.count` is just `0` by the time `watch` sees it (Vue logs \"Invalid watch source\"). Use `watch(() => obj.count, cb)`. `deep` is unrelated.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-computed-watchers-q2",
          prompt:
            "Which later change re-runs this effect?\n\n```js\nwatchEffect(async () => {\n  const user = await fetchUser(userId.value)\n  details.value = await fetchDetails(user.id, locale.value)\n})\n```",
          options: [
            "Only a change to `userId`",
            "A change to either `userId` or `locale`",
            "Only a change to `locale`",
            "Neither: async effects can't track dependencies",
          ],
          correctIndex: 0,
          explanation:
            "`watchEffect` only tracks what it reads during its synchronous run, i.e. before the first `await`. `locale.value` is read afterwards, so it's never a dependency; read it up front, or use `watch([userId, locale], ...)`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-computed-watchers-q3",
          prompt:
            "What are the two logged values?\n\n```js\nlet runs = 0\nconst count = ref(1)\nconst double = computed(() => {\n  runs++\n  return count.value * 2\n})\n\ndouble.value\ndouble.value\ncount.value = 2\ncount.value = 3\nconsole.log(runs)\ndouble.value\nconsole.log(runs)\n```",
          options: ["`1`, then `2`", "`3`, then `3`", "`2`, then `3`", "`1`, then `1`"],
          correctIndex: 0,
          explanation:
            "The getter runs on the first read and is cached for the second. Writes only mark the computed dirty (nothing recomputes yet), so `runs` is still 1; the next read recomputes once. `3, 3` is what an eager recompute-on-write would give.",
        },
        {
          id: "vue-computed-watchers-q4",
          prompt:
            "What is logged?\n\n```js\nconst count = ref(0)\nwatch(count, (n, old) => console.log(n, old))\n\ncount.value++\ncount.value++\ncount.value++\n```",
          options: ["`3 0`, once", "`1 0`, `2 1`, `3 2`", "`3 2`, once", "Nothing, because the component didn't re-render"],
          correctIndex: 0,
          explanation:
            "Watcher callbacks are queued and deduplicated per tick (default `flush: 'pre'`), so the callback runs once with the final value and the value from before the first change. Only `flush: 'sync'` would log three times.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-computed-watchers-q5",
          prompt:
            "What is logged by the end of the tick?\n\n```js\nconst open = ref(false)\nwatch(open, () => console.log('changed'))\n\nopen.value = true\nopen.value = false\n```",
          options: ["Nothing", "`changed` once", "`changed` twice", "`changed` once, then a recursive-update warning"],
          correctIndex: 0,
          explanation:
            "The job runs once, later in the tick, and compares the current value (`false`) with the old one (`false`). They're equal, so the callback is skipped: flip-and-revert changes are invisible to non-sync watchers.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-computed-watchers-q6",
          prompt:
            "What happens?\n\n```js\nconst settings = ref({ theme: 'dark' })\nwatch(settings, () => console.log('saved'))\n\nsettings.value.theme = 'light'\n```",
          options: [
            "Nothing: watching a ref only reacts to `.value` being replaced unless you pass `{ deep: true }`",
            "`saved` is logged, because refs make their values deeply reactive",
            "`saved` is logged twice",
            "Vue warns that a ref holding an object isn't a valid source",
          ],
          correctIndex: 0,
          explanation:
            "The object inside the ref is deeply reactive (templates update), but `watch(ref)` compares `.value` by identity. Unlike `watch(reactiveObject)`, it isn't implicitly deep: use `{ deep: true }` or watch a getter such as `() => settings.value.theme`.",
        },
        {
          id: "vue-computed-watchers-q7",
          prompt:
            "Given `const state = reactive({ inner: { x: 1 } })`, which watchers fire after `state.inner.x++`? (Select all that apply.)",
          options: [
            "`watch(state, cb)`",
            "`watch(() => state.inner, cb)`",
            "`watch(() => state.inner, cb, { deep: true })`",
            "`watch(() => state.inner.x, cb)`",
            "`watch(state.inner.x, cb)`",
          ],
          correctIndex: 0,
          correctIndices: [0, 2, 3],
          explanation:
            "Passing a reactive object creates an implicit deep watcher, and a getter returning the nested value fires when it changes. A getter returning `state.inner` only fires when that object is replaced unless `deep` is set, and `state.inner.x` passes a plain number.",
        },
        {
          id: "vue-computed-watchers-q8",
          prompt:
            "Inside a component, `el` is a template ref to `<p>{{ count }}</p>`. What does this default watcher log when `count` goes from 0 to 1?\n\n```js\nwatch(count, () => {\n  console.log(el.value.textContent)\n})\n```",
          options: [
            "`0`: default (`flush: 'pre'`) watchers run before the owner component's DOM update; use `flush: 'post'` to see `1`",
            "`1`: watchers always run after rendering",
            "`0` or `1`, depending on whether the parent re-rendered",
            "It throws, because template refs aren't available inside watchers",
          ],
          correctIndex: 0,
          explanation:
            "Pre-flush watchers run after parent updates but before the owner's own render, so the DOM still shows the old value. `flush: 'post'` (or `watchPostEffect`) runs after the DOM is patched.",
        },
        {
          id: "vue-computed-watchers-q9",
          prompt:
            "What's wrong with this cleanup?\n\n```js\nwatch(id, async (newId) => {\n  const controller = new AbortController()\n  const res = await fetch('/api/items/' + newId, { signal: controller.signal })\n  onWatcherCleanup(() => controller.abort())\n  items.value = await res.json()\n})\n```",
          options: [
            "`onWatcherCleanup` runs after an `await`, when there's no active watcher, so the cleanup is never registered and stale requests aren't aborted",
            "Nothing: the cleanup runs before the next callback",
            "`onWatcherCleanup` only works inside `watchEffect`",
            "It aborts the current request as soon as the callback finishes",
          ],
          correctIndex: 0,
          explanation:
            "`onWatcherCleanup()` (3.5+) must be called during the synchronous part of the callback; after an `await` Vue just warns. Register it before awaiting, or use the third `onCleanup` argument, which is bound to the watcher and works at any point.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-computed-watchers-q10",
          prompt:
            "What ends up in `log`? A tick passes after each assignment.\n\n```js\nconst c = ref(0)\nconst log = []\nwatch(c, (n, o) => log.push('imm ' + n + ' ' + o), { immediate: true })\nwatch(c, (n) => log.push('once ' + n), { once: true })\n\nc.value = 1\nc.value = 2\n```",
          options: [
            "`imm 0 undefined`, `imm 1 0`, `once 1`, `imm 2 1`",
            "`imm 1 0`, `once 1`, `imm 2 1`",
            "`imm 0 undefined`, `once 0`, `imm 1 0`, `imm 2 1`",
            "`imm 0 undefined`, `imm 1 0`, `once 1`, `imm 2 1`, `once 2`",
          ],
          correctIndex: 0,
          explanation:
            "`immediate` runs the callback at creation with `undefined` as the old value. `once` (3.4+) doesn't run immediately; it fires on the first change and then stops itself, so it never sees `2`.",
        },
        {
          id: "vue-computed-watchers-q11",
          prompt:
            "What happens?\n\n```js\nconst count = ref(1)\nconst double = computed(() => count.value * 2)\ndouble.value = 10\n```",
          options: [
            "Vue warns that the computed value is readonly, and `double.value` stays `2`",
            "`count` becomes `5`",
            "`double.value` stays `10` until `count` changes",
            "It throws a `TypeError`",
          ],
          correctIndex: 0,
          explanation:
            "Computeds are getter-only by default: the write is rejected with a dev warning. To make assignment work, define a writable computed with `get` and `set`, where `set` updates the source (`count.value = v / 2`).",
        },
        {
          id: "vue-computed-watchers-q12",
          prompt:
            "What's wrong with this computed?\n\n```js\nconst visibleTodos = computed(() => {\n  analytics.track('filter', filter.value)\n  lastFilteredAt.value = Date.now()\n  return todos.value.filter((t) => matches(t, filter.value))\n})\n```",
          options: [
            "Getters must be pure: Vue only runs them lazily when read after a dependency changed, so the tracking call and the state write fire unpredictably or not at all; move them into a `watch` on `filter`",
            "Nothing: a computed is the right place for side effects that depend on reactive state",
            "It re-runs on every render because `Date.now()` isn't cached",
            "Vue throws because a computed getter can't write to a ref",
          ],
          correctIndex: 0,
          explanation:
            "A computed's getter runs when Vue decides it needs the value, which is an implementation detail; if nothing reads `visibleTodos`, the side effects never happen. Vue doesn't stop you from writing a ref in a getter, which is what makes this bug easy to ship.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "vue-lifecycle-hooks",
      moduleId: "fe-vue",
      trackId: "frontend",
      title: "Component Lifecycle Hooks & the Update Scheduler",
      summary:
        "A component's lifecycle is a pipeline the renderer drives. `setup()` (or `<script setup>`) runs once, then `onBeforeMount`, the first render, the children's own mounts, and `onMounted`: children finish mounting before their parent, so a parent's `onMounted` can rely on its children's DOM. An update runs `onBeforeUpdate`, re-renders and patches, then `onUpdated` (child before parent when the child is patched as part of the parent's update). Teardown runs `onBeforeUnmount`, unmounts the children, stops the component's effects and calls `onUnmounted`. Hooks must be registered synchronously during setup because they attach to the current instance; `<script setup>` restores that instance after a top-level `await`, a hand-written async `setup()` doesn't. During SSR only setup runs: `onBeforeMount`, `onMounted`, `onUpdated` and the unmount hooks never fire on the server, which is exactly why DOM access and subscriptions belong in `onMounted`.\n\nUpdates are asynchronous and batched. A reactive write doesn't render anything; it queues the component's update job, and a scheduler flushes the queue in a microtask: pre-flush watchers, then component updates sorted by uid (parents are created before children, so they update first, and a child already patched by its parent isn't rendered twice), then post-flush callbacks (`onMounted`, `onUpdated`, `flush: 'post'` watchers). `nextTick()` resolves after that flush, which is how you read the updated DOM after changing state.\n\nFor React developers: `onMounted` isn't `useEffect(fn, [])`. It runs once, synchronously in the same flush before the browser paints (closer to `useLayoutEffect`), setup code never re-runs on re-render, and returning a function doesn't register cleanup: pair it with `onUnmounted`. Two gotchas: mutating state in `onUpdated` can loop forever, and a `nextTick` callback registered before the first state change runs before the flush and sees the old DOM.",
      level: "advanced",
      estMinutes: 65,
      webRefs: [
        { label: "Vue.js: Lifecycle Hooks", url: "https://vuejs.org/guide/essentials/lifecycle.html", kind: "docs" },
        { label: "Vue.js API: Composition API Lifecycle Hooks", url: "https://vuejs.org/api/composition-api-lifecycle.html", kind: "docs" },
        { label: "Vue.js: Rendering Mechanism", url: "https://vuejs.org/guide/extras/rendering-mechanism.html", kind: "article" },
        { label: "vuejs/core: scheduler.ts", url: "https://github.com/vuejs/core/blob/main/packages/runtime-core/src/scheduler.ts", kind: "repo" },
      ],
      video: {
        title: "Vue 3 Composition API Tutorial #4 - Lifecycle Hooks",
        channel: "Make Apps with Danny",
        url: "https://www.youtube.com/watch?v=Vpo_4si5Fb0",
        videoId: "Vpo_4si5Fb0",
        durationLabel: "11:31",
      },
      alternateVideos: [
        {
          title: "Vue.js 3 Deep Dive with Evan You",
          channel: "Vue Mastery",
          url: "https://www.youtube.com/watch?v=0JJPfz5dg20",
          videoId: "0JJPfz5dg20",
          durationLabel: "13:45",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `createScheduler(defer)`, a simplified version of the queue behind Vue's component updates, lifecycle hooks and `nextTick`. `defer(fn)` schedules `fn` as a microtask; the driver fakes the microtask queue, so don't use promises or timers yourself.\n\nReturn `{ queueJob, queuePostFlushCb, nextTick }`:\n\n- `queueJob(job)`: `job` is a function with a numeric `job.id` and, for pre-flush watchers, `job.pre === true`. Ignore it if it's already waiting in the queue. Otherwise insert it so the queue stays sorted by `id` (for equal ids, `pre` jobs go before other jobs; otherwise the first queued runs first) and make sure one flush is scheduled with `defer`.\n- While flushing, jobs run in queue order. A job stops \"waiting\" when it starts running, so it can be queued again and will run again. A job queued mid-flush is inserted by `id` among the jobs that haven't run yet, never before the job that is running.\n- `queuePostFlushCb(cb)`: `cb` runs after the job queue is empty. A callback queued several times runs once. Sort them by `cb.id`; callbacks without an id run after those with one, in the order they were first queued.\n- If post-flush callbacks queue more jobs or callbacks, keep going (jobs, then callbacks) until nothing is pending. All of that is one flush.\n- `nextTick(fn)`: run `fn` after the pending flush has completed, or in the next microtask if nothing is pending.\n\nThe tests call `runSchedulerScenario(ops)`, which replays queue operations (see the comments in the driver) and returns the order in which everything ran. Leave the driver as it is.",
        starterCode: SCHEDULER_STARTER,
        functionName: "runSchedulerScenario",
        testCases: [
          {
            description: "three state changes in one tick cause one render, after the synchronous code",
            args: [[["job", "render:App", 1], ["job", "render:App", 1], ["job", "render:App", 1], ["mark", "sync code done"]]],
            expected: ["sync code done", "render:App"],
          },
          {
            description: "jobs run in id order (parents before children), not queue order",
            args: [[["job", "render:Child", 3], ["job", "render:Root", 1], ["job", "render:Parent", 2]]],
            expected: ["render:Root", "render:Parent", "render:Child"],
          },
          {
            description: "a pre job (a flush: 'pre' watcher) runs before the render job with the same id",
            args: [[["job", "render:Child", 2], ["job", "render:Parent", 1], ["pre", "watch:Child", 2]]],
            expected: ["render:Parent", "watch:Child", "render:Child"],
          },
          {
            description: "post-flush callbacks run after all jobs, deduplicated, by id, id-less ones last in queue order",
            args: [
              [
                ["job", "render:A", 1, [["post", "updated:A"]]],
                ["job", "render:B", 2, [["post", "updated:B"], ["post", "updated:A"]]],
                ["post", "watchPost:B", 2],
                ["post", "watchPost:A", 1],
              ],
            ],
            expected: ["render:A", "render:B", "watchPost:A", "watchPost:B", "updated:A", "updated:B"],
          },
          {
            description: "a job queued mid-flush is slotted in by id, but never before the running job",
            args: [[["job", "A", 2, [["job", "early", 1], ["job", "late", 9]]], ["job", "B", 5]]],
            expected: ["A", "early", "B", "late"],
          },
          {
            description: "a job already waiting in the queue isn't added again when re-queued mid-flush",
            args: [[["job", "A", 1, [["job", "C", 3]]], ["job", "B", 2, [["job", "C", 3]]], ["job", "C", 3]]],
            expected: ["A", "B", "C"],
          },
          {
            description: "nextTick registered after a change runs once the flush (post-flush callbacks included) is done",
            args: [[["job", "render", 1, [["post", "updated"]]], ["tick", "nextTick callback"]]],
            expected: ["render", "updated", "nextTick callback"],
          },
          {
            description: "nextTick registered before any change runs before the flush (the DOM isn't updated yet)",
            args: [[["tick", "early nextTick"], ["job", "render", 1]]],
            expected: ["early nextTick", "render"],
            isEdgeCase: true,
          },
          {
            description: "nextTick called inside a job waits for the whole flush",
            args: [[["job", "A", 1, [["tick", "tick from A"], ["post", "P"]]], ["job", "B", 2]]],
            expected: ["A", "B", "P", "tick from A"],
          },
          {
            description: "work queued by post-flush callbacks extends the same flush before nextTick fires",
            args: [[["job", "A", 1, [["post", "P", null, [["post", "Q", null, [["job", "Z", 7]]]]]]], ["tick", "tick"]]],
            expected: ["A", "P", "Q", "Z", "tick"],
            isEdgeCase: true,
          },
          {
            description: "deduplication only lasts for one flush: the same job runs again in a later tick",
            args: [[["job", "A", 1], ["drain"], ["mark", "between flushes"], ["job", "A", 1]]],
            expected: ["A", "between flushes", "A"],
            isEdgeCase: true,
          },
          {
            description: "a job that already ran in this flush can be queued again and runs again",
            args: [[["job", "A", 1], ["job", "B", 2, [["job", "A", 1]]]]],
            expected: ["A", "B", "A"],
            isEdgeCase: true,
          },
          { description: "nothing queued means nothing runs", args: [[]], expected: [], isEdgeCase: true },
          {
            description: "10,000 queue calls for 100 jobs run each job once, in id order",
            args: [Array.from({ length: 10000 }, (_, i) => ["job", "j" + ((i * 37) % 100), (i * 37) % 100])],
            expected: Array.from({ length: 100 }, (_, k) => "j" + k),
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "vue-props-emits",
      moduleId: "fe-vue",
      trackId: "frontend",
      title: "Props, Emits & defineModel",
      summary:
        "Props and emits are a component's public contract: data flows down through props, intent flows up through events, and the one-way flow is enforced. The `props` object is a shallow readonly proxy, so assigning `props.title` fails with a dev warning. Only shallow, though: mutating a nested property of an object or array prop succeeds silently and changes the parent's state behind its back, the bug the readonly warning trains you to think you're protected from. For an editable local copy use `ref(props.initialValue)` (deliberately disconnected from later updates); for a transformed view use `computed`.\n\n`defineProps()` and `defineEmits()` are compiler macros that take runtime options (types, `required`, `default`, validators) or, with TypeScript, pure types. Declaring matters beyond validation: undeclared attributes fall through to the root element, and declaring a native event name such as `click` in `emits` stops a parent's native `click` listener from falling through. Component events don't bubble. Under the hood a parent's `@update-item` is just an `onUpdateItem` prop that the child's `emit('updateItem')` calls, much like a React callback prop. Boolean props are cast, so an absent `Boolean` prop is `false`, not `undefined`.\n\n`defineModel()` (3.4+) declares a `modelValue` prop plus an `update:modelValue` event and returns a ref that reads the prop and emits on write, so `v-model` on a component becomes one line. Named models (`defineModel('title')`) support several `v-model`s, and modifiers come back as the second element of the returned tuple. Beware a `default`: if the parent binds `undefined`, the child shows the default while the parent still holds `undefined`. Since Vue 3.5, destructuring `defineProps()` stays reactive because the compiler rewrites each access to `props.x`, and native default values replace `withDefaults`; passing a destructured prop straight into `watch()` is a compile error, so wrap it in a getter.",
      level: "intermediate",
      estMinutes: 60,
      webRefs: [
        { label: "Vue.js: Props", url: "https://vuejs.org/guide/components/props.html", kind: "docs" },
        { label: "Vue.js: Component Events", url: "https://vuejs.org/guide/components/events.html", kind: "docs" },
        { label: "Vue.js: Component v-model", url: "https://vuejs.org/guide/components/v-model.html", kind: "docs" },
        { label: "Vue 3 Migration Guide: v-model", url: "https://v3-migration.vuejs.org/breaking-changes/v-model.html", kind: "article" },
      ],
      video: {
        title: "Vue.js Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=8pn9KEuXG28",
        videoId: "8pn9KEuXG28",
        durationLabel: "6:56:13",
        startSeconds: 11700,
        chapterLabel: "Component communication",
      },
      alternateVideos: [
        {
          title: "defineXYZ in Vue - What are Compiler Macros?!",
          channel: "Alexander Lichter",
          url: "https://www.youtube.com/watch?v=WbMFNW04anA",
          videoId: "WbMFNW04anA",
          durationLabel: "13:44",
        },
        {
          title: "Vue 3.5 Made Props Destructure SUPER Easy!",
          channel: "Vue Mastery",
          url: "https://www.youtube.com/watch?v=-VUjG6xKL60",
          videoId: "-VUjG6xKL60",
          durationLabel: "8:55",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "vue-props-emits-q1",
          prompt:
            "The parent renders `<Child msg=\"hi\" :user=\"user\" />`, where `user` is `reactive({ name: 'Ada' })`. What happens?\n\n```vue\n<!-- Child.vue -->\n<script setup>\nconst props = defineProps(['msg', 'user'])\nprops.msg = 'changed'\nprops.user.name = 'Grace'\n</script>\n```",
          options: [
            "Assigning `props.msg` is rejected with a readonly warning, but `props.user.name = 'Grace'` silently changes the parent's object",
            "Both assignments are rejected with readonly warnings",
            "Both succeed, and the parent sees both changes",
            "Assigning `props.msg` throws a `TypeError` in production",
          ],
          correctIndex: 0,
          explanation:
            "`props` is shallowly readonly: the top-level assignment fails with a \"target is readonly\" warning. Objects are passed by reference and Vue doesn't make them readonly deeply, so the nested write goes through unnoticed; emit an event instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-props-emits-q2",
          prompt:
            "In Vue 3.5, the parent changes `count` from 1 to 2. What happens?\n\n```vue\n<script setup>\nimport { watchEffect } from 'vue'\nconst { count = 0 } = defineProps(['count'])\nwatchEffect(() => console.log(count))\n</script>\n```",
          options: [
            "The effect re-runs and logs `2`, because the compiler rewrites `count` to `props.count`",
            "Nothing: destructuring captured the initial value",
            "It logs `0`, the default value",
            "Compilation fails: props can't be destructured",
          ],
          correctIndex: 0,
          explanation:
            "Reactive props destructure is stable and on by default since 3.5, so the destructured name is compiled into a property access that `watchEffect` tracks. In 3.4 and earlier, `count` was a plain constant and the effect ran only once.",
        },
        {
          id: "vue-props-emits-q3",
          prompt:
            "What does the SFC compiler do with this?\n\n```vue\n<script setup>\nimport { watch } from 'vue'\nconst { id } = defineProps(['id'])\nwatch(id, (newId) => load(newId))\n</script>\n```",
          options: [
            "It fails to compile: a destructured prop can't be passed directly to `watch()`, so pass a getter `() => id`",
            "It compiles, and the watcher fires whenever `id` changes",
            "It compiles, but the watcher never fires",
            "It compiles and silently converts `id` into a ref",
          ],
          correctIndex: 0,
          explanation:
            "`watch(id, ...)` would be `watch(props.id, ...)`, a plain value, so the compiler rejects it with \"`id` is a destructured prop and should not be passed directly to watch()\". The same getter trick (`() => id` or `toValue`) is how you pass a destructured prop into a composable.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-props-emits-q4",
          prompt: "Which statements about `defineModel()` are true? (Select all that apply.)",
          options: [
            "It returns a ref whose value stays in sync with the parent's `v-model` binding",
            "Assigning to the returned ref's `.value` emits `update:modelValue`",
            "With `defineModel({ default: 1 })` and a parent whose bound value is `undefined`, the child shows `1` while the parent still holds `undefined`",
            "`const [model, modifiers] = defineModel()` exposes custom modifiers such as `v-model.capitalize`",
            "It creates local state that ignores later changes from the parent",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "`defineModel` compiles to a `modelValue` prop plus an `update:modelValue` event wrapped in a ref (via `useModel`), so it tracks the parent. The docs warn about the default-value desync, and the tuple form gives access to modifiers.",
        },
        {
          id: "vue-props-emits-q5",
          prompt:
            "`Grandparent` renders `<Parent @save=\"onSave\" />`, and `Parent` renders `<Child />`, which calls `emit('save')`. Does `onSave` run?",
          options: [
            "No: component events don't bubble, so `Parent` must listen and re-emit (or use provide/inject or a store)",
            "Yes: component events bubble up like DOM events",
            "Yes, if `Child` declares `save` in `defineEmits`",
            "Only with the `.native` modifier",
          ],
          correctIndex: 0,
          explanation:
            "Emitted events only reach the direct parent's listeners. (`.native` was removed in Vue 3.) Deeply nested communication needs re-emitting, provide/inject, or shared state.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-props-emits-q6",
          prompt:
            "A `<FancyButton>` whose root element is a `<button>` declares `defineEmits(['click'])` but never calls `emit('click')`. The parent writes `<FancyButton @click=\"go\" />`. What happens when the button is clicked?",
          options: [
            "`go` doesn't run: declaring `click` in `emits` makes it a component event, so the listener no longer falls through to the native button",
            "`go` runs once, from the native click",
            "`go` runs twice, once for the native click and once for the component event",
            "Vue throws because `click` is reserved for native events",
          ],
          correctIndex: 0,
          explanation:
            "Declared events are excluded from fallthrough attributes. Once `click` is in `emits`, the parent's listener only responds to `emit('click')`, so either emit it explicitly or don't declare it.",
        },
        {
          id: "vue-props-emits-q7",
          prompt:
            "With these props, the parent renders `<MyButton />` with no attributes. What are the values?\n\n```js\ndefineProps({ disabled: Boolean, label: String })\n```",
          options: [
            "`disabled` is `false` and `label` is `undefined`",
            "Both are `undefined`",
            "`disabled` is `undefined` and `label` is `\"\"`",
            "`disabled` is `false` and `label` is `\"\"`",
          ],
          correctIndex: 0,
          explanation:
            "Absent `Boolean` props are cast to `false` (and a bare `<MyButton disabled />` means `true`); other absent optional props are `undefined`. Set `default: undefined` if you need a Boolean prop to distinguish absent from false.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-props-emits-q8",
          prompt:
            "Which declarations give every component instance its own default `labels` array? (Select all that apply.)",
          options: [
            "`withDefaults(defineProps<Props>(), { labels: () => ['one'] })`",
            "`const { labels = ['one'] } = defineProps<Props>()` in Vue 3.5",
            "`defineProps({ labels: { type: Array, default: () => ['one'] } })`",
            "`withDefaults(defineProps<Props>(), { labels: ['one'] })`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Mutable defaults must be factory functions with `withDefaults` and the runtime `default` option, otherwise instances can share one array. The docs note that a native default in a 3.5 props destructure doesn't need the factory.",
        },
        {
          id: "vue-props-emits-q9",
          prompt:
            "A child receives `initialCount` and wants a counter the user can increment locally, and a `size` prop it always shows trimmed and lowercased. Which pairing is right?",
          options: [
            "`const count = ref(props.initialCount)` and `const normalized = computed(() => props.size.trim().toLowerCase())`",
            "`const count = computed(() => props.initialCount)` and `const normalized = ref(props.size.trim())`",
            "Increment `props.initialCount` directly, and copy `size` into a ref with a watcher",
            "`const count = toRef(props, 'initialCount')`, then increment `count.value`",
          ],
          correctIndex: 0,
          explanation:
            "A prop used as an initial value becomes local state, deliberately disconnected from later updates; derived values stay a `computed` of the prop. A `toRef` of a prop is still readonly, so incrementing it just warns.",
        },
        {
          id: "vue-props-emits-q10",
          prompt: "Coming from React, which statement about Vue component events is accurate?",
          options: [
            "A parent's `@update-item` listener reaches the child as an `onUpdateItem` prop, and `emit('updateItem', x)` calls it synchronously",
            "Emitted events travel up through ancestors until one calls `stopPropagation()`",
            "`emit` is asynchronous and is batched with the next render",
            "Vue forbids passing functions as props, so callbacks must always be events",
          ],
          correctIndex: 0,
          explanation:
            "Listeners on components compile to `on*` props (which is why `v-bind` objects use `onClick`-style keys), and `emit` looks up and calls the handler right away. Passing functions as props is allowed; events are just the idiomatic, declared form.",
        },
      ],
    },
    {
      id: "vue-slots",
      moduleId: "fe-vue",
      trackId: "frontend",
      title: "Slots: Default, Named & Scoped",
      summary:
        "Props pass data; slots pass markup. A slot lets the parent supply template content that the child decides where to place, which is how layout shells, cards, modals and lists avoid an explosion of configuration props. Slot content is compiled in the parent's scope, so it sees the parent's state and nothing of the child's, and it's handed to the child as functions: the child calls them when, where and as many times as it likes. That has a performance upside. Reactive data read only inside slot content is tracked by the child's render effect, so changing it re-renders the child, not the parent.\n\nThere are three flavours. The default slot (`<slot />`, with optional fallback content between the tags), named slots (`<slot name=\"header\" />`, filled with `<template #header>`, the shorthand for `v-slot:header`), and scoped slots, where the child passes data back: `<slot :item=\"item\" />` in the child, `<template #default=\"{ item }\">` in the parent. A scoped slot is Vue's render prop: the child owns iteration, data fetching or state, and the parent owns presentation (the `<FancyList>` pattern). `$slots` (or `useSlots()`) lets the child skip wrappers for slots that weren't passed, dynamic names work with `#[name]`, and `defineSlots()` types slot props in TypeScript.\n\nThe edges: once you use named slots, a scoped default slot needs an explicit `<template #default>`, because putting `v-slot` on the component tag alongside named templates is a compile error. A slot's `name` attribute is reserved and isn't part of its props. The child's `<style scoped>` doesn't reach slotted content, which belongs to the parent. And a renderless component that only exposes data through a scoped slot is usually better written as a composable, which avoids an extra component instance; keep scoped slots for cases that combine logic with markup.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "Vue.js: Slots", url: "https://vuejs.org/guide/components/slots.html", kind: "docs" },
        { label: "Vue.js API: defineSlots()", url: "https://vuejs.org/api/sfc-script-setup.html#defineslots", kind: "docs" },
        { label: "patterns.dev: Renderless Components", url: "https://www.patterns.dev/vue/renderless-components/", kind: "article" },
        { label: "sudheerj: Vue.js Interview Questions", url: "https://github.com/sudheerj/vuejs-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Vue.js Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=8pn9KEuXG28",
        videoId: "8pn9KEuXG28",
        durationLabel: "6:56:13",
        startSeconds: 15216,
        chapterLabel: "Slots and Lifecycle",
      },
      alternateVideos: [
        {
          title: "Vue Slots Simplified",
          channel: "LearnVue",
          url: "https://www.youtube.com/watch?v=orGcdmCRCc0",
          videoId: "orGcdmCRCc0",
          durationLabel: "7:24",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "vue-slots-q1",
          prompt:
            "`items` exists only in the child. What renders?\n\n```vue\n<!-- FancyList.vue -->\n<script setup>\nimport { ref } from 'vue'\nconst items = ref(['a', 'b'])\n</script>\n<template><ul><slot /></ul></template>\n\n<!-- Parent.vue template -->\n<FancyList>\n  <li v-for=\"item in items\">{{ item }}</li>\n</FancyList>\n```",
          options: [
            "No items: slot content is compiled in the parent's scope, where `items` doesn't exist (dev warning); the child must pass data through a scoped slot",
            "`a` and `b`, because slot content can read the child's state",
            "A compile error, because `v-for` isn't allowed in slot content",
            "`a` and `b` in development only",
          ],
          correctIndex: 0,
          explanation:
            "Expressions in the parent template only see the parent scope. To let slot content use child data, the child renders `<slot :items=\"items\" />` and the parent receives it with `v-slot=\"{ items }\"`.",
        },
        {
          id: "vue-slots-q2",
          prompt:
            "What happens when this parent template is compiled?\n\n```html\n<MyComponent v-slot=\"{ message }\">\n  <p>{{ message }}</p>\n  <template #footer>\n    <p>Footer</p>\n  </template>\n</MyComponent>\n```",
          options: [
            "A compile error: with named slots present, the default slot must use an explicit `<template #default=\"{ message }\">`",
            "It works, and `message` is available in both slots",
            "The footer renders, but `message` is undefined",
            "Only the default slot renders; the footer template is ignored",
          ],
          correctIndex: 0,
          explanation:
            "The compiler reports \"Mixed v-slot usage on both the component and nested <template>\", because it would be ambiguous whether `message` is in scope for the footer. Put every slot, including the default, in its own `<template>`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-slots-q3",
          prompt:
            "What is `headerProps`?\n\n```html\n<!-- child -->\n<slot name=\"header\" message=\"hello\"></slot>\n\n<!-- parent -->\n<template #header=\"headerProps\">...</template>\n```",
          options: ["`{ message: 'hello' }`", "`{ name: 'header', message: 'hello' }`", "`'hello'`", "`undefined`, because named slots can't pass props"],
          correctIndex: 0,
          explanation:
            "`name` is reserved for identifying the slot and isn't passed as a slot prop; every other attribute on `<slot>` is. Named scoped slots receive props exactly like default ones.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-slots-q4",
          prompt: "When is the text `Submit` rendered?\n\n```html\n<!-- SubmitButton.vue -->\n<button type=\"submit\"><slot>Submit</slot></button>\n```",
          options: [
            "Only when the parent provides no content for the default slot",
            "Always, before whatever content the parent passes",
            "Only when the parent passes a `#fallback` template",
            "Only in development builds",
          ],
          correctIndex: 0,
          explanation:
            "Content between `<slot>` tags is fallback content: `<SubmitButton />` renders `Submit`, while `<SubmitButton>Save</SubmitButton>` replaces it with `Save`.",
        },
        {
          id: "vue-slots-q5",
          prompt: "Which statements about how slots are compiled and rendered are true? (Select all that apply.)",
          options: [
            "Slot content is passed to the child as functions, and the child decides whether and how many times to call them",
            "Reactive data read only inside slot content is tracked by the child's render, so changing it re-renders the child but not the parent",
            "A child's `<style scoped>` rules apply to the slot content it renders",
            "Scoped slot props are also available in the parent's `<script setup>`",
            "`$slots.footer` lets a child skip rendering a footer wrapper when no footer was passed",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 4],
          explanation:
            "Slots are compiled to functions invoked during the child's render, so their reactive reads belong to the child. Slot props only exist inside the slot template, and scoped styles belong to the component that owns the markup (the parent), not the one that renders it.",
        },
        {
          id: "vue-slots-q6",
          prompt: "Which syntax fills a slot whose name is stored in `slotName`?",
          options: [
            "`<template #[slotName]>...</template>`",
            "`<template #{{ slotName }}>...</template>`",
            "`<template v-slot=\"slotName\">...</template>`",
            "`<template :slot=\"slotName\">...</template>`",
          ],
          correctIndex: 0,
          explanation:
            "`v-slot` supports dynamic arguments like any directive: `v-slot:[slotName]` or `#[slotName]`. `v-slot=\"slotName\"` would bind the default slot's props to a variable called `slotName`, and the `slot` attribute is Vue 2 syntax.",
        },
        {
          id: "vue-slots-q7",
          prompt: "Which React pattern is closest to a Vue scoped slot?",
          options: [
            "A render prop (or function-as-children): the child calls a parent-supplied function with its data",
            "`props.children` passed as pre-built elements",
            "A context Provider and `useContext`",
            "A higher-order component that wraps the child",
          ],
          correctIndex: 0,
          explanation:
            "A scoped slot is literally a function the child calls with slot props, which is what a render prop is. A plain default slot is closer to `children`, but even then Vue passes a function, not elements.",
        },
        {
          id: "vue-slots-q8",
          prompt:
            "Your `<MouseTracker v-slot=\"{ x, y }\">` renderless component only provides the mouse position. What does the Vue guide suggest, and when is a scoped slot still the better tool?",
          options: [
            "A `useMouse()` composable avoids the extra component instance; scoped slots still win when a component must own part of the markup too, like a list that renders each item through a slot",
            "Provide/inject, because slots can't pass reactive data",
            "A mixin, because composables can't use lifecycle hooks",
            "Keep the renderless component: it's the recommended pattern for all logic reuse",
          ],
          correctIndex: 0,
          explanation:
            "The guide notes that most renderless components are more efficient as composables. Scoped slots remain useful when logic and visual composition go together, as in its `<FancyList>` example.",
        },
        {
          id: "vue-slots-q9",
          prompt:
            "`FancyList` fetches a page of 10 items and renders `<li v-for=\"item in items\" :key=\"item.id\"><slot name=\"item\" v-bind=\"item\" /></li>`. The parent passes `<template #item=\"{ body, username }\">`. How is the slot used?",
          options: [
            "The slot function is called 10 times, once per item, each time with that item's fields as slot props",
            "It's called once, with the whole array",
            "It's called 10 times, but every call sees the last item",
            "It isn't called until the parent re-renders",
          ],
          correctIndex: 0,
          explanation:
            "The child controls iteration and calls the scoped slot for every item, passing that item's properties via `v-bind`. Each call gets its own props, so the parent's template destructures `body` and `username` per item.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-slots-q10",
          prompt: "Which statement about `defineSlots()` in `<script setup lang=\"ts\">` is true?",
          options: [
            "It takes only a type parameter (no runtime argument), types each slot's props, and returns the same object as `useSlots()`",
            "It registers slots at runtime so that missing slots throw an error",
            "It replaces the `<slot>` elements in the template",
            "Scoped slots only work in components that call it",
          ],
          correctIndex: 0,
          explanation:
            "`defineSlots<{ default(props: { item: T }): any }>()` (3.3+) exists for type checking and editor support. It has no runtime effect on which slots exist; `<slot>` in the template still renders them.",
        },
      ],
    },
    {
      id: "vue-provide-inject",
      moduleId: "fe-vue",
      trackId: "frontend",
      title: "Provide / Inject",
      summary:
        "Provide/inject is dependency injection for a component subtree: an ancestor calls `provide(key, value)` and any descendant, however deep, calls `inject(key)`, without the components in between knowing. It solves prop drilling for cross-cutting concerns such as a form context, a theme, design-system configuration or an API client. `app.provide()` makes a value available to the whole app, which is how plugins work: Vue Router provides the router, and Pinia provides the store registry that `useStore()` injects.\n\nUnlike React context there's no Provider component and no re-render cascade: `provide` hands over a reference once. Reactivity comes from what you provide. Provide a ref or a reactive object and injectors stay in sync (a ref is injected as-is, not unwrapped), and only the components that actually read it during render update; provide `count.value` and every injector gets a frozen snapshot. The guide's advice: keep mutations in the provider and provide functions that change the state, wrap values in `readonly()` when injectors mustn't write, and use `Symbol` keys, typed with `InjectionKey<T>`, in large apps and libraries.\n\nThe resolution rules catch people out. Lookup starts at the parent, so a component can't inject what it provides itself, and the nearest ancestor shadows those above it. `provide` and `inject` must run synchronously during setup (an `inject` inside a `setTimeout` warns and returns `undefined`). A missing key warns unless you pass a default, and a function default is used as the value itself unless the third argument is `true`, which marks it as a factory. The tradeoff is implicit coupling: an injected dependency doesn't appear in the child's props, so reserve provide/inject for genuinely cross-cutting concerns, use a store for global app state, and never keep per-user state in module-level singletons on an SSR server.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "Vue.js: Provide / Inject", url: "https://vuejs.org/guide/components/provide-inject.html", kind: "docs" },
        { label: "Vue.js: Typing Provide / Inject", url: "https://vuejs.org/guide/typescript/composition-api.html#typing-provide-inject", kind: "docs" },
        { label: "patterns.dev: Provide/Inject", url: "https://www.patterns.dev/vue/provide-inject/", kind: "article" },
        { label: "Vue.js: SSR, Cross-Request State Pollution", url: "https://vuejs.org/guide/scaling-up/ssr.html#cross-request-state-pollution", kind: "docs" },
      ],
      video: {
        title: "Vue.js Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=8pn9KEuXG28",
        videoId: "8pn9KEuXG28",
        durationLabel: "6:56:13",
        startSeconds: 13589,
        chapterLabel: "Provide and Inject",
      },
      alternateVideos: [
        {
          title: "Vue JS 3 Tutorial - 60 - Replacing Provide/Inject",
          channel: "Codevolution",
          url: "https://www.youtube.com/watch?v=VS7Qy0TYtN0",
          videoId: "VS7Qy0TYtN0",
          durationLabel: "10:47",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "vue-provide-inject-q1",
          prompt:
            "A deep child does `const snapshot = inject('snapshot')` and `const live = inject('live')` and renders `<p>{{ snapshot }} / {{ live }}</p>`. What does it show one second later?\n\n```vue\n<!-- Provider.vue -->\n<script setup>\nimport { ref, provide } from 'vue'\nconst count = ref(0)\nprovide('snapshot', count.value)\nprovide('live', count)\nsetTimeout(() => { count.value = 5 }, 1000)\n</script>\n```",
          options: ["`0 / 5`", "`5 / 5`", "`0 / 0`", "`0 / [object Object]`"],
          correctIndex: 0,
          explanation:
            "`count.value` is a plain number at the moment it's provided. The ref itself is injected as-is and stays connected; it's auto-unwrapped because `live` is a top-level template binding.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-provide-inject-q2",
          prompt:
            "`App` calls `provide('theme', 'light')`, a `Sidebar` inside it calls `provide('theme', 'dark')`, and a `Button` inside the sidebar calls `inject('theme')`. What does it get?",
          options: ["`'dark'`", "`'light'`", "`['light', 'dark']`", "`undefined`, with a warning about a duplicate key"],
          correctIndex: 0,
          explanation:
            "Injection walks up the parent chain and the closest provider wins, shadowing the ones above it. That's how nested providers override app-wide defaults.",
        },
        {
          id: "vue-provide-inject-q3",
          prompt:
            "No ancestor provides `locale`. What is `locale` inside this component?\n\n```js\n// in one component's <script setup>\nprovide('locale', 'fr')\nconst locale = inject('locale', 'en')\n```",
          options: [
            "`'en'`: `inject()` only looks at ancestors, never at the component's own provides",
            "`'fr'`, because provide and inject in one component share a scope",
            "`undefined`, with a warning",
            "`'fr'` in development and `'en'` in production",
          ],
          correctIndex: 0,
          explanation:
            "Lookup starts from the parent's provides, so a component's own `provide` is only visible to its descendants. Here the default is used.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-provide-inject-q4",
          prompt:
            "What happens?\n\n```js\n// in <script setup>\nsetTimeout(() => {\n  const api = inject('api')\n  api.get('/me')\n}, 0)\n```",
          options: [
            "`inject()` warns that it can only be used inside `setup()`, returns `undefined`, and `api.get` throws",
            "It works, because the callback is created during setup",
            "It works in `<script setup>` but not in `setup()`",
            "It returns the app-level value, ignoring component providers",
          ],
          correctIndex: 0,
          explanation:
            "Like lifecycle hooks, `inject()` needs the active component instance, which only exists during synchronous setup. Inject at the top level of setup and use the value later.",
        },
        {
          id: "vue-provide-inject-q5",
          prompt: "Which practices does the Vue guide recommend for provide/inject? (Select all that apply.)",
          options: [
            "Keep mutations in the provider and provide functions that update the state",
            "Wrap a provided value in `readonly()` when injectors mustn't change it",
            "Use `Symbol` injection keys in large apps or when authoring components for others",
            "Provide `ref.value` instead of the ref so injectors can't mutate it",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Co-locating state and its mutations, `readonly()`, and Symbol keys (exported from a shared file) are all in the guide. Providing `.value` doesn't make anything safe; it just breaks reactivity.",
        },
        {
          id: "vue-provide-inject-q6",
          prompt:
            "What are the types of `a` and `b`?\n\n```ts\nimport type { InjectionKey } from 'vue'\nconst key = Symbol() as InjectionKey<string>\n\nprovide(key, 'foo')\nconst a = inject(key)\nconst b = inject(key, 'bar')\n```",
          options: [
            "`a: string | undefined` and `b: string`",
            "`a: string` and `b: string`",
            "`a: unknown` and `b: string`",
            "`a: InjectionKey<string>` and `b: string`",
          ],
          correctIndex: 0,
          explanation:
            "`InjectionKey<T>` keeps the value type in sync between `provide` and `inject`, but nothing guarantees a provider exists at runtime, so `inject` without a default includes `undefined`. A default narrows it; a string key without a generic gives `unknown`.",
        },
        {
          id: "vue-provide-inject-q7",
          prompt:
            "No ancestor provides either key. What are `onSave` and `cache`?\n\n```js\nconst onSave = inject('onSave', () => console.log('saved'))\nconst cache = inject('cache', () => new Map(), true)\n```",
          options: [
            "`onSave` is the arrow function itself; `cache` is a new `Map` created by calling the factory",
            "Both are the result of calling their function",
            "Both are the functions themselves",
            "`onSave` is `undefined`, because function defaults need the third argument",
          ],
          correctIndex: 0,
          explanation:
            "A default value is returned as-is unless the third argument is `true`, which tells `inject` to treat it as a factory. That lets you inject callbacks with a no-op default and still create expensive defaults lazily.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-provide-inject-q8",
          prompt:
            "A provider does `provide('user', user)` with `const user = ref(...)`. Ten descendants inject it, but only two read `user.value` in their templates. When `user.value` changes, what re-renders?",
          options: [
            "Only the two components whose render read `user.value`",
            "The provider and its whole subtree, like a changed React context value",
            "All ten components that injected it",
            "Nothing until `triggerRef(user)` is called",
          ],
          correctIndex: 0,
          explanation:
            "Provide/inject just passes a reference; updates flow through normal dependency tracking, so only effects that read the ref re-run. There's no provider-driven cascade.",
        },
        {
          id: "vue-provide-inject-q9",
          prompt: "How does calling `useUserStore()` inside a component find the right Pinia instance?",
          options: [
            "It injects the pinia instance that `app.use(pinia)` provided at the app level, which is why calling it at a module's top level before Pinia is installed fails",
            "It imports a global singleton created by `defineStore`",
            "It reads a property on `window`",
            "Every call creates a new store instance",
          ],
          correctIndex: 0,
          explanation:
            "Pinia's docs describe `useStore()` as injecting the pinia instance given to the app, the same app-level provide mechanism any plugin can use. Outside components it has to run after `app.use(pinia)` (for example inside a navigation guard).",
        },
        {
          id: "vue-provide-inject-q10",
          prompt:
            "Why prefer `app.provide()` (or a Pinia store) over `export const session = reactive({})` in a module for per-user state in an SSR app?",
          options: [
            "The module is evaluated once per server process, so the singleton is shared by every request and can leak one user's data into another's page; app-level provides are created per app instance",
            "Module-level reactive objects aren't reactive during SSR",
            "`reactive()` objects can't be exported from a module",
            "Provide/inject hydrates faster on the client",
          ],
          correctIndex: 0,
          explanation:
            "The SSR guide calls this cross-request state pollution. Creating a fresh app (and its provides or pinia) per request isolates state; in a browser-only SPA the module singleton is fine.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "vue-composables",
      moduleId: "fe-vue",
      trackId: "frontend",
      title: "Building Composables",
      summary:
        "A composable is a function that uses the Composition API (refs, computeds, watchers, lifecycle hooks) to encapsulate stateful logic: `useMouse()`, `useFetch(url)`, `useLocalStorage(key)`. It's Vue's answer to mixins, which hid where properties came from and collided on names, and it looks like a React custom hook, but the execution model differs. `setup` runs once per component instance, so a composable runs once: no rules-of-hooks ordering, no dependency arrays, no stale closures, and cleanup is explicit. The one hard rule is context. Call composables synchronously in `setup` or `<script setup>` (after an `await` only in `<script setup>`, whose compiler restores the instance), because their lifecycle hooks and watchers attach to the active component.\n\nThe conventions exist to preserve reactivity. Name it `useX`. Accept `MaybeRefOrGetter<T>` inputs and normalize them with `toValue()` inside a `watchEffect`, `computed` or watch getter, so a ref or `() => props.id` stays tracked; calling `toValue(input)` once at the top captures a snapshot. Return a plain object of refs so callers can destructure without losing reactivity (returning a `reactive()` object breaks on destructuring; callers who prefer property access can wrap the result in `reactive()`). Clean up whatever you start: remove listeners and timers in `onUnmounted`, or in `onScopeDispose`, which also works when the composable runs inside an `effectScope()` or a Pinia setup store.\n\nSSR is where composables fail in production. Touching `window` or `document` in the composable body crashes on the server, so DOM work goes in `onMounted`, which only runs in the browser. State declared at module scope, outside the function, is shared by every caller: a handy global store in the browser, but a data leak between requests on a server. VueUse is the reference library for these patterns and worth checking before writing your own.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Vue.js: Composables", url: "https://vuejs.org/guide/reusability/composables.html", kind: "docs" },
        { label: "Anthony Fu: Composable Vue", url: "https://antfu.me/posts/composable-vue-vueday-2021", kind: "article" },
        { label: "VueUse: Guidelines", url: "https://vueuse.org/guidelines", kind: "article" },
        { label: "Vue.js API: toValue()", url: "https://vuejs.org/api/reactivity-utilities.html#tovalue", kind: "docs" },
      ],
      video: {
        title: "Is your function REALLY a Vue composable?",
        channel: "Alexander Lichter",
        url: "https://www.youtube.com/watch?v=N0QrFKBZuqA",
        videoId: "N0QrFKBZuqA",
        durationLabel: "10:52",
      },
      alternateVideos: [
        {
          title: "Alexander Lichter - The Composable Handbook   Stop Writing Bad Composables",
          channel: "Vuejs Amsterdam",
          url: "https://www.youtube.com/watch?v=rSrCtrqiik8",
          videoId: "rSrCtrqiik8",
          durationLabel: "29:42",
        },
        {
          title: "Build your own Custom Composables in Vue",
          channel: "Vue Mastery",
          url: "https://www.youtube.com/watch?v=bcZM3EogPJE",
          videoId: "bcZM3EogPJE",
          durationLabel: "12:13",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "vue-composables-q1",
          prompt:
            "A component calls `useFetch(() => '/api/users/' + id.value)`. What happens when `id` changes?\n\n```js\nexport function useFetch(url) {\n  const data = ref(null)\n  const target = toValue(url)\n  fetch(target)\n    .then((r) => r.json())\n    .then((json) => (data.value = json))\n  return { data }\n}\n```",
          options: [
            "Nothing: `toValue(url)` ran once during setup, outside any effect, so the getter was called once and never tracked",
            "It refetches, because `toValue` tracks getters automatically",
            "It throws, because `fetch` needs a string rather than a function",
            "It refetches twice, once for the old id and once for the new one",
          ],
          correctIndex: 0,
          explanation:
            "`toValue` only normalizes; tracking happens when it's called inside an effect. Wrap the request in `watchEffect(() => { const target = toValue(url); ... })` (with cleanup for stale responses) so changes to `id` re-run it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-composables-q2",
          prompt:
            "What's the problem?\n\n```js\nfunction useMouse() {\n  const state = reactive({ x: 0, y: 0 })\n  // listeners update state.x and state.y\n  return state\n}\n\nconst { x, y } = useMouse()\n```",
          options: [
            "`x` and `y` are plain numbers frozen at 0; return refs (or `toRefs(state)`) so destructuring keeps the connection",
            "Nothing: `reactive()` is deep, so the destructured values stay reactive",
            "Destructuring a reactive object throws an error",
            "They update, but only when used in the template",
          ],
          correctIndex: 0,
          explanation:
            "Destructuring reads the current primitive values off the proxy, which disconnects them. The recommended convention is to return a plain object of refs; callers who want property access can use `reactive(useMouse())`.",
        },
        {
          id: "vue-composables-q3",
          prompt: "Which of these are composables in the Vue sense? (Select all that apply.)",
          options: [
            "`useMouse()`, which creates refs and adds and removes listeners in `onMounted`/`onUnmounted`",
            "`formatDate(date)`, which returns a formatted string",
            "`useDebouncedRef(value, delay)`, built on `customRef`",
            "`useLocalStorage(key)`, which returns a ref and persists it with `watch`",
            "`sum(a, b)`",
          ],
          correctIndex: 0,
          correctIndices: [0, 2, 3],
          explanation:
            "A composable encapsulates stateful logic with Composition API primitives. Pure functions like `formatDate` and `sum` are ordinary utilities, and giving them a `use` prefix doesn't make them composables.",
        },
        {
          id: "vue-composables-q4",
          prompt:
            "Inside `<script setup>`, a React developer writes `if (props.enabled) useFeature()`. What actually happens?",
          options: [
            "It runs at most once, during setup; if `props.enabled` changes later, the composable is neither set up nor torn down",
            "Vue throws, because composables can't be called conditionally",
            "`useFeature` re-runs every time `props.enabled` changes",
            "It breaks hook ordering on the next render, as in React",
          ],
          correctIndex: 0,
          explanation:
            "Setup runs once, so there's no hook-order invariant to break, but there's also no re-run: the condition is evaluated a single time. To react to `enabled`, pass it in (as a getter) and let the composable watch it.",
        },
        {
          id: "vue-composables-q5",
          prompt:
            "`useWindowSize()` registers `onMounted`/`onUnmounted` internally. What goes wrong here?\n\n```js\nexport default {\n  async setup() {\n    const config = await loadConfig()\n    const { width } = useWindowSize()\n    return { config, width }\n  },\n}\n```",
          options: [
            "After the `await` there's no active component instance, so the composable's hooks warn and aren't registered, and its listener is never removed",
            "Nothing: composables can be called anywhere inside `setup`",
            "`useWindowSize` runs twice",
            "The component renders before `config` has loaded",
          ],
          correctIndex: 0,
          explanation:
            "Composables must be called synchronously in `setup`. `<script setup>` is the only place where calling them after `await` is safe, because its compiler restores the instance context after the async operation.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-composables-q6",
          prompt: "What do `toValue(() => props.id)` and `unref(() => props.id)` return?",
          options: [
            "`toValue` calls the getter and returns the id; `unref` returns the function unchanged",
            "Both return the id",
            "Both return the function",
            "`toValue` returns a ref; `unref` returns the id",
          ],
          correctIndex: 0,
          explanation:
            "`unref` only unwraps refs. `toValue` (3.3+) also normalizes getters, which is why it's the right tool for `MaybeRefOrGetter` inputs.",
        },
        {
          id: "vue-composables-q7",
          prompt:
            "This composable is used in an SSR app. Which statements are true? (Select all that apply.)\n\n```js\nexport function useScroll() {\n  const y = ref(window.scrollY)\n  window.addEventListener('scroll', () => (y.value = window.scrollY))\n  return { y }\n}\n```",
          options: [
            "`window` doesn't exist on the server, so setup throws during server rendering",
            "The listener is never removed, so every mount leaks a handler",
            "`ref(window.scrollY)` isn't reactive because it's a number",
            "Composables can't return refs",
            "Moving the DOM work into `onMounted` (which only runs in the browser) and removing the listener in `onUnmounted` fixes both problems",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 4],
          explanation:
            "DOM-specific side effects belong in post-mount hooks, and whatever a composable starts it must stop. Refs are the right way to hold primitives, and returning refs is the recommended convention.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-composables-q8",
          prompt:
            "Two components call `useCounter()`. Which statement is true?\n\n```js\nconst count = ref(0) // module scope\n\nexport function useCounter() {\n  const increment = () => count.value++\n  return { count, increment }\n}\n```",
          options: [
            "Both share one `count` (a simple global store), and on an SSR server it's also shared between requests",
            "Each component gets its own `count`",
            "`count` isn't reactive because it's created outside a component",
            "Vue warns about refs created outside `setup`",
          ],
          correctIndex: 0,
          explanation:
            "State created at module scope is shared by every caller; state created inside the function is per call. That's a valid store pattern in the browser, but on a server the module lives across requests.",
        },
        {
          id: "vue-composables-q9",
          prompt: "Why is `onScopeDispose()` often preferred over `onUnmounted()` for cleanup in reusable composables?",
          options: [
            "It runs when the active effect scope stops, which covers components and also composables run inside `effectScope()` or a Pinia setup store; `onUnmounted` only works in components",
            "It runs before the component's DOM is removed, while `onUnmounted` runs too late",
            "`onUnmounted` doesn't run for components inside `<KeepAlive>`",
            "It also runs on the server during SSR",
          ],
          correctIndex: 0,
          explanation:
            "Components run setup inside their own effect scope, so `onScopeDispose` behaves like `onUnmounted` there, and it keeps working when the composable is used outside components. (In 3.5+, passing `true` as the second argument silences the warning when there's no active scope.)",
        },
        {
          id: "vue-composables-q10",
          prompt:
            "`function useTitle(title: MaybeRefOrGetter<string>)`. Which calls type-check? (Select all that apply.)",
          options: [
            "`useTitle('Home')`",
            "`useTitle(ref('Home'))`",
            "`useTitle(() => props.title)`",
            "`useTitle(reactive({ title: 'Home' }))`",
            "`useTitle(computed(() => 'Page ' + page.value))`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 4],
          explanation:
            "`MaybeRefOrGetter<T>` accepts a plain value, a ref (computed refs included) or a getter. A reactive object isn't a `string`, a ref or a function, so it's rejected.",
        },
        {
          id: "vue-composables-q11",
          prompt:
            "A Pinia store is a composable that returns a `reactive()` object. With state `items`, getter `total` and action `addItem`, which statements are true? (Select all that apply.)\n\n```js\nconst store = useCartStore()\nconst { total, addItem } = store\nconst { items } = storeToRefs(store)\n```",
          options: [
            "`total` is a plain value frozen at the moment it was destructured",
            "`addItem()` still works, because actions are bound to the store",
            "`items` is a ref that stays in sync with the store",
            "`storeToRefs(store)` would also have returned `addItem`, wrapped in a ref",
            "Destructuring `total` throws in development to warn about lost reactivity",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Destructuring a reactive object copies current values, the same trap as returning `reactive()` from a composable. `storeToRefs` creates refs for state and getters only and skips actions, which are safe to destructure directly. Vue doesn't warn about the lost reactivity.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "vue-router",
      moduleId: "fe-vue",
      trackId: "frontend",
      title: "Vue Router: Matching, Navigation & Guards",
      summary:
        "Vue Router maps URLs to component trees and turns navigation into an asynchronous, cancellable pipeline. Vue Router 5 (January 2026) is a transition release: it merges file-based routing (formerly unplugin-vue-router) into the core package with no breaking changes for Vue Router 4 code, and Vue Router 6 is planned to be ESM-only. The history mode is a deployment decision. `createWebHistory()` gives clean URLs but needs the server to fall back to `index.html` for unknown paths, `createWebHashHistory()` needs no server config but hurts SEO, and `createMemoryHistory()` suits SSR and tests and doesn't trigger the initial navigation.\n\nMatching is ranked by specificity, not by definition order: a static segment beats a param with a custom regex, which beats a plain param, and a catch-all such as `/:pathMatch(.*)*` ranks last. When only params change (`/users/1` to `/users/2`) the same component instance is reused, so refetch by watching `() => route.params.id` or with `onBeforeRouteUpdate`; per-route `beforeEnter` guards don't fire for that change either. `useRoute()` is reactive (watch specific properties) and `useRouter()` navigates. Lazy routes (`component: () => import('./User.vue')`) are fetched on first visit and cached; don't wrap route components in `defineAsyncComponent`.\n\nGuards return `false` to abort, a route location to redirect, or nothing (or `true`) to continue, and they can be async. The optional third `next` argument still works but is a classic bug source (calling it twice). The order is leave guards, global `beforeEach`, `beforeRouteUpdate`, `beforeEnter`, async components, `beforeRouteEnter`, global `beforeResolve` (the last guard before confirmation), then `afterEach`. `router.push()` resolves rather than rejects when a navigation doesn't happen, with a navigation failure (`aborted`, `cancelled` or `duplicated`) as its value. Watch for redirect loops (check `to.name !== 'Login'`) and for calling a Pinia store at the top level of a router module before Pinia is installed.",
      level: "advanced",
      estMinutes: 110,
      isMilestone: true,
      webRefs: [
        { label: "Vue Router: Navigation Guards", url: "https://router.vuejs.org/guide/advanced/navigation-guards.html", kind: "docs" },
        { label: "Vue Router: Routes' Matching Syntax", url: "https://router.vuejs.org/guide/essentials/route-matching-syntax.html", kind: "docs" },
        { label: "Vue Router: Different History modes", url: "https://router.vuejs.org/guide/essentials/history-mode.html", kind: "docs" },
        { label: "Vue Router: Migrating to Vue Router 5", url: "https://router.vuejs.org/guide/migration/v4-to-v5.html", kind: "article" },
      ],
      video: {
        title: "Vue.js Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=8pn9KEuXG28",
        videoId: "8pn9KEuXG28",
        durationLabel: "6:56:13",
        startSeconds: 17832,
        chapterLabel: "Routing",
      },
      alternateVideos: [
        {
          title: "Vue JS 3 Tutorial for Beginners #8 - The Vue Router",
          channel: "Net Ninja",
          url: "https://www.youtube.com/watch?v=juocv4AtrHo",
          videoId: "juocv4AtrHo",
          durationLabel: "47:47",
        },
        {
          title: "Vue 3 Composition API Tutorial #6 - Vue Router",
          channel: "Make Apps with Danny",
          url: "https://www.youtube.com/watch?v=UCI9dO4Vxvk",
          videoId: "UCI9dO4Vxvk",
          durationLabel: "14:47",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement a simplified Vue Router: `createMatcher(routes)` and `navigate(matcher, toPath, from, guards)`.\n\n**Matching.** `routes` are `{ path, name, meta, beforeEnter? }` records. Split paths on `/` and ignore empty segments (so `/users/` equals `/users`, and `/` has no segments). Each pattern segment is either static text or a single param:\n\n- `:id` matches any one segment; `:id(\\d+)` only matches a segment the regex fully matches (test the raw segment).\n- `:id?` is optional; `:rest+` and `:rest*` repeat (one or more, or zero or more, segments), and their value is an array. These modifiers only appear on a pattern's last segment.\n- Static segments compare case-insensitively. Param values are decoded with `decodeURIComponent`.\n\n`resolve(path)` returns `{ name, path, params, meta, record }` for the best match, or `null`. Here `path` is `/` followed by the segments joined with `/`, and an absent optional param is left out of `params`. When several routes match, score each pattern segment: static 4, param with a custom regex 3, plain param 2, optional 1, repeatable 0. Compare the score lists left to right and the first difference decides. If one list is a prefix of the other, the longer one wins (as in Vue Router, `/users/:id?` beats `/users` for `/users`), unless its extra last segment is a catch-all whose regex is exactly `.*`, in which case the shorter one wins. If the lists are identical, the route defined first wins.\n\n**Navigation.** `navigate` returns a promise of a result object:\n\n- Resolve `toPath`. If nothing matches, return `{ status: \"not-found\", path: toPath }`. If `from` isn't null and the resolved `path` equals `from.path`, return `{ status: \"duplicated\" }`. Neither case runs any guard.\n- Run the global guards in order with `await guard(to, from)`, then the record's `beforeEnter`, but only if `from` is null or `from.name !== to.name`.\n- `undefined` or `true` moves on; `false` returns `{ status: \"aborted\" }`; a string is a redirect: skip the remaining guards and start again with that path and the same `from`. More than 10 redirects returns `{ status: \"error\", message: \"Too many redirects\" }`.\n- A guard that throws or rejects returns `{ status: \"error\", message: error.message }`.\n- Otherwise return `{ status: \"ok\", name, path, params }`, plus `redirectedFrom` (the resolved path of the original target) if a redirect happened.\n\nThe tests call `runRouterScenario(routes, guards, navigations)`, which builds guard functions from small rule objects, runs each navigation from the current route and returns the results plus a log of guard calls. Leave the driver as it is.",
        starterCode: ROUTER_STARTER,
        functionName: "runRouterScenario",
        testCases: [
          {
            description: "a static segment beats a param, whatever order the routes are defined in",
            args: [[{ path: "/users/:id", name: "user" }, { path: "/users/new", name: "newUser" }], [], ["/users/new", "/users/42"]],
            expected: {
              results: [
                { status: "ok", name: "newUser", path: "/users/new", params: {} },
                { status: "ok", name: "user", path: "/users/42", params: { id: "42" } },
              ],
              log: [],
            },
          },
          {
            description: "a param with a custom regex outranks a plain param",
            args: [[{ path: "/:slug", name: "slug" }, { path: "/:orderId(\\d+)", name: "order" }], [], ["/25", "/shoes"]],
            expected: {
              results: [
                { status: "ok", name: "order", path: "/25", params: { orderId: "25" } },
                { status: "ok", name: "slug", path: "/shoes", params: { slug: "shoes" } },
              ],
              log: [],
            },
          },
          {
            description: "a catch-all ranks last and collects the remaining segments into an array",
            args: [[{ path: "/:pathMatch(.*)*", name: "notFound" }, { path: "/docs/:page", name: "doc" }], [], ["/docs/intro", "/docs/a/b"]],
            expected: {
              results: [
                { status: "ok", name: "doc", path: "/docs/intro", params: { page: "intro" } },
                { status: "ok", name: "notFound", path: "/docs/a/b", params: { pathMatch: ["docs", "a", "b"] } },
              ],
              log: [],
            },
          },
          {
            description: "optional params, trailing slashes, case-insensitive static segments and decoded params",
            args: [[{ path: "/users/:id?", name: "users" }, { path: "/search/:q", name: "search" }], [], ["/users", "/USERS/7/", "/search/hello%20world"]],
            expected: {
              results: [
                { status: "ok", name: "users", path: "/users", params: {} },
                { status: "ok", name: "users", path: "/USERS/7", params: { id: "7" } },
                { status: "ok", name: "search", path: "/search/hello%20world", params: { q: "hello world" } },
              ],
              log: [],
            },
            isEdgeCase: true,
          },
          {
            description: "when one route's scores are a prefix of another's, the longer wins unless its extra segment is a catch-all",
            args: [
              [
                { path: "/:pathMatch(.*)*", name: "notFound" },
                { path: "/users/:id?", name: "users" },
                { path: "/users", name: "userList" },
                { path: "/", name: "home" },
              ],
              [],
              ["/users", "/users/3", "/"],
            ],
            expected: {
              results: [
                { status: "ok", name: "users", path: "/users", params: {} },
                { status: "ok", name: "users", path: "/users/3", params: { id: "3" } },
                { status: "ok", name: "home", path: "/", params: {} },
              ],
              log: [],
            },
            isEdgeCase: true,
          },
          {
            description: "an auth guard redirects to /login (recording redirectedFrom), then lets the user through after login",
            args: [ROUTER_AUTH_ROUTES, [{ if: { meta: "requiresAuth", loggedOut: true }, then: { redirect: "/login" } }], ["/admin", { login: true }, "/admin"]],
            expected: {
              results: [
                { status: "ok", name: "login", path: "/login", params: {}, redirectedFrom: "/admin" },
                { status: "ok", name: "admin", path: "/admin", params: {} },
              ],
              log: ["g0:/admin", "g0:/login", "g0:/admin"],
            },
          },
          {
            description: "returning false aborts the navigation and the current route stays put",
            args: [ROUTER_AUTH_ROUTES, [{ if: { name: "admin" }, then: { abort: true } }], ["/admin", "/login"]],
            expected: {
              results: [{ status: "aborted" }, { status: "ok", name: "login", path: "/login", params: {} }],
              log: ["g0:/admin", "g0:/login"],
            },
            isEdgeCase: true,
          },
          {
            description: "guards run in order; true moves on, and the first false stops the rest from running",
            args: [
              ROUTER_AUTH_ROUTES,
              [
                { if: { always: true }, then: { allow: true } },
                { if: { name: "admin" }, then: { abort: true } },
                { if: { always: true }, then: { allow: true } },
              ],
              ["/admin"],
            ],
            expected: { results: [{ status: "aborted" }], log: ["g0:/admin", "g1:/admin"] },
          },
          {
            description: "two guards that redirect to each other fail after more than 10 redirects",
            args: [
              [{ path: "/a", name: "a" }, { path: "/b", name: "b" }],
              [{ if: { name: "a" }, then: { redirect: "/b" } }, { if: { name: "b" }, then: { redirect: "/a" } }],
              ["/a"],
            ],
            expected: {
              results: [{ status: "error", message: "Too many redirects" }],
              log: [
                "g0:/a", "g0:/b", "g1:/b", "g0:/a", "g0:/b", "g1:/b", "g0:/a", "g0:/b",
                "g1:/b", "g0:/a", "g0:/b", "g1:/b", "g0:/a", "g0:/b", "g1:/b", "g0:/a",
              ],
            },
            isEdgeCase: true,
          },
          {
            description: "navigating to the current location is 'duplicated' and runs no guards",
            args: [ROUTER_AUTH_ROUTES, [{ if: { always: true }, then: { allow: true } }], ["/login", "/login/"]],
            expected: { results: [{ status: "ok", name: "login", path: "/login", params: {} }, { status: "duplicated" }], log: ["g0:/login"] },
            isEdgeCase: true,
          },
          {
            description: "async guards are awaited, and a guard that throws fails the navigation with its message",
            args: [
              [...ROUTER_AUTH_ROUTES, { path: "/boom", name: "boom" }],
              [
                { if: { always: true }, then: { allow: true }, async: true },
                { if: { name: "boom" }, then: { throw: "Guard exploded" }, async: true },
              ],
              ["/boom", "/login"],
            ],
            expected: {
              results: [{ status: "error", message: "Guard exploded" }, { status: "ok", name: "login", path: "/login", params: {} }],
              log: ["g0:/boom", "g1:/boom", "g0:/login", "g1:/login"],
            },
          },
          {
            description: "beforeEnter runs when entering a route from a different one, not when only its params change",
            args: [
              [
                { path: "/", name: "home" },
                { path: "/login", name: "login" },
                { path: "/users/:id", name: "user", beforeEnter: { if: { paramEquals: ["id", "0"] }, then: { redirect: "/login" } } },
              ],
              [],
              ["/users/1", "/users/0", "/", "/users/0"],
            ],
            expected: {
              results: [
                { status: "ok", name: "user", path: "/users/1", params: { id: "1" } },
                { status: "ok", name: "user", path: "/users/0", params: { id: "0" } },
                { status: "ok", name: "home", path: "/", params: {} },
                { status: "ok", name: "login", path: "/login", params: {}, redirectedFrom: "/users/0" },
              ],
              log: ["enter:/users/1", "enter:/users/0"],
            },
            isEdgeCase: true,
          },
          {
            description: "a leave-style guard can block navigating away from a route",
            args: [[{ path: "/", name: "home" }, { path: "/editor", name: "editor" }], [{ if: { fromName: "editor" }, then: { abort: true } }], ["/editor", "/"]],
            expected: { results: [{ status: "ok", name: "editor", path: "/editor", params: {} }, { status: "aborted" }], log: ["g0:/editor", "g0:/"] },
          },
          {
            description: "a path no route matches is not-found and runs no guards",
            args: [[{ path: "/", name: "home" }], [{ if: { always: true }, then: { allow: true } }], ["/nope", "/"]],
            expected: { results: [{ status: "not-found", path: "/nope" }, { status: "ok", name: "home", path: "/", params: {} }], log: ["g0:/"] },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "vue-pinia",
      moduleId: "fe-vue",
      trackId: "frontend",
      title: "Pinia State Management",
      summary:
        "Pinia is Vue's official store library and Vuex's successor: no mutations, no namespaced modules, full TypeScript inference, devtools support, and SSR-safe state because stores live on a `pinia` instance installed per app. Option stores (`state`, `getters`, `actions`) are the easy path; setup stores are a setup function in which refs become state, computeds become getters and functions become actions, so watchers and composables work inside it. A setup store must return every piece of state (no private state) and has no built-in `$reset()`: calling it throws, so write your own. Pinia 4 (July 2026) is ESM-only and needs `@vue/devtools-api` installed alongside it; the store API is unchanged.\n\nThe store is a `reactive()` object, so destructuring it loses reactivity. `storeToRefs(store)` extracts refs for state and getters and skips actions, which you can destructure directly because they're bound to the store. `$patch(object)` deep-merges plain objects but replaces arrays; `$patch(fn)` groups arbitrary mutations such as array pushes. Either one counts as a single entry for subscribers and devtools. Assigning `store.$state` is a shallow `Object.assign` inside a function patch, and an option store's `$reset()` applies a fresh `state()` the same way. `$subscribe` reports the mutation type (`'direct'`, `'patch object'` or `'patch function'`) and is batched per tick by default (`{ flush: 'sync' }` reports every change); `$onAction` wraps every action call with `after` and `onError` hooks for logging and error reporting.\n\nPlugins (`pinia.use()`) apply only to stores created after they're registered and after Pinia is installed in the app; add non-reactive objects such as the router with `markRaw`. Outside components, call `useStore()` inside the function that needs it (a navigation guard, not the top of the router module) so it runs after `app.use(pinia)`. Coming from React, Pinia is closer to Zustand than to Redux: actions mutate state directly and there are no selectors.",
      level: "advanced",
      estMinutes: 100,
      isMilestone: true,
      webRefs: [
        { label: "Pinia: Defining a Store", url: "https://pinia.vuejs.org/core-concepts/", kind: "docs" },
        { label: "Pinia: State", url: "https://pinia.vuejs.org/core-concepts/state.html", kind: "docs" },
        { label: "Pinia: Plugins", url: "https://pinia.vuejs.org/core-concepts/plugins.html", kind: "docs" },
        { label: "vuejs/pinia: v4.0.0 release notes", url: "https://github.com/vuejs/pinia/releases/tag/v4.0.0", kind: "repo" },
      ],
      video: {
        title: "Vue.js Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=8pn9KEuXG28",
        videoId: "8pn9KEuXG28",
        durationLabel: "6:56:13",
        startSeconds: 22557,
        chapterLabel: "Pinia",
      },
      alternateVideos: [
        {
          title: "Pinia Crash Course #10 - Resetting State & storeToRefs",
          channel: "Net Ninja",
          url: "https://www.youtube.com/watch?v=ANRR0kse_r0",
          videoId: "ANRR0kse_r0",
          durationLabel: "5:46",
        },
        {
          title: "Learn Pinia Setup Stores in 30 MINUTES! (Vue JS 3)",
          channel: "Make Apps with Danny",
          url: "https://www.youtube.com/watch?v=zPeA1q00A54",
          videoId: "zPeA1q00A54",
          durationLabel: "33:41",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement a small, synchronous Pinia for option stores: `createPinia()` and `defineStore(id, options)`.\n\n- `createPinia()` returns a registry with `use(plugin)`. `defineStore` returns `useStore(pinia)`, which creates the store on its first call for that pinia and returns the same instance afterwards; separate pinias get separate stores.\n- The store has `$id`, plus a property for each key of `options.state()` that reads and writes the state. A write that changes the value (`Object.is`) notifies subscribers with `{ type: \"direct\", storeId }`. Nested mutations outside `$patch` don't need to notify.\n- Getters are read-only properties recomputed on every read, called with the state as their argument and with `this` bound to the store (real Pinia caches them with `computed`).\n- Actions are methods with `this` bound to the store, even when destructured.\n- `$patch(object)` deep-merges plain objects into the state (arrays and other values are replaced) and notifies once with `{ type: \"patch object\", storeId, payload }`. `$patch(fn)` calls `fn(state)` and notifies once with `{ type: \"patch function\", storeId }`, with no `payload` key. Writes made during a patch never produce `\"direct\"` notifications.\n- `$state` returns the state object; assigning to it applies `Object.assign(state, value)` as a function patch. `$reset()` calls `options.state()` again and applies the fresh object the same way.\n- `$subscribe(cb)` calls `cb(mutation, state)` synchronously after each change (like real Pinia with `{ flush: 'sync' }`) and returns an unsubscribe function that is safe to call twice.\n- `$onAction(cb)` calls `cb({ name, store, args, after, onError })` before every action. `after(fn)` callbacks receive the return value (the resolved value for async actions); `onError(fn)` callbacks receive the thrown error or rejection, which still reaches the caller. It returns an unsubscribe function.\n- `pinia.use(plugin)`: every store created afterwards calls `plugin({ store, options, pinia })` and copies the properties of the returned object onto the store.\n\nThe tests call `runStoreScenario(name)`, which runs one scenario from the driver and returns plain data. Leave the driver as it is.",
        starterCode: STORE_STARTER,
        functionName: "runStoreScenario",
        testCases: [
          {
            description: "state, getters (including one that uses another via this) and actions",
            args: ["stateGettersActions"],
            expected: { id: "counter", count: 3, double: 6, quadruple: 12 },
          },
          { description: "a destructured action still updates the store", args: ["destructuredAction"], expected: 2 },
          {
            description: "useStore returns one instance per pinia, and separate pinias don't share state",
            args: ["singleton"],
            expected: { same: true, separate: true, bCount: 1, cCount: 0 },
          },
          {
            description: "direct assignments notify subscribers as 'direct'; assigning an unchanged value doesn't",
            args: ["directSubscribe"],
            expected: [
              ["direct", "counter", 1, false],
              ["direct", "counter", 1, false],
              ["direct", "counter", 2, false],
            ],
            isEdgeCase: true,
          },
          {
            description: "$patch(object) deep-merges plain objects, replaces arrays and notifies once with the payload",
            args: ["patchObject"],
            expected: {
              log: [["patch object", { count: 5, user: { name: "Grace" }, tags: ["b"] }]],
              count: 5,
              user: { name: "Grace", age: 36 },
              tags: ["b"],
            },
          },
          {
            description: "$patch(fn) notifies exactly once, as 'patch function', however many changes it makes",
            args: ["patchFunction"],
            expected: { log: [["patch function", false]], count: 1, items: ["x"], name: "Pinia" },
            isEdgeCase: true,
          },
          {
            description: "$reset() rebuilds state from a fresh state() call, applied as one function patch",
            args: ["reset"],
            expected: { n: 0, list: [], freshArray: true, log: ["patch function"], stateCalls: 2 },
            isEdgeCase: true,
          },
          {
            description: "assigning $state is a shallow Object.assign inside a function patch, not a deep merge",
            args: ["stateSetter"],
            expected: { log: [["patch function", false]], count: 9, name: "Eduardo", user: { name: "Zoe" } },
            isEdgeCase: true,
          },
          { description: "an unsubscribed callback gets nothing more, and unsubscribing twice is harmless", args: ["unsubscribe"], expected: 1, isEdgeCase: true },
          {
            description: "$onAction: before, after with the return value, and onError when an action throws",
            args: ["onActionSync"],
            expected: ["before increment [5]", "after increment = 5", "before fail []", "error fail: nope", "caught nope"],
          },
          {
            description: "$onAction waits for async actions: after gets the resolved value, onError the rejection",
            args: ["onActionAsync"],
            expected: {
              log: [
                'before load ["data"]',
                "called",
                "after load = loaded data",
                "resolved loaded data",
                "before loadFail []",
                "error loadFail: network",
                "caught network",
              ],
              name: "data",
            },
            isEdgeCase: true,
          },
          {
            description: "plugins add properties to stores created after pinia.use(), not before",
            args: ["plugin"],
            expected: { late: "counter-secret", earlyHasIt: false },
          },
        ],
      },
    },
    {
      id: "vue-typescript",
      moduleId: "fe-vue",
      trackId: "frontend",
      title: "Vue + TypeScript",
      summary:
        "Vue is written in TypeScript, and `<script setup lang=\"ts\">` is the idiomatic way to type components. The compiler macros take types directly: `defineProps<{ title: string; count?: number }>()`, `defineEmits<{ change: [id: number] }>()` (the tuple syntax is 3.3+), `defineModel<number>()` and `defineSlots<...>()`. The catch for React developers: Vue props must exist at runtime (they decide what falls through as attributes), so the SFC compiler converts your type into runtime prop options by analysing the AST. Imported types and common utility types work since 3.3, but types that need real type evaluation, such as conditional types, fail with an \"Unresolvable type\" compile error, and the generated runtime check covers only the constructor (`type: Array`), not element types. You can't combine a type argument with runtime options in the same call.\n\nDefaults come from 3.5's reactive props destructure (`const { size = 'md' } = defineProps<Props>()`) or from `withDefaults`, where array and object defaults must be factory functions. Other typing points: `ref<T>()` without an initial value is `Ref<T | undefined>`; `provide`/`inject` stay in sync through `InjectionKey<T>`, and `inject` returns `T | undefined` without a default; `useTemplateRef('input')` is inferred from the template in 3.5 with current language tools; and generic components use `<script setup lang=\"ts\" generic=\"T extends Item\">`. `<script setup>` components are closed by default, so a parent's template ref only sees what the child passes to `defineExpose()`.\n\nThe tooling split is the operational gotcha. Vite transpiles TypeScript without type-checking, so `vite build` alone happily ships type errors. Type-check SFCs, template expressions included, with `vue-tsc` (a `tsc` wrapper that understands `.vue` files); create-vue's `build` script runs `vue-tsc --build` in parallel with `vite build`, so type errors fail the build. In the editor, the official Vue extension (formerly Volar) runs the same language tools.",
      level: "advanced",
      estMinutes: 75,
      webRefs: [
        { label: "Vue.js: TypeScript with Composition API", url: "https://vuejs.org/guide/typescript/composition-api.html", kind: "docs" },
        { label: "Vue.js: Using Vue with TypeScript", url: "https://vuejs.org/guide/typescript/overview.html", kind: "docs" },
        { label: "Vue.js API: script setup generics", url: "https://vuejs.org/api/sfc-script-setup.html#generics", kind: "docs" },
        { label: "vuejs/language-tools (vue-tsc and the Vue extension)", url: "https://github.com/vuejs/language-tools", kind: "repo" },
      ],
      video: {
        title: "Modern Vue.js Crash Course | with TypeScript + script setup + Composition API",
        channel: "Syntax",
        url: "https://www.youtube.com/watch?v=5oKpoqmUj64",
        videoId: "5oKpoqmUj64",
        durationLabel: "42:21",
      },
      alternateVideos: [
        {
          title: "A Better Way To Create Vue Components With Props Using TypeScript",
          channel: "Program With Erik",
          url: "https://www.youtube.com/watch?v=AovK5jedMHg",
          videoId: "AovK5jedMHg",
          durationLabel: "12:39",
        },
        {
          title: "Generic Components in Vue 3",
          channel: "ByteStack",
          url: "https://www.youtube.com/watch?v=j6JdCm0OSVk",
          videoId: "j6JdCm0OSVk",
          durationLabel: "6:39",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "vue-typescript-q1",
          prompt:
            "What happens when this SFC is compiled?\n\n```vue\n<script setup lang=\"ts\">\nconst props = defineProps<{ title: string }>({ title: String })\n</script>\n```",
          options: [
            "Compilation fails: `defineProps()` can't take a type argument and runtime options at the same time",
            "It compiles, and the runtime options override the type",
            "It compiles, and the type argument overrides the runtime options",
            "It compiles, but `title` becomes a fallthrough attribute",
          ],
          correctIndex: 0,
          explanation:
            "You choose type-based or runtime declaration; mixing them in one call is a compile error. With type-based declaration, the compiler generates the equivalent runtime options itself.",
        },
        {
          id: "vue-typescript-q2",
          prompt:
            "What happens when this SFC is compiled?\n\n```vue\n<script setup lang=\"ts\">\ntype Props<T> = T extends string ? { label: T } : { count: number }\nconst props = defineProps<Props<string>>()\n</script>\n```",
          options: [
            "The SFC compiler fails with an \"Unresolvable type\" error, because it derives runtime props from the AST rather than running the type checker",
            "It compiles, and `props.label` is typed as `string`",
            "It compiles with no runtime props, so everything falls through as attributes",
            "`vue-tsc` reports it, but `vite build` compiles it fine",
          ],
          correctIndex: 0,
          explanation:
            "Since 3.3 the compiler resolves imported types and a limited set of complex types, but anything needing real type evaluation, like a conditional type, can't be turned into runtime props. Define an explicit interface instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-typescript-q3",
          prompt: "What is the type of `n` in `const n = ref<number>()`?",
          options: ["`Ref<number | undefined>`", "`Ref<number>`", "`Ref<undefined>`", "`Ref<any>`"],
          correctIndex: 0,
          explanation:
            "A generic argument without an initial value produces a union with `undefined`, because the ref starts out empty. Pass an initial value (`ref<number>(0)`) to get `Ref<number>`.",
        },
        {
          id: "vue-typescript-q4",
          prompt:
            "A plain-JavaScript parent passes `:tags=\"[1, 2]\"` to this component. What does Vue do at runtime in development?\n\n```vue\n<script setup lang=\"ts\">\ndefineProps<{ tags?: string[] }>()\n</script>\n```",
          options: [
            "Nothing: the generated runtime check is just `type: Array`, so element types aren't validated; only type-checking the parent's template would catch it",
            "It warns that the array elements must be strings",
            "It throws a `TypeError` while creating the component",
            "It converts the elements to strings",
          ],
          correctIndex: 0,
          explanation:
            "Type-based props compile to runtime options such as `{ type: Array, required: false }`. TypeScript's guarantees stop at the compiler, so untyped callers (or `any`) can still pass the wrong shape.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-typescript-q5",
          prompt: "In a create-vue project with TypeScript, which statements are true? (Select all that apply.)",
          options: [
            "Vite transpiles TypeScript without type-checking it",
            "`vite build` on its own doesn't fail on type errors",
            "`vue-tsc` wraps `tsc` and also type-checks `.vue` files, template expressions included",
            "The Vite dev server blocks the page with an overlay for every type error",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Vite's dev server and bundler are transpile-only to stay fast, so type checking comes from the editor and from `vue-tsc`, which create-vue's `build` script runs alongside `vite build`. Type errors don't produce a dev-server overlay.",
        },
        {
          id: "vue-typescript-q6",
          prompt:
            "Which call type-checks?\n\n```ts\nconst emit = defineEmits<{\n  change: [id: number]\n  update: [value: string]\n}>()\n```",
          options: ["`emit('change', 1)`", "`emit('change', '1')`", "`emit('update')`", "`emit('remove', 1)`"],
          correctIndex: 0,
          explanation:
            "The 3.3+ syntax maps each event name to a tuple of its arguments, so `emit` is fully typed: wrong argument types, missing arguments and undeclared events are all errors.",
        },
        {
          id: "vue-typescript-q7",
          prompt: "How do you declare a generic component whose `items` prop is an array of `T`, where `T` must have a numeric `id`?",
          options: [
            "`<script setup lang=\"ts\" generic=\"T extends { id: number }\">` with `defineProps<{ items: T[] }>()`",
            "`<script setup lang=\"ts\" :generic=\"T\">` with `defineProps<{ items: T[] }>()`",
            "`export type T = { id: number }` followed by `defineProps<T[]>()`",
            "`defineComponent<T>()` inside `<script setup>`",
          ],
          correctIndex: 0,
          explanation:
            "The `generic` attribute accepts the same parameter list you'd write between `<...>` in TypeScript, including constraints and defaults. The type is then inferred per usage from the props the parent passes.",
        },
        {
          id: "vue-typescript-q8",
          prompt:
            "What happens when the parent mounts?\n\n```vue\n<!-- Child.vue -->\n<script setup lang=\"ts\">\nimport { ref } from 'vue'\nconst count = ref(0)\nfunction reset() { count.value = 0 }\n</script>\n\n<!-- Parent.vue -->\n<script setup lang=\"ts\">\nimport { useTemplateRef, onMounted } from 'vue'\nimport Child from './Child.vue'\nconst child = useTemplateRef<InstanceType<typeof Child>>('child')\nonMounted(() => child.value?.reset())\n</script>\n<template><Child ref=\"child\" /></template>\n```",
          options: [
            "It fails: `<script setup>` components are closed by default, so `reset` isn't on the public instance until the child calls `defineExpose({ reset })`",
            "`reset()` runs and sets `count` to 0",
            "It throws because template refs are still `null` in `onMounted`",
            "It works in development but not in production builds",
          ],
          correctIndex: 0,
          explanation:
            "Bindings declared in `<script setup>` are private: a template ref or `$parent` only sees what `defineExpose()` lists. Template refs are populated by the time `onMounted` runs.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "vue-typescript-q9",
          prompt:
            "The script is `<script setup lang=\"ts\">` and declares `let x: string | number = 1`. Which statement about `{{ x.toFixed(2) }}` in the template is true?",
          options: [
            "Template expressions are type-checked too, so it's an error, and TypeScript syntax such as `{{ (x as number).toFixed(2) }}` is allowed as a fix",
            "Templates are never type-checked, so it passes",
            "TypeScript syntax in templates requires a separate `<template lang=\"ts\">`",
            "Casts in templates are stripped at runtime, so the fix throws",
          ],
          correctIndex: 0,
          explanation:
            "With `lang=\"ts\"` on the script, `vue-tsc` and the IDE check template expressions, and the template accepts TypeScript syntax like `as`. Casts are type-only and compile away harmlessly.",
        },
        {
          id: "vue-typescript-q10",
          prompt:
            "With Vue 3.5 and current language tools, what is the inferred type of `el`?\n\n```vue\n<script setup lang=\"ts\">\nimport { useTemplateRef } from 'vue'\nconst el = useTemplateRef('input')\n</script>\n<template><input ref=\"input\" /></template>\n```",
          options: [
            "A readonly shallow ref of `HTMLInputElement | null`, inferred from the element that has `ref=\"input\"`",
            "`Ref<any>`: you must always pass a generic argument",
            "`HTMLInputElement`, never `null`",
            "`Ref<Element>`",
          ],
          correctIndex: 0,
          explanation:
            "Vue 3.5 added `useTemplateRef()`, and `@vue/language-tools` 2.1+ infers its type from static `ref` attributes. It's `null` before mount and after the element is removed by `v-if`, hence the union.",
        },
      ],
    },
  ],
} satisfies Module;
