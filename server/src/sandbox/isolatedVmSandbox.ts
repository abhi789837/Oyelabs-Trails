import { RUNTIME_SOURCE } from "./runtime";
import { DEFAULT_MEMORY_MB, DEFAULT_TIMEOUT_MS, type CodeSandbox, type SandboxRunInput, type SandboxRunResult } from "./types";

/**
 * Production sandbox (brief §2 D13, §15).
 *
 * Each run gets a fresh V8 isolate with a hard memory limit and no host bindings at all: no
 * `require`, no `process`, no network, no file system, no shared heap with the server. The only
 * things that cross the boundary are two strings — the JSON payload in, the JSON result out.
 *
 * The isolate is created per run rather than pooled. Pooling would be faster, but a submission
 * that leaves a poisoned global (redefining `Array.prototype.map`, say) would then affect the
 * next learner's grade, and correctness matters far more here than the few milliseconds.
 */
export class IsolatedVmSandbox implements CodeSandbox {
  readonly id = "isolated-vm" as const;
  readonly isSecure = true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private constructor(private readonly ivm: any) {}

  static async create(): Promise<IsolatedVmSandbox> {
    try {
      // Imported dynamically so a missing native build is a clear error here rather than a crash
      // at import time, and so the bundler leaves it external.
      const ivm = await import("isolated-vm");
      return new IsolatedVmSandbox((ivm as { default?: unknown }).default ?? ivm);
    } catch (error) {
      throw new Error(
        `isolated-vm could not be loaded, so code submissions cannot be graded safely: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async run(input: SandboxRunInput): Promise<SandboxRunResult> {
    const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const total = input.testCases.length;
    const payload = JSON.stringify({
      code: input.code,
      functionName: input.functionName,
      testCases: input.testCases.map((t) => ({ args: t.args, expected: t.expected })),
    });

    const isolate = new this.ivm.Isolate({ memoryLimit: DEFAULT_MEMORY_MB });
    try {
      const context = await isolate.createContext();
      await context.eval(RUNTIME_SOURCE, { timeout: timeoutMs });

      const json: string = await context.evalClosure("return __runTests($0)", [payload], {
        arguments: { copy: true },
        result: { promise: true, copy: true },
        timeout: timeoutMs,
      });

      const parsed = JSON.parse(json) as Pick<SandboxRunResult, "outcomes" | "compileError">;
      return {
        outcomes: parsed.outcomes,
        passedCount: parsed.outcomes.filter((o) => o.passed).length,
        total,
        timedOut: false,
        ...(parsed.compileError ? { compileError: parsed.compileError } : {}),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // isolated-vm reports both the wall-clock timeout and an out-of-memory isolate disposal
      // through thrown errors, so they are told apart by message.
      const timedOut = /script execution timed out|timed out/i.test(message);
      const outOfMemory = /out of memory|isolate was disposed/i.test(message);
      return {
        outcomes: [],
        passedCount: 0,
        total,
        timedOut,
        ...(timedOut
          ? {}
          : { compileError: outOfMemory ? "The code used too much memory and was stopped." : message }),
      };
    } finally {
      // An out-of-memory isolate has already been disposed by isolated-vm, and disposing twice
      // throws. Cleanup must never mask the result we are about to return.
      try {
        if (!isolate.isDisposed) isolate.dispose();
      } catch {
        /* already gone */
      }
    }
  }
}
