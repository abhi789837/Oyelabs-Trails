import { describe, expect, test } from "vitest";

import { markPageTitled, pageTitle, pageTitledFor, routeTitle } from "./pageTitle";

describe("page titles", () => {
  test('"<Page> · Oyelearn", or just "Oyelearn"', () => {
    expect(pageTitle("Library")).toBe("Library · Oyelearn");
    expect(pageTitle()).toBe("Oyelearn");
    expect(pageTitle("  ")).toBe("Oyelearn");
  });

  test.each([
    ["/login", "Sign in"],
    ["/learn", "Today"],
    ["/learn/library/abc", "Library"],
    ["/learn/library", "Library"],
    ["/learn/lesson/js-closures", "Lesson"],
    ["/admin/people", "Admin"],
    ["/verify/XYZ", "Check a certificate"],
  ])("%s → %s", (path, title) => {
    expect(routeTitle(path)).toBe(title);
  });

  test("an unknown path is just Oyelearn", () => {
    expect(routeTitle("/")).toBeNull();
    expect(pageTitle(routeTitle("/nope"))).toBe("Oyelearn");
  });

  test("remembers which path a page titled itself on", () => {
    markPageTitled("/learn/me");
    expect(pageTitledFor("/learn/me")).toBe(true);
    expect(pageTitledFor("/learn")).toBe(false);
  });
});
