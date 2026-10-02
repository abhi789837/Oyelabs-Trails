import { afterEach, describe, expect, it, vi } from "vitest";

import { advance, currentCard, flip, isFinished, loadDeck, markNew, progressLine, submitReview } from "./flashcardSession";

/** A fetch double that answers the two flashcard routes and records every call. */
function mockApi(due: { cards: { termId: string; box: number; dueAt: number }[]; newCount: number }) {
  const calls: { url: string; method: string; body: unknown }[] = [];
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, method, body });
    if (url.startsWith("/api/handbook/flashcards/due")) return new Response(JSON.stringify(due), { status: 200 });
    if (method === "POST" && url.startsWith("/api/handbook/flashcards/")) {
      const next = body.result === "again" ? 1 : body.result === "good" ? 2 : 3;
      return new Response(JSON.stringify({ box: next, dueAt: Date.now() }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: { code: "NOT_FOUND", message: "nope" } }), { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

const DUE = {
  cards: [
    { termId: "sow", box: 2, dueAt: 1 },
    { termId: "warranty", box: 1, dueAt: 2 },
    { termId: "amc", box: 1, dueAt: 100 }, // new: stamped "due now" by the server
  ],
  newCount: 30,
};

describe("markNew", () => {
  it("flags trailing 'due now' box-1 cards as new, up to newCount", () => {
    const cards = [
      { termId: "a", box: 1, dueAt: 5 },
      { termId: "b", box: 3, dueAt: 7 },
      { termId: "c", box: 1, dueAt: 9 },
      { termId: "d", box: 1, dueAt: 9 },
    ];
    expect(markNew(cards, 40).map((c) => c.isNew)).toEqual([false, false, true, true]);
    expect(markNew(cards, 1).map((c) => c.isNew)).toEqual([false, false, false, true]);
    expect(markNew(cards, 0).every((c) => !c.isNew)).toBe(true);
  });
});

describe("flashcard flow", () => {
  it("loads the due deck with the limit and category", async () => {
    const calls = mockApi(DUE);
    const state = await loadDeck({ category: "commercial", limit: 20 });
    expect(calls[0].url).toBe("/api/handbook/flashcards/due?limit=20&category=commercial");
    expect(progressLine(state)).toBe("2 due · 30 new");
    expect(currentCard(state)?.termId).toBe("sow");
    expect(state.flipped).toBe(false);
  });

  it("grades only a flipped card, posts the result, and moves on", async () => {
    const calls = mockApi(DUE);
    let state = await loadDeck();
    expect(advance(state, "good")).toBe(state); // not flipped yet: nothing happens

    state = flip(state);
    expect(state.flipped).toBe(true);
    const res = await submitReview(currentCard(state)!.termId, "good");
    expect(res.box).toBe(2);
    expect(calls.at(-1)).toMatchObject({ url: "/api/handbook/flashcards/sow", method: "POST", body: { result: "good" } });
    state = advance(state, "good");
    expect(currentCard(state)?.termId).toBe("warranty");
    expect(state.flipped).toBe(false);
    expect(progressLine(state)).toBe("1 due · 30 new");
  });

  it("brings an 'again' card back once at the end, and counts new cards down", async () => {
    mockApi(DUE);
    let state = await loadDeck();
    state = advance(flip(state), "easy"); // sow
    state = advance(flip(state), "again"); // warranty -> requeued
    expect(progressLine(state)).toBe("1 due · 30 new");
    state = advance(flip(state), "again"); // amc (new) -> requeued as due
    expect(progressLine(state)).toBe("2 due · 29 new");
    expect(currentCard(state)?.termId).toBe("warranty");
    state = advance(flip(state), "again"); // the repeat is not requeued a second time
    state = advance(flip(state), "good");
    expect(isFinished(state)).toBe(true);
    expect(state.reviewed).toBe(5);
    expect(progressLine(state)).toBe("0 due · 29 new");
    expect(flip(state)).toBe(state);
  });

  it("handles an empty deck", async () => {
    mockApi({ cards: [], newCount: 0 });
    const state = await loadDeck();
    expect(isFinished(state)).toBe(true);
    expect(currentCard(state)).toBeNull();
    expect(progressLine(state)).toBe("0 due · 0 new");
  });

  it("surfaces a failed review as an error, leaving the card in place", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { code: "NOT_FOUND", message: "Unknown term" } }), { status: 404 })));
    await expect(submitReview("gone", "good")).rejects.toThrow("Unknown term");
  });
});
