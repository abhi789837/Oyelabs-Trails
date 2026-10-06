/**
 * "Do it in a moment, unless they press Undo." The admin's reversible actions (mark as checked,
 * send a reminder, mark a problem fixed) leave the screen at once, and the request goes out when
 * the Undo window closes. Undo just cancels the timer, so nothing has to be taken back on the
 * server. Leaving the page sends whatever is still waiting (`flush`).
 *
 * Pure apart from the timer functions, which are injected so the tests drive the clock.
 */

export interface DeferredQueue {
  /** Runs `run` after the delay unless cancelled. A second schedule for the same id replaces the first. */
  schedule(id: string, run: () => Promise<unknown> | unknown, onError?: (error: unknown) => void): void;
  /** Undo: true when it was still waiting. */
  cancel(id: string): boolean;
  /** Sends everything still waiting, now. */
  flush(): Promise<void>;
  pending(): string[];
}

export interface TimerFns {
  set: (fn: () => void, ms: number) => unknown;
  clear: (handle: unknown) => void;
}

const realTimers: TimerFns = {
  set: (fn, ms) => setTimeout(fn, ms),
  clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export function createDeferredQueue(delayMs: number, timers: TimerFns = realTimers): DeferredQueue {
  const waiting = new Map<string, { handle: unknown; run: () => Promise<unknown> | unknown; onError?: (error: unknown) => void }>();

  const fire = async (id: string) => {
    const job = waiting.get(id);
    if (!job) return;
    waiting.delete(id);
    try {
      await job.run();
    } catch (error) {
      job.onError?.(error);
    }
  };

  return {
    schedule(id, run, onError) {
      const prev = waiting.get(id);
      if (prev) timers.clear(prev.handle);
      const handle = timers.set(() => void fire(id), delayMs);
      waiting.set(id, { handle, run, onError });
    },
    cancel(id) {
      const job = waiting.get(id);
      if (!job) return false;
      timers.clear(job.handle);
      waiting.delete(id);
      return true;
    },
    async flush() {
      const ids = [...waiting.keys()];
      for (const id of ids) timers.clear(waiting.get(id)!.handle);
      await Promise.all(ids.map((id) => fire(id)));
    },
    pending() {
      return [...waiting.keys()];
    },
  };
}
