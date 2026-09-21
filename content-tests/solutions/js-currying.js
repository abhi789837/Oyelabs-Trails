/**
 * @param {Function} fn
 * @returns {Function}
 */
function curry(fn) {
  const arity = fn.length;
  function collect(previous) {
    return function curried(...args) {
      const all = previous.concat(args);
      if (all.length >= arity) return fn.apply(this, all);
      return collect(all);
    };
  }
  return collect([]);
}

// ---- Test driver (leave as is) ----
const FNS = {
  add3: (a, b, c) => a + b + c,
  join4: (a, b, c, d) => [a, b, c, d].join("-"),
  now: () => "called",
  sumAll: function (a, b) {
    return Array.prototype.reduce.call(arguments, (sum, x) => sum + x, 0);
  },
};

// Curries FNS[fnName], applies the `prefix` calls once, then runs each branch
// (a list of calls) starting from that shared partial application.
function runCurry(fnName, prefix, branches) {
  const apply = (f, calls) => calls.reduce((g, args) => g(...args), f);
  const shared = apply(curry(FNS[fnName]), prefix);
  return branches.map((calls) => {
    const out = apply(shared, calls);
    return typeof out === "function" ? "[function]" : out;
  });
}
