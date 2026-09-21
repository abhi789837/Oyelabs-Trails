/**
 * @param {Record<string, { size: number, imports?: string[], dynamicImports?: string[] }>} modules
 * @param {string[]} entries
 * @param {{ name: string, test: string }[]} groups
 */
function planChunks(modules, entries, groups) {
  const has = (id) => Object.prototype.hasOwnProperty.call(modules, id);
  const staticOf = (id) => (modules[id].imports || []).filter(has);
  const dynamicOf = (id) => (modules[id].dynamicImports || []).filter(has);

  // 1. Discover entry points: the given entries plus every reachable dynamic-import target.
  const entryPoints = [];
  const seenEntry = new Set();
  const queue = entries.filter(has);
  while (queue.length) {
    const entry = queue.shift();
    if (seenEntry.has(entry)) continue;
    seenEntry.add(entry);
    entryPoints.push(entry);
    for (const id of closure(entry)) for (const dyn of dynamicOf(id)) queue.push(dyn);
  }

  function closure(entry) {
    const seen = new Set([entry]);
    const stack = [entry];
    while (stack.length) {
      for (const dep of staticOf(stack.pop())) {
        if (!seen.has(dep)) {
          seen.add(dep);
          stack.push(dep);
        }
      }
    }
    return seen;
  }

  // 2. For every module, which entry points load it (statically)?
  const loadedBy = new Map();
  for (const entry of entryPoints) {
    for (const id of closure(entry)) {
      if (!loadedBy.has(id)) loadedBy.set(id, new Set());
      loadedBy.get(id).add(entry);
    }
  }

  // 3. Assign modules to chunks: manual groups first, then by identical entry-point set.
  const chunks = new Map();
  for (const [id, set] of loadedBy) {
    const group = (groups || []).find((g) => id.startsWith(g.test));
    const sorted = [...set].sort();
    const name = group ? group.name : sorted.length === 1 ? sorted[0] : "shared(" + sorted.join(",") + ")";
    if (!chunks.has(name)) chunks.set(name, { name, modules: [], size: 0, loadedBy: new Set() });
    const chunk = chunks.get(name);
    chunk.modules.push(id);
    chunk.size += modules[id].size;
    set.forEach((e) => chunk.loadedBy.add(e));
  }

  const list = [...chunks.values()]
    .map((c) => ({ name: c.name, modules: c.modules.sort(), size: c.size, loadedBy: [...c.loadedBy].sort() }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const bytes = {};
  for (const entry of entryPoints) {
    bytes[entry] = list.filter((c) => c.loadedBy.includes(entry)).reduce((sum, c) => sum + c.size, 0);
  }
  return { chunks: list, bytes };
}
