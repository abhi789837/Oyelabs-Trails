/**
 * @param {object[]} rows
 * @param {{ groupBy: string[], aggregates: { fn: string, column?: string, as: string }[], having?: { column: string, op: string, value: unknown }[] }} spec
 * @returns {object[]}
 */
function groupAggregate(rows, spec) {
  const isNull = (v) => v === null || v === undefined;
  const FNS = ["count", "sum", "avg", "min", "max", "countDistinct"];
  const OPS = {
    "=": (a, b) => a === b,
    "!=": (a, b) => a !== b,
    "<": (a, b) => a < b,
    "<=": (a, b) => a <= b,
    ">": (a, b) => a > b,
    ">=": (a, b) => a >= b,
  };
  const groupBy = spec.groupBy || [];
  const having = spec.having || [];
  for (const a of spec.aggregates) if (!FNS.includes(a.fn)) throw new Error("Unknown aggregate: " + a.fn);
  for (const h of having) if (!OPS[h.op]) throw new Error("Unknown operator: " + h.op);

  // Group rows by the JSON of their (NULL-normalized) key values, remembering first appearance.
  const groups = new Map();
  for (const row of rows) {
    const keyValues = groupBy.map((c) => (isNull(row[c]) ? null : row[c]));
    const key = JSON.stringify(keyValues);
    let group = groups.get(key);
    if (!group) {
      group = { keyValues, rows: [] };
      groups.set(key, group);
    }
    group.rows.push(row);
  }
  // Without GROUP BY, an aggregate query always returns exactly one row.
  if (groupBy.length === 0 && groups.size === 0) groups.set("[]", { keyValues: [], rows: [] });

  const aggregate = (a, groupRows) => {
    if (a.fn === "count" && a.column === undefined) return groupRows.length;
    const values = groupRows.map((r) => r[a.column]).filter((v) => !isNull(v));
    switch (a.fn) {
      case "count":
        return values.length;
      case "countDistinct":
        return new Set(values).size;
      case "sum":
        return values.length ? values.reduce((s, v) => s + v, 0) : null;
      case "avg":
        return values.length ? values.reduce((s, v) => s + v, 0) / values.length : null;
      case "min":
        return values.length ? values.reduce((m, v) => (v < m ? v : m)) : null;
      default:
        return values.length ? values.reduce((m, v) => (v > m ? v : m)) : null;
    }
  };

  const out = [];
  for (const { keyValues, rows: groupRows } of groups.values()) {
    const result = {};
    groupBy.forEach((c, i) => {
      result[c] = keyValues[i];
    });
    for (const a of spec.aggregates) result[a.as] = aggregate(a, groupRows);
    const keep = having.every((h) => {
      const v = result[h.column];
      return !isNull(v) && !isNull(h.value) && OPS[h.op](v, h.value);
    });
    if (keep) out.push(result);
  }
  return out;
}

// ---- Test driver (leave as is) ----
function runGroupBy(rows, spec) {
  try {
    return groupAggregate(rows, spec);
  } catch (e) {
    return { threw: true };
  }
}
