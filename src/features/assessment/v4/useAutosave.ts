import { useCallback, useEffect, useRef, useState } from "react";

import type { ItemResponseV4 } from "@shared/assessmentV4";

import { ApiRequestError } from "@/api/client";

import { clearDraft, readDraft, writeDraft } from "../draftStore";
import { sheetApi } from "./api";
import { ElapsedClock } from "./elapsed";

export const AUTOSAVE_DEBOUNCE_MS = 800;
const RETRY_MS = 3000;
/** Time alone is sent at most this often for the item on screen, so long reads still count. */
const ELAPSED_TICK_MS = 60_000;
/** Below this, time alone is not worth a request; it waits for the next save. */
const ELAPSED_MIN_MS = 1_000;

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * The local safety net (sessionStorage, per item) speaks the legacy draft shape: code stays code, a
 * choice is `selected`, and a task response travels as JSON in `text`.
 */
export function toLocalDraft(response: ItemResponseV4 | null): { code?: string; text?: string; selected?: number[] } {
  if (!response || "unknown" in response) return {};
  if ("code" in response) return { code: response.code };
  if ("choice" in response) return { selected: [response.choice] };
  return { text: JSON.stringify(response.task) };
}

export function fromLocalDraft(itemId: string, type: "coding" | "mcq" | "task"): ItemResponseV4 | null {
  const draft = readDraft(itemId);
  if (!draft) return null;
  try {
    if (type === "coding" && draft.code) return { code: draft.code };
    if (type === "mcq" && draft.selected?.length) return { choice: draft.selected[0] };
    if (type === "task" && draft.text) return { task: JSON.parse(draft.text) };
  } catch {
    // An unreadable local draft is no draft.
  }
  return null;
}

/**
 * Debounced autosave of each item's draft to the server (`PUT …/draft`), with a sessionStorage copy
 * as a safety net. `flush()` saves at once — on navigation, on editor blur, before Finish — and a
 * `pagehide` sends whatever is still pending with `keepalive`.
 *
 * A 409 means the sheet moved on (time up, or the item was submitted elsewhere): `onConflict` lets
 * the screen resync rather than retrying a write the server will keep refusing.
 *
 * v4.1: every save also carries `elapsedMs`, the time actually spent on that item since the last
 * save (`ElapsedClock`; the sheet calls `track` with the item on screen, or null when away).
 */
export function useAutosave(assessmentId: string, onConflict: (message: string) => void) {
  const pending = useRef(new Map<string, ItemResponseV4 | null>());
  const timers = useRef(new Map<string, number>());
  const [status, setStatus] = useState<SaveStatus>("idle");
  const conflictRef = useRef(onConflict);
  conflictRef.current = onConflict;
  const clockRef = useRef<ElapsedClock | null>(null);
  clockRef.current ??= new ElapsedClock();
  const clock = clockRef.current;

  /** The item now on screen with the tab visible and focused, or null. */
  const track = useCallback((itemId: string | null) => clock.focus(itemId, Date.now()), [clock]);

  const save = useCallback(
    async (itemId: string) => {
      const timer = timers.current.get(itemId);
      if (timer !== undefined) window.clearTimeout(timer);
      timers.current.delete(itemId);
      const hasResponse = pending.current.has(itemId);
      const elapsedMs = clock.take(itemId, Date.now());
      if (!hasResponse && elapsedMs < ELAPSED_MIN_MS) {
        clock.give(itemId, elapsedMs);
        return;
      }
      const response = pending.current.get(itemId) ?? null;
      pending.current.delete(itemId);

      if (hasResponse) setStatus("saving");
      try {
        await sheetApi.saveDraft(assessmentId, itemId, {
          ...(hasResponse ? { response } : {}),
          ...(elapsedMs > 0 ? { elapsedMs } : {}),
        });
        if (hasResponse) setStatus(pending.current.size ? "saving" : "saved");
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 409) {
          conflictRef.current(error.message);
          setStatus("idle");
          return;
        }
        clock.give(itemId, elapsedMs);
        if (!hasResponse) return; // Time alone goes with the next save.
        // Keep it unless something newer has been queued since, and try again shortly.
        if (!pending.current.has(itemId)) pending.current.set(itemId, response);
        setStatus("error");
        timers.current.set(
          itemId,
          window.setTimeout(() => void save(itemId), RETRY_MS),
        );
      }
    },
    [assessmentId, clock],
  );

  const queue = useCallback(
    (itemId: string, response: ItemResponseV4 | null) => {
      pending.current.set(itemId, response);
      const local = toLocalDraft(response);
      if (Object.keys(local).length) writeDraft(itemId, local);
      else clearDraft(itemId);
      const timer = timers.current.get(itemId);
      if (timer !== undefined) window.clearTimeout(timer);
      timers.current.set(
        itemId,
        window.setTimeout(() => void save(itemId), AUTOSAVE_DEBOUNCE_MS),
      );
    },
    [save],
  );

  const flush = useCallback(
    async (itemId?: string) => {
      const ids = itemId ? [itemId] : [...new Set([...pending.current.keys(), ...clock.pending(Date.now())])];
      await Promise.all(ids.map((id) => save(id)));
    },
    [save, clock],
  );

  /* A long read with no typing still counts: send the time on its own now and then. */
  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      for (const id of clock.pending(now)) if (clock.peek(id, now) >= ELAPSED_TICK_MS / 2) void save(id);
    }, ELAPSED_TICK_MS);
    return () => window.clearInterval(timer);
  }, [clock, save]);

  /** Drops anything pending for an item that has just been submitted. */
  const forget = useCallback((itemId: string) => {
    pending.current.delete(itemId);
    const timer = timers.current.get(itemId);
    if (timer !== undefined) window.clearTimeout(timer);
    timers.current.delete(itemId);
    clearDraft(itemId);
  }, []);

  useEffect(() => {
    const timerMap = timers.current;
    const onPageHide = () => {
      const now = Date.now();
      const ids = new Set([...pending.current.keys(), ...clock.pending(now)]);
      for (const itemId of ids) {
        const elapsedMs = clock.take(itemId, now);
        const hasResponse = pending.current.has(itemId);
        if (!hasResponse && elapsedMs < ELAPSED_MIN_MS) continue;
        const body = {
          ...(hasResponse ? { response: pending.current.get(itemId) ?? null } : {}),
          ...(elapsedMs > 0 ? { elapsedMs } : {}),
        };
        void fetch(`/api/assessment/${assessmentId}/items/${itemId}/draft`, {
          method: "PUT",
          credentials: "same-origin",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }).catch(() => undefined);
      }
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      for (const id of timerMap.values()) window.clearTimeout(id);
    };
  }, [assessmentId, clock]);

  return { queue, flush, forget, track, status };
}
