/**
 * @param {Iterable<any>} iterable
 * @returns {Promise<any[]>}
 */
function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const results = [];
    let remaining = 0;
    let index = 0;
    for (const item of iterable) {
      const i = index++;
      remaining++;
      Promise.resolve(item).then((value) => {
        results[i] = value;
        remaining--;
        if (remaining === 0) resolve(results);
      }, reject);
    }
    if (remaining === 0) resolve(results);
  });
}

// ---- Test driver (leave as is) ----
// Each spec becomes one input:
//   { ok: v, ticks: n }   a promise that fulfils with v after n microtask ticks
//   { err: r, ticks: n }  a promise that rejects with r after n microtask ticks
//   { value: v }          a plain, non-promise value
//   { thenable: v }       a non-promise object with a then() method that fulfils with v
async function runAllScenario(specs, asGenerator) {
  let pending = 0;
  const inputs = specs.map((spec) => {
    if ("value" in spec) return spec.value;
    if ("thenable" in spec) return { then: (onFulfilled) => onFulfilled(spec.thenable) };
    pending++;
    return new Promise((resolve, reject) => {
      let n = spec.ticks || 0;
      const step = () => {
        if (n-- > 0) {
          Promise.resolve().then(step);
          return;
        }
        pending--;
        if ("ok" in spec) resolve(spec.ok);
        else reject(spec.err);
      };
      step();
    });
  });
  const iterable = asGenerator ? (function* () { yield* inputs; })() : inputs;
  let result;
  try {
    result = promiseAll(iterable);
  } catch (e) {
    return { threwSynchronously: String((e && e.message) || e) };
  }
  if (!result || typeof result.then !== "function") return { notAPromise: true };
  try {
    return { status: "fulfilled", value: await result };
  } catch (reason) {
    return { status: "rejected", reason, stillPending: pending };
  }
}
