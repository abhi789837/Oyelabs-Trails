/**
 * Models how React matches a re-rendered list against the previous one.
 * @param {{ id?: string | number, label: string, draft?: string }[]} oldItems
 * @param {{ id?: string | number, label: string }[]} newItems
 * @param {"id" | "index"} keyMode
 * @returns {{ inserted: string[], removed: string[], moved: string[], kept: string[], rows: { label: string, draft: string }[] }}
 */
function reconcileList(oldItems, newItems, keyMode) {
  const keysOf = (items) => {
    const seen = new Set();
    return items.map((item, i) => {
      let key;
      if (keyMode === "index") {
        key = String(i);
      } else {
        if (item.id === null || item.id === undefined) throw new Error(`Missing key at index ${i}`);
        // React coerces keys with '' + key, so 1 and "1" are the same key.
        key = String(item.id);
      }
      if (seen.has(key)) throw new Error(`Duplicate key: ${key}`);
      seen.add(key);
      return key;
    });
  };

  const oldKeys = keysOf(oldItems);
  const newKeys = keysOf(newItems);
  const oldIndexByKey = new Map(oldKeys.map((key, i) => [key, i]));
  const newKeySet = new Set(newKeys);

  const inserted = [];
  const moved = [];
  const kept = [];
  const rows = [];
  // React's placeChild: a matched child whose old index is lower than the highest old
  // index already kept in place has to move; otherwise it stays and raises the bar.
  let lastPlacedIndex = 0;
  newKeys.forEach((key, i) => {
    const oldIndex = oldIndexByKey.get(key);
    if (oldIndex === undefined) {
      inserted.push(key);
      rows.push({ label: newItems[i].label, draft: "" });
      return;
    }
    if (oldIndex < lastPlacedIndex) {
      moved.push(key);
    } else {
      kept.push(key);
      lastPlacedIndex = oldIndex;
    }
    // Props come from the new item; state (the draft) stays with the matched old row.
    rows.push({ label: newItems[i].label, draft: oldItems[oldIndex].draft ?? "" });
  });
  const removed = oldKeys.filter((key) => !newKeySet.has(key));

  return { inserted, removed, moved, kept, rows };
}

// ---- Test driver (leave as is) ----
function runReconcile(oldItems, newItems, keyMode) {
  try {
    return reconcileList(oldItems, newItems, keyMode);
  } catch (e) {
    return { error: String((e && e.message) || e) };
  }
}
