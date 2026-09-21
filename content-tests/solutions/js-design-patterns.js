/**
 * @returns {{ on: Function, once: Function, off: Function, emit: Function }}
 */
function createEmitter() {
  const registry = new Map(); // event -> [{ fn, once }]

  const remove = (event, entry) => {
    const list = registry.get(event);
    if (!list) return;
    const i = list.indexOf(entry);
    if (i !== -1) list.splice(i, 1);
  };

  const add = (event, fn, once) => {
    const entry = { fn, once };
    if (!registry.has(event)) registry.set(event, []);
    registry.get(event).push(entry);
    return () => remove(event, entry);
  };

  return {
    on: (event, listener) => add(event, listener, false),
    once: (event, listener) => add(event, listener, true),
    off(event, listener) {
      const list = registry.get(event);
      if (!list) return;
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i].fn === listener) {
          list.splice(i, 1);
          return;
        }
      }
    },
    emit(event, ...args) {
      const list = registry.get(event);
      if (!list || list.length === 0) return 0;
      const snapshot = list.slice();
      for (const entry of snapshot) {
        if (entry.once) remove(event, entry);
        entry.fn(...args);
      }
      return snapshot.length;
    },
  };
}

// ---- Test driver (leave as is) ----
// Steps:
//   ["on", event, label]      subscribe listener `label` (keeps the returned unsubscribe function)
//   ["once", event, label]    subscribe listener `label` for a single call
//   ["off", event, label]     emitter.off(event, listener)
//   ["unsub", label]          call the unsubscribe function from the latest on/once for `label`
//   ["emit", event, arg]      emitter.emit(event, arg); the return value is recorded
//   ["react", label, step]    from now on, listener `label` also performs `step` whenever it runs
function runEmitterScenario(steps) {
  const emitter = createEmitter();
  const log = [];
  const returns = [];
  const listeners = {};
  const unsubscribers = {};
  const reactions = {};
  const listenerFor = (label) => {
    if (!listeners[label]) {
      listeners[label] = function (arg) {
        log.push(label + ":" + arg);
        if (reactions[label]) perform(reactions[label], false);
      };
    }
    return listeners[label];
  };
  const perform = (step, record) => {
    const [op, a, b] = step;
    if (op === "on") unsubscribers[b] = emitter.on(a, listenerFor(b));
    else if (op === "once") unsubscribers[b] = emitter.once(a, listenerFor(b));
    else if (op === "off") emitter.off(a, listenerFor(b));
    else if (op === "unsub") {
      if (typeof unsubscribers[a] === "function") unsubscribers[a]();
    } else if (op === "emit") {
      const result = emitter.emit(a, b);
      if (record) returns.push(result);
    } else if (op === "react") reactions[a] = b;
  };
  for (const step of steps) perform(step, true);
  return { log, returns };
}
