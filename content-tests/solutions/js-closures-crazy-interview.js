/**
 * @param {Function} fn
 * @param {Function} [resolver] builds the cache key from the call's arguments
 * @returns {Function} the memoized function, with a clear() method
 */
function memoize(fn, resolver) {
  let cache = new Map();
  function memoized(...args) {
    const key = resolver ? resolver.apply(this, args) : args[0];
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  }
  memoized.clear = function () {
    cache = new Map();
  };
  return memoized;
}

// ---- Test driver (leave as is) ----
function runMemoScenario(fnKind, resolverKind, steps) {
  let calls = 0;
  const failedOnce = new Set();
  const impls = {
    square: (x) => x * x,
    identity: (x) => x,
    typeOf: (x) => typeof x,
    sum: (...nums) => nums.reduce((a, b) => a + b, 0),
    withBase: function (x) {
      return this.base + x;
    },
    flaky: (x) => {
      if (!failedOnce.has(x)) {
        failedOnce.add(x);
        throw new Error("fail " + x);
      }
      return x * 10;
    },
  };
  const resolvers = { none: undefined, joinArgs: (...args) => args.join(",") };
  const impl = impls[fnKind];
  const counted = function (...args) {
    calls++;
    return impl.apply(this, args);
  };
  const memos = [memoize(counted, resolvers[resolverKind]), memoize(counted, resolvers[resolverKind])];
  const results = [];
  for (const step of steps) {
    const memo = memos[step.instance || 0];
    if (step.clear) {
      memo.clear();
      continue;
    }
    try {
      if (step.base !== undefined) {
        const owner = { base: step.base, memo };
        results.push(owner.memo(...step.args));
      } else {
        results.push(memo(...step.args));
      }
    } catch (err) {
      results.push({ error: err.message });
    }
  }
  return { results, calls };
}
