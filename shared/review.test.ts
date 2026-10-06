import { describe, expect, test } from "vitest";

import { SESSION_BUDGET_SEC, capByTime, composeSession, estimateCardSeconds, interleave, intervalWords, type SessionCandidate } from "./review";

const card = (id: string, topicId: string | null, due: number, est = 20, source: SessionCandidate["source"] = "topic_point"): SessionCandidate => ({ id, topicId, due, estSeconds: est, source });

describe("estimateCardSeconds", () => {
  test("short text cards are quick, choice cards take longer, and both stay in 8–60 s", () => {
    const short = estimateCardSeconds({ kind: "text", prompt: "Hoisting" }, { answer: "Declarations move up." });
    const choice = estimateCardSeconds({ kind: "choice", prompt: "Which logs 3?", options: ["a", "b", "c", "d"], multi: false }, { answer: "b", explanation: "Because var is function scoped." });
    expect(short).toBeGreaterThanOrEqual(8);
    expect(choice).toBeGreaterThan(short);
    const huge = estimateCardSeconds({ kind: "text", prompt: "word ".repeat(1000) }, { answer: "x" });
    expect(huge).toBe(60);
  });
});

describe("interleave", () => {
  test("never puts two of the same topic side by side while another topic is left", () => {
    const items = ["a1", "a2", "a3", "b1", "b2", "c1"];
    const out = interleave(items, (s) => s[0]);
    expect(out).toHaveLength(6);
    for (let i = 1; i < out.length; i++) expect(out[i][0]).not.toBe(out[i - 1][0]);
    // Each group keeps its own order.
    expect(out.filter((s) => s[0] === "a")).toEqual(["a1", "a2", "a3"]);
  });

  test("a single group comes back unchanged", () => {
    expect(interleave(["x1", "x2"], () => "x")).toEqual(["x1", "x2"]);
    expect(interleave([], () => "x")).toEqual([]);
  });
});

describe("capByTime", () => {
  test("stops before the budget is passed, but always keeps one card", () => {
    expect(capByTime([{ estSeconds: 100 }, { estSeconds: 100 }, { estSeconds: 100 }, { estSeconds: 50 }], 300)).toHaveLength(3);
    expect(capByTime([{ estSeconds: 400 }], 300)).toHaveLength(1);
    expect(capByTime(Array.from({ length: 100 }, () => ({ estSeconds: 1 })), 300, 30)).toHaveLength(30);
  });
});

describe("composeSession", () => {
  const now = 1_000_000;
  const deck = [
    card("late", "t1", now - 5000),
    card("later", "t1", now - 9000),
    card("soon", "t2", now + 1000),
    card("m1", "t3", now + 99_000, 20, "mistake"),
    card("m2", "t3", now - 1, 20, "mistake"),
    { ...card("sus", "t2", now - 99_999), suspended: true },
  ];

  test("due: only due cards, most overdue first, suspended left out", () => {
    expect(composeSession(deck, "due", now).map((c) => c.id)).toEqual(["later", "late", "m2"]);
  });

  test("mistakes: only mistake cards, due ones first", () => {
    expect(composeSession(deck, "mistakes", now).map((c) => c.id)).toEqual(["m2", "m1"]);
  });

  test("mixed: everything the learner has, interleaved across topics, within five minutes", () => {
    const many = Array.from({ length: 60 }, (_, i) => card(`c${i}`, `t${i % 4}`, now - i, 25));
    const out = composeSession(many, "mixed", now);
    expect(out.reduce((s, c) => s + c.estSeconds, 0)).toBeLessThanOrEqual(SESSION_BUDGET_SEC);
    for (let i = 1; i < out.length; i++) expect(out[i].topicId).not.toBe(out[i - 1].topicId);
  });
});

describe("intervalWords", () => {
  test("reads like a person would say it", () => {
    expect(intervalWords(0)).toBe("now");
    expect(intervalWords(10 * 60_000)).toBe("10 min");
    expect(intervalWords(3 * 86_400_000)).toBe("3 days");
    expect(intervalWords(86_400_000)).toBe("1 day");
    expect(intervalWords(400 * 86_400_000)).toBe("1 year");
  });
});
