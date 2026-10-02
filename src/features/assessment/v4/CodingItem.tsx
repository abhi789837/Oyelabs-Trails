import { useState } from "react";
import { Play } from "lucide-react";

import type { CodingSheetItem } from "@shared/assessmentV4";

import { CodeEditorMonaco, LANGUAGE_LABELS } from "@/components/editor/CodeEditorMonaco";
import { Button } from "@/components/ui/button";
import { runBrowserTests } from "@/lib/codeRunner";

import { OutputPanel, SampleTests, type RunOutput } from "./OutputPanel";
import type { ItemComponentProps } from "./types";
import { useRun } from "./useRun";

/**
 * A coding question: the editor directly under the problem, the sample tests as "Expected", Run
 * (three per question, counted by the server — the third submits), and an output panel.
 */
export function CodingItem({ assessmentId, item, response, onResponse, onFlush, onItemUpdate, onConflict }: ItemComponentProps<CodingSheetItem>) {
  const locked = item.state === "submitted";
  const initial = response && "code" in response ? response.code : item.draft && "code" in item.draft ? item.draft.code : item.starterCode;
  const [code, setCode] = useState(initial);
  const [notice, setNotice] = useState<string | null>(null);

  const { run, running, output, error, runsLeft } = useRun({
    assessmentId,
    itemId: item.id,
    runsUsed: item.runsUsed,
    onConflict,
    onCounted: (result) => {
      onItemUpdate({ runsUsed: result.runsUsed, ...(result.autoSubmitted ? { state: "submitted", draft: { code } } : {}) });
      if (result.autoSubmitted) setNotice("That was your third run, so this answer has been submitted as it stands.");
    },
    runLocally: async (source): Promise<RunOutput> => {
      const tests = item.sampleTests.filter((t): t is { args: unknown[]; expected: unknown } => "args" in t);
      const outcome = await runBrowserTests(source, {
        functionName: item.functionName ?? "solution",
        tests,
        language: item.language === "typescript" ? "typescript" : "javascript",
      });
      return {
        kind: "tests",
        outcomes: outcome.results.map((r) => ({ index: r.index, passed: r.passed, expected: r.expected, actual: r.actual, error: r.error })),
        passedCount: outcome.passedCount,
        total: outcome.total,
        compileError: outcome.compileError,
        timedOut: outcome.timedOut,
        logs: outcome.logs,
      };
    },
  });

  const change = (next: string) => {
    setCode(next);
    onResponse(next === item.starterCode ? null : { code: next });
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs text-muted-foreground">
            {LANGUAGE_LABELS[item.language]}
            {item.mode === "function" && item.functionName ? `, function ${item.functionName}()` : item.mode === "program" ? ", reads input and prints output" : item.mode === "sql" ? ", one query" : ""}
          </p>
          <p className="font-mono text-xs text-muted-foreground">Tab indents. Press Ctrl+M, then Tab, to move focus out.</p>
        </div>
        <CodeEditorMonaco
          value={code}
          onChange={change}
          onBlur={onFlush}
          language={item.language}
          readOnly={locked}
          ariaLabel={`Code editor, ${LANGUAGE_LABELS[item.language]}`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => void run(code)} loading={running} disabled={locked || runsLeft === 0}>
          <Play aria-hidden="true" />
          {runsLeft === 1 ? "Run and submit" : "Run"}
        </Button>
        <span className="font-mono text-xs text-muted-foreground" aria-live="polite">
          Runs left: {runsLeft}
          {!locked && runsLeft === 1 && " — the last run submits this answer"}
        </span>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {notice && (
        <p role="status" className="rounded-md border border-summit/40 bg-summit/[0.06] px-3 py-2 text-sm">
          {notice}
        </p>
      )}

      <OutputPanel output={output} running={running} />
      <SampleTests tests={item.sampleTests} functionName={item.functionName} />
    </div>
  );
}
