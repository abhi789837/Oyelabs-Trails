import type { SandboxRunResult } from "../../sandbox/types";

/**
 * Running learner code from the lesson ("Try it" on the Read step, "Run" on the Do step).
 *
 * Why on the server: the production Content Security Policy has no 'unsafe-eval', and the browser
 * runner (`src/lib/codeRunner.ts`) builds functions from strings inside a Worker, which the policy
 * blocks in a production build. The server already runs learner code in a locked-down isolate
 * (`app.sandbox`), so a snippet is wrapped as one function whose return value is what it printed.
 */

export const SNIPPET_FN = "__oyeSnippet";
export const SNIPPET_MAX = 20_000;

export function wrapSnippet(code: string): string {
  return `function ${SNIPPET_FN}() {
  const __out = [];
  const __fmt = (v) => {
    if (typeof v === "string") return v;
    if (v === undefined) return "undefined";
    if (typeof v === "function") return "[Function]";
    try { const j = JSON.stringify(v); return j === undefined ? String(v) : j; } catch (e) { return String(v); }
  };
  const __line = (prefix) => (...args) => { if (__out.length < 500) __out.push(prefix + args.map(__fmt).join(" ")); };
  const console = { log: __line(""), info: __line(""), debug: __line(""), warn: __line("Warning: "), error: __line("Error: ") };
  try {
    (function () {
${code}
    })();
  } catch (e) {
    __out.push("Error: " + (e && e.message ? e.message : String(e)));
  }
  return __out.join(String.fromCharCode(10));
}`;
}

export interface SnippetResult {
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export function snippetResult(run: SandboxRunResult): SnippetResult {
  if (run.compileError) return { stdout: "", stderr: run.compileError, timedOut: false };
  if (run.timedOut) return { stdout: "", stderr: "Stopped: it took too long. Look for a loop that never ends.", timedOut: true };
  const outcome = run.outcomes[0];
  if (!outcome) return { stdout: "", stderr: "It didn't run.", timedOut: false };
  if (outcome.error) return { stdout: "", stderr: outcome.error, timedOut: false };
  let text = outcome.actual ?? "";
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed === "string") text = parsed;
  } catch {
    // keep as is
  }
  const lines = text.split("\n");
  const stderr = lines.filter((l) => l.startsWith("Error: ")).join("\n");
  const stdout = lines.filter((l) => !l.startsWith("Error: ")).join("\n");
  return { stdout, stderr, timedOut: false };
}
