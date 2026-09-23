/**
 * @param {{ entityId: string, type: "create"|"update"|"delete", fields: Record<string, unknown> }[]} ops
 * @returns {{ entityId: string, type: string, fields: Record<string, unknown> }[]}
 */
function coalesceOutbox(ops) {
  const queue = Array.isArray(ops) ? ops : [];
  const pending = new Map();

  for (const op of queue) {
    const entityId = op.entityId;
    const fields = op.fields && typeof op.fields === "object" ? op.fields : {};
    const current = pending.get(entityId);

    if (op.type === "create") {
      pending.set(entityId, { type: "create", fields: { ...fields }, dropped: false });
      continue;
    }

    // An entity cancelled by create-then-delete stays cancelled until it is created again.
    if (current && current.dropped) continue;

    if (op.type === "update") {
      if (!current) {
        pending.set(entityId, { type: "update", fields: { ...fields }, dropped: false });
      } else if (current.type !== "delete") {
        current.fields = { ...current.fields, ...fields };
      }
      continue;
    }

    if (op.type === "delete") {
      if (current && current.type === "create") {
        current.dropped = true;
      } else if (current) {
        current.type = "delete";
        current.fields = {};
      } else {
        pending.set(entityId, { type: "delete", fields: {}, dropped: false });
      }
    }
  }

  const out = [];
  for (const [entityId, entry] of pending) {
    if (entry.dropped) continue;
    out.push({ entityId, type: entry.type, fields: entry.fields });
  }
  return out;
}
