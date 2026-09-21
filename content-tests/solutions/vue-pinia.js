/**
 * @returns {{ use(plugin: Function): object }} a registry that owns one instance of each store
 */
function createPinia() {
  const pinia = {
    stores: new Map(),
    plugins: [],
    use(plugin) {
      pinia.plugins.push(plugin);
      return pinia;
    },
  };
  return pinia;
}

/**
 * Defines an option store.
 * @param {string} id
 * @param {{ state?: () => object, getters?: object, actions?: object }} options
 * @returns {(pinia: object) => object} useStore(pinia)
 */
function defineStore(id, options) {
  return function useStore(pinia) {
    if (!pinia.stores.has(id)) pinia.stores.set(id, createStore(id, options, pinia));
    return pinia.stores.get(id);
  };
}

function createStore(id, options, pinia) {
  const state = options.state ? options.state() : {};
  const subscriptions = [];
  const actionSubscriptions = [];
  let patching = false;
  const store = { $id: id };

  const notify = (mutation) => {
    subscriptions.slice().forEach((sub) => sub.callback(mutation, state));
  };
  const isPlainObject = (v) => v !== null && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype;
  const mergeDeep = (target, patch) => {
    for (const key of Object.keys(patch)) {
      const value = patch[key];
      if (isPlainObject(value) && isPlainObject(target[key])) mergeDeep(target[key], value);
      else target[key] = value; // arrays and everything else are replaced
    }
  };
  const subscribe = (list, callback) => {
    const entry = { callback };
    list.push(entry);
    return () => {
      const i = list.indexOf(entry);
      if (i >= 0) list.splice(i, 1);
    };
  };

  // State: top-level properties proxy to the state object; real changes notify as "direct".
  for (const key of Object.keys(state)) {
    Object.defineProperty(store, key, {
      enumerable: true,
      get: () => state[key],
      set: (value) => {
        if (Object.is(state[key], value)) return;
        state[key] = value;
        if (!patching) notify({ type: "direct", storeId: id });
      },
    });
  }

  // Getters: recomputed on every read, with `this` = store and the state as argument.
  for (const [key, getter] of Object.entries(options.getters || {})) {
    Object.defineProperty(store, key, { enumerable: true, get: () => getter.call(store, state) });
  }

  // Actions: always bound to the store, observable through $onAction.
  for (const [name, action] of Object.entries(options.actions || {})) {
    store[name] = function (...args) {
      const afterCallbacks = [];
      const errorCallbacks = [];
      actionSubscriptions.slice().forEach((sub) =>
        sub.callback({
          name,
          store,
          args,
          after: (fn) => afterCallbacks.push(fn),
          onError: (fn) => errorCallbacks.push(fn),
        }),
      );
      let result;
      try {
        result = action.apply(store, args);
      } catch (error) {
        errorCallbacks.forEach((fn) => fn(error));
        throw error;
      }
      if (result && typeof result.then === "function") {
        return result.then(
          (value) => {
            afterCallbacks.forEach((fn) => fn(value));
            return value;
          },
          (error) => {
            errorCallbacks.forEach((fn) => fn(error));
            throw error;
          },
        );
      }
      afterCallbacks.forEach((fn) => fn(result));
      return result;
    };
  }

  store.$patch = (partial) => {
    patching = true;
    try {
      if (typeof partial === "function") partial(state);
      else mergeDeep(state, partial);
    } finally {
      patching = false;
    }
    notify(
      typeof partial === "function"
        ? { type: "patch function", storeId: id }
        : { type: "patch object", storeId: id, payload: partial },
    );
  };
  store.$reset = () => {
    const fresh = options.state ? options.state() : {};
    store.$patch((s) => Object.assign(s, fresh));
  };
  store.$subscribe = (callback) => subscribe(subscriptions, callback);
  store.$onAction = (callback) => subscribe(actionSubscriptions, callback);
  Object.defineProperty(store, "$state", {
    get: () => state,
    set: (value) => store.$patch((s) => Object.assign(s, value)), // shallow, like Pinia
  });

  for (const plugin of pinia.plugins) {
    const extra = plugin({ store, options, pinia });
    if (extra) Object.assign(store, extra);
  }
  return store;
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
