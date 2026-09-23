/**
 * Runs a SvelteKit-style load chain, root layout first, page last.
 * @param {{ id: string, serverLoad?: Function, universalLoad?: Function }[]} nodes
 * @param {object} event
 * @returns {Promise<object>} the merged `data` prop for the page
 */
async function resolveLoadChain(nodes, event) {
  const serverData = [];
  const contributions = [];

  const merge = (list) => Object.assign({}, ...list);

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    let ownServerData;
    if (node.serverLoad) {
      const ancestors = serverData.slice(0, i);
      ownServerData = await node.serverLoad({
        ...event,
        parent: async () => merge(ancestors.filter(Boolean)),
      });
      ownServerData = ownServerData ?? {};
    }
    serverData.push(ownServerData);

    let contribution;
    if (node.universalLoad) {
      const ancestors = contributions.slice(0, i);
      contribution = await node.universalLoad({
        ...event,
        data: ownServerData,
        parent: async () => merge(ancestors),
      });
      contribution = contribution ?? {};
    } else {
      contribution = ownServerData ?? {};
    }
    contributions.push(contribution);
  }

  return merge(contributions);
}

// ---- Test driver (leave as is) ----
// Each spec node is { id, server?: { returns?, useParent? }, universal?: { returns?, useParent?, spreadData? } }.
// The driver turns the spec into real load functions, records what each one saw, and
// returns plain data. `null` in `parentSeen`/`dataSeen` means "was not provided".
function runLoadChain(spec) {
  const log = [];
  const parentSeen = {};
  const dataSeen = {};

  const nodes = spec.nodes.map((n) => {
    const node = { id: n.id };
    if (n.server) {
      node.serverLoad = async (event) => {
        log.push("server:" + n.id);
        if (n.server.useParent) parentSeen["server:" + n.id] = { ...(await event.parent()) };
        return n.server.returns === undefined ? undefined : { ...n.server.returns };
      };
    }
    if (n.universal) {
      node.universalLoad = async (event) => {
        log.push("universal:" + n.id);
        dataSeen[n.id] = event.data === undefined ? null : { ...event.data };
        if (n.universal.useParent) parentSeen["universal:" + n.id] = { ...(await event.parent()) };
        const own = n.universal.returns;
        if (n.universal.spreadData) return { ...(event.data ?? {}), ...(own ?? {}) };
        return own === undefined ? undefined : { ...own };
      };
    }
    return node;
  });

  return resolveLoadChain(nodes, { url: spec.url ?? "/", params: spec.params ?? {} }).then((data) => ({
    data,
    log,
    parentSeen,
    dataSeen,
  }));
}
