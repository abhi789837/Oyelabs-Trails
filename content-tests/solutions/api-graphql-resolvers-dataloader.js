/**
 * Static analysis of a GraphQL operation before execution: validate it against the schema,
 * then measure depth, worst-case naive resolver calls (the N+1 count) and DataLoader batches.
 * @param {{ selections: Array<object>, fragments?: Record<string, Array<object>> }} query
 * @param {Record<string, Record<string, { type: string, list?: boolean }>>} schema
 * @param {{ maxDepth: number, maxCost: number }} limits
 */
function analyzeQuery(query, schema, limits) {
  const fragments = query.fragments || {};
  const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  let cost = 0;
  let batches = 0;
  let failure = null;

  // Returns the depth of a selection set, or -1 after recording the first validation error.
  function walk(selections, typeName, parents, fragmentStack) {
    let depth = 0;
    for (const sel of selections) {
      if (sel.spread !== undefined) {
        if (!has(fragments, sel.spread)) return fail("unknown_fragment", sel.spread);
        if (fragmentStack.includes(sel.spread)) return fail("fragment_cycle", sel.spread);
        const d = walk(fragments[sel.spread], typeName, parents, [...fragmentStack, sel.spread]);
        if (d < 0) return -1;
        depth = Math.max(depth, d); // a spread inlines its fields; it adds no level of its own
        continue;
      }
      const where = `${typeName}.${sel.field}`;
      const def = sel.field === "__typename" ? { type: "String" } : has(schema[typeName], sel.field) ? schema[typeName][sel.field] : null;
      if (!def) return fail("unknown_field", where);
      const isObject = has(schema, def.type);
      const hasChildren = Array.isArray(sel.selections) && sel.selections.length > 0;
      if (isObject && !hasChildren) return fail("missing_selection", where);
      if (!isObject && sel.selections !== undefined) return fail("unexpected_selection", where);
      if (!isObject) {
        depth = Math.max(depth, 1); // scalars resolve from the parent object: no call, no batch
        continue;
      }
      let children = parents;
      if (def.list) {
        const args = sel.args || {};
        const size = args.first !== undefined ? args.first : args.last;
        if (!Number.isInteger(size) || size < 1 || size > 100) return fail("invalid_page_size", where);
        children = parents * size;
      }
      cost += parents; // a naive resolver runs once per parent object
      batches += 1; // a DataLoader-backed resolver runs one batch per field
      const d = walk(sel.selections, def.type, children, fragmentStack);
      if (d < 0) return -1;
      depth = Math.max(depth, 1 + d);
    }
    return depth;
  }

  function fail(error, at) {
    failure = { ok: false, error, at };
    return -1;
  }

  const depth = walk(query.selections, "Query", 1, []);
  if (failure) return failure;
  if (depth > limits.maxDepth) return { ok: false, error: "too_deep", depth, cost, batches };
  if (cost > limits.maxCost) return { ok: false, error: "too_expensive", depth, cost, batches };
  return { ok: true, depth, cost, batches };
}
