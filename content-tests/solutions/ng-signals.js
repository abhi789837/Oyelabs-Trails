// ---- Reactive graph (your code) ----
let activeConsumer = null;
const scheduled = new Set();

function trackDependency(node) {
  if (!activeConsumer) return;
  activeConsumer.deps.set(node, node.version);
  node.consumers.add(activeConsumer);
}

function markConsumersDirty(node) {
  for (const consumer of Array.from(node.consumers)) {
    if (consumer.dirty) continue;
    consumer.dirty = true;
    if (consumer.kind === "effect") scheduled.add(consumer);
    else markConsumersDirty(consumer);
  }
}

function dependenciesChanged(node) {
  for (const [dep, seenVersion] of node.deps) {
    refresh(dep);
    if (dep.version !== seenVersion) return true;
  }
  return false;
}

function refresh(node) {
  if (node.kind !== "derived") return;
  if (node.forced) {
    node.forced = false;
    recompute(node);
    return;
  }
  if (!node.dirty) return;
  if (node.hasValue && node.deps.size > 0 && !dependenciesChanged(node)) {
    node.dirty = false;
    return;
  }
  recompute(node);
}

function recompute(node) {
  for (const [dep] of node.deps) dep.consumers.delete(node);
  node.deps = new Map();
  const previous = activeConsumer;
  activeConsumer = node;
  let next;
  try {
    next = node.fn();
  } finally {
    activeConsumer = previous;
  }
  node.dirty = false;
  if (!node.hasValue || !node.equal(node.value, next)) {
    node.value = next;
    node.version++;
  }
  node.hasValue = true;
}

function runEffect(node) {
  for (const [dep] of node.deps) dep.consumers.delete(node);
  node.deps = new Map();
  const previous = activeConsumer;
  activeConsumer = node;
  try {
    node.fn();
  } finally {
    activeConsumer = previous;
  }
  node.dirty = false;
}

function signal(initialValue, options) {
  const node = {
    kind: "signal",
    version: 0,
    consumers: new Set(),
    value: initialValue,
    equal: (options && options.equal) || Object.is,
  };
  const read = () => {
    trackDependency(node);
    return node.value;
  };
  read.set = (next) => {
    if (node.equal(node.value, next)) return;
    node.value = next;
    node.version++;
    markConsumersDirty(node);
  };
  read.update = (fn) => read.set(fn(node.value));
  return read;
}

function computed(fn, options) {
  const node = {
    kind: "derived",
    fn,
    version: 0,
    consumers: new Set(),
    deps: new Map(),
    dirty: true,
    forced: false,
    hasValue: false,
    value: undefined,
    equal: (options && options.equal) || Object.is,
  };
  return () => {
    refresh(node);
    trackDependency(node);
    return node.value;
  };
}

function linkedSignal(computation) {
  const node = {
    kind: "derived",
    version: 0,
    consumers: new Set(),
    deps: new Map(),
    dirty: true,
    forced: false,
    hasValue: false,
    value: undefined,
    equal: Object.is,
    hasSource: false,
    lastSource: undefined,
    hasOverride: false,
    override: undefined,
  };
  node.fn = () => {
    const next = computation();
    if (!node.hasSource || !Object.is(next, node.lastSource)) {
      node.hasSource = true;
      node.lastSource = next;
      node.hasOverride = false;
      node.override = undefined;
    }
    return node.hasOverride ? node.override : node.lastSource;
  };
  const read = () => {
    refresh(node);
    trackDependency(node);
    return node.value;
  };
  read.set = (next) => {
    node.hasOverride = true;
    node.override = next;
    node.dirty = true;
    node.forced = true;
    markConsumersDirty(node);
  };
  read.update = (fn) => {
    refresh(node);
    read.set(fn(node.value));
  };
  return read;
}

function effect(fn) {
  const node = { kind: "effect", fn, deps: new Map(), dirty: true, hasRun: false, destroyed: false };
  scheduled.add(node);
  return {
    destroy() {
      node.destroyed = true;
      scheduled.delete(node);
      for (const [dep] of node.deps) dep.consumers.delete(node);
      node.deps = new Map();
    },
  };
}

function flushEffects() {
  let passes = 0;
  while (scheduled.size > 0) {
    if (++passes > 100) throw new Error("effect loop");
    const batch = Array.from(scheduled);
    scheduled.clear();
    for (const node of batch) {
      if (node.destroyed || !node.dirty) continue;
      if (node.hasRun && node.deps.size > 0 && !dependenciesChanged(node)) {
        node.dirty = false;
        continue;
      }
      runEffect(node);
      node.hasRun = true;
    }
  }
}

function untracked(fn) {
  const previous = activeConsumer;
  activeConsumer = null;
  try {
    return fn();
  } finally {
    activeConsumer = previous;
  }
}

// ---- Test driver (leave as is) ----
function runSignalScenario(name) {
  const scenarios = {
    lazyMemoizedComputed() {
      const count = signal(1);
      let runs = 0;
      const double = computed(() => {
        runs++;
        return count() * 2;
      });
      const log = [runs];
      log.push(double(), double(), runs);
      count.set(5);
      log.push(runs, double(), runs);
      return log;
    },
    equalityStopsPropagation() {
      const count = signal(0);
      let runs = 0;
      const parity = computed(() => (count() % 2 === 0 ? "even" : "odd"));
      const effectLog = [];
      effect(() => {
        runs++;
        effectLog.push(parity());
      });
      flushEffects();
      count.set(2);
      flushEffects();
      count.set(3);
      flushEffects();
      return { runs, effectLog };
    },
    dynamicDependencies() {
      const showCount = signal(false);
      const count = signal(0);
      let runs = 0;
      const label = computed(() => {
        runs++;
        return showCount() ? "count " + count() : "hidden";
      });
      const log = [label(), runs];
      count.set(10);
      log.push(label(), runs);
      showCount.set(true);
      log.push(label(), runs);
      count.set(11);
      log.push(label(), runs);
      showCount.set(false);
      log.push(label(), runs);
      count.set(12);
      log.push(label(), runs);
      return log;
    },
    effectsAreScheduled() {
      const count = signal(0);
      const seen = [];
      effect(() => seen.push(count()));
      const beforeFlush = seen.slice();
      flushEffects();
      const afterFlush = seen.slice();
      count.set(1);
      count.set(2);
      count.set(3);
      const beforeSecondFlush = seen.slice();
      flushEffects();
      return { beforeFlush, afterFlush, beforeSecondFlush, seen };
    },
    customEquality() {
      const point = signal({ x: 0 }, { equal: (a, b) => a.x === b.x });
      const seen = [];
      effect(() => seen.push(point().x));
      flushEffects();
      point.set({ x: 0 });
      flushEffects();
      point.set({ x: 1 });
      flushEffects();
      return seen;
    },
    untrackedRead() {
      const user = signal("ada");
      const counter = signal(0);
      const seen = [];
      effect(() => seen.push(user() + ":" + untracked(counter)));
      flushEffects();
      counter.set(1);
      flushEffects();
      user.set("grace");
      flushEffects();
      return seen;
    },
    destroyStopsEffect() {
      const count = signal(0);
      const seen = [];
      const ref = effect(() => seen.push(count()));
      flushEffects();
      count.set(1);
      flushEffects();
      ref.destroy();
      count.set(2);
      count.set(3);
      flushEffects();
      return seen;
    },
    linkedSignalResets() {
      const options = signal(["ground", "air", "sea"]);
      const selected = linkedSignal(() => options()[0]);
      const log = [selected()];
      selected.set("sea");
      log.push(selected());
      options.set(["email", "will-call", "post"]);
      log.push(selected());
      selected.set("post");
      log.push(selected());
      return log;
    },
    linkedSignalNotifies() {
      const options = signal(["a", "b"]);
      const selected = linkedSignal(() => options()[0]);
      const seen = [];
      effect(() => seen.push(selected()));
      flushEffects();
      selected.set("b");
      flushEffects();
      options.set(["x", "y"]);
      flushEffects();
      return seen;
    },
    diamondNoGlitch() {
      const base = signal(1);
      const left = computed(() => base() + 1);
      const right = computed(() => base() * 10);
      const runs = [];
      const sum = computed(() => {
        runs.push("sum");
        return left() + right();
      });
      const seen = [];
      effect(() => seen.push(sum()));
      flushEffects();
      base.set(2);
      flushEffects();
      return { seen, sumRuns: runs.length };
    },
    deepChain() {
      const source = signal(0);
      let current = computed(() => source());
      for (let i = 0; i < 200; i++) {
        const previous = current;
        current = computed(() => previous() + 1);
      }
      const seen = [];
      effect(() => seen.push(current()));
      flushEffects();
      source.set(5);
      flushEffects();
      source.set(5);
      flushEffects();
      return seen;
    },
    noSubscribersNoWork() {
      const count = signal(0);
      let runs = 0;
      const derived = computed(() => {
        runs++;
        return count() * 2;
      });
      for (let i = 1; i <= 1000; i++) count.set(i);
      const beforeRead = runs;
      const value = derived();
      return { beforeRead, runs, value };
    },
  };
  if (!scenarios[name]) throw new Error("Unknown scenario " + name);
  return scenarios[name]();
}
