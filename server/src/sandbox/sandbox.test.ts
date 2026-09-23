import { describe, expect, test } from "vitest";

import { IsolatedVmSandbox } from "./isolatedVmSandbox";
import { WorkerSandbox } from "./workerSandbox";
import type { CodeSandbox } from "./types";

/**
 * Both sandboxes share one runtime source, so they must grade identically. Running the same suite
 * against each is what keeps "passes in development" and "passes in production" the same claim.
 */
const implementations: { name: string; create: () => Promise<CodeSandbox> }[] = [
  { name: "worker-threads", create: async () => new WorkerSandbox() },
  { name: "isolated-vm", create: () => IsolatedVmSandbox.create() },
];

for (const { name, create } of implementations) {
  describe(name, () => {
    test("passes a correct solution against every test", async () => {
      const sandbox = await create();
      const result = await sandbox.run({
        code: "function add(a, b) { return a + b; }",
        functionName: "add",
        testCases: [
          { args: [1, 2], expected: 3, description: "adds" },
          { args: [-1, 1], expected: 0, description: "handles negatives" },
          { args: [0, 0], expected: 0, description: "zero" },
        ],
      });
      expect(result.compileError).toBeUndefined();
      expect(result.passedCount).toBe(3);
      expect(result.total).toBe(3);
      expect(result.timedOut).toBe(false);
    });

    test("reports which tests failed, with formatted values", async () => {
      const sandbox = await create();
      const result = await sandbox.run({
        code: "function add(a, b) { return a - b; }",
        functionName: "add",
        testCases: [
          { args: [1, 2], expected: 3, description: "adds" },
          { args: [5, 5], expected: 0, description: "equal values happen to pass" },
        ],
      });
      expect(result.passedCount).toBe(1);
      expect(result.outcomes[0].passed).toBe(false);
      expect(result.outcomes[0].expected).toBe("3");
      expect(result.outcomes[0].actual).toBe("-1");
    });

    test("compares deeply, ignoring key order", async () => {
      const sandbox = await create();
      const result = await sandbox.run({
        code: "function build() { return { b: [1, { c: 2 }], a: 'x' }; }",
        functionName: "build",
        testCases: [{ args: [], expected: { a: "x", b: [1, { c: 2 }] }, description: "deep equal" }],
      });
      expect(result.passedCount).toBe(1);
    });

    test("awaits an async solution", async () => {
      const sandbox = await create();
      const result = await sandbox.run({
        code: "async function later(x) { return Promise.resolve(x * 2); }",
        functionName: "later",
        testCases: [{ args: [21], expected: 42, description: "resolves" }],
      });
      expect(result.passedCount).toBe(1);
    });

    test("a syntax error is a compile error, not a crash", async () => {
      const sandbox = await create();
      const result = await sandbox.run({
        code: "function broken( { return 1 }",
        functionName: "broken",
        testCases: [{ args: [], expected: 1, description: "never runs" }],
      });
      expect(result.compileError).toBeTruthy();
      expect(result.passedCount).toBe(0);
    });

    test("a missing function names what was expected", async () => {
      const sandbox = await create();
      const result = await sandbox.run({
        code: "function somethingElse() { return 1; }",
        functionName: "expected",
        testCases: [{ args: [], expected: 1, description: "never runs" }],
      });
      expect(result.compileError).toMatch(/expected/);
    });

    test("a thrown error fails only that test", async () => {
      const sandbox = await create();
      const result = await sandbox.run({
        code: "function f(x) { if (x === 0) throw new RangeError('nope'); return x; }",
        functionName: "f",
        testCases: [
          { args: [1], expected: 1, description: "fine" },
          { args: [0], expected: 0, description: "throws" },
        ],
      });
      expect(result.passedCount).toBe(1);
      expect(result.outcomes[1].error).toMatch(/RangeError: nope/);
    });

    test("an infinite loop is stopped by the timeout", async () => {
      const sandbox = await create();
      const result = await sandbox.run({
        code: "function spin() { while (true) {} }",
        functionName: "spin",
        testCases: [{ args: [], expected: 1, description: "never returns" }],
        timeoutMs: 1000,
      });
      expect(result.timedOut).toBe(true);
      expect(result.passedCount).toBe(0);
    }, 20_000);

    test("undefined, NaN and Infinity format readably instead of vanishing", async () => {
      const sandbox = await create();
      const result = await sandbox.run({
        code: "function f(k) { return { u: undefined, n: NaN, i: Infinity }[k]; }",
        functionName: "f",
        testCases: [
          { args: ["u"], expected: null, description: "undefined vs null" },
          { args: ["n"], expected: null, description: "NaN vs null" },
        ],
      });
      expect(result.outcomes[0].actual).toBe("undefined");
      expect(result.outcomes[1].actual).toBe("NaN");
    });

    test("NaN equals NaN, so a NaN-returning solution can pass", async () => {
      const sandbox = await create();
      const result = await sandbox.run({
        code: "function f() { return NaN; }",
        functionName: "f",
        testCases: [{ args: [], expected: Number.NaN, description: "NaN" }],
      });
      // JSON cannot carry NaN, so the expected value arrives as null and this must NOT pass.
      // The check exists to pin the behaviour: challenges must not use NaN as an expected value.
      expect(result.outcomes[0].passed).toBe(false);
    });
  });
}

describe("isolated-vm isolation", () => {
  test("submitted code cannot reach the host: no require, no process, no fetch", async () => {
    const sandbox = await IsolatedVmSandbox.create();
    const result = await sandbox.run({
      code: `function probe() {
        return [
          typeof require,
          typeof process,
          typeof fetch,
          typeof globalThis.Buffer,
          typeof globalThis.setTimeout,
        ].join(",");
      }`,
      functionName: "probe",
      testCases: [{ args: [], expected: "undefined,undefined,undefined,undefined,undefined", description: "no host bindings" }],
    });
    expect(result.outcomes[0].actual).toBe('"undefined,undefined,undefined,undefined,undefined"');
    expect(result.passedCount).toBe(1);
  });

  test("one submission cannot poison the next one's globals", async () => {
    const sandbox = await IsolatedVmSandbox.create();
    await sandbox.run({
      code: "function poison() { Array.prototype.map = function () { return 'hacked'; }; return 1; }",
      functionName: "poison",
      testCases: [{ args: [], expected: 1, description: "poisons" }],
    });
    const after = await sandbox.run({
      code: "function clean() { return [1, 2].map((n) => n * 2); }",
      functionName: "clean",
      testCases: [{ args: [], expected: [2, 4], description: "unaffected" }],
    });
    expect(after.passedCount).toBe(1);
  });

  test("allocating far beyond the memory limit is stopped, not fatal to the process", async () => {
    const sandbox = await IsolatedVmSandbox.create();
    const result = await sandbox.run({
      code: "function hog() { const a = []; for (;;) a.push(new Array(1e6).fill('x')); }",
      functionName: "hog",
      testCases: [{ args: [], expected: 1, description: "never returns" }],
      timeoutMs: 4000,
    });
    expect(result.passedCount).toBe(0);
    expect(result.timedOut || Boolean(result.compileError)).toBe(true);
  }, 30_000);
});
