class HashRing {
  /** @param {number} vnodes points on the ring per physical node */
  constructor(vnodes) {
    this.vnodes = vnodes;
    this.nodes = new Set();
    this.points = []; // sorted by hash, then node name, then i
  }

  /** Put `vnodes` points for `name` on the ring (no-op if it's already there). */
  addNode(name) {
    if (this.nodes.has(name)) return;
    this.nodes.add(name);
    for (let i = 0; i < this.vnodes; i++) this.points.push({ hash: hash32(name + "#" + i), node: name, i });
    this.points.sort((a, b) => a.hash - b.hash || (a.node < b.node ? -1 : a.node > b.node ? 1 : 0) || a.i - b.i);
  }

  /** Take all of `name`'s points off the ring (no-op if it isn't there). */
  removeNode(name) {
    if (!this.nodes.delete(name)) return;
    this.points = this.points.filter((p) => p.node !== name);
  }

  /** @returns {string | null} the node that owns `key`, or null for an empty ring */
  getNode(key) {
    const pts = this.points;
    if (pts.length === 0) return null;
    const h = hash32(key);
    let lo = 0;
    let hi = pts.length; // find the first point with hash >= h
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (pts[mid].hash < h) lo = mid + 1;
      else hi = mid;
    }
    return pts[lo === pts.length ? 0 : lo].node;
  }
}

// ---- Test driver (leave as is) ----
function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

function runRing(vnodes, steps) {
  const ring = new HashRing(vnodes);
  const out = [];
  let snapshot = [];
  const assign = (prefix, n) => Array.from({ length: n }, (_, i) => ring.getNode(prefix + i));
  for (const s of steps) {
    if (s.op === "add") ring.addNode(s.node);
    else if (s.op === "remove") ring.removeNode(s.node);
    else if (s.op === "get") out.push(ring.getNode(s.key));
    else if (s.op === "counts") {
      const counts = {};
      for (const node of assign(s.prefix, s.n)) counts[node] = (counts[node] ?? 0) + 1;
      out.push(counts);
    } else if (s.op === "snapshot") snapshot = assign(s.prefix, s.n);
    else if (s.op === "moved") {
      const now = assign(s.prefix, s.n);
      const moves = {};
      let moved = 0;
      now.forEach((node, i) => {
        if (node !== snapshot[i]) {
          moved++;
          const k = snapshot[i] + "->" + node;
          moves[k] = (moves[k] ?? 0) + 1;
        }
      });
      out.push(s.summary ? { moved, to: [...new Set(Object.keys(moves).map((k) => k.split("->")[1]))].sort() } : { moved, moves });
    }
  }
  return out;
}
