import type { ReactNode } from "react";
import { toast as sonner } from "sonner";

/**
 * Transient feedback, in one place.
 *
 * The rule this wrapper exists to enforce: a toast is for something that *happened*, briefly. A
 * question goes to `useConfirm`, an error a person has to act on belongs on the page next to the
 * thing that failed (`FormAlert`), and anything that must survive a reload is not a toast at all.
 */

export interface NotifyOptions {
  description?: ReactNode;
  /** Milliseconds. Defaults come from `<AppToaster>`; errors already linger longer. */
  duration?: number;
  /** Pass a stable id to replace an earlier toast instead of stacking another one. */
  id?: string | number;
  action?: { label: string; onClick: () => void };
}

export interface UndoOptions extends Omit<NotifyOptions, "action"> {
  onUndo: () => void;
  label?: string;
}

export const notify = {
  success(message: string, options?: NotifyOptions) {
    return sonner.success(message, options);
  },

  error(message: string, options?: NotifyOptions) {
    // Failures get longer on screen than successes: there is something to read and decide about.
    return sonner.error(message, { duration: 8000, ...options });
  },

  info(message: string, options?: NotifyOptions) {
    return sonner.info(message, options);
  },

  /**
   * A change that can genuinely be put back. Only use it when `onUndo` really restores the previous
   * state — an Undo that half-works is worse than no Undo, so a delete with no restore path gets a
   * confirmation up front instead of this.
   */
  undo(message: string, { onUndo, label = "Undo", duration = 10_000, ...rest }: UndoOptions) {
    return sonner.success(message, { ...rest, duration, action: { label, onClick: onUndo } });
  },

  /** An async save, narrated in one toast: spinner while it runs, then the outcome. */
  promise<T>(
    work: Promise<T>,
    messages: {
      loading: string;
      success: string | ((value: T) => string);
      error: string | ((error: unknown) => string);
    },
  ) {
    return sonner.promise(work, messages);
  },

  dismiss(id?: string | number) {
    sonner.dismiss(id);
  },
};
