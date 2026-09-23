import { Worker } from "node:worker_threads";

import { RUNTIME_SOURCE } from "./runtime";
import { DEFAULT_MEMORY_MB, DEFAULT_TIMEOUT_MS, type CodeSandbox, type SandboxRunInput, type SandboxRunResult } from "./types";

/**
 * Development fallback (brief §2 D13).
 *
 * A worker thread has its own heap and can be terminated, which handles infinite loops and
 * runaway memory — but it still has the full Node API, so it is NOT a security boundary. It
 * exists so the whole grading path can be developed and tested on Windows, where `isolated-vm`
 * needs a C++ toolchain that is often absent. `createSandbox` refuses to select it in production.
 */
const WORKER_SOURCE = `
const { parentPort, workerData } = require("node:worker_threads");

// Make the obvious host capabilities unreachable from submitted code. This is defence in depth,
// not isolation: a determined escape is still possible, which is why production uses isolated-vm.
process.env = {};
globalThis.process = undefined;
globalThis.require = undefined;
globalThis.module = undefined;
globalThis.__dirname = undefined;
globalThis.__filename = undefined;

${RUNTIME_SOURCE}

__runTests(workerData)
  .then((json) => parentPort.postMessage({ ok: true, json }))
  .catch((err) => parentPort.postMessage({ ok: false, message: err && err.message ? err.message : String(err) }));
`;

export class WorkerSandbox implements CodeSandbox {
  readonly id = "worker-threads" as const;
  readonly isSecure = false;

  run(input: SandboxRunInput): Promise<SandboxRunResult> {
    const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const total = input.testCases.length;

    return new Promise((resolve) => {
      const payload = JSON.stringify({
        code: input.code,
        functionName: input.functionName,
        testCases: input.testCases.map((t) => ({ args: t.args, expected: t.expected })),
      });

      const worker = new Worker(WORKER_SOURCE, {
        eval: true,
        workerData: payload,
        resourceLimits: { maxOldGenerationSizeMb: DEFAULT_MEMORY_MB, maxYoungGenerationSizeMb: 32 },
        // An empty stdin and discarded output: a submission printing megabytes must not reach the log.
        stdin: false,
        stdout: true,
        stderr: true,
      });

      let settled = false;
      const finish = (result: SandboxRunResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        void worker.terminate();
        resolve(result);
      };

      const timer = setTimeout(
        () =>
          finish({
            outcomes: [],
            passedCount: 0,
            total,
            timedOut: true,
          }),
        timeoutMs,
      );

      worker.on("message", (message: { ok: boolean; json?: string; message?: string }) => {
        if (!message.ok) {
          finish({ outcomes: [], passedCount: 0, total, timedOut: false, compileError: message.message });
          return;
        }
        const parsed = JSON.parse(message.json!) as Pick<SandboxRunResult, "outcomes" | "compileError">;
        finish({
          outcomes: parsed.outcomes,
          passedCount: parsed.outcomes.filter((o) => o.passed).length,
          total,
          timedOut: false,
          ...(parsed.compileError ? { compileError: parsed.compileError } : {}),
        });
      });

      worker.on("error", (error: Error) => {
        // A thrown-out-of-memory or a hard crash lands here rather than as a message.
        finish({ outcomes: [], passedCount: 0, total, timedOut: false, compileError: error.message });
      });

      worker.on("exit", (code) => {
        if (!settled) {
          finish({ outcomes: [], passedCount: 0, total, timedOut: false, compileError: `The runner exited unexpectedly (code ${code}).` });
        }
      });
    });
  }
}
