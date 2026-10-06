/*
 * The isolated code runner: learner code never runs in the app's own page.
 *
 * The app's Content Security Policy has no `'unsafe-eval'` (and must not get one), and a Worker
 * built from a Blob URL inherits that policy, so `new Function(code)` throws `EvalError` there. The
 * learner's code runs instead inside `/runner.html`:
 *
 * - served with its own, narrower CSP (server/src/lib/csp.ts `buildRunnerCsp`): eval is allowed
 *   there and nothing else is — no network (`default-src 'none'`), no forms, no framing by
 *   another site;
 * - loaded in `<iframe sandbox="allow-scripts">` with no `allow-same-origin`, so the frame has an
 *   opaque origin: it can't read the session cookie, call the API as the learner, or reach into
 *   this page;
 * - inside it, the code runs in a Worker made from the source we send, so an infinite loop never
 *   blocks the page. A run is killed by removing the frame (which ends its worker).
 *
 * Messages carry a channel name and a run id; anything else, or anything not sent by our own
 * frame, is ignored. `public/runner.html` is the other half of this protocol.
 */

export const RUNNER_CHANNEL = "oyelearn-runner";
export const RUNNER_PATH = "/runner.html";
/** How long the frame may take to load before a run gives up. Not counted in the run's own timeout. */
export const RUNNER_LOAD_TIMEOUT_MS = 10_000;
export const RUNNER_LOAD_ERROR = "The code runner didn't start. Reload the page and try again.";

/** Page → frame. */
export interface RunnerRunMessage {
  channel: typeof RUNNER_CHANNEL;
  type: "run";
  id: string;
  /** The worker's source (plain JavaScript). */
  source: string;
  /** Posted to the worker as its first message. */
  payload: unknown;
}

/** Frame → page. */
export type RunnerFrameMessage =
  | { channel: typeof RUNNER_CHANNEL; type: "ready" }
  | { channel: typeof RUNNER_CHANNEL; type: "worker"; id: string; msg: unknown }
  | { channel: typeof RUNNER_CHANNEL; type: "worker-error"; id: string; message: string };

export function runMessage(id: string, source: string, payload: unknown): RunnerRunMessage {
  return { channel: RUNNER_CHANNEL, type: "run", id, source, payload };
}

/** Reads a message from the frame; null for anything that isn't ours or is malformed. */
export function parseFrameMessage(data: unknown): RunnerFrameMessage | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (d.channel !== RUNNER_CHANNEL) return null;
  if (d.type === "ready") return { channel: RUNNER_CHANNEL, type: "ready" };
  if (typeof d.id !== "string") return null;
  if (d.type === "worker" && "msg" in d) return { channel: RUNNER_CHANNEL, type: "worker", id: d.id, msg: d.msg };
  if (d.type === "worker-error") {
    return { channel: RUNNER_CHANNEL, type: "worker-error", id: d.id, message: typeof d.message === "string" && d.message ? d.message.slice(0, 2000) : "The code couldn't be run." };
  }
  return null;
}

/** The frame as the host sees it. Injected so the protocol can be tested without a browser. */
export interface RunnerFrame {
  /** The frame's window, compared with `MessageEvent.source`. Null until it exists. */
  readonly window: unknown;
  post(message: RunnerRunMessage): void;
  remove(): void;
}

export interface RunnerEnv {
  mountFrame(): RunnerFrame;
  /** Where the frame's messages arrive (the page's `window`). */
  events: Pick<EventTarget, "addEventListener" | "removeEventListener">;
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
  newId(): string;
}

export interface SandboxRunOptions {
  source: string;
  payload: unknown;
  /** The frame is up and the code has been sent: start the run's own clock now. */
  onReady?: () => void;
  onMessage: (msg: unknown) => void;
  /** The worker failed, or the frame never started. The run is over; the host has cleaned up. */
  onError: (message: string) => void;
  loadTimeoutMs?: number;
}

let counter = 0;

function browserEnv(): RunnerEnv {
  return {
    mountFrame() {
      const frame = document.createElement("iframe");
      // allow-scripts only: an opaque origin, no cookies, no same-origin API calls, no top navigation.
      frame.setAttribute("sandbox", "allow-scripts");
      frame.setAttribute("aria-hidden", "true");
      frame.setAttribute("tabindex", "-1");
      frame.title = "Code runner";
      frame.dataset.runner = "";
      frame.style.cssText = "position:absolute;width:0;height:0;border:0;visibility:hidden;";
      frame.src = RUNNER_PATH;
      document.body.appendChild(frame);
      return {
        get window() {
          return frame.contentWindow;
        },
        // The frame's origin is opaque ("null"), so "*" is the only target that reaches it. Nothing
        // secret is sent: the learner's own code and the visible tests.
        post: (message) => frame.contentWindow?.postMessage(message, "*"),
        remove: () => frame.remove(),
      };
    },
    events: window,
    setTimeout: (fn, ms) => window.setTimeout(fn, ms),
    clearTimeout: (handle) => window.clearTimeout(handle as number),
    newId: () => `run-${Date.now().toString(36)}-${(counter++).toString(36)}`,
  };
}

/**
 * Starts one run in a fresh sandboxed frame. Returns `dispose`, which kills the run (removes the
 * frame) and stops listening; call it when the run finishes or times out. Never throws.
 */
export function startSandboxedRun(options: SandboxRunOptions, env: RunnerEnv = browserEnv()): () => void {
  const id = env.newId();
  let frame: RunnerFrame | null = null;
  let disposed = false;
  let started = false;

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    env.clearTimeout(loadTimer);
    env.events.removeEventListener("message", onEvent);
    frame?.remove();
    frame = null;
  };

  const fail = (message: string) => {
    if (disposed) return;
    dispose();
    options.onError(message);
  };

  const onEvent = (event: Event) => {
    if (disposed || !frame) return;
    const { source, data } = event as MessageEvent;
    if (source !== frame.window || source == null) return;
    const msg = parseFrameMessage(data);
    if (!msg) return;
    if (msg.type === "ready") {
      if (started) return;
      started = true;
      env.clearTimeout(loadTimer);
      frame.post(runMessage(id, options.source, options.payload));
      options.onReady?.();
      return;
    }
    if (msg.id !== id) return;
    if (msg.type === "worker") options.onMessage(msg.msg);
    else fail(msg.message);
  };

  env.events.addEventListener("message", onEvent);
  const loadTimer = env.setTimeout(() => fail(RUNNER_LOAD_ERROR), options.loadTimeoutMs ?? RUNNER_LOAD_TIMEOUT_MS);
  try {
    frame = env.mountFrame();
  } catch {
    // Reported asynchronously, like every other outcome, so callers can rely on `dispose` existing.
    env.clearTimeout(loadTimer);
    env.setTimeout(() => fail(RUNNER_LOAD_ERROR), 0);
  }
  return dispose;
}
