import { useEffect, useRef, useState } from "react";
import { Check, LoaderCircle, Play, TriangleAlert, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { runCodeChallenge, RUN_TIMEOUT_MS, type RunOutcome } from "@/lib/codeRunner";
import { cn, preferredScrollBehavior } from "@/lib/utils";
import { useProgressStore } from "@/store/progressStore";
import type { CodeChallenge, Topic } from "@/types/curriculum";
import { ChallengeResult } from "./ChallengeResult";
import { CodeEditor } from "./CodeEditor";
import { RichText } from "./RichText";

interface CodeRunnerProps {
  topic: Topic;
  challenge: CodeChallenge;
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

export function CodeRunner({ topic, challenge }: CodeRunnerProps) {
  const recordAttempt = useProgressStore((s) => s.recordAttempt);
  const draftKey = `oyelabs-draft:${topic.id}`;
  const [code, setCode] = useState(() => readDraft(draftKey) ?? challenge.starterCode);
  const [running, setRunning] = useState(false);
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const helpId = `${topic.id}-editor-help`;

  useEffect(() => {
    writeDraft(draftKey, code === challenge.starterCode ? null : code);
  }, [draftKey, code, challenge.starterCode]);

  const handleRun = async () => {
    setRunning(true);
    const result = await runCodeChallenge(code, challenge);
    setOutcome(result);
    setRunning(false);
    recordAttempt(topic.id, result.passedCount === result.total, result.score);
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: preferredScrollBehavior(), block: "nearest" });
      resultRef.current?.focus({ preventScroll: true });
    });
  };

  const handleResetCode = () => {
    if (code !== challenge.starterCode && !window.confirm("Replace your code with the original starter code?")) return;
    setCode(challenge.starterCode);
    setOutcome(null);
  };

  const backToEditor = () => {
    editorRef.current?.scrollIntoView({ behavior: preferredScrollBehavior(), block: "center" });
    editorRef.current?.focus({ preventScroll: true });
  };

  const passed = outcome !== null && outcome.passedCount === outcome.total;

  return (
    <div>
      <RichText text={challenge.instructions} />

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
        <Button onClick={handleRun} disabled={running}>
          {running ? <LoaderCircle className="animate-spin" /> : <Play />}
          {running ? "Running tests" : "Run tests"}
        </Button>
        <Button variant="ghost" onClick={handleResetCode} disabled={running || code === challenge.starterCode}>
          Reset to starter code
        </Button>
        <span className="font-mono text-xs text-muted-foreground">
          {challenge.testCases.length} tests, {RUN_TIMEOUT_MS / 1000}s limit
        </span>
      </div>

      {outcome && (
        <div className="mt-8 space-y-6">
          <section aria-label="Test results">
            {outcome.compileError && (
              <div className="mb-4 flex gap-3 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                <div>
                  <p className="font-medium">Your code didn't run</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{outcome.compileError}</p>
                </div>
              </div>
            )}
            <ul className="divide-y rounded-md border">
              {outcome.results.map((r) => (
                <li key={r.index} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                        r.passed ? "bg-summit text-summit-foreground" : "bg-destructive/15 text-destructive",
                      )}
                    >
                      {r.passed ? (
                        <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden="true" />
                      ) : (
                        <X className="h-3 w-3" strokeWidth={3.5} aria-hidden="true" />
                      )}
                      <span className="sr-only">{r.passed ? "Passed:" : "Failed:"}</span>
                    </span>
                    <span className="text-sm">{r.description}</span>
                  </div>
                  {!r.passed && (
                    <dl className="ml-8 mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 overflow-x-auto font-mono text-xs">
                      <dt className="text-muted-foreground">Expected</dt>
                      <dd className="whitespace-pre-wrap break-all">{r.expected}</dd>
                      {r.error ? (
                        <>
                          <dt className="text-muted-foreground">Error</dt>
                          <dd className="whitespace-pre-wrap break-all text-destructive">{r.error}</dd>
                        </>
                      ) : (
                        <>
                          <dt className="text-muted-foreground">Received</dt>
                          <dd className="whitespace-pre-wrap break-all text-destructive">{r.actual}</dd>
                        </>
                      )}
                    </dl>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <ChallengeResult
            ref={resultRef}
            topic={topic}
            passed={passed}
            score={outcome.score}
            detail={`${outcome.passedCount} of ${outcome.total} tests passed`}
            retryLabel="Back to the editor"
            onRetry={backToEditor}
          />
        </div>
      )}
    </div>
  );
}
