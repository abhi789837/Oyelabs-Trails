import type { ServedCodeChallenge } from "@shared/content";

/*
 * Runs a learner's own code against the challenge's VISIBLE tests, in a throwaway Web Worker
 * built from a Blob URL. This is a fast feedback loop while they iterate, nothing more.
 *
 * It decides nothing. From v3 the verdict comes from the server, which runs the hidden tests too
 * inside an isolated V8 (brief §7.5). That matters twice over: the hidden tests never reach the
 * browser, and this worker runs the learner's own code in their own tab, so it is not a place
 * where a score could be forged.
 */

export const RUN_TIMEOUT_MS = 3000;

export interface TestResult {
  index: number;
  description: string;
  passed: boolean;
  expected: string;
  actual?: string;
  error?: string;
  timedOut?: boolean;
}

export interface LocalRunOutcome {
  results: TestResult[];
  passedCount: number;
  total: number;
  /** passed / total * 100, rounded. */
  score: number;
  /** Set when the code couldn't be loaded at all (syntax error, missing function). */
  compileError?: string;
  timedOut: boolean;
}

// Plain JavaScript on purpose: it's shipped to the worker as source text.
const WORKER_SOURCE = String.raw`
const MARK = "__oyelabs_raw__";

function format(value) {
  if (value === undefined) return "undefined";
  if (typeof value === "function") return "[Function]";
  if (typeof value === "bigint") return value + "n";
  try {
    const json = JSON.stringify(value, (_key, v) => {
      if (v === undefined) return MARK + "undefined";
      if (typeof v === "function") return MARK + "[Function]";
      if (typeof v === "number" && !Number.isFinite(v)) return MARK + String(v);
      return v;
    });
    return json.replace(new RegExp('"' + MARK + '([^"]*)"', "g"), "$1");
  } catch (err) {
    return String(value);
  }
}

function deepEqual(a, b) {
  if (a === b || (a !== a && b !== b)) return true; // treats NaN as equal to NaN
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
}

function describeError(err) {
  if (err && typeof err === "object" && "message" in err) {
    return (err.name ? err.name + ": " : "") + err.message;
  }
  return String(err);
}

const send = self.postMessage.bind(self);

self.onmessage = async (event) => {
  const { code, functionName, testCases } = event.data;
  let fn;
  try {
    fn = new Function(code + "\n;return typeof " + functionName + ' === "function" ? ' + functionName + " : undefined;")();
  } catch (err) {
    send({ type: "compile-error", message: describeError(err) });
    return;
  }
  if (typeof fn !== "function") {
    send({ type: "compile-error", message: "Couldn't find a function named " + functionName + ". Keep the function name from the starter code." });
    return;
  }
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    try {
      const actual = await fn(...tc.args);
      send({ type: "result", index: i, passed: deepEqual(actual, tc.expected), actual: format(actual), expected: format(tc.expected) });
    } catch (err) {
      send({ type: "result", index: i, passed: false, error: describeError(err), expected: format(tc.expected) });
    }
  }
  send({ type: "done" });
};
`;

type WorkerMessage =
  | { type: "compile-error"; message: string }
  | { type: "result"; index: number; passed: boolean; actual?: string; expected: string; error?: string }
  | { type: "done" };

export function runVisibleTests(
  code: string,
  challenge: ServedCodeChallenge,
  timeoutMs: number = RUN_TIMEOUT_MS,
): Promise<LocalRunOutcome> {
  if (!/^[A-Za-z_$][\w$]*$/.test(challenge.functionName)) {
    throw new Error(`Invalid function name in challenge data: ${challenge.functionName}`);
  }

  return new Promise<LocalRunOutcome>((resolve) => {
    const url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: "text/javascript" }));
    const worker = new Worker(url);
    const received = new Map<number, TestResult>();
    let settled = false;

    const finish = ({ compileError, timedOut = false }: { compileError?: string; timedOut?: boolean }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);

      const results: TestResult[] = challenge.visibleTests.map((tc, index) => {
        const got = received.get(index);
        if (got) return got;
        return {
          index,
          description: tc.description,
          passed: false,
          expected: JSON.stringify(tc.expected),
          timedOut,
          error: compileError
            ? "Not run: the code didn't load."
            : timedOut
              ? `Timed out after ${timeoutMs / 1000} seconds. Look for an infinite loop.`
              : "Not run.",
        };
      });
      const passedCount = results.filter((r) => r.passed).length;
      resolve({
        results,
        passedCount,
        total: results.length,
        score: results.length ? Math.round((passedCount / results.length) * 100) : 0,
        compileError,
        timedOut,
      });
    };

    const timer = setTimeout(() => finish({ timedOut: true }), timeoutMs);

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const msg = event.data;
      if (msg.type === "compile-error") finish({ compileError: msg.message });
      else if (msg.type === "result") {
        received.set(msg.index, {
          index: msg.index,
          description: challenge.visibleTests[msg.index]?.description ?? `Test ${msg.index + 1}`,
          passed: msg.passed,
          expected: msg.expected,
          actual: msg.actual,
          error: msg.error,
        });
      } else if (msg.type === "done") finish({});
    };

    worker.onerror = (event) => {
      event.preventDefault();
      finish({ compileError: event.message || "The code couldn't be run." });
    };

    worker.postMessage({ code, functionName: challenge.functionName, testCases: challenge.visibleTests });
  });
}
