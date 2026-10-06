import { describe, expect, test } from "vitest";

import type { FirstStep, ReviewItem } from "@shared/assessmentResults";
import type { MissingLinkView } from "@shared/assessmentV4";

import {
  answeredCount,
  filterEntries,
  finishLines,
  navCounts,
  navEntries,
  navLabel,
  navSummary,
  nextUnanswered,
  proctorWords,
  saveLine,
  uniqueNotices,
  warningConsequence,
  warningsLine,
} from "./navigator";
import { answerWords, becauseOfLink, buildStory, listWords, nothingScored, plainReason, plainReasonSentence, reviewCounts } from "./story";

const items = [
  { id: "a", state: "unanswered" as const, flagged: false },
  { id: "b", state: "answered" as const, flagged: true },
  { id: "c", state: "unanswered" as const, flagged: false },
  { id: "d", state: "submitted" as const, flagged: false },
  { id: "e", state: "unanswered" as const, flagged: true },
];

describe("navigator", () => {
  // The local (maybe unsaved) answer wins over the server's state; "I don't know yet" is its own state.
  const responses = { a: { choice: 1 }, c: { unknown: true as const }, e: null };
  const entries = navEntries(items, responses);

  test("states from the local answer, numbered from 1", () => {
    expect(entries.map((e) => [e.number, e.state, e.flagged])).toEqual([
      [1, "answered", false],
      [2, "unanswered", true],
      [3, "unknown", false],
      [4, "submitted", false],
      [5, "unanswered", true],
    ]);
  });

  test("labels name the state and the flag; the e2e relies on the 'Question N:' prefix", () => {
    expect(navLabel(entries[1])).toBe("Question 2: not answered, flagged");
    expect(navLabel(entries[3])).toBe("Question 4: handed in");
    expect(navLabel(entries[2])).toBe("Question 3: don't know yet");
  });

  test("counts and the summary line", () => {
    const counts = navCounts(entries);
    expect(counts).toEqual({ answered: 1, unknown: 1, unanswered: 2, submitted: 1, flagged: 2 });
    expect(answeredCount(counts)).toBe(2);
    expect(navSummary(counts, 5)).toBe("2 of 5 answered · 2 flagged · 1 don't know yet");
    expect(navSummary(navCounts([]), 0)).toBe("0 of 0 answered");
  });

  test("filters", () => {
    expect(filterEntries(entries, "flagged").map((e) => e.id)).toEqual(["b", "e"]);
    expect(filterEntries(entries, "unanswered").map((e) => e.id)).toEqual(["b", "e"]);
    expect(filterEntries(entries, "all")).toHaveLength(5);
  });

  test("next not answered wraps round, null when everything has an answer", () => {
    expect(nextUnanswered(entries, 0)).toBe(1);
    expect(nextUnanswered(entries, 1)).toBe(4);
    expect(nextUnanswered(entries, 4)).toBe(1);
    expect(nextUnanswered(navEntries([items[1]], { b: { choice: 0 } }), 0)).toBeNull();
  });

  test("finish lines say what's open, plainly", () => {
    expect(finishLines(navCounts(entries))).toEqual([
      "2 questions have no answer yet.",
      "2 are flagged to come back to.",
      `1 marked "I don't know yet". That's fine: it costs nothing.`,
    ]);
    expect(finishLines({ answered: 3, unknown: 0, unanswered: 0, submitted: 0, flagged: 0 })).toEqual(["Every question has an answer."]);
    expect(finishLines({ answered: 0, unknown: 0, unanswered: 1, submitted: 0, flagged: 1 })).toEqual(["1 question has no answer yet.", "1 is flagged to come back to."]);
  });
});

describe("autosave and proctoring words", () => {
  test("the autosave line", () => {
    expect(saveLine("idle", false)).toEqual({ text: "Answers save as you go", tone: "quiet" });
    expect(saveLine("saving", true).text).toBe("Saving…");
    expect(saveLine("saved", false)).toEqual({ text: "All answers saved", tone: "ok" });
    expect(saveLine("idle", true).text).toBe("All answers saved");
    expect(saveLine("error", true)).toEqual({ text: "Not saved yet, trying again", tone: "warn" });
  });

  test("plain proctoring words, never 'detected' or 'violation'", () => {
    const ok = proctorWords({ cameraLive: true, visible: true, fullscreen: true });
    expect(ok.map((w) => w.text)).toEqual(["Camera on", "Stay on this tab", "Full screen on"]);
    expect(ok.every((w) => w.ok)).toBe(true);
    const off = proctorWords({ cameraLive: false, visible: false, fullscreen: false });
    expect(off.map((w) => w.text)).toEqual(["Turn your camera back on", "Stay on this tab", "Go back to full screen"]);
    expect(off.some((w) => w.ok)).toBe(false);
    const all = [...ok, ...off].map((w) => w.text).join(" ") + warningConsequence(1, 3, false) + warningConsequence(3, 3, true);
    expect(all).not.toMatch(/detect|violation|cheat|suspicious|flagged/i);
  });

  test("warnings", () => {
    expect(warningsLine(0, 3)).toBe("No warnings");
    expect(warningsLine(2, 3)).toBe("2 of 3 warnings");
    expect(warningConsequence(1, 3, false)).toBe("2 more of these end the test.");
    expect(warningConsequence(2, 3, false)).toBe("One more of these ends the test.");
    expect(warningConsequence(3, 3, true)).toMatch(/^The test has ended/);
  });
});

describe("results story", () => {
  const link = (skillName: string, mastery: number | null, neededLevel: number, forGoal: string, blocks: string[] = []): MissingLinkView => ({ skillId: skillName.toLowerCase(), skillName, mastery, neededLevel, forGoal, blocks });
  const step = (title: string, reason: string): FirstStep => ({ title, reason, href: null });

  test("list words", () => {
    expect(listWords([])).toBe("");
    expect(listWords(["Git"])).toBe("Git");
    expect(listWords(["Git", "HTML"])).toBe("Git and HTML");
    expect(listWords(["Git", "HTML", "CSS"])).toBe("Git, HTML and CSS");
  });

  test("strong + start + because from a missing link that names the start", () => {
    const story = buildStory({
      strengths: ["HTML", "CSS", "Git"],
      focusFirst: ["Async JavaScript"],
      mastery: [],
      missingLinks: [link("Async JavaScript", 1, 3, "Backend", ["Node.js"])],
      firstSteps: [step("Async JavaScript", "A Must know for Backend.")],
    });
    expect(story.strong).toEqual(["HTML", "CSS"]);
    expect(story.sentences).toEqual(["You're strong at HTML and CSS.", "We'll start with Async JavaScript because Backend needs it at level 3, and you're at 1 now."]);
  });

  test("falls back to the path step's own reason, lower-cased and without its full stop", () => {
    const story = buildStory({ strengths: ["Git"], focusFirst: [], mastery: [], missingLinks: [link("SQL", 0, 3, "Backend")], firstSteps: [step("Node.js basics", "It comes before Express.")] });
    expect(story.sentences[1]).toBe("We'll start with Node.js basics because it comes before Express.");
  });

  test("no strengths: uses measured mastery ≥ 3; no path: focus first", () => {
    const story = buildStory({
      strengths: [],
      focusFirst: ["Writing at work"],
      mastery: [
        { skillId: "a", skillName: "React", level: 4, source: "measured" },
        { skillId: "b", skillName: "JS", level: 3, source: "inferred" },
        { skillId: "c", skillName: "CSS", level: 3, source: "measured" },
        { skillId: "d", skillName: "SQL", level: 1, source: "measured" },
      ],
      missingLinks: [],
      firstSteps: [],
    });
    expect(story.sentences).toEqual(["You're strong at React and CSS.", "We'll start with Writing at work because it matters most for your goals."]);
  });

  test("nothing to go on still reads kindly", () => {
    const story = buildStory({ strengths: [], focusFirst: [], mastery: [], missingLinks: [], firstSteps: [] });
    expect(story.sentences).toEqual(["You've made a solid start.", "Your plan builds on what you already know."]);
    expect(story.start).toBeNull();
  });

  test("nothing scored opens with the first step, not a solid start (UX review A6)", () => {
    const story = buildStory({ strengths: [], focusFirst: [], mastery: [], missingLinks: [], firstSteps: [], nothingScored: true });
    expect(story.sentences[0]).toBe("You've taken the first step.");
    const item = (verdict: ReviewItem["verdict"]) => ({ verdict }) as ReviewItem;
    expect(nothingScored({ items: [item("not_yet"), item("not_yet")], result: null })).toBe(true);
    expect(nothingScored({ items: [item("not_yet"), item("waiting")], result: null })).toBe(false);
    expect(nothingScored({ items: [item("full")], result: null })).toBe(false);
    expect(nothingScored({ items: [], result: null })).toBe(false);
  });

  test("the path's staff wording reads as plain words (Phase 9.2)", () => {
    expect(plainReason("Critical goal JavaScript fundamentals: you're at 0/5 and it needs 3/5.")).toBe("your JavaScript fundamentals goal needs level 3, and you're at level 0 now");
    expect(plainReason("High goal Git: you're at not measured yet and it needs 2/5.")).toBe("your Git goal needs level 2, and we haven't measured yours yet");
    expect(plainReasonSentence("Before Stand-ups because Stand-ups needs Spoken English, which you're missing (0/5; it needs 3/5).")).toBe(
      "Stand-ups needs Spoken English first. It needs level 3, and you're at level 0 now.",
    );
    expect(plainReason("Moved up: Backend needs SQL first.")).toBe("Backend needs SQL first");
    expect(plainReasonSentence("Next for your Stand-ups goal, after Spoken English.")).toBe("It comes next for your Stand-ups goal, after Spoken English.");
    const story = buildStory({ strengths: [], focusFirst: [], mastery: [], missingLinks: [], firstSteps: [step("JavaScript Core", "Critical goal JavaScript fundamentals: you're at 0/5 and it needs 3/5.")] });
    expect(story.sentences[1]).toBe("We'll start with JavaScript Core because your JavaScript fundamentals goal needs level 3, and you're at level 0 now.");
  });

  test("an unmeasured missing link counts as 0; no goal name falls back to what it blocks", () => {
    expect(becauseOfLink(link("Async JS", null, 3, "", ["Express"]))).toBe("Express needs it at level 3, and you're at 0 now");
    expect(becauseOfLink(link("Async JS", 2, 4, "", []))).toBe("you need it at level 4, and you're at 2 now");
  });
});

describe("answers list", () => {
  const base: ReviewItem = {
    id: "i",
    number: 1,
    skillName: "Git",
    type: "mcq",
    kindLabel: "Multiple choice",
    prompt: "?",
    options: ["a", "b"],
    chosen: 1,
    correct: 0,
    answerText: null,
    recorded: false,
    unknown: false,
    unanswered: false,
    verdict: "not_yet",
    explanation: null,
    tip: null,
    reviewStatus: null,
    canRequestReview: true,
  };
  test("answer words and counts", () => {
    expect(answerWords(base)).toBe("b");
    expect(answerWords({ ...base, unknown: true })).toBe(`You said "I don't know yet".`);
    expect(answerWords({ ...base, options: null, chosen: null, recorded: true })).toBe("You recorded a spoken answer.");
    expect(answerWords({ ...base, options: null, chosen: null, answerText: "hello" })).toBe("hello");
    expect(reviewCounts([base, { ...base, verdict: "full" }, { ...base, verdict: "waiting" }])).toEqual({ full: 1, notYet: 1, waiting: 1 });
  });
});

test("soft notices show once per reason, and closing one closes its copies", () => {
  const out = uniqueNotices([
    { id: 1, reason: "developer tools may be open" },
    { id: 2, reason: "you switched windows" },
    { id: 3, reason: "developer tools may be open" },
  ]);
  expect(out.map((n) => n.warning.id)).toEqual([2, 3]);
  expect(out[1].ids).toEqual([1, 3]);
  expect(uniqueNotices([])).toEqual([]);
});
