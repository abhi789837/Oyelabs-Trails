import type { DeferredQueue } from "./deferred";

/**
 * One undoable admin action, start to finish (Phase 8):
 *
 * 1. `apply` changes the screen at once (optimistic).
 * 2. The request waits in the queue for the Undo window, then goes out.
 * 3. Undo inside the window cancels the request and calls `rollback`. Undo after the request went
 *    out calls `reverse` (the opposite endpoint) once the request has finished, then `rollback`.
 *    With no `reverse`, the toast says plainly that it can't be taken back now.
 * 4. A failed request calls `rollback` and shows a plain error toast.
 *
 * The toast functions are injected so the tests can drive this without Sonner.
 */

export interface UndoToasts {
  undo: (message: string, onUndo: () => void) => unknown;
  error: (title: string, body?: string) => unknown;
  info: (message: string) => unknown;
}

export interface UndoableOptions {
  queue: DeferredQueue;
  /** Unique per action; a second action with the same id replaces the first in the queue. */
  id: string;
  /** "Archived 2. Their records are kept." */
  message: string;
  apply: () => void;
  rollback: () => void;
  send: () => Promise<unknown>;
  reverse?: () => Promise<unknown>;
  /** "We couldn't archive them" */
  failTitle: string;
  toasts: UndoToasts;
  describe: (error: unknown) => string;
}

export function runUndoable(o: UndoableOptions): void {
  let inflight: Promise<unknown> | null = null;
  o.apply();
  o.queue.schedule(
    o.id,
    () => {
      inflight = o.send();
      return inflight;
    },
    (error) => {
      o.rollback();
      o.toasts.error(o.failTitle, `${o.describe(error)} Nothing changed.`);
    },
  );
  o.toasts.undo(o.message, () => {
    if (o.queue.cancel(o.id)) {
      o.rollback();
      return;
    }
    if (!o.reverse) {
      o.toasts.info("That was already done, so it can't be undone here.");
      return;
    }
    const reverse = o.reverse;
    void (async () => {
      try {
        await inflight?.catch(() => undefined);
        await reverse();
        o.rollback();
      } catch (error) {
        o.toasts.error("We couldn't undo that", o.describe(error));
      }
    })();
  });
}
