/**
 * Like `git merge-base --all a b`.
 * @param {Record<string, string[]>} parents commit id -> parent ids
 * @param {string} a
 * @param {string} b
 * @returns {string[] | null} merge bases sorted ascending, or null for an unknown commit
 */
function mergeBases(parents, a, b) {
  const has = (id) => Object.prototype.hasOwnProperty.call(parents, id);
  if (!has(a) || !has(b)) return null;

  // Every commit reachable from `start`, including itself. Iterative, so deep histories can't overflow the stack.
  const ancestorsOf = (start) => {
    const seen = new Set([start]);
    const stack = [start];
    while (stack.length) {
      const id = stack.pop();
      for (const p of parents[id]) {
        if (has(p) && !seen.has(p)) {
          seen.add(p);
          stack.push(p);
        }
      }
    }
    return seen;
  };

  const fromA = ancestorsOf(a);
  const fromB = ancestorsOf(b);
  const common = [...fromA].filter((id) => fromB.has(id));

  // A common ancestor that is a proper ancestor of another common ancestor isn't "best".
  // One multi-source walk from the parents of every common ancestor marks all of them: O(V + E).
  const dominated = new Set();
  const stack = [];
  for (const id of common) {
    for (const p of parents[id]) if (has(p)) stack.push(p);
  }
  while (stack.length) {
    const id = stack.pop();
    if (dominated.has(id)) continue;
    dominated.add(id);
    for (const p of parents[id]) if (has(p) && !dominated.has(p)) stack.push(p);
  }

  return common.filter((id) => !dominated.has(id)).sort();
}
