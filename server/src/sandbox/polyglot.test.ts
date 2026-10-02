import { describe, expect, test } from "vitest";

import { PistonClient, runSnippet, runTests, stripTypes } from "./polyglot";
import { WorkerSandbox } from "./workerSandbox";

/**
 * The multi-language runner. JS/TS always run (the worker sandbox stands in for isolated-vm here).
 * The Piston cases run only when a Piston instance answers at PISTON_URL (default the local test
 * container on 127.0.0.1:2000); otherwise they are skipped rather than failing the suite.
 */

const sandbox = new WorkerSandbox();
const pistonUrl = process.env.PISTON_URL ?? "http://127.0.0.1:2000";
const piston = new PistonClient({ url: pistonUrl });
const pistonUp = await fetch(`${pistonUrl}/api/v2/runtimes`, { signal: AbortSignal.timeout(1500) })
  .then((r) => r.ok)
  .catch(() => false);

describe("JavaScript and TypeScript", () => {
  test("TypeScript is stripped, not checked", () => {
    expect(stripTypes("function add(a: number, b: number): number { return a + b }")).toContain("function add(a, b)");
  });

  test("grades a TypeScript function with partial credit", async () => {
    const result = await runTests(
      { sandbox, piston: null },
      {
        language: "typescript",
        mode: "function",
        functionName: "sum",
        code: "function sum(xs: number[]): number { return xs.length ? xs.reduce((a, b) => a + b) : 1 }",
        tests: [
          { args: [[1, 2]], expected: 3 },
          { args: [[]], expected: 0 },
        ],
      },
    );
    expect(result.passedCount).toBe(1);
    expect(result.total).toBe(2);
  });

  test("a non-JS language without Piston says the runner is not configured", async () => {
    await expect(runTests({ sandbox, piston: null }, { language: "python", mode: "function", functionName: "f", code: "def f(): pass", tests: [{ args: [], expected: null }] })).rejects.toThrow(/not configured/);
  });
});

describe.runIf(pistonUp)("Piston languages", () => {
  const deps = { sandbox, piston };

  test("python function mode, hidden tests compared outside the sandbox", async () => {
    const result = await runTests(deps, {
      language: "python",
      mode: "function",
      functionName: "first_even",
      code: "def first_even(xs):\n    print('debug output is fine')\n    return next((x for x in xs if x % 2 == 0), None)",
      tests: [
        { args: [[1, 3, 4]], expected: 4 },
        { args: [[1, 3]], expected: null },
        { args: [[2]], expected: 3 },
      ],
    });
    expect(result.outcomes.map((o) => o.passed)).toEqual([true, true, false]);
  });

  test("php function mode with associative arrays", async () => {
    const result = await runTests(deps, {
      language: "php",
      mode: "function",
      functionName: "countWords",
      code: "<?php\nfunction countWords(string $s): array { $out = []; foreach (explode(' ', trim($s)) as $w) { if ($w === '') continue; $out[$w] = ($out[$w] ?? 0) + 1; } return $out; }",
      tests: [
        { args: ["a b a"], expected: { a: 2, b: 1 } },
        { args: [""], expected: {} },
      ],
    });
    expect(result.passedCount).toBe(2);
  });

  // Retried: a cold JVM can miss the local runner's 3 s run limit while the rest of the suite loads the CPU.
  test("java program mode compares stdout", { retry: 2, timeout: 30_000 }, async () => {
    const code = `import java.util.*;\npublic class Main { public static void main(String[] a) { Scanner s = new Scanner(System.in); int n = s.nextInt(); System.out.println(n * 2); } }`;
    const result = await runTests(deps, { language: "java", mode: "program", functionName: null, code, tests: [{ stdin: "21", expected: "42" }] });
    expect(result.passedCount).toBe(1);
  });

  test("sql mode compares rows", async () => {
    const result = await runTests(deps, {
      language: "sql",
      mode: "sql",
      functionName: null,
      code: "SELECT name FROM users WHERE active = 1 ORDER BY name",
      tests: [{ setup: "CREATE TABLE users(name TEXT, active INT); INSERT INTO users VALUES ('b',1),('a',1),('c',0);", expected: [{ name: "a" }, { name: "b" }] }],
    });
    expect(result.passedCount).toBe(1);
  });

  test("an infinite loop times out instead of hanging", async () => {
    const result = await runTests(deps, { language: "python", mode: "function", functionName: "f", code: "def f():\n    while True: pass", tests: [{ args: [], expected: 1 }], timeoutMs: 1000 });
    expect(result.passedCount).toBe(0);
  }, 20_000);

  test("network is blocked inside a run", async () => {
    const out = await runSnippet(deps, "python", "import urllib.request\ntry:\n    urllib.request.urlopen('http://example.com', timeout=2)\n    print('open')\nexcept Exception as e:\n    print('blocked')");
    expect(out.stdout.trim()).toBe("blocked");
  }, 20_000);
});
