import { useEffect, useState } from "react";
import { Play } from "lucide-react";

import type { McqSheetItem } from "@shared/assessmentV4";

import { CodeEditorMonaco, LANGUAGE_LABELS } from "@/components/editor/CodeEditorMonaco";
import { ChoiceCard } from "@/components/tasks/ChoiceCard";
import { Button } from "@/components/ui/button";
import { runBrowserSnippet } from "@/lib/codeRunner";

import { isTypingTarget } from "./clock";
import { OutputPanel } from "./OutputPanel";
import type { ItemComponentProps } from "./types";
import { useRun } from "./useRun";

const MAX_SHORTCUTS = 6;

/**
 * A multiple-choice question. Options are large radio cards; number keys 1–6 pick one when nobody is
 * typing. A code snippet, when there is one, is editable and runnable (the same three-run counter as
 * coding) — running it never submits the question.
 */
export function McqItem({ assessmentId, item, response, onResponse, onItemUpdate, onConflict }: ItemComponentProps<McqSheetItem>) {
  const locked = item.state === "submitted";
  const choice = response && "choice" in response ? response.choice : null;
  const [snippet, setSnippet] = useState(item.snippet ?? "");

  const { run, running, output, error, runsLeft } = useRun({
    assessmentId,
    itemId: item.id,
    runsUsed: item.runsUsed,
    onConflict,
    onCounted: (result) => onItemUpdate({ runsUsed: result.runsUsed }),
    runLocally: async (source) => ({
      kind: "snippet",
      ...(await runBrowserSnippet(source, item.snippetLanguage === "typescript" ? "typescript" : "javascript")),
    }),
  });

  useEffect(() => {
    if (locked) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target as HTMLElement | null)) return;
      const position = Number(event.key) - 1;
      if (!Number.isInteger(position) || position < 0 || position >= Math.min(item.options.length, MAX_SHORTCUTS)) return;
      event.preventDefault();
      onResponse({ choice: position });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [item.options.length, locked, onResponse]);

  return (
    <div className="space-y-6">
      {item.snippet !== null && item.snippetLanguage && (
        <div className="space-y-3">
          <p className="font-mono text-xs text-muted-foreground">
            {LANGUAGE_LABELS[item.snippetLanguage]} snippet. You can edit it and run it; running never submits your answer.
          </p>
          <CodeEditorMonaco
            value={snippet}
            onChange={setSnippet}
            language={item.snippetLanguage}
            readOnly={locked}
            minHeight={160}
            maxHeight={420}
            ariaLabel={`Code snippet, ${LANGUAGE_LABELS[item.snippetLanguage]}`}
          />
          {item.runsOn && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" onClick={() => void run(snippet)} loading={running} disabled={locked || runsLeft === 0}>
                  <Play aria-hidden="true" />
                  Run
                </Button>
                <span className="font-mono text-xs text-muted-foreground" aria-live="polite">
                  Runs left: {runsLeft}
                </span>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <OutputPanel output={output} running={running} />
            </>
          )}
        </div>
      )}

      <fieldset>
        <legend className="mb-3 font-mono text-xs text-muted-foreground">Choose one. Press its number to pick it.</legend>
        <div className="space-y-2">
          {item.options.map((option, index) => (
            <ChoiceCard
              key={index}
              name={`${item.id}-choice`}
              id={`${item.id}-choice-${index}`}
              checked={choice === index}
              disabled={locked}
              shortcut={index < MAX_SHORTCUTS ? index + 1 : undefined}
              text={option}
              onSelect={() => onResponse({ choice: index })}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
