/**
 * Builds a push-pull reactive graph: sources push invalidation, deriveds are pulled.
 * @returns {{ state: Function, derived: Function, effect: Function }}
 */
function createGraph() {
  let active = null;
  const queue = [];
  let flushing = false;

  const CLEAN = 0;
  const MAYBE = 1;
  const DIRTY = 2;

  function unlink(node) {
    for (const dep of node.deps) dep.reactions.delete(node);
    node.deps = [];
    node.depVersions = [];
  }

  function runTracked(node, fn) {
    unlink(node);
    const previous = active;
    active = node;
    try {
      return fn();
    } finally {
      active = previous;
    }
  }

  function track(node) {
    if (!active) return;
    if (!active.deps.includes(node)) {
      active.deps.push(node);
      active.depVersions.push(node.version);
      node.reactions.add(active);
    }
  }

  function depsChanged(node) {
    for (let i = 0; i < node.deps.length; i++) {
      const dep = node.deps[i];
      if (dep.kind === "derived") pull(dep);
      if (dep.version !== node.depVersions[i]) return true;
    }
    return false;
  }

  function pull(node) {
    if (node.status === CLEAN) return node.value;
    if (node.status === MAYBE && !depsChanged(node)) {
      node.status = CLEAN;
      return node.value;
    }
    const previous = node.value;
    node.status = CLEAN;
    node.value = runTracked(node, node.fn);
    if (!Object.is(previous, node.value)) node.version++;
    return node.value;
  }

  function invalidate(node) {
    for (const reaction of [...node.reactions]) {
      if (reaction.kind === "derived") {
        if (reaction.status === CLEAN) {
          reaction.status = MAYBE;
          invalidate(reaction);
        }
      } else if (!reaction.stopped && !queue.includes(reaction)) {
        queue.push(reaction);
      }
    }
  }

  function flush() {
    if (flushing) return;
    flushing = true;
    try {
      while (queue.length) {
        const fx = queue.shift();
        if (fx.stopped) continue;
        if (depsChanged(fx)) runTracked(fx, fx.fn);
      }
    } finally {
      flushing = false;
    }
  }

  function state(initial) {
    const node = { kind: "source", value: initial, version: 0, reactions: new Set() };
    return {
      get() {
        track(node);
        return node.value;
      },
      set(next) {
        if (Object.is(node.value, next)) return;
        node.value = next;
        node.version++;
        invalidate(node);
        flush();
      },
    };
  }

  function derived(fn) {
    const node = {
      kind: "derived",
      fn,
      value: undefined,
      version: 0,
      status: DIRTY,
      deps: [],
      depVersions: [],
      reactions: new Set(),
    };
    return {
      get() {
        const value = pull(node);
        track(node);
        return value;
      },
    };
  }

  function effect(fn) {
    const node = { kind: "effect", fn, deps: [], depVersions: [], reactions: new Set(), stopped: false };
    runTracked(node, fn);
    return function stop() {
      node.stopped = true;
      unlink(node);
    };
  }

  return { state, derived, effect };
}

// ---- Test driver (leave as is) ----
function runGraphScenario(name) {
  const { state, derived, effect } = createGraph();
  const seen = [];
  let getterRuns = 0;
  let effectRuns = 0;

  const scenarios = {
    basic() {
      const count = state(0);
      const doubled = derived(() => count.get() * 2);
      effect(() => {
        effectRuns++;
        seen.push(doubled.get());
      });
      count.set(1);
      count.set(2);
      return { seen, effectRuns };
    },
    lazyNoRead() {
      const count = state(0);
      const doubled = derived(() => {
        getterRuns++;
        return count.get() * 2;
      });
      const before = getterRuns;
      for (let i = 1; i <= 100; i++) count.set(i);
      const during = getterRuns;
      const value = doubled.get();
      return { before, during, after: getterRuns, value };
    },
    cached() {
      const count = state(3);
      const doubled = derived(() => {
        getterRuns++;
        return count.get() * 2;
      });
      const reads = [doubled.get(), doubled.get(), doubled.get()];
      return { reads, getterRuns };
    },
    equalitySkip() {
      const count = state(0);
      const large = derived(() => {
        getterRuns++;
        return count.get() > 10;
      });
      effect(() => {
        effectRuns++;
        seen.push(large.get());
      });
      count.set(1);
      count.set(2);
      count.set(3);
      count.set(11);
      return { seen, effectRuns, getterRuns };
    },
    diamond() {
      const a = state(1);
      const b = derived(() => a.get() * 2);
      const c = derived(() => a.get() + 1);
      const d = derived(() => {
        getterRuns++;
        return b.get() + c.get();
      });
      effect(() => {
        effectRuns++;
        seen.push(d.get());
      });
      a.set(2);
      return { seen, effectRuns, getterRuns };
    },
    dynamicDeps() {
      const flag = state(true);
      const a = state("A");
      const b = state("B");
      const pick = derived(() => (flag.get() ? a.get() : b.get()));
      effect(() => {
        effectRuns++;
        seen.push(pick.get());
      });
      b.set("B2");
      const afterUnrelated = effectRuns;
      flag.set(false);
      a.set("A2");
      return { seen, afterUnrelated, effectRuns };
    },
    unrelated() {
      const a = state(0);
      const b = state(0);
      effect(() => {
        effectRuns++;
        seen.push(a.get());
      });
      b.set(1);
      b.set(2);
      a.set(1);
      return { seen, effectRuns };
    },
    chain() {
      const a = state(1);
      const b = derived(() => a.get() + 1);
      const c = derived(() => b.get() * 2);
      effect(() => {
        effectRuns++;
        seen.push(c.get());
      });
      a.set(2);
      a.set(3);
      return { seen, effectRuns };
    },
    stop() {
      const a = state(0);
      const stopIt = effect(() => {
        effectRuns++;
        seen.push(a.get());
      });
      a.set(1);
      stopIt();
      a.set(2);
      a.set(3);
      return { seen, effectRuns };
    },
    manyEffects() {
      const sources = [];
      for (let i = 0; i < 500; i++) sources.push(state(i));
      for (let i = 0; i < 500; i++) {
        const twice = derived(() => sources[i].get() * 2);
        effect(() => {
          effectRuns++;
          twice.get();
        });
      }
      const afterSetup = effectRuns;
      sources[250].set(-1);
      return { afterSetup, effectRuns };
    },
  };

  if (!scenarios[name]) throw new Error("Unknown scenario " + name);
  return scenarios[name]();
}
