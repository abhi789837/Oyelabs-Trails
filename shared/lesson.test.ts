import { describe, expect, test } from "vitest";

import {
  availableSteps,
  calloutOf,
  canOpenStep,
  capLeft,
  codeHints,
  countToday,
  dayStartUtc,
  extractTakeaways,
  glossaryPhrases,
  lessonComplete,
  lessonPassages,
  matchGlossary,
  mergeDone,
  minutesLeft,
  parseCap,
  passageChunks,
  previewDocument,
  readingMinutes,
  resumeStep,
  runnableKind,
  shortcutFor,
  solutionCostsXp,
  sortNotes,
  stepRequirement,
  verifiedLabel,
  videosCleared,
} from "./lesson";

const quizTopic = { video: { videoId: "abc" }, challengeType: "quiz" as const, quiz: [{}] };
const codeTopic = { video: { videoId: "abc" }, challengeType: "code" as const, codeChallenge: {} };

describe("steps", () => {
  test("a topic only gets the steps it has content for", () => {
    expect(availableSteps(quizTopic)).toEqual(["watch", "read", "check"]);
    expect(availableSteps(codeTopic)).toEqual(["watch", "read", "do"]);
    expect(availableSteps({ challengeType: "quiz", quiz: [{}], practice: {} })).toEqual(["read", "do", "check"]);
    expect(availableSteps({ video: { videoId: "" }, challengeType: "quiz", quiz: [] })).toEqual(["read"]);
    expect(availableSteps({ challengeType: "quiz", alternateVideos: [{ videoId: "x" }], speak: {} })).toEqual(["watch", "read", "do"]);
  });

  test("a step opens once every earlier present step is done", () => {
    const available = availableSteps(quizTopic);
    expect(canOpenStep("watch", available, {})).toBe(true);
    expect(canOpenStep("read", available, {})).toBe(false);
    expect(canOpenStep("read", available, { watch: true })).toBe(true);
    expect(canOpenStep("check", available, { watch: true })).toBe(false);
    expect(canOpenStep("do", available, { watch: true, read: true })).toBe(false);
    expect(resumeStep(available, { watch: true })).toBe("read");
    expect(resumeStep(available, { watch: true, read: true, check: true })).toBe("check");
    expect(lessonComplete(available, { watch: true, read: true, check: true })).toBe(true);
    expect(lessonComplete(available, { watch: true, read: true, do: true })).toBe(false);
  });

  test("done flags never go back to false", () => {
    expect(mergeDone({ watch: true }, { watch: false, read: true })).toEqual({ watch: true, read: true, do: false, check: false });
  });

  test("Next gating per step", () => {
    expect(stepRequirement("watch", { videosCleared: false }).met).toBe(false);
    expect(stepRequirement("watch", { videosCleared: true }).met).toBe(true);
    expect(stepRequirement("read", {}).hint).toMatch(/mark it as read/);
    expect(stepRequirement("do", { doAttempts: 1 })).toEqual({ met: false, hint: "Pass the practice, or check 2 more times" });
    expect(stepRequirement("do", { doAttempts: 2 }).hint).toMatch(/1 more time$/);
    expect(stepRequirement("do", { doAttempts: 3 }).met).toBe(true);
    expect(stepRequirement("do", { doPassed: true }).met).toBe(true);
    expect(stepRequirement("do", { speakSent: true }).met).toBe(true);
    expect(stepRequirement("check", { checkPassed: false }).met).toBe(false);
  });

  test("the v4.3 video rule: all watched, warn mode or exempt", () => {
    const base = { locked: true, exempt: null, watchedCount: 1, total: 3, lockMode: "lock" };
    expect(videosCleared(base)).toBe(false);
    expect(videosCleared({ ...base, lockMode: "warn", locked: false })).toBe(true);
    expect(videosCleared({ ...base, watchedCount: 3 })).toBe(true);
    expect(videosCleared({ ...base, exempt: "staff" })).toBe(true);
    expect(videosCleared(null)).toBe(false);
  });

  test("time left shrinks as steps are done", () => {
    const available = availableSteps(quizTopic);
    expect(minutesLeft(60, available, {})).toBe(60);
    expect(minutesLeft(60, available, { watch: true })).toBe(26);
    expect(minutesLeft(60, available, { watch: true, read: true, check: true })).toBe(0);
    expect(minutesLeft(0, available, {})).toBe(0);
  });
});

describe("hint ladder", () => {
  const input = {
    instructions: "Implement `sum(list)`. It returns the total.",
    starterCode: "function sum(list) {\n  // your code\n}",
    functionName: "sum",
    summary: "**Reduce** folds a list into one value. It is the general form of sum.",
    checks: [{ description: "adds numbers" }, { description: "empty list gives 0", isEdgeCase: true }],
  };

  test("nudge, idea, then part of the code; never the answer", () => {
    const hints = codeHints(input);
    expect(hints.nudge).toMatch(/"adds numbers"/);
    expect(hints.concept).toBe("Reduce folds a list into one value.");
    expect(hints.partial).toContain("function sum(list) {\n  // A plan, one check at a time:");
    expect(hints.partial).toContain("// - empty list gives 0");
    expect(hints.partial).toContain("// your code");
  });

  test("the nudge follows the first failing check", () => {
    expect(codeHints({ ...input, firstFailing: "empty list gives 0" }).nudge).toMatch(/"empty list gives 0"/);
  });

  test("the solution costs XP only before the third check", () => {
    expect(solutionCostsXp(0)).toBe(true);
    expect(solutionCostsXp(2)).toBe(true);
    expect(solutionCostsXp(3)).toBe(false);
  });
});

describe("shortcuts", () => {
  test("player keys only on Watch; F and ? everywhere", () => {
    expect(shortcutFor({ key: "k" }, "watch")).toBe("togglePlay");
    expect(shortcutFor({ key: " " }, "watch")).toBe("togglePlay");
    expect(shortcutFor({ key: "j" }, "watch")).toBe("back10");
    expect(shortcutFor({ key: "L" }, "watch")).toBe("forward10");
    expect(shortcutFor({ key: "ArrowLeft" }, "watch")).toBe("back5");
    expect(shortcutFor({ key: "ArrowRight" }, "watch")).toBe("forward5");
    expect(shortcutFor({ key: "n" }, "watch")).toBe("note");
    expect(shortcutFor({ key: "n" }, "read")).toBeNull();
    expect(shortcutFor({ key: "f" }, "do")).toBe("focus");
    expect(shortcutFor({ key: "?" }, "check")).toBe("help");
    expect(shortcutFor({ key: "x" }, "watch")).toBeNull();
  });

  test("never while typing, with modifiers, or for Space on a button", () => {
    expect(shortcutFor({ key: "f", targetTag: "INPUT" }, "watch")).toBeNull();
    expect(shortcutFor({ key: "k", targetTag: "TEXTAREA" }, "watch")).toBeNull();
    expect(shortcutFor({ key: "n", targetEditable: true }, "watch")).toBeNull();
    expect(shortcutFor({ key: "f", ctrlKey: true }, "watch")).toBeNull();
    expect(shortcutFor({ key: "l", metaKey: true }, "watch")).toBeNull();
    expect(shortcutFor({ key: " ", targetTag: "BUTTON" }, "watch")).toBeNull();
    expect(shortcutFor({ key: "k", targetTag: "BUTTON" }, "watch")).toBe("togglePlay");
    expect(shortcutFor({ key: "ArrowLeft", targetTag: "DIV", targetRole: "slider" }, "watch")).toBeNull();
  });
});

describe("reading", () => {
  const summary = "Closures keep variables alive after the outer function returns. That is useful.\n\nThey can leak memory if you hold them too long! Be careful.\n\n- a list item\n- another";
  const sections = [{ heading: "In practice", body: "Use a closure for a counter. It hides state.\n\n```js\nconst c = counter();\n\nc();\n```" }];

  test("passages mirror the grounding split (fences stay whole)", () => {
    expect(passageChunks(sections[0].body)).toEqual(["Use a closure for a counter. It hides state.", "```js\nconst c = counter();\n\nc();\n```"]);
    expect(lessonPassages(summary, sections).map((p) => p.id)).toEqual(["sum.p1", "sum.p2", "sum.p3", "s1.p1", "s1.p2"]);
  });

  test("takeaways: first sentences, skipping lists and code, capped", () => {
    expect(extractTakeaways(summary, sections)).toEqual([
      "Closures keep variables alive after the outer function returns.",
      "They can leak memory if you hold them too long!",
      "Use a closure for a counter.",
    ]);
    expect(extractTakeaways(summary, sections, 1)).toHaveLength(1);
    expect(extractTakeaways("", [])).toEqual([]);
  });

  test("callouts from a leading label", () => {
    expect(calloutOf("Tip: use const.")).toEqual({ kind: "tip", body: "use const." });
    expect(calloutOf("**Watch out:** this leaks.")).toEqual({ kind: "warning", body: "this leaks." });
    expect(calloutOf("At Oyelabs: we log every change request.")).toEqual({ kind: "oyelabs", body: "we log every change request." });
    expect(calloutOf("Tipping point is a phrase.")).toBeNull();
  });

  test("glossary: first occurrence only, whole words, longest phrase first", () => {
    const phrases = glossaryPhrases([
      { id: "cr", name: "Change request", aka: ["CR"] },
      { id: "scope", name: "Scope" },
      { id: "scope-creep", name: "Scope creep" },
    ]);
    const used = new Set<string>();
    const first = matchGlossary("A change request stops scope creep. Another change request later.", phrases, used);
    expect(first).toEqual([
      { kind: "text", text: "A " },
      { kind: "term", text: "change request", termId: "cr" },
      { kind: "text", text: " stops " },
      { kind: "term", text: "scope creep", termId: "scope-creep" },
      { kind: "text", text: ". Another change request later." },
    ]);
    // Used terms stay used across paragraphs; "scopes" is not a whole-word match.
    expect(matchGlossary("The CR and the scopes.", phrases, used)).toEqual([{ kind: "text", text: "The CR and the scopes." }]);
    expect(matchGlossary("Scope matters.", phrases, used)).toEqual([{ kind: "term", text: "Scope", termId: "scope" }, { kind: "text", text: " matters." }]);
    expect(glossaryPhrases([{ id: "x", name: "AI" }])).toEqual([]);
  });

  test("reading time, runnable fences, previews and dates", () => {
    expect(readingMinutes("word ".repeat(460))).toBe(2);
    expect(readingMinutes("")).toBe(1);
    expect(runnableKind("JS")).toBe("script");
    expect(runnableKind("ts")).toBe("script");
    expect(runnableKind("html")).toBe("page");
    expect(runnableKind("php")).toBeNull();
    expect(previewDocument("css", "p{color:red}")).toContain("<style>p{color:red}</style>");
    expect(previewDocument("html", "<p>Hi</p>")).toContain("<body><p>Hi</p></body>");
    expect(verifiedLabel("2026-10-03")).toBe("3 Oct 2026");
    expect(verifiedLabel("nope")).toBeNull();
    expect(verifiedLabel(undefined)).toBeNull();
  });
});

describe("tutor cap", () => {
  test("counts today's questions in UTC and never goes below zero", () => {
    const now = Date.UTC(2026, 9, 6, 10, 0, 0);
    expect(dayStartUtc(now)).toBe(Date.UTC(2026, 9, 6));
    const times = [Date.UTC(2026, 9, 5, 23, 59), Date.UTC(2026, 9, 6, 0, 1), Date.UTC(2026, 9, 6, 9, 0)];
    expect(countToday(times, now)).toBe(2);
    expect(capLeft(2, 30)).toBe(28);
    expect(capLeft(31, 30)).toBe(0);
  });

  test("the admin's cap, with the default for anything odd", () => {
    expect(parseCap("10")).toBe(10);
    expect(parseCap("0")).toBe(0);
    expect(parseCap(null)).toBe(30);
    expect(parseCap("")).toBe(30);
    expect(parseCap("-1")).toBe(30);
    expect(parseCap("abc")).toBe(30);
  });
});

test("notes sort: timestamped by time, then the rest newest first", () => {
  const sorted = sortNotes([
    { atSec: null, createdAt: 1 },
    { atSec: 50, createdAt: 2 },
    { atSec: null, createdAt: 5 },
    { atSec: 10, createdAt: 3 },
  ]);
  expect(sorted.map((n) => `${n.atSec}:${n.createdAt}`)).toEqual(["10:3", "50:2", "null:5", "null:1"]);
});
