/**
 * The parent's minimal state: { items: { id, name }[], query: string, selectedIds: id[] }.
 * Everything else is derived.
 */
function selectTableView(state) {
  const selected = new Set(state.selectedIds);
  const query = state.query.trim().toLowerCase();
  const visible = query === "" ? state.items : state.items.filter((item) => item.name.toLowerCase().includes(query));
  const rows = visible.map((item) => ({ id: item.id, name: item.name, selected: selected.has(item.id) }));
  const visibleSelected = rows.filter((row) => row.selected).length;
  // Only ids that still match an item count: stale ids from a refetch are ignored.
  const selectedCount = state.items.filter((item) => selected.has(item.id)).length;
  let headerCheckbox = "unchecked";
  if (rows.length > 0 && visibleSelected === rows.length) headerCheckbox = "checked";
  else if (visibleSelected > 0) headerCheckbox = "indeterminate";
  return {
    rows,
    visibleCount: rows.length,
    selectedCount,
    hiddenSelectedCount: selectedCount - visibleSelected,
    headerCheckbox,
    canDelete: selectedCount > 0,
  };
}

function tableReducer(state, action) {
  switch (action.type) {
    case "setQuery":
      return action.query === state.query ? state : { ...state, query: action.query };
    case "toggle": {
      if (!state.items.some((item) => item.id === action.id)) return state;
      const isSelected = state.selectedIds.includes(action.id);
      return {
        ...state,
        selectedIds: isSelected ? state.selectedIds.filter((id) => id !== action.id) : [...state.selectedIds, action.id],
      };
    }
    case "toggleAllVisible": {
      const view = selectTableView(state);
      if (view.visibleCount === 0) return state;
      const visibleIds = new Set(view.rows.map((row) => row.id));
      if (view.headerCheckbox === "checked") {
        return { ...state, selectedIds: state.selectedIds.filter((id) => !visibleIds.has(id)) };
      }
      const next = new Set(state.selectedIds);
      visibleIds.forEach((id) => next.add(id));
      return { ...state, selectedIds: [...next] };
    }
    case "deleteSelected": {
      if (state.selectedIds.length === 0) return state;
      const selected = new Set(state.selectedIds);
      return { ...state, items: state.items.filter((item) => !selected.has(item.id)), selectedIds: [] };
    }
    case "replaceItems":
      return { ...state, items: action.items };
    default:
      return state;
  }
}

// ---- Test driver (leave as is) ----
function runTable(items, actions) {
  let state = deepFreeze({ items, query: "", selectedIds: [] });
  for (const action of actions) state = deepFreeze(tableReducer(state, action));
  return { ...selectTableView(state), query: state.query, storedKeys: Object.keys(state).sort() };
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}
