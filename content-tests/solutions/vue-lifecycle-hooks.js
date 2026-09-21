/**
 * A Vue-style update scheduler.
 * @param {(fn: Function) => void} defer schedules fn as a microtask (use it instead of Promise.resolve().then)
 * @returns {{ queueJob: Function, queuePostFlushCb: Function, nextTick: Function }}
 */
function createScheduler(defer) {
  const queue = []; // pending jobs, sorted by id (pre jobs first on ties)
  const waiting = new Set(); // jobs currently sitting in queue
  let flushIndex = -1; // position of the running job while flushing
  let postCbs = []; // pending post-flush callbacks
  let flushPending = false; // a flush is scheduled or running
  let afterFlush = []; // nextTick callbacks waiting for the current flush

  // Should job be placed after the already-queued job other?
  const goesAfter = (other, job) => other.id < job.id || (other.id === job.id && (other.pre || !job.pre));

  function insert(job) {
    // Never insert before the running job: search only the part not run yet.
    let lo = flushIndex + 1;
    let hi = queue.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (goesAfter(queue[mid], job)) lo = mid + 1;
      else hi = mid;
    }
    queue.splice(lo, 0, job);
  }

  function scheduleFlush() {
    if (!flushPending) {
      flushPending = true;
      defer(flush);
    }
  }

  function queueJob(job) {
    if (waiting.has(job)) return;
    waiting.add(job);
    insert(job);
    scheduleFlush();
  }

  function queuePostFlushCb(cb) {
    postCbs.push(cb);
    scheduleFlush();
  }

  const postId = (cb) => (typeof cb.id === "number" ? cb.id : Infinity);

  function flush() {
    do {
      for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
        const job = queue[flushIndex];
        waiting.delete(job); // it may be queued again from now on
        job();
      }
      queue.length = 0;
      flushIndex = -1;
      if (postCbs.length) {
        const cbs = [...new Set(postCbs)];
        postCbs = [];
        // Stable sort: by id, callbacks without an id last in queue order.
        cbs.sort((a, b) => {
          const x = postId(a);
          const y = postId(b);
          return x === y ? 0 : x < y ? -1 : 1;
        });
        cbs.forEach((cb) => cb());
      }
    } while (queue.length || postCbs.length);
    flushPending = false;
    const callbacks = afterFlush;
    afterFlush = [];
    callbacks.forEach((fn) => fn());
  }

  function nextTick(fn) {
    if (flushPending) afterFlush.push(fn);
    else defer(fn);
  }

  return { queueJob, queuePostFlushCb, nextTick };
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
