import type { ServedCodeChallenge } from "@shared/content";

import { startSandboxedRun } from "./sandboxRunner";

/*
 * Runs a learner's own code in the browser, in a throwaway Web Worker inside the isolated runner
 * frame (`./sandboxRunner`, `public/runner.html`). The app's own page never evaluates it: the
 * production CSP has no `'unsafe-eval'`, and a Blob worker made here would inherit that policy.
 *
 * Two jobs:
 * - **Tests**: the named function against VISIBLE tests (topic challenges, and v4 JS/TS assessment
 *   items once the server has counted the run). Fast feedback only.
 * - **Snippets**: a v4 MCQ's code, run as a script with `console.*` captured, so the learner can
 *   see what it prints.
 *
 * It decides nothing. The verdict comes from the server, which runs the hidden tests too. The worker
 * runs the learner's own code in their own tab, so it is not a place where a score could be forged.
 *
 * TypeScript is stripped with sucrase on the main thread before the code reaches the worker (types
 * removed, nothing type-checked — exactly what a test run needs). Sucrase is loaded on demand so it
 * never weighs on a page that only runs JavaScript.
 */

export const RUN_TIMEOUT_MS = 3000;
/** A snippet waits this long for its timers and promises to settle before it is cut off. */
export const SNIPPET_TIMEOUT_MS = 3000;

export type BrowserLanguage = "javascript" | "typescript";

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
  /** What the code wrote with `console.*` while the tests ran. */
  logs: string;
}

export interface SnippetOutcome {
  stdout: string;
  stderr: string;
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
  // Same tolerance as the server's grader, so Run and Submit agree on 0.1 + 0.2.
  if (typeof a === "number" && typeof b === "number" && isFinite(a) && isFinite(b)) {
    return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
  }
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

// console.* is captured and streamed back, so a learner sees what their code printed.
function show(value) {
  return typeof value === "string" ? value : format(value);
}
for (const [method, stream] of [["log", "stdout"], ["info", "stdout"], ["debug", "stdout"], ["table", "stdout"], ["warn", "stderr"], ["error", "stderr"]]) {
  console[method] = (...args) => send({ type: "log", stream, text: args.map(show).join(" ") });
}

// Timers are counted so a snippet run waits for its setTimeout callbacks before it reports done.
const realSetTimeout = self.setTimeout.bind(self);
const realClearTimeout = self.clearTimeout.bind(self);
const pending = new Set();
self.setTimeout = (fn, ms, ...rest) => {
  const id = realSetTimeout(() => {
    pending.delete(id);
    if (typeof fn === "function") fn(...rest);
  }, ms);
  pending.add(id);
  return id;
};
self.clearTimeout = (id) => {
  pending.delete(id);
  realClearTimeout(id);
};
const tick = () => new Promise((resolve) => realSetTimeout(resolve, 0));

self.onerror = (message) => {
  send({ type: "log", stream: "stderr", text: "Uncaught " + message });
  return true;
};
self.onunhandledrejection = (event) => {
  send({ type: "log", stream: "stderr", text: "Uncaught (in promise) " + describeError(event.reason) });
};

async function runSnippet(code) {
  const AsyncFunction = (async function () {}).constructor;
  let fn;
  try {
    fn = new AsyncFunction(code);
  } catch (err) {
    send({ type: "log", stream: "stderr", text: describeError(err) });
    send({ type: "done" });
    return;
  }
  try {
    await fn();
  } catch (err) {
    send({ type: "log", stream: "stderr", text: "Uncaught " + describeError(err) });
  }
  // Let pending timers and promise chains finish; the main thread cuts this off at its timeout.
  await tick();
  while (pending.size > 0) await tick();
  await tick();
  send({ type: "done" });
}

async function runTests(code, functionName, testCases) {
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
}

self.onmessage = (event) => {
  const data = event.data;
  if (data.mode === "snippet") void runSnippet(data.code);
  else void runTests(data.code, data.functionName, data.testCases);
};
`;

type WorkerMessage =
  | { type: "compile-error"; message: string }
  | { type: "result"; index: number; passed: boolean; actual?: string; expected: string; error?: string }
  | { type: "log"; stream: "stdout" | "stderr"; text: string }
  | { type: "done" };

/** Strips TypeScript syntax. Throws the transform's own message on a syntax error. */
export async function toRunnableJs(code: string, language: BrowserLanguage = "javascript"): Promise<string> {
  if (language !== "typescript") return code;
  const { transform } = await import("sucrase");
  return transform(code, { transforms: ["typescript"], disableESTransforms: true }).code;
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export interface BrowserTestSpec {
  functionName: string;
  tests: { args: unknown[]; expected: unknown; description?: string }[];
  language?: BrowserLanguage;
}

/** Runs the named function against the given tests. Never rejects. */
export async function runBrowserTests(code: string, spec: BrowserTestSpec, timeoutMs: number = RUN_TIMEOUT_MS): Promise<LocalRunOutcome> {
  if (!/^[A-Za-z_$][\w$]*$/.test(spec.functionName)) {
    throw new Error(`Invalid function name in challenge data: ${spec.functionName}`);
  }
  const describeTest = (index: number) => spec.tests[index]?.description ?? `Example ${index + 1}`;

  let source: string;
  try {
    source = await toRunnableJs(code, spec.language);
  } catch (error) {
    const compileError = describe(error);
    const results = spec.tests.map((tc, index) => ({
      index,
      description: describeTest(index),
      passed: false,
      expected: JSON.stringify(tc.expected),
      error: "Not run: the code didn't compile.",
    }));
    return { results, passedCount: 0, total: results.length, score: 0, compileError, timedOut: false, logs: "" };
  }

  return new Promise<LocalRunOutcome>((resolve) => {
    const received = new Map<number, TestResult>();
    const logs: string[] = [];
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let dispose = () => {};

    const finish = ({ compileError, timedOut = false }: { compileError?: string; timedOut?: boolean }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      dispose();

      const results: TestResult[] = spec.tests.map((tc, index) => {
        const got = received.get(index);
        if (got) return got;
        return {
          index,
          description: describeTest(index),
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
        logs: logs.join("\n"),
      });
    };

    const onMessage = (msg: WorkerMessage) => {
      if (!msg || typeof msg !== "object") return;
      if (msg.type === "compile-error") finish({ compileError: msg.message });
      else if (msg.type === "log") {
        if (logs.length < 200) logs.push(msg.text);
      } else if (msg.type === "result") {
        received.set(msg.index, {
          index: msg.index,
          description: describeTest(msg.index),
          passed: msg.passed,
          expected: msg.expected,
          actual: msg.actual,
          error: msg.error,
        });
      } else if (msg.type === "done") finish({});
    };

    dispose = startSandboxedRun({
      source: WORKER_SOURCE,
      payload: { mode: "tests", code: source, functionName: spec.functionName, testCases: spec.tests },
      // The clock starts once the runner frame is up, so a slow first load doesn't eat the budget.
      onReady: () => {
        timer = setTimeout(() => finish({ timedOut: true }), timeoutMs);
      },
      onMessage: (msg) => onMessage(msg as WorkerMessage),
      onError: (message) => finish({ compileError: message }),
    });
    if (settled) dispose();
  });
}

/** Topic code challenges: the visible tests, JavaScript. Kept for `CodeRunner` and the legacy runner. */
export function runVisibleTests(
  code: string,
  challenge: ServedCodeChallenge,
  timeoutMs: number = RUN_TIMEOUT_MS,
): Promise<LocalRunOutcome> {
  return runBrowserTests(code, { functionName: challenge.functionName, tests: challenge.visibleTests }, timeoutMs);
}

/** Runs a script with no tests and returns what it printed. Never rejects. */
export async function runBrowserSnippet(
  code: string,
  language: BrowserLanguage = "javascript",
  timeoutMs: number = SNIPPET_TIMEOUT_MS,
): Promise<SnippetOutcome> {
  let source: string;
  try {
    source = await toRunnableJs(code, language);
  } catch (error) {
    return { stdout: "", stderr: describe(error), timedOut: false };
  }

  return new Promise<SnippetOutcome>((resolve) => {
    const stdout: string[] = [];
    const stderr: string[] = [];
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let dispose = () => {};

    const finish = (timedOut: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      dispose();
      if (timedOut) stderr.push(`Stopped after ${timeoutMs / 1000} seconds.`);
      resolve({ stdout: stdout.join("\n"), stderr: stderr.join("\n"), timedOut });
    };

    dispose = startSandboxedRun({
      source: WORKER_SOURCE,
      payload: { mode: "snippet", code: source },
      onReady: () => {
        timer = setTimeout(() => finish(true), timeoutMs);
      },
      onMessage: (raw) => {
        const msg = raw as WorkerMessage;
        if (!msg || typeof msg !== "object") return;
        if (msg.type === "log") {
          const target = msg.stream === "stderr" ? stderr : stdout;
          if (target.length < 500) target.push(msg.text);
        } else if (msg.type === "done") finish(false);
      },
      onError: (message) => {
        stderr.push(message);
        finish(false);
      },
    });
    if (settled) dispose();
  });
}
