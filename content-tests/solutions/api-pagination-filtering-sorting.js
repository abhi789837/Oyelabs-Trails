/**
 * Keyset pagination, newest first: ORDER BY createdAt DESC, id DESC.
 * @param {Array<{ id: number, createdAt: number }>} rows the whole "table", in any order
 * @param {{ limit: number, cursor?: string | null }} params
 * @returns {{ items: Array<object>, nextCursor: string | null } | { error: "invalid_limit" | "invalid_cursor" }}
 */
function getPage(rows, { limit, cursor }) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) return { error: "invalid_limit" };

  let after = null;
  if (cursor !== undefined && cursor !== null) {
    after = decodeCursor(cursor);
    if (!after) return { error: "invalid_cursor" };
  }

  const sorted = [...rows].sort((a, b) => b.createdAt - a.createdAt || b.id - a.id);
  // Rows strictly after the cursor position in (createdAt DESC, id DESC) order:
  // WHERE (created_at, id) < (cursorCreatedAt, cursorId)
  const candidates = after
    ? sorted.filter((r) => r.createdAt < after[0] || (r.createdAt === after[0] && r.id < after[1]))
    : sorted;

  // Fetch one extra row to learn whether another page exists.
  const fetched = candidates.slice(0, limit + 1);
  const items = fetched.slice(0, limit);
  const hasMore = fetched.length > limit;
  const last = items[items.length - 1];
  return { items, nextCursor: hasMore ? encodeCursor(last) : null };
}

function encodeCursor(row) {
  return btoa(JSON.stringify([row.createdAt, row.id]));
}

function decodeCursor(cursor) {
  if (typeof cursor !== "string" || cursor === "") return null;
  try {
    const value = JSON.parse(atob(cursor));
    if (Array.isArray(value) && value.length === 2 && Number.isFinite(value[0]) && Number.isInteger(value[1])) return value;
  } catch {
    // not base64 or not JSON
  }
  return null;
}

// ---- Test driver (leave as is) ----
function runPagination(rows, limit, steps) {
  const table = rows.map((r) => ({ ...r }));
  let cursor = null;
  const log = [];
  for (const step of steps) {
    if (step.op === "page") {
      const res = getPage(table, { limit, cursor });
      if (!res || res.error) {
        log.push({ error: res ? res.error : "no result" });
        continue;
      }
      log.push({ ids: res.items.map((r) => r.id), hasMore: res.nextCursor !== null });
      cursor = res.nextCursor;
    } else if (step.op === "peekCursor") {
      log.push({ cursor });
    } else if (step.op === "setCursor") {
      cursor = step.cursor;
    } else if (step.op === "insert") {
      table.push({ ...step.row });
    } else if (step.op === "delete") {
      const i = table.findIndex((r) => r.id === step.id);
      if (i >= 0) table.splice(i, 1);
    }
  }
  return log;
}
