import { describe, expect, test, vi } from "vitest";

import {
  RUNNER_CHANNEL,
  RUNNER_LOAD_ERROR,
  parseFrameMessage,
  runMessage,
  startSandboxedRun,
  type RunnerEnv,
  type RunnerRunMessage,
} from "./sandboxRunner";

/** A fake page: an EventTarget for `message` events, a frame that records what it was sent, manual timers. */
function fakeEnv() {
  const events = new EventTarget();
  const frameWindow = { name: "runner-frame" };
  const sent: RunnerRunMessage[] = [];
  const timers = new Map<number, () => void>();
  let nextTimer = 1;
  let removed = 0;
  let mounted = 0;
  const env: RunnerEnv = {
    mountFrame: () => {
      mounted++;
      return { window: frameWindow, post: (m) => sent.push(m), remove: () => void removed++ };
    },
    events,
    setTimeout: (fn) => {
      const id = nextTimer++;
      timers.set(id, fn);
      return id;
    },
    clearTimeout: (id) => void timers.delete(id as number),
    newId: () => "run-1",
  };
  const deliver = (data: unknown, source: unknown = frameWindow) => {
    const event = new Event("message");
    Object.assign(event, { data, source });
    events.dispatchEvent(event);
  };
  return {
    env,
    sent,
    deliver,
    fireTimers: () => [...timers.values()].forEach((fn) => fn()),
    pendingTimers: () => timers.size,
    get removed() {
      return removed;
    },
    get mounted() {
      return mounted;
    },
  };
}

const msg = (m: Record<string, unknown>) => ({ channel: RUNNER_CHANNEL, ...m });

describe("parseFrameMessage", () => {
  test("accepts the three frame messages", () => {
    expect(parseFrameMessage(msg({ type: "ready" }))).toEqual({ channel: RUNNER_CHANNEL, type: "ready" });
    expect(parseFrameMessage(msg({ type: "worker", id: "a", msg: { type: "done" } }))).toMatchObject({ type: "worker", id: "a", msg: { type: "done" } });
    expect(parseFrameMessage(msg({ type: "worker-error", id: "a", message: "boom" }))).toMatchObject({ type: "worker-error", message: "boom" });
  });

  test("ignores other channels, missing ids and junk", () => {
    expect(parseFrameMessage({ type: "ready" })).toBeNull();
    expect(parseFrameMessage({ channel: "other", type: "ready" })).toBeNull();
    expect(parseFrameMessage(msg({ type: "worker", msg: 1 }))).toBeNull();
    expect(parseFrameMessage(msg({ type: "worker", id: "a" }))).toBeNull();
    expect(parseFrameMessage(msg({ type: "run", id: "a" }))).toBeNull();
    expect(parseFrameMessage(null)).toBeNull();
    expect(parseFrameMessage("ready")).toBeNull();
  });

  test("a worker error always has a readable, bounded message", () => {
    expect(parseFrameMessage(msg({ type: "worker-error", id: "a" }))).toMatchObject({ message: "The code couldn't be run." });
    const long = parseFrameMessage(msg({ type: "worker-error", id: "a", message: "x".repeat(5000) }));
    expect(long && "message" in long ? long.message.length : 0).toBe(2000);
  });

  test("runMessage carries the channel, id, worker source and payload", () => {
    expect(runMessage("r", "src", { mode: "snippet" })).toEqual({ channel: RUNNER_CHANNEL, type: "run", id: "r", source: "src", payload: { mode: "snippet" } });
  });
});

describe("startSandboxedRun", () => {
  test("waits for ready, then sends the run once and relays the worker's messages", () => {
    const f = fakeEnv();
    const onReady = vi.fn();
    const onMessage = vi.fn();
    const onError = vi.fn();
    startSandboxedRun({ source: "SRC", payload: { mode: "tests" }, onReady, onMessage, onError }, f.env);
    expect(f.mounted).toBe(1);
    expect(f.sent).toEqual([]);

    f.deliver(msg({ type: "ready" }));
    f.deliver(msg({ type: "ready" }));
    expect(f.sent).toEqual([runMessage("run-1", "SRC", { mode: "tests" })]);
    expect(onReady).toHaveBeenCalledTimes(1);
    // The load timer is cleared once the frame is up.
    expect(f.pendingTimers()).toBe(0);

    f.deliver(msg({ type: "worker", id: "run-1", msg: { type: "log", text: "hi" } }));
    expect(onMessage).toHaveBeenCalledWith({ type: "log", text: "hi" });
    expect(onError).not.toHaveBeenCalled();
  });

  test("ignores messages from any other window, and for another run", () => {
    const f = fakeEnv();
    const onMessage = vi.fn();
    const onReady = vi.fn();
    startSandboxedRun({ source: "S", payload: null, onReady, onMessage, onError: vi.fn() }, f.env);
    f.deliver(msg({ type: "ready" }), { name: "someone-else" });
    f.deliver(msg({ type: "ready" }), null);
    expect(onReady).not.toHaveBeenCalled();
    f.deliver(msg({ type: "ready" }));
    f.deliver(msg({ type: "worker", id: "run-2", msg: { type: "done" } }));
    f.deliver(msg({ type: "worker", id: "run-1", msg: { type: "done" } }), { name: "someone-else" });
    expect(onMessage).not.toHaveBeenCalled();
  });

  test("a worker error ends the run and removes the frame", () => {
    const f = fakeEnv();
    const onError = vi.fn();
    const onMessage = vi.fn();
    startSandboxedRun({ source: "S", payload: null, onMessage, onError }, f.env);
    f.deliver(msg({ type: "ready" }));
    f.deliver(msg({ type: "worker-error", id: "run-1", message: "EvalError: nope" }));
    expect(onError).toHaveBeenCalledWith("EvalError: nope");
    expect(f.removed).toBe(1);
    // Nothing after the end is delivered.
    f.deliver(msg({ type: "worker", id: "run-1", msg: { type: "done" } }));
    expect(onMessage).not.toHaveBeenCalled();
  });

  test("a frame that never loads fails with a plain message", () => {
    const f = fakeEnv();
    const onError = vi.fn();
    startSandboxedRun({ source: "S", payload: null, onMessage: vi.fn(), onError }, f.env);
    f.fireTimers();
    expect(onError).toHaveBeenCalledWith(RUNNER_LOAD_ERROR);
    expect(f.removed).toBe(1);
  });

  test("dispose kills the run: frame removed, no more messages, idempotent", () => {
    const f = fakeEnv();
    const onMessage = vi.fn();
    const onError = vi.fn();
    const dispose = startSandboxedRun({ source: "S", payload: null, onMessage, onError }, f.env);
    f.deliver(msg({ type: "ready" }));
    dispose();
    dispose();
    expect(f.removed).toBe(1);
    f.deliver(msg({ type: "worker", id: "run-1", msg: { type: "done" } }));
    expect(onMessage).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  test("a frame that can't be created is reported asynchronously, not thrown", () => {
    const f = fakeEnv();
    f.env.mountFrame = () => {
      throw new Error("no document");
    };
    const onError = vi.fn();
    expect(() => startSandboxedRun({ source: "S", payload: null, onMessage: vi.fn(), onError }, f.env)).not.toThrow();
    expect(onError).not.toHaveBeenCalled();
    f.fireTimers();
    expect(onError).toHaveBeenCalledWith(RUNNER_LOAD_ERROR);
  });
});
