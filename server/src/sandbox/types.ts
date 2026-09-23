export interface SandboxTestCase {
  args: unknown[];
  expected: unknown;
  description: string;
  isEdgeCase?: boolean;
}

export interface SandboxTestOutcome {
  index: number;
  passed: boolean;
  /** Formatted for display. Only surfaced to the learner for visible tests. */
  expected: string;
  actual?: string;
  error?: string;
}

export interface SandboxRunResult {
  outcomes: SandboxTestOutcome[];
  passedCount: number;
  total: number;
  /** Set when the code could not be loaded at all: a syntax error or a missing function. */
  compileError?: string;
  timedOut: boolean;
}

export interface SandboxRunInput {
  code: string;
  functionName: string;
  testCases: SandboxTestCase[];
  timeoutMs?: number;
}

/**
 * Runs learner-written JavaScript against a challenge's tests.
 *
 * Two implementations exist (brief §2 D13): `isolated-vm` for production, which is a real V8
 * isolate with a memory cap and no host bindings, and a `worker_threads` fallback for local
 * development on Windows, where isolated-vm needs a toolchain that may not be present. The
 * fallback is not a security boundary and refuses to load in production.
 */
export interface CodeSandbox {
  readonly id: "isolated-vm" | "worker-threads";
  /** True when this implementation is safe for untrusted input. */
  readonly isSecure: boolean;
  run(input: SandboxRunInput): Promise<SandboxRunResult>;
  dispose?(): Promise<void>;
}

export const DEFAULT_TIMEOUT_MS = 5000;
export const DEFAULT_MEMORY_MB = 128;
