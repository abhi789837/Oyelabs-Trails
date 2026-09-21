/**
 * Like JSON.stringify(value), but writes "[Circular]" instead of throwing on cycles.
 * @param {any} value
 * @returns {string}
 */
function safeStringify(value) {
  const ancestors = [];
  return JSON.stringify(value, function (key, val) {
    if (typeof val !== "object" || val === null) return val;
    // `this` is the object holding `key`: drop ancestors that are no longer on the current path.
    while (ancestors.length > 0 && ancestors[ancestors.length - 1] !== this) ancestors.pop();
    if (ancestors.includes(val)) return "[Circular]";
    ancestors.push(val);
    return val;
  });
}

// ---- Test driver (leave as is) ----
function runSafeStringify(data, links) {
  const resolve = (path) => (path === "" ? data : path.split(".").reduce((obj, key) => obj[key], data));
  const special = (target) => {
    if (target === "@fn") return function () {};
    if (target === "@symbol") return Symbol("s");
    if (target === "@nan") return NaN;
    if (target.startsWith("@date:")) return new Date(target.slice(6));
    return resolve(target);
  };
  for (const [from, key, target] of links) resolve(from)[key] = special(target);
  return safeStringify(data);
}
