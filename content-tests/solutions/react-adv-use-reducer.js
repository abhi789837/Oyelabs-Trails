const MAX_HISTORY = 5;

/**
 * @typedef {{ id: number, text: string, done: boolean }} Todo
 * @typedef {{ past: Todo[][], present: Todo[], future: Todo[][] }} HistoryState
 * @param {HistoryState} state
 * @param {{ type: string, id?: number, text?: string }} action
 * @returns {HistoryState}
 */
function historyReducer(state, action) {
  const commit = (nextPresent) => {
    if (nextPresent === state.present) return state;
    const past = [...state.past, state.present];
    if (past.length > MAX_HISTORY) past.shift();
    return { past, present: nextPresent, future: [] };
  };

  switch (action.type) {
    case "add": {
      const text = typeof action.text === "string" ? action.text.trim() : "";
      if (!text || state.present.some((t) => t.id === action.id)) return state;
      return commit([...state.present, { id: action.id, text, done: false }]);
    }
    case "toggle": {
      if (!state.present.some((t) => t.id === action.id)) return state;
      return commit(state.present.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t)));
    }
    case "remove": {
      if (!state.present.some((t) => t.id === action.id)) return state;
      return commit(state.present.filter((t) => t.id !== action.id));
    }
    case "clearCompleted": {
      if (!state.present.some((t) => t.done)) return state;
      return commit(state.present.filter((t) => !t.done));
    }
    case "undo": {
      if (state.past.length === 0) return state;
      return {
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future],
      };
    }
    case "redo": {
      if (state.future.length === 0) return state;
      return {
        past: [...state.past, state.present],
        present: state.future[0],
        future: state.future.slice(1),
      };
    }
    default:
      throw new Error("Unknown action: " + action.type);
  }
}

// ---- Test driver (leave as is) ----
// Dispatches the actions one by one, the way useReducer would, and reports the final state
// plus what React would care about: which dispatches were no-ops (same state object, so
// React bails out), whether any state was mutated, and whether unchanged todos kept their
// object identity (so memoized rows can skip re-rendering).
function runHistory(initialTodos, actions) {
  let state = { past: [], present: initialTodos, future: [] };
  const noops = [];
  let mutated = false;
  let identityPreserved = true;
  for (const [i, action] of actions.entries()) {
    const before = JSON.stringify(state);
    let next;
    try {
      next = historyReducer(state, action);
    } catch (e) {
      return { error: String((e && e.message) || e) };
    }
    if (JSON.stringify(state) !== before) mutated = true;
    if (!next || !Array.isArray(next.present) || !Array.isArray(next.past) || !Array.isArray(next.future)) {
      return { error: "reducer must return { past, present, future }" };
    }
    if (next === state) noops.push(i);
    for (const todo of next.present) {
      const old = state.present.find((t) => t.id === todo.id);
      if (old && old !== todo && old.text === todo.text && old.done === todo.done) identityPreserved = false;
    }
    state = next;
  }
  return {
    present: state.present,
    pastLength: state.past.length,
    futureLength: state.future.length,
    noops,
    mutated,
    identityPreserved,
  };
}
