/**
 * @param {string} version e.g. "1.4.2" or "2.0.0-beta.1"
 * @param {string} range e.g. "^1.2.3", "~0.4.0", "1.x", "*" or "1.2.3"
 * @returns {boolean}
 */
function satisfies(version, range) {
  const v = parseVersion(version);
  if (!v || typeof range !== "string") return false;
  const r = range.trim();

  // Exact version (including an exact prerelease).
  const exact = parseVersion(r);
  if (exact) return exact.pre === v.pre && compare(exact.nums, v.nums) === 0;

  // Prereleases never satisfy caret, tilde or x-ranges.
  if (v.pre !== null) return false;

  let lower;
  let upper = null; // exclusive; null means unbounded
  let m;
  if ((m = /^\^(\d+)\.(\d+)\.(\d+)$/.exec(r))) {
    const [major, minor, patch] = m.slice(1).map(Number);
    lower = [major, minor, patch];
    if (major > 0) upper = [major + 1, 0, 0];
    else if (minor > 0) upper = [0, minor + 1, 0];
    else upper = [0, 0, patch + 1];
  } else if ((m = /^~(\d+)\.(\d+)\.(\d+)$/.exec(r))) {
    const [major, minor, patch] = m.slice(1).map(Number);
    lower = [major, minor, patch];
    upper = [major, minor + 1, 0];
  } else {
    const parts = r.split(".");
    if (parts.length > 3) return false;
    const fixed = [];
    let wildcardSeen = false;
    for (const part of parts) {
      if (part === "x" || part === "X" || part === "*") {
        wildcardSeen = true;
      } else if (/^\d+$/.test(part) && !wildcardSeen) {
        fixed.push(Number(part));
      } else {
        return false;
      }
    }
    if (fixed.length === 0) lower = [0, 0, 0];
    else if (fixed.length === 1) {
      lower = [fixed[0], 0, 0];
      upper = [fixed[0] + 1, 0, 0];
    } else if (fixed.length === 2) {
      lower = [fixed[0], fixed[1], 0];
      upper = [fixed[0], fixed[1] + 1, 0];
    } else return false;
  }
  return compare(v.nums, lower) >= 0 && (upper === null || compare(v.nums, upper) < 0);
}

function parseVersion(s) {
  if (typeof s !== "string") return null;
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(s);
  if (!m) return null;
  return { nums: [Number(m[1]), Number(m[2]), Number(m[3])], pre: m[4] === undefined ? null : m[4] };
}

function compare(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}
