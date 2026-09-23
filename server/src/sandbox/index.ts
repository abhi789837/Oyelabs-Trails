import type { Env } from "../env";
import { IsolatedVmSandbox } from "./isolatedVmSandbox";
import { WorkerSandbox } from "./workerSandbox";
import type { CodeSandbox } from "./types";

export * from "./types";

/**
 * Chooses the sandbox for this environment (brief §2 D13).
 *
 * Production always uses `isolated-vm` and refuses to start without it: grading a submission
 * inside a worker thread would give submitted code the whole Node API. Development prefers
 * isolated-vm too, and only falls back to the worker when the native module is unavailable —
 * which on Windows usually means no C++ toolchain. `DEV_UNSAFE_RUNNER=1` forces the fallback,
 * for working on the grading path without the native build.
 */
export async function createSandbox(env: Env, log?: (message: string) => void): Promise<CodeSandbox> {
  if (env.devUnsafeRunner) {
    if (env.isProduction) {
      throw new Error("DEV_UNSAFE_RUNNER must not be set in production: submitted code would run with full Node access.");
    }
    log?.("code sandbox: worker_threads (DEV_UNSAFE_RUNNER=1) — not a security boundary");
    return new WorkerSandbox();
  }

  try {
    const sandbox = await IsolatedVmSandbox.create();
    log?.("code sandbox: isolated-vm");
    return sandbox;
  } catch (error) {
    if (env.isProduction) throw error;
    log?.(
      `code sandbox: falling back to worker_threads — isolated-vm is unavailable (${
        error instanceof Error ? error.message : String(error)
      }). This is not a security boundary and production will refuse to start this way.`,
    );
    return new WorkerSandbox();
  }
}
