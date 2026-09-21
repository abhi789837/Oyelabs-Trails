/**
 * @param {{ running: string, columns: Record<string, { nullable: boolean, default: boolean }> }} initial
 * @param {Record<string, { reads: string[], writes: string[] }>} versions
 * @param {Array<{ migrate?: object[], deploy?: string }>} plan
 * @returns {{ ok: true, running: string, columns: Record<string, string> } | { ok: false, step: number, problems: string[] }}
 */
function checkRelease(initial, versions, plan) {
  const columns = {};
  for (const [name, c] of Object.entries(initial.columns)) {
    columns[name] = { nullable: c.nullable, default: c.default, hasNulls: false };
  }
  let running = initial.running;
  const tableOf = (column) => column.split(".")[0];
  const has = (column) => Object.prototype.hasOwnProperty.call(columns, column);

  function applyOp(op) {
    switch (op.op) {
      case "addColumn":
        if (has(op.column)) return `${op.column} already exists`;
        if (!op.nullable && !op.default) return `can't add NOT NULL column ${op.column} without a default: the table has rows`;
        columns[op.column] = { nullable: op.nullable, default: op.default, hasNulls: op.nullable && !op.default };
        return null;
      case "renameColumn":
        if (!has(op.from)) return `${op.from} doesn't exist`;
        if (has(op.to)) return `${op.to} already exists`;
        columns[op.to] = columns[op.from];
        delete columns[op.from];
        return null;
      default: {
        if (!has(op.column)) return `${op.column} doesn't exist`;
        const c = columns[op.column];
        if (op.op === "dropColumn") delete columns[op.column];
        else if (op.op === "backfill") c.hasNulls = false;
        else if (op.op === "dropNotNull") c.nullable = true;
        else if (op.op === "setNotNull") {
          if (c.hasNulls) return `${op.column} still contains NULLs`;
          c.nullable = false;
        }
        return null;
      }
    }
  }

  function problemsFor(name) {
    const v = versions[name];
    const problems = [];
    for (const column of new Set([...v.reads, ...v.writes])) {
      if (!has(column)) problems.push(`${name} uses ${column}, which doesn't exist`);
    }
    const tables = new Set(v.writes.map(tableOf));
    for (const [column, c] of Object.entries(columns)) {
      if (tables.has(tableOf(column)) && !c.nullable && !c.default && !v.writes.includes(column)) {
        problems.push(`${name} inserts into ${tableOf(column)} without ${column}, which is NOT NULL with no default`);
      }
    }
    return problems;
  }

  function trackNulls(names) {
    for (const name of names) {
      const v = versions[name];
      const tables = new Set(v.writes.map(tableOf));
      for (const [column, c] of Object.entries(columns)) {
        if (tables.has(tableOf(column)) && c.nullable && !c.default && !v.writes.includes(column)) c.hasNulls = true;
      }
    }
  }

  for (let step = 0; step < plan.length; step++) {
    const { migrate = [], deploy } = plan[step];
    const fail = (problems) => ({ ok: false, step, problems: [...problems].sort() });
    if (deploy !== undefined && !Object.prototype.hasOwnProperty.call(versions, deploy)) return fail([`unknown version ${deploy}`]);
    for (const op of migrate) {
      const problem = applyOp(op);
      if (problem) return fail([problem]);
    }
    const live = deploy !== undefined ? [...new Set([running, deploy])] : [running];
    const problems = live.flatMap(problemsFor);
    if (problems.length > 0) return fail(problems);
    trackNulls(live);
    if (deploy !== undefined) running = deploy;
  }

  const summary = {};
  for (const [name, c] of Object.entries(columns)) {
    summary[name] = `${c.nullable ? "null" : "not null"}${c.default ? " default" : ""}`;
  }
  return { ok: true, running, columns: summary };
}
