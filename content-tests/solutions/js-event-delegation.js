/**
 * @param {{ id: string, tag: string, classes?: string[], children?: object[] }} tree
 * @param {{ on: string, handler: string, selector?: string, capture?: boolean, stop?: "propagation" | "immediate" }[]} listeners
 * @param {string} targetId
 * @returns {{ handler: string, currentTarget: string, matched: string | null }[]}
 */
function dispatchClick(tree, listeners, targetId) {
  // Propagation path: root ... target.
  const path = [];
  const find = (node) => {
    path.push(node);
    if (node.id === targetId) return true;
    for (const child of node.children || []) if (find(child)) return true;
    path.pop();
    return false;
  };
  if (!find(tree)) return [];

  const matches = (node, selector) => {
    const m = /^([a-z][a-z0-9-]*)?((?:[.#][\w-]+)*)$/i.exec(selector);
    if (!m || (!m[1] && !m[2])) return false;
    if (m[1] && node.tag !== m[1].toLowerCase()) return false;
    const parts = m[2].match(/[.#][\w-]+/g) || [];
    return parts.every((p) => (p[0] === "#" ? node.id === p.slice(1) : (node.classes || []).includes(p.slice(1))));
  };

  // Capture steps root -> target, then bubble steps target -> root.
  const steps = [];
  path.forEach((node, depth) => steps.push({ node, depth, capture: true }));
  for (let depth = path.length - 1; depth >= 0; depth--) steps.push({ node: path[depth], depth, capture: false });

  const out = [];
  for (const { node, depth, capture } of steps) {
    let stopAfterThisStep = false;
    for (const l of listeners) {
      if (l.on !== node.id || Boolean(l.capture) !== capture) continue;
      let matched = null;
      if (l.selector) {
        for (let i = path.length - 1; i > depth; i--) {
          if (matches(path[i], l.selector)) {
            matched = path[i].id;
            break;
          }
        }
        if (matched === null) continue;
      }
      out.push({ handler: l.handler, currentTarget: node.id, matched });
      if (l.stop === "immediate") return out;
      if (l.stop === "propagation") stopAfterThisStep = true;
    }
    if (stopAfterThisStep) return out;
  }
  return out;
}
