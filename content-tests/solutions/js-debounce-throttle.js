/**
 * @param {Function} fn
 * @param {number} wait
 * @param {{ setTimeout: Function, clearTimeout: Function }} timers
 */
function debounce(fn, wait, timers) {
  let id = null;
  return function (...args) {
    if (id !== null) timers.clearTimeout(id);
    id = timers.setTimeout(() => {
      id = null;
      fn.apply(this, args);
    }, wait);
  };
}

/**
 * @param {Function} fn
 * @param {number} wait
 * @param {{ setTimeout: Function, clearTimeout: Function }} timers
 */
function throttle(fn, wait, timers) {
  let cooling = false;
  let pending = null; // { ctx, args } of the latest call made during a cooldown
  const startCooldown = () => {
    cooling = true;
    timers.setTimeout(() => {
      if (pending) {
        const { ctx, args } = pending;
        pending = null;
        fn.apply(ctx, args);
        startCooldown();
      } else {
        cooling = false;
      }
    }, wait);
  };
  return function (...args) {
    if (cooling) {
      pending = { ctx: this, args };
      return;
    }
    fn.apply(this, args);
    startCooldown();
  };
}

// ---- Test driver (leave as is) ----
function runTimingScenario(kind, wait, callTimes, endTime) {
  const clock = createFakeClock();
  const timers = { setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout };
  const runs = [];
  const record = (arg) => runs.push({ at: clock.now(), arg });
  const wrapped = kind === "throttle" ? throttle(record, wait, timers) : debounce(record, wait, timers);
  callTimes.forEach((t, i) => clock.at(t, () => wrapped(i)));
  clock.runUntil(endTime);
  return runs;
}

function createFakeClock() {
  let now = 0, nextId = 1, seq = 0, queue = [];
  const schedule = (time, cb) => {
    const id = nextId++;
    queue.push({ id, time, seq: seq++, cb });
    return id;
  };
  return {
    now: () => now,
    setTimeout: (cb, ms = 0) => schedule(now + Math.max(0, ms), cb),
    clearTimeout: (id) => { queue = queue.filter((t) => t.id !== id); },
    at: (time, cb) => schedule(time, cb),
    runUntil(end) {
      for (;;) {
        queue.sort((a, b) => a.time - b.time || a.seq - b.seq);
        const next = queue[0];
        if (!next || next.time > end) break;
        queue.shift();
        now = next.time;
        next.cb();
      }
      now = end;
    },
  };
}
