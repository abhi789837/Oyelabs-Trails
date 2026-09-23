import { spawn } from "node:child_process";

import { AiProviderError } from "../types";

/**
 * Runs a CLI with a minimal environment and a hard timeout, and kills the whole process tree if
 * it overruns (brief §15).
 *
 * Two things matter here beyond "run a command":
 *
 * - **The child gets almost nothing.** Only PATH, HOME/USERPROFILE and the variables the caller
 *   passes. The server's own environment holds APP_MASTER_KEY and SESSION_SECRET, and a CLI has
 *   no business seeing them.
 * - **The tree is killed, not the process.** These CLIs spawn children of their own; killing only
 *   the parent leaves them running and holding the credential.
 */
export interface SpawnResult {
  stdout: string;
  stderr: string;
  code: number | null;
}

export interface SpawnOptions {
  command: string;
  args: string[];
  /** Added to the minimal base environment. This is where a credential goes. */
  env?: Record<string, string>;
  cwd?: string;
  input?: string;
  timeoutMs: number;
  maxOutputBytes?: number;
}

const DEFAULT_MAX_OUTPUT = 8 * 1024 * 1024;

function minimalEnv(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  const base: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    USERPROFILE: process.env.USERPROFILE,
    // Windows CLIs commonly need these to resolve anything at all.
    SystemRoot: process.env.SystemRoot,
    TEMP: process.env.TEMP,
    TMP: process.env.TMP,
    // Keep output machine-readable.
    NO_COLOR: "1",
    CI: "1",
  };
  return { ...base, ...extra };
}

/** Redacts anything that looks like a token before an error message is stored or shown. */
export function redact(text: string, secrets: string[]): string {
  let out = text;
  for (const secret of secrets) {
    if (secret && secret.length >= 8) out = out.split(secret).join("[redacted]");
  }
  return out.replace(/\b(sk-[A-Za-z0-9_-]{8,}|sk-ant-[A-Za-z0-9_-]{8,})\b/g, "[redacted]");
}

export function spawnJson(options: SpawnOptions): Promise<SpawnResult> {
  const maxOutput = options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT;

  return new Promise((resolve, reject) => {
    const child = spawn(options.command, options.args, {
      env: minimalEnv(options.env),
      cwd: options.cwd,
      stdio: ["pipe", "pipe", "pipe"],
      // A detached child on POSIX becomes its own process group, so one kill takes the tree.
      // On Windows the same is done with taskkill below.
      detached: process.platform !== "win32",
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    };

    const killTree = () => {
      try {
        if (process.platform === "win32") {
          if (child.pid) spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { windowsHide: true });
        } else if (child.pid) {
          process.kill(-child.pid, "SIGKILL");
        }
      } catch {
        /* already gone */
      }
    };

    const timer = setTimeout(() => {
      killTree();
      finish(() => reject(new AiProviderError(`${options.command} timed out after ${Math.round(options.timeoutMs / 1000)}s.`, undefined, true)));
    }, options.timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      if (stdout.length < maxOutput) stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < maxOutput) stderr += chunk.toString("utf8");
    });

    child.on("error", (error: NodeJS.ErrnoException) => {
      finish(() =>
        reject(
          new AiProviderError(
            error.code === "ENOENT"
              ? `${options.command} is not installed on this machine, or is not on PATH.`
              : `Could not run ${options.command}: ${error.message}`,
          ),
        ),
      );
    });

    child.on("close", (code) => finish(() => resolve({ stdout, stderr, code })));

    if (options.input !== undefined) child.stdin.write(options.input);
    child.stdin.end();
  });
}
