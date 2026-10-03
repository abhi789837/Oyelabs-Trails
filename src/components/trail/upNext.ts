/**
 * The "Up next" overlay that appears when a playlist video ends, as a pure reducer so it can be
 * tested without a DOM.
 *
 * - `idle`: nothing shown.
 * - `counting`: autoplay is on; "Up next: <title> in 5s" with Play now and Cancel.
 * - `waiting`: autoplay is off (or was cancelled by the browser); "Up next" with Play now only.
 * - `advance`: the caller should load `nextIndex` now and then dispatch `reset`.
 */

export const UP_NEXT_SECONDS = 5;

export type UpNextState =
  | { phase: "idle" }
  | { phase: "counting"; nextIndex: number; secondsLeft: number }
  | { phase: "waiting"; nextIndex: number }
  | { phase: "advance"; nextIndex: number };

export type UpNextEvent =
  | { type: "ended"; nextIndex: number | null; autoplay: boolean }
  | { type: "tick" }
  | { type: "playNow" }
  | { type: "cancel" }
  /** The learner picked a video or started playing again: the overlay goes away. */
  | { type: "reset" };

export const initialUpNext: UpNextState = { phase: "idle" };

export function upNextReducer(state: UpNextState, event: UpNextEvent): UpNextState {
  switch (event.type) {
    case "ended":
      if (event.nextIndex === null) return { phase: "idle" };
      return event.autoplay
        ? { phase: "counting", nextIndex: event.nextIndex, secondsLeft: UP_NEXT_SECONDS }
        : { phase: "waiting", nextIndex: event.nextIndex };
    case "tick":
      if (state.phase !== "counting") return state;
      return state.secondsLeft <= 1
        ? { phase: "advance", nextIndex: state.nextIndex }
        : { ...state, secondsLeft: state.secondsLeft - 1 };
    case "playNow":
      return state.phase === "counting" || state.phase === "waiting" ? { phase: "advance", nextIndex: state.nextIndex } : state;
    case "cancel":
      return state.phase === "counting" || state.phase === "waiting" ? { phase: "idle" } : state;
    case "reset":
      return { phase: "idle" };
  }
}

/**
 * Which video plays after `current`: the next one in order that is not unavailable, preferring
 * one not yet watched. Null at the end of the list.
 */
export function nextIndexAfter(current: number, items: readonly { status: string }[]): number | null {
  const after = items.map((item, index) => ({ item, index })).filter(({ index, item }) => index > current && item.status !== "unavailable");
  const unwatched = after.find(({ item }) => item.status !== "watched");
  return (unwatched ?? after[0])?.index ?? null;
}
