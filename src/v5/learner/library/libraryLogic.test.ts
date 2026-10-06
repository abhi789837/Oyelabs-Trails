import { describe, expect, test } from "vitest";

import type { LibraryItem } from "@shared/me";

import { EMPTY_FILTERS, activeFilterCount, matchScore, passesFilters, searchLibrary, skillOptions } from "./libraryLogic";

const item = (over: Partial<LibraryItem>): LibraryItem => ({
  id: over.id ?? over.title ?? "x",
  kind: "course",
  title: "Untitled",
  summary: "",
  outcomes: [],
  department: { id: "engineering", name: "Engineering" },
  skills: [],
  level: "intermediate",
  minutes: 120,
  lessonCount: 4,
  format: "mixed",
  recommended: false,
  recommendedWhy: null,
  doneCount: 0,
  nextLessonHref: null,
  ...over,
});

const docker = item({ title: "Docker in practice", skills: [{ id: "docker", name: "Docker" }], format: "video", minutes: 400, level: "advanced" });
const node = item({ title: "Node.js Core", summary: "Run containers? no. Event loop.", skills: [{ id: "node", name: "Node.js" }], recommended: true, minutes: 60 });
const sql = item({ title: "SQL basics", outcomes: ["Use joins with docker-hosted Postgres"], format: "reading", department: { id: "data", name: "Data" } });
const all = [docker, node, sql];

describe("matchScore", () => {
  test("title start beats a word in the title beats outcomes beats summary", () => {
    expect(matchScore(docker, "docker")).toBeGreaterThan(matchScore(sql, "docker"));
    expect(matchScore(item({ title: "Practical docker" }), "docker")).toBeLessThan(matchScore(docker, "docker"));
    expect(matchScore(node, "event")).toBe(1);
  });

  test("every word must match; empty query matches all; case and accents ignored", () => {
    expect(matchScore(docker, "docker kubernetes")).toBe(0);
    expect(matchScore(docker, "  ")).toBe(1);
    expect(matchScore(item({ title: "Café ops" }), "CAFE")).toBeGreaterThan(0);
  });

  test("regex characters in a query are safe", () => {
    expect(() => matchScore(docker, "c++ (")).not.toThrow();
  });
});

describe("filters", () => {
  test("department, skill, level, length and format", () => {
    expect(passesFilters(sql, { ...EMPTY_FILTERS, department: "data" })).toBe(true);
    expect(passesFilters(docker, { ...EMPTY_FILTERS, department: "data" })).toBe(false);
    expect(passesFilters(docker, { ...EMPTY_FILTERS, skill: "docker" })).toBe(true);
    expect(passesFilters(node, { ...EMPTY_FILTERS, level: "advanced" })).toBe(false);
    expect(passesFilters(docker, { ...EMPTY_FILTERS, length: "long" })).toBe(true);
    expect(passesFilters(node, { ...EMPTY_FILTERS, length: "short" })).toBe(true);
    expect(passesFilters(docker, { ...EMPTY_FILTERS, format: "video" })).toBe(true);
    expect(passesFilters(node, { ...EMPTY_FILTERS, format: "reading" })).toBe(false);
    expect(activeFilterCount({ ...EMPTY_FILTERS, level: "beginner", format: "video" })).toBe(2);
  });
});

describe("searchLibrary", () => {
  test("no query: recommended first, then by title", () => {
    expect(searchLibrary(all, EMPTY_FILTERS).map((i) => i.title)).toEqual(["Node.js Core", "Docker in practice", "SQL basics"]);
  });

  test("a query ranks by match, then filters apply", () => {
    expect(searchLibrary(all, { ...EMPTY_FILTERS, query: "docker" }).map((i) => i.title)).toEqual(["Docker in practice", "SQL basics"]);
    expect(searchLibrary(all, { ...EMPTY_FILTERS, query: "docker", format: "reading" }).map((i) => i.title)).toEqual(["SQL basics"]);
    expect(searchLibrary(all, { ...EMPTY_FILTERS, query: "zzz" })).toEqual([]);
  });

  test("skill options are unique and sorted", () => {
    expect(skillOptions([docker, docker, node]).map((s) => s.name)).toEqual(["Docker", "Node.js"]);
  });
});
