import { useEffect, useRef, useState } from "react";
import { Check, CloudUpload, Eye, EyeOff, LoaderCircle, Play, TriangleAlert, X } from "lucide-react";

import type { CodeAttemptResult, ServedCodeChallenge, ServedTopic } from "@shared/content";

import { ApiRequestError } from "@/api/client";
import { RichText } from "@/components/content/RichText";
import { FormAlert } from "@/components/form/Field";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthProvider";
import { submitAttempt } from "@/features/challenge/api";
import { runVisibleTests, RUN_TIMEOUT_MS, type LocalRunOutcome } from "@/lib/codeRunner";
import { cn, preferredScrollBehavior } from "@/lib/utils";
import { useProgressStore } from "@/store/progressStore";
import { ChallengeResult } from "./ChallengeResult";
import { CodeEditor } from "./CodeEditor";

interface CodeRunnerProps {
  topic: ServedTopic;
  challenge: ServedCodeChallenge;
}

// Drafts are a per-browser convenience, so storage failures are ignored.
function readDraft(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeDraft(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

/**
 * The coding challenge.
 *
 * Two steps, for two different jobs (brief §7.5):
 *
 * - **Run tests** executes the *visible* tests in a Web Worker here in the browser. It is instant
 *   and free, which is what you want while iterating.
 * - **Submit** sends the code to the server, which runs every test — visible and hidden — inside
 *   an isolated V8 and decides whether the topic is complete. The hidden tests never reach the
 *   browser, so passing the visible ones is not enough.
 */
export function CodeRunner({ topic, challenge }: CodeRunnerProps) {
  const { user } = useAuth();
  const applyAttempt = useProgressStore((s) => s.applyAttempt);

  // Keyed by user: a shared machine must not show one person's draft to the next.
  const draftKey = `oyelabs-draft:${user?.id ?? "anon"}:${topic.id}`;
  const [code, setCode] = useState(() => readDraft(draftKey) ?? challenge.starterCode);
  const [localRun, setLocalRun] = useState<LocalRunOutcome | null>(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CodeAttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const helpId = `${topic.id}-editor-help`;

  useEffect(() => {
    writeDraft(draftKey, code === challenge.starterCode ? null : code);
  }, [draftKey, code, challenge.starterCode]);

  const totalTests = challenge.visibleTests.length + challenge.hiddenTestCount;

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    try {
      setLocalRun(await runVisibleTests(code, challenge));
      setResult(null);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const graded = await submitAttempt(topic.id, { kind: "code", code });
      if (graded.kind !== "code") throw new Error("The server graded this as a quiz.");
      setResult(graded);
      setLocalRun(null);
      applyAttempt(topic.id, graded);
      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: preferredScrollBehavior(), block: "nearest" });
        resultRef.current?.focus({ preventScroll: true });
      });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Your code couldn't be submitted. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetCode = () => {
    if (code !== challenge.starterCode && !window.confirm("Replace your code with the original starter code?")) return;
    setCode(challenge.starterCode);
    setLocalRun(null);
    setResult(null);
  };

  const backToEditor = () => {
    editorRef.current?.scrollIntoView({ behavior: preferredScrollBehavior(), block: "center" });
    editorRef.current?.focus({ preventScroll: true });
  };

  const busy = running || submitting;

  return (
    <div>
      <RichText text={challenge.instructions} className="max-w-prose" />

      <div className="mt-6">
        <CodeEditor
          ref={editorRef}
          value={code}
          onChange={setCode}
          describedBy={helpId}
          fileName={`${challenge.functionName}.js`}
        />
        <p id={helpId} className="mt-2 text-xs text-muted-foreground">
          Tab inserts two spaces. Press Esc, then Tab, to move focus out of the editor. Your code is saved in this
          browser as you type.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => void handleRun()} disabled={busy}>
          {running ? <LoaderCircle className="animate-spin" /> : <Play />}
          {running ? "Running" : `Run ${challenge.visibleTests.length} visible tests`}
        </Button>
        <Button onClick={() => void handleSubmit()} disabled={busy}>
          {submitting ? <LoaderCircle className="animate-spin" /> : <CloudUpload />}
          {submitting ? "Submitting" : "Submit for grading"}
        </Button>
        <Button variant="ghost" onClick={handleResetCode} disabled={busy || code === challenge.starterCode}>
          Reset to starter code
        </Button>
      </div>

      <p className="mt-2 font-mono text-xs text-muted-foreground">
        {challenge.hiddenTestCount > 0
          ? `${totalTests} tests: ${challenge.visibleTests.length} you can run here, ${challenge.hiddenTestCount} hidden. All of them must pass.`
          : `${totalTests} tests, all of which must pass. ${RUN_TIMEOUT_MS / 1000}s limit.`}
      </p>

      {error && <div className="mt-6"><FormAlert>{error}</FormAlert></div>}

      {localRun && (
        <section aria-label="Visible test results" className="mt-8">
          <h3 className="text-sm font-semibold">Visible tests</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Run in your browser. {challenge.hiddenTestCount > 0 && "Submit to run the hidden tests too."}
          </p>
          {localRun.compileError && <CompileError message={localRun.compileError} />}
          <ul className="mt-3 divide-y rounded-md border">
            {localRun.results.map((r, index) => (
              <li key={index} className="px-4 py-3">
                <TestRow passed={r.passed} description={r.description} isEdgeCase={challenge.visibleTests[index]?.isEdgeCase} />
                {!r.passed && <Failure expected={r.expected} actual={r.actual} error={r.error} />}
              </li>
            ))}
          </ul>
        </section>
      )}

      {result && (
        <div className="mt-8 space-y-6">
          <section aria-label="Grading results">
            <h3 className="text-sm font-semibold">Graded on the server</h3>
            {result.compileError && <CompileError message={result.compileError} />}
            {result.timedOut && <CompileError message="Your code timed out. Look for an infinite loop." />}

            <ul className="mt-3 divide-y rounded-md border">
              {result.results
                .filter((r) => !r.hidden || showHidden || !r.passed)
                .map((r, index) => (
                  <li key={index} className="px-4 py-3">
                    <TestRow passed={r.passed} description={r.description} isEdgeCase={r.isEdgeCase} hidden={r.hidden} />
                    {!r.passed && !r.hidden && <Failure expected={r.expected} actual={r.actual} error={r.error} />}
                    {!r.passed && r.hidden && (
                      <p className="ml-8 mt-2 text-xs text-muted-foreground">
                        Hidden tests don't show their input, so the answer can't be worked backwards. Re-read the
                        requirements and think about the cases the visible tests don't cover.
                      </p>
                    )}
                  </li>
                ))}
            </ul>

            {result.results.some((r) => r.hidden && r.passed) && (
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowHidden((v) => !v)}>
                {showHidden ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                {showHidden ? "Hide passing hidden tests" : `Show all ${result.total} tests`}
              </Button>
            )}
          </section>

          <ChallengeResult
            ref={resultRef}
            topic={topic}
            passed={result.passed}
            score={result.score}
            detail={`${result.passedCount} of ${result.total} tests passed`}
            retryLabel="Back to the editor"
            onRetry={backToEditor}
          />
        </div>
      )}
    </div>
  );
}

function CompileError({ message }: { message: string }) {
  return (
    <div className="mt-3 flex gap-3 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
      <div>
        <p className="font-medium">Your code didn't run</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

function TestRow({
  passed,
  description,
  isEdgeCase,
  hidden,
}: {
  passed: boolean;
  description: string;
  isEdgeCase?: boolean;
  hidden?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
          passed ? "bg-summit text-summit-foreground" : "bg-destructive/15 text-destructive",
        )}
      >
        {passed ? (
          <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden="true" />
        ) : (
          <X className="h-3 w-3" strokeWidth={3.5} aria-hidden="true" />
        )}
        <span className="sr-only">{passed ? "Passed:" : "Failed:"}</span>
      </span>
      <span className="text-sm">
        {description}
        {isEdgeCase && (
          <span className="ml-2 rounded-sm border border-trailmark/40 px-1.5 py-px font-mono text-[11px] text-trailmark-strong">
            Edge case
          </span>
        )}
        {hidden && (
          <span className="ml-2 rounded-sm border border-basalt/40 px-1.5 py-px font-mono text-[11px] text-muted-foreground">
            Hidden
          </span>
        )}
      </span>
    </div>
  );
}

function Failure({ expected, actual, error }: { expected?: string; actual?: string; error?: string }) {
  return (
    <dl className="ml-8 mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 overflow-x-auto font-mono text-xs">
      {expected !== undefined && (
        <>
          <dt className="text-muted-foreground">Expected</dt>
          <dd className="whitespace-pre-wrap break-all">{expected}</dd>
        </>
      )}
      {error ? (
        <>
          <dt className="text-muted-foreground">Error</dt>
          <dd className="whitespace-pre-wrap break-all text-destructive">{error}</dd>
        </>
      ) : actual !== undefined ? (
        <>
          <dt className="text-muted-foreground">Received</dt>
          <dd className="whitespace-pre-wrap break-all text-destructive">{actual}</dd>
        </>
      ) : null}
    </dl>
  );
}
