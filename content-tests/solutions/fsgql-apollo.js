/**
 * A small Apollo-style normalized cache.
 *
 * A selection set is an array. Each entry is either a scalar field name ("title") or an object
 * field { name, args?, selections } whose value is an object, a list of objects, or null.
 *
 * @returns {{
 *   identify: (obj: object) => string | null,
 *   write: (selections: Array<string | object>, data: object, rootId?: string) => void,
 *   read: (selections: Array<string | object>, rootId?: string) => object | null,
 *   modify: (id: string, fieldKey: string, updater: (value: unknown) => unknown) => boolean,
 *   evict: (id: string) => boolean,
 *   extract: () => object,
 * }}
 */
function createCache() {
  const store = {};

  function identify(obj) {
    if (obj === null || typeof obj !== "object" || Array.isArray(obj)) return null;
    const id = obj.id !== undefined && obj.id !== null ? obj.id : obj._id;
    if (typeof obj.__typename !== "string" || id === undefined || id === null) return null;
    return obj.__typename + ":" + id;
  }

  function stable(value) {
    if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
    if (value !== null && typeof value === "object") {
      return "{" + Object.keys(value).sort().map((k) => JSON.stringify(k) + ":" + stable(value[k])).join(",") + "}";
    }
    return JSON.stringify(value);
  }

  function fieldKey(sel) {
    const field = typeof sel === "string" ? { name: sel } : sel;
    const hasArgs = field.args && Object.keys(field.args).length > 0;
    return { field, key: hasArgs ? `${field.name}(${stable(field.args)})` : field.name };
  }

  function normalizeFields(obj, selections) {
    const out = {};
    for (const sel of selections) {
      const { field, key } = fieldKey(sel);
      const value = obj[field.name];
      if (value === undefined) continue;
      out[key] = field.selections ? normalizeValue(value, field.selections) : value;
    }
    return out;
  }

  function normalizeValue(value, selections) {
    if (value === null) return null;
    if (Array.isArray(value)) return value.map((item) => normalizeValue(item, selections));
    const fields = normalizeFields(value, selections);
    const id = identify(value);
    if (id === null) return fields;
    store[id] = { ...(store[id] || {}), ...fields };
    return { __ref: id };
  }

  const MISSING = Symbol("missing");

  function readFields(obj, selections) {
    const out = {};
    for (const sel of selections) {
      const { field, key } = fieldKey(sel);
      if (!Object.prototype.hasOwnProperty.call(obj, key)) return MISSING;
      const value = field.selections ? readValue(obj[key], field.selections) : obj[key];
      if (value === MISSING) return MISSING;
      out[field.name] = value;
    }
    return out;
  }

  function isRef(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v) && typeof v.__ref === "string";
  }

  function readValue(value, selections) {
    if (value === null) return null;
    if (Array.isArray(value)) {
      const items = [];
      for (const item of value) {
        if (isRef(item) && !store[item.__ref]) continue; // dangling reference in a list: skip it
        const read = readValue(item, selections);
        if (read === MISSING) return MISSING;
        items.push(read);
      }
      return items;
    }
    if (isRef(value)) {
      const entity = store[value.__ref];
      return entity ? readFields(entity, selections) : MISSING;
    }
    return readFields(value, selections);
  }

  return {
    identify,
    write(selections, data, rootId = "ROOT_QUERY") {
      store[rootId] = { ...(store[rootId] || {}), ...normalizeFields(data, selections) };
    },
    read(selections, rootId = "ROOT_QUERY") {
      const root = store[rootId];
      if (!root) return null;
      const result = readFields(root, selections);
      return result === MISSING ? null : result;
    },
    modify(id, key, updater) {
      const obj = store[id];
      if (!obj || !Object.prototype.hasOwnProperty.call(obj, key)) return false;
      store[id] = { ...obj, [key]: updater(obj[key]) };
      return true;
    },
    evict(id) {
      if (!Object.prototype.hasOwnProperty.call(store, id)) return false;
      delete store[id];
      return true;
    },
    extract() {
      return JSON.parse(JSON.stringify(store));
    },
  };
}

// ---- Test driver (leave as is) ----
// Steps: ["write", selections, data], ["writeMutation", selections, data] (root "ROOT_MUTATION"),
// ["read", selections], ["extract"], ["identify", object], ["evict", id],
// ["prepend", fieldKey, id] (cache.modify on ROOT_QUERY that puts { __ref: id } first in a list).
function runCacheScript(steps) {
  const cache = createCache();
  const log = [];
  for (const [op, a, b] of steps) {
    if (op === "write") cache.write(a, b);
    else if (op === "writeMutation") cache.write(a, b, "ROOT_MUTATION");
    else if (op === "read") log.push(cache.read(a));
    else if (op === "extract") log.push(cache.extract());
    else if (op === "identify") log.push(cache.identify(a));
    else if (op === "evict") log.push(cache.evict(a));
    else if (op === "prepend") log.push(cache.modify("ROOT_QUERY", a, (list) => [{ __ref: b }, ...(list || [])]));
  }
  return log;
}
