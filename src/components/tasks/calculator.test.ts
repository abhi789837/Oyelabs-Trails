import { describe, expect, test } from "vitest";

import { evaluateExpression, formatResult } from "./calculator";

const value = (input: string) => {
  const result = evaluateExpression(input);
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

describe("the Calculate task's calculator", () => {
  test("precedence and brackets", () => {
    expect(value("2 + 3 * 4")).toBe(14);
    expect(value("(2 + 3) * 4")).toBe(20);
    expect(value("10 - 4 - 3")).toBe(3);
    expect(value("100 / 10 / 2")).toBe(5);
  });

  test("decimals, unary signs and thousands separators", () => {
    expect(value("0.5 * 4")).toBe(2);
    expect(value(".25 + 1.")).toBe(1.25);
    expect(value("-(3 - 5)")).toBe(2);
    expect(value("1,200 / 4")).toBe(300);
    expect(value("6 × 7 ÷ 2")).toBe(21);
  });

  test("errors are reported, not thrown", () => {
    expect(evaluateExpression("")).toEqual({ ok: false, error: "Type a calculation" });
    expect(evaluateExpression("2 +").ok).toBe(false);
    expect(evaluateExpression("(2 + 3").ok).toBe(false);
    expect(evaluateExpression("2 + 3)").ok).toBe(false);
    expect(evaluateExpression("4 / 0")).toEqual({ ok: false, error: "Division by zero" });
  });

  test("never evaluates code", () => {
    expect(evaluateExpression("alert(1)").ok).toBe(false);
    expect(evaluateExpression("2 ** 3").ok).toBe(false);
    expect(evaluateExpression("constructor").ok).toBe(false);
  });

  test("results are shown without float noise", () => {
    expect(formatResult(0.1 + 0.2)).toBe("0.3");
    expect(formatResult(2 / 3)).toBe("0.666667");
  });
});
