import { describe, expect, test } from "vitest";

import { TEST_DRIVER_MARKER, joinTestDriver, splitTestDriver } from "./testDriver";

const starter = `function f(x) {\n  // Your code here\n}\n\n${TEST_DRIVER_MARKER}\nfunction check(x) {\n  return f(x);\n}\n`;

describe("test driver split (D1)", () => {
  test("the editor gets the learner's part; joining gives the same code back", () => {
    const { own, driver } = splitTestDriver(starter);
    expect(own).toBe("function f(x) {\n  // Your code here\n}\n\n");
    expect(driver.startsWith(TEST_DRIVER_MARKER)).toBe(true);
    expect(joinTestDriver(own, driver)).toBe(starter);
  });

  test("an edit keeps the driver after it, on its own line", () => {
    const { driver } = splitTestDriver(starter);
    expect(joinTestDriver("function f(x) { return x; }", driver)).toBe(`function f(x) { return x; }\n${driver}`);
  });

  test("code without the marker is shown whole", () => {
    expect(splitTestDriver("function f() {}")).toEqual({ own: "function f() {}", driver: "" });
    expect(joinTestDriver("function f() {}", "")).toBe("function f() {}");
    expect(splitTestDriver("// ---- Test driver and helpers (leave as is) ----\nx").driver).toBe("");
  });
});
