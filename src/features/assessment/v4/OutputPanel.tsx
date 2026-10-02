import { CircleCheck, CircleX, Clock } from "lucide-react";

import type { RunTestOutcome, SampleTest } from "@shared/assessmentV4";

import { cn } from "@/lib/utils";

/** One run's result, whichever side ran it. */
export type RunOutput =
  | {
      kind: "tests";
      outcomes: RunTestOutcome[];
      passedCount: number;
      total: number;
      compileError?: string;
      timedOut: boolean;
      logs?: string;
    }
  | { kind: "snippet"; stdout: string; stderr: string; timedOut: boolean };

/** JSON, so a string argument reads as "hi" rather than hi. */
function show(value: unknown): string {
  if (value === undefined) return "undefined";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/** "Expected": the visible sample tests, in their mode's shape. */
export function SampleTests({ tests, functionName }: { tests: SampleTest[]; functionName: string | null }) {
  if (!tests.length) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold">Expected</h3>
      <ul className="mt-2 space-y-2">
        {tests.map((test, index) => (
          <li key={index} className="rounded-md border bg-surface-sunken/60 px-3 py-2 font-mono text-xs leading-relaxed">
            <span className="mr-2 text-muted-foreground">Example {index + 1}</span>
            {"args" in test ? (
              <span className="break-all">
                {functionName ?? "fn"}({test.args.map(show).join(", ")}) <span aria-label="returns">→</span>{" "}
                <span className="font-semibold">{show(test.expected)}</span>
              </span>
            ) : "stdin" in test ? (
              <span className="mt-1 grid gap-1 sm:grid-cols-2">
                <span>
                  <span className="block text-muted-foreground">Input</span>
                  <pre className="whitespace-pre-wrap break-all">{test.stdin || "(none)"}</pre>
                </span>
                <span>
                  <span className="block text-muted-foreground">Output</span>
                  <pre className="whitespace-pre-wrap break-all font-semibold">{test.expected}</pre>
                </span>
              </span>
            ) : (
              <span className="mt-1 block">
                <details>
                  <summary className="cursor-pointer text-muted-foreground">Setup SQL</summary>
                  <pre className="mt-1 whitespace-pre-wrap break-all">{test.setup}</pre>
                </details>
                <span className="mt-1 block text-muted-foreground">Rows</span>
                <pre className="whitespace-pre-wrap break-all font-semibold">{test.expected.map(show).join("\n")}</pre>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** What a Run produced: per-test pass/fail with expected and actual, or a snippet's stdout/stderr. */
export function OutputPanel({ output, running }: { output: RunOutput | null; running: boolean }) {
  return (
    <section aria-label="Output" aria-live="polite" aria-busy={running} className="rounded-md border">
      <h3 className="border-b bg-surface-sunken/60 px-3 py-1.5 font-mono text-xs text-muted-foreground">Output</h3>
      <div className="px-3 py-2.5 text-sm">
        {running ? (
          <p className="text-muted-foreground">Running…</p>
        ) : !output ? (
          <p className="text-muted-foreground">Run your code to see the result here.</p>
        ) : output.kind === "snippet" ? (
          <div className="space-y-2">
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all font-mono text-xs">{output.stdout || "(no output)"}</pre>
            {output.stderr && (
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-xs text-destructive">{output.stderr}</pre>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {output.compileError ? (
              <div>
                <p className="font-medium text-destructive">The examples couldn't run</p>
                <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-xs">{output.compileError}</pre>
              </div>
            ) : (
              <p className="font-medium">
                {output.passedCount} of {output.total} examples passed
                {output.timedOut && <span className="ml-2 text-warning-strong">(timed out)</span>}
              </p>
            )}
            {output.outcomes.length > 0 && (
              <ul className="divide-y rounded-md border">
                {output.outcomes.map((outcome) => (
                  <li key={outcome.index} className="px-3 py-2">
                    <p className={cn("flex items-center gap-1.5 font-mono text-xs", outcome.passed ? "text-summit-strong" : "text-destructive")}>
                      {outcome.passed ? (
                        <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : output.timedOut && !outcome.actual ? (
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <CircleX className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      Example {outcome.index + 1}: {outcome.passed ? "passed" : "failed"}
                    </p>
                    {!outcome.passed && (
                      <dl className="mt-1 grid gap-x-3 gap-y-0.5 font-mono text-xs sm:grid-cols-[5rem_1fr]">
                        <dt className="text-muted-foreground">Expected</dt>
                        <dd className="break-all">{outcome.expected}</dd>
                        {outcome.actual !== undefined && (
                          <>
                            <dt className="text-muted-foreground">Actual</dt>
                            <dd className="break-all">{outcome.actual}</dd>
                          </>
                        )}
                        {outcome.error && (
                          <>
                            <dt className="text-muted-foreground">Error</dt>
                            <dd className="break-all text-destructive">{outcome.error}</dd>
                          </>
                        )}
                      </dl>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {output.logs && (
              <div>
                <p className="font-mono text-xs text-muted-foreground">Console</p>
                <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-xs">{output.logs}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
