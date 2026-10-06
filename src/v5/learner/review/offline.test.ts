import { describe, expect, it } from "vitest";

import { ApiRequestError } from "@/api/client";
import type { ReviewCardView, ReviewSession } from "@shared/review";

import { SESSION_MAX_AGE_MS, enqueue, isOfflineError, queueKey, sessionKey, usableSession, withoutCard, type SavedSession } from "./offline";

const card = (id: string, estSeconds = 10): ReviewCardView => ({
  id,
  source: "mistake",
  topicId: null,
  topicTitle: null,
  front: { kind: "text", prompt: id },
  back: { answer: "a" },
  state: "review",
  due: 0,
  estSeconds,
  intervals: { "1": "1 min", "2": "5 min", "3": "1 day", "4": "3 days" },
});
const session = (ids: string[]): ReviewSession => ({ id: "s1", kind: "due", cards: ids.map((i) => card(i)), estSeconds: ids.length * 10, available: ids.length, generatedAt: 0 });
const saved = (ids: string[], userId = "u1", savedAt = 1000): SavedSession => ({ userId, savedAt, session: session(ids) });

describe("offline review rules", () => {
  it("keys data per user", () => {
    expect(sessionKey("u1")).not.toBe(sessionKey("u2"));
    expect(queueKey("u1")).toContain("u1");
  });

  it("drops a rated card and its time from the saved session", () => {
    const next = withoutCard(saved(["a", "b", "c"]), "b");
    expect(next.session.cards.map((c) => c.id)).toEqual(["a", "c"]);
    expect(next.session.estSeconds).toBe(20);
  });

  it("offers a saved session only to its own user, while fresh and not empty", () => {
    expect(usableSession(saved(["a"]), "u1", 2000)).not.toBeNull();
    expect(usableSession(saved(["a"]), "u2", 2000)).toBeNull();
    expect(usableSession(saved(["a"]), "u1", 1000 + SESSION_MAX_AGE_MS + 1)).toBeNull();
    expect(usableSession(saved([]), "u1", 2000)).toBeNull();
    expect(usableSession(null, "u1", 2000)).toBeNull();
  });

  it("queues ratings in order; a re-rating replaces the earlier one", () => {
    let q = enqueue([], { cardId: "a", rating: 3, sessionId: "s", at: 1 });
    q = enqueue(q, { cardId: "b", rating: 1, sessionId: "s", at: 2 });
    q = enqueue(q, { cardId: "a", rating: 4, sessionId: "s", at: 3 });
    expect(q.map((x) => `${x.cardId}${x.rating}`)).toEqual(["b1", "a4"]);
  });

  it("treats only a failed connection as offline", () => {
    expect(isOfflineError(new ApiRequestError(0, "INTERNAL", "Could not reach the server."))).toBe(true);
    expect(isOfflineError(new ApiRequestError(404, "NOT_FOUND", "Not found."))).toBe(false);
    expect(isOfflineError(new Error("x"))).toBe(false);
  });
});
