/**
 * @param {string[]} oldKeys
 * @param {string[]} newKeys
 * @returns {{ op: "remove" | "insert" | "move", key: string, before?: string | null }[]}
 */
function diffKeyedChildren(oldKeys, newKeys) {
  const assertUnique = (keys) => {
    const seen = new Set();
    for (const k of keys) {
      if (seen.has(k)) throw new Error("Duplicate key: " + k);
      seen.add(k);
    }
  };
  assertUnique(oldKeys);
  assertUnique(newKeys);

  const ops = [];
  const newSet = new Set(newKeys);
  for (const key of oldKeys) {
    if (!newSet.has(key)) ops.push({ op: "remove", key });
  }

  // Old position of every surviving key, in new order (-1 for brand-new keys).
  const oldIndex = new Map(oldKeys.map((k, i) => [k, i]));
  const positions = newKeys.map((k) => (oldIndex.has(k) ? oldIndex.get(k) : -1));

  // Longest increasing subsequence of old positions (patience sorting, O(n log n)).
  // These nodes are already in the right relative order and never move.
  const tails = []; // tails[len] = index into newKeys of the smallest tail of an LIS of length len + 1
  const prev = new Array(newKeys.length).fill(-1);
  for (let i = 0; i < positions.length; i++) {
    const p = positions[i];
    if (p === -1) continue;
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (positions[tails[mid]] < p) lo = mid + 1;
      else hi = mid;
    }
    if (lo > 0) prev[i] = tails[lo - 1];
    tails[lo] = i;
  }
  const stable = new Set();
  for (let i = tails.length ? tails[tails.length - 1] : -1; i !== -1; i = prev[i]) stable.add(i);

  // Walk the new list right to left, anchoring each node before its right-hand neighbour,
  // which is already in its final place.
  let anchor = null;
  for (let i = newKeys.length - 1; i >= 0; i--) {
    const key = newKeys[i];
    if (positions[i] === -1) ops.push({ op: "insert", key, before: anchor });
    else if (!stable.has(i)) ops.push({ op: "move", key, before: anchor });
    anchor = key;
  }
  return ops;
}

// ---- Test driver (leave as is) ----
// Applies your operations, in order, to a live list that starts as oldKeys (like DOM
// insertBefore/removeChild calls) and reports what happened.
function runKeyedDiff(oldKeys, newKeys) {
  let ops;
  try {
    ops = diffKeyedChildren(oldKeys.slice(), newKeys.slice());
  } catch (e) {
    return { error: String((e && e.message) || e) };
  }
  if (!Array.isArray(ops)) return { ok: false, invalid: "diffKeyedChildren must return an array" };
  const live = oldKeys.slice();
  const wanted = new Set(newKeys);
  const counts = { removes: 0, inserts: 0, moves: 0 };
  const placeBefore = (key, before) => {
    if (before === null || before === undefined) {
      live.push(key);
      return true;
    }
    const at = live.indexOf(before);
    if (at === -1) return false;
    live.splice(at, 0, key);
    return true;
  };
  for (const [i, o] of ops.entries()) {
    const where = "operation " + i + " (" + JSON.stringify(o) + ")";
    if (!o || typeof o !== "object") return { ok: false, invalid: where + " is not an object" };
    const at = live.indexOf(o.key);
    if (o.op === "remove") {
      if (at === -1) return { ok: false, invalid: where + ": key is not in the list" };
      live.splice(at, 1);
      counts.removes++;
    } else if (o.op === "insert") {
      if (at !== -1) return { ok: false, invalid: where + ": key is already in the list" };
      if (!wanted.has(o.key)) return { ok: false, invalid: where + ": key is not in newKeys" };
      if (!placeBefore(o.key, o.before)) return { ok: false, invalid: where + ": anchor is not in the list" };
      counts.inserts++;
    } else if (o.op === "move") {
      if (at === -1) return { ok: false, invalid: where + ": key is not in the list" };
      if (o.before === o.key) return { ok: false, invalid: where + ": a node can't be moved before itself" };
      live.splice(at, 1);
      if (!placeBefore(o.key, o.before)) return { ok: false, invalid: where + ": anchor is not in the list" };
      counts.moves++;
    } else {
      return { ok: false, invalid: where + ": unknown op" };
    }
  }
  const ok = live.length === newKeys.length && live.every((k, i) => k === newKeys[i]);
  return ok ? { ok, ...counts } : { ok, final: live, ...counts };
}
