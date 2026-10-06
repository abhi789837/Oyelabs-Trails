import { useCallback, useEffect, useRef } from "react";

import type { LessonStatePut, LessonStatePutResponse } from "@shared/lesson";

import { lessonApi, saveOnExit } from "./api";

/** How long position updates wait before they're saved (step changes save at once). */
export const POSITION_SAVE_MS = 4000;

/**
 * Autosave for `lesson_state`. Step and "done" changes go out at once; the video position is
 * batched (every few seconds at most) and sent one last time with `keepalive` when the page hides,
 * so resuming on another device lands within seconds of where the learner stopped.
 */
export function useLessonSave(topicId: string, onSaved: (res: LessonStatePutResponse) => void) {
  const pending = useRef<LessonStatePut>({});
  const timer = useRef<number | null>(null);
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  const flush = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    const body = pending.current;
    pending.current = {};
    if (Object.keys(body).length === 0) return Promise.resolve(null);
    return lessonApi
      .save(topicId, body)
      .then((res) => {
        onSavedRef.current(res);
        return res;
      })
      .catch(() => null);
  }, [topicId]);

  /**
   * Queue a change. `now` sends it straight away (with anything already queued) and resolves with
   * the server's answer, or null when it didn't save (so an optimistic step can roll back).
   */
  const save = useCallback(
    (patch: LessonStatePut, now = false): Promise<LessonStatePutResponse | null> => {
      pending.current = {
        ...pending.current,
        ...patch,
        ...(patch.stepDone || pending.current.stepDone ? { stepDone: { ...pending.current.stepDone, ...patch.stepDone } } : {}),
      };
      if (now) return flush();
      if (timer.current === null) timer.current = window.setTimeout(() => void flush(), POSITION_SAVE_MS);
      return Promise.resolve(null);
    },
    [flush],
  );

  useEffect(() => {
    const onHide = () => {
      const body = pending.current;
      if (Object.keys(body).length === 0) return;
      pending.current = {};
      saveOnExit(topicId, body);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") onHide();
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
      if (timer.current !== null) window.clearTimeout(timer.current);
      // Leaving the lesson inside the app: send what's left.
      onHide();
    };
  }, [topicId]);

  return { save, flush };
}
