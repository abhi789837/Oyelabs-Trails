/**
 * Reconcile two replicas of one record using their vector clocks.
 *
 * @param {{ clock: object, deleted?: boolean, fields: object }} local
 * @param {{ clock: object, deleted?: boolean, fields: object }} remote
 * @returns {{ status: string, clock: object, deleted: boolean, fields: object }}
 */
function mergeRecord(local, remote) {
  const ids = new Set([...Object.keys(local.clock), ...Object.keys(remote.clock)]);
  const clock = {};
  let localAhead = false;
  let remoteAhead = false;
  for (const id of ids) {
    const l = local.clock[id] ?? 0;
    const r = remote.clock[id] ?? 0;
    if (l > r) localAhead = true;
    if (r > l) remoteAhead = true;
    clock[id] = Math.max(l, r);
  }

  let status;
  if (!localAhead && !remoteAhead) status = "identical";
  else if (localAhead && !remoteAhead) status = "local";
  else if (remoteAhead && !localAhead) status = "remote";
  else status = "merged";

  if (status !== "merged") {
    const winner = status === "remote" ? remote : local;
    const deleted = winner.deleted === true;
    return { status, clock, deleted, fields: deleted ? {} : { ...winner.fields } };
  }

  if (local.deleted === true || remote.deleted === true) {
    return { status, clock, deleted: true, fields: {} };
  }

  const fields = {};
  for (const name of new Set([...Object.keys(local.fields), ...Object.keys(remote.fields)])) {
    const l = local.fields[name];
    const r = remote.fields[name];
    if (!r) fields[name] = l;
    else if (!l) fields[name] = r;
    else if (l.ts !== r.ts) fields[name] = l.ts > r.ts ? l : r;
    else fields[name] = l.replica > r.replica ? l : r;
  }
  return { status, clock, deleted: false, fields };
}
