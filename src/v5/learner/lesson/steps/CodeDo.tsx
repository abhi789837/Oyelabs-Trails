import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, CircleX, CloudUpload, Play, RotateCcw, Unlock } from "lucide-react";

import type { CodeAttemptResult, ServedCodeChallenge, ServedTopic } from "@shared/content";
import type { RunChecksResponse } from "@shared/lessonCore";
import { SOLUTION_MIN_ATTEMPTS, codeHints, type LessonFacts, type SolutionResponse } from "@shared/lessonCore";
import { ERROR_CODES } from "@shared/apiCodes";

import { ApiRequestError } from "@/api/client";
import { CodeBlock } from "@/components/content/markdownCore";
import { CodeEditor } from "@/components/challenge/CodeEditor";
import { RequestReview } from "@/components/challenge/RequestReview";
import { useAuth } from "@/features/auth/AuthProvider";
import { submitAttempt } from "@/features/challenge/api";
import { useProgressStore } from "@/store/progressStore";
import { cn } from "@/v5/design/cn";
import { Button } from "@/v5/design/components/Button";
import { HintLadder } from "@/v5/design/components/Learning";
import { FeedbackPanel, StatusLine } from "@/v5/design/components/Lesson";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/v5/design/components/Primitives";
import { SplitView } from "@/v5/design/components/SplitView";

import { lessonApi } from "../api";
import { LessonMarkdown } from "../LessonRich";

interface CheckRow {
  description: string;
  passed: boolean;
  extra: boolean;
  hidden: boolean;
  expected?: string;
  actual?: string;
  error?: string;
}

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
    // storage unavailable
  }
}

export interface CodeDoProps {
  topic: ServedTopic;
  challenge: ServedCodeChallenge;
  facts: LessonFacts;
  /** A check was graded on the server (it counts as an attempt). */
  onChecked: (result: CodeAttemptResult) => void;
  onSolutionTraded: () => void;
  onCodeChange: (code: string) => void;
}

/**
 * The coding Do step: instructions and the hint ladder on the left, the editor, checks and console
 * on the right (tabs on a phone). **Run** tries the visible checks (in the server sandbox) and costs
 * nothing; **Check** runs every check on the server and counts as an attempt. Results are split
 * into "main checks" and "extra checks" (the v4.4 wording) with what was expected and what came back.
 */
export default function CodeDo({ topic, challenge, facts, onChecked, onSolutionTraded, onCodeChange }: CodeDoProps) {
  const { user } = useAuth();
  const applyAttempt = useProgressStore((s) => s.applyAttempt);
  // The same draft key as the topic page, so a draft follows the learner between designs.
  const draftKey = `oyelabs-draft:${user?.id ?? "anon"}:${topic.id}`;
  const [code, setCode] = useState(() => readDraft(draftKey) ?? challenge.starterCode);
  const [local, setLocal] = useState<RunChecksResponse | null>(null);
  const [graded, setGraded] = useState<CodeAttemptResult | null>(null);
  const [busy, setBusy] = useState<"run" | "check" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [solution, setSolution] = useState<SolutionResponse | null>(null);
  const [confirmTrade, setConfirmTrade] = useState(false);
  const [solutionBusy, setSolutionBusy] = useState(false);
  const [tab, setTab] = useState("checks");
  const [consoleOut, setConsoleOut] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    writeDraft(draftKey, code === challenge.starterCode ? null : code);
    onCodeChange(code);
  }, [draftKey, code, challenge.starterCode, onCodeChange]);

  const rows: CheckRow[] = useMemo(() => {
    if (graded) {
      return graded.results.map((r) => ({ description: r.description, passed: r.passed, extra: Boolean(r.isEdgeCase), hidden: r.hidden, expected: r.expected, actual: r.actual, error: r.error }));
    }
    if (local) {
      return local.results.map((r) => ({ description: r.description, passed: r.passed, extra: r.isEdgeCase, hidden: false, expected: r.expected, actual: r.actual, error: r.error }));
    }
    return [];
  }, [graded, local]);

  const firstFailing = rows.find((r) => !r.passed && !r.hidden)?.description ?? null;
  const hints = useMemo(
    () =>
      codeHints({
        instructions: challenge.instructions,
        starterCode: challenge.starterCode,
        functionName: challenge.functionName,
        summary: topic.summary,
        checks: challenge.visibleTests,
        firstFailing,
      }),
    [challenge, topic.summary, firstFailing],
  );

  const run = async () => {
    setBusy("run");
    setError(null);
    try {
      // The console shows what the code prints while it handles the first check.
      const first = challenge.visibleTests[0];
      const probe = first ? `${code}\nconsole.log(${JSON.stringify(`Result for "${first.description}":`)}, ${challenge.functionName}(...${JSON.stringify(first.args)}));` : code;
      const [checks, printed] = await Promise.all([lessonApi.runChecks(topic.id, code), lessonApi.runSnippet(topic.id, probe).catch(() => null)]);
      setLocal(checks);
      setConsoleOut(printed ? [printed.stdout, printed.stderr].filter(Boolean).join("\n") || "Nothing was printed." : null);
      setGraded(null);
      setTab("checks");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "We couldn't run your code. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const check = async () => {
    setBusy("check");
    setError(null);
    try {
      const result = await submitAttempt(topic.id, { kind: "code", code });
      if (result.kind !== "code") throw new Error("unexpected");
      setGraded(result);
      setLocal(null);
      setTab("checks");
      applyAttempt(topic.id, result);
      onChecked(result);
      requestAnimationFrame(() => resultRef.current?.focus({ preventScroll: false }));
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === ERROR_CODES.VIDEOS_UNWATCHED) setError(err.message);
      else setError(err instanceof ApiRequestError ? err.message : "We couldn't check your code. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const free = facts.codeAttempts >= SOLUTION_MIN_ATTEMPTS || facts.codePassed || facts.solutionTraded;
  const getSolution = async (trade: boolean) => {
    setSolutionBusy(true);
    try {
      const res = await lessonApi.solution(topic.id, trade);
      setSolution(res);
      if (trade && res.traded) onSolutionTraded();
    } catch (err) {
      setSolution({ code: null, explanation: null, message: err instanceof ApiRequestError ? err.message : "We couldn't load the solution. Try again.", traded: false });
    } finally {
      setSolutionBusy(false);
      setConfirmTrade(false);
    }
  };

  const main = rows.filter((r) => !r.extra);
  const extra = rows.filter((r) => r.extra);
  const mainPass = main.length > 0 && main.every((r) => r.passed);
  const verdict: "pass" | "almost" | "fail" | null = graded ? (graded.passed ? "pass" : mainPass ? "almost" : "fail") : local ? (local.passedCount === local.total && !local.compileError ? "pass" : mainPass ? "almost" : "fail") : null;

  const left = (
    <div className="flex flex-col gap-5 p-4">
      <section aria-labelledby="do-task">
        <h2 id="do-task" className="font-display text-h4 font-semibold text-fg-1">
          Your task
        </h2>
        <LessonMarkdown text={challenge.instructions} className="mt-2 text-small text-fg-1" />
        <p className="mt-3 text-caption text-fg-2">
          {challenge.visibleTests.length} checks you can run here
          {challenge.hiddenTestCount ? `, plus ${challenge.hiddenTestCount} more when you press Check` : ""}. Checks so far: {facts.codeAttempts}.
        </p>
      </section>

      <section aria-labelledby="do-hints">
        <h2 id="do-hints" className="font-display text-h4 font-semibold text-fg-1">
          Stuck? Climb the hints
        </h2>
        <HintLadder
          className="mt-2"
          attempts={facts.codeAttempts}
          revealed={revealed}
          onReveal={setRevealed}
          hints={{
            nudge: hints.nudge,
            concept: hints.concept,
            partial: <CodeBlock code={hints.partial} lang="js" />,
          }}
        />
      </section>

      <section aria-labelledby="do-solution" className="rounded-card border border-line-1 bg-surface-1 p-3">
        <h2 id="do-solution" className="font-display text-small font-semibold text-fg-1">
          The full solution
        </h2>
        {solution ? (
          solution.code ? (
            <div className="mt-2 flex flex-col gap-2">
              <CodeBlock code={solution.code} lang="js" />
              {solution.explanation ? <p className="text-small text-fg-1">{solution.explanation}</p> : null}
            </div>
          ) : (
            <p className="mt-2 text-small text-fg-2" role="status">
              {solution.message}
            </p>
          )
        ) : free ? (
          <div className="mt-2">
            <Button size="sm" onClick={() => void getSolution(false)} loading={solutionBusy}>
              <Unlock aria-hidden="true" /> Show the solution
            </Button>
          </div>
        ) : confirmTrade ? (
          <div className="mt-2 flex flex-col gap-2">
            <p className="text-small text-fg-1">Seeing it before your {SOLUTION_MIN_ATTEMPTS === 3 ? "third" : `${SOLUTION_MIN_ATTEMPTS}th`} check halves the points for this step (5 instead of 10).</p>
            <div className="flex gap-2">
              <Button size="sm" variant="primary" onClick={() => void getSolution(true)} loading={solutionBusy}>
                Yes, show it for half the points
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmTrade(false)}>
                Keep trying
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-2 flex flex-col gap-1">
            <p className="text-small text-fg-2">
              It opens after {SOLUTION_MIN_ATTEMPTS} checks ({Math.min(facts.codeAttempts, SOLUTION_MIN_ATTEMPTS)} of {SOLUTION_MIN_ATTEMPTS} so far).
            </p>
            <div>
              <Button size="sm" variant="ghost" onClick={() => setConfirmTrade(true)}>
                See it now instead
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );

  const right = (
    <div className="flex flex-col gap-3 p-4">
      {/* The editor's line numbers are decoration; raise them to AA contrast inside v5. */}
      <div className="[&_div[aria-hidden=true]]:text-editor-foreground/70">
        <CodeEditor value={code} onChange={setCode} fileName={`${challenge.functionName}.js`} describedBy="do-editor-help" />
      </div>
      <p id="do-editor-help" className="text-caption text-fg-2">
        Tab adds two spaces. Press Esc, then Tab, to leave the editor. Your code is saved in this browser as you type.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => void run()} loading={busy === "run"} disabled={busy !== null}>
          <Play aria-hidden="true" /> Run
        </Button>
        <Button variant="primary" onClick={() => void check()} loading={busy === "check"} disabled={busy !== null}>
          <CloudUpload aria-hidden="true" /> Check
        </Button>
        <Button
          variant="ghost"
          disabled={busy !== null || code === challenge.starterCode}
          onClick={() => {
            setCode(challenge.starterCode);
            setLocal(null);
            setGraded(null);
          }}
        >
          <RotateCcw aria-hidden="true" /> Start again
        </Button>
      </div>
      <p className="text-caption text-fg-2">Run tries the checks you can see and costs nothing. Check runs every check and counts as a try.</p>
      {error ? <StatusLine tone="warning">{error}</StatusLine> : null}

      {verdict ? (
        <div ref={resultRef} tabIndex={-1} className="flex flex-col gap-3 outline-none">
          <FeedbackPanel
            verdict={verdict}
            right={[
              ...(main.length ? [`${main.filter((r) => r.passed).length} of ${main.length} main checks pass`] : []),
              ...(extra.length ? [`${extra.filter((r) => r.passed).length} of ${extra.length} extra checks pass`] : []),
            ]}
            fix={[
              ...(graded?.compileError || local?.compileError ? [`Your code didn't run: ${graded?.compileError ?? local?.compileError}`] : []),
              ...(graded?.timedOut || local?.timedOut ? ["It took too long. Look for a loop that never ends."] : []),
              ...rows.filter((r) => !r.passed).slice(0, 3).map((r) => (r.hidden ? `A hidden check failed: ${r.description}` : r.description)),
            ]}
            why={verdict === "pass" ? (graded ? "Every check passes. Nice work." : "The checks you can see pass. Press Check to run the rest.") : hints.nudge}
            action={!graded?.passed && graded?.attemptId && !graded.compileError ? <RequestReview source="topic_item" refId={topic.id} attemptId={graded.attemptId} /> : undefined}
          />
          {graded?.notes?.length ? (
            <StatusLine tone="info">
              Worth a look: {graded.notes.join(" ")}
            </StatusLine>
          ) : null}
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="checks">Checks</TabsTrigger>
              <TabsTrigger value="console">Console</TabsTrigger>
            </TabsList>
            <TabsContent value="checks">
              <CheckGroup title="Main checks" rows={main} />
              <CheckGroup title="Extra checks" rows={extra} note="Edge cases: empty input, very large input and other unusual values." />
            </TabsContent>
            <TabsContent value="console">
              <pre role="log" tabIndex={0} className="max-h-60 overflow-auto rounded-control bg-sunken p-3 font-mono text-small text-fg-1">
                {consoleOut ?? "Press Run to see what your code prints for the first check."}
              </pre>
            </TabsContent>
          </Tabs>
        </div>
      ) : null}
    </div>
  );

  return <SplitView id="v5-lesson-do" left={left} right={right} leftLabel="Task and hints" rightLabel="Editor and checks" className="min-h-[32rem]" />;
}

function CheckGroup({ title, rows, note }: { title: string; rows: CheckRow[]; note?: string }) {
  if (!rows.length) return null;
  return (
    <section aria-label={title} className="mt-3">
      <h3 className="text-small font-semibold text-fg-1">
        {title} <span className="font-normal text-fg-2">({rows.filter((r) => r.passed).length} of {rows.length} pass)</span>
      </h3>
      {note ? <p className="text-caption text-fg-2">{note}</p> : null}
      <ul className="mt-2 flex flex-col divide-y divide-line-1 rounded-card border border-line-1" data-testid={`checks-${title.toLowerCase().replace(/\s+/g, "-")}`}>
        {rows.map((r, i) => (
          <li key={i} className="px-3 py-2">
            <p className="flex items-start gap-2 text-small text-fg-1">
              {r.passed ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-fg" aria-hidden="true" /> : <CircleX className="mt-0.5 size-4 shrink-0 text-danger-fg" aria-hidden="true" />}
              <span className="sr-only">{r.passed ? "Passed:" : "Not yet:"}</span>
              <span>
                {r.description}
                {r.hidden ? <span className="ml-2 text-caption text-fg-2">(hidden)</span> : null}
              </span>
            </p>
            {!r.passed && !r.hidden && (r.expected !== undefined || r.actual !== undefined || r.error) ? (
              <dl className={cn("ml-6 mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 overflow-x-auto font-mono text-caption")}>
                {r.expected !== undefined ? (
                  <>
                    <dt className="text-fg-2">Expected</dt>
                    <dd className="break-all text-fg-1">{r.expected}</dd>
                  </>
                ) : null}
                {r.error ? (
                  <>
                    <dt className="text-fg-2">Error</dt>
                    <dd className="break-all text-danger-fg">{r.error}</dd>
                  </>
                ) : r.actual !== undefined ? (
                  <>
                    <dt className="text-fg-2">Got</dt>
                    <dd className="break-all text-danger-fg">{r.actual}</dd>
                  </>
                ) : null}
              </dl>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
