import { useEffect, useState } from "react";

import { api, ApiRequestError } from "@/api/client";
import type { RateResponse, ReviewSession } from "@shared/review";

/**
 * Offline Review (Phase 8, app-wide group; docs/v5/DECISIONS.md "Phase 8 — app-wide").
 *
 * - The last review session fetched online is kept in IndexedDB, per user id, so /learn/review can
 *   run it without a connection (the payload is self-contained: fronts, backs, interval labels).
 * - Ratings made offline go into a queue (also per user) and are sent, in order, when the browser
 *   is back online. The server schedules them at the moment they arrive.
 * - Signing out deletes the whole database (the service worker does it on POST /api/auth/logout),
 *   and data saved under another user id is never read.
 */

const DB_NAME = "oyelearn-offline";
const STORE = "kv";
/** A saved session older than this isn't offered offline: its schedule has moved on too far. */
export const SESSION_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;

export interface QueuedRating {
  cardId: string;
  rating: 1 | 2 | 3 | 4;
  sessionId: string;
  at: number;
}

export interface SavedSession {
  userId: string;
  savedAt: number;
  session: ReviewSession;
}

// ---------------------------------------------------------------------------
// Pure rules (tested)
// ---------------------------------------------------------------------------

export const sessionKey = (userId: string) => `review-session:${userId}`;
export const queueKey = (userId: string) => `review-queue:${userId}`;

/** The saved session without the cards already rated (so a restart never shows them twice). */
export function withoutCard(saved: SavedSession, cardId: string): SavedSession {
  const cards = saved.session.cards.filter((c) => c.id !== cardId);
  return { ...saved, session: { ...saved.session, cards, estSeconds: cards.reduce((n, c) => n + c.estSeconds, 0) } };
}

/** A saved session that can still be offered to this user now, or null. */
export function usableSession(saved: SavedSession | null | undefined, userId: string, now: number): SavedSession | null {
  if (!saved || saved.userId !== userId) return null;
  if (now - saved.savedAt > SESSION_MAX_AGE_MS) return null;
  if (!saved.session.cards.length) return null;
  return saved;
}

/** Adds a rating; a later rating of the same card replaces the earlier one. */
export function enqueue(queue: readonly QueuedRating[], item: QueuedRating): QueuedRating[] {
  return [...queue.filter((q) => q.cardId !== item.cardId), item];
}

/** True when an error means "no connection", so the rating should wait in the queue. */
export function isOfflineError(error: unknown): boolean {
  return error instanceof ApiRequestError && error.status === 0;
}

// ---------------------------------------------------------------------------
// IndexedDB (opened and closed per call, so sign-out can always delete the database)
// ---------------------------------------------------------------------------

function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(undefined);
    let open: IDBOpenDBRequest;
    try {
      open = indexedDB.open(DB_NAME, 1);
    } catch {
      return resolve(undefined);
    }
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains(STORE)) open.result.createObjectStore(STORE);
    };
    open.onerror = () => resolve(undefined);
    open.onblocked = () => resolve(undefined);
    open.onsuccess = () => {
      const db = open.result;
      let result: T | undefined;
      try {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        if (req) req.onsuccess = () => (result = req.result);
        tx.oncomplete = () => {
          db.close();
          resolve(result);
        };
        tx.onerror = tx.onabort = () => {
          db.close();
          resolve(undefined);
        };
      } catch {
        db.close();
        resolve(undefined);
      }
    };
  });
}

const idbGet = <T>(key: string) => withStore<T>("readonly", (s) => s.get(key) as IDBRequest<T>);
const idbSet = (key: string, value: unknown) => withStore("readwrite", (s) => void s.put(value, key));

export async function loadSavedSession(userId: string): Promise<SavedSession | null> {
  return usableSession(await idbGet<SavedSession>(sessionKey(userId)), userId, Date.now());
}

export async function saveSession(userId: string, session: ReviewSession): Promise<void> {
  if (!session.cards.length) return;
  await idbSet(sessionKey(userId), { userId, savedAt: Date.now(), session } satisfies SavedSession);
}

/** Drops a rated card from the saved copy (whether it was rated online or offline). */
export async function forgetCard(userId: string, cardId: string): Promise<void> {
  const saved = await idbGet<SavedSession>(sessionKey(userId));
  if (!saved || saved.userId !== userId) return;
  await idbSet(sessionKey(userId), withoutCard(saved, cardId));
}

export async function loadQueue(userId: string): Promise<QueuedRating[]> {
  return (await idbGet<QueuedRating[]>(queueKey(userId))) ?? [];
}

async function saveQueue(userId: string, queue: QueuedRating[]): Promise<void> {
  await idbSet(queueKey(userId), queue);
}

// ---------------------------------------------------------------------------
// Rating and syncing
// ---------------------------------------------------------------------------

export type RateOutcome = { queued: false; response: RateResponse } | { queued: true };

const queueListeners = new Set<() => void>();
const changed = () => queueListeners.forEach((l) => l());

/** Rates online when possible; otherwise (or when the request can't reach the server) queues it. */
export async function rateOrQueue(userId: string, cardId: string, rating: 1 | 2 | 3 | 4, sessionId: string): Promise<RateOutcome> {
  if (typeof navigator !== "undefined" && navigator.onLine !== false) {
    try {
      const response = await api.post<RateResponse>(`/api/v5/review/cards/${encodeURIComponent(cardId)}/rate`, { rating, sessionId });
      void forgetCard(userId, cardId);
      return { queued: false, response };
    } catch (error) {
      if (!isOfflineError(error)) throw error;
    }
  }
  await saveQueue(userId, enqueue(await loadQueue(userId), { cardId, rating, sessionId, at: Date.now() }));
  await forgetCard(userId, cardId);
  changed();
  return { queued: true };
}

let flushing: Promise<number> | null = null;

/**
 * Sends queued ratings in order. Stops at the first network failure (they wait for the next try);
 * a rating the server refuses (the card is gone) is dropped. Returns how many were saved.
 */
export function flushQueue(userId: string): Promise<number> {
  if (flushing) return flushing;
  flushing = (async () => {
    let sent = 0;
    let queue = await loadQueue(userId);
    while (queue.length) {
      const [head, ...rest] = queue;
      try {
        await api.post<RateResponse>(`/api/v5/review/cards/${encodeURIComponent(head.cardId)}/rate`, { rating: head.rating, sessionId: head.sessionId });
        sent += 1;
      } catch (error) {
        if (isOfflineError(error)) break;
        if (error instanceof ApiRequestError && error.isUnauthenticated) break;
      }
      queue = rest;
      await saveQueue(userId, queue);
      changed();
    }
    return sent;
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

/** The browser's online flag, live. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine !== false));
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

/** How many ratings are waiting to sync for this user; re-read when the queue changes. */
export function usePendingCount(userId: string | null): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    const read = () => void loadQueue(userId).then((q) => alive && setCount(q.length));
    read();
    queueListeners.add(read);
    return () => {
      alive = false;
      queueListeners.delete(read);
    };
  }, [userId]);
  return count;
}
