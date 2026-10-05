import { transform } from "sucrase";

import type { CodingMode, CodeTest, FunctionTest, ProgramTest, SqlTest } from "../../../shared/bank";
import type { SandboxLanguage } from "../../../shared/catalog";
import { looselyEqual } from "../../../shared/scoring";
import { deepEqual, formatValue } from "./compare";
import type { CodeSandbox, SandboxRunResult, SandboxTestOutcome } from "./types";

/**
 * Runs code in any assessment language and grades it against tests (v4 Phase 4).
 *
 * JavaScript and TypeScript `function` items run in the existing isolated-vm sandbox (TypeScript
 * is stripped to JavaScript with sucrase first — no type checking, which a 1–2 minute question
 * does not need). Everything else runs in Piston, a separate container with no network.
 *
 * Expected values never enter the sandbox: test inputs go in on stdin, the harness prints one
 * marked JSON line per case, and comparison happens here.
 */

export interface PistonConfig {
  url: string;
  /** Per-run ceiling. Must not exceed the Piston server's own PISTON_RUN_TIMEOUT (default 3000). */
  runTimeoutMs?: number;
  /** Must not exceed PISTON_COMPILE_TIMEOUT (default 10000). Java compiles in about a second. */
  compileTimeoutMs?: number;
}

export class SandboxUnavailableError extends Error {
  constructor(message = "The code runner is not available right now.") {
    super(message);
    this.name = "SandboxUnavailableError";
  }
}

const MARK = "\u001eOYL";
const PISTON_LANGUAGE: Partial<Record<SandboxLanguage, string>> = {
  python: "python",
  php: "php",
  java: "java",
  dart: "dart",
  sql: "sqlite3",
  javascript: "javascript",
  typescript: "typescript",
};
const FILE_NAME: Partial<Record<SandboxLanguage, string>> = {
  python: "main.py",
  php: "main.php",
  java: "Main.java",
  dart: "main.dart",
  sql: "main.sql",
  javascript: "main.js",
  typescript: "main.ts",
};

export interface PistonResponse {
  run?: { stdout: string; stderr: string; code: number | null; signal: string | null; status?: string | null; message?: string | null };
  compile?: { stdout: string; stderr: string; code: number | null; status?: string | null };
  message?: string;
}

export class PistonClient {
  private versions: Map<string, string> | null = null;

  constructor(private readonly config: PistonConfig) {}

  private async runtimes(): Promise<Map<string, string>> {
    if (this.versions) return this.versions;
    const response = await fetch(`${this.config.url}/api/v2/runtimes`, { signal: AbortSignal.timeout(5000) }).catch(() => null);
    if (!response?.ok) throw new SandboxUnavailableError();
    const list = (await response.json()) as { language: string; version: string }[];
    this.versions = new Map(list.map((r) => [r.language, r.version]));
    return this.versions;
  }

  async available(language: SandboxLanguage): Promise<boolean> {
    const name = PISTON_LANGUAGE[language];
    if (!name) return false;
    try {
      return (await this.runtimes()).has(name);
    } catch {
      return false;
    }
  }

  /**
   * Runs once, and once more if the run timed out having printed nothing: on a busy runner a JVM
   * start alone can eat the budget, and marking a learner's correct Java wrong for that is worse
   * than a second try. A genuine infinite loop times out twice and is reported as such.
   */
  async execute(language: SandboxLanguage, source: string, stdin: string, timeoutMs?: number): Promise<PistonResponse> {
    const first = await this.executeOnce(language, source, stdin, timeoutMs);
    const timedOutEmpty = (first.run?.status === "TO" || first.run?.signal === "SIGKILL") && !(first.run?.stdout ?? "").trim();
    return timedOutEmpty ? this.executeOnce(language, source, stdin, timeoutMs) : first;
  }

  private async executeOnce(language: SandboxLanguage, source: string, stdin: string, timeoutMs?: number): Promise<PistonResponse> {
    const name = PISTON_LANGUAGE[language];
    if (!name) throw new SandboxUnavailableError(`${language} cannot run in the code runner.`);
    const version = (await this.runtimes()).get(name);
    if (!version) throw new SandboxUnavailableError(`${language} is not installed in the code runner.`);
    const ceiling = this.config.runTimeoutMs ?? 3000;
    const runTimeout = Math.min(timeoutMs ?? ceiling, ceiling);
    const response = await fetch(`${this.config.url}/api/v2/execute`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        language: name,
        version,
        files: [{ name: FILE_NAME[language], content: source }],
        stdin,
        run_timeout: runTimeout,
        compile_timeout: this.config.compileTimeoutMs ?? 10_000,
        run_memory_limit: 256 * 1024 * 1024,
      }),
      signal: AbortSignal.timeout(runTimeout + 20_000),
    }).catch((error: unknown) => {
      throw new SandboxUnavailableError(`The code runner did not answer (${error instanceof Error ? error.message : String(error)}).`);
    });
    if (!response.ok) throw new SandboxUnavailableError(`The code runner refused the run (${response.status}).`);
    return (await response.json()) as PistonResponse;
  }
}

// ---------------------------------------------------------------------------
// Harnesses
// ---------------------------------------------------------------------------

function pythonHarness(code: string, fn: string): string {
  return `${code}

import json as __json, sys as __sys
def __oyl_main():
    __cases = __json.loads(__sys.stdin.read() or "[]")
    for __i, __args in enumerate(__cases):
        try:
            __got = ${fn}(*__args)
            print("${MARK}" + __json.dumps({"i": __i, "got": __got}, default=str))
        except Exception as __e:
            print("${MARK}" + __json.dumps({"i": __i, "error": type(__e).__name__ + ": " + str(__e)}))
__oyl_main()
`;
}

function phpHarness(code: string, fn: string): string {
  const body = code.replace(/^\s*<\?php/, "").replace(/\?>\s*$/, "");
  return `<?php
${body}

$__cases = json_decode(stream_get_contents(STDIN) ?: "[]", true);
foreach ($__cases as $__i => $__args) {
  try {
    $__got = ${fn}(...$__args);
    echo "${MARK}" . json_encode(["i" => $__i, "got" => $__got]) . "\\n";
  } catch (\\Throwable $__e) {
    echo "${MARK}" . json_encode(["i" => $__i, "error" => get_class($__e) . ": " . $__e->getMessage()]) . "\\n";
  }
}
`;
}

/** TypeScript to plain JavaScript. Types are erased, not checked. */
export function stripTypes(code: string): string {
  return transform(code, { transforms: ["typescript"], disableESTransforms: true }).code;
}

// ---------------------------------------------------------------------------
// Running and grading
// ---------------------------------------------------------------------------

export interface CodeRunRequest {
  language: SandboxLanguage;
  mode: CodingMode;
  code: string;
  functionName: string | null;
  tests: CodeTest[];
  timeoutMs?: number;
}

export interface PolyglotDeps {
  sandbox: CodeSandbox;
  piston: PistonClient | null;
}

function emptyResult(total: number, compileError: string): SandboxRunResult {
  return { outcomes: [], passedCount: 0, total, compileError, timedOut: false };
}

function finish(outcomes: SandboxTestOutcome[], total: number, extra: Partial<SandboxRunResult> = {}): SandboxRunResult {
  return { outcomes, passedCount: outcomes.filter((o) => o.passed).length, total, timedOut: false, ...extra };
}

function errorText(response: PistonResponse): string | null {
  if (response.compile && response.compile.code !== 0 && response.compile.code !== null) {
    return (response.compile.stderr || response.compile.stdout || "Compilation failed").slice(0, 2000);
  }
  return null;
}

function needPiston(deps: PolyglotDeps): PistonClient {
  if (!deps.piston) throw new SandboxUnavailableError("The code runner is not configured (PISTON_URL).");
  return deps.piston;
}

/** Grades code against tests. Throws `SandboxUnavailableError` only when a run could not happen at all. */
export async function runTests(deps: PolyglotDeps, request: CodeRunRequest): Promise<SandboxRunResult> {
  const { language, mode, tests } = request;
  if (tests.length === 0) return finish([], 0);

  if (mode === "function" && (language === "javascript" || language === "typescript")) {
    let code = request.code;
    if (language === "typescript") {
      try {
        code = stripTypes(code);
      } catch (error) {
        return emptyResult(tests.length, error instanceof Error ? error.message : String(error));
      }
    }
    const cases = (tests as FunctionTest[]).map((t, i) => ({ args: t.args, expected: t.expected, description: `Test ${i + 1}` }));
    return deps.sandbox.run({ code, functionName: request.functionName!, testCases: cases, timeoutMs: request.timeoutMs });
  }

  const piston = needPiston(deps);

  if (mode === "function") {
    const fn = request.functionName!;
    const source = language === "python" ? pythonHarness(request.code, fn) : language === "php" ? phpHarness(request.code, fn) : null;
    if (!source) return emptyResult(tests.length, `${language} items must use program mode.`);
    const response = await piston.execute(language, source, JSON.stringify((tests as FunctionTest[]).map((t) => t.args)), request.timeoutMs);
    const compileError = errorText(response);
    if (compileError) return emptyResult(tests.length, compileError);
    const lines = new Map<number, { got?: unknown; error?: string }>();
    for (const line of (response.run?.stdout ?? "").split("\n")) {
      const at = line.indexOf(MARK);
      if (at < 0) continue;
      try {
        const parsed = JSON.parse(line.slice(at + MARK.length)) as { i: number; got?: unknown; error?: string };
        lines.set(parsed.i, parsed);
      } catch {
        // A learner's own print that happens to contain the marker; ignore it.
      }
    }
    const timedOut = response.run?.status === "TO";
    const outcomes = (tests as FunctionTest[]).map((test, index): SandboxTestOutcome => {
      const line = lines.get(index);
      if (!line) {
        const stderr = (response.run?.stderr ?? "").trim().split("\n").slice(-3).join("\n");
        return { index, passed: false, expected: formatValue(test.expected), error: timedOut ? "Timed out" : stderr || "No result" };
      }
      if (line.error) return { index, passed: false, expected: formatValue(test.expected), error: line.error };
      return { index, passed: deepEqual(line.got, test.expected), expected: formatValue(test.expected), actual: formatValue(line.got) };
    });
    return finish(outcomes, tests.length, { timedOut });
  }

  if (mode === "program") {
    const outcomes: SandboxTestOutcome[] = [];
    let timedOut = false;
    for (const [index, test] of (tests as ProgramTest[]).entries()) {
      const response = await piston.execute(language, request.code, test.stdin, request.timeoutMs);
      const compileError = errorText(response);
      if (compileError) return emptyResult(tests.length, compileError);
      if (response.run?.status === "TO") timedOut = true;
      const actual = (response.run?.stdout ?? "").replace(/\r\n/g, "\n").trimEnd();
      const expected = test.expected.replace(/\r\n/g, "\n").trimEnd();
      const stderr = (response.run?.stderr ?? "").trim();
      // v4.4: printed output matches leniently: whitespace runs, trailing spaces and number formats
      // ("2.50" vs "2.5", "1,000" vs "1000") never make a right answer wrong.
      const passed = looselyEqual(actual, expected);
      outcomes.push({
        index,
        passed,
        expected,
        actual,
        ...(!passed && stderr ? { error: stderr.split("\n").slice(-3).join("\n") } : {}),
      });
    }
    return finish(outcomes, tests.length, { timedOut });
  }

  // sql
  const outcomes: SandboxTestOutcome[] = [];
  for (const [index, test] of (tests as SqlTest[]).entries()) {
    const script = `${test.setup.trim()}\n.mode json\n${request.code.trim().replace(/;?\s*$/, ";")}\n`;
    const response = await piston.execute("sql", script, "", request.timeoutMs);
    const stdout = (response.run?.stdout ?? "").trim();
    const stderr = (response.run?.stderr ?? "").trim();
    let rows: unknown = [];
    let parseError: string | null = null;
    if (stdout) {
      try {
        rows = JSON.parse(stdout);
      } catch {
        parseError = "The query did not return rows.";
      }
    }
    const error = stderr || parseError;
    outcomes.push({
      index,
      passed: !error && deepEqual(rows, test.expected),
      expected: formatValue(test.expected),
      actual: formatValue(rows),
      ...(error ? { error: error.split("\n").slice(-3).join("\n") } : {}),
    });
  }
  return finish(outcomes, tests.length);
}

/** Runs a snippet with no tests (an MCQ's "try it" code) and returns what it printed. */
export async function runSnippet(deps: PolyglotDeps, language: SandboxLanguage, code: string): Promise<{ stdout: string; stderr: string; timedOut: boolean }> {
  const piston = needPiston(deps);
  const response = await piston.execute(language, language === "sql" ? `.mode json\n${code}` : code, "");
  const compileError = errorText(response);
  return {
    stdout: (response.run?.stdout ?? "").slice(0, 8000),
    stderr: (compileError ?? response.run?.stderr ?? "").slice(0, 4000),
    timedOut: response.run?.status === "TO",
  };
}
