/**
 * @param {object[]} left
 * @param {object[]} right
 * @param {"inner" | "left" | "right" | "full"} type
 * @param {string} leftKey
 * @param {string} rightKey
 * @returns {{ left: object | null, right: object | null }[]}
 */
function hashJoin(left, right, type, leftKey, rightKey) {
  if (type !== "inner" && type !== "left" && type !== "right" && type !== "full") {
    throw new Error("Unsupported join type: " + type);
  }
  const isNull = (v) => v === null || v === undefined;

  // Build a hash index on one side: key -> list of { row, index } in input order.
  const buildIndex = (rows, key) => {
    const index = new Map();
    rows.forEach((row, i) => {
      const k = row[key];
      if (isNull(k)) return;
      let bucket = index.get(k);
      if (!bucket) {
        bucket = [];
        index.set(k, bucket);
      }
      bucket.push({ row, i });
    });
    return index;
  };

  const out = [];
  if (type === "right") {
    // Build on the left side, probe with the right side so output follows right order.
    const index = buildIndex(left, leftKey);
    for (const r of right) {
      const k = r[rightKey];
      const matches = isNull(k) ? undefined : index.get(k);
      if (matches) for (const m of matches) out.push({ left: m.row, right: r });
      else out.push({ left: null, right: r });
    }
    return out;
  }

  const index = buildIndex(right, rightKey);
  const matchedRight = new Set();
  for (const l of left) {
    const k = l[leftKey];
    const matches = isNull(k) ? undefined : index.get(k);
    if (matches) {
      for (const m of matches) {
        out.push({ left: l, right: m.row });
        matchedRight.add(m.i);
      }
    } else if (type !== "inner") {
      out.push({ left: l, right: null });
    }
  }
  if (type === "full") {
    right.forEach((r, i) => {
      if (!matchedRight.has(i)) out.push({ left: null, right: r });
    });
  }
  return out;
}

// ---- Test driver (leave as is) ----
function runJoin(type, left, right, leftKey, rightKey, mode) {
  let reads = 0;
  let counting = true;
  const instrument = (rows, key) =>
    rows.map((row) => {
      const copy = {};
      for (const name of Object.keys(row)) {
        const value = row[name];
        if (name === key) {
          Object.defineProperty(copy, name, {
            enumerable: true,
            get() {
              if (counting) reads++;
              return value;
            },
          });
        } else {
          copy[name] = value;
        }
      }
      return copy;
    });
  const l = instrument(left, leftKey);
  const r = instrument(right, rightKey);
  let result;
  try {
    result = hashJoin(l, r, type, leftKey, rightKey);
  } catch (e) {
    return { threw: true };
  }
  counting = false;
  if (!Array.isArray(result)) return { notAnArray: true };
  if (mode === "budget") {
    return { pairs: result.length, withinReadBudget: reads <= 2 * (left.length + right.length) };
  }
  return JSON.parse(JSON.stringify(result));
}
