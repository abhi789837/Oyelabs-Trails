/**
 * A miniature React.lazy.
 * @param {() => PromiseLike<{ default?: Function }>} load
 * @returns {{ read: () => Function, preload: () => PromiseLike<any> }}
 */
function lazy(load) {
  let status = "uninitialized";
  let result;
  let thenable;

  function start() {
    if (status !== "uninitialized") return thenable;
    status = "pending";
    thenable = load();
    thenable.then(
      (moduleObject) => {
        if (status === "pending") {
          status = "resolved";
          result = moduleObject;
        }
      },
      (error) => {
        if (status === "pending") {
          status = "rejected";
          result = error;
        }
      },
    );
    return thenable;
  }

  return {
    read() {
      start();
      if (status === "pending") throw thenable;
      if (status === "rejected") throw result;
      if (result == null || !("default" in result)) {
        throw new Error("lazy: module has no default export");
      }
      return result.default;
    },
    preload() {
      return start();
    },
  };
}

// ---- Test driver (leave as is) ----
// Creates one lazy component whose loader resolves (or rejects) after spec.ticks microtasks,
// then runs spec.steps:
//   "render"   render it inside a <Suspense>-like loop: if read() throws a thenable, log
//              "fallback", wait for the thenable to settle and retry; if it throws anything
//              else, log "error: <message>" (an error boundary); otherwise call the component
//              and log its output
//   "preload"  call preload() (hover-to-prefetch)
//   "flush"    let pending microtasks run
// spec.module: "ok" (a default export), "noDefault", or "fail" (rejects with ChunkLoadError).
// spec.thenable: return a bare thenable instead of a real Promise from the loader.
async function runLazyScenario(spec) {
  const log = [];
  let loadCalls = 0;
  const settleAfter = (ticks, settle) => {
    let n = ticks;
    const step = () => (n-- > 0 ? Promise.resolve().then(step) : settle());
    step();
  };
  const loader = () => {
    loadCalls++;
    const outcome = (resolve, reject) =>
      settleAfter(spec.ticks ?? 2, () => {
        if (spec.module === "fail") reject(new Error("ChunkLoadError"));
        else if (spec.module === "noDefault") resolve({ Greeting: (p) => "Hello " + p.name });
        else resolve({ default: (p) => "Hello " + p.name });
      });
    if (!spec.thenable) return new Promise(outcome);
    // A minimal thenable: no catch, no finally, not instanceof Promise.
    let state = "pending", value, callbacks = [];
    const settle = (s, v) => {
      if (state !== "pending") return;
      state = s;
      value = v;
      callbacks.forEach((cb) => cb());
      callbacks = [];
    };
    outcome((v) => settle("fulfilled", v), (e) => settle("rejected", e));
    return {
      then(onFulfilled, onRejected) {
        return new Promise((resolve, reject) => {
          const run = () => {
            try {
              if (state === "fulfilled") resolve(onFulfilled ? onFulfilled(value) : value);
              else if (onRejected) resolve(onRejected(value));
              else reject(value);
            } catch (e) {
              reject(e);
            }
          };
          if (state === "pending") callbacks.push(run);
          else Promise.resolve().then(run);
        });
      },
    };
  };
  const flush = async () => {
    for (let i = 0; i < 30; i++) await Promise.resolve();
  };
  let Lazy;
  try {
    Lazy = lazy(loader);
  } catch (e) {
    return { threw: String((e && e.message) || e) };
  }
  if (!Lazy || typeof Lazy.read !== "function") return { threw: "lazy() must return { read, preload }" };
  for (const step of spec.steps) {
    if (step === "flush") await flush();
    else if (step === "preload") {
      try {
        Lazy.preload();
      } catch (e) {
        log.push("preload threw: " + String((e && e.message) || e));
      }
    } else if (step === "render") {
      let done = false;
      for (let attempt = 0; attempt < 5 && !done; attempt++) {
        let Component;
        try {
          Component = Lazy.read();
        } catch (thrown) {
          if (thrown && typeof thrown.then === "function") {
            log.push("fallback");
            try {
              await thrown;
            } catch {
              // React retries the render whether the thenable fulfilled or rejected
            }
            await flush();
            continue;
          }
          log.push("error: " + String((thrown && thrown.message) || thrown));
          done = true;
          continue;
        }
        log.push(typeof Component === "function" ? Component({ name: "Ada" }) : "not a component");
        done = true;
      }
      if (!done) log.push("gave up");
    }
  }
  return { log, loadCalls };
}
