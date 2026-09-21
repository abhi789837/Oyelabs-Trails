class MiniEmitter {
  constructor() {
    this._events = new Map();
  }

  on(event, listener) {
    const list = this._events.get(event) ?? [];
    list.push({ listener, fn: listener });
    this._events.set(event, list);
    return this;
  }

  once(event, listener) {
    const emitter = this;
    const wrapper = function (...args) {
      emitter.off(event, listener);
      return listener.apply(this, args);
    };
    const list = this._events.get(event) ?? [];
    list.push({ listener, fn: wrapper });
    this._events.set(event, list);
    return this;
  }

  off(event, listener) {
    const list = this._events.get(event);
    if (!list) return this;
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].listener === listener) {
        list.splice(i, 1);
        break;
      }
    }
    if (list.length === 0) this._events.delete(event);
    return this;
  }

  emit(event, ...args) {
    const list = this._events.get(event);
    if (!list || list.length === 0) {
      if (event === "error") {
        const err = args[0];
        throw err instanceof Error ? err : new Error("Unhandled error. (" + String(err) + ")");
      }
      return false;
    }
    for (const { fn } of [...list]) fn.apply(this, args);
    return true;
  }

  listenerCount(event) {
    return this._events.get(event)?.length ?? 0;
  }
}

// ---- Test driver (leave as is) ----
// Runs a script of plain-data steps against a MiniEmitter and returns a log.
// Steps: ["on" | "once" | "off", event, listenerName], ["emit", event, ...args],
// ["emitError", message] (emits "error" with a real Error), ["count", event],
// ["chain", event, nameA, nameB] (checks that on() returns the emitter).
// The special listeners (removeB, addC, reemit) act on the event "x".
function runEmitterScript(steps) {
  const emitter = new MiniEmitter();
  const log = [];
  const record = (name, args) => log.push(name + "(" + args.join(",") + ")");
  const fns = {
    a: (...args) => record("a", args),
    b: (...args) => record("b", args),
    c: (...args) => record("c", args),
    removeB: (...args) => {
      record("removeB", args);
      emitter.off("x", fns.b);
    },
    addC: (...args) => {
      record("addC", args);
      emitter.on("x", fns.c);
    },
    reemit: (...args) => {
      record("reemit", args);
      log.push("nested:" + emitter.emit("x", "again"));
    },
    boom: (...args) => {
      record("boom", args);
      throw new Error("listener failed");
    },
    self: function () {
      log.push("self:" + (this === emitter));
    },
  };
  const emit = (event, args) => {
    try {
      log.push("emit:" + event + ":" + emitter.emit(event, ...args));
    } catch (err) {
      log.push("threw:" + (err instanceof Error ? err.message : String(err)));
    }
  };
  for (const [op, event, ...rest] of steps) {
    if (op === "on" || op === "once" || op === "off") emitter[op](event, fns[rest[0]]);
    else if (op === "emit") emit(event, rest);
    else if (op === "emitError") emit("error", [new Error(event)]);
    else if (op === "count") log.push("count:" + event + ":" + emitter.listenerCount(event));
    else if (op === "chain") {
      emitter.on(event, fns[rest[0]]).on(event, fns[rest[1]]);
      log.push("chained");
    }
  }
  return log;
}
