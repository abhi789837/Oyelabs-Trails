/**
 * @param {object[]} docs
 * @param {object[]} pipeline
 * @returns {object[]}
 */
function aggregate(docs, pipeline) {
  const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  const getPath = (doc, path) => {
    let cur = doc;
    for (const part of path.split(".")) {
      if (!isPlainObject(cur) || !Object.prototype.hasOwnProperty.call(cur, part)) return undefined;
      cur = cur[part];
    }
    return cur;
  };

  // Returns a copy of doc with path set to value, copying only the objects along the path.
  const setPath = (doc, path, value) => {
    const [head, ...rest] = path.split(".");
    const copy = { ...doc };
    copy[head] = rest.length ? setPath(isPlainObject(doc[head]) ? doc[head] : {}, rest.join("."), value) : value;
    return copy;
  };

  const evalExpr = (doc, expr) => (typeof expr === "string" && expr.startsWith("$") ? getPath(doc, expr.slice(1)) : expr);
  const orNull = (v) => (v === undefined ? null : v);

  // ---- $match ----
  const equals = (value, target) => {
    if (target === null) return value === null || value === undefined || (Array.isArray(value) && value.includes(null));
    if (Array.isArray(value) && value.some((v) => same(v, target))) return true;
    return value !== undefined && same(value, target);
  };
  const compare = (value, target, test) => {
    const ok = (v) =>
      (typeof v === "number" && typeof target === "number") || (typeof v === "string" && typeof target === "string")
        ? test(v, target)
        : false;
    return Array.isArray(value) ? value.some(ok) : ok(value);
  };
  const OPERATORS = {
    $eq: (v, t) => equals(v, t),
    $ne: (v, t) => !equals(v, t),
    $gt: (v, t) => compare(v, t, (a, b) => a > b),
    $gte: (v, t) => compare(v, t, (a, b) => a >= b),
    $lt: (v, t) => compare(v, t, (a, b) => a < b),
    $lte: (v, t) => compare(v, t, (a, b) => a <= b),
    $in: (v, t) => t.some((x) => equals(v, x)),
    $exists: (v, t) => (v !== undefined) === Boolean(t),
  };
  const matches = (doc, filter) =>
    Object.entries(filter).every(([path, cond]) => {
      const value = getPath(doc, path);
      const keys = isPlainObject(cond) ? Object.keys(cond) : [];
      const isOperatorObject = keys.length > 0 && keys.every((k) => k.startsWith("$"));
      if (!isOperatorObject) return equals(value, cond);
      return keys.every((op) => {
        if (!OPERATORS[op]) throw new Error("Unsupported operator: " + op);
        return OPERATORS[op](value, cond[op]);
      });
    });

  // ---- $sort: null/missing < numbers < strings < anything else ----
  const rank = (v) => (v === null || v === undefined ? 0 : typeof v === "number" ? 1 : typeof v === "string" ? 2 : 3);
  const compareValues = (a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (ra === 0) return 0;
    const x = ra === 3 ? JSON.stringify(a) : a;
    const y = ra === 3 ? JSON.stringify(b) : b;
    return x < y ? -1 : x > y ? 1 : 0;
  };

  // ---- $group ----
  const present = (values) => values.filter((v) => v !== null && v !== undefined);
  const numbers = (values) => values.filter((v) => typeof v === "number");
  const ACCUMULATORS = {
    $sum: (values) => numbers(values).reduce((s, v) => s + v, 0),
    $avg: (values) => {
      const nums = numbers(values);
      return nums.length ? nums.reduce((s, v) => s + v, 0) / nums.length : null;
    },
    $min: (values) => {
      const vals = present(values);
      return vals.length ? vals.reduce((m, v) => (compareValues(v, m) < 0 ? v : m)) : null;
    },
    $max: (values) => {
      const vals = present(values);
      return vals.length ? vals.reduce((m, v) => (compareValues(v, m) > 0 ? v : m)) : null;
    },
    $push: (values) => values.filter((v) => v !== undefined),
  };
  const group = (input, spec) => {
    const evalId = (doc) => {
      if (isPlainObject(spec._id)) {
        const id = {};
        for (const [k, expr] of Object.entries(spec._id)) id[k] = orNull(evalExpr(doc, expr));
        return id;
      }
      return orNull(evalExpr(doc, spec._id));
    };
    const fields = Object.entries(spec).filter(([k]) => k !== "_id");
    for (const [, acc] of fields) {
      const name = Object.keys(acc)[0];
      if (!ACCUMULATORS[name]) throw new Error("Unsupported accumulator: " + name);
    }
    const groups = new Map();
    for (const doc of input) {
      const id = evalId(doc);
      const key = JSON.stringify(id);
      if (!groups.has(key)) groups.set(key, { id, members: [] });
      groups.get(key).members.push(doc);
    }
    return [...groups.values()].map(({ id, members }) => {
      const out = { _id: id };
      for (const [field, acc] of fields) {
        const name = Object.keys(acc)[0];
        out[field] = ACCUMULATORS[name](members.map((d) => evalExpr(d, acc[name])));
      }
      return out;
    });
  };

  // ---- $project ----
  const isInclude = (v) => v === 1 || v === true;
  const isExclude = (v) => v === 0 || v === false;
  const isComputed = (v) => typeof v === "string" && v.startsWith("$");
  const project = (input, spec) => {
    const entries = Object.entries(spec);
    for (const [, v] of entries) {
      if (!isInclude(v) && !isExclude(v) && !isComputed(v)) throw new Error("Unsupported projection value");
    }
    const others = entries.filter(([k]) => k !== "_id");
    const excluded = others.filter(([, v]) => isExclude(v));
    if (excluded.length && excluded.length !== others.length) throw new Error("Cannot mix inclusion and exclusion");
    const dropId = "_id" in spec && isExclude(spec._id);
    const exclusionMode = others.length ? excluded.length === others.length : dropId;
    return input.map((doc) => {
      if (exclusionMode) {
        const out = { ...doc };
        for (const [k] of excluded) delete out[k];
        if (dropId) delete out._id;
        return out;
      }
      const out = {};
      if (!dropId) {
        const idValue = "_id" in spec && isComputed(spec._id) ? evalExpr(doc, spec._id) : doc._id;
        if (idValue !== undefined) out._id = idValue;
      }
      for (const [k, v] of others) {
        const value = isComputed(v) ? evalExpr(doc, v) : doc[k];
        if (value !== undefined) out[k] = value;
      }
      return out;
    });
  };

  let current = docs.slice();
  for (const stage of pipeline) {
    const stageKeys = Object.keys(stage);
    if (stageKeys.length !== 1) throw new Error("A stage must have exactly one key");
    const name = stageKeys[0];
    const arg = stage[name];
    switch (name) {
      case "$match":
        current = current.filter((doc) => matches(doc, arg));
        break;
      case "$group":
        current = group(current, arg);
        break;
      case "$sort": {
        const sortKeys = Object.entries(arg);
        current = current.slice().sort((a, b) => {
          for (const [path, dir] of sortKeys) {
            const c = compareValues(getPath(a, path), getPath(b, path));
            if (c !== 0) return dir === -1 ? -c : c;
          }
          return 0;
        });
        break;
      }
      case "$skip":
        current = current.slice(arg);
        break;
      case "$limit":
        current = current.slice(0, arg);
        break;
      case "$unwind": {
        const path = String(arg).slice(1);
        const out = [];
        for (const doc of current) {
          const value = getPath(doc, path);
          if (value === undefined || value === null) continue;
          if (Array.isArray(value)) for (const element of value) out.push(setPath(doc, path, element));
          else out.push(doc);
        }
        current = out;
        break;
      }
      case "$project":
        current = project(current, arg);
        break;
      default:
        throw new Error("Unsupported stage: " + name);
    }
  }
  return current;
}

// ---- Test driver (leave as is) ----
function runPipeline(docs, pipeline) {
  const before = JSON.stringify(docs);
  let out;
  try {
    out = aggregate(docs, pipeline);
  } catch (e) {
    return { threw: true };
  }
  return {
    docs: out === undefined ? null : JSON.parse(JSON.stringify(out)),
    inputUnchanged: JSON.stringify(docs) === before,
  };
}
