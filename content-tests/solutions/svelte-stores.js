/**
 * Svelte's own "has this changed?" test.
 * @param {any} a
 * @param {any} b
 */
function safeNotEqual(a, b) {
  // eslint-disable-next-line eqeqeq
  return a != a ? b == b : a !== b || (a !== null && typeof a === "object") || typeof a === "function";
}

/**
 * A store you can set from outside.
 * @param {any} value
 * @param {(set: Function, update: Function) => (void | Function)} [start]
 */
function writable(value, start) {
  const subscribers = new Set();
  let stop = null;

  function set(next) {
    if (!safeNotEqual(value, next)) return;
    value = next;
    if (!stop) return;
    for (const run of [...subscribers]) run(value);
  }

  function update(fn) {
    set(fn(value));
  }

  function subscribe(run) {
    subscribers.add(run);
    if (subscribers.size === 1) {
      stop = (start && start(set, update)) || (() => {});
    }
    run(value);
    return function unsubscribe() {
      subscribers.delete(run);
      if (subscribers.size === 0 && stop) {
        stop();
        stop = null;
      }
    };
  }

  return { set, update, subscribe };
}

/**
 * A store that can only be updated from the inside.
 * @param {any} value
 * @param {(set: Function, update: Function) => (void | Function)} [start]
 */
function readable(value, start) {
  return { subscribe: writable(value, start).subscribe };
}

/**
 * A store derived from one store or an array of stores.
 * @param {any} stores
 * @param {Function} fn
 */
function derived(stores, fn) {
  const single = !Array.isArray(stores);
  const list = single ? [stores] : stores;

  return readable(undefined, (set) => {
    const values = new Array(list.length);
    let ready = false;
    const sync = () => {
      if (ready) set(fn(single ? values[0] : [...values]));
    };
    const unsubscribers = list.map((store, i) =>
      store.subscribe((value) => {
        values[i] = value;
        sync();
      }),
    );
    ready = true;
    sync();
    return () => {
      ready = false;
      for (const unsubscribe of unsubscribers) unsubscribe();
    };
  });
}

// ---- Test driver (leave as is) ----
function runStoreScenario(name) {
  const log = [];
  const show = (value) => (typeof value === "object" && value !== null ? JSON.stringify(value) : String(value));

  const scenarios = {
    immediate() {
      const store = writable("a");
      store.subscribe((v) => log.push("one:" + show(v)));
      store.set("b");
      return log;
    },
    order() {
      const store = writable(0);
      store.subscribe((v) => log.push("one:" + show(v)));
      store.subscribe((v) => log.push("two:" + show(v)));
      store.set(1);
      return log;
    },
    unsubscribe() {
      const store = writable(0);
      const off = store.subscribe((v) => log.push(show(v)));
      store.set(1);
      off();
      store.set(2);
      store.set(3);
      return log;
    },
    equality() {
      const object = { n: 1 };
      const store = writable(1);
      store.subscribe((v) => log.push(show(v)));
      store.set(1);
      store.set(2);
      store.set(object);
      store.set(object);
      store.set({ n: 1 });
      return log;
    },
    notANumber() {
      const store = writable(1);
      store.subscribe((v) => log.push(show(v)));
      store.set(NaN);
      store.set(NaN);
      store.set(0);
      return log;
    },
    startStop() {
      const store = writable(0, () => {
        log.push("start");
        return () => log.push("stop");
      });
      const first = store.subscribe(() => log.push("a"));
      const second = store.subscribe(() => log.push("b"));
      first();
      second();
      const third = store.subscribe(() => log.push("c"));
      third();
      return log;
    },
    updates() {
      const store = writable(1);
      store.subscribe((v) => log.push(show(v)));
      store.update((n) => n + 1);
      store.update((n) => n * 10);
      return log;
    },
    derivedPair() {
      const a = writable(1);
      const b = writable(2);
      const sum = derived([a, b], ([x, y]) => x + y);
      sum.subscribe((v) => log.push(show(v)));
      a.set(10);
      b.set(20);
      return log;
    },
    derivedSingle() {
      const a = writable(2);
      const doubled = derived(a, (v) => v * 2);
      doubled.subscribe((v) => log.push(show(v)));
      a.set(5);
      return log;
    },
    derivedLazy() {
      const source = writable(0, () => {
        log.push("source-start");
        return () => log.push("source-stop");
      });
      const doubled = derived(source, (v) => v * 2);
      log.push("created");
      const off = doubled.subscribe((v) => log.push("got:" + show(v)));
      off();
      return log;
    },
    derivedCleanup() {
      const source = writable(1, () => {
        log.push("start");
        return () => log.push("stop");
      });
      const doubled = derived(source, (v) => v * 2);
      const off = doubled.subscribe((v) => log.push("got:" + show(v)));
      source.set(2);
      off();
      source.set(3);
      return log;
    },
  };

  if (!scenarios[name]) throw new Error("Unknown scenario " + name);
  return scenarios[name]();
}
