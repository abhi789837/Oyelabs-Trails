function* lazyMap(iterable, fn) {
  for (const value of iterable) yield fn(value);
}

function* lazyFilter(iterable, predicate) {
  for (const value of iterable) {
    if (predicate(value)) yield value;
  }
}

function* lazyTake(iterable, n) {
  if (n <= 0) return;
  let count = 0;
  for (const value of iterable) {
    yield value;
    count += 1;
    if (count >= n) return;
  }
}

// ---- Test driver (leave as is) ----
const FNS = {
  square: (x) => x * x,
  double: (x) => x * 2,
  inc: (x) => x + 1,
  isEven: (x) => x % 2 === 0,
  isOdd: (x) => x % 2 === 1,
};

function runPipeline(source, steps) {
  const stats = { pulled: 0, started: false, finished: false };
  function* counted() {
    stats.started = true;
    try {
      if (source === "naturals") {
        for (let i = 1; ; i++) {
          if (++stats.pulled > 100000) throw new Error("Pulled over 100,000 values: the pipeline isn't lazy, or take never stops");
          yield i;
        }
      } else {
        for (const x of source) {
          stats.pulled++;
          yield x;
        }
      }
    } finally {
      stats.finished = true;
    }
  }
  let it = counted();
  for (const [op, arg] of steps) {
    if (op === "map") it = lazyMap(it, FNS[arg]);
    else if (op === "filter") it = lazyFilter(it, FNS[arg]);
    else if (op === "take") it = lazyTake(it, arg);
  }
  const values = [];
  for (const v of it) values.push(v);
  return { values, pulled: stats.pulled, leftOpen: stats.started && !stats.finished };
}
