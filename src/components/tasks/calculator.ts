/**
 * The built-in calculator for Calculate tasks: + - * / ( ) and decimals, nothing else.
 *
 * A tiny recursive-descent parser rather than `eval` or `new Function` — the input is typed by the
 * learner during a proctored sitting, and there is no reason for it to be able to run anything.
 *
 *   expr   := term (("+" | "-") term)*
 *   term   := factor (("*" | "/") factor)*
 *   factor := ("+" | "-") factor | number | "(" expr ")"
 */

export type CalcResult = { ok: true; value: number } | { ok: false; error: string };

const MAX_LENGTH = 200;

export function evaluateExpression(input: string): CalcResult {
  const source = input.replace(/×/g, "*").replace(/÷/g, "/").replace(/,/g, "");
  if (source.trim() === "") return { ok: false, error: "Type a calculation" };
  if (source.length > MAX_LENGTH) return { ok: false, error: "That calculation is too long" };

  let pos = 0;
  const peek = () => {
    while (source[pos] === " " || source[pos] === "\t") pos += 1;
    return source[pos];
  };

  const fail = (message: string): never => {
    throw new CalcError(message);
  };

  const parseNumber = (): number => {
    const match = /^(\d+(\.\d*)?|\.\d+)/.exec(source.slice(pos));
    if (!match) return fail(peek() === undefined ? "The calculation ends too early" : `Unexpected "${peek()}"`);
    pos += match[0].length;
    return Number(match[0]);
  };

  let depth = 0;
  const parseFactor = (): number => {
    const c = peek();
    if (c === "+") {
      pos += 1;
      return parseFactor();
    }
    if (c === "-") {
      pos += 1;
      return -parseFactor();
    }
    if (c === "(") {
      pos += 1;
      depth += 1;
      if (depth > 50) fail("Too many brackets");
      const value = parseExpr();
      if (peek() !== ")") fail("A bracket is not closed");
      pos += 1;
      depth -= 1;
      return value;
    }
    return parseNumber();
  };

  const parseTerm = (): number => {
    let value = parseFactor();
    for (;;) {
      const c = peek();
      if (c === "*") {
        pos += 1;
        value *= parseFactor();
      } else if (c === "/") {
        pos += 1;
        const divisor = parseFactor();
        if (divisor === 0) fail("Division by zero");
        value /= divisor;
      } else return value;
    }
  };

  const parseExpr = (): number => {
    let value = parseTerm();
    for (;;) {
      const c = peek();
      if (c === "+") {
        pos += 1;
        value += parseTerm();
      } else if (c === "-") {
        pos += 1;
        value -= parseTerm();
      } else return value;
    }
  };

  try {
    const value = parseExpr();
    if (peek() !== undefined) fail(peek() === ")" ? "There is an extra closing bracket" : `Unexpected "${peek()}"`);
    if (!Number.isFinite(value)) fail("The result is not a finite number");
    return { ok: true, value };
  } catch (error) {
    if (error instanceof CalcError) return { ok: false, error: error.message };
    throw error;
  }
}

class CalcError extends Error {}

/** For display: up to 6 decimals, no trailing zeros, no float noise like 0.30000000000000004. */
export function formatResult(value: number): string {
  return String(Math.round(value * 1e6) / 1e6);
}
