import { getSchema } from "@tiptap/react";
import { Node as PMNodeClass } from "@tiptap/pm/model";
import { describe, expect, test, vi } from "vitest";

import {
  dismissKey,
  groupInbox,
  inboxTotal,
  isDismissed,
  isReversible,
  isStuck,
  pruneDismissed,
  STUCK_DAYS,
  withoutItem,
  type InboxItem,
  type StuckFacts,
} from "@shared/adminInbox";
import {
  bucketByDay,
  csvCell,
  dayStarts,
  dollarsFromMicros,
  hoursFromMinutes,
  parseRange,
  percent,
  rangeForDays,
  reportDayRows,
  REPORT_DAY_COLUMNS,
  skillLevelUps,
  testOutcomes,
  toCsv,
  uniquePairs,
  weeklyReportDue,
  weeklyReportEmail,
  type ReportsResponse,
} from "@shared/reports";

import { docToLesson, lessonToDoc, markdownToInline, quizProblem, type PMDoc } from "./library/editor/blocks";
import { lessonStarterKit, QuizBlockBase, TaskBlockBase, VideoBlockBase } from "./library/editor/schema";
import { createDeferredQueue } from "./parts/deferred";
import { createKeySequence, isTypingTarget } from "./shell/keys";
import { filterPalette, matchScore } from "./shell/palette";

const DAY = 86_400_000;
const NOW = new Date(2026, 9, 6, 12, 0, 0).getTime();

function item(id: string, group: InboxItem["group"], at: number | null): InboxItem {
  return { id: `${group}:${id}`, group, title: id, detail: "", at, action: { kind: "open", label: "Open", href: "/" } };
}

describe("inbox grouping", () => {
  test("fixed group order, oldest first, capped, empty groups dropped", () => {
    const items = [item("b", "stuck", 5), item("a", "reviews", 3), item("c", "reviews", 1), item("d", "reviews", 2), item("s", "setup", null)];
    const groups = groupInbox(items, {}, 2);
    expect(groups.map((g) => g.id)).toEqual(["reviews", "stuck", "setup"]);
    expect(groups[0]!.items.map((i) => i.id)).toEqual(["reviews:c", "reviews:d"]);
    expect(groups[0]!.total).toBe(3);
    expect(inboxTotal(groups)).toBe(5);
    expect(groupInbox([])).toEqual([]);
  });

  test("a server total larger than the rows read wins", () => {
    expect(groupInbox([item("a", "problems", 1)], { problems: 40 })[0]!.total).toBe(40);
  });

  test("optimistic removal keeps counts right and drops an emptied group", () => {
    const groups = groupInbox([item("a", "reviews", 1), item("b", "reviews", 2), item("c", "stuck", 1)]);
    const after = withoutItem(groups, "stuck:c");
    expect(after.map((g) => g.id)).toEqual(["reviews"]);
    expect(withoutItem(after, "reviews:a")[0]).toMatchObject({ total: 1, items: [{ id: "reviews:b" }] });
    expect(withoutItem(after, "nope")).toEqual(after);
  });

  test("only reversible actions wait for Undo", () => {
    expect(isReversible({ kind: "dismiss", label: "", key: "stuck:x" })).toBe(true);
    expect(isReversible({ kind: "nudge", label: "", userId: "x" })).toBe(true);
    expect(isReversible({ kind: "full-marks", label: "", reviewId: "x" })).toBe(false);
    expect(isReversible({ kind: "approve-test", label: "", assessmentId: "x" })).toBe(false);
  });

  test("checked stuck learners come back after 7 days; checked warnings stay checked", () => {
    const map = { [dismissKey("stuck", "u1")]: NOW - 6 * DAY, [dismissKey("stuck", "u2")]: NOW - 8 * DAY, [dismissKey("integrity", "a1")]: NOW - 60 * DAY };
    expect(isDismissed(map, "stuck:u1", NOW)).toBe(true);
    expect(isDismissed(map, "stuck:u2", NOW)).toBe(false);
    expect(isDismissed(map, "integrity:a1", NOW)).toBe(true);
    expect(isDismissed(map, "integrity:a2", NOW)).toBe(false);
    expect(Object.keys(pruneDismissed({ ...map, old: NOW - 200 * DAY }, NOW))).toHaveLength(3);
  });
});

describe("the stuck rule", () => {
  const base: StuckFacts = { role: "learner", status: "active", hasPlan: true, planDone: false, planStartedAt: NOW - 30 * DAY, lastActivityAt: NOW - STUCK_DAYS * DAY };
  test("7 days without learning on an unfinished plan is stuck", () => {
    expect(isStuck(base, NOW)).toBe(true);
    expect(isStuck({ ...base, lastActivityAt: NOW - 6.9 * DAY }, NOW)).toBe(false);
  });
  test("never started counts from the day the plan arrived", () => {
    expect(isStuck({ ...base, lastActivityAt: null, planStartedAt: NOW - 2 * DAY }, NOW)).toBe(false);
    expect(isStuck({ ...base, lastActivityAt: null, planStartedAt: NOW - 9 * DAY }, NOW)).toBe(true);
    expect(isStuck({ ...base, lastActivityAt: null, planStartedAt: null }, NOW)).toBe(false);
  });
  test("no plan, a finished plan, staff and suspended people are never stuck", () => {
    expect(isStuck({ ...base, hasPlan: false }, NOW)).toBe(false);
    expect(isStuck({ ...base, planDone: true }, NOW)).toBe(false);
    expect(isStuck({ ...base, role: "admin" }, NOW)).toBe(false);
    expect(isStuck({ ...base, status: "disabled" }, NOW)).toBe(false);
  });
});

describe("reports maths", () => {
  test("ranges: presets, custom dates, reversed, too long, garbage", () => {
    const week = rangeForDays(7, NOW);
    expect(dayStarts(week)).toHaveLength(7);
    expect(parseRange({ days: "7" }, NOW)).toEqual(week);
    const custom = parseRange({ from: "2026-09-01", to: "2026-09-30" }, NOW);
    expect(dayStarts(custom)).toHaveLength(30);
    expect(parseRange({ from: "2026-09-30", to: "2026-09-01" }, NOW)).toEqual(custom);
    expect(dayStarts(parseRange({ from: "2020-01-01", to: "2026-09-30" }, NOW)).length).toBeLessThanOrEqual(367);
    expect(parseRange({ from: "nope" }, NOW)).toEqual(rangeForDays(30, NOW));
    expect(parseRange({ from: "2026-02-31" }, NOW)).toEqual(rangeForDays(30, NOW));
  });

  test("bucketing by day, with values, ignores what's outside", () => {
    const starts = dayStarts(rangeForDays(3, NOW));
    expect(bucketByDay(starts, [{ at: starts[0]! + 5 }, { at: starts[2]! + 1, value: 4 }, { at: starts[0]! - 1 }, { at: null }])).toEqual([1, 0, 4]);
  });

  test("percent, hours and dollars", () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(5, 0)).toBe(0);
    expect(hoursFromMinutes(95)).toBe(1.6);
    expect(dollarsFromMicros(1_234_567)).toBe(1.23);
  });

  test("skill level-ups compare each test with the one before it", () => {
    const range = rangeForDays(7, NOW);
    const evals = [
      { userId: "u", at: NOW - 30 * DAY, skills: [{ skillId: "git", skillName: "Git", level: 1 }, { skillId: "sql", level: 3 }] },
      { userId: "u", at: NOW - 2 * DAY, skills: [{ skillId: "git", skillName: "Git", level: 3 }, { skillId: "sql", level: 2 }, { skillId: "new", level: 4 }] },
      { userId: "v", at: NOW - DAY, skills: [{ skillId: "git", level: 5 }] },
    ];
    expect(skillLevelUps(evals, range)).toEqual({ count: 1, learners: 1, bySkill: [{ skill: "Git", count: 1 }] });
  });

  test("test outcomes and unique cases", () => {
    expect(testOutcomes([{ passed: true, score: 90 }, { passed: false, score: 41 }])).toEqual({ attempts: 2, passed: 1, passRate: 50, averageScore: 66 });
    expect(testOutcomes([])).toEqual({ attempts: 0, passed: 0, passRate: 0, averageScore: 0 });
    const range = rangeForDays(7, NOW);
    expect(uniquePairs([{ userId: "u", ref: "c1", at: NOW - DAY }, { userId: "u", ref: "c1", at: NOW - 2 * DAY }, { userId: "v", ref: "c1", at: NOW - 20 * DAY }], range)).toBe(1);
  });

  test("the weekly email is due once a week, only when on", () => {
    expect(weeklyReportDue(false, null, NOW)).toBe(false);
    expect(weeklyReportDue(true, null, NOW)).toBe(true);
    expect(weeklyReportDue(true, NOW - 6 * DAY, NOW)).toBe(false);
    expect(weeklyReportDue(true, NOW - 7 * DAY, NOW)).toBe(true);
  });
});

describe("CSV", () => {
  test("quotes, escapes and defuses spreadsheet formulas", () => {
    expect(csvCell("plain")).toBe("plain");
    expect(csvCell('say "hi", ok')).toBe('"say ""hi"", ok"');
    expect(csvCell("line\nbreak")).toBe('"line\nbreak"');
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvCell("@cmd")).toBe("'@cmd");
    expect(csvCell(-3)).toBe("-3");
    expect(csvCell(null)).toBe("");
    expect(csvCell(Number.NaN)).toBe("");
  });

  test("a report becomes a header plus one row per day", () => {
    const report = {
      days: ["2026-10-05", "2026-10-06"],
      completion: { perDay: [2, 0] },
      time: { perDay: [1.5, 0] },
      ai: { perDay: [0.25, 1] },
    } as unknown as ReportsResponse;
    expect(toCsv(reportDayRows(report), REPORT_DAY_COLUMNS)).toBe("Day,Lessons finished,Hours learned,AI cost (USD)\r\n2026-10-05,2,1.5,0.25\r\n2026-10-06,0,0,1\r\n");
  });

  test("the weekly email text escapes names in the HTML", () => {
    const report = {
      time: { activeLearners: 3, hours: 4 },
      completion: { lessonsDone: 9, averagePlanDone: 40 },
      skills: { levelUps: 2, casesPassed: 1 },
      tests: { topic: { passed: 1, attempts: 2 } },
      ai: { dollars: 1.5 },
    } as unknown as ReportsResponse;
    const mail = weeklyReportEmail(report, "<Ana> Lee");
    expect(mail.bodyHtml).toContain("Hi &lt;Ana&gt;,");
    expect(mail.text).toContain("9 lessons finished");
  });
});

describe("block editor ⇄ lesson", () => {
  const schema = getSchema([lessonStarterKit, VideoBlockBase, QuizBlockBase, TaskBlockBase]);
  const valid = (doc: PMDoc) => PMNodeClass.fromJSON(schema, doc).check();

  const body = [
    "Intro with **bold**, *care* and `code`.",
    "- one\n- two",
    "1. first\n2. second",
    "```js\nconst a = 1;\n```",
    '```quiz\n{"question":"2+2?","options":["3","4"],"correct":[1],"why":"Maths."}\n```',
    '```task\n{"instructions":"Ship it","doneWhen":"It is live"}\n```',
  ].join("\n\n");

  test("a lesson becomes a valid Tiptap document with the right blocks", () => {
    const doc = lessonToDoc({ body, videoId: "dQw4w9WgXcQ", videoTitle: "Intro" });
    expect(doc.content.map((n) => n.type)).toEqual(["videoBlock", "paragraph", "bulletList", "orderedList", "codeBlock", "quizBlock", "taskBlock"]);
    expect(doc.content[5]!.attrs).toEqual({ question: "2+2?", options: ["3", "4"], correct: [1], why: "Maths." });
    expect(() => valid(doc)).not.toThrow();
  });

  test("and back to exactly the same lesson", () => {
    const out = docToLesson(lessonToDoc({ body, videoId: "dQw4w9WgXcQ", videoTitle: "Intro" }));
    expect(out).toEqual({ body, video: "dQw4w9WgXcQ", videoTitle: "Intro", warnings: [] });
  });

  test("an empty lesson is one empty paragraph; an empty doc is an empty body", () => {
    const doc = lessonToDoc({ body: "", videoId: null, videoTitle: null });
    expect(doc.content).toEqual([{ type: "paragraph" }]);
    expect(() => valid(doc)).not.toThrow();
    expect(docToLesson(doc)).toEqual({ body: "", video: undefined, videoTitle: undefined, warnings: [] });
  });

  test("one video per lesson, unfinished quick checks are not saved, bad JSON stays as code", () => {
    const doc: PMDoc = {
      type: "doc",
      content: [
        { type: "videoBlock", attrs: { videoId: "aaaaaaaaaaa", title: "" } },
        { type: "videoBlock", attrs: { videoId: "bbbbbbbbbbb", title: "" } },
        { type: "quizBlock", attrs: { question: "Half done", options: ["a", ""], correct: [], why: "" } },
        { type: "taskBlock", attrs: { instructions: "", doneWhen: "" } },
      ],
    };
    const out = docToLesson(doc);
    expect(out.video).toBe("aaaaaaaaaaa");
    expect(out.body).toBe("");
    expect(out.warnings).toHaveLength(2);
    expect(lessonToDoc({ body: "```quiz\nnot json\n```", videoId: null, videoTitle: null }).content[0]!.type).toBe("codeBlock");
    expect(quizProblem({ question: "Q", options: ["a", "b"], correct: [], why: "" })).toBe("Tick the right answer.");
  });

  test("inline marks parse the way RichText renders them (a lone * is text)", () => {
    expect(markdownToInline("SELECT * FROM t")).toEqual([{ type: "text", text: "SELECT * FROM t" }]);
    expect(markdownToInline("a **b** c")).toEqual([
      { type: "text", text: "a " },
      { type: "text", text: "b", marks: [{ type: "bold" }] },
      { type: "text", text: " c" },
    ]);
  });
});

describe("undo window", () => {
  test("runs after the delay, Undo cancels, flush sends what's waiting", async () => {
    vi.useFakeTimers();
    try {
      const q = createDeferredQueue(1000);
      const ran: string[] = [];
      q.schedule("a", () => ran.push("a"));
      q.schedule("b", () => ran.push("b"));
      q.schedule("c", () => ran.push("c"));
      expect(q.cancel("b")).toBe(true);
      expect(q.cancel("b")).toBe(false);
      await vi.advanceTimersByTimeAsync(1000);
      expect(ran).toEqual(["a", "c"]);
      q.schedule("d", () => ran.push("d"));
      await q.flush();
      expect(ran).toEqual(["a", "c", "d"]);
      expect(q.pending()).toEqual([]);
      const errors: unknown[] = [];
      q.schedule("e", () => Promise.reject(new Error("x")), (e) => errors.push(e));
      await vi.advanceTimersByTimeAsync(1000);
      expect(errors).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("keyboard shortcuts", () => {
  test("g then a letter within the window; ? on its own", () => {
    const seq = createKeySequence(["g i", "g p", "?"], 1000);
    expect(seq.feed("g", 0)).toBeNull();
    expect(seq.feed("i", 500)).toBe("g i");
    expect(seq.feed("g", 2000)).toBeNull();
    expect(seq.feed("p", 3500)).toBeNull();
    expect(seq.feed("?", 4000)).toBe("?");
    expect(seq.feed("x", 4100)).toBeNull();
    expect(seq.feed("G", 5000)).toBeNull();
    expect(seq.feed("P", 5100)).toBe("g p");
  });
  test("typing in a field is never a shortcut", () => {
    expect(isTypingTarget({ tagName: "INPUT", getAttribute: () => null } as unknown as EventTarget)).toBe(true);
    expect(isTypingTarget({ tagName: "DIV", isContentEditable: true, getAttribute: () => null } as unknown as EventTarget)).toBe(true);
    expect(isTypingTarget({ tagName: "BUTTON", getAttribute: () => null } as unknown as EventTarget)).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

describe("the palette's matching", () => {
  const groups = [
    { heading: "Go to", items: [{ label: "Tutor answers", keywords: ["ai", "helpful", "thumbs"] }, { label: "People", keywords: ["learners"] }] },
    { heading: "People", items: [{ label: "Priya Sharma", hint: "priya.s" }, { label: "Rahul Verma", hint: "rahul.verma" }] },
  ];
  test("a name finds the person first, and fuzzy letters don't match", () => {
    const out = filterPalette(groups, "rahul");
    expect(out.map((g) => g.heading)).toEqual(["People"]);
    expect(out[0]!.items.map((i) => i.label)).toEqual(["Rahul Verma"]);
  });
  test("keywords and later words match; nothing typed keeps everything in order", () => {
    expect(filterPalette(groups, "learn").flatMap((g) => g.items.map((i) => i.label))).toEqual(["People"]);
    expect(filterPalette(groups, "verma")[0]!.items[0]!.label).toBe("Rahul Verma");
    expect(filterPalette(groups, "")).toEqual(groups);
    expect(matchScore({ label: "Onboard someone" }, "onb")).toBe(3);
  });
});

describe("blocks inside a list", () => {
  test("a quick check dropped into a list item is saved after the list", () => {
    const doc: PMDoc = {
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "one" }] }, { type: "quizBlock", attrs: { question: "Q?", options: ["a", "b"], correct: [0], why: "" } }] },
          ],
        },
      ],
    };
    expect(docToLesson(doc).body).toBe('- one\n\n```quiz\n{"question":"Q?","options":["a","b"],"correct":[0],"why":""}\n```');
  });
});
