import { describe, expect, test } from "vitest";

import {
  DEFAULT_SETTINGS,
  formatOf,
  lengthBucket,
  linkedInAddUrl,
  mergeSettings,
  moduleItemId,
  noteHref,
  outcomeLine,
  parseModuleItemId,
  prerequisiteViews,
  recommendation,
  searchNotes,
  settingsFrom,
  updateSettingsSchema,
  type RecommendSignals,
} from "./me";

describe("settings", () => {
  test("reads defaults for missing or broken keys and keeps valid ones", () => {
    expect(settingsFrom({})).toEqual(DEFAULT_SETTINGS);
    const s = settingsFrom({ theme: "dark", reminderTime: "9:00", celebrations: false, uiV5: true });
    expect(s.theme).toBe("dark");
    expect(s.reminderTime).toBeNull(); // "9:00" is not HH:MM
    expect(s.celebrations).toBe(false);
  });

  test("merge keeps keys other features own", () => {
    const next = mergeSettings({ uiV5: true, welcomeDoneAt: 5, theme: "light" }, { theme: "dark" });
    expect(next).toEqual({ uiV5: true, welcomeDoneAt: 5, theme: "dark" });
  });

  test("the update schema refuses unknown keys", () => {
    expect(updateSettingsSchema.safeParse({ uiV5: false }).success).toBe(false);
    expect(updateSettingsSchema.safeParse({ quietHours: { from: "22:00", to: "07:00" } }).success).toBe(true);
  });
});

describe("notes", () => {
  test("links to the moment in the video", () => {
    expect(noteHref("js-closures", "abc", 61.9)).toBe("/learn/lesson/js-closures?step=watch&t=61&video=abc");
    expect(noteHref("js-closures", null, null)).toBe("/learn/lesson/js-closures");
  });

  test("search matches every word in the body or the lesson title", () => {
    const notes = [
      { body: "closures keep scope", topicTitle: "Closures" },
      { body: "let has a TDZ", topicTitle: "Hoisting" },
    ];
    expect(searchNotes(notes, "SCOPE closures")).toHaveLength(1);
    expect(searchNotes(notes, "hoisting tdz")).toEqual([notes[1]]);
    expect(searchNotes(notes, "  ")).toHaveLength(2);
  });
});

describe("library helpers", () => {
  const signals: RecommendSignals = {
    pathCourseIds: new Set(["course-a"]),
    pathModuleIds: new Set(["fe-js-core"]),
    goalSkills: new Map([["node", "Build a REST API"], ["sql", ""]]),
    levels: { node: 1, sql: 4 },
    targets: { node: 3 },
  };
  const base = { skills: [] as { id: string; name: string }[], lessonCount: 5, doneCount: 0 };

  test("recommended: on the path first, then a goal skill below target, never when finished", () => {
    expect(recommendation({ ...base, id: "course-a", kind: "course" }, signals)).toBe("On your path");
    expect(recommendation({ ...base, id: moduleItemId("frontend", "fe-js-core"), kind: "module" }, signals)).toBe("On your path");
    expect(recommendation({ ...base, id: "c2", kind: "course", skills: [{ id: "node", name: "Node" }] }, signals)).toBe("Helps with your goal: Build a REST API");
    expect(recommendation({ ...base, id: "c3", kind: "course", skills: [{ id: "sql", name: "SQL" }] }, signals)).toBeNull(); // already at 4 ≥ 3
    expect(recommendation({ ...base, id: "course-a", kind: "course", doneCount: 5 }, signals)).toBeNull();
    expect(recommendation({ ...base, id: "c4", kind: "course" }, signals)).toBeNull();
  });

  test("prerequisite ticks: have it from level 2, unknown is not had", () => {
    const views = prerequisiteViews(["js", "html", "css", "js"], new Map([["js", "JavaScript"]]), { js: 3, html: 1 });
    expect(views).toEqual([
      { skillId: "js", name: "JavaScript", level: 3, have: true },
      { skillId: "html", name: "html", level: 1, have: false },
      { skillId: "css", name: "css", level: null, have: false },
    ]);
  });

  test("format and length buckets", () => {
    expect(formatOf(9, 10, 3000)).toBe("video");
    expect(formatOf(1, 10, 3000)).toBe("reading");
    expect(formatOf(10, 10, 20_000)).toBe("mixed");
    expect(formatOf(5, 10, 20_000)).toBe("reading");
    expect(formatOf(5, 10, 5000)).toBe("mixed");
    expect(formatOf(0, 0, 0)).toBe("reading");
    expect(lengthBucket(45)).toBe("short");
    expect(lengthBucket(200)).toBe("medium");
    expect(lengthBucket(800)).toBe("long");
  });

  test("outcome lines start with a verb", () => {
    expect(outcomeLine("Closures", "advanced")).toBe("Apply Closures");
    expect(outcomeLine("build a CRUD API.", "intermediate")).toBe("Build a CRUD API");
    expect(outcomeLine("React Router Fundamentals", null)).toBe("Use React Router Fundamentals");
  });

  test("module item ids round-trip", () => {
    expect(parseModuleItemId(moduleItemId("frontend", "fe-js-core"))).toEqual({ trackId: "frontend", moduleId: "fe-js-core" });
    expect(parseModuleItemId("course-1")).toBeNull();
  });

  test("LinkedIn add-to-profile link", () => {
    const url = new URL(linkedInAddUrl({ title: "Backend", issuedAt: Date.UTC(2026, 2, 4), id: "OYL-1" }, "https://learn.oyelabs.com"));
    expect(url.origin + url.pathname).toBe("https://www.linkedin.com/profile/add");
    expect(url.searchParams.get("startTask")).toBe("CERTIFICATION_NAME");
    expect(url.searchParams.get("issueMonth")).toBe("3");
    expect(url.searchParams.get("certUrl")).toBe("https://learn.oyelabs.com/verify/OYL-1");
  });
});
