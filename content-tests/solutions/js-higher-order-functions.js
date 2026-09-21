/**
 * pipe(f, g, h)(...args) === h(g(f(...args)))
 * @param {...Function} fns
 * @returns {Function}
 */
function pipe(...fns) {
  for (const fn of fns) {
    if (typeof fn !== "function") throw new TypeError("pipe expects functions, got " + typeof fn);
  }
  return function piped(...args) {
    if (fns.length === 0) return args[0];
    let result = fns[0].apply(this, args);
    for (let i = 1; i < fns.length; i++) result = fns[i].call(this, result);
    return result;
  };
}

// ---- Test driver (leave as is) ----
function runPipe(specs, calls) {
  let count = 0;
  const makers = {
    add: (n) => (x) => x + n,
    mul: (n) => (x) => x * n,
    sum: () => (...xs) => xs.reduce((a, b) => a + b, 0),
    toStr: () => (x) => String(x),
    wrap: (tag) => (x) => "<" + tag + ">" + x + "</" + tag + ">",
    offset: () =>
      function (x) {
        return this && typeof this.offset === "number" ? x + this.offset : "no this";
      },
  };
  const fns = specs.map((spec) => {
    if (!Array.isArray(spec)) return spec; // not a function: pipe should reject it
    const fn = makers[spec[0]](spec[1]);
    return function (...args) {
      count++;
      return fn.apply(this, args);
    };
  });
  let piped;
  try {
    piped = pipe(...fns);
  } catch (err) {
    return { error: err.name, phase: "pipe" };
  }
  const results = [];
  for (const call of calls) {
    try {
      results.push(call.offset !== undefined ? piped.call({ offset: call.offset }, ...call.args) : piped(...call.args));
    } catch (err) {
      return { error: err.name, phase: "call" };
    }
  }
  return { results, calls: count };
}
