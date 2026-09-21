const initialFetchState = { status: "idle", data: null, error: null, requestId: 0 };

/**
 * The state machine behind useFetch. Pure: no side effects, never mutates `state`.
 * @param {{ status: string, data: any, error: string | null, requestId: number }} state
 * @param {{ type: string, requestId?: number, data?: any, error?: string }} event
 */
function fetchReducer(state, event) {
  switch (event.type) {
    case "start":
      return { status: "loading", data: state.data, error: null, requestId: event.requestId };
    case "resolve":
      if (event.requestId !== state.requestId) return state;
      return { status: "success", data: event.data, error: null, requestId: state.requestId };
    case "reject":
      if (event.requestId !== state.requestId) return state;
      return { status: "error", data: state.data, error: event.error, requestId: state.requestId };
    case "reset":
      return initialFetchState;
    default:
      throw new Error("Unknown event: " + event.type);
  }
}

/**
 * The body of useFetch's effect: useEffect(() => fetchEffect(url, fetcher, dispatch, nextId), [url]).
 * Returns the effect's cleanup function (or undefined).
 * @param {string | null} url
 * @param {(url: string, signal: AbortSignal) => PromiseLike<any>} fetcher
 * @param {(event: object) => void} dispatch
 * @param {() => number} nextId
 */
function fetchEffect(url, fetcher, dispatch, nextId) {
  if (url === null) {
    dispatch({ type: "reset" });
    return undefined;
  }
  const requestId = nextId();
  const controller = new AbortController();
  let active = true;
  dispatch({ type: "start", requestId });
  fetcher(url, controller.signal).then(
    (data) => {
      if (active) dispatch({ type: "resolve", requestId, data });
    },
    (err) => {
      if (active) dispatch({ type: "reject", requestId, error: String((err && err.message) || err) });
    },
  );
  return () => {
    active = false;
    controller.abort();
  };
}

// ---- Test driver (leave as is) ----
// scenario.reducerEvents: feeds events straight into fetchReducer and reports each state and
//   whether the reducer returned the very same object (a bail-out).
// scenario.steps: simulates a component that calls useFetch(url):
//   ["render", url]        re-render with this url; like deps [url], the effect re-runs only if url changed
//   ["resolve", url, data] the oldest pending request for url succeeds
//   ["reject", url, msg]   the oldest pending request for url fails with new Error(msg)
//   ["unmount"]            the component unmounts
//   With scenario.ignoresAbort the fake fetcher ignores its AbortSignal, like a library that
//   doesn't support cancellation.
async function runUseFetch(scenario) {
  const view = (s) => ({ status: s.status, data: s.data, error: s.error });
  if (scenario.reducerEvents) {
    let state = initialFetchState;
    const out = [];
    for (const event of scenario.reducerEvents) {
      let next;
      try {
        next = fetchReducer(state, event);
      } catch (e) {
        out.push({ threw: String((e && e.message) || e) });
        continue;
      }
      out.push({ ...view(next), same: next === state });
      state = next;
    }
    return out;
  }

  let state = initialFetchState;
  let id = 0;
  const nextId = () => ++id;
  const pending = [];
  const aborted = [];
  let lateDispatches = 0;
  const fetcher = (url, signal) =>
    new Promise((resolve, reject) => {
      const req = { url, resolve, reject, settled: false };
      pending.push(req);
      if (signal && typeof signal.addEventListener === "function") {
        signal.addEventListener("abort", () => {
          aborted.push(url);
          if (!scenario.ignoresAbort && !req.settled) {
            req.settled = true;
            const e = new Error("The operation was aborted");
            e.name = "AbortError";
            reject(e);
          }
        });
      }
    });
  let cleanup;
  let currentUrl;
  let mounted = false;
  const runEffect = (url) => {
    let cleanedUp = false;
    const dispatch = (event) => {
      if (cleanedUp) lateDispatches++;
      state = fetchReducer(state, event);
    };
    const c = fetchEffect(url, fetcher, dispatch, nextId);
    cleanup = () => {
      cleanedUp = true;
      if (typeof c === "function") c();
    };
  };
  const flush = async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve();
  };
  const states = [];
  for (const step of scenario.steps) {
    const [kind, url, payload] = step;
    if (kind === "render") {
      if (!mounted || url !== currentUrl) {
        if (cleanup) cleanup();
        cleanup = undefined;
        currentUrl = url;
        mounted = true;
        runEffect(url);
      }
    } else if (kind === "resolve" || kind === "reject") {
      const req = pending.find((r) => r.url === url && !r.settled);
      if (req) {
        req.settled = true;
        if (kind === "resolve") req.resolve(payload);
        else req.reject(new Error(payload));
      }
    } else if (kind === "unmount") {
      if (cleanup) cleanup();
      cleanup = undefined;
    }
    await flush();
    states.push(view(state));
  }
  return { states, requests: pending.length, aborted, lateDispatches };
}
