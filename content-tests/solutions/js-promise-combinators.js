/**
 * @param {Iterable<any>} iterable
 * @returns {Promise<any>}
 */
function promiseAny(iterable) {
  return new Promise((resolve, reject) => {
    const items = Array.from(iterable);
    const errors = new Array(items.length);
    let remaining = items.length;
    if (remaining === 0) {
      reject(new AggregateError([], "All promises were rejected"));
      return;
    }
    items.forEach((item, i) => {
      Promise.resolve(item).then(resolve, (reason) => {
        errors[i] = reason;
        remaining -= 1;
        if (remaining === 0) reject(new AggregateError(errors, "All promises were rejected"));
      });
    });
  });
}

// ---- Test driver (leave as is) ----
// Each spec becomes one input:
//   { ok: v, ticks: n }   a promise that fulfils with v after n microtask ticks
//   { err: r, ticks: n }  a promise that rejects with r after n microtask ticks
//   { value: v }          a plain, non-promise value
async function runAnyScenario(specs, asGenerator) {
  const inputs = specs.map(makeInput);
  const iterable = asGenerator ? (function* () { yield* inputs; })() : inputs;
  let result;
  try {
    result = promiseAny(iterable);
  } catch (e) {
    return { threwSynchronously: String((e && e.message) || e) };
  }
  if (!result || typeof result.then !== "function") return { notAPromise: true };
  try {
    return { status: "fulfilled", value: await result };
  } catch (e) {
    return { status: "rejected", isAggregateError: e instanceof AggregateError, errors: e && e.errors };
  }
}

function makeInput(spec) {
  if ("value" in spec) return spec.value;
  return new Promise((resolve, reject) => {
    let n = spec.ticks || 0;
    const step = () => {
      if (n-- > 0) {
        Promise.resolve().then(step);
        return;
      }
      if ("ok" in spec) resolve(spec.ok);
      else reject(spec.err);
    };
    step();
  });
}
