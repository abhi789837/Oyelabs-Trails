/**
 * @typedef {{ status: "idle" }
 *   | { status: "loading", attempt: number }
 *   | { status: "success", data: unknown }
 *   | { status: "error", error: string, attempt: number }} State
 * @typedef {{ type: "FETCH" }
 *   | { type: "RESOLVE", data: unknown }
 *   | { type: "REJECT", error: string }
 *   | { type: "RETRY" }
 *   | { type: "RESET" }} MachineEvent
 */

const MAX_ATTEMPTS = 3;
const EVENT_TYPES = ["FETCH", "RESOLVE", "REJECT", "RETRY", "RESET"];

/**
 * @param {State} state
 * @param {MachineEvent} event
 * @returns {State}
 */
function transition(state, event) {
  // Runtime half of the exhaustive check: reject unknown events in every state.
  if (!EVENT_TYPES.includes(event.type)) {
    throw new Error(`Unknown event type: ${event.type}`);
  }
  switch (state.status) {
    case "idle":
      return event.type === "FETCH" ? { status: "loading", attempt: 1 } : state;
    case "loading":
      if (event.type === "RESOLVE") return { status: "success", data: event.data };
      if (event.type === "REJECT") return { status: "error", error: event.error, attempt: state.attempt };
      if (event.type === "RESET") return { status: "idle" };
      return state;
    case "success":
      if (event.type === "FETCH") return { status: "loading", attempt: 1 };
      if (event.type === "RESET") return { status: "idle" };
      return state;
    case "error":
      if (event.type === "RETRY") {
        return state.attempt < MAX_ATTEMPTS ? { status: "loading", attempt: state.attempt + 1 } : state;
      }
      if (event.type === "RESET") return { status: "idle" };
      return state;
    default:
      throw new Error(`Unknown status: ${state.status}`);
  }
}

// ---- Test driver (leave as is) ----
function runMachine(events, initial = { status: "idle" }) {
  let state = Object.freeze({ ...initial });
  let ignored = 0;
  for (let i = 0; i < events.length; i++) {
    let next;
    try {
      next = transition(state, events[i]);
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e), processed: i };
    }
    if (next === state) ignored++;
    state = Object.freeze(next);
  }
  return { final: state, ignored };
}
